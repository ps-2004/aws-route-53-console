
import math
import random
import string
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, Query
from fastapi.responses import PlainTextResponse
from pydantic import BaseModel, Field
from sqlalchemy import func, or_
from sqlalchemy.orm import Session

from ..database import get_db
from ..models import HostedZone, Record
from ..schemas import (
    HostedZoneCreate,
    HostedZoneUpdate,
    HostedZoneResponse,
    HostedZonePaginationResponse,
    RecordCreate,
)

router = APIRouter(prefix="/hosted-zones", tags=["Hosted Zones"])

VALID_RECORD_TYPES = [
    "A", "AAAA", "CNAME", "TXT", "MX",
    "NS", "PTR", "SRV", "CAA", "SOA",
]


class ImportRecordsRequest(BaseModel):
    records: list[RecordCreate] = Field(..., min_length=1)


def generate_zone_id() -> str:
    chars = string.ascii_uppercase + string.digits
    return "Z" + "".join(random.choices(chars, k=13))


def find_hosted_zone(
    id_or_zone_id: str,
    db: Session,
) -> Optional[HostedZone]:
    if id_or_zone_id.isdigit():
        return (
            db.query(HostedZone)
            .filter(HostedZone.id == int(id_or_zone_id))
            .first()
        )

    return (
        db.query(HostedZone)
        .filter(HostedZone.zone_id == id_or_zone_id)
        .first()
    )


def hosted_zone_response(zone: HostedZone, db: Session) -> dict:
    record_count = (
        db.query(func.count(Record.id))
        .filter(Record.hosted_zone_id == zone.id)
        .scalar()
        or 0
    )

    return {
        "id": zone.id,
        "name": zone.name,
        "zone_id": zone.zone_id,
        "zone_type": zone.zone_type,
        "description": zone.description,
        "private_zone": zone.private_zone,
        "record_count": record_count,
        "created_at": zone.created_at,
        "updated_at": zone.updated_at,
    }


def get_zone_records(zone: HostedZone, db: Session) -> list[Record]:
    return (
        db.query(Record)
        .filter(Record.hosted_zone_id == zone.id)
        .order_by(Record.name, Record.type)
        .all()
    )



def normalize_record_name(name: str, zone_name: str) -> str:
    """Convert @ and relative names into fully qualified names."""
    name = name.strip().rstrip(".")
    zone_name = zone_name.strip().rstrip(".")

    if not name or name == "@":
        return zone_name

    if name == zone_name or name.endswith(f".{zone_name}"):
        return name

    return f"{name}.{zone_name}"



def record_to_export(record: Record) -> dict:
    return {
        "id": record.id,
        "name": record.name,
        "type": record.type,
        "ttl": record.ttl,
        "value": record.value,
        "priority": record.priority,
        "weight": record.weight,
        "port": record.port,
        "target": record.target,
        "flags": record.flags,
        "tag": record.tag,
        "routing_policy": record.routing_policy,
    }


def format_bind_value(record: Record) -> str:
    """Format a record value for a basic BIND zone-file export."""
    value = (record.value or "").strip()

    if record.type == "TXT":
        # Escape quotes and keep TXT content inside a quoted string.
        value = '"' + value.replace("\\", "\\\\").replace('"', '\\"') + '"'

    elif record.type == "MX":
        priority = record.priority if record.priority is not None else 10
        value = f"{priority} {value}"

    elif record.type == "SRV":
        priority = record.priority if record.priority is not None else 0
        weight = record.weight if record.weight is not None else 0
        port = record.port if record.port is not None else 0
        target = record.target or value
        value = f"{priority} {weight} {port} {target}"

    elif record.type == "CAA":
        flags = record.flags if record.flags is not None else 0
        tag = record.tag or "issue"
        value = f'{flags} {tag} "{value}"'

    return value


