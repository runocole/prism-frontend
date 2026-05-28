# PRISM Frontend

> Recruitment and proctored assessment platform UI

Built with React 19, TanStack Router, Tailwind CSS v4, and Vite.

## Features

- **Job postings** — HR creates job posts with unique application links
- **Public application form** — candidates apply with CV, cover letter, and screening answers
- **AI screening dashboard** — view screened-in/out candidates, manual override
- **Blacklist management** — phone-based blacklist with fuzzy name fallback
- **Test builder** — MCQ and short-answer questions, PDF import, drag-and-drop
- **Proctored assessment** — webcam monitoring, fullscreen enforcement, violation tracking
- **Results review** — answer scoring, violation log, recording playback

## Stack

- React 19 + TypeScript
- TanStack Router (file-based routing)
- Tailwind CSS v4
- Vite 8
- Axios + JWT auto-refresh

## Setup

```bash
npm install
cp .env.example .env.local
# Set VITE_API_URL=http://localhost:8000/api/v1
npm start
```

## Deploy

```bash
npm run build
# Upload dist/ to your static hosting
```

## Environment

| Variable | Description |
|----------|-------------|
| `VITE_API_URL` | Backend API base URL |

## Production

- Frontend: `https://screening.oticgs.com`
- Backend: `https://pas-backend.oticgs.com`
