"use client";

import { useEffect, useState, useRef } from "react";
import { ArrowUp, MessageCircle, Copy, Check, Send } from "lucide-react";
import { useRouter } from "next/navigation";
import Image from "next/image";

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
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const profileMenuRef = useRef<HTMLDivElement>(null);
  const [clearLoading, setClearLoading] = useState(false);
  const avatarRef = useRef<HTMLDivElement>(null);

  // No outside click handler: only avatar click toggles menu

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

  useEffect(() => {
    if (!showProfileMenu) return;
    function handleClickOutside(event: MouseEvent) {
      if (
        profileMenuRef.current &&
        !profileMenuRef.current.contains(event.target as Node) &&
        avatarRef.current &&
        !avatarRef.current.contains(event.target as Node)
      ) {
        setShowProfileMenu(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [showProfileMenu]);

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
    setTimeout(() => handleSend(), 0);
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
        <span className="block w-2 h-2 bg-blue-400 rounded-full dot-pulse opacity-70" />
        <span className="block w-2 h-2 bg-blue-400 rounded-full dot-pulse-delay-1 opacity-70" />
        <span className="block w-2 h-2 bg-blue-400 rounded-full dot-pulse-delay-2 opacity-70" />
      </div>
    </div>
  );

  useEffect(() => {
    const styleId = "dot-pulse-keyframes";
    if (!document.getElementById(styleId)) {
      const style = document.createElement("style");
      style.id = styleId;
      style.innerHTML = `
        @keyframes dot-pulse {
          0%, 80%, 100% { opacity: 0.3; transform: scale(0.8); }
          40% { opacity: 1; transform: scale(1.2); }
        }
        .dot-pulse { animation: dot-pulse 1s ease-in-out 0s infinite; }
        .dot-pulse-delay-1 { animation: dot-pulse 1s ease-in-out 0.2s infinite; }
        .dot-pulse-delay-2 { animation: dot-pulse 1s ease-in-out 0.4s infinite; }
      `;
      document.head.appendChild(style);
    }
  }, []);

  return (
    <div className="flex flex-col h-screen bg-gray-900 text-white">
      {/* Header */}
      <div className="flex items-center justify-between p-4 bg-gradient-to-r from-gray-800 to-gray-900  ">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center">
            <MessageCircle size={18} className="text-white" />
          </div>
          <div>
            <h1 className="text-sm font-semibold text-white">AceChat</h1>
            <p className="text-xs text-gray-400">Rahul's AI Assistant</p>
          </div>
        </div>
        <div className="flex items-center space-x-2 relative">
          {/* Profile Avatar with Initial (clickable) */}
          <div
            ref={avatarRef}
            className="w-8 h-8 rounded-full border-2 border-blue-500 bg-blue-600 flex items-center justify-center text-white font-bold text-base select-none shadow-md cursor-pointer"
            onClick={(e) => {
              e.stopPropagation();
              setShowProfileMenu((v) => !v);
            }}
            title="Profile menu"
          >
            {(() => {
              let initial = "U";
              try {
                const emailRaw = localStorage.getItem("email");
                if (emailRaw) {
                  const email = JSON.parse(emailRaw);
                  if (typeof email === "string" && email.length > 0) {
                    initial = email.charAt(0).toUpperCase();
                  }
                }
              } catch {
                initial = "U";
              }
              return initial;
            })()}
          </div>
          {/* Profile Dropdown Menu */}
          {showProfileMenu && (
            <div
              ref={profileMenuRef}
              className="absolute right-0 top-12  bg-gray-800 border border-gray-700 rounded-xl shadow-lg py-3 px-4 z-50 flex flex-col items-start animate-fade-in"
              onMouseDown={(e) => e.stopPropagation()}
            >
              <div className="w-full mb-2 text-xs text-gray-400 truncate">
                {(() => {
                  let email = "Unknown";
                  try {
                    const emailRaw = localStorage.getItem("email");
                    if (emailRaw) {
                      const parsed = JSON.parse(emailRaw);
                      if (typeof parsed === "string") email = parsed;
                    }
                  } catch {}
                  return email;
                })()}
              </div>
              <button
                onClick={async () => {
                  setClearLoading(true);
                  const userId = localStorage
                    .getItem("userId")
                    ?.replace(/"/g, "");
                  if (!userId) {
                    setClearLoading(false);
                    return;
                  }
                  await fetch("/api/history", {
                    method: "DELETE",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ userId }),
                  });
                  setMessages([
                    {
                      role: "assistant",
                      content:
                        "Hello! I'm AceChat, Rahul's AI assistant. How can I help you today?",
                    },
                  ]);
                  setShowExamples(true);
                  setClearLoading(false);
                }}
                className="text-left px-3 py-1.5 w-fit rounded-lg bg-gray-700 hover:bg-gray-600 text-xs text-gray-200  transition-all mb-2 flex items-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed"
                title="Clear chat history"
                disabled={clearLoading}
              >
                {clearLoading ? (
                  <span className="w-4 h-4 border-2 border-blue-400 border-t-transparent rounded-full animate-spin inline-block" />
                ) : null}
                {clearLoading ? "Clearing..." : "Clear Chat"}
              </button>
              <button
                onClick={() => {
                  setShowProfileMenu(false);
                  localStorage.clear();
                  window.location.href = "/signin";
                }}
                className="text-left w-fit px-3 py-1.5 rounded-lg bg-gray-700 hover:bg-gray-600 text-xs text-gray-200  transition-all"
                title="Logout"
              >
                Logout
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Chat Messages */}
      <div className="flex-1 overflow-y-auto scrollbar-thin scrollbar-thumb-gray-700 scrollbar-track-gray-900 pt-16 pb-32 relative">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <div className="bg-gray-900/80 rounded-2xl  p-2 space-y-4">
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
                  const isAssistant = msg.role === "assistant";
                  const isUser = msg.role === "user";
                  return (
                    <div
                      key={idx}
                      className={`flex ${
                        isUser ? "justify-end" : "justify-start"
                      }`}
                    >
                      <div
                        className={
                          isUser
                            ? "max-w-4xl bg-gray-800 text-white rounded-2xl px-4 py-2 mb-2"
                            : "max-w-4xl flex items-start gap-2 mb-2"
                        }
                      >
                        {isAssistant && (
                          <span className="mt-1">
                            {/* Gemini-style sparkle icon (SVG) */}
                            <svg
                              width="18"
                              height="18"
                              viewBox="0 0 20 20"
                              fill="none"
                              xmlns="http://www.w3.org/2000/svg"
                            >
                              <path
                                d="M10 2.5L11.09 7.26C11.21 7.77 11.68 8.13 12.21 8.13H17.18L13.14 10.97C12.7 11.28 12.52 11.86 12.7 12.37L14.09 16.63L10.05 13.79C9.61 13.48 9.03 13.48 8.59 13.79L4.55 16.63L5.94 12.37C6.12 11.86 5.94 11.28 5.5 10.97L1.46 8.13H6.43C6.96 8.13 7.43 7.77 7.55 7.26L8.64 2.5H10Z"
                                fill="#3b82f6"
                              />
                            </svg>
                          </span>
                        )}
                        <div
                          className={
                            isAssistant
                              ? "text-white whitespace-pre-wrap leading-relaxed"
                              : "whitespace-pre-wrap leading-relaxed"
                          }
                        >
                          {msg.content === "thinking" && isAssistant ? (
                            <span className="inline-flex items-center gap-1">
                              <span className="animate-pulse">Thinking</span>
                              <span className="block w-2 h-2 bg-blue-400 rounded-full dot-pulse opacity-70" />
                              <span className="block w-2 h-2 bg-blue-400 rounded-full dot-pulse-delay-1 opacity-70" />
                              <span className="block w-2 h-2 bg-blue-400 rounded-full dot-pulse-delay-2 opacity-70" />
                            </span>
                          ) : (
                            parts.map((part, i) =>
                              i % 2 === 1 ? (
                                <div
                                  key={i}
                                  className="bg-gray-900 text-green-400 p-4 rounded-lg overflow-x-auto text-sm font-mono border border-gray-700 my-2"
                                >
                                  {part}
                                </div>
                              ) : (
                                <span key={i}>{parseText(part)}</span>
                              )
                            )
                          )}
                        </div>
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
                    <div className="flex flex-wrap justify-start gap-x-2 gap-y-2">
                      {exampleQuestions.map((question, idx) => (
                        <button
                          key={idx}
                          onClick={() => handleExampleClick(question)}
                          className="px-4 py-2 bg-gray-800 hover:bg-gray-700   rounded-full transition-all duration-200 text-sm hover:border-blue-500 max-w-xs w-auto text-left"
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
      </div>

      {/* Input Area */}
      <div className="w-full fixed bottom-0 left-0 bg-transparent z-20">
        <div className="max-w-4xl mx-auto px-4 pb-4">
          <div className="flex items-center bg-gray-800    rounded-2xl shadow-xl px-4 py-2 gap-2">
            <textarea
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Type your message..."
              className="flex-1 bg-transparent text-white placeholder-gray-400 resize-none outline-none border-0 focus:ring-0 focus:outline-none px-0 py-4 text-base min-h-[64px] max-h-[160px] shadow-none"
              rows={1}
              disabled={loading || historyLoading}
              style={{ minHeight: "64px", maxHeight: "160px" }}
            />
            <button
              onClick={handleSend}
              disabled={loading || !input.trim() || historyLoading}
              className={`flex items-center justify-center h-10 w-10 rounded-full transition-all duration-150 focus:outline-none focus:ring-2 focus:ring-blue-500/50 ${
                loading || !input.trim() || historyLoading
                  ? "bg-gray-700 text-gray-500 cursor-not-allowed"
                  : "bg-blue-600 hover:bg-blue-700 text-white active:scale-95"
              }`}
              title="Send message"
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <Send size={20} />
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
