"use client";
import { useState, useCallback, memo } from "react";
import Link from "next/link";
import { Button } from "@/stories/Button/Button";
import { LoadingButton } from "@/stories/Loading-Button/LoadingButton";

export interface LoginFormProps {
  onSubmit: (email: string, password: string) => Promise<void>;
  isLoading: boolean;
  onRegisterClick: () => void;
}

const LoginForm: React.FC<LoginFormProps> = ({
  onSubmit,
  isLoading,
  onRegisterClick,
}) => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const handleSubmit = useCallback(
    async (e: React.FormEvent<HTMLFormElement>) => {
      e.preventDefault();
      await onSubmit(email, password);
    },
    [email, password, onSubmit]
  );

  return (
    <form onSubmit={handleSubmit} className="w-full flex flex-col gap-3">
      <div>
        <label htmlFor="email">Email address</label>
        <div className="relative mt-1">
          <span className="absolute left-4 top-1/2 text-gray-500 transform -translate-y-1/2 z-[1]">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="20"
              height="20"
              fill="currentColor"
              viewBox="0 0 24 24"
            >
              <path d="M20 4H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 4l-8 5-8-5V6l8 5 8-5v2z" />
            </svg>
          </span>
          <input
            type="email"
            className="form-input !pl-11"
            id="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Enter your email"
            required
            autoComplete="email"
          />
        </div>
      </div>

      <div>
        <label htmlFor="password">Password</label>
        <div className="relative mt-1">
          <span className="absolute left-4 top-1/2 text-gray-500 transform -translate-y-1/2 z-[1]">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="20"
              height="20"
              fill="currentColor"
              viewBox="0 0 24 24"
            >
              <path d="M18 8h-1V6c0-2.76-2.24-5-5-5S7 3.24 7 6v2H6c-1.1 0-2 .9-2 2v10c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V10c0-1.1-.9-2-2-2zm-6 9c-1.1 0-2-.9-2-2s.9-2 2-2 2 .9 2 2-.9 2-2 2zm3.1-9H8.9V6c0-1.71 1.39-3.1 3.1-3.1 1.71 0 3.1 1.39 3.1 3.1v2z" />
            </svg>
          </span>
          <input
            type="password"
            className="form-input !pl-11"
            id="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Enter your password"
            required
            autoComplete="current-password"
          />
        </div>
      </div>

      {isLoading ? (
        <LoadingButton
          label="Signing in..."
          size="large"
          className="w-full h-[50px] mt-4"
          disabled
        />
      ) : (
        <Button
          label="Sign in"
          size="large"
          type="submit"
          className="w-full h-[50px] mt-4"
          disabled={isLoading}
        />
      )}

      <div className="text-center my-4">
        <Link
          href="/reset-password"
          className="text-themeColor hover:underline"
        >
          Forgot your password?
        </Link>
      </div>

      <div className="text-center pt-4 border-t border-t-gray-300">
        <span>Don't have an account? </span>
        <Button
          label="Create New Account"
          size="large"
          type="button"
          variant="outline-primary"
          className="mx-auto h-[50px] mt-4 hover:!bg-themeColor hover:text-white"
          disabled={isLoading}
          onClick={onRegisterClick}
        />
      </div>
    </form>
  );
};

export default LoginForm;
