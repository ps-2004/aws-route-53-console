AWS Route 53 Web Console Clone
A full-stack demo that recreates key workflows and visual patterns from the Amazon Route 53 management console. It includes a Next.js frontend, a FastAPI REST API, and SQLite persistence for hosted zones and DNS records.
Important: This is an educational/demo clone. It does not connect to, create, modify, or delete resources in real AWS Route 53. Data is managed by this application's own backend and database.

Table of Contents
1. Project Overview
2. Features
3. Technology Stack
4. Architecture
5. Repository Structure
6. Data Model
7. API Reference
8. Demo Login
9. Run Locally
10. Configuration
11. Tests
12. Deployment
13. Limitations and Future Improvements
1. Project Overview
The application provides an AWS-inspired interface for managing simulated DNS hosted zones and records.
Main workflows include:
- Sign-in using demo authentication.
- Listing, searching, creating, updating, and deleting hosted zones.
- Automatically creating default NS and SOA records for a new hosted zone.
- Listing and filtering DNS records.
- Creating, updating, and deleting DNS records.
- Selecting and deleting multiple records in one operation.
- Importing records from JSON.
- Exporting a hosted zone and its records as JSON or a basic BIND-style .zone text file.
- Exploring the REST API through FastAPI's Swagger UI.
The interface uses AWS-inspired navigation, tables, status labels, dialogs, and color styling. It is a visual and functional simulation, not an official AWS product.
2. Features
Hosted zones
- Create public and private demo hosted zones.
- Generate a simulated hosted-zone ID.
- Search and paginate hosted zones.
- Update zone details supported by the API.
- Delete a hosted zone and its associated records.
DNS records
The UI and backend support record types including:
- A — IPv4 address value.
- AAAA — IPv6 address value.
- CNAME — canonical-name/alias target.
- TXT — text value, commonly used for verification and email policies.
- MX — mail-exchange value and priority.
- NS — name-server records.
- PTR — pointer/reverse-DNS record.
- SRV — service, priority, weight, port, and target fields.
- CAA — certificate-authority authorization fields.
- SOA — start-of-authority record.
The form provides type-specific fields and required-field checks. The current frontend does not perform dedicated IPv4 or IPv6 address-format validation, so the examples shown in the form should not be interpreted as proof that an address is validated.
Search, filtering, and pagination
- Search hosted zones by supported zone fields.
- Search DNS records and filter by record type.
- Retrieve paginated lists from the API.
Import and export
- Export zone metadata and records as JSON.
- Export records as a basic BIND-style .zone text file.
- Import a non-empty list of DNS records from JSON into an existing hosted zone.
- Bulk-delete selected records through the API.
The BIND export is a basic representation for this demo, not a guarantee of a production-ready or fully RFC-compliant authoritative zone file. Review the generated output before using it with any real DNS server.
API documentation
FastAPI exposes interactive Swagger documentation at /docs and the OpenAPI schema at /openapi.json.
3. Technology Stack
Frontend
- Framework: Next.js 14 App Router
- Language: TypeScript
- UI: React
- Styling: Tailwind CSS
- Icons: Lucide React
Backend
- Framework: FastAPI
- Language: Python
- ORM: SQLAlchemy
- Database: SQLite
- Validation and schemas: Pydantic
- API documentation: OpenAPI / Swagger UI
- Tests: pytest and FastAPI TestClient
4. Architecture
The deployed application uses the Next.js frontend to call the FastAPI backend over HTTP. The backend uses SQLAlchemy to read and write application data in SQLite.
Browser
  |
  v
Next.js frontend
  |
  | HTTP / JSON requests
  v
