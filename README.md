# Aethelgard: Premium Competitive Quiz Platform
### Single-Service Unified Deployment on Render (Next.js 14 + FastAPI + PostgreSQL)

A high-end, intellectually challenging competition platform featuring 50-question master rounds (25 Advanced Scripture + 25 Elite General Knowledge), synchronized voice text-to-speech with a strict 20-second post-voice countdown timer, anti-cheat server-side evaluation, comprehensive scorecards, and an admin question bank bulk-importer for ChatGPT-generated JSON files.

---

## 🏛️ Unified Architecture: 1 Project → 1 Render Web Service → 1 Public URL

The platform is engineered specifically for **Single-Service Deployment on Render**:

```
                       User Browser / Public Traffic
                                    │
                                    ▼ (HTTPS Port 443 / $PORT)
            ┌───────────────────────────────────────────────┐
            │   Render Web Service (Single Container/VM)    │
            │                                               │
            │   ┌────────────────────────────────────────┐  │
            │   │ Next.js 14 Frontend                    │  │
            │   │ • Serves UI, Arena, Scorecards, Admin  │  │
            │   │ • Next.js Rewrites: /api/* -> :8000    │  │
            │   └──────────────────┬─────────────────────┘  │
            │                      │ (Internal Loopback)    │
            │                      ▼                        │
            │   ┌────────────────────────────────────────┐  │
            │   │ FastAPI Python Backend (:8000)         │  │
            │   │ • Anti-cheat question sanitization     │  │
            │   │ • JWT authentication & bcrypt hashing  │  │
            │   │ • Server-side scoring & timer audits   │  │
            │   │ • ChatGPT JSON bulk-import validator   │  │
            │   └──────────────────┬─────────────────────┘  │
            │                      │                        │
            └──────────────────────┼────────────────────────┘
                                   ▼
                       PostgreSQL (or SQLite Local)
```

- **One Single Public Domain**: All requests go to your single Render URL (`https://your-service.onrender.com`).
- **Internal Reverse Proxy**: Next.js automatically rewrites `/api/*`, `/docs`, and `/openapi.json` to the internal FastAPI service listening on `127.0.0.1:8000`.
- **Zero CORS / Domain Hassles**: No separate frontend or backend deployment URLs required.
- **Unified Supervisor**: `run_production.py` boots FastAPI, verifies health on `http://127.0.0.1:8000/api/health`, initializes/seeds the database, and boots Next.js on Render's `$PORT`.

---

## 🚀 One-Click Deployment on Render

### Method A: Render Blueprint (`render.yaml`) — Recommended
1. Push this repository to GitHub or GitLab.
2. In the Render Dashboard, click **New +** ➔ **Blueprint**.
3. Select your repository.
4. Render will parse [`render.yaml`](./render.yaml) and automatically configure:
   - **Web Service**: `aethelgard-quiz-platform` (Environment: Python / Node.js)
   - **Managed Database**: PostgreSQL (`aethelgard-postgres`)
5. Click **Apply**. Render will run `./build.sh` and boot `python run_production.py`.

### Method B: Manual Web Service Setup on Render
1. In Render Dashboard, click **New +** ➔ **Web Service**.
2. Connect your Git repository.
3. Configure the settings:
   - **Name**: `aethelgard-quiz-platform`
   - **Language / Environment**: `Python`
   - **Build Command**: `chmod +x build.sh && ./build.sh`
   - **Start Command**: `python run_production.py`
   - **Health Check Path**: `/api/health`
4. Add Environment Variables:
   - `PYTHON_VERSION`: `3.11.9`
   - `NODE_VERSION`: `20.11.0`
   - `NODE_ENV`: `production`
   - `SECRET_KEY`: `<generate-a-random-secret>`
   - `DATABASE_URL`: `<your-render-postgresql-connection-string>` *(If omitted, defaults to SQLite automatically)*
5. Click **Create Web Service**.

---

## 🔑 Pre-Seeded Evaluator Accounts

When first started, the database automatically initializes with **Round 1 (50 questions)** and two evaluation accounts:

| Role | Username | Password | Access Capabilities |
| :--- | :--- | :--- | :--- |
| **Director / Admin** | `admin` | `AdminPass2026!` | Access to Admin Question Bank, ChatGPT Bulk Importer, schema validator |
| **Championship Scholar** | `scholar` | `ScholarPass2026!` | Standard competitor access, live 50-Q arena, scorecard review |

