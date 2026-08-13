# EchoBrain 
Voice-based study/memorizing application prototype with voice control.
Project for BroncoHacks 2026
Quick start to run locally.


```bash
# Terminal 1 (frontend)
npm install && npm run dev

# Terminal 2 (backend)
cd backend && python3 -m venv .venv && source .venv/bin/activate && pip install -r requirements.txt && cp ../.env.example .env && uvicorn main:app --host 0.0.0.0 --port 8000 --reload
```

Frontend: http://localhost:5173
Backend: http://localhost:8000



https://github.com/user-attachments/assets/1f6a514c-610d-4574-89c2-7f8c7765534e



