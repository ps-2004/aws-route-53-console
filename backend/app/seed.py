from .database import SessionLocal, engine, Base
from .models import User, HostedZone, Record

def seed_database():
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()
    try:
        user_count = db.query(User).count()
        if user_count == 0:
            db.add(User(
                email="admin@route53clone.com",
                password_hash="admin123",
                name="Administrator"
            ))
            db.commit()

        zone_count = db.query(HostedZone).count()
        if zone_count == 0:
            zones_data = [
                {
                    "name": "example.com",
                    "zone_id": "Z04829104A19CD",
                    "zone_type": "Public",
                    "description": "Primary public production zone for example.com",
                    "private_zone": 0,
                    "records": [
                        {"name": "example.com", "type": "NS", "ttl": 172800, "value": "ns-1536.awsdns-00.org.\nns-0.awsdns-00.com.\nns-1024.awsdns-00.co.uk.\nns-512.awsdns-00.net."},
                        {"name": "example.com", "type": "SOA", "ttl": 900, "value": "ns-1536.awsdns-00.org. awsdns-hostmaster.amazon.com. 1 7200 900 1209600 86400"},
                        {"name": "example.com", "type": "A", "ttl": 300, "value": "192.168.1.10"},
                        {"name": "www.example.com", "type": "CNAME", "ttl": 300, "value": "example.com"},
                        {"name": "api.example.com", "type": "A", "ttl": 300, "value": "192.168.1.25"},
                        {"name": "example.com", "type": "MX", "ttl": 300, "value": "mail.example.com", "priority": 10},
                        {"name": "example.com", "type": "TXT", "ttl": 300, "value": '"v=spf1 include:example.com ~all"'},
                        {"name": "_sip._tcp.example.com", "type": "SRV", "ttl": 300, "value": "sip.example.com", "priority": 10, "weight": 60, "port": 5060, "target": "sip.example.com"},
                        {"name": "example.com", "type": "CAA", "ttl": 300, "value": "amazon.com", "flags": 0, "tag": "issue"}
                    ]
                },
                {
                    "name": "example.org",
                    "zone_id": "Z083920194B28EF",
                    "zone_type": "Public",
                    "description": "Open source foundation portal and documentation",
                    "private_zone": 0,
                    "records": [
                        {"name": "example.org", "type": "NS", "ttl": 172800, "value": "ns-204.awsdns-25.com.\nns-812.awsdns-37.net.\nns-1402.awsdns-47.org.\nns-1890.awsdns-44.co.uk."},
                        {"name": "example.org", "type": "SOA", "ttl": 900, "value": "ns-204.awsdns-25.com. awsdns-hostmaster.amazon.com. 1 7200 900 1209600 86400"},
                        {"name": "example.org", "type": "A", "ttl": 300, "value": "93.184.216.34"},
                        {"name": "example.org", "type": "AAAA", "ttl": 300, "value": "2606:2800:220:1:248:1893:25c8:1946"},
                        {"name": "docs.example.org", "type": "CNAME", "ttl": 300, "value": "example.org"},
                        {"name": "example.org", "type": "TXT", "ttl": 300, "value": '"google-site-verification=abc123xyz890"'}
                    ]
                },
                {
                    "name": "mycompany.com",
                    "zone_id": "Z019283748291AA",
                    "zone_type": "Public",
                    "description": "Corporate customer facing platform and services",
                    "private_zone": 0,
                    "records": [
                        {"name": "mycompany.com", "type": "NS", "ttl": 172800, "value": "ns-612.awsdns-12.net.\nns-112.awsdns-14.com.\nns-1782.awsdns-30.co.uk.\nns-1200.awsdns-21.org."},
                        {"name": "mycompany.com", "type": "SOA", "ttl": 900, "value": "ns-612.awsdns-12.net. awsdns-hostmaster.amazon.com. 1 7200 900 1209600 86400"},
                        {"name": "mycompany.com", "type": "A", "ttl": 60, "value": "54.239.28.85"},
                        {"name": "app.mycompany.com", "type": "CNAME", "ttl": 300, "value": "d111111abcdef8.cloudfront.net"},
                        {"name": "mycompany.com", "type": "MX", "ttl": 300, "value": "inbound-smtp.us-east-1.amazonaws.com", "priority": 10},
                        {"name": "mycompany.com", "type": "TXT", "ttl": 300, "value": '"v=spf1 include:amazonses.com ~all"'}
                    ]
                },
                {
                    "name": "internal.corp.local",
                    "zone_id": "Z091827364510BC",
                    "zone_type": "Private",
                    "description": "VPC private DNS zone for internal microservices (vpc-0891ab23)",
                    "private_zone": 1,
                    "records": [
                        {"name": "internal.corp.local", "type": "NS", "ttl": 172800, "value": "ns-10.awsdns-01.com.\nns-11.awsdns-02.net.\nns-12.awsdns-03.org.\nns-13.awsdns-04.co.uk."},
                        {"name": "internal.corp.local", "type": "SOA", "ttl": 900, "value": "ns-10.awsdns-01.com. awsdns-hostmaster.amazon.com. 1 7200 900 1209600 86400"},
                        {"name": "db.internal.corp.local", "type": "A", "ttl": 60, "value": "10.0.4.15"},
                        {"name": "redis.internal.corp.local", "type": "A", "ttl": 60, "value": "10.0.4.22"},
                        {"name": "auth.internal.corp.local", "type": "A", "ttl": 60, "value": "10.0.2.50"}
                    ]
                }
            ]

            for z in zones_data:
                zone = HostedZone(
                    name=z["name"],
                    zone_id=z["zone_id"],
                    zone_type=z["zone_type"],
                    description=z["description"],
                    private_zone=z["private_zone"]
                )
                db.add(zone)
                db.commit()
                db.refresh(zone)

                for r in z["records"]:
                    db.add(Record(
                        hosted_zone_id=zone.id,
                        name=r["name"],
                        type=r["type"],
                        ttl=r["ttl"],
                        value=r["value"],
                        priority=r.get("priority"),
                        weight=r.get("weight"),
                        port=r.get("port"),
                        target=r.get("target"),
                        flags=r.get("flags"),
                        tag=r.get("tag")
                    ))
                db.commit()
    finally:
        db.close()
