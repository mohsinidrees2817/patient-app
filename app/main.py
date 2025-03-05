import os
from fastapi import FastAPI
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse, JSONResponse
from pydantic import BaseModel
from fastapi.middleware.cors import CORSMiddleware


app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

BASE_DIR = os.path.dirname(os.path.abspath(__file__))  # Points to backend/
OUT_DIR = os.path.join(BASE_DIR, "../static/out")  # Points to backend/static/out

# Ensure the directory exists before mounting
if not os.path.exists(OUT_DIR):
    raise RuntimeError(f"Directory '{OUT_DIR}' does not exist")


@app.get("/api/health")
async def health_check():
    return {"status": "OK", "message": "Backend is running!"}


@app.get("/api/users")
async def get_users():
    users = [
        {"id": 1, "name": "Alice", "email": "alice@example.com"},
        {"id": 2, "name": "Bob", "email": "bob@example.com"},
        {"id": 3, "name": "Charlie", "email": "charlie@example.com"},
    ]
    return JSONResponse(content={"users": users})


class User(BaseModel):
    name: str
    email: str


@app.post("/api/users")
async def create_user(user: User):
    return JSONResponse(content={"message": "User created!", "user": user.dict()})


# Mount Next.js static files AFTER defining API routes
app.mount("/", StaticFiles(directory=OUT_DIR, html=True), name="static")


# Serve index.html at the root URL
@app.get("/")
async def serve_home():
    return FileResponse(os.path.join(OUT_DIR, "index.html"))
