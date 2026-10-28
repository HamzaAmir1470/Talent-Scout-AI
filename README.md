# Talent Scout AI (version 2.0)

Learn the stack, drill real interview questions and rehearse spoken mock interviews with an AI interviewer that scores you.

    pnpm install
    pnpm infra:up      # MongoDB + Redis
    pnpm dev           # web :3000, gateway :4000, auth :4001, content :4002, scheduler :4003, AI :4004 (ws) / :4014 (tcp)

`.env` is pre-filled for local development, including a random `JWT_SECRET`. Set your own before deploying. With no `GEMINI_API_KEY` the interviewer runs in **demo mode**
(scripted questions, length-based scoring) so you can try the whole flow immediately.
Add a free key from https://aistudio.google.com/apikey for the real thing (`GEMINI_MODEL` defaults to `gemini-2.5-flash`).

## What is inside

- **Documentation** (`/learn`): 10 technologies, 44 pages and 131 interview questions in a docs-site layout.
  Sidebar tree grouped by section, article with heading anchors and callouts, "On this page" table of contents,
  code and terminal blocks with copy buttons, search (Ctrl K) and previous/next links.
  Every page ends with its interview questions, and every technology ends with a combined question list.
- **Question bank** (`/practice`): filters, self-test mode, bookmarks and progress.
- **Mock interviews** (`/schedule`, `/interview/[bookingId]`): booking, reschedule, calendar file, live voice room, scored report.
- **Reports** (`/reports`): history, trend and full transcripts.
- **Marketing site**: home, pricing, about, contact, privacy and terms.
- **Admin area** (`/admin`): overview, users, bookings, interviews, content editor and audit log. See below.
- **Light and dark mode**: follows the system by default, saved per browser, no flash on load.

## Admin area

Sign in as the administrator created from `ADMIN_EMAIL` and `ADMIN_PASSWORD` in `.env` (created on first start).
Change that password and remove it from the file after your first login. Anyone can be promoted from **Admin > Users**.

| Page | What you can do |
|---|---|
| Overview | Users, sessions, interviews, scores, AI token usage, service health, signup and interview charts, clear the cache |
| Users | Search, filter, make or remove admin, suspend or reactivate, sign out everywhere, delete an account and all its data |
| Bookings | See every booking and cancel one |
| Interviews | Open any session with its full transcript and scored report |
| Content | Edit technologies, create and edit documentation pages with a live markdown preview, manage interview questions |
| Audit log | Sign-ins, lockouts, token reuse and every admin action, kept 180 days |

Pages edited in the admin are marked `adminEdited` and are never overwritten when the built-in library updates.

## Security

- **Sign-up** needs name, email, phone number (E.164, with a country picker) and a strong password (10 to 72 characters, letters and numbers, no common passwords). Terms consent is recorded.
- **Sessions**: a 15 minute access token kept in memory only, plus a rotating refresh token in an `HttpOnly`, `SameSite=Strict` cookie. Refresh tokens are stored as SHA-256 hashes. Reusing a rotated token revokes the whole login family.
- **Brute force**: 5 failed logins lock the account for 15 minutes. Login timing and messages do not reveal whether an email exists. Rate limits at the gateway and at Nginx.
- **CSRF**: cookie endpoints also require a custom header. **XSS**: strict headers and a Content Security Policy in production.
- **Authorization**: role claim checked on every admin route, ownership checks on user data, password change signs out every device.
- **Input**: DTO validation with unknown fields rejected, request size limits, NoSQL operator injection blocked by typed validation.
- **Secrets**: services refuse to start in production with a weak `JWT_SECRET`.
- **Dependencies**: `pnpm audit --prod` reports no known vulnerabilities on Nest 11 and Next 15.

Phone numbers are collected and stored but not verified by SMS yet. Add an SMS provider (for example Twilio Verify) when you want verified numbers.

## Design system

Tokens live in `apps/web/src/app/globals.css` as CSS variables (light in `:root`, dark in `.dark`) and are exposed as Tailwind
colors in `tailwind.config.ts` (`canvas`, `surface`, `subtle`, `ink`, `muted`, `line`, `brand`, `hi`, `good`, `warn`, `bad`).
Headings use Fraunces, body text Instrument Sans and code JetBrains Mono. Site name, tagline and support email are in `apps/web/src/lib/site.ts`.

## Adding documentation

Topics live in `apps/services/content-service/src/seed/` (`core.ts`, `web.ts`, `python.ts`, `devops.ts`, `extra.ts`).
Write the page as markdown (use `~~~` fences, and `> **Tip:**`, `> **Note:**` or `> **Warning:**` for callouts), add three or more questions,
then place the topic in `LAYOUT` inside `seed/data.ts` and bump `SEED_VERSION`. The content service re-seeds itself on the next start.

