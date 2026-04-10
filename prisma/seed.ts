import "dotenv/config";
import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3";
import { PrismaClient } from "../src/generated/prisma/client.js";

const dbPath = process.env.DATABASE_URL || "file:./dev.db";
const adapter = new PrismaBetterSqlite3({ url: dbPath });
const prisma = new PrismaClient({ adapter });

async function main() {
  // --- Teams ---
  const pegasus = await prisma.team.create({
    data: {
      id: "t-pegasus-0001",
      name: "Pegasus",
      squadType: "platform",
    },
  });
  const griffin = await prisma.team.create({
    data: {
      id: "t-griffin-0002",
      name: "Griffin",
      squadType: "platform",
    },
  });
  const orca = await prisma.team.create({
    data: {
      id: "t-orca-0003",
      name: "Orca",
      squadType: "growth",
    },
  });

  // --- Users (3 per team, first is facilitator) ---
  const users = await Promise.all([
    // Pegasus
    prisma.user.create({ data: { id: "u-alice-0001", teamId: pegasus.id, name: "Alice Chen", email: "alice@example.com", role: "engineering_manager" } }),
    prisma.user.create({ data: { id: "u-bob-0002", teamId: pegasus.id, name: "Bob Park", email: "bob@example.com", role: "senior_engineer" } }),
    prisma.user.create({ data: { id: "u-cara-0003", teamId: pegasus.id, name: "Cara Lee", email: "cara@example.com", role: "engineer" } }),
    // Griffin
    prisma.user.create({ data: { id: "u-dan-0004", teamId: griffin.id, name: "Dan Ortiz", email: "dan@example.com", role: "engineering_manager" } }),
    prisma.user.create({ data: { id: "u-eva-0005", teamId: griffin.id, name: "Eva Müller", email: "eva@example.com", role: "senior_engineer" } }),
    prisma.user.create({ data: { id: "u-frank-0006", teamId: griffin.id, name: "Frank Yao", email: "frank@example.com", role: "engineer" } }),
    // Orca
    prisma.user.create({ data: { id: "u-gina-0007", teamId: orca.id, name: "Gina Rossi", email: "gina@example.com", role: "engineering_manager" } }),
    prisma.user.create({ data: { id: "u-hiro-0008", teamId: orca.id, name: "Hiro Tanaka", email: "hiro@example.com", role: "senior_engineer" } }),
    prisma.user.create({ data: { id: "u-iris-0009", teamId: orca.id, name: "Iris Nkomo", email: "iris@example.com", role: "engineer" } }),
  ]);

  const [alice, bob, cara, dan, eva, frank, gina, hiro, iris] = users;

  // --- Retro Boards (3 closing_day + 1 adhoc) ---
  const board1 = await prisma.retroBoard.create({
    data: {
      id: "b-q1-sprint1-0001",
      teamId: pegasus.id,
      facilitatorId: alice.id,
      title: "Q1 Sprint 1 Closing Day",
      releaseTag: "2026-Q1.1",
      retroType: "closing_day",
      sessionDate: new Date("2026-01-15"),
      status: "closed",
    },
  });
  const board2 = await prisma.retroBoard.create({
    data: {
      id: "b-q1-sprint2-0002",
      teamId: griffin.id,
      facilitatorId: dan.id,
      title: "Q1 Sprint 2 Closing Day",
      releaseTag: "2026-Q1.2",
      retroType: "closing_day",
      sessionDate: new Date("2026-02-12"),
      status: "closed",
    },
  });
  const board3 = await prisma.retroBoard.create({
    data: {
      id: "b-q1-sprint3-0003",
      teamId: orca.id,
      facilitatorId: gina.id,
      title: "Q1 Sprint 3 Closing Day",
      releaseTag: "2026-Q1.3",
      retroType: "closing_day",
      sessionDate: new Date("2026-03-10"),
      status: "closed",
    },
  });
  const board4 = await prisma.retroBoard.create({
    data: {
      id: "b-hotfix-0004",
      teamId: pegasus.id,
      facilitatorId: alice.id,
      title: "Hotfix Post-Mortem",
      releaseTag: "hotfix-2026-03-20",
      retroType: "adhoc",
      sessionDate: new Date("2026-03-21"),
      status: "active",
    },
  });

  // --- Feedback Items ---
  // Board 1 — Pegasus Q1.1
  const fb = await Promise.all([
    prisma.feedbackItem.create({ data: { id: "f-0001", boardId: board1.id, authorId: bob.id, category: "went_well", content: "CI pipeline ran green every day this sprint", aiTheme: "tooling" } }),
    prisma.feedbackItem.create({ data: { id: "f-0002", boardId: board1.id, authorId: cara.id, category: "went_well", content: "Great cross-team pairing sessions", aiTheme: "communication" } }),
    prisma.feedbackItem.create({ data: { id: "f-0003", boardId: board1.id, authorId: alice.id, category: "went_well", content: "Feature shipped on time with zero rollbacks", aiTheme: "quality" } }),
    prisma.feedbackItem.create({ data: { id: "f-0004", boardId: board1.id, authorId: bob.id, category: "didnt_go_well", content: "Flaky integration tests blocked merges for 2 days", aiTheme: "tooling" } }),
    prisma.feedbackItem.create({ data: { id: "f-0005", boardId: board1.id, authorId: cara.id, category: "didnt_go_well", content: "Scope crept mid-sprint without re-estimation", aiTheme: "scope" } }),
    prisma.feedbackItem.create({ data: { id: "f-0006", boardId: board1.id, authorId: alice.id, category: "didnt_go_well", content: "Late requirement changes from product", aiTheme: "process" } }),

    // Board 2 — Griffin Q1.2
    prisma.feedbackItem.create({ data: { id: "f-0007", boardId: board2.id, authorId: eva.id, category: "went_well", content: "New monitoring dashboards caught a bug before users", aiTheme: "tooling" } }),
    prisma.feedbackItem.create({ data: { id: "f-0008", boardId: board2.id, authorId: frank.id, category: "went_well", content: "Smooth handoff to QA team", aiTheme: "process" } }),
    prisma.feedbackItem.create({ data: { id: "f-0009", boardId: board2.id, authorId: dan.id, category: "went_well", content: "Team morale high after hackathon day", aiTheme: "morale" } }),
    prisma.feedbackItem.create({ data: { id: "f-0010", boardId: board2.id, authorId: eva.id, category: "didnt_go_well", content: "Build times doubled after monorepo merge", aiTheme: "tooling" } }),
    prisma.feedbackItem.create({ data: { id: "f-0011", boardId: board2.id, authorId: frank.id, category: "didnt_go_well", content: "No clear owner for the shared component library", aiTheme: "staffing" } }),
    prisma.feedbackItem.create({ data: { id: "f-0012", boardId: board2.id, authorId: dan.id, category: "didnt_go_well", content: "Sprint goals changed twice mid-sprint", aiTheme: "scope" } }),

    // Board 3 — Orca Q1.3
    prisma.feedbackItem.create({ data: { id: "f-0013", boardId: board3.id, authorId: hiro.id, category: "went_well", content: "Conversion rate experiment yielded +12% lift", aiTheme: "quality" } }),
    prisma.feedbackItem.create({ data: { id: "f-0014", boardId: board3.id, authorId: iris.id, category: "went_well", content: "Daily standups kept everyone aligned", aiTheme: "communication" } }),
    prisma.feedbackItem.create({ data: { id: "f-0015", boardId: board3.id, authorId: gina.id, category: "went_well", content: "Pair programming reduced review cycles", aiTheme: "process" } }),
    prisma.feedbackItem.create({ data: { id: "f-0016", boardId: board3.id, authorId: hiro.id, category: "didnt_go_well", content: "Staging environment went down for a full day", aiTheme: "tooling" } }),
    prisma.feedbackItem.create({ data: { id: "f-0017", boardId: board3.id, authorId: iris.id, category: "didnt_go_well", content: "On-call rotation left team understaffed", aiTheme: "staffing" } }),
    prisma.feedbackItem.create({ data: { id: "f-0018", boardId: board3.id, authorId: gina.id, category: "didnt_go_well", content: "Feature scope ballooned after stakeholder review", aiTheme: "scope" } }),

    // Board 4 — Pegasus Hotfix (adhoc)
    prisma.feedbackItem.create({ data: { id: "f-0019", boardId: board4.id, authorId: bob.id, category: "went_well", content: "Hotfix deployed within 2 hours of detection", aiTheme: "process" } }),
    prisma.feedbackItem.create({ data: { id: "f-0020", boardId: board4.id, authorId: cara.id, category: "went_well", content: "Runbook was accurate and up to date", aiTheme: "quality" } }),
    prisma.feedbackItem.create({ data: { id: "f-0021", boardId: board4.id, authorId: alice.id, category: "didnt_go_well", content: "Alert fatigue — too many noisy alerts delayed triage", aiTheme: "tooling" } }),
    prisma.feedbackItem.create({ data: { id: "f-0022", boardId: board4.id, authorId: bob.id, category: "didnt_go_well", content: "No automated rollback; had to do it manually", aiTheme: "tooling" } }),
  ]);

  // --- Action Items ---
  await Promise.all([
    // Board 1 actions
    prisma.actionItem.create({ data: { id: "a-0001", boardId: board1.id, ownerId: bob.id, description: "Quarantine flaky tests and add retry policy", status: "done", dueDate: new Date("2026-01-31"), completedAt: new Date("2026-01-28") } }),
    prisma.actionItem.create({ data: { id: "a-0002", boardId: board1.id, ownerId: alice.id, description: "Introduce sprint scope lock after day 3", status: "done", dueDate: new Date("2026-02-01"), completedAt: new Date("2026-01-30") } }),
    prisma.actionItem.create({ data: { id: "a-0003", boardId: board1.id, ownerId: cara.id, description: "Schedule mid-sprint check-in with product", status: "in_progress", dueDate: new Date("2026-02-05") } }),

    // Board 2 actions
    prisma.actionItem.create({ data: { id: "a-0004", boardId: board2.id, ownerId: eva.id, description: "Profile and optimize monorepo build caching", status: "done", dueDate: new Date("2026-02-28"), completedAt: new Date("2026-02-25") } }),
    prisma.actionItem.create({ data: { id: "a-0005", boardId: board2.id, ownerId: dan.id, description: "Assign component library ownership to Griffin", status: "open", dueDate: new Date("2026-03-01") } }),

    // Board 3 actions
    prisma.actionItem.create({ data: { id: "a-0006", boardId: board3.id, ownerId: hiro.id, description: "Add staging environment health-check cron job", status: "done", dueDate: new Date("2026-03-20"), completedAt: new Date("2026-03-18") } }),
    prisma.actionItem.create({ data: { id: "a-0007", boardId: board3.id, ownerId: gina.id, description: "Revise on-call rotation to ensure 2-person minimum", status: "done", dueDate: new Date("2026-03-25"), completedAt: new Date("2026-03-22") } }),
    prisma.actionItem.create({ data: { id: "a-0008", boardId: board3.id, ownerId: iris.id, description: "Define scope freeze policy for stakeholder reviews", status: "open", dueDate: new Date("2026-04-01") } }),

    // Board 4 actions
    prisma.actionItem.create({ data: { id: "a-0009", boardId: board4.id, ownerId: bob.id, description: "Implement automated rollback on error-rate spike", status: "in_progress", dueDate: new Date("2026-04-10") } }),
    prisma.actionItem.create({ data: { id: "a-0010", boardId: board4.id, ownerId: alice.id, description: "Audit and reduce noisy alerts by 50%", status: "done", dueDate: new Date("2026-04-05"), completedAt: new Date("2026-04-03") } }),
  ]);

  // --- Votes (clustered to make Q1 vote-weighted ordering meaningful) ---
  await Promise.all([
    // Heavy votes on tooling blockers
    prisma.vote.create({ data: { id: "v-0001", feedbackId: "f-0004", userId: alice.id } }),  // flaky tests
    prisma.vote.create({ data: { id: "v-0002", feedbackId: "f-0004", userId: cara.id } }),
    prisma.vote.create({ data: { id: "v-0003", feedbackId: "f-0010", userId: dan.id } }),   // build times
    prisma.vote.create({ data: { id: "v-0004", feedbackId: "f-0010", userId: frank.id } }),
    prisma.vote.create({ data: { id: "v-0005", feedbackId: "f-0010", userId: eva.id } }),
    prisma.vote.create({ data: { id: "v-0006", feedbackId: "f-0016", userId: gina.id } }),  // staging down
    prisma.vote.create({ data: { id: "v-0007", feedbackId: "f-0016", userId: iris.id } }),
    prisma.vote.create({ data: { id: "v-0008", feedbackId: "f-0021", userId: bob.id } }),   // alert fatigue
    prisma.vote.create({ data: { id: "v-0009", feedbackId: "f-0022", userId: alice.id } }), // no rollback
    prisma.vote.create({ data: { id: "v-0010", feedbackId: "f-0022", userId: cara.id } }),

    // Scope blockers get fewer votes
    prisma.vote.create({ data: { id: "v-0011", feedbackId: "f-0005", userId: bob.id } }),   // scope crept
    prisma.vote.create({ data: { id: "v-0012", feedbackId: "f-0012", userId: eva.id } }),   // goals changed
    prisma.vote.create({ data: { id: "v-0013", feedbackId: "f-0018", userId: hiro.id } }),  // scope balloon

    // Some positive votes
    prisma.vote.create({ data: { id: "v-0014", feedbackId: "f-0001", userId: alice.id } }), // CI green
    prisma.vote.create({ data: { id: "v-0015", feedbackId: "f-0001", userId: cara.id } }),
    prisma.vote.create({ data: { id: "v-0016", feedbackId: "f-0007", userId: frank.id } }), // monitoring
    prisma.vote.create({ data: { id: "v-0017", feedbackId: "f-0013", userId: iris.id } }),  // conversion
    prisma.vote.create({ data: { id: "v-0018", feedbackId: "f-0019", userId: alice.id } }), // fast hotfix
  ]);

  // --- Comments ---
  await Promise.all([
    prisma.comment.create({ data: { id: "c-0001", feedbackId: "f-0004", authorId: alice.id, content: "This blocked the whole team for 2 days — we need a fix before next sprint" } }),
    prisma.comment.create({ data: { id: "c-0002", feedbackId: "f-0004", authorId: cara.id, content: "Agreed. Bob is already working on quarantining the flaky ones" } }),
    prisma.comment.create({ data: { id: "c-0003", feedbackId: "f-0010", authorId: dan.id, content: "Can we split the monorepo build into parallel jobs?" } }),
    prisma.comment.create({ data: { id: "c-0004", feedbackId: "f-0016", authorId: gina.id, content: "Hiro added a health-check cron job — should prevent this recurring" } }),
    prisma.comment.create({ data: { id: "c-0005", feedbackId: "f-0021", authorId: bob.id, content: "I counted 47 alerts in one hour during the incident. Most were noise." } }),
    prisma.comment.create({ data: { id: "c-0006", feedbackId: "f-0002", authorId: bob.id, content: "The pairing sessions with Griffin were especially productive" } }),
  ]);

  console.log("Seed complete: 3 teams, 9 users, 4 boards, 22 feedback items, 10 action items, 18 votes, 6 comments");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
