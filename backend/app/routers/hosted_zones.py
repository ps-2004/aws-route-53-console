import random
import string
import math
from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from sqlalchemy import or_, func
from ..database import get_db
from ..models import HostedZone, Record
from ..schemas import (
    HostedZoneCreate,
    HostedZoneUpdate,
    HostedZoneResponse,
    HostedZonePaginationResponse
)

router = APIRouter(prefix="/hosted-zones", tags=["Hosted Zones"])

def generate_zone_id() -> str:
    chars = string.ascii_uppercase + string.digits
    return "Z" + "".join(random.choices(chars, k=13))

@router.get("", response_model=HostedZonePaginationResponse)
def list_hosted_zones(
    page: int = Query(1, ge=1),
    limit: int = Query(10, ge=1, le=100),
    search: Optional[str] = Query(None),
    db: Session = Depends(get_db)
):
    query = db.query(HostedZone)
    if search and search.strip():
        term = f"%{search.strip()}%"
        query = query.filter(
            or_(
                HostedZone.name.ilike(term),
                HostedZone.zone_id.ilike(term),
                HostedZone.description.ilike(term)
            )
        )
    
    total = query.count()
    total_pages = math.ceil(total / limit) if total > 0 else 1
    offset = (page - 1) * limit
    zones = query.order_by(HostedZone.created_at.desc()).offset(offset).limit(limit).all()

    # compute record count for each zone
    items = []
    for zone in zones:
        count = db.query(func.count(Record.id)).filter(Record.hosted_zone_id == zone.id).scalar() or 0
        items.append({
            "id": zone.id,
            "name": zone.name,
            "zone_id": zone.zone_id,
            "zone_type": zone.zone_type,
            "description": zone.description,
            "private_zone": zone.private_zone,
            "record_count": count,
            "created_at": zone.created_at,
            "updated_at": zone.updated_at
        })

    return {
        "items": items,
        "page": page,
        "limit": limit,
        "total": total,
        "total_pages": total_pages
    }

@router.post("", response_model=HostedZoneResponse, status_code=201)
def create_hosted_zone(payload: HostedZoneCreate, db: Session = Depends(get_db)):
    name = payload.name.strip().lower()
    if name.endswith("."):
        name = name[:-1]
    
    existing = db.query(HostedZone).filter(HostedZone.name == name).first()
    if existing:
        raise HTTPException(status_code=400, detail=f"Hosted zone {name} already exists")

    zone_id = generate_zone_id()
    is_private = 1 if (payload.private_zone or payload.zone_type == "Private") else 0
    zone_type = "Private" if is_private else "Public"

    new_zone = HostedZone(
        name=name,
        zone_id=zone_id,
        zone_type=zone_type,
        description=payload.description or "",
        private_zone=is_private
    )
    db.add(new_zone)
    db.commit()
    db.refresh(new_zone)

    # Automatically add Route 53 default NS and SOA records
    ns_records = (
        f"ns-{random.randint(100, 999)}.awsdns-12.org.\n"
        f"ns-{random.randint(100, 999)}.awsdns-34.com.\n"
        f"ns-{random.randint(100, 999)}.awsdns-56.co.uk.\n"
        f"ns-{random.randint(100, 999)}.awsdns-78.net."
    )
    soa_record = f"ns-{random.randint(100, 999)}.awsdns-12.org. awsdns-hostmaster.amazon.com. 1 7200 900 1209600 86400"

    db.add(Record(hosted_zone_id=new_zone.id, name=name, type="NS", ttl=172800, value=ns_records, routing_policy="Simple"))
    db.add(Record(hosted_zone_id=new_zone.id, name=name, type="SOA", ttl=900, value=soa_record, routing_policy="Simple"))
    db.commit()

    return {
        "id": new_zone.id,
        "name": new_zone.name,
        "zone_id": new_zone.zone_id,
        "zone_type": new_zone.zone_type,
        "description": new_zone.description,
        "private_zone": new_zone.private_zone,
        "record_count": 2,
        "created_at": new_zone.created_at,
        "updated_at": new_zone.updated_at
    }

@router.get("/{id_or_zone_id}", response_model=HostedZoneResponse)
def get_hosted_zone(id_or_zone_id: str, db: Session = Depends(get_db)):
    if id_or_zone_id.isdigit():
        zone = db.query(HostedZone).filter(HostedZone.id == int(id_or_zone_id)).first()
    else:
        zone = db.query(HostedZone).filter(HostedZone.zone_id == id_or_zone_id).first()

    if not zone:
        raise HTTPException(status_code=404, detail="Hosted zone not found")

    count = db.query(func.count(Record.id)).filter(Record.hosted_zone_id == zone.id).scalar() or 0
    return {
        "id": zone.id,
        "name": zone.name,
        "zone_id": zone.zone_id,
        "zone_type": zone.zone_type,
        "description": zone.description,
        "private_zone": zone.private_zone,
        "record_count": count,
        "created_at": zone.created_at,
        "updated_at": zone.updated_at
    }

@router.put("/{id_or_zone_id}", response_model=HostedZoneResponse)
def update_hosted_zone(id_or_zone_id: str, payload: HostedZoneUpdate, db: Session = Depends(get_db)):
    if id_or_zone_id.isdigit():
        zone = db.query(HostedZone).filter(HostedZone.id == int(id_or_zone_id)).first()
    else:
        zone = db.query(HostedZone).filter(HostedZone.zone_id == id_or_zone_id).first()

    if not zone:
        raise HTTPException(status_code=404, detail="Hosted zone not found")

    if payload.description is not None:
        zone.description = payload.description
    if payload.zone_type is not None:
        zone.zone_type = payload.zone_type
    if payload.private_zone is not None:
        zone.private_zone = 1 if payload.private_zone else 0

    db.commit()
    db.refresh(zone)
    count = db.query(func.count(Record.id)).filter(Record.hosted_zone_id == zone.id).scalar() or 0

    return {
        "id": zone.id,
        "name": zone.name,
        "zone_id": zone.zone_id,
        "zone_type": zone.zone_type,
        "description": zone.description,
        "private_zone": zone.private_zone,
        "record_count": count,
        "created_at": zone.created_at,
        "updated_at": zone.updated_at
    }

@router.delete("/{id_or_zone_id}")
def delete_hosted_zone(id_or_zone_id: str, db: Session = Depends(get_db)):
    if id_or_zone_id.isdigit():
        zone = db.query(HostedZone).filter(HostedZone.id == int(id_or_zone_id)).first()
    else:
        zone = db.query(HostedZone).filter(HostedZone.zone_id == id_or_zone_id).first()

    if not zone:
        raise HTTPException(status_code=404, detail="Hosted zone not found")

    zone_name = zone.name
    db.query(Record).filter(Record.hosted_zone_id == zone.id).delete()
    db.delete(zone)
    db.commit()

    return {"success": True, "message": f"Hosted zone {zone_name} deleted successfully"}