*(One-click demo login buttons are also available on the Login page for instant evaluation!)*

---

## 🎙️ Voice Narration + 20-Second Timer System

1. **Automatic Narration**: When a question loads, the browser's Web Speech API (`SpeechSynthesis`) immediately narrates the question text and all four options (A, B, C, D).
2. **Synchronized 20s Window**: The 20-second countdown begins **ONLY AFTER** the voice finishes reading the question.
3. **Replay Audio**: The participant can click **"Replay Audio"** at any moment to repeat speech without resetting the active countdown timer.
4. **Skip to Timer / Mute**: Participants can mute voice or skip narration to start the 20-second timer immediately.
5. **Auto-Proceed Timeout**: If no option is confirmed within 20 seconds, the question is automatically scored as unanswered (0 pts), stored in the database, and the platform advances to the next challenge.

---

## 🤖 ChatGPT Question Bank JSON Schema & Import

Per competition requirements, all questions originate from ChatGPT-generated JSON files.

### ChatGPT Prompt Template
Copy and paste this prompt into ChatGPT to generate new 50-question rounds:

```text
Please generate a 50-question master quiz competition JSON file adhering strictly to this schema:

{
  "round_number": 2,
  "title": "Championship Round 2 - Prophetic Literature & Planetary Cosmologies",
  "description": "50 high-difficulty questions: 25 Bible Knowledge + 25 General Knowledge.",
  "questions": [
    {
      "question_order": 1,
      "category": "Bible Knowledge",
      "difficulty": "Advanced",
      "question_text": "In the Book of Daniel, which angel explains the vision of the ram and goat in chapter 8?",
      "options": {
        "A": "Michael",
        "B": "Gabriel",
        "C": "Raphael",
        "D": "Uriel"
      },
      "correct_answer": "B",
      "explanation": "Daniel 8:16 records a voice commanding Gabriel to explain the vision.",
      "bible_reference": "Daniel 8:16"
    }
  ]
}

STRICT CRITERIA:
1. Exactly 50 questions in the array.
2. Questions 1 to 25 MUST be "Bible Knowledge" (Advanced) with exact bible_reference.
3. Questions 26 to 50 MUST be "General Knowledge" (Astrophysics, world history, classical literature, advanced science, philosophy) with "bible_reference": null.
4. Exactly four options per question keyed "A", "B", "C", "D". Only one option correct.
5. "correct_answer" must be strictly "A", "B", "C", or "D".
6. Output raw JSON only.
```

### Ready-to-Test Sample Rounds
- [`backend/app/seed.py`](./backend/app/seed.py): Round 1 (50 questions: 25 Bible + 25 GK) — Seeded by default.
- [`sample_rounds/round_2_masters.json`](./sample_rounds/round_2_masters.json): Round 2 (50 questions: 25 Bible + 25 GK) — Ready to test in the Admin Bulk Importer.

---

## 💻 Local Development & Testing

### Option A: Run Unified Production locally
```bash
# 1. Activate Python virtualenv
.\venv\Scripts\activate   # (Windows) or source venv/bin/activate (Linux/Mac)

# 2. Build frontend once
cd frontend && npm run build && cd ..

# 3. Start unified service (FastAPI + Next.js on 1 process)
python run_production.py
```
Open [http://localhost:3000](http://localhost:3000).

### Option B: Run Hot-Reload Dev Mode
```bash
python dev.py
```
Starts FastAPI on `:8000` with hot-reload and Next.js Dev on `:3000`.

### Option C: Run Full Verification Suite
```bash
python test_full_platform.py
```
Validates authentication, anti-cheat question sanitization, 50-question simulation, scoring, daily repeat lockout, and the ChatGPT bulk importer.

---

## 🛡️ Anti-Cheat & Security Rules Enforced

1. **Server-Side Scoring**: Correct answers and explanations are stored strictly on the backend and are NEVER exposed to participants during active quiz taking.
2. **Anti-Duplicate Submission**: Backend rejects any attempt to submit multiple answers to the same question.
3. **Daily Round Lock**: Competitors may only complete the daily round once per day. Subsequent attempts redirect to their detailed scorecard.
4. **Unanswered Timeouts**: Handled with server timestamps and 0-score registration upon 20-second expiry.
