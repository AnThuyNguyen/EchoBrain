import os
import io
import json

import fitz  # PyMuPDF
from docx import Document
from dotenv import load_dotenv
from fastapi import FastAPI, File, Form, HTTPException, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from groq import Groq

load_dotenv(override=True)

GROQ_API_KEY = os.getenv("GROQ_API_KEY", "").strip()
MOCK_MODE = os.getenv("MOCK_MODE", "false").lower() == "true"

# Groq client — used for both LLM (Llama 3) and STT (Whisper)
groq_client = Groq(api_key=GROQ_API_KEY) if GROQ_API_KEY and not MOCK_MODE else None

LLM_MODEL = "llama-3.3-70b-versatile"   # Groq-hosted open-source Llama 3
STT_MODEL = "whisper-large-v3"           # Groq-hosted OpenAI Whisper (free tier)

app = FastAPI(title="EchoBrain API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://127.0.0.1:5173"],
    allow_methods=["*"],
    allow_headers=["*"],
)


# ---------------------------------------------------------------------------
# Helpers — file text extraction
# ---------------------------------------------------------------------------

def extract_text(filename: str, content: bytes) -> str:
    """Extract plain text from PDF, DOCX, or TXT file bytes."""
    ext = filename.lower().rsplit(".", 1)[-1]
    if ext == "txt":
        return content.decode("utf-8", errors="replace")
    if ext == "pdf":
        doc = fitz.open(stream=content, filetype="pdf")
        text = "\n".join(page.get_text() for page in doc)
        doc.close()
        return text
    if ext in ("doc", "docx"):
        doc = Document(io.BytesIO(content))
        return "\n".join(para.text for para in doc.paragraphs)
    raise HTTPException(status_code=400, detail=f"Unsupported file type: .{ext}")


def clean_json_response(raw: str) -> str:
    """Strip markdown code fences if the model wrapped its output in ```json ... ```."""
    raw = raw.strip()
    if raw.startswith("```"):
        parts = raw.split("```")
        raw = parts[1]
        if raw.startswith("json"):
            raw = raw[4:]
    return raw.strip()


# ---------------------------------------------------------------------------
# Helpers — STT via Groq Whisper
# ---------------------------------------------------------------------------

def transcribe_audio_groq(audio_bytes: bytes, filename: str) -> str:
    """Transcribe audio using Groq-hosted Whisper large-v3."""
    # Groq expects a file-like object with a name attribute
    audio_file = io.BytesIO(audio_bytes)
    audio_file.name = filename

    result = groq_client.audio.transcriptions.create(
        file=audio_file,
        model=STT_MODEL,
        language="en",
    )
    return result.text.strip()


# ---------------------------------------------------------------------------
# Helpers — LLM via Groq Llama 3
# ---------------------------------------------------------------------------

def call_llm(system_prompt: str, user_prompt: str) -> str:
    """Send a chat completion request to Groq Llama 3."""
    response = groq_client.chat.completions.create(
        model=LLM_MODEL,
        messages=[
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": user_prompt},
        ],
        temperature=0.4,
    )
    return response.choices[0].message.content.strip()


# ---------------------------------------------------------------------------
# Helpers — Mock responses (no API calls)
# ---------------------------------------------------------------------------

def mock_concepts() -> list:
    return [
        {"name": "Photosynthesis", "description": "Process by which plants convert sunlight into chemical energy."},
        {"name": "Mitosis", "description": "Cell division producing two genetically identical daughter cells."},
        {"name": "DNA Replication", "description": "Copying of a DNA double helix into two identical molecules."},
        {"name": "Osmosis", "description": "Movement of water across a semipermeable membrane from low to high solute concentration."},
        {"name": "Enzyme Catalysis", "description": "Enzymes lower activation energy to speed up chemical reactions without being consumed."},
    ]


def mock_feedback(concept_name: str) -> dict:
    return {
        "correctPoints": [
            f"You correctly identified the core idea of {concept_name}.",
            "Your explanation was clear and easy to follow.",
        ],
        "missingPoints": [
            "You could add more detail about the specific mechanism involved.",
            "Try mentioning real-world examples to strengthen your answer.",
        ],
        "summary": f"Great effort explaining {concept_name}! You've got the fundamentals — keep adding detail and examples to deepen your understanding.",
    }


# ---------------------------------------------------------------------------
# Endpoint: POST /api/extract-concepts
# ---------------------------------------------------------------------------

