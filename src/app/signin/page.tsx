"use client";
import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Loader2, MessageCircle } from "lucide-react";
import { motion } from "framer-motion";
import { useRouter } from "next/navigation";

export default function SignInPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validate email
    if (!email.trim()) {
      setError("Email is required");
      return;
    }

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setError("Please enter a valid email address");
      return;
    }

    setError("");
    setLoading(true);

    try {
      const res = await fetch("/api/signin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim() }),
      });

      const data = await res.json();
      if (res.ok) {
        localStorage.setItem("signed-in", "true");
        localStorage.setItem("email", JSON.stringify(data.user.email));
        localStorage.setItem("userId", JSON.stringify(data.user.id));
        router.push("/");
      } else {
        setError(data.error || "Something went wrong. Please try again.");
      }
    } catch (err) {
      console.error("Sign-in failed", err);
      setError("Network error. Please check your connection and try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900">
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
        className="w-full max-w-sm px-4"
      >
        <Card className="p-8 shadow-2xl bg-gray-800 border-gray-700">
          <CardContent className="p-0">
            <div className="text-center mb-6">
              <div className="w-16 h-16 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center mx-auto mb-4">
                <MessageCircle size={32} className="text-white" />
              </div>
              <h1 className="text-2xl font-bold text-white mb-2">
                Welcome to AceChat
              </h1>
              <p className="text-gray-400 text-sm">Rahul's AI Assistant</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Input
                  type="email"
                  placeholder="Enter your email address"
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    if (error) setError("");
                  }}
                  className="bg-gray-700 border-gray-600 text-white placeholder-gray-400 focus:border-blue-500 focus:ring-blue-500"
                  required
                />
                {error && (
                  <motion.p
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="text-red-400 text-sm mt-2"
                  >
                    {error}
                  </motion.p>
                )}
              </div>

              <Button
                type="submit"
                className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-semibold py-3"
                disabled={loading}
              >
                {loading ? (
                  <>
                    <Loader2 className="animate-spin w-4 h-4 mr-2" />
                    Getting Started...
                  </>
                ) : (
                  "Get Started"
                )}
              </Button>
            </form>

            <div className="mt-6 text-center">
              <p className="text-gray-500 text-xs">
                By continuing, you agree to use AceChat responsibly
              </p>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}
