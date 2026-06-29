# 📊 Training Tracker

Training Tracker is a modern, high-performance web application designed for students and interns to track daily training activities, visualize learning focus in 3D, and instantly compile print-ready monthly progress reports with the power of Google Gemini AI.

**Live Website**: [training-updater.vercel.app](https://training-updater.vercel.app)

---

## 🚀 Key Features

*   **📅 Daily Activity Logger**: Log domain-specific tasks, write descriptions, and attach screenshots or video demonstrations of your work.
*   **✨ AI Daily Log Shortener**: An inline Gemini AI assistant that takes long, wordy descriptions and refines them into 1-2 concise, professional business sentences.
*   **Sphere of Focus (3D Canvas)**: An interactive 3D particle visualization (ThreeJS/WebGL) representing your learning focus categories (domains) that rotates dynamically.
*   **📄 AI Monthly Report Summarizer**: Automatically aggregates all daily updates logged throughout the month and compiles a concise, high-level monthly report summary (under 100 words, max 4 bullet points) to print cleanly on a single page.
*   **👑 Admin Dashboard**: Admins and instructors can monitor student logs, filter domain classifications, inspect learning focus statistics, and manage monthly report compile approvals.
*   **🖨️ Print-Ready Layouts**: Print a single-page consolidated summary or a multi-page detailed daily log with trainer information headers.

---

## 🛠️ Tech Stack

*   **Frontend**: React (Vite), CSS3 Glassmorphism theme, ThreeJS / React Three Fiber.
*   **Backend**: FastAPI, SQLAlchemy ORM, Uvicorn server, Pydantic, HTTPX async clients.
*   **Database**: Supabase PostgreSQL (direct session pooler configuration).
*   **AI Engine**: Google Gemini API (`gemini-2.5-flash-lite`).

---

## ⚙️ Environment Configuration

Set up these environment variables to configure database connectivity and AI features:

```env
# Database Connection (Supabase Session Pooler)
DATABASE_URL=postgresql://postgres:[password]@db.[project-id].supabase.co:6543/postgres

# Google Gemini API Key
GEMINI_API_KEY=your_gemini_api_key_here
```

---

## 📥 Local Development Setup

### 1. Backend Setup
1. Navigate to the backend folder:
   ```bash
   cd backend
   ```
2. Install dependencies:
   ```bash
   pip install -r requirements.txt
   ```
3. Run the development server:
   ```bash
   uvicorn main:app --host 127.0.0.1 --port 2000 --reload
   ```

### 2. Frontend Setup
1. Navigate to the frontend folder:
   ```bash
   cd ../frontend
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Run the Vite development server:
   ```bash
   npm run dev
   ```

---

## ☁️ Deployment

### Backend (Render)
1. Deploy the backend folder as a **Web Service** on Render.
2. Select Python environment and set start command to:
   ```bash
   uvicorn main:app --host 0.0.0.0 --port $PORT
   ```
3. Set the `DATABASE_URL` and `GEMINI_API_KEY` environment variables in your Render Web Service settings.

### Frontend (Vercel)
1. Deploy the frontend folder to Vercel.
2. Configure `VITE_API_URL` to point to your live Render backend URL.
