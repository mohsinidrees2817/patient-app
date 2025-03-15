import os
from fastapi import FastAPI, HTTPException
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse, StreamingResponse
from fastapi.middleware.cors import CORSMiddleware
from openai import AsyncOpenAI
import asyncio
import openai

OPENAI_API_KEY = os.getenv("OPENAI_API_KEY")
if not OPENAI_API_KEY:
    raise RuntimeError("Missing OpenAI API Key. Set OPENAI_API_KEY in the environment.")

client = AsyncOpenAI(api_key=OPENAI_API_KEY)
openai.api_key = os.getenv("OPENAI_API_KEY")

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


async def stream_openai_response(prompt: str, model: str):
    """Helper function to stream OpenAI responses."""
    response = await client.chat.completions.create(
        model=model,
        messages=[{"role": "user", "content": prompt}],
        stream=True,
    )
    async for chunk in response:
        if chunk.choices:
            yield chunk.choices[0].delta.content or ""


# Step 1: Generate Summary based on patient_id
@app.get("/stream-summary")
async def stream_summary(patient_id: str):
    prompt = f"Generate a random one-line summary for patient ID {patient_id}."

    async def generate_summary():
        response = await client.chat.completions.create(
            model="gpt-3.5-turbo",
            messages=[
                {
                    "role": "system",
                    "content": "You are a helpful assistant generating one-line patient summaries.",
                },
                {"role": "user", "content": prompt},
            ],
            stream=True,
        )

        async for chunk in response:
            delta = chunk.choices[0].delta
            if delta.content:  
                yield delta.content  

    return StreamingResponse(generate_summary(), media_type="text/plain")


@app.get("/classify")
async def classify(summary: str):
    prompt = (
        "Classify the following patient summary strictly into one of these categories: "
        "'Stable', 'Critical', or 'Needs Attention'.\n"
        "Respond with ONLY the category name, no extra text.\n\n"
        f"Summary: {summary}"
    )

    async def generate_classification():
        response = await client.chat.completions.create(
            model="gpt-3.5-turbo",
            messages=[
                {
                    "role": "system",
                    "content": "You are a medical classifier. Only return 'Stable', 'Critical', or 'Needs Attention'.",
                },
                {"role": "user", "content": prompt},
            ],
            stream=True, 
        )

        async for chunk in response:
            delta = chunk.choices[0].delta
            if delta.content:
                yield delta.content 

    return StreamingResponse(generate_classification(), media_type="text/plain")


@app.get("/process/")
async def process_request(prompt: str):
    """Endpoint to handle both summary generation and classification sequentially."""
    summary = ""

    async for chunk in stream_openai_response(prompt, "gpt-3.5-turbo"):
        summary += chunk

    classification = await classify(summary)  

    return {"summary": summary, "classification": classification}


app.mount("/", StaticFiles(directory=OUT_DIR, html=True), name="static")


@app.get("/")
async def serve_home():
    return FileResponse(os.path.join(OUT_DIR, "index.html"))
