import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma"; // assuming you have prisma setup under lib/prisma.ts

export async function POST(req: Request) {
  const { email } = await req.json();

  if (!email) {
    return NextResponse.json({ error: "Email is required" }, { status: 400 });
  }

  try {
    let user = await prisma.user.findUnique({
      where: { email },
    });

    

    if (!user) {
      user = await prisma.user.create({
        data: { email },
      });
    }

    return NextResponse.json({ user });
  } catch (error) {
    console.error("Error in sign-in API:", error);
    return NextResponse.json({ error: "Server Error" }, { status: 500 });
  }
}
