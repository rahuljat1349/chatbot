// app/api/history/route.ts
import { NextResponse } from "next/server";
import { supabase, Conversation, Message } from "@/lib/supabase";

export async function POST(req: Request) {
  const { userId } = await req.json();

  if (!userId) {
    return NextResponse.json({ error: "User ID is required" }, { status: 400 });
  }

  try {
    // Get conversations for the user
    const { data: conversations, error: convError } = await supabase
      .from("conversations")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false });

    if (convError) {
      console.error("Error fetching conversations:", convError);
      return NextResponse.json(
        { error: "Failed to fetch conversations" },
        { status: 500 }
      );
    }

    // Get messages for each conversation
    const conversationsWithMessages = await Promise.all(
      conversations?.map(async (conversation: Conversation) => {
        const { data: messages, error: messagesError } = await supabase
          .from("messages")
          .select("*")
          .eq("conversation_id", conversation.id)
          .order("timestamp", { ascending: true });

        if (messagesError) {
          console.error("Error fetching messages:", messagesError);
          return { ...conversation, messages: [] };
        }

        return { ...conversation, messages: messages || [] };
      }) || []
    );

    return NextResponse.json({ conversations: conversationsWithMessages });
  } catch (error) {
    console.error("Error in history API:", error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
