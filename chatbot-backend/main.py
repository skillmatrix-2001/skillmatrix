from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from groq import Groq
from pathlib import Path
from typing import List, Optional
from dotenv import load_dotenv
import os

# Explicitly load .env from same folder as this file
load_dotenv(Path(__file__).parent / ".env")

app = FastAPI(title="Campus Chatbot API", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Check API key exists before starting
api_key = os.getenv("GROQ_API_KEY")
if not api_key:
    raise RuntimeError("GROQ_API_KEY is missing. Add it to chatbot-backend/.env file.")

client = Groq(api_key=api_key)

SYSTEM_PROMPT = """You are a helpful campus placement assistant for a college placement portal. 
You help students with:
- Placement preparation tips and interview advice
- Resume building guidance
- Job application processes
- Company-specific information and interview patterns
- Coding interview preparation
- Soft skills and communication
- Campus recruitment timelines and procedures

Be concise, friendly, and encouraging. Format responses with bullet points when listing multiple items.
If asked about something unrelated to placements or campus life, politely redirect to relevant topics.
"""

class Message(BaseModel):
    role: str
    content: str

class ChatRequest(BaseModel):
    messages: List[Message]
    user_context: Optional[dict] = None

class ChatResponse(BaseModel):
    reply: str
    model: str

@app.get("/")
def health_check():
    api_key_status = "loaded" if os.getenv("GROQ_API_KEY") else "MISSING"
    return {
        "status": "ok",
        "service": "Campus Chatbot API",
        "api_key": api_key_status
    }

@app.post("/chat", response_model=ChatResponse)
def chat(request: ChatRequest):
    try:
        system_content = SYSTEM_PROMPT
        if request.user_context:
            ctx = request.user_context
            system_content += f"\n\nCurrent user context: Name={ctx.get('name', 'Student')}, Department={ctx.get('dept', 'Unknown')}, Year={ctx.get('year', 'Unknown')}."

        groq_messages = [{"role": "system", "content": system_content}]
        for msg in request.messages:
            groq_messages.append({"role": msg.role, "content": msg.content})

        completion = client.chat.completions.create(
            model="llama-3.1-8b-instant",
            messages=groq_messages,
            temperature=0.7,
            max_tokens=1024,
        )

        reply = completion.choices[0].message.content
        return ChatResponse(reply=reply, model=completion.model)

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))