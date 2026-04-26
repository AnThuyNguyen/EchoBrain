import os
import io
import re
import json
from duckduckgo_search import DDGS

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


def _strip_concept_prefix(concept_name: str, line: str) -> str:
    """Remove a leading restatement of the concept name from a bullet line."""
    words = re.split(r'\s+', concept_name.strip())
    # Try matching progressively fewer leading words of the name
    for n in range(len(words), 0, -1):
        pattern = r'^' + r'[\s_]*'.join(re.escape(w) for w in words[:n]) + r'\b'
        m = re.match(pattern, line, re.IGNORECASE)
        if m:
            remainder = line[m.end():].lstrip()
            # Strip the linking verb that follows
            remainder = re.sub(
                r'^(is|are|was|were|has|have|involves?|includes?|takes?|refers?\s+to|can\s+be|consists?\s+of|means?|describes?|represents?)[\s,]+',
                '',
                remainder,
                flags=re.IGNORECASE,
            )
            if remainder:
                remainder = remainder[0].upper() + remainder[1:]
            return remainder
    return line


def _clean_concept_descriptions(concepts: list) -> list:
    """Post-process concept list: strip name restatements from every bullet."""
    for concept in concepts:
        name = concept.get('name', '')
        desc = concept.get('description', '')
        lines = desc.split('\n')
        cleaned = []
        for line in lines:
            # Separate bullet marker from content
            m = re.match(r'^(-\s*)', line)
            if m:
                content = line[m.end():]
                content = _strip_concept_prefix(name, content)
                cleaned.append(m.group(1) + content)
            else:
                cleaned.append(_strip_concept_prefix(name, line))
        concept['description'] = '\n'.join(cleaned)
    return concepts


def _escape_newlines_in_strings(s: str) -> str:
    """Replace literal newline/carriage-return characters inside JSON string values."""
    result = []
    in_string = False
    i = 0
    while i < len(s):
        c = s[i]
        if c == '\\' and in_string:          # escaped char — keep both
            result.append(c)
            i += 1
            if i < len(s):
                result.append(s[i])
            i += 1
            continue
        if c == '"':
            in_string = not in_string
            result.append(c)
        elif c == '\n' and in_string:
            result.append('\\n')
        elif c == '\r' and in_string:
            result.append('\\r')
        else:
            result.append(c)
        i += 1
    return ''.join(result)


def clean_json_response(raw: str) -> str:
    """Strip markdown fences and escape literal newlines inside JSON string values."""
    raw = raw.strip()
    if raw.startswith("```"):
        parts = raw.split("```")
        raw = parts[1]
        if raw.startswith("json"):
            raw = raw[4:]
    raw = raw.strip()
    raw = _escape_newlines_in_strings(raw)
    return raw


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
        {"name": "Photosynthesis", "description": "How plants convert sunlight into food using water and CO2.\n- Happens in chloroplasts\n- Produces glucose + oxygen\n- Requires light energy"},
        {"name": "Mitosis", "description": "Cell division that produces two genetically identical daughter cells.\n- Used for growth and repair\n- Phases: prophase → metaphase → anaphase → telophase"},
        {"name": "DNA Replication", "description": "Copying the DNA molecule so every new cell gets a full set of instructions.\n- Happens before cell division\n- Produces two identical strands"},
        {"name": "Osmosis", "description": "Water moves across a membrane toward the side with more solute.\n- Type of passive diffusion\n- Causes cells to swell or shrink"},
        {"name": "Enzyme Catalysis", "description": "Enzymes speed up reactions by lowering the energy needed to start them.\n- Not consumed in the reaction\n- Highly specific to one substrate"},
    ]