FastAPI backend
  |-- /api/auth/*
  |-- /api/hosted-zones/*
  |-- /api/records/*
  |-- /docs
  |
  v
SQLAlchemy
  |
  v
SQLite database
The repository also contains root-level Node.js/Express and React/Vite code from an integrated prototype. The deployment described here uses the frontend/ Next.js app and the backend/ FastAPI service.
5. Repository Structure
aws-route-53-console/
├── backend/
│   ├── app/
│   │   ├── main.py
│   │   ├── database.py
│   │   ├── models.py
│   │   ├── schemas.py
│   │   ├── seed.py
│   │   └── routers/
│   │       ├── auth.py
│   │       ├── hosted_zones.py
│   │       └── records.py
│   ├── tests/
│   │   └── test_api.py
│   └── requirements.txt
├── frontend/
│   ├── app/
│   ├── src/
│   │   ├── components/
│   │   ├── services/
│   │   └── types/
│   ├── package.json
│   └── next.config.js
├── src/                 # Root-level prototype UI
├── server/              # Root-level Express prototype
├── server.ts             # Root-level prototype server
├── package.json          # Root-level prototype package
└── README.md
This is a high-level overview of the relevant source folders. No Dockerfile is currently included in the repository.
6. Data Model
The FastAPI application stores users, hosted zones, and DNS records in SQLite.
users
Field	Purpose
id	Internal user identifier
email	Login email
password_hash	Stored password hash
name	Display name
created_at	Creation timestamp


hosted_zones
Field	Purpose
id	Internal database ID
name	Hosted-zone domain name
zone_id	Simulated Route 53-style zone ID
zone_type	Public or private
description	Optional zone description
private_zone	Private-zone flag
created_at	Creation timestamp
updated_at	Last update timestamp


records
Field	Purpose
id	Internal record ID
hosted_zone_id	Parent hosted-zone ID
name	Record name
type	DNS record type
ttl	Time to live in seconds
value	Record value
priority	Optional MX/SRV priority
weight	Optional SRV weight
port	Optional SRV port
target	Optional target host
flags	Optional CAA flags
tag	Optional CAA tag
routing_policy	Simulated routing policy
created_at	Creation timestamp
updated_at	Last update timestamp


Exact defaults and constraints are defined in backend/app/models.py and backend/app/schemas.py.
7. API Reference
The API is mounted under /api. Exact request and response schemas are available from Swagger UI.
Authentication
Method	Endpoint	Purpose
POST	/api/auth/login	Sign in
POST	/api/auth/logout	Sign out
GET	/api/auth/me	Get the current user


Hosted zones
Method	Endpoint	Purpose
GET	/api/hosted-zones	List/search paginated zones
POST	/api/hosted-zones	Create a hosted zone
GET	/api/hosted-zones/{id_or_zone_id}	Get a zone by internal ID or simulated zone ID
PUT	/api/hosted-zones/{id_or_zone_id}	Update supported zone fields
DELETE	/api/hosted-zones/{id_or_zone_id}	Delete a zone and its records
GET	/api/hosted-zones/{id_or_zone_id}/export?format=json	Export zone data as JSON
GET	/api/hosted-zones/{id_or_zone_id}/export?format=bind	Export a BIND-style text file
POST	/api/hosted-zones/{id_or_zone_id}/import	Import records from JSON


DNS records
Method	Endpoint	Purpose
GET	/api/hosted-zones/{zone_id}/records	List/search/filter zone records
POST	/api/hosted-zones/{zone_id}/records	Create a record
GET	/api/records/{id}	Retrieve a record
PUT	/api/records/{id}	Update a record
DELETE	/api/records/{id}	Delete a record
POST	/api/records/bulk-delete	Delete multiple records


Use /docs to inspect supported query parameters, payloads, response models, and error responses.
8. Demo Login
The sign-in page provides a demo auto-fill helper. The credentials configured for the demo are:
Email	Password
admin@route53clone.com	admin123


These are demo credentials only. Do not reuse them for a real service or expose real user credentials in a public repository.
9. Run Locally
Prerequisites
- Python version supported by the dependencies in backend/requirements.txt.
- Node.js and npm compatible with frontend/package.json.
- Git.
Start the FastAPI backend
From the repository root:
cd backend

# Create and activate a virtual environment (Windows Git Bash)
python -m venv .venv
source .venv/Scripts/activate

# Install Python dependencies
pip install -r requirements.txt

# Start the API
uvicorn app.main:app --reload --port 8000
The API documentation should be available at http://localhost:8000/docs.
On Windows PowerShell, activate the virtual environment with:
.\.venv\Scripts\Activate.ps1
Start the Next.js frontend
Open a second terminal from the repository root:
cd frontend
npm install
Configure the API URL as described in the next section, then run:
npm run dev
Open the local URL printed by Next.js, usually http://localhost:3000.
10. Configuration
Frontend
Set NEXT_PUBLIC_API_URL to the backend API base URL. For local development with the FastAPI backend, create frontend/.env.local containing:
NEXT_PUBLIC_API_URL=http://localhost:8000/api
For deployment, configure NEXT_PUBLIC_API_URL in the frontend service's environment settings to point to the deployed backend API base URL, including /api.
Backend
The backend can be configured with DATABASE_URL if supported by the current database configuration. The default SQLite URL is defined in backend/app/database.py. For a local SQLite database, a typical value is:
DATABASE_URL=sqlite:///./route53.db
Check backend/app/database.py for the exact default and path interpretation before changing it. SQLite relative paths depend on the process working directory.
Do not commit .env files, credentials, or local database files.
11. Tests
Run the backend tests from the repository root using the same Python environment in which the backend dependencies are installed:
python -m pytest backend/tests -q
The test suite covers authentication, hosted-zone operations, record operations, bulk deletion, record import, and JSON/BIND export.
The latest local test run during this project's update completed with 15 passed. Re-run the command after making further changes to verify the current state.
Build the frontend for production with:
cd frontend
npm run build
The frontend production build completed successfully during the same update.
Some dependencies may emit deprecation warnings; warnings are not test failures, but should be reviewed during maintenance.
12. Deployment
The application is deployed as separate frontend and backend services on Render.
- Frontend: https://route53-frontend-demo.onrender.com
- Backend API docs: https://aws-route-53-console.onrender.com/docs
The frontend's NEXT_PUBLIC_API_URL should point to the backend API base URL, such as https://aws-route-53-console.onrender.com/api.
The deployment was reported successful after commit 49cdc40. Confirm the live UI and API after any subsequent changes; a successful deployment alone does not verify every workflow against the production database.
This repository does not currently include a Dockerfile, and these instructions do not require Docker.
13. Limitations and Future Improvements
Current limitations
- This is a simulation and does not call AWS Route 53 APIs.
- IPv4/IPv6 values are shown with examples in the record form, but the current frontend does not implement dedicated IP-address-format validation.
- BIND export is a basic text representation and should not be treated as a production-ready authoritative zone file without additional validation.
- Features such as Traffic Flow policies, Health Checks, Resolver, DNSSEC, and VPC associations are not fully implemented as real AWS services.
- SQLite is suitable for a demo, but production persistence and concurrency requirements may call for a managed database.
Potential improvements
- Add dedicated IPv4 and IPv6 validation on both frontend and backend.
- Improve BIND zone-file generation and validate exported files.
- Add stronger authorization and production-grade session management.
- Add database migrations and expand API integration tests.
- Implement DNSSEC, health-check simulations, traffic policies, and private-zone association workflows.
- Add screenshots of the current UI and API documentation.