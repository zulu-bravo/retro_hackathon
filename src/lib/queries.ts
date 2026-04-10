import { prisma } from "./db";

export interface RecurringBlocker {
  theme: string;
  total_mentions: number;
  boards_affected: number;
  total_votes: number;
}

export interface CompletionRate {
  team: string;
  squad_type: string;
  total_actions: number;
  completed: number;
  in_progress: number;
  still_open: number;
  completion_pct: number;
}

export interface SentimentComparison {
  squad_type: string;
  team: string;
  went_well: number;
  didnt: number;
  positive_ratio: number | null;
  boards_run: number;
}

export async function getRecurringBlockers(): Promise<RecurringBlocker[]> {
  const rows = await prisma.$queryRawUnsafe<RecurringBlocker[]>(`
    SELECT
      f.ai_theme                       AS theme,
      COUNT(*)                         AS total_mentions,
      COUNT(DISTINCT f.board_id)       AS boards_affected,
      COUNT(v.id)                      AS total_votes
    FROM feedback_items f
    LEFT JOIN votes v ON v.feedback_id = f.id
    WHERE f.category = 'didnt_go_well'
      AND f.ai_theme IS NOT NULL
    GROUP BY f.ai_theme
    HAVING COUNT(DISTINCT f.board_id) >= 2
    ORDER BY boards_affected DESC, total_votes DESC, total_mentions DESC
  `);
  return rows;
}

export async function getCompletionRates(): Promise<CompletionRate[]> {
  const rows = await prisma.$queryRawUnsafe<CompletionRate[]>(`
    SELECT
      t.name                                                         AS team,
      t.squad_type,
      COUNT(a.id)                                                    AS total_actions,
      SUM(CASE WHEN a.status = 'done' THEN 1 ELSE 0 END)             AS completed,
      SUM(CASE WHEN a.status = 'in_progress' THEN 1 ELSE 0 END)      AS in_progress,
      SUM(CASE WHEN a.status = 'open' THEN 1 ELSE 0 END)             AS still_open,
      ROUND(100.0 * SUM(CASE WHEN a.status = 'done' THEN 1 ELSE 0 END)
                  / NULLIF(COUNT(a.id), 0), 1)                       AS completion_pct
    FROM action_items a
    JOIN retro_boards r ON r.id = a.board_id
    JOIN teams        t ON t.id = r.team_id
    GROUP BY t.id
    ORDER BY completion_pct DESC
  `);
  return rows;
}

export async function getSentimentComparison(): Promise<SentimentComparison[]> {
  const rows = await prisma.$queryRawUnsafe<SentimentComparison[]>(`
    SELECT
      t.squad_type,
      t.name                                                                       AS team,
      SUM(CASE WHEN f.category = 'went_well'     THEN 1 ELSE 0 END)                AS went_well,
      SUM(CASE WHEN f.category = 'didnt_go_well' THEN 1 ELSE 0 END)                AS didnt,
      ROUND(1.0 * SUM(CASE WHEN f.category = 'went_well' THEN 1 ELSE 0 END)
                / NULLIF(SUM(CASE WHEN f.category = 'didnt_go_well' THEN 1 ELSE 0 END), 0), 2)
                                                                                   AS positive_ratio,
      COUNT(DISTINCT r.id)                                                         AS boards_run
    FROM feedback_items f
    JOIN retro_boards r ON r.id = f.board_id
    JOIN teams        t ON t.id = r.team_id
    GROUP BY t.id
    ORDER BY t.squad_type, positive_ratio DESC
  `);
  return rows;
}
