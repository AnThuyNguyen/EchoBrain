# EchoBrain

```bash
# Terminal 1 (frontend)
npm install && npm run dev

# Terminal 2 (backend)
cd backend && python3 -m venv .venv && source .venv/bin/activate && pip install -r requirements.txt && cp ../.env.example .env && uvicorn main:app --host 0.0.0.0 --port 8000 --reload
```

Frontend: http://localhost:5173
Backend: http://localhost:8000
