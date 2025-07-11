"use client";

import { useEffect, useState, useRef } from "react";
import { ArrowUp, MessageCircle, Copy, Check, Send } from "lucide-react";
import { useRouter } from "next/navigation";

interface Message {
  id?: number;
  role: "user" | "assistant";
  content: string;
}

const exampleQuestions = [
  "Tell me about Rahul's AI projects",
  "What are Rahul's technical skills?",
  "How can I contact Rahul?",
  "What is Rahul's experience with LangChain?",
];

export default function Home() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [historyLoading, setHistoryLoading] = useState(true);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [showExamples, setShowExamples] = useState(true);
  const router = useRouter();
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const parseText = (input: string) => {
    const patterns = [
      { regex: /###(.*?)/g, className: "font-semibold text-xl text-blue-400" },
      { regex: /\*\*(.*?)\*\*/g, className: "font-semibold text-white" },
      { regex: /_(.*?)_/g, className: "italic text-gray-300" },
    ];

    let elements: (string | React.ReactNode)[] = [input];

    patterns.forEach(({ regex, className }) => {
      elements = elements.flatMap((el, idx) => {
        if (typeof el === "string") {
          const parts: (string | React.ReactNode)[] = [];
          let lastIndex = 0;
          let match;
          while ((match = regex.exec(el)) !== null) {
            if (match.index > lastIndex) {
              parts.push(el.slice(lastIndex, match.index));
            }
            parts.push(
              <span key={`${idx}-${match.index}`} className={className}>
                {match[1]}
              </span>
            );
            lastIndex = regex.lastIndex;
          }
          if (lastIndex < el.length) {
            parts.push(el.slice(lastIndex));
          }
          return parts;
        }
        return [el];
      });
    });

    return <>{elements}</>;
  };

  useEffect(() => {
    const isSignedIn = localStorage.getItem("signed-in");
    const userId = localStorage.getItem("userId")?.replace(/"/g, "");

    if (!isSignedIn) {
      router.push("/signin");
      return;
    }

    const fetchHistory = async () => {
      setHistoryLoading(true);
      try {
        const res = await fetch("/api/history", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ userId }),
        });

        if (res.ok) {
          const data = await res.json();
          const history: Message[] = data.conversations.flatMap((c: any) =>
            c.messages.map((m: any) => ({
              role: m.sender === "HUMAN" ? "user" : "assistant",
              content: m.content,
            }))
          );
          setMessages(history);
          if (history.length > 0) {
            setShowExamples(false);
          }
        }
      } catch (error) {
        console.error("Error fetching history:", error);
      } finally {
        setHistoryLoading(false);
      }
    };

    fetchHistory();
  }, [router]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    if (messages.length === 0 && !historyLoading) {
      setMessages([
        {
          role: "assistant",
          content:
            "Hello! I'm AceChat, Rahul's AI assistant. How can I help you today?",
        },
      ]);
    }
  }, [historyLoading]);

  const handleSend = async () => {
    if (!input.trim()) return;
    const email = localStorage.getItem("email")?.replace(/"/g, "");
    if (!email) return;

    const userMessage: Message = { role: "user", content: input };
    const thinkingMessage: Message = { role: "assistant", content: "thinking" };

    setMessages((prev) => [...prev, userMessage, thinkingMessage]);
    setInput("");
    setLoading(true);
    setShowExamples(false);

    const res = await fetch("/api/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, input }),
    });

    if (!res.body) {
      setLoading(false);
      return;
    }

    const reader = res.body.getReader();
    const decoder = new TextDecoder();
    let assistantMsg = "";

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      const chunk = decoder.decode(value);
      assistantMsg += chunk;

      setMessages((prev) => {
        const updated = [...prev];
        updated[updated.length - 1] = {
          role: "assistant",
          content: assistantMsg || "thinking",
        };
        return updated;
      });
    }

    setLoading(false);
  };

  const handleExampleClick = (question: string) => {
    setInput(question);
    inputRef.current?.focus();
  };

  const copyToClipboard = async (text: string, id: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedId(id);
      setTimeout(() => setCopiedId(null), 2000);
    } catch (err) {
      console.error("Failed to copy text: ", err);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey && !loading) {
      e.preventDefault();
      handleSend();
    }
  };

  const ThinkingIndicator = () => (
    <div className="flex items-center space-x-1">
      <span className="text-gray-400">thinking</span>
      <div className="flex space-x-1">
        <div
          className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce"
          style={{ animationDelay: "0ms" }}
        ></div>
        <div
          className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce"
          style={{ animationDelay: "150ms" }}
        ></div>
        <div
          className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce"
          style={{ animationDelay: "300ms" }}
        ></div>
      </div>
    </div>
  );

  return (
    <div className="flex flex-col h-screen bg-gray-900 text-white">
      {/* Header */}
      <div className="flex items-center justify-between p-4 bg-gradient-to-r from-gray-800 to-gray-900 border-b border-gray-700">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center">
            <MessageCircle size={18} className="text-white" />
          </div>
          <div>
            <h1 className="text-sm font-semibold text-white">AceChat</h1>
            <p className="text-xs text-gray-400">Rahul's AI Assistant</p>
          </div>
        </div>
      </div>

      {/* Chat Messages */}
      <div className="flex-1 overflow-y-auto scrollbar-thin scrollbar-thumb-gray-700 scrollbar-track-gray-900">
        <div className="max-w-4xl mx-auto px-4 py-4 space-y-4">
          {historyLoading ? (
            <div className="flex items-center justify-center h-full">
              <div className="text-center">
                <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
                <p className="text-gray-400 text-sm">Initializing...</p>
              </div>
            </div>
          ) : (
            <>
              {messages.map((msg, idx) => {
                const parts = msg.content.split(/```([\s\S]*?)```/g);
                const messageId = `msg-${idx}`;
                const isThinking = msg.content === "thinking" && loading;

                return (
                  <div
                    key={idx}
                    className={`flex ${
                      msg.role === "user" ? "justify-end" : "justify-start"
                    }`}
                  >
                    <div
                      className={`max-w-[85%] p-4 rounded-2xl shadow-sm ${
                        msg.role === "user"
                          ? "bg-gradient-to-r from-blue-600 to-purple-600 text-white"
                          : "bg-gray-800 border border-gray-700 text-gray-100"
                      }`}
                    >
                      {isThinking ? (
                        <ThinkingIndicator />
                      ) : (
                        parts.map((part, i) =>
                          i % 2 === 1 ? (
                            <div key={i} className="relative group my-3">
                              <div className="bg-gray-900 text-green-400 p-4 rounded-lg overflow-x-auto text-sm font-mono border border-gray-700">
                                {part}
                              </div>
                              <button
                                onClick={() =>
                                  copyToClipboard(part, `${messageId}-${i}`)
                                }
                                className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity text-xs px-2 py-1 bg-gray-700 hover:bg-gray-600 text-white rounded"
                                title="Copy code"
                              >
                                {copiedId === `${messageId}-${i}` ? (
                                  <Check size={12} />
                                ) : (
                                  <Copy size={12} />
                                )}
                              </button>
                            </div>
                          ) : (
                            <div
                              key={i}
                              className="whitespace-pre-wrap leading-relaxed"
                            >
                              {parseText(part)}
                            </div>
                          )
                        )
                      )}
                    </div>
                  </div>
                );
              })}

              {/* Example Questions */}
              {showExamples && messages.length <= 1 && (
                <div className="space-y-3">
                  <p className="text-sm text-gray-400 text-center">
                    Try asking:
                  </p>
                  <div className="grid grid-cols-1 gap-2">
                    {exampleQuestions.map((question, idx) => (
                      <button
                        key={idx}
                        onClick={() => handleExampleClick(question)}
                        className="text-left p-3 bg-gray-800 hover:bg-gray-700 border border-gray-700 rounded-lg transition-all duration-200 text-sm hover:border-blue-500"
                      >
                        {question}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}

          <div ref={bottomRef} />
        </div>
      </div>

      {/* Input Area */}
      <div className="bg-gray-800 border-t border-gray-700">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <div className="flex items-end space-x-3">
            <div className="flex-1 relative">
              <textarea
                ref={inputRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Type your message..."
                className="w-full p-3 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                rows={1}
                disabled={loading || historyLoading}
                style={{ minHeight: "44px", maxHeight: "120px" }}
              />
            </div>
            <button
              onClick={handleSend}
              disabled={loading || !input.trim() || historyLoading}
              className={`p-3 rounded-lg transition-all duration-200 ${
                loading || !input.trim() || historyLoading
                  ? "bg-gray-600 cursor-not-allowed"
                  : "bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 hover:scale-105"
              }`}
              title="Send message"
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <Send size={18} className="text-white" />
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
