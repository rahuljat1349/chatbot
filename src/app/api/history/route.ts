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

export async function DELETE(req: Request) {
  const { userId } = await req.json();

  if (!userId) {
    return NextResponse.json({ error: "User ID is required" }, { status: 400 });
  }

  try {
    // Get all conversations for the user
    const { data: conversations, error: convError } = await supabase
      .from("conversations")
      .select("id")
      .eq("user_id", userId);

    if (convError) {
      console.error("Error fetching conversations for delete:", convError);
      return NextResponse.json(
        { error: "Failed to fetch conversations" },
        { status: 500 }
      );
    }

    const conversationIds = (conversations || []).map(
      (c: { id: number }) => c.id
    );

    if (conversationIds.length > 0) {
      // Delete all messages for these conversations
      const { error: msgError } = await supabase
        .from("messages")
        .delete()
        .in("conversation_id", conversationIds);
      if (msgError) {
        console.error("Error deleting messages:", msgError);
        return NextResponse.json(
          { error: "Failed to delete messages" },
          { status: 500 }
        );
      }

      // Delete the conversations themselves
      const { error: convDelError } = await supabase
        .from("conversations")
        .delete()
        .in("id", conversationIds);
      if (convDelError) {
        console.error("Error deleting conversations:", convDelError);
        return NextResponse.json(
          { error: "Failed to delete conversations" },
          { status: 500 }
        );
      }
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error in DELETE history API:", error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
