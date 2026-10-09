import math
from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from sqlalchemy import or_
from ..database import get_db
from ..models import HostedZone, Record
from ..schemas import (
    RecordCreate,
    RecordUpdate,
    RecordResponse,
    RecordPaginationResponse
)

router = APIRouter(tags=["DNS Records"])

VALID_RECORD_TYPES = ["A", "AAAA", "CNAME", "TXT", "MX", "NS", "PTR", "SRV", "CAA", "SOA"]

@router.get("/hosted-zones/{zone_id}/records", response_model=RecordPaginationResponse)
def list_zone_records(
    zone_id: str,
    page: int = Query(1, ge=1),
    limit: int = Query(10, ge=1, le=100),
    search: Optional[str] = Query(None),
    type: Optional[str] = Query(None),
    db: Session = Depends(get_db)
):
    if zone_id.isdigit():
        zone = db.query(HostedZone).filter(HostedZone.id == int(zone_id)).first()
    else:
        zone = db.query(HostedZone).filter(HostedZone.zone_id == zone_id).first()

    if not zone:
        raise HTTPException(status_code=404, detail="Hosted zone not found")

    query = db.query(Record).filter(Record.hosted_zone_id == zone.id)

    if type and type.upper() != "ALL":
        query = query.filter(Record.type == type.upper())

    if search and search.strip():
        term = f"%{search.strip()}%"
        query = query.filter(
            or_(
                Record.name.ilike(term),
                Record.value.ilike(term),
                Record.type.ilike(term)
            )
        )

    total = query.count()
    total_pages = math.ceil(total / limit) if total > 0 else 1
    offset = (page - 1) * limit
    records = query.order_by(Record.name.asc(), Record.type.asc()).offset(offset).limit(limit).all()

    return {
        "items": records,
        "page": page,
        "limit": limit,
        "total": total,
        "total_pages": total_pages
    }

@router.post("/hosted-zones/{zone_id}/records", response_model=RecordResponse, status_code=201)
def create_zone_record(zone_id: str, payload: RecordCreate, db: Session = Depends(get_db)):
    if zone_id.isdigit():
        zone = db.query(HostedZone).filter(HostedZone.id == int(zone_id)).first()
    else:
        zone = db.query(HostedZone).filter(HostedZone.zone_id == zone_id).first()

    if not zone:
        raise HTTPException(status_code=404, detail="Hosted zone not found")

    rec_type = payload.type.upper().strip()
    if rec_type not in VALID_RECORD_TYPES:
        raise HTTPException(status_code=422, detail=f"Invalid record type. Must be one of: {', '.join(VALID_RECORD_TYPES)}")

    name = payload.name.strip()
    if not name or name == "@":
        name = zone.name
    elif not name.endswith(zone.name):
        name = f"{name}.{zone.name}"

    record = Record(
        hosted_zone_id=zone.id,
        name=name,
        type=rec_type,
        ttl=payload.ttl or 300,
        value=payload.value.strip(),
        priority=payload.priority,
        weight=payload.weight,
        port=payload.port,
        target=payload.target,
        flags=payload.flags,
        tag=payload.tag,
        routing_policy=payload.routing_policy or "Simple"
    )
    db.add(record)
    db.commit()
    db.refresh(record)
    return record

@router.get("/records/{record_id}", response_model=RecordResponse)
def get_record(record_id: int, db: Session = Depends(get_db)):
    record = db.query(Record).filter(Record.id == record_id).first()
    if not record:
        raise HTTPException(status_code=404, detail="DNS record not found")
    return record

@router.put("/records/{record_id}", response_model=RecordResponse)
def update_record(record_id: int, payload: RecordUpdate, db: Session = Depends(get_db)):
    record = db.query(Record).filter(Record.id == record_id).first()
    if not record:
        raise HTTPException(status_code=404, detail="DNS record not found")

    if payload.name is not None:
        record.name = payload.name.strip()
    if payload.ttl is not None:
        record.ttl = payload.ttl
    if payload.value is not None:
        record.value = payload.value.strip()
    if payload.priority is not None:
        record.priority = payload.priority
    if payload.weight is not None:
        record.weight = payload.weight
    if payload.port is not None:
        record.port = payload.port
    if payload.target is not None:
        record.target = payload.target
    if payload.flags is not None:
        record.flags = payload.flags
    if payload.tag is not None:
        record.tag = payload.tag
    if payload.routing_policy is not None:
        record.routing_policy = payload.routing_policy

    db.commit()
    db.refresh(record)
    return record

@router.delete("/records/{record_id}")
def delete_record(record_id: int, db: Session = Depends(get_db)):
    record = db.query(Record).filter(Record.id == record_id).first()
    if not record:
        raise HTTPException(status_code=404, detail="DNS record not found")

    if record.type == "SOA":
        raise HTTPException(status_code=400, detail="SOA record cannot be deleted as it is required for zone authority")

    rec_name = record.name
    rec_type = record.type
    db.delete(record)
    db.commit()
    return {"success": True, "message": f"Record {rec_name} ({rec_type}) deleted successfully"}
