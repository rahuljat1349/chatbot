"use client";

import { useEffect, useState, useRef } from "react";
import { ArrowUp } from "lucide-react";
import { useRouter } from "next/navigation";

interface Message {
  id?: number;
  role: "user" | "assistant";
  content: string;
}

export default function Home() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [copy, setCopy] = useState(false);
  const router = useRouter();
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const isSignedIn = localStorage.getItem("signed-in");
    const userId = localStorage.getItem("userId")?.replace(/"/g, "");

    if (!isSignedIn) {
      router.push("/signin");
      return;
    }

    const fetchHistory = async () => {
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
      }
    };

    fetchHistory();

   
  }, [router]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim()) return;
    const email = localStorage.getItem("email")?.replace(/"/g, "");
    if (!email) return;

    const newMsg: Message = { role: "user", content: input };
    setMessages((prev) => [...prev, newMsg]);
    setInput("");
    setLoading(true);

    const res = await fetch("/api/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, input }),
    });

    if (!res.body) return;

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
        if (updated[updated.length - 1].role === "assistant") {
          updated[updated.length - 1].content = assistantMsg;
        } else {
          updated.push({ role: "assistant", content: assistantMsg });
        }
        return [...updated];
      });
    }

    setLoading(false);
  };

  return (
    <>
      <div className=" p-6 flex w-full  flex-col justify-evenly ">
        <div className=" w-1/2 m-auto justify-center">
          <div className="flex flex-col items-center element m-auto space-y-4">
            {messages.map((msg, idx) => {
              const parts = msg.content.split(/```([\s\S]*?)```/g);
              return (
                <div
                  key={idx}
                  className={`p-3 rounded-lg whitespace-pre-wrap ${
                    msg.role === "user"
                      ? "bg-[#2F2F2F]  inline w-fit ml-auto"
                      : "mr-auto w-full"
                  }`}
                >
                  {parts.map((part, i) =>
                    i % 2 === 1 ? (
                      // Code Block with Copy Button
                      <div key={i} className="relative group my-2">
                        <pre className="bg-black text-white p-4 rounded overflow-x-auto text-sm">
                          {part}
                        </pre>
                        <button
                        onMouseOut={()=>{
                          setCopy(false);
                        }}
                          onClick={() => {
                            navigator.clipboard.writeText(part);
                            setCopy(true)
                          }}
                          className="absolute top-2 right-2 cursor-pointer opacity-0 group-hover:opacity-100 transition-opacity text-xs px-2 py-1 bg-gray-700 text-white rounded"
                        >
                         {copy ? "Copied" : "Copy"}
                        </button>
                      </div>
                    ) : (
                      // Normal text
                      <span key={i}>{part}</span>
                    )
                  )}
                </div>
              );
            })}

            <div ref={bottomRef} />
          </div>
        </div>
      </div>
      <div className="pb-16">
        <div className="flex fixed  bottom-1 w-full left-0 right-0 justify-center items-center mt-6">
          <div className="flex relative rounded-lg  bg-[#303030]  w-1/2  pl-2 justify-between items-center">
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !loading) {
                  e.preventDefault();
                  handleSend();
                }
              }}
              placeholder="Type a query or ask a question.."
              className="outline-0 resize-none flex p-2 items-start text-start flex-col max-h-24 min-h-24 w-[90%]"
              disabled={loading}
            />

            <button
              onClick={handleSend}
              className={`p-2 absolute right-2 bottom-2 rounded-full flex justify-center items-center ${
                input.length > 0 ? "bg-[#C1C1C1]" : "bg-[#747474]"
              } h-10 w-10`}
              disabled={loading}
            >
              <ArrowUp className="text-white" />
            </button>
          </div>
        </div>
      </div>
    </>
  );
}