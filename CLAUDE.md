# CLAUDE.md - TukTuk Platform & Professor Witthaya AI

## Project Overview
TukTuk is a multi-platform application (Web, Mobile, PC) for managing injection molding businesses (IMT Thailand). It features an AI Assistant named **Professor Witthaya** (อาจารย์ วิทยา) who provides expert advice on injection molding.

## Tech Stack
- **Frontend**: HTML5, Vanilla CSS, Javascript (PC Layout Engine), Flutter (Mobile).
- **Backend**: Go (tuktuk-backend), Firebase Cloud Functions (Node.js).
- **Database**: Firebase Firestore, Realtime Database.
- **AI**: Gemini AI (via Cloud Functions), localized knowledge base in Firestore.

## Core Services
- `functions/index.js`: Main AI logic and user quota management.
- `tuktuk-backend/`: Go-based backend for business logic and data processing.
- `public/js/app-init.js`: Main initialization logic for the web platform.
- `public/js/chat-app.js`: Implementation of the Professor Witthaya chat interface.

## AI Assistant (Professor Witthaya)
- **Role**: Injection Molding Expert (20+ years experience).
- **Knowledge Areas**: Process, Mold Design, Materials, Troubleshooting, Maintenance.
- **Tone**: Professional, helpful, practical advice in Thai.
- **Integration**: Currently using Gemini Pro with a localized knowledge base (RAG).

## Development Commands
- `npm run dev`: (Configured to run Claude Code CLI on this project)
- `firebase deploy --only functions`: Deploy AI logic changes.
- `cd tuktuk-backend && go run main.go`: Run Go backend locally.

## File Structure Conventions
- UI components: `public/*.html`
- Styles: `public/css/`
- Logic: `public/js/`
- Admin Dashboard: `admin-dashboard.html`
- Knowledge Base Management: `functions/knowledge/` (conceptual)
