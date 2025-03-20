// app/api/history/route.ts
import { prisma } from "@/lib/prisma";

export async function POST(req: Request) {
  const { userId } = await req.json();

  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: {
      conversations: {
        orderBy: { createdAt: "desc" },
      },
    },
  });

  if (!user) {
    return new Response(JSON.stringify({ conversations: [] }), { status: 200 });
  }

  return new Response(JSON.stringify({ conversations: user.conversations }), {
    status: 200,
  });
}
