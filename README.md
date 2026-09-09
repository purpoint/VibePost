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

The API starts on `http://localhost:5050`.

> On macOS, port 5000 is taken by the AirPlay Receiver, so VibePost defaults to 5050 locally.
> Render supplies its own `PORT` in production.

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

## Image Uploads

Post images are stored on Cloudinary, never in MongoDB and never on the API
server's disk — Render wipes its filesystem on every deploy, which would take
uploaded files with it. The post document keeps only the hosted URL.

`POST /api/posts` accepts either plain JSON for a text-only post, or
`multipart/form-data` with an optional `image` file:

| Field | Type | Notes |
| --- | --- | --- |
| `text` | string | Optional if an image is attached; max 1000 characters |
| `image` | file | Optional if text is given; JPG, PNG, WEBP or GIF, max 5MB |

A post must carry text, an image, or both — a request with neither is rejected.
Uploads are checked twice: the declared content type must be on the allowlist,
and the file's actual leading bytes must match a supported image format, so a
script renamed `.png` is refused.

Without Cloudinary credentials the API still runs and text-only posts work
normally; only an attempted upload reports that storage is unconfigured.

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
