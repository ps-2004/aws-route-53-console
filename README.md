# AWS Route 53 Web Console Clone

A production-quality full-stack clone of the Amazon Web Services (AWS) Route 53 Management Console. Built with pixel-perfect AWS visual language, navigation, layout, typography, real SQLite persistence, and a RESTful backend API.

> **Note:** This is a functional Route 53 *experience* clone for architectural and user-experience evaluation. All data and operations are persisted locally in SQLite without contacting real AWS Route 53 APIs.

---

## Table of Contents
- [1. Project Overview](#1-project-overview)
- [2. Key Features](#2-key-features)
- [3. Tech Stack](#3-tech-stack)
- [4. Architecture](#4-architecture)
- [5. Repository Structure](#5-repository-structure)
- [6. Database Schema](#6-database-schema)
- [7. API Documentation](#7-api-documentation)
- [8. Test Credentials](#8-test-credentials)
- [9. Local Setup & Running Instructions](#9-local-setup--running-instructions)
- [10. Environment Variables](#10-environment-variables)
- [11. Testing](#11-testing)
- [12. Screenshots Placeholder](#12-screenshots-placeholder)
- [13. Bonus Features](#13-bonus-features)
- [14. Future Improvements](#14-future-improvements)

---

## 1. Project Overview

This application faithfully reproduces the AWS Route 53 web console user experience:
- **Authentication:** Mocked AWS Sign-in screen with session persistence and auto-fill helper.
- **AWS Console Shell:** Dark AWS navigation header (`#161e2e`), AWS orange accents (`#ec7211`), global search bar, region switcher (`us-east-1`, Global), account selector, notification bell, collapsible sidebar, and dynamic breadcrumbs.
- **Hosted Zones Management:** Full CRUD operations for public and private hosted zones, automatic generation of Route 53 IDs (`Z...`) and default authoritative NS / SOA records, domain search, and pagination.
- **DNS Records Management:** Full CRUD operations for DNS records across all standard types (`A`, `AAAA`, `CNAME`, `TXT`, `MX`, `NS`, `PTR`, `SRV`, `CAA`, `SOA`), dynamic record forms tailored to each type, search and type filtering, bulk record deletion, and zone file import/export.
- **Feature Overviews:** Authentic AWS-styled "Coming Soon" sections for Traffic policies, Health checks, Resolver, and Profiles.
- **Interactive Documentation:** Embedded OpenAPI 3.0 / Swagger UI accessible at `/docs`.

---

## 2. Key Features

- **Realistic AWS Visual Language:** Exact reproduction of AWS console buttons, font styles, data tables, radio/checkbox row selection, status badges (`INSYNC`), and alert banners.
- **SQLite Persistence:** All modifications (hosted zones, records, user sessions) are stored in SQLite and persist across browser reloads and server restarts.
- **Dynamic Record Fields:**
  - `A`: IPv4 addresses with validation
  - `AAAA`: IPv6 addresses
  - `CNAME`: Target alias domain
  - `TXT`: Quoted text strings (SPF, DKIM, verification)
  - `MX`: Mail server host and integer priority
  - `SRV`: Priority, weight, port, and target host
  - `CAA`: Flags, tag (`issue`, `issuewild`, `iodef`), and certificate authority domain
- **Search & Filter:** Instant multi-parameter search (domain name, zone ID, record name, value) and record type filtering.
- **Server-Side Pagination:** Configurable page limit (5, 10, 25, 50) and page navigation.
- **Import & Export:** Export zones to JSON or RFC-compliant BIND zone format (`.zone`), and import records in JSON format.
- **Confirmation Modals:** Deletion dialog with resource name typing verification to prevent accidental data loss.

---

## 3. Tech Stack

### Frontend:
- **Framework:** Next.js (App Router) / React 19 SPA
- **Language:** TypeScript
- **Styling:** Tailwind CSS with AWS Console palette (`#161e2e`, `#ec7211`, `#0073bb`, `#f2f3f3`)
- **Icons:** Lucide React icons

### Backend:
- **Framework:** FastAPI (Python) & Express / Node.js full-stack engine
- **ORM / Database:** SQLAlchemy & SQLite (`route53.db`)
- **Validation:** Pydantic schemas
- **API Spec:** OpenAPI 3.0 / Swagger UI (`/docs`)

---

## 4. Architecture

```
┌────────────────────────────────────────────────────────┐
│               AWS Route 53 Web Console                 │
│    (Next.js App Router / React 19 + Tailwind CSS)      │
└───────────────────────────┬────────────────────────────┘
                            │ REST API (JSON / HTTP)
                            ▼
┌────────────────────────────────────────────────────────┐
│               Backend Service (FastAPI)                │
│   • /api/auth/*          • /api/hosted-zones/*         │
│   • /api/records/*       • /docs (Swagger UI)          │
└───────────────────────────┬────────────────────────────┘
                            │ SQLAlchemy ORM
                            ▼
┌────────────────────────────────────────────────────────┐
│                 SQLite Database                        │
│   • users        • hosted_zones       • records        │
└────────────────────────────────────────────────────────┘
```

---

## 5. Repository Structure

```
aws-route53-clone/
├── backend/
│   ├── app/
│   │   ├── __init__.py
│   │   ├── main.py              # FastAPI application entry point
│   │   ├── database.py          # SQLAlchemy engine & session maker
│   │   ├── models.py            # SQLite database models
│   │   ├── schemas.py           # Pydantic validation schemas
│   │   ├── seed.py              # Realistic seed data loader
│   │   └── routers/
│   │       ├── __init__.py
│   │       ├── auth.py          # Authentication routes
│   │       ├── hosted_zones.py  # Hosted zone CRUD & search
│   │       └── records.py       # DNS records CRUD & filtering
│   ├── tests/
│   │   ├── __init__.py
│   │   └── test_api.py          # Pytest API integration tests
│   ├── Dockerfile
│   └── requirements.txt
├── frontend/
│   ├── app/
│   │   ├── layout.tsx           # Next.js root layout
│   │   ├── page.tsx             # Root redirect
│   │   ├── globals.css          # Tailwind CSS styles
│   │   └── login/page.tsx       # Sign-in page
│   ├── next.config.js
│   ├── package.json
│   └── tsconfig.json
├── src/                         # Full-stack integrated console
│   ├── components/
│   │   ├── auth/LoginPage.tsx
│   │   ├── layout/TopNavbar.tsx
│   │   ├── layout/Sidebar.tsx
│   │   ├── layout/Breadcrumbs.tsx
│   │   ├── placeholder/ComingSoonView.tsx
│   │   ├── records/RecordsList.tsx
│   │   ├── records/RecordModal.tsx
│   │   ├── records/ZoneDetailsTab.tsx
│   │   ├── ui/ConfirmDialog.tsx
│   │   ├── ui/Toast.tsx
│   │   └── zones/HostedZonesList.tsx
│   ├── services/api.ts
│   ├── types/route53.ts
│   ├── App.tsx
│   └── main.tsx
├── server/
│   ├── db.ts                    # SQLite database engine & seed
│   ├── routes.ts                # Express REST API routes
│   └── swagger.ts               # Swagger UI & OpenAPI 3.0 spec
├── server.ts                    # Full-stack server entry point
├── route53.db                   # SQLite database file
├── metadata.json
├── package.json
└── README.md
```

---

## 6. Database Schema

### `users` Table
| Column | Type | Constraints | Description |
|---|---|---|---|
| `id` | INTEGER | PRIMARY KEY AUTOINCREMENT | User identifier |
| `email` | TEXT | UNIQUE, NOT NULL | Login email |
| `password_hash` | TEXT | NOT NULL | Password |
| `name` | TEXT | NOT NULL | User display name |
| `created_at` | DATETIME | DEFAULT current_timestamp | Timestamp |

### `hosted_zones` Table
| Column | Type | Constraints | Description |
|---|---|---|---|
| `id` | INTEGER | PRIMARY KEY AUTOINCREMENT | Internal ID |
| `name` | TEXT | NOT NULL | Domain name (e.g. `example.com`) |
| `zone_id` | TEXT | UNIQUE, NOT NULL | Route 53 Zone ID (e.g. `Z04829104A19CD`) |
| `zone_type` | TEXT | DEFAULT 'Public' | `Public` or `Private` |
| `description` | TEXT | NULLABLE | Comment/Description |
| `private_zone` | INTEGER | DEFAULT 0 | 0 for Public, 1 for Private |
| `created_at` | DATETIME | DEFAULT current_timestamp | Created timestamp |
| `updated_at` | DATETIME | DEFAULT current_timestamp | Updated timestamp |

### `records` Table
| Column | Type | Constraints | Description |
|---|---|---|---|
| `id` | INTEGER | PRIMARY KEY AUTOINCREMENT | Record ID |
| `hosted_zone_id` | INTEGER | FOREIGN KEY REFERENCES hosted_zones(id) ON DELETE CASCADE | Parent hosted zone |
| `name` | TEXT | NOT NULL | Record name / FQDN |
| `type` | TEXT | NOT NULL | `A`, `AAAA`, `CNAME`, `TXT`, `MX`, `NS`, `PTR`, `SRV`, `CAA`, `SOA` |
| `ttl` | INTEGER | DEFAULT 300 | Time to live in seconds |
| `value` | TEXT | NOT NULL | Resource IP, target, or value string |
| `priority` | INTEGER | NULLABLE | MX / SRV priority |
| `weight` | INTEGER | NULLABLE | SRV weight |
| `port` | INTEGER | NULLABLE | SRV port |
| `target` | TEXT | NULLABLE | SRV target host |
| `flags` | INTEGER | NULLABLE | CAA flags |
| `tag` | TEXT | NULLABLE | CAA tag (`issue`, `issuewild`, `iodef`) |
| `routing_policy` | TEXT | DEFAULT 'Simple' | Routing policy |
| `created_at` | DATETIME | DEFAULT current_timestamp | Created timestamp |
| `updated_at` | DATETIME | DEFAULT current_timestamp | Updated timestamp |

---

## 7. API Documentation

Interactive Swagger documentation is served at `/docs` (or view `/openapi.json`).

### Authentication Endpoints
- `POST /api/auth/login`: Authenticate with email & password.
- `POST /api/auth/logout`: End session.
- `GET /api/auth/me`: Retrieve currently logged-in user.

### Hosted Zones Endpoints
- `GET /api/hosted-zones?page=1&limit=10&search=`: List paginated hosted zones with record count.
- `POST /api/hosted-zones`: Create hosted zone (automatically provisions default NS and SOA records).
- `GET /api/hosted-zones/{id}`: Get hosted zone details by numeric ID or Route 53 zone ID.
- `PUT /api/hosted-zones/{id}`: Update zone comment or type.
- `DELETE /api/hosted-zones/{id}`: Delete hosted zone and cascade delete associated records.
- `GET /api/hosted-zones/{id}/export?format=json|bind`: Export zone records as JSON or RFC BIND zone format.
- `POST /api/hosted-zones/{id}/import`: Batch import records in JSON format.

### DNS Records Endpoints
- `GET /api/hosted-zones/{zone_id}/records?page=1&limit=10&search=&type=`: List DNS records with search and type filter.
- `POST /api/hosted-zones/{zone_id}/records`: Create a new DNS record.
- `GET /api/records/{id}`: Retrieve a specific record.
- `PUT /api/records/{id}`: Update a DNS record.
- `DELETE /api/records/{id}`: Delete a DNS record.
- `POST /api/records/bulk-delete`: Delete multiple records simultaneously.

---

## 8. Test Credentials

| Email | Password | Role |
|---|---|---|
| `admin@route53clone.com` | `admin123` | Administrator (Root User) |

*(An **Auto-fill** button is provided on the sign-in screen for one-click access).*

---

## 9. Local Setup & Running Instructions

### Running with Node.js & Integrated Backend (Port 3000):
```bash
# Install dependencies
npm install

# Start the full-stack server
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) to use the AWS Route 53 console.
Open [http://localhost:3000/docs](http://localhost:3000/docs) to view Swagger documentation.

### Running with Python FastAPI Backend (Port 8000):
```bash
# Navigate to backend directory
cd backend

# Install dependencies
pip install -r requirements.txt

# Start FastAPI server
uvicorn app.main:app --reload --port 8000
```
FastAPI Swagger documentation will be available at [http://localhost:8000/docs](http://localhost:8000/docs).

### Running Frontend (Next.js):
```bash
cd frontend
npm install
npm run dev
```

---

## 10. Environment Variables

Create a `.env` file or set environment variables:

```ini
# Frontend
NEXT_PUBLIC_API_URL=http://localhost:8000/api

# Backend
DATABASE_URL=sqlite:///./route53.db
PORT=3000
```

---

## 11. Testing

Backend test suite with `pytest`:
```bash
cd backend
pytest tests/test_api.py -v
```

Tests cover:
- Authentication & login validation
- Hosted zone creation and auto-generation of zone IDs and SOA/NS records
- Hosted zone list pagination and search
- Hosted zone updates and deletion
- DNS record creation across types
- DNS record type filtering and search
- Record updates and deletion

---

## 12. Screenshots Placeholder

*(Screenshots can be added here)*
- **Console Sign-In:** `docs/screenshots/signin.png`
- **Hosted Zones Dashboard:** `docs/screenshots/hosted_zones.png`
- **DNS Records View:** `docs/screenshots/dns_records.png`
- **Dynamic Record Creation Modal:** `docs/screenshots/record_modal.png`
- **Swagger API Docs:** `docs/screenshots/swagger_ui.png`

---

## 13. Bonus Features Implemented
- [x] **Export Hosted Zone as JSON:** Download raw zone data.
- [x] **Export Hosted Zone as BIND Zone File:** RFC-compliant zone file generator.
- [x] **Import Records:** Batch import records in JSON format.
- [x] **Bulk Record Deletion:** Select multiple records and delete in one step.
- [x] **Interactive Swagger UI at `/docs`:** Live API playground with schema models.
- [x] **One-Click Test Credential Auto-Fill:** Quick evaluation helper on sign-in.

---

## 14. Future Improvements
- Visual Traffic Policy builder with Drag & Drop nodes
- DNSSEC signing and key management
- Health check pingers and synthetic probes
- Multi-VPC private hosted zone association wizard