@router.get("", response_model=HostedZonePaginationResponse)
def list_hosted_zones(
    page: int = Query(1, ge=1),
    limit: int = Query(10, ge=1, le=100),
    search: Optional[str] = Query(None),
    db: Session = Depends(get_db),
):
    query = db.query(HostedZone)

    if search and search.strip():
        term = f"%{search.strip()}%"
        query = query.filter(
            or_(
                HostedZone.name.ilike(term),
                HostedZone.zone_id.ilike(term),
                HostedZone.description.ilike(term),
            )
        )

    total = query.count()
    total_pages = math.ceil(total / limit) if total > 0 else 1
    offset = (page - 1) * limit

    zones = (
        query.order_by(HostedZone.created_at.desc())
        .offset(offset)
        .limit(limit)
        .all()
    )

    return {
        "items": [hosted_zone_response(zone, db) for zone in zones],
        "page": page,
        "limit": limit,
        "total": total,
        "total_pages": total_pages,
    }


@router.post("", response_model=HostedZoneResponse, status_code=201)
def create_hosted_zone(
    payload: HostedZoneCreate,
    db: Session = Depends(get_db),
):
    name = payload.name.strip().lower().rstrip(".")

    if not name:
        raise HTTPException(
            status_code=422,
            detail="Hosted zone name cannot be empty",
        )

    existing = (
        db.query(HostedZone)
        .filter(HostedZone.name == name)
        .first()
    )

    if existing:
        raise HTTPException(
            status_code=400,
            detail=f"Hosted zone {name} already exists",
        )

    is_private = int(
        payload.private_zone or payload.zone_type == "Private"
    )
    zone_type = "Private" if is_private else "Public"

    new_zone = HostedZone(
        name=name,
        zone_id=generate_zone_id(),
        zone_type=zone_type,
        description=payload.description or "",
        private_zone=is_private,
    )

    try:
        db.add(new_zone)
        db.flush()

        ns_records = (
            f"ns-{random.randint(100, 999)}.awsdns-12.org.\n"
            f"ns-{random.randint(100, 999)}.awsdns-34.com.\n"
            f"ns-{random.randint(100, 999)}.awsdns-56.co.uk.\n"
            f"ns-{random.randint(100, 999)}.awsdns-78.net."
        )

        soa_record = (
            f"ns-{random.randint(100, 999)}.awsdns-12.org. "
            "awsdns-hostmaster.amazon.com. 1 7200 900 1209600 86400"
        )

        db.add_all([
            Record(
                hosted_zone_id=new_zone.id,
                name=name,
                type="NS",
                ttl=172800,
                value=ns_records,
                routing_policy="Simple",
            ),
            Record(
                hosted_zone_id=new_zone.id,
                name=name,
                type="SOA",
                ttl=900,
                value=soa_record,
                routing_policy="Simple",
            ),
        ])

        db.commit()
        db.refresh(new_zone)

    except Exception:
        db.rollback()
        raise

    return hosted_zone_response(new_zone, db)


@router.get(
    "/{id_or_zone_id}",
    response_model=HostedZoneResponse,
)
def get_hosted_zone(
    id_or_zone_id: str,
    db: Session = Depends(get_db),
):
    zone = find_hosted_zone(id_or_zone_id, db)

    if not zone:
        raise HTTPException(
            status_code=404,
            detail="Hosted zone not found",
        )

    return hosted_zone_response(zone, db)


@router.put(
    "/{id_or_zone_id}",
    response_model=HostedZoneResponse,
)
def update_hosted_zone(
    id_or_zone_id: str,
    payload: HostedZoneUpdate,
    db: Session = Depends(get_db),
):
    zone = find_hosted_zone(id_or_zone_id, db)

    if not zone:
        raise HTTPException(
            status_code=404,
            detail="Hosted zone not found",
        )

    if payload.description is not None:
        zone.description = payload.description

    if payload.zone_type is not None:
        zone.zone_type = payload.zone_type

    if payload.private_zone is not None:
        zone.private_zone = int(payload.private_zone)

    db.commit()
    db.refresh(zone)

    return hosted_zone_response(zone, db)


