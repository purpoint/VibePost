# VibePost

**Share. Connect. Engage.**

A mini full-stack social platform built for the 3W Full Stack Internship — Round 1 assignment.
Users can sign up, log in, publish posts (text, image, or both), browse a public feed, like/unlike
posts, and comment on them.

> Built with React + Vite on the frontend and Node/Express/MongoDB on the backend.
> No TailwindCSS — the entire UI is hand-written CSS Modules on a dark navy design system.

---

## Tech Stack

| Layer | Technology |
| --- | --- |
| Frontend | React, Vite, React Router, Axios, CSS Modules, Lucide icons |
| Backend | Node.js, Express, Mongoose |
| Database | MongoDB Atlas (`users` + `posts` — exactly two collections) |
| Auth | JWT + bcryptjs |
| Images | Cloudinary |
| Hosting | Vercel (frontend) · Render (backend) · MongoDB Atlas (database) |

---

## Project Structure

```
VibePost/
├── backend/     Express API — auth, posts, likes, comments
├── frontend/    React client — feed UI, composer, auth screens
└── docs/        Assignment specification documents
```

---

## Getting Started

### Prerequisites

- Node.js 18+
- A MongoDB Atlas connection string
- A Cloudinary account (only required for image uploads)

### 1. Clone

```bash
git clone https://github.com/purpoint/VibePost.git
cd VibePost
```

### 2. Backend

```bash
cd backend
npm install
cp .env.example .env   # then fill in your own values
npm run dev
```

The API starts on `http://localhost:5000`.

### 3. Frontend

```bash
cd frontend
npm install
cp .env.example .env   # then fill in your own values
npm run dev
```

The app starts on `http://localhost:5173`.

---

## Environment Variables

### `backend/.env`

| Variable | Description |
| --- | --- |
| `PORT` | Port the API listens on (defaults to 5000) |
| `MONGODB_URI` | MongoDB Atlas connection string |
| `JWT_SECRET` | Secret used to sign JWTs |
| `JWT_EXPIRES_IN` | Token lifetime, e.g. `7d` |
| `CLIENT_URL` | Allowed CORS origin(s), comma-separated |
| `CLOUDINARY_CLOUD_NAME` | Cloudinary cloud name |
| `CLOUDINARY_API_KEY` | Cloudinary API key |
| `CLOUDINARY_API_SECRET` | Cloudinary API secret |

### `frontend/.env`

| Variable | Description |
| --- | --- |
| `VITE_API_URL` | Base URL of the API, e.g. `http://localhost:5000/api` |

Real `.env` files are never committed — only `.env.example`.

---

## Documentation

Specification documents live in [`docs/`](./docs):

- [`prompt.md`](./docs/prompt.md) — assignment requirements
- [`architecture.md`](./docs/architecture.md) — system architecture
- [`design.md`](./docs/design.md) — UI/UX specification
- [`milestone.md`](./docs/milestone.md) — development milestones
- [`techstack.md`](./docs/techstack.md) — technology decisions

---

## Status

Under active development — built milestone by milestone.
