"use client";
import { Button } from "@/stories/Button/Button";
import { LoadingButton } from "@/stories/Loading-Button/LoadingButton";
import Link from "next/link";
import { useState } from "react";
import { IoMdArrowRoundBack } from "react-icons/io";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<
    "idle" | "loading" | "success" | "error"
  >("idle");
  const [message, setMessage] = useState("");

  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus("loading");

    try {
      const res = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Something went wrong");
      }

      setStatus("success");
      setMessage("Password reset email sent. Check your inbox.");
    } catch (error) {
      setStatus("error");
      setMessage(
        error instanceof Error ? error.message : "Something went wrong"
      );
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 px-4">
      <div className="max-w-md w-full bg-white p-8 rounded-2xl card-shadow">
        <div className="shield-icon">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M20.618 5.984A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
            />
          </svg>
        </div>
        <h2 className="text-2xl font-bold mb-6 text-center">Forgot Password</h2>
        <form onSubmit={handleReset}>
          <label className="block mb-4">
            <span>Email address</span>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="mt-1 form-input"
              placeholder="you@example.com"
            />
          </label>
          {status === "loading" ? (
            <LoadingButton
              label="Signing in..."
              size="large"
              className="h-[50px] mt-4"
              disabled
            />
          ) : (
            <Button
              label="Send Reset Link"
              size="large"
              type="submit"
              className="h-[50px] mt-4 w-full"
              disabled={(status as string) === "loading"}
            />
          )}
        </form>
        <div className="mt-4">
          <Link
            href="/login"
            className="text-themeColor hover:underline flex items-center gap-2"
          >
            <IoMdArrowRoundBack size={20} /> Back to Login
          </Link>
        </div>
        {status !== "idle" && (
          <p
            className={`mt-4 text-sm ${
              status === "error" ? "text-red-500" : "text-green-600"
            }`}
          >
            {message}
          </p>
        )}
      </div>
    </div>
  );
}