@router.delete("/{id_or_zone_id}")
def delete_hosted_zone(
    id_or_zone_id: str,
    db: Session = Depends(get_db),
):
    zone = find_hosted_zone(id_or_zone_id, db)

    if not zone:
        raise HTTPException(
            status_code=404,
            detail="Hosted zone not found",
        )

    zone_name = zone.name

    try:
        db.query(Record).filter(
            Record.hosted_zone_id == zone.id
        ).delete(synchronize_session=False)

        db.delete(zone)
        db.commit()

    except Exception:
        db.rollback()
        raise

    return {
        "success": True,
        "message": f"Hosted zone {zone_name} deleted successfully",
    }


@router.get("/{id_or_zone_id}/export")
def export_hosted_zone(
    id_or_zone_id: str,
    format: str = Query("json", pattern="^(json|bind)$"),
    db: Session = Depends(get_db),
):
    zone = find_hosted_zone(id_or_zone_id, db)

    if not zone:
        raise HTTPException(
            status_code=404,
            detail="Hosted zone not found",
        )

    records = get_zone_records(zone, db)

    if format == "json":
        return {
            "zone": {
                "id": zone.id,
                "name": zone.name,
                "zone_id": zone.zone_id,
                "zone_type": zone.zone_type,
                "description": zone.description,
                "private_zone": bool(zone.private_zone),
            },
            "records": [record_to_export(record) for record in records],
        }

    lines = [
        f"; BIND zone export for {zone.name}",
        f"$ORIGIN {zone.name.rstrip('.')}.",
        "$TTL 300",
    ]

    for record in records:
        owner = normalize_record_name(record.name, zone.name)
        ttl = record.ttl or 300
        record_type = record.type.upper()
        value = format_bind_value(record)

        if record_type == "NS" and "\n" in value:
            for nameserver in value.splitlines():
                nameserver = nameserver.strip()
                if nameserver:
                    lines.append(
                        f"{owner} {ttl} IN NS {nameserver}"
                    )
        else:
            lines.append(
                f"{owner} {ttl} IN {record_type} {value}"
            )

    return PlainTextResponse(
        content="\n".join(lines) + "\n",
        media_type="text/plain",
        headers={
            "Content-Disposition": (
                f'attachment; filename="{zone.name.rstrip(".")}.zone"'
            )
        },
    )


@router.post("/{id_or_zone_id}/import")
def import_records(
    id_or_zone_id: str,
    payload: ImportRecordsRequest,
    db: Session = Depends(get_db),
):
    zone = find_hosted_zone(id_or_zone_id, db)

    if not zone:
        raise HTTPException(
            status_code=404,
            detail="Hosted zone not found",
        )

    new_records = []

    # Validate every record before inserting any of them.
    for item in payload.records:
        record_type = item.type.upper().strip()

        if record_type not in VALID_RECORD_TYPES:
            raise HTTPException(
                status_code=422,
                detail=f"Invalid record type: {item.type}",
            )

        new_records.append(
            Record(
                hosted_zone_id=zone.id,
                name=normalize_record_name(item.name, zone.name),
                type=record_type,
                ttl=item.ttl or 300,
                value=item.value.strip(),
                priority=item.priority,
                weight=item.weight,
                port=item.port,
                target=item.target,
                flags=item.flags,
                tag=item.tag,
                routing_policy=item.routing_policy or "Simple",
            )
        )

    try:
        db.add_all(new_records)
        db.commit()

    except Exception:
        db.rollback()
        raise HTTPException(
            status_code=500,
            detail="Failed to import records",
        )

    imported_count = len(new_records)
    return {
        # Keep both the frontend contract and the existing test contract.
        "success": True,
        "count": imported_count,
        "imported_count": imported_count,
        "message": f"Successfully imported {imported_count} DNS record(s).",
        "records": [
            {
                "id": record.id,
                "name": record.name,
                "type": record.type,
                "ttl": record.ttl,
                "value": record.value,
            }
            for record in new_records
        ],
    }
