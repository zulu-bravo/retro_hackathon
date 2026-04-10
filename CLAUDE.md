# Retro feedback tool

## Project overview

A web application that captures retrospective feedback during Closing Day or ad-hoc retros, then surfaces trends over time across teams. Built as a PM assignment exercise where the goal is to stand out among ~15 teams building the same thing.

The differentiator strategy: most teams will build a basic form + SQL dump. This tool wins on the **output side** — smarter insights and AI-powered theme clustering on top of a solid baseline.

---

## Tech stack (as built)

- **Framework**: Next.js 16 (App Router, TypeScript, Server Components + Server Actions)
- **Database**: SQLite via Prisma 7 + `@prisma/adapter-better-sqlite3`
- **Styling**: Tailwind CSS 4
- **AI**: Anthropic SDK (`claude-haiku-4-5-20251001`) for theme classification
- **Auth**: No real login — cookie-based "Acting as" dropdown for user identity

---

## Local setup

```bash
npm install
cp .env.example .env          # set ANTHROPIC_API_KEY if you want AI themes
npx prisma generate
npx prisma migrate dev --name init
npx prisma db seed
npm run dev                    # http://localhost:3000
```

Run the 3 standalone queries:
```bash
sqlite3 -header -column dev.db < queries.sql
```

---

## Assignment requirements (non-negotiable)

