# FinePrint 📋

**Don't read the fine print. Let it read itself.**

An AI-powered legal assistance app. Upload a contract or PDF (or just paste), pick an analysis mode, and get plain-English help — everything from risk scanning to clause-by-clause checklists. Built for a legal-access hackathon.

**Hackathon safety wording:** every answer is followed by “This is general information, not legal advice.”

---

## How it works

- **Google Sign-In** (Firebase Auth) gates the app — owner-only access to your own conversations.
- **Five modes**, switchable any time in the same thread:
  | Mode | Model |
  |---|---|
  | Summarize | Gemini 3.6 Flash |
  | Compare | Gemini 3.6 Flash |
  | Risk Scanner | Gemini 3.6 Flash |
  | Checklist | Gemini 3.6 Flash |
  | Ask Anything | Gemini 3.6 Flash |
- **PDF upload** is parsed **in the browser** (pdf.js) and the text is attached as context — no server worker, no upload storage.
- **Chat streams** token-by-token (Vercel AI SDK v7 UI messages over SSE).
- **Smart titles** are generated for free by Gemini on first message; you can rename or delete conversations.
- **Firestore** persists conversations + messages; free Spark plan is plenty.

## Stack

- Next.js 16 (App Router, Turbopack, Tailwind v4, standalone output)
- Vercel AI SDK v7 (`ai`, `@ai-sdk/react`, `@ai-sdk/google`)
- Firebase Auth + Firestore
- pdfjs-dist (client-side), react-markdown

## Local setup

1. Install dependencies:

   ```bash
   npm install
   ```

2. Create a Firebase project at [console.firebase.google.com](https://console.firebase.google.com):
   - Add a **Web app** and copy its config (`apiKey`, `authDomain`, `projectId`, `storageBucket`, `messagingSenderId`, `appId`).
   - Enable **Google sign-in** under Authentication → Sign-in method.
   - Create Firestore (Production mode is fine).

3. The **web API key** is the same `apiKey` from step 2 — used server-side to verify Google ID tokens. Copy it to `FIREBASE_WEB_API_KEY`.

4. Get an API key:
   - Gemini: https://aistudio.google.com/apikey (free tier)

5. Configure env:

   ```bash
   cp .env.local.example .env.local
   # fill in all values
   ```

   Leave `FIREBASE_WEB_API_KEY` empty during local dev to skip server-side token checks.

6. Run:

   ```bash
   npm run dev
   ```

   Open http://localhost:3000.

## Firestore Security Rules

Deploy the rules in `firestore.rules` so only each user's own data is readable/writable:

```bash
npm i -g firebase-tools
firebase login
firebase deploy --only firestore:rules   # add a firebase.json with your projectId first
```

Rules enforce: `conversations` and `messages` are only accessible to `request.auth.uid == ownerId`.

## Deploy on Render (free)

1. Push the repo to GitHub.
2. Render → New → **Blueprint**, pick the repo (uses `render.yaml`), or New → **Web Service** (runtime: Docker).
3. Set the env vars listed in `render.yaml` (the `NEXT_PUBLIC_*` values are inlined at build time, so set them before the first build).
4. Deploy. Done.

To verify locally the Docker image builds:

```bash
# NEXT_PUBLIC_* vars are baked in at build time, so they must be present in .env.local
docker build . -t fineprint
docker run --rm -p 3000:3000 fineprint
```

## Scripts

```bash
npm run dev        # dev server
npm run build      # production build (TypeScript + linted)
npm run start      # serve production build
npm run lint       # next/core-web-vitals + typescript
npm run test       # run vitest once
npm run test:watch # vitest watch mode
npm run typecheck  # tsc --noEmit
```

## Testing

Tests are written with [Vitest](https://vitest.dev) + Testing Library and live alongside the source in `src/__tests__/`. They cover the pure utility modules (`conv`, `modes`), server verification logic, the `/api/chat` and `/api/title` routes (auth-failure and success paths), and component smoke tests. Run them with:

```bash
npm run test
```