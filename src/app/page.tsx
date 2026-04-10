import { prisma } from "@/lib/db";
import Link from "next/link";

const STATUS_COLORS: Record<string, string> = {
  draft: "bg-gray-200 text-gray-700",
  active: "bg-green-100 text-green-800",
  closed: "bg-indigo-100 text-indigo-800",
};

const TYPE_LABELS: Record<string, string> = {
  closing_day: "Closing Day",
  adhoc: "Ad-hoc",
};

export const dynamic = "force-dynamic";

export default async function Dashboard() {
  const teams = await prisma.team.findMany({
    include: {
      boards: {
        include: {
          facilitator: true,
          _count: { select: { feedbackItems: true, actionItems: true } },
        },
        orderBy: { sessionDate: "desc" },
      },
    },
    orderBy: { name: "asc" },
  });

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-2xl font-bold">Dashboard</h1>
        <Link
          href="/boards/new"
          className="bg-indigo-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-indigo-700 transition-colors"
        >
          + New Board
        </Link>
      </div>

      {teams.map((team) => (
        <section key={team.id} className="mb-10">
          <h2 className="text-lg font-semibold mb-1">
            {team.name}{" "}
            <span className="text-sm font-normal text-gray-500">
              ({team.squadType})
            </span>
          </h2>
          {team.boards.length === 0 ? (
            <p className="text-gray-400 text-sm italic">No retro boards yet.</p>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 mt-3">
              {team.boards.map((board) => (
                <Link
                  key={board.id}
                  href={`/boards/${board.id}`}
                  className="block bg-white rounded-xl shadow-sm border border-gray-200 p-5 hover:shadow-md transition-shadow"
                >
                  <div className="flex items-start justify-between mb-2">
                    <h3 className="font-medium leading-tight">{board.title}</h3>
                    <span
                      className={`text-xs px-2 py-0.5 rounded-full font-medium whitespace-nowrap ml-2 ${STATUS_COLORS[board.status] || "bg-gray-100"}`}
                    >
                      {board.status}
                    </span>
                  </div>
                  <p className="text-xs text-gray-500 mb-3">
                    {TYPE_LABELS[board.retroType] || board.retroType} &middot;{" "}
                    {board.releaseTag} &middot;{" "}
                    {new Date(board.sessionDate).toLocaleDateString()}
                  </p>
                  <div className="flex gap-4 text-xs text-gray-500">
                    <span>{board._count.feedbackItems} feedback items</span>
                    <span>{board._count.actionItems} action items</span>
                  </div>
                  <p className="text-xs text-gray-400 mt-2">
                    Facilitated by {board.facilitator.name}
                  </p>
                </Link>
              ))}
            </div>
          )}
        </section>
      ))}
    </div>
  );
}
