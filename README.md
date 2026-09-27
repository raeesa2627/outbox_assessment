# Outbox Labs — Full-Stack Email Job Scheduler

A production-grade, distributed **Email Job Scheduler** built for the Outbox Labs SWE Intern Assessment.

---

## 🏗️ Architecture Overview

```
client/          → React 19 + TypeScript + Tailwind CSS (Vite)
server/          → Node.js + Express + TypeScript
  ├── BullMQ     → Distributed job queue backed by Redis
  ├── Redis      → Rate-limit atomic counters + job persistence
  ├── MongoDB    → Email job records + user data
  ├── Nodemailer → Ethereal SMTP fake account (auto-configured)
  └── Cloudinary → Image/attachment upload (local fallback)
```

---

## ✅ PRD Requirements Implemented

| Requirement | Status |
|---|---|
| Schedule emails with specific future timestamps | ✅ BullMQ delayed jobs |
| No cron jobs — use queues with delay | ✅ BullMQ `delay` option |
| Configurable delay between emails in a batch | ✅ Stagger per recipient |
| Hourly rate limiter per sender | ✅ Atomic Redis Lua sliding window |
| Jobs postponed (not dropped) when limit hit | ✅ Re-queued to next window |
| Slack alerts when rate limit reached | ✅ Incoming Webhook POST |
| Email delivery via Nodemailer | ✅ Ethereal auto account |
| Ethereal preview URL stored per email | ✅ `etherealPreviewUrl` field |
| Bulk CSV lead upload → batch scheduling | ✅ `/api/upload/leads` |
| Image/file attachments via Cloudinary | ✅ Cloudinary + local fallback |
| Google OAuth login | ✅ `google-auth-library` |
| BullMQ Live Dashboard | ✅ `/admin/queues` via @bull-board |
| Cancel a scheduled email | ✅ `DELETE /api/emails/:id` |
| MongoDB data persistence | ✅ Mongoose models |
| Multi-process Redis atomic safety | ✅ Lua eval script |

---

## 🚀 Quick Start (Local)

### Prerequisites
- Node.js v18+
- MongoDB running locally (`mongodb://127.0.0.1:27017`)
- Redis running locally (`redis://127.0.0.1:6379`)

### 1. Install Dependencies
```bash
npm install              # root (concurrently)
cd server && npm install
cd ../client && npm install
```

### 2. Configure Environment
```bash
cp .env.example .env
# Edit .env with your Google Client ID, Cloudinary creds, Slack webhook
```

### 3. Start Development Servers
```bash
# Terminal 1 — Backend (port 5000)
cd server && npm run dev

# Terminal 2 — Frontend (port 5173)
cd client && npm run dev
```

App: **http://localhost:5173**  
BullMQ Dashboard: **http://localhost:5000/admin/queues**

---

## 🔌 API Reference

| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/api/auth/google` | Google OAuth ID token login |
| `POST` | `/api/auth/demo-login` | Demo login (recruiter shortcut) |
| `GET` | `/api/auth/me` | Get current user |
| `POST` | `/api/emails/schedule` | Schedule single or batch emails |
| `GET` | `/api/emails/scheduled` | List all scheduled jobs |
| `GET` | `/api/emails/sent` | List sent/failed history |
| `GET` | `/api/emails/stats` | Dashboard stats + queue metrics |
| `DELETE` | `/api/emails/:id` | Cancel a scheduled email |
| `POST` | `/api/upload/attachment` | Upload image/file to Cloudinary |
| `POST` | `/api/upload/leads` | Parse CSV/TXT → extract emails |
| `POST` | `/api/settings` | Update Slack webhook URL |
| `POST` | `/api/settings/test-slack` | Fire test Slack alert |
| `GET` | `/admin/queues` | BullMQ live dashboard |
| `GET` | `/health` | Health check endpoint |

---

## ⚙️ Rate Limiting Design

The system uses a **Redis Lua atomic script** that checks and increments an hourly counter in a single round-trip:

1. If `counter < hourlyLimit` → increment, allow send
2. If `counter >= hourlyLimit` → do NOT increment, re-queue job to next hour window start
3. A Slack webhook alert fires immediately with details on which sender hit the limit

This design is **multi-process safe** — multiple BullMQ workers competing simultaneously will never produce a race condition on the counter.

---

## 🗂️ Project Structure

```
outbox_assignment/
├── .env.example
├── .env
├── .gitignore
├── package.json             (root scripts: dev, build, install:all)
├── server/
│   ├── src/
│   │   ├── config/          (db.ts, redis.ts, index.ts)
│   │   ├── models/          (User.ts, EmailJob.ts)
│   │   ├── services/        (mailer.ts, rateLimiter.ts, slack.ts)
│   │   ├── queues/          (emailQueue.ts)
│   │   ├── workers/         (emailWorker.ts)
│   │   ├── controllers/     (authController, emailController, uploadController, settingsController)
│   │   ├── middleware/      (auth.ts)
│   │   ├── routes/          (authRoutes, emailRoutes, uploadRoutes, settingsRoutes, index.ts)
│   │   └── index.ts         (Express app + BullMQ worker bootstrap)
│   ├── package.json
│   └── tsconfig.json
└── client/
    ├── src/
    │   ├── components/      (Sidebar, Header, ComposeModal, ScheduledList, SentList, etc.)
    │   ├── context/         (AuthContext.tsx)
    │   ├── services/        (api.ts)
    │   ├── types/           (index.ts)
    │   ├── App.tsx
    │   └── main.tsx
    ├── index.html
    ├── package.json
    ├── vite.config.ts
    └── tailwind.config.js
```

---

## 🔐 Authentication

- **Google OAuth**: Verifies Google ID tokens via `google-auth-library`. Requires `GOOGLE_CLIENT_ID` in `.env`.
- **Demo Mode**: Click "Login" on the login screen without credentials to enter as "Oliver Brown" — perfect for recruiter testing without OAuth setup.
- **JWT**: 7-day tokens stored in `localStorage`.

---

## 📧 Email Delivery (Ethereal SMTP)

Since production SMTP requires credentials, **Ethereal fake SMTP accounts** are automatically created on startup. Every email sent generates a real preview URL (e.g., `https://ethereal.email/message/xxx`) that you can open in any browser to inspect the rendered email — including HTML, attachments, and headers.

The preview URL is saved to MongoDB and shown in the "Sent" view for each email.

---

## ☁️ Cloudinary Integration

If `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, and `CLOUDINARY_API_SECRET` are set in `.env`, all file uploads go to Cloudinary and return secure CDN URLs. If credentials are missing, files are saved locally under `server/uploads/` and served as static files.

---

Built by **Raeesa** · Outbox Labs SWE Internship Assignment 2026
