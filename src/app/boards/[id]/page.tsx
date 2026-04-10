import { prisma } from "@/lib/db";
import { notFound } from "next/navigation";
import { getActingUserId } from "@/lib/acting-as";
import { classifyTheme } from "@/lib/ai-theme";
import { revalidatePath } from "next/cache";

export const dynamic = "force-dynamic";

const CATEGORY_CONFIG: Record<string, { label: string; color: string; bg: string }> = {
  went_well: { label: "Went Well", color: "text-green-700", bg: "bg-green-50 border-green-200" },
  didnt_go_well: { label: "Didn't Go Well", color: "text-red-700", bg: "bg-red-50 border-red-200" },
  idea: { label: "Ideas", color: "text-blue-700", bg: "bg-blue-50 border-blue-200" },
};

const ACTION_STATUS_STYLE: Record<string, string> = {
  open: "bg-gray-100 text-gray-700",
  in_progress: "bg-yellow-100 text-yellow-800",
  done: "bg-green-100 text-green-800",
};

const NEXT_STATUS: Record<string, string> = {
  open: "in_progress",
  in_progress: "done",
  done: "open",
};

export default async function BoardPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const actingUserId = await getActingUserId();

  const board = await prisma.retroBoard.findUnique({
    where: { id },
    include: {
      team: true,
      facilitator: true,
      feedbackItems: {
        include: {
          author: true,
          votes: true,
        },
        orderBy: { createdAt: "asc" },
      },
      actionItems: {
        include: { owner: true },
        orderBy: { dueDate: "asc" },
      },
    },
  });

  if (!board) return notFound();

  const teamUsers = await prisma.user.findMany({
    where: { teamId: board.teamId },
    orderBy: { name: "asc" },
  });

  async function addFeedback(formData: FormData) {
    "use server";
    const boardId = formData.get("boardId") as string;
    const category = formData.get("category") as string;
    const content = formData.get("content") as string;
    const authorId = formData.get("authorId") as string;

    if (!content.trim()) return;

    const aiTheme = await classifyTheme(content, category);

    await prisma.feedbackItem.create({
      data: { boardId, category, content, authorId, aiTheme },
    });

    revalidatePath(`/boards/${boardId}`);
  }

  async function toggleVote(formData: FormData) {
    "use server";
    const feedbackId = formData.get("feedbackId") as string;
    const userId = formData.get("userId") as string;
    const boardId = formData.get("boardId") as string;

    const existing = await prisma.vote.findUnique({
      where: { feedbackId_userId: { feedbackId, userId } },
    });

    if (existing) {
      await prisma.vote.delete({ where: { id: existing.id } });
    } else {
      await prisma.vote.create({ data: { feedbackId, userId } });
    }

    revalidatePath(`/boards/${boardId}`);
  }

  async function addAction(formData: FormData) {
    "use server";
    const boardId = formData.get("boardId") as string;
    const description = formData.get("description") as string;
    const ownerId = formData.get("ownerId") as string;
    const dueDateStr = formData.get("dueDate") as string;

    if (!description.trim()) return;

    await prisma.actionItem.create({
      data: {
        boardId,
        description,
        ownerId,
        status: "open",
        dueDate: dueDateStr ? new Date(dueDateStr) : null,
      },
    });

    revalidatePath(`/boards/${boardId}`);
  }

  async function cycleStatus(formData: FormData) {
    "use server";
    const actionId = formData.get("actionId") as string;
    const currentStatus = formData.get("currentStatus") as string;
    const boardId = formData.get("boardId") as string;
    const newStatus = NEXT_STATUS[currentStatus] || "open";

    await prisma.actionItem.update({
      where: { id: actionId },
      data: {
        status: newStatus,
        completedAt: newStatus === "done" ? new Date() : null,
      },
    });

    revalidatePath(`/boards/${boardId}`);
  }

  return (
    <div>
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold">{board.title}</h1>
        <p className="text-sm text-gray-500 mt-1">
          {board.team.name} ({board.team.squadType}) &middot;{" "}
          {board.releaseTag} &middot;{" "}
          {new Date(board.sessionDate).toLocaleDateString()} &middot;{" "}
          Facilitated by {board.facilitator.name} &middot;{" "}
          <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium ${board.status === "active" ? "bg-green-100 text-green-800" : board.status === "closed" ? "bg-indigo-100 text-indigo-800" : "bg-gray-200 text-gray-700"}`}>
            {board.status}
          </span>
        </p>
      </div>

      {/* Feedback columns */}
      <div className="grid md:grid-cols-3 gap-6 mb-10">
        {(["went_well", "didnt_go_well", "idea"] as const).map((cat) => {
          const config = CATEGORY_CONFIG[cat];
          const items = board.feedbackItems.filter((f) => f.category === cat);
          return (
            <div key={cat} className={`border rounded-xl p-4 ${config.bg}`}>
              <h2 className={`font-semibold mb-3 ${config.color}`}>
                {config.label}{" "}
                <span className="text-xs font-normal opacity-70">
                  ({items.length})
                </span>
              </h2>

              <div className="space-y-3 mb-4">
                {items.map((item) => {
                  const voteCount = item.votes.length;
                  const hasVoted = actingUserId
                    ? item.votes.some((v) => v.userId === actingUserId)
                    : false;
                  return (
                    <div
                      key={item.id}
                      className="bg-white rounded-lg p-3 shadow-sm text-sm"
                    >
                      <p>{item.content}</p>
                      <div className="flex items-center justify-between mt-2 text-xs text-gray-500">
                        <span>
                          {item.author.name}
                          {item.aiTheme && (
                            <span className="ml-2 px-1.5 py-0.5 rounded bg-gray-100 text-gray-600">
                              {item.aiTheme}
                            </span>
                          )}
                        </span>
                        <form action={toggleVote}>
                          <input type="hidden" name="feedbackId" value={item.id} />
                          <input type="hidden" name="userId" value={actingUserId || ""} />
                          <input type="hidden" name="boardId" value={board.id} />
                          <button
                            type="submit"
                            disabled={!actingUserId}
                            className={`flex items-center gap-1 px-2 py-0.5 rounded transition-colors ${hasVoted ? "bg-indigo-100 text-indigo-700" : "hover:bg-gray-100"}`}
                          >
                            <span>{hasVoted ? "\u25B2" : "\u25B3"}</span>
                            <span>{voteCount}</span>
                          </button>
                        </form>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Add feedback form */}
              <form action={addFeedback} className="flex gap-2">
                <input type="hidden" name="boardId" value={board.id} />
                <input type="hidden" name="category" value={cat} />
                <input type="hidden" name="authorId" value={actingUserId || ""} />
                <input
                  name="content"
                  placeholder={`Add ${config.label.toLowerCase()}...`}
                  required
                  className="flex-1 border border-gray-300 rounded-lg px-3 py-1.5 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                />
                <button
                  type="submit"
                  disabled={!actingUserId}
                  className="bg-indigo-600 text-white px-3 py-1.5 rounded-lg text-sm font-medium hover:bg-indigo-700 transition-colors disabled:opacity-40"
                >
                  Add
                </button>
              </form>
            </div>
          );
        })}
      </div>

      {/* Action Items */}
      <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
        <h2 className="text-lg font-semibold mb-4">
          Action Items{" "}
          <span className="text-sm font-normal text-gray-500">
            ({board.actionItems.length})
          </span>
        </h2>

        {board.actionItems.length > 0 && (
          <div className="overflow-x-auto mb-6">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b text-left text-gray-500">
                  <th className="py-2 pr-4 font-medium">Description</th>
                  <th className="py-2 pr-4 font-medium">Owner</th>
                  <th className="py-2 pr-4 font-medium">Due</th>
                  <th className="py-2 pr-4 font-medium">Status</th>
                </tr>
              </thead>
              <tbody>
                {board.actionItems.map((action) => (
                  <tr key={action.id} className="border-b last:border-0">
                    <td className="py-2.5 pr-4">{action.description}</td>
                    <td className="py-2.5 pr-4 text-gray-600">
                      {action.owner.name}
                    </td>
                    <td className="py-2.5 pr-4 text-gray-500">
                      {action.dueDate
                        ? new Date(action.dueDate).toLocaleDateString()
                        : "—"}
                    </td>
                    <td className="py-2.5 pr-4">
                      <form action={cycleStatus} className="inline">
                        <input type="hidden" name="actionId" value={action.id} />
                        <input type="hidden" name="currentStatus" value={action.status} />
                        <input type="hidden" name="boardId" value={board.id} />
                        <button
                          type="submit"
                          className={`text-xs px-2.5 py-1 rounded-full font-medium cursor-pointer hover:opacity-80 transition-opacity ${ACTION_STATUS_STYLE[action.status] || "bg-gray-100"}`}
                        >
                          {action.status.replace("_", " ")}
                        </button>
                      </form>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Add action item */}
        <form action={addAction} className="flex flex-wrap gap-3 items-end">
          <input type="hidden" name="boardId" value={board.id} />
          <div className="flex-1 min-w-[200px]">
            <label className="block text-xs font-medium text-gray-500 mb-1">
              Description
            </label>
            <input
              name="description"
              required
              placeholder="What needs to be done?"
              className="w-full border border-gray-300 rounded-lg px-3 py-1.5 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            />
          </div>
          <div className="w-40">
            <label className="block text-xs font-medium text-gray-500 mb-1">
              Owner
            </label>
            <select
              name="ownerId"
              required
              defaultValue={actingUserId || teamUsers[0]?.id}
              className="w-full border border-gray-300 rounded-lg px-3 py-1.5 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            >
              {teamUsers.map((u) => (
                <option key={u.id} value={u.id}>
                  {u.name}
                </option>
              ))}
            </select>
          </div>
          <div className="w-40">
            <label className="block text-xs font-medium text-gray-500 mb-1">
              Due Date
            </label>
            <input
              type="date"
              name="dueDate"
              className="w-full border border-gray-300 rounded-lg px-3 py-1.5 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            />
          </div>
          <button
            type="submit"
            disabled={!actingUserId}
            className="bg-indigo-600 text-white px-4 py-1.5 rounded-lg text-sm font-medium hover:bg-indigo-700 transition-colors disabled:opacity-40"
          >
            Add Action
          </button>
        </form>
      </div>
    </div>
  );
}
