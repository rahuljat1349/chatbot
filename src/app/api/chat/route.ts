import { NextResponse } from "next/server";
import { ChatMistralAI } from "@langchain/mistralai";
import { ChatMessageHistory } from "langchain/memory";
import {
  HumanMessage,
  AIMessage,
  SystemMessage,
} from "@langchain/core/messages";
import { supabase, Message } from "@/lib/supabase";
import { systemPrompt } from "@/lib/prompt";

export async function POST(req: Request) {
  const { email, input } = await req.json();

  // 1. Fetch user & active conversation or create one
  const { data: user, error: userError } = await supabase
    .from("users")
    .select("*")
    .eq("email", email)
    .single();

  if (userError || !user) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  // Get the most recent conversation for this user
  const { data: conversations, error: convError } = await supabase
    .from("conversations")
    .select("*")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })
    .limit(1);

  if (convError) {
    console.error("Error fetching conversations:", convError);
    return NextResponse.json(
      { error: "Failed to fetch conversation" },
      { status: 500 }
    );
  }

  let conversation = conversations?.[0];

  // Create new conversation if none exists
  if (!conversation) {
    const { data: newConversation, error: createError } = await supabase
      .from("conversations")
      .insert([
        {
          user_id: user.id,
          count: 0,
        },
      ])
      .select()
      .single();

    if (createError) {
      console.error("Error creating conversation:", createError);
      return NextResponse.json(
        { error: "Failed to create conversation" },
        { status: 500 }
      );
    }

    conversation = newConversation;
  }

  console.log("Conversation count:", conversation.count);

  // 2. Fetch previous messages
  const { data: messages, error: messagesError } = await supabase
    .from("messages")
    .select("*")
    .eq("conversation_id", conversation.id)
    .order("timestamp", { ascending: true });

  if (messagesError) {
    console.error("Error fetching messages:", messagesError);
    return NextResponse.json(
      { error: "Failed to fetch messages" },
      { status: 500 }
    );
  }

  console.log(messages?.length || 0);

  const memory = new ChatMessageHistory();

  // Add system prompt to memory FIRST
  memory.addMessage(new SystemMessage(systemPrompt));

  // Add past messages
  messages?.forEach((msg: Message) => {
    if (msg.sender === "HUMAN") {
      memory.addMessage(new HumanMessage(msg.content));
    } else {
      memory.addMessage(new AIMessage(msg.content));
    }
  });

  // Add latest user input to memory
  memory.addMessage(new HumanMessage(input));

  // 3. Create streamable LLM
  const model = new ChatMistralAI({
    streaming: true,
    modelName: "mistral-large-latest",
  });

  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    async start(controller) {
      let botResponse = "";

      await model.invoke(await memory.getMessages(), {
        callbacks: [
          {
            handleLLMNewToken(token: string) {
              botResponse += token;
              controller.enqueue(encoder.encode(token));
            },
            async handleLLMEnd() {
              if (!conversation.count) {
                conversation.count = 0;
              }

              // Clean up old messages if conversation is too long
              if (conversation.count > 200) {
                const { data: oldMessages } = await supabase
                  .from("messages")
                  .select("id")
                  .eq("conversation_id", conversation.id)
                  .order("timestamp", { ascending: true })
                  .limit(2);

                if (oldMessages && oldMessages.length > 0) {
                  const messageIds = oldMessages.map(
                    (msg: { id: number }) => msg.id
                  );

                  await supabase.from("messages").delete().in("id", messageIds);

                  // Update conversation count
                  await supabase
                    .from("conversations")
                    .update({ count: conversation.count - oldMessages.length })
                    .eq("id", conversation.id);
                }
              }

              // Save user message
              await supabase.from("messages").insert([
                {
                  conversation_id: conversation.id,
                  sender: "HUMAN",
                  content: input,
                },
              ]);

              // Save AI response
              await supabase.from("messages").insert([
                {
                  conversation_id: conversation.id,
                  sender: "AI",
                  content: botResponse,
                },
              ]);

              // Update conversation count
              await supabase
                .from("conversations")
                .update({ count: conversation.count + 2 })
                .eq("id", conversation.id);

              controller.close();
            },
          },
        ],
      });
    },
  });

  return new Response(stream, {
    headers: { "Content-Type": "text/event-stream" },
  });
}
