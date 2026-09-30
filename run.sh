#!/bin/bash
# ─────────────────────────────────────────────────────────────────
# Sanjeevani Grid — One-command launcher
# Usage: ./run.sh
# Starts backend (:8000) and frontend (:5173)
# ─────────────────────────────────────────────────────────────────
set -e

ROOT="$(cd "$(dirname "$0")" && pwd)"
echo "🏥  Sanjeevani Grid — Starting…"
echo "================================================"

# ── Backend setup ────────────────────────────────────────────────
echo ""
echo "📦  Setting up Python backend…"
cd "$ROOT/backend"

if [ ! -d ".venv" ]; then
    python3 -m venv .venv
fi
source .venv/bin/activate
pip install -q -r requirements.txt

# Generate synthetic data
echo ""
echo "📊  Generating synthetic data…"
python3 data_gen.py

# Start backend (background)
echo ""
echo "🚀  Starting backend on :8000…"
python3 main.py &
BACKEND_PID=$!

# ── Frontend setup ───────────────────────────────────────────────
echo ""
echo "🎨  Setting up React frontend…"
cd "$ROOT/frontend"

if [ ! -d "node_modules" ]; then
    npm install
fi

# Start frontend (background)
echo ""
echo "🌐  Starting frontend on :5173…"
npm run dev &
FRONTEND_PID=$!

# ── Cleanup on exit ──────────────────────────────────────────────
cleanup() {
    echo ""
    echo "🛑  Shutting down…"
    kill $BACKEND_PID 2>/dev/null || true
    kill $FRONTEND_PID 2>/dev/null || true
    exit 0
}
trap cleanup SIGINT SIGTERM

echo ""
echo "================================================"
echo "✅  Sanjeevani Grid is running!"
echo "   Frontend: http://localhost:5173"
echo "   Backend:  http://localhost:8000"
echo "   API docs: http://localhost:8000/docs"
echo ""
echo "Press Ctrl+C to stop."
echo "================================================"

# Wait for either process
wait