## Architecture

    Browser ── HTTPS ──> Nginx ──> web (Next.js)
                           ├────> api-gateway :4000 ──TCP──> auth | content | scheduler | ai
                           └────> ai-service :4004 (Socket.IO voice room) ──TCP──> scheduler
    MongoDB: auth_db, content_db, schedule_db, interview_db    Redis: cache, Socket.IO adapter

| Service | Port | Role |
|---|---|---|
| api-gateway | 4000 | REST, JWT, rate limits, helmet, Redis read-through cache, health checks |
| auth-service | 4001 | Register, login, JWT |
| content-service | 4002 | Subjects, topics, docs, questions, auto re-seed |
| scheduler-service | 4003 | Bookings, reschedule, cancel, overlap and quota rules, missed-slot cron |
| ai-service | 4004 / 4014 | Socket.IO voice room, Gemini interviewer, scoring, reports, stats |

## How an interview runs

1. **Introduction**: a scripted welcome that names the interviewer, the role and the time, then asks **"Tell me about yourself."** A follow-up probes what you said.
2. **Experience**: a walk-through of one relevant project.
3. **Technical**: questions on the chosen technology, from fundamentals to scenarios, with follow-ups and hints.
4. **Behavioral**: a STAR question (Situation, Task, Action, Result) with a probe for any missing part.
5. **Your questions**: time for you to ask the interviewer.
6. **Wrap-up**: a polite close, then your scored report.

The server moves between stages using the clock and your answers (`ai-service/src/interview/stages.ts`), so the structure holds even if the model drifts.
The interviewer treats every candidate the same, stays job-focused and never asks about protected personal characteristics.
Reports score technical accuracy 35%, depth 25%, communication 20% and interview skills 20% (introduction, STAR answers, professionalism).

## Voice interview flow

1. Book a slot (or **Start now**). The room opens 10 minutes before the start time.
2. The room connects over Socket.IO with your JWT. Chrome and Edge use the Web Speech API for hands-free speech to text.
   Browsers without it (mainly Firefox) stream audio chunks and the server transcribes them with Gemini. Typing always works.
3. Gemini answers as a topic-specific interviewer. Text streams to the screen and is spoken sentence by sentence.
4. Ending the session scores technical accuracy (45%), depth (30%) and communication (25%) with Gemini structured output.

## Email

Set `SMTP_URL` (for example `smtps://user:pass@smtp.example.com`) and `MAIL_FROM` to send password reset links, booking confirmations and 30 minute reminders.
With no SMTP in development, the messages are printed in the `auth-service` and `scheduler-service` logs, so you can test the flows locally.

## Production checklist (built in)

- Rate limits, helmet, compression, validation, ownership checks, WebSocket JWT auth
- Redis cache for content, per-user interview and booking limits, token caps
- Session resume, duplicate-safe report generation, health endpoints, graceful shutdown
- Socket.IO Redis adapter plus Nginx `ip_hash`, so `ai-service` scales horizontally
- Docker images, `docker-compose.prod.yml`, Nginx config and a CI workflow

## Deploy

    cp .env.example .env     # set JWT_SECRET (openssl rand -base64 48), GEMINI_API_KEY, ADMIN_EMAIL, ADMIN_PASSWORD, SMTP_URL, PUBLIC_URL
    docker compose -f docker-compose.prod.yml --env-file .env up -d --build

Terminate TLS in front of Nginx. Browsers only allow microphone access over HTTPS (or localhost).
Scale the interview tier with `docker compose up -d --scale ai-service=3`.

## Before you charge money

The pricing page is live but billing is not. Add Stripe, enforce per-plan quotas in `scheduler-service` and `ai-service`,
send email reminders, and have a lawyer review the privacy policy and terms (they are plain-language drafts).
Also set a real support address in `apps/web/src/lib/site.ts`. Phone numbers are stored but not verified by SMS yet (planned for version 3).

## API

    POST /auth/register | login | refresh | logout | logout-all | change-password | forgot-password | reset-password   GET|PUT /auth/progress     GET /auth/me
    GET|PATCH|POST|PUT|DELETE /admin/...   (administrators only)
    GET  /content/subjects | topics | topics/:subject/:topic | questions
    POST /bookings   GET /bookings?view=upcoming|past   PATCH /bookings/:id/reschedule | cancel   GET /bookings/:id/ics
    GET  /interviews  /interviews/stats  /interviews/:id  /interviews/personas
    GET  /health  /health/ready
