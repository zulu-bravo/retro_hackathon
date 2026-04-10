import { prisma } from "@/lib/db";
import { NextResponse } from "next/server";

export async function GET() {
  const users = await prisma.user.findMany({
    include: { team: true },
    orderBy: [{ team: { name: "asc" } }, { name: "asc" }],
  });

  return NextResponse.json(
    users.map((u) => ({
      id: u.id,
      name: u.name,
      teamName: u.team.name,
    }))
  );
}
