import {
  getRecurringBlockers,
  getCompletionRates,
  getSentimentComparison,
} from "@/lib/queries";

export const dynamic = "force-dynamic";

export default async function InsightsPage() {
  const [blockers, completion, sentiment] = await Promise.all([
    getRecurringBlockers(),
    getCompletionRates(),
    getSentimentComparison(),
  ]);

  return (
    <div className="space-y-12">
      <h1 className="text-2xl font-bold">Insights</h1>

      {/* Q1: Recurring Blockers */}
      <section>
        <h2 className="text-lg font-semibold mb-1">
          Recurring Blockers
        </h2>
        <p className="text-sm text-gray-500 mb-4">
          Negative themes appearing across 2+ retro boards, ranked by breadth and vote weight.
        </p>
        {blockers.length === 0 ? (
          <p className="text-gray-400 italic text-sm">
            No recurring blockers detected yet.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm bg-white border border-gray-200 rounded-xl overflow-hidden">
              <thead className="bg-gray-50">
                <tr className="text-left text-gray-600">
                  <th className="px-4 py-3 font-medium">Theme</th>
                  <th className="px-4 py-3 font-medium text-right">Mentions</th>
                  <th className="px-4 py-3 font-medium text-right">Boards Affected</th>
                  <th className="px-4 py-3 font-medium text-right">Total Votes</th>
                </tr>
              </thead>
              <tbody>
                {blockers.map((b) => (
                  <tr key={b.theme} className="border-t">
                    <td className="px-4 py-3 font-medium">{b.theme}</td>
                    <td className="px-4 py-3 text-right">{Number(b.total_mentions)}</td>
                    <td className="px-4 py-3 text-right">{Number(b.boards_affected)}</td>
                    <td className="px-4 py-3 text-right">{Number(b.total_votes)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {/* Q2: Completion Rates */}
      <section>
        <h2 className="text-lg font-semibold mb-1">
          Action-Item Completion Rate
        </h2>
        <p className="text-sm text-gray-500 mb-4">
          Per-team breakdown of action item statuses and overall completion percentage.
        </p>
        {completion.length === 0 ? (
          <p className="text-gray-400 italic text-sm">No action items yet.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm bg-white border border-gray-200 rounded-xl overflow-hidden">
              <thead className="bg-gray-50">
                <tr className="text-left text-gray-600">
                  <th className="px-4 py-3 font-medium">Team</th>
                  <th className="px-4 py-3 font-medium">Squad</th>
                  <th className="px-4 py-3 font-medium text-right">Total</th>
                  <th className="px-4 py-3 font-medium text-right">Done</th>
                  <th className="px-4 py-3 font-medium text-right">In Progress</th>
                  <th className="px-4 py-3 font-medium text-right">Open</th>
                  <th className="px-4 py-3 font-medium text-right">Completion %</th>
                </tr>
              </thead>
              <tbody>
                {completion.map((c) => (
                  <tr key={c.team} className="border-t">
                    <td className="px-4 py-3 font-medium">{c.team}</td>
                    <td className="px-4 py-3 text-gray-500">{c.squad_type}</td>
                    <td className="px-4 py-3 text-right">{Number(c.total_actions)}</td>
                    <td className="px-4 py-3 text-right text-green-700">{Number(c.completed)}</td>
                    <td className="px-4 py-3 text-right text-yellow-700">{Number(c.in_progress)}</td>
                    <td className="px-4 py-3 text-right text-gray-500">{Number(c.still_open)}</td>
                    <td className="px-4 py-3 text-right font-semibold">
                      {Number(c.completion_pct)}%
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {/* Q3: Sentiment Comparison */}
      <section>
        <h2 className="text-lg font-semibold mb-1">
          Team / Squad Sentiment
        </h2>
        <p className="text-sm text-gray-500 mb-4">
          Positive-to-negative feedback ratio by team, grouped by squad.
        </p>
        {sentiment.length === 0 ? (
          <p className="text-gray-400 italic text-sm">No feedback yet.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm bg-white border border-gray-200 rounded-xl overflow-hidden">
              <thead className="bg-gray-50">
                <tr className="text-left text-gray-600">
                  <th className="px-4 py-3 font-medium">Squad</th>
                  <th className="px-4 py-3 font-medium">Team</th>
                  <th className="px-4 py-3 font-medium text-right">Went Well</th>
                  <th className="px-4 py-3 font-medium text-right">Didn&apos;t Go Well</th>
                  <th className="px-4 py-3 font-medium text-right">Positive Ratio</th>
                  <th className="px-4 py-3 font-medium text-right">Boards Run</th>
                </tr>
              </thead>
              <tbody>
                {sentiment.map((s) => (
                  <tr key={s.team} className="border-t">
                    <td className="px-4 py-3 text-gray-500">{s.squad_type}</td>
                    <td className="px-4 py-3 font-medium">{s.team}</td>
                    <td className="px-4 py-3 text-right text-green-700">{Number(s.went_well)}</td>
                    <td className="px-4 py-3 text-right text-red-700">{Number(s.didnt)}</td>
                    <td className="px-4 py-3 text-right font-semibold">
                      {s.positive_ratio != null ? Number(s.positive_ratio).toFixed(2) : "—"}
                    </td>
                    <td className="px-4 py-3 text-right">{Number(s.boards_run)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}
