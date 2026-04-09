# Retro feedback tool

## Project overview

A web application that captures retrospective feedback during Closing Day or ad-hoc retros, then surfaces trends over time across teams. Built as a PM assignment exercise where the goal is to stand out among ~15 teams building the same thing.

The differentiator strategy: most teams will build a basic form + SQL dump. This tool wins on the **output side** — smarter insights, a team health score, and AI-powered theme clustering on top of a solid baseline.

---

## Assignment requirements (non-negotiable)

- User interface to capture feedback (went well, didn't go well, action items with owner)
- Working database with at least 3 closing day retro boards seeded with realistic data
- 3 runnable queries that surface meaningful patterns:
  - **Query 1** — Recurring blockers (group "didn't go well" by theme/keyword, rank by frequency)
  - **Query 2** — Action item completion rates (% done vs open, trend over time, by owner)
  - **Query 3** — Team / squad comparisons (sentiment ratio, action item volume per member)

---

## Database schema

6 tables. Use PostgreSQL or SQLite.

```sql
teams
  id            uuid PK
  name          text
  squad_type    text
  created_at    timestamp

users
  id            uuid PK
  team_id       uuid FK → teams.id
  name          text
  email         text
  role          text          -- 'facilitator' | 'member'
  created_at    timestamp

retro_boards
  id            uuid PK
  team_id       uuid FK → teams.id
  facilitator_id uuid FK → users.id
  title         text
  release_tag   text          -- free-text label e.g. "Sprint 11", "v2.4", "Q3 Closing Day"
  retro_type    text          -- 'closing_day' | 'adhoc'
  session_date  timestamp
  status        text          -- 'open' | 'closed'

feedback_items
  id            uuid PK
  board_id      uuid FK → retro_boards.id
  author_id     uuid FK → users.id
  category      text          -- 'went_well' | 'didnt_go_well'
  content       text
  ai_theme      text          -- nullable; populated by Claude API clustering
  created_at    timestamp

action_items
  id            uuid PK
  board_id      uuid FK → retro_boards.id
  owner_id      uuid FK → users.id
  description   text
  status        text          -- 'open' | 'in_progress' | 'done'
  due_date      date
  completed_at  timestamp     -- nullable; enables cycle time queries

votes
  id            uuid PK
  feedback_id   uuid FK → feedback_items.id
  user_id       uuid FK → users.id
  created_at    timestamp
```

### Key design decisions
- `release_tag` is a free-text string on `retro_boards`, not a separate entity — simpler and more flexible
- `votes` is its own table (not an integer column) — supports live voting, prevents double-votes, enables "who voted for what" queries
- `ai_theme` is nullable from day one — column exists, stays empty until the Claude API call is wired up, no migration needed later
- `completed_at` is a timestamp not just a status — enables cycle time calculation (how long to close an item)

---

## Seed data strategy

**Do not seed with placeholder text.** The 3 boards should tell a story that makes the queries interesting:

- **Board 1 — Team Alpha, "Sprint 10 Closing Day"**: A team struggling with deployment pipeline issues. Multiple "didn't go well" items about slow CI, a failed release, and unclear ownership. Several action items marked open/overdue.
- **Board 2 — Team Alpha, "Sprint 11 Closing Day"**: Same team, one sprint later. The CI blocker recurs but an action item from Sprint 10 was completed. Shows trend improvement.
- **Board 3 — Team Beta, "Q3 Closing Day"**: A different squad with different blockers (communication, unclear requirements). Enables the cross-team comparison query to surface meaningful differences.

This makes Query 1 (recurring blockers) immediately interesting, Query 2 (completion rates) show real progress, and Query 3 (team comparison) highlight genuine differences.

---

## Build sequence

Follow this order — each step is independently demonstrable:

1. **Schema + migrations** — create all 6 tables, set up indexes on FK columns and `created_at`
2. **Seed data** — 3 realistic retro boards with feedback and action items per the strategy above
3. **API layer** — REST or tRPC endpoints: create board, add feedback item, add action item, cast vote, update action item status
4. **UI — retro board** — session view with three columns (went well / didn't go well / action items), live card submission, voting
5. **UI — dashboard** — cross-team trends view with the 3 queries rendered as charts/tables
6. **3 runnable queries** — implement and expose the required analytics queries
7. **AI theme clustering** *(differentiator)* — call Claude API (`claude-sonnet-4-6`) to auto-label `ai_theme` on feedback items after a board closes

---

## Differentiators

These are what separate this tool from the other 14 teams:

### 1. AI theme clustering (highest priority)
After a board is closed, call the Anthropic API to cluster all "didn't go well" items into named themes and write the result back to `feedback_items.ai_theme`. This makes Query 1 (recurring blockers) qualitatively better — "deploy failures" as a theme is more useful than individual free-text strings.

```
POST /api/boards/:id/cluster-themes
→ calls claude-sonnet-4-6 with all feedback content
→ returns theme labels
→ writes to ai_theme column
```

### 2. Team health score
A composite score per team per sprint, displayed as a trend line:

```
health_score = (% positive feedback) - (recurring_blocker_weight) + (action_item_completion_rate)
```

Surface this in the dashboard. No other team will have a single comparable number.

### 3. Realistic seed data
See seed data strategy above. The queries should tell a story when demoed, not return empty or meaningless results.

---

## Tech stack

Keep it simple and demonstrable:

- **Backend**: Node.js + Express (or Fastify), TypeScript
- **Database**: SQLite for local dev (easy to commit and demo), PostgreSQL-compatible SQL
- **Frontend**: React + Vite, minimal styling (Tailwind or plain CSS)
- **Git**: Commit after each build sequence step so progress is visible in history

---

## Git conventions

```
feat: add retro board creation UI
feat: seed 3 closing day boards with realistic data
feat: implement recurring blockers query
feat: add AI theme clustering via Claude API
fix: prevent duplicate votes per user per feedback item
```

Commit after each completed step in the build sequence. The git history should read as a coherent build story.

---

## What "done" looks like for the demo

1. Open a new retro board for a team, set a `release_tag`
2. Add 3–4 feedback items across both categories, cast a vote
3. Add 2 action items with owners and due dates
4. Close the board → trigger AI theme clustering
5. Navigate to the dashboard → show all 3 queries with real data
6. Show the team health score trend across the 3 seeded sprints
