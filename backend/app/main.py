from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from .database import engine, Base
from .seed import seed_database
from .routers import auth, hosted_zones, records
from fastapi.responses import RedirectResponse

# Initialize database schema
Base.metadata.create_all(bind=engine)
seed_database()

app = FastAPI(
    title="AWS Route 53 Clone API",
    description="FastAPI Backend for AWS Route 53 Console Clone with SQLite database persistence.",
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router, prefix="/api")
app.include_router(hosted_zones.router, prefix="/api")
app.include_router(records.router, prefix="/api")

@app.get("/")
def root():
    return RedirectResponse(url="/docs", status_code=302)

@app.get("/api/health")
def health_check():
    return {"status": "healthy"}
