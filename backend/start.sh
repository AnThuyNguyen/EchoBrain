#!/usr/bin/env bash
# Start the EchoBrain backend server
# Run from the project root: bash backend/start.sh
set -e
cd "$(dirname "$0")"

if [ ! -f .venv/bin/activate ]; then
  echo "Creating virtual environment..."
  python3 -m venv .venv
fi

source .venv/bin/activate

if [ ! -f .env ]; then
  cp ../.env.example .env
  echo "Created backend/.env from .env.example — add your API keys before starting."
  exit 1
fi

echo "Installing/updating dependencies..."
pip install -r requirements.txt -q

echo "Starting EchoBrain API on http://localhost:8000"
uvicorn main:app --host 0.0.0.0 --port 8000 --reload