@app.post("/api/extract-concepts")
async def extract_concepts(file: UploadFile = File(...)):
    """Accept a PDF/DOCX/TXT file; return a list of {name, description} concept objects."""
    content = await file.read()
    text = extract_text(file.filename or "upload.txt", content)

    if not text.strip():
        raise HTTPException(status_code=400, detail="No text content found in file.")

    if MOCK_MODE:
        return {"concepts": mock_concepts()}

    # Truncate to stay within token limits (~12 000 chars ≈ 3 000 tokens)
    text = text[:12000]

    try:
        raw = call_llm(
            system_prompt=(
                "You are a study assistant. Extract the 6-10 most important concepts "
                "from study material a student should understand. "
                "Return ONLY a valid JSON array — no markdown, no extra text. "
                'Each element: {"name": "2-6 word title", "description": "1-2 sentence definition"}.'
            ),
            user_prompt=f"Study material:\n{text}\n\nJSON array:",
        )
        concepts = json.loads(clean_json_response(raw))
    except json.JSONDecodeError as exc:
        raise HTTPException(status_code=500, detail=f"AI returned malformed JSON: {exc}") from exc
    except Exception as exc:
        raise HTTPException(status_code=500, detail=f"AI error: {str(exc)[:200]}") from exc

    if not isinstance(concepts, list):
        raise HTTPException(status_code=500, detail="AI returned unexpected format.")

    return {"concepts": concepts}


# ---------------------------------------------------------------------------
# Endpoint: POST /api/analyze
# Accepts multipart/form-data: audio file + concept_name + concept_definition
# Returns: { transcript, feedback: { correctPoints, missingPoints, summary } }
# ---------------------------------------------------------------------------

@app.post("/api/analyze")
async def analyze_explanation(
    concept_name: str = Form(...),
    concept_definition: str = Form(...),
    audio: UploadFile = File(None),
    transcript: str = Form(default=""),
):
    """
    Full pipeline:
    1. If audio is provided → transcribe with Groq Whisper (STT)
    2. Send transcript + concept to Groq Llama 3 (LLM) for structured feedback
    3. Return { transcript, feedback: { correctPoints, missingPoints, summary } }
    """
    if MOCK_MODE:
        stub_transcript = transcript or "(demo transcript — mock mode)"
        return {"transcript": stub_transcript, "feedback": mock_feedback(concept_name)}

    if not groq_client:
        raise HTTPException(status_code=503, detail="GROQ_API_KEY not configured.")

    # Step 1 — STT: transcribe audio if provided
    final_transcript = transcript
    if audio:
        audio_bytes = await audio.read()
        if audio_bytes:
            try:
                final_transcript = transcribe_audio_groq(audio_bytes, audio.filename or "recording.webm")
            except Exception as exc:
                raise HTTPException(status_code=502, detail=f"STT error: {str(exc)[:200]}") from exc

    if not final_transcript:
        final_transcript = "(no speech detected)"

    # Step 2 — LLM: structured feedback
    try:
        raw = call_llm(
            system_prompt=(
                "You are a warm, encouraging study coach giving feedback on a student's spoken explanation. "
                "Return ONLY a valid JSON object — no markdown, no extra text — with exactly these keys:\n"
                '  "correctPoints": array of strings (specific things the student got right)\n'
                '  "missingPoints": array of strings (important things they missed or were vague about)\n'
                '  "summary": a single encouraging sentence with one actionable tip'
            ),
            user_prompt=(
                f'Concept: "{concept_name}"\n'
                f"Definition: {concept_definition}\n\n"
                f"Student's explanation: {final_transcript}\n\n"
                "JSON feedback:"
            ),
        )
        feedback = json.loads(clean_json_response(raw))
    except json.JSONDecodeError as exc:
        raise HTTPException(status_code=500, detail=f"AI returned malformed JSON: {exc}") from exc
    except Exception as exc:
        raise HTTPException(status_code=500, detail=f"AI error: {str(exc)[:200]}") from exc

    return {"transcript": final_transcript, "feedback": feedback}


# ---------------------------------------------------------------------------
# Endpoint: POST /api/chat
# ---------------------------------------------------------------------------

class ChatRequest(BaseModel):
    message: str


@app.post("/api/chat")
async def chat(req: ChatRequest):
    """Study assistant chat using Groq Llama 3."""
    if MOCK_MODE:
        first_word = req.message.split()[0] if req.message else "that"
        return {
            "response": (
                f"Great question about {first_word}! "
                "In real mode, I'd give you a detailed AI answer. "
                "Set MOCK_MODE=false and add your GROQ_API_KEY to get live responses."
            )
        }

    if not groq_client:
        raise HTTPException(status_code=503, detail="GROQ_API_KEY not configured.")

    try:
        answer = call_llm(
            system_prompt=(
                "You are a friendly, knowledgeable study assistant. "
                "Answer questions clearly and concisely in 2-4 sentences. "
                "Focus on helping students understand concepts and study effectively."
            ),
            user_prompt=req.message,
        )
        return {"response": answer}
    except Exception as exc:
        raise HTTPException(status_code=500, detail=f"AI error: {str(exc)[:200]}") from exc



