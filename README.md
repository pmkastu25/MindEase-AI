# 🌿 MindEase AI v2 — Emotion-Aware Well-Being Companion

A full-stack mental health web application with a beautiful **organic sage & lavender** design system, AI-powered mood analysis, CBT-based chatbot, and emotional wellness tools.

---

## 🎨 Design System

The UI uses a warm, natural palette inspired by botanical wellness:

| Token       | Value     | Usage                        |
|-------------|-----------|------------------------------|
| `--sage`    | `#7c9e8a` | Primary brand, active states |
| `--lav`     | `#9b8ec4` | Secondary, accents           |
| `--blush`   | `#e8b4b8` | Alerts, soft highlights      |
| `--sky`     | `#8ab4c8` | Calm mood, info              |
| `--cream`   | `#faf7f2` | Background base              |
| `--card`    | `rgba(255,255,255,0.82)` | Glassmorphic cards |

Typography: **Playfair Display** (headings, italic accents) + **DM Sans** (body)

---

## 🏗️ Project Structure

```
mindease2/
├── frontend/          # React 18 + Vite
│   └── src/
│       ├── App.jsx / App.css         ← Shell + design tokens
│       ├── components/
│       │   ├── Navbar.jsx/css        ← Sidebar navigation
│       │   └── Topbar.jsx/css        ← Page header bar
│       ├── context/AuthContext.jsx   ← JWT auth state
│       ├── utils/api.js              ← Fetch wrapper
│       └── pages/
│           ├── AuthPage.jsx/css      ← Login / Register
│           ├── Dashboard.jsx/css     ← Home with mood strip, charts, CBT
│           ├── Analytics.jsx/css     ← Full dashboard: heatmap, donut, stressors
│           ├── Journal.jsx/css       ← Write + AI mood analysis
│           ├── ChatBot.jsx/css       ← Conversational AI companion
│           ├── Resources.jsx/css     ← Wellness library
│           └── TherapistConnect.jsx/css ← Find therapists
│
├── backend/           # Node.js + Express
│   ├── server.js
│   ├── models/        User, Journal, Chat
│   ├── routes/        auth, journal, chat, mood
│   ├── middleware/    auth (JWT)
│   └── services/      sentiment (ML + rule-based fallback)
│
└── ml_service/        # Python Flask
    ├── app.py         ← DistilRoBERTa emotion classifier
    └── requirements.txt
```

---

## ⚡ Quick Start

### 1. Backend
```bash
cd backend
npm install
cp .env.example .env   # fill in MONGODB_URI + JWT_SECRET
npm run dev            # http://localhost:5000
```

### 2. ML Service (optional but recommended)
```bash
cd ml_service
pip install -r requirements.txt
python app.py          # http://localhost:5001
```
> Without it, the backend falls back to rule-based sentiment analysis automatically.

### 3. Frontend
```bash
cd frontend
npm install
# create .env:  VITE_API_URL=http://localhost:5000/api
npm run dev            # http://localhost:5173
```

---

## 🔌 API Reference

| Method | Endpoint                   | Auth | Description                        |
|--------|----------------------------|------|------------------------------------|
| POST   | `/api/auth/register`       | —    | Create account                     |
| POST   | `/api/auth/login`          | —    | Sign in, returns JWT               |
| GET    | `/api/journal`             | ✓    | Get journal entries                |
| POST   | `/api/journal`             | ✓    | Create entry + AI mood analysis    |
| DELETE | `/api/journal/:id`         | ✓    | Delete entry                       |
| POST   | `/api/chat`                | ✓    | Send message, get bot reply        |
| GET    | `/api/chat/history`        | ✓    | Fetch chat history                 |
| GET    | `/api/mood/stats?range=week` | ✓  | Dashboard stats                    |
| POST   | `/analyze` (ML service)    | —    | Analyse text → mood + score        |

---

## 🧠 ML Emotion Pipeline

```
User text  →  Flask API  →  DistilRoBERTa
                              ↓
                     [joy, love, fear, anger, sadness, disgust, neutral]
                              ↓
                       Map to MindEase moods
                       [happy, calm, anxious, angry, sad, neutral]
                              ↓
                      Score + Suggestion + Emotions
```

Model: `j-hartmann/emotion-english-distilroberta-base` (HuggingFace)

---

## 🚀 Deployment

**Backend → Render**
- Build: `npm install`  |  Start: `npm start`
- Add all env vars from `.env.example`

**Frontend → Vercel**
- Root: `frontend/`
- Set `VITE_API_URL=https://your-backend.onrender.com/api`

**ML Service → Railway / Render**
- Root: `ml_service/`
- Build: `pip install -r requirements.txt`  |  Start: `python app.py`

---

## 🔒 Security
- bcrypt password hashing (12 rounds)
- JWT tokens with 30-day expiry
- CORS restricted to client origin
- HTTPS in production (TLS)
- Input validation on all endpoints

---

> **Disclaimer:** MindEase AI is a supportive companion, not a substitute for professional mental health care. In crisis, please contact a licensed professional.
