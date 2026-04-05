# ReadLog

Track books and audiobooks you've read.

## Features

- **Log books** — search by title/author, select, and save with format (book, audiobook, e-book) and finish date
- **Multi-source search** — searches Open Library and Google Books in parallel, deduplicates results
- **My Library** — browse and search your reading history
- **"Have I read this?"** — quick search against your own library
- **Public feed** — anonymous feed of recently logged books on the homepage
- **Google OAuth** — sign in with your Google account

## Tech stack

- Next.js 16 / React 19 / TypeScript
- Prisma 7 + PostgreSQL (Neon)
- NextAuth v5 (Google OAuth)
- Material UI 7
- Vercel

## Getting started

```bash
npm install
cp .env.example .env    # fill in your values
npx prisma generate
npx prisma db push      # or run migration SQL manually for shared databases
npm run dev
```

## External APIs

- **Open Library** — book search by title/author, no API key required
- **Google Books** — secondary search source, requires `GOOGLE_BOOKS_API_KEY`

Results from both APIs are searched in parallel and deduplicated.

## Environment variables

See [.env.example](.env.example) for all required variables.
