import { NextResponse } from "next/server";
import { ChatMistralAI } from "@langchain/mistralai";
import { ChatMessageHistory } from "langchain/memory";
import { HumanMessage, AIMessage } from "@langchain/core/messages";
import { prisma } from "@/lib/prisma";

export async function POST(req: Request) {
  const { email, input } = await req.json();

  // 1. Fetch user & active conversation or create one
  let user = await prisma.user.findUnique({
    where: { email },
  });

  if (!user) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  let conversation = await prisma.conversation.findFirst({
    where: { userId: user.id },
    orderBy: { createdAt: "desc" },
  });

  if (!conversation) {
    conversation = await prisma.conversation.create({
      data: { userId: user.id },
    });
  }

  // 2. Fetch previous messages
  const messages = await prisma.message.findMany({
    where: { conversationId: conversation.id },
    orderBy: { timestamp: "asc" },
  });

  const memory = new ChatMessageHistory();
  messages.forEach((msg) => {
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
              // Save user message
              await prisma.message.create({
                data: {
                  conversationId: conversation!.id,
                  sender: "HUMAN",
                  content: input,
                },
              });
              // Save AI response
              await prisma.message.create({
                data: {
                  conversationId: conversation!.id,
                  sender: "AI",
                  content: botResponse,
                },
              });
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
