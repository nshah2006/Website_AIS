from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from api.routers import contact, rsvp

app = FastAPI(title="AIS UTD API", version="1.0.0")

# CORS middleware for local dev and cross-origin requests
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(contact.router)
app.include_router(rsvp.router)


@app.get("/api/health")
async def health():
    return {"status": "ok"}
