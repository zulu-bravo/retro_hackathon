import { prisma } from "@/lib/db";
import { redirect } from "next/navigation";
import { getActingUserId } from "@/lib/acting-as";

export const dynamic = "force-dynamic";

async function createBoard(formData: FormData) {
  "use server";
  const teamId = formData.get("teamId") as string;
  const title = formData.get("title") as string;
  const releaseTag = formData.get("releaseTag") as string;
  const retroType = formData.get("retroType") as string;
  const sessionDate = formData.get("sessionDate") as string;
  const facilitatorId = formData.get("facilitatorId") as string;

  const board = await prisma.retroBoard.create({
    data: {
      teamId,
      facilitatorId,
      title,
      releaseTag,
      retroType,
      sessionDate: new Date(sessionDate),
      status: "active",
    },
  });
  redirect(`/boards/${board.id}`);
}

export default async function NewBoard() {
  const teams = await prisma.team.findMany({
    include: { users: { orderBy: { name: "asc" } } },
    orderBy: { name: "asc" },
  });

  const actingUserId = await getActingUserId();

  return (
    <div className="max-w-xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">Create Retro Board</h1>
      <form action={createBoard} className="space-y-5">
        <div>
          <label htmlFor="teamId" className="block text-sm font-medium mb-1">
            Team
          </label>
          <select
            name="teamId"
            id="teamId"
            required
            defaultValue={teams[0]?.id}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
          >
            {teams.map((t) => (
              <option key={t.id} value={t.id}>
                {t.name} ({t.squadType})
              </option>
            ))}
          </select>
        </div>

        <div>
          <label htmlFor="title" className="block text-sm font-medium mb-1">
            Title
          </label>
          <input
            name="title"
            id="title"
            required
            placeholder="e.g. Q2 Sprint 1 Closing Day"
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label htmlFor="releaseTag" className="block text-sm font-medium mb-1">
              Release Tag
            </label>
            <input
              name="releaseTag"
              id="releaseTag"
              required
              placeholder="e.g. 2026-Q2.1"
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            />
          </div>
          <div>
            <label htmlFor="retroType" className="block text-sm font-medium mb-1">
              Type
            </label>
            <select
              name="retroType"
              id="retroType"
              required
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            >
              <option value="closing_day">Closing Day</option>
              <option value="adhoc">Ad-hoc</option>
            </select>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label htmlFor="sessionDate" className="block text-sm font-medium mb-1">
              Session Date
            </label>
            <input
              type="date"
              name="sessionDate"
              id="sessionDate"
              required
              defaultValue={new Date().toISOString().slice(0, 10)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            />
          </div>
          <div>
            <label htmlFor="facilitatorId" className="block text-sm font-medium mb-1">
              Facilitator
            </label>
            <select
              name="facilitatorId"
              id="facilitatorId"
              required
              defaultValue={actingUserId || teams[0]?.users[0]?.id}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            >
              {teams.flatMap((t) =>
                t.users.map((u) => (
                  <option key={u.id} value={u.id}>
                    {u.name} ({t.name})
                  </option>
                ))
              )}
            </select>
          </div>
        </div>

        <button
          type="submit"
          className="w-full bg-indigo-600 text-white py-2.5 rounded-lg font-medium hover:bg-indigo-700 transition-colors"
        >
          Create Board
        </button>
      </form>
    </div>
  );
}
