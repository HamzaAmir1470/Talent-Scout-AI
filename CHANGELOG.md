# Changelog

## 2.0.0

### Interviews
- Every interview now follows a structured, professional format: a welcome that ends with **"Tell me about yourself"**, a follow-up on your background, an experience question, technical questions, a behavioral (STAR) question, time for your questions, and a closing.
- The server controls the stage and the time, so the order never depends on the AI remembering it. Interviews adapt to the clock and always wrap up.
- The interviewer greets you by first name, explains the structure and time, uses STAR probing, offers hints, handles "I don't know" kindly and stays job-focused. It never asks about protected personal characteristics.
- The room shows a progress tracker and a coaching tip for the current stage.
- Reports score four criteria: technical accuracy (35%), depth (25%), communication (20%) and interview skills (20%). Interview skills cover your introduction, STAR behavioral answers and professionalism, with the missing STAR parts listed.

### Accounts and security
- Phone number at sign-up, strong password rules and terms consent.
- 15 minute access tokens held in memory, rotating HttpOnly refresh cookies with replay detection, account lockout, CSRF header, strict security headers and CSP, Nginx rate limits.
- Forgot and reset password by email, plus booking confirmation and reminder emails (SMTP, or printed to the log in development).
- Bookmarks and quiz progress sync to your account across devices.

### Admin
- New `/admin` area: overview, users, bookings, interviews with transcripts, a content editor with live markdown preview, and an audit log.

### Docs, practice and design
- Docs-site layout with 44 pages across 10 technologies, search, on-this-page contents and interview questions on every page.
- Practice page with filters, quiz mode and pagination. Rebuilt scheduling page and interview room.
- New name and visual identity, light and dark themes, pricing and company pages.

### Platform
- Upgraded to NestJS 11 and Next.js 15. `pnpm audit` reports no known vulnerabilities.

## 1.0.0
- Accounts, content service and learning library, question bank, scheduling, AI voice interview room, reports and production tooling.
