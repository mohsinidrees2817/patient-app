import os
from fastapi import FastAPI, Request, HTTPException
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse, JSONResponse
from pydantic import BaseModel

from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse
import asyncio


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


async def generate_summary(row: dict):
    try:
        patient_id = row.get("Patient ID")  # Extract Patient ID from the row object
        if not patient_id:
            raise HTTPException(status_code=400, detail="Patient ID is required")

        # Example summary text
        summary_text = f"Final summary for patient {patient_id}. This patient is undergoing physical therapy."

        for word in summary_text.split():  
            yield word + " "  
            await asyncio.sleep(0.2)  

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/generate-summary")
async def get_summary(request: Request):
    row = await request.json()  
    print("Received row data:", row)  
    return StreamingResponse(generate_summary(row), media_type="text/plain")


@app.post("/generate-summary")
async def get_summary(request: Request):
    row = await request.json()  
    print("Received row data:", row)  
    return StreamingResponse(generate_summary(row), media_type="text/plain")


# Mount Next.js static files AFTER defining API routes
app.mount("/", StaticFiles(directory=OUT_DIR, html=True), name="static")


# Serve index.html at the root URL
@app.get("/")
async def serve_home():
    return FileResponse(os.path.join(OUT_DIR, "index.html"))