def mock_feedback(concept_name: str) -> dict:
    return {
        "rating": 7,
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
                'Each element: {"name": "2-6 word title", "description": "<intro>\\n- <bullet>\\n- <bullet>"}. '
                "Format rules (follow exactly):\n"
                "1. ONE short intro line (10-20 words max). It must be a tight definition or summary — what the concept IS or does. No filler. Do NOT restate the concept name.\n"
                "2. Then 0-3 bullet points. Use bullets ONLY when there are specific sub-items, stages, or components worth listing. Each bullet is a compact fragment (≤12 words) — can use arrows (→) for sequences or short noun phrases for lists.\n"
                "3. The intro + bullets together must contain EVERY fact a student needs to explain the concept — these are the only facts grading will use.\n"
                "4. No jargon unless necessary. No page numbers. No full sentences in bullets.\n"
                r"Separate intro from bullets and bullets from each other using the literal \n- sequence. "
                "Examples:\n"
                r'"Stages from inspiration to review, spanning ~2 years.\n- Concept → design → architecture → tools → assembly → levels → testing"'
                "\n"
                r'"One-sentence pitch capturing the core idea of the game."'
                "\n"
                r'"Complete blueprint of gameplay, story, levels, characters, and art."'
                "\n"
                r'"Three stages covering the full design process.\n- Concept paper: defines idea and feasibility\n- Design document: details the full game\n- Production document: manages schedule and budget"'
            ),
            user_prompt=f"Study material:\n{text}\n\nJSON array:",
        )
        concepts = json.loads(clean_json_response(raw))
        concepts = _clean_concept_descriptions(concepts)
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
# Returns: { transcript, feedback: { rating, correctPoints, missingPoints, summary } }
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
    3. Return { transcript, feedback: { rating, correctPoints, missingPoints, summary } }
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
                "You are an encouraging study coach grading a student's spoken explanation. "
                "The ONLY source of truth is the concept card definition provided. "
                "Do not use any outside knowledge — only grade against what is written in the concept card. "
                "Evaluate whether the student communicated the key ideas from the concept card in their own words. "
                "The student does not need to repeat the definition exactly and can use simpler language or paraphrases. "
                "correctPoints must only list things that match something explicitly on the concept card. "
                "missingPoints must only list things that ARE on the concept card but were missed or were too vague — never penalise for knowledge not shown on the card. "
                "Do not reward new concepts, mechanisms, or claims not supported by the concept card. "
                "Internally break the concept card into 3-6 key idea units and score coverage based on how many idea units the student covered. "
                "Use strict caps: coverage < 40% must be <= 4, coverage < 60% must be <= 6, coverage < 80% must be <= 8. "
                "Return ONLY a valid JSON object — no markdown, no extra text — with exactly these keys:\n"
                '  "rating": integer from 0 to 10\n'
                '  "correctPoints": array of strings (things from the card the student got right)\n'
                '  "missingPoints": array of strings (things on the card the student missed or was too vague about)\n'
                '  "summary": a single encouraging sentence with one actionable tip based on the card content'
            ),
            user_prompt=(
                f'Concept: "{concept_name}"\n'
                f"Concept card definition to grade against: {concept_definition}\n\n"
                f"Student's explanation: {final_transcript}\n\n"
                "Grade the explanation based on whether the student got the right idea from the concept card definition.\n"
                "Accept paraphrases and simpler wording.\n"
                "Do not give extra credit for new concepts not present in the concept card definition.\n"
                "Use strict coverage-based scoring and keep ratings conservative for incomplete explanations.\n"
                "Use this rubric:\n"
                "0-2 = mostly incorrect, unrelated, or adds clearly unsupported ideas\n"
                "3-4 = shows limited understanding of the concept's main idea\n"
                "5-6 = gets part of the right idea but is vague, incomplete, or mixes in unsupported ideas\n"
                "7-8 = clearly gets the right idea in their own words with only minor omissions\n"
                "9-10 = communicates the right idea very clearly, stays aligned with the concept card, and avoids unsupported additions\n\n"
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
    """Study assistant chat — searches the web then answers with Groq Llama 3."""
    if MOCK_MODE:
        first_word = req.message.split()[0] if req.message else "that"
        return {
            "response": (
                f"Great question about {first_word}! "
                "In real mode I'd search the web and give you a grounded answer. "
                "Set MOCK_MODE=false and add your GROQ_API_KEY to get live responses."
            )
        }

    if not groq_client:
        raise HTTPException(status_code=503, detail="GROQ_API_KEY not configured.")

    # Step 1 — web search for fresh, grounded context
    search_snippets = []
    try:
        with DDGS() as ddgs:
            results = list(ddgs.text(req.message, max_results=4))
        for r in results:
            title = r.get("title", "")
            body = r.get("body", "")
            url = r.get("href", "")
            if body:
                search_snippets.append(f"[{title}] ({url})\n{body}")
    except Exception:
        pass  # fall back to LLM-only if search fails

    if search_snippets:
        context_block = "\n\n".join(search_snippets)
        system = (
            "You are a study assistant that teaches based on real web sources. "
            "You have been given live search results below. "
            "Use them to give a clear, accurate, and educational answer. "
            "Explain the topic as if teaching a student. Keep it concise (3-5 sentences). "
            "At the end, cite 1-2 sources as plain URLs on their own lines prefixed with 'Source:'. "
            "Do not make up information beyond what the sources provide."
        )
        user_prompt = (
            f"Question: {req.message}\n\n"
            f"Search results:\n{context_block}\n\n"
            "Answer:"
        )
    else:
        system = (
            "You are a knowledgeable study assistant. "
            "Answer clearly and educationally in 3-5 sentences."
        )
        user_prompt = req.message

    try:
        answer = call_llm(system_prompt=system, user_prompt=user_prompt)
        return {"response": answer}
    except Exception as exc:
        raise HTTPException(status_code=500, detail=f"AI error: {str(exc)[:200]}") from exc



