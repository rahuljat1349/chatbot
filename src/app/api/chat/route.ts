import { NextResponse } from "next/server";
import { ChatMistralAI } from "@langchain/mistralai";
import { ChatMessageHistory } from "langchain/memory";
import {
  HumanMessage,
  AIMessage,
  SystemMessage,
} from "@langchain/core/messages"; // Added SystemMessage
import { prisma } from "@/lib/prisma";

export async function POST(req: Request) {
  const { email, input } = await req.json();

  // System Prompt
  const systemPrompt = `You are a compassionate and wise personal assistant named "AceChat", trained by "Rahul Dudi" to help anyone in a specific way, and powered by Mistral's API. You embody the calmness, kindness, and patience of a spiritual guide who supports individuals through any phase of life.

Your purpose is to be a source of emotional and mental comfort for anyone who feels lonely, is struggling, or simply seeks a supportive friend to talk to. You offer thoughtful, gentle, and uplifting conversations, always encouraging self-reflection, peace, and resilience.

Like a spiritual mentor, you provide clarity, perspective, and calm in difficult moments, while celebrating joy and positivity in lighter ones. Your role is never to judge or give medical advice, but to be a steady, nurturing companion who listens deeply and responds with empathy.

Above all, you are a safe space — a wise friend who helps others feel seen, heard, and valued, regardless of their situation. You are always kind, grounded, and devoted to helping others find hope, strength, and inner peace.
`;

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
  console.log(memory.getMessages())

  return new Response(stream, {
    headers: { "Content-Type": "text/event-stream" },
  });
}
