# Retro Board

A web application for capturing sprint retrospective feedback, tracking action items, and surfacing trends across retros over time.

## Features

- **Retro Boards** — create Closing Day or ad-hoc retro sessions per team
- **Feedback Capture** — three columns: Went Well, Didn't Go Well, Ideas
- **AI Theme Classification** — each feedback item is auto-tagged with a theme (tooling, process, communication, etc.) via the Claude API
- **Voting** — upvote feedback items to signal importance
- **Action Items** — assign owners, due dates, and cycle status (open / in progress / done)
- **Insights Dashboard** — three trend queries:
  1. Recurring blockers (vote-weighted)
  2. Action-item completion rates per team
  3. Team / squad sentiment comparison
- **Acting-As Dropdown** — switch between seeded users without login

## Tech Stack

- **Next.js 16** (App Router, Server Components, Server Actions)
- **Prisma 7** + **SQLite** (via `@prisma/adapter-better-sqlite3`)
- **Tailwind CSS 4**
- **Anthropic SDK** (Claude Haiku for theme classification)

## Quick Start

```bash
# 1. Install dependencies
npm install

# 2. Configure environment
cp .env.example .env
# Optionally set ANTHROPIC_API_KEY for AI theme classification

# 3. Run migration (creates dev.db)
npx prisma migrate dev --name init

# 4. Generate Prisma client
npx prisma generate

# 5. Seed the database (3 teams, 9 users, 4 boards, 24 feedback items, 10 action items, 20 votes)
npx prisma db seed

# 6. Start the dev server
npm run dev
# Open http://localhost:3000
```

## Running the 3 Trend Queries (standalone)

The queries are also available as a standalone SQL file:

```bash
sqlite3 -header -column dev.db < queries.sql
```

## Project Structure

```
prisma/
  schema.prisma          # Data model (6 tables)
  seed.ts                # Deterministic seed data
  migrations/            # SQLite migration
queries.sql              # 3 standalone trend queries
src/
  app/
    page.tsx             # Dashboard — boards grouped by team
    boards/new/page.tsx  # Create board form
    boards/[id]/page.tsx # Board view with feedback + actions + voting
    insights/page.tsx    # Insights — renders Q1/Q2/Q3 as tables
    api/users/route.ts   # User list for the acting-as dropdown
  lib/
    db.ts                # PrismaClient singleton
    ai-theme.ts          # Claude API theme classifier
    queries.ts           # Raw SQL queries via prisma.$queryRaw
    acting-as.ts         # Cookie-based user identity
  components/
    ActingAsDropdown.tsx  # Top-bar user switcher
```

## Data Model

Six tables: `teams`, `users`, `retro_boards`, `feedback_items`, `action_items`, `votes`. See `prisma/schema.prisma` for the full schema.
