import { NextResponse } from "next/server";
import { ChatMistralAI } from "@langchain/mistralai";
import { ChatMessageHistory } from "langchain/memory";
import {
  HumanMessage,
  AIMessage,
  SystemMessage,
} from "@langchain/core/messages"; // Added SystemMessage
import { prisma } from "@/lib/prisma";
import { systemPrompt } from "@/lib/prompt";

export async function POST(req: Request) {
  const { email, input } = await req.json();

  // System Prompt
  
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
      data: { userId: user.id, count: 0 }, 
    });
  }

console.log("Conversation count:", conversation.count);

  // 2. Fetch previous messages
  const messages = await prisma.message.findMany({
    where: { conversationId: conversation.id },
    orderBy: { timestamp: "asc" },
  });
console.log(messages.length);

  const memory = new ChatMessageHistory();

  // Add system prompt to memory FIRST
  memory.addMessage(new SystemMessage(systemPrompt));

  // Add past messages
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
              if (!conversation.count) {
                conversation.count = 0;
              }

              if (conversation.count > 200) {
                const oldestTwoMessages = await prisma.message.findMany({
                  where: { conversationId: conversation!.id },
                  orderBy: { createdAt: "asc" }, 
                  take: 2, 
                });

                if (oldestTwoMessages.length > 0) {
                  await prisma.message.deleteMany({
                    where: {
                      id: { in: oldestTwoMessages.map((msg) => msg.id) },
                    },
                  });

                  await prisma.conversation.update({
                    where: { id: conversation.id },
                    data: { count: { decrement: oldestTwoMessages.length } },
                  });
                }
              }

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
              await prisma.conversation.update({
                where: { id: conversation.id },
                data: { count: { increment: 2 } }, 
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
