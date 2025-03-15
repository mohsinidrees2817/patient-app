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

BASE_DIR = os.path.dirname(os.path.abspath(__file__))  
OUT_DIR = os.path.join(BASE_DIR, "../static/out")  

if not os.path.exists(OUT_DIR):
    raise RuntimeError(f"Directory '{OUT_DIR}' does not exist")


async def generate_summary_and_classification(row: dict):
    try:
        patient_id = row.get("Patient ID")
        if not patient_id:
            raise HTTPException(status_code=400, detail="Patient ID is required")

        summary_text = f"Final summary for patient {patient_id}. This patient is undergoing physical therapy."
        classification_text = f"High Risk"  

        for word in summary_text.split():
            yield f"summary:{word} "  
            await asyncio.sleep(0.2) 

        for word in classification_text.split():
            yield f"classification:{word} " 
            await asyncio.sleep(0.2)  

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/generate-summary")
async def get_summary_and_classification(request: Request):
    row = await request.json()
    return StreamingResponse(
        generate_summary_and_classification(row), media_type="text/plain"
    )