- User interface to capture feedback (went well, didn't go well, action items with owner)
- Working database with at least 3 closing day retro boards seeded with realistic data
- 3 runnable queries that surface meaningful patterns:
  - **Query 1** — Recurring blockers (group "didn't go well" by theme, rank by frequency, vote-weighted)
  - **Query 2** — Action item completion rates (% done vs open, per team)
  - **Query 3** — Team / squad comparisons (sentiment ratio: went_well / didn't_go_well)

---

## Database schema (Prisma)

6 tables, UUID primary keys. Defined in `prisma/schema.prisma`.
Tables use `@@map` to keep snake_case names so raw SQL in `queries.sql` matches the ERD.

| Table | Key columns | Notes |
|---|---|---|
| `teams` | id, name, squad_type, created_at | |
| `users` | id, team_id FK, name, email, role, created_at | |
| `retro_boards` | id, team_id FK, facilitator_id FK, title, release_tag, retro_type, session_date, status | retro_type: closing_day / adhoc; status: draft / active / closed |
| `feedback_items` | id, board_id FK, author_id FK, category, content, ai_theme, created_at | category: went_well / didnt_go_well / idea; ai_theme set by Claude API |
| `action_items` | id, board_id FK, owner_id FK, description, status, due_date, completed_at | status: open / in_progress / done |
| `votes` | id, feedback_id FK, user_id FK, created_at | unique(feedback_id, user_id) prevents double-votes |

### Key design decisions
- `release_tag` is free-text on `retro_boards`, not a separate entity
- `votes` is its own table (not an integer column) — prevents double-votes, enables "who voted for what"
- `ai_theme` is nullable — populated by Claude API at write time; `null` if API key missing or call fails
- `completed_at` is a timestamp not just a status — enables cycle time calculations
- Cascade deletes on feedback_items and action_items from their parent board

---

## Seed data

Seeded via `prisma/seed.ts` with deterministic UUIDs. Run with `npx prisma db seed`.

- **3 teams** across 2 squads: Pegasus + Griffin (platform), Orca (growth)
- **9 users** (3 per team, one facilitator each)
- **4 retro boards**: 3 closing_day + 1 adhoc
  - Pegasus Q1.1 (closed), Griffin Q1.2 (closed), Orca Q1.3 (closed), Pegasus Hotfix (active)
- **24 feedback items** with intentional ai_theme repetition (`tooling` appears in all 4 boards)
- **10 action items** with mixed statuses (~60% done, 20% in_progress, 20% open)
- **20 votes** clustered on tooling blockers to make vote-weighted ordering visible

---

## The 3 trend queries

Stored in `queries.sql` (standalone) and `src/lib/queries.ts` (rendered on `/insights`).

1. **Q1 — Recurring blockers**: Groups `didnt_go_well` items by `ai_theme`, counts mentions and distinct boards, sums votes. Only shows themes appearing in 2+ boards. Ordered by breadth then vote weight.
2. **Q2 — Action-item completion rate**: Per team, shows total/done/in_progress/open counts and completion percentage.
3. **Q3 — Team/squad sentiment**: Positive-to-negative feedback ratio by team, grouped by squad_type.

---

## AI theme classification

- **File**: `src/lib/ai-theme.ts`
- **Model**: `claude-haiku-4-5-20251001`
- **When**: Called inside the `addFeedback` server action before inserting the feedback item
- **Themes**: `tooling | process | communication | scope | staffing | quality | morale | other`
- **Fallback**: If `ANTHROPIC_API_KEY` is unset or the call fails, item is saved with `ai_theme = null`

---

## Project structure

```
prisma/
  schema.prisma            # 6-table data model
  seed.ts                  # Deterministic seed data
  migrations/              # SQLite migration
queries.sql                # 3 standalone trend queries (run with sqlite3)
src/
  app/
    page.tsx               # Dashboard — boards grouped by team
    boards/new/page.tsx    # Create board form + server action
    boards/[id]/page.tsx   # Board view: 3 feedback columns + voting + action items
    insights/page.tsx      # Insights — renders Q1/Q2/Q3 as tables
    api/users/route.ts     # User list for the acting-as dropdown
  lib/
    db.ts                  # PrismaClient singleton (better-sqlite3 adapter)
    ai-theme.ts            # Claude API theme classifier
    queries.ts             # Raw SQL queries via prisma.$queryRawUnsafe
    acting-as.ts           # Cookie read/write for user identity
  components/
    ActingAsDropdown.tsx   # Top-bar user switcher (client component)
```

---

## Routes / pages

| Route | Type | Description |
|---|---|---|
| `GET /` | Server Component | Dashboard: boards grouped by team with status chips |
| `GET /boards/new` | Server Component | Create-board form (team, title, release_tag, type, date, facilitator) |
| `GET /boards/[id]` | Server Component | Board view with 3 feedback columns + vote buttons + action items table |
| `GET /insights` | Server Component | Renders all 3 trend queries as tables |
| `GET /api/users` | Route Handler | JSON list of users for the ActingAsDropdown |

### Server actions (boards/[id])
- `addFeedback` — creates feedback item, calls `classifyTheme` for ai_theme
- `toggleVote` — insert or delete vote (unique constraint enforced)
- `addAction` — creates action item with owner and optional due date
- `cycleStatus` — cycles action: open → in_progress → done → open; sets `completedAt` when done

---

## Git conventions

```
feat: add retro board creation UI
feat: seed 3 closing day boards with realistic data
feat: implement recurring blockers query
feat: add AI theme clustering via Claude API
fix: prevent duplicate votes per user per feedback item
```

---

## What "done" looks like for the demo

1. Open http://localhost:3000 — dashboard shows 4 seeded boards across 3 teams
2. Pick a user in the "Acting as" dropdown
3. Click into a board — see 3 feedback columns with existing items and vote counts
4. Add a "Went Well" and a "Didn't Go Well" item — ai_theme auto-classified (if API key set)
5. Upvote a feedback item — vote count increments, filled arrow appears
6. Add an action item with owner and due date, cycle its status to "done"
7. Navigate to `/insights` — all 3 query tables populated with meaningful aggregates
8. Run `sqlite3 dev.db < queries.sql` from CLI — same results, proving queries are standalone

---

## Future enhancements (not yet built)

- **Team health score** — composite metric: `(% positive feedback) - (recurring_blocker_weight) + (action_item_completion_rate)` displayed as trend line
- **Real auth / SSO** — replace acting-as dropdown with actual login
- **Board close action** — explicit close button that triggers batch AI theme reclassification
- **Charts** — visualize insights with bar/line charts instead of tables
- **Export** — CSV/PDF export of query results
