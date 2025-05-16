"use client";
import { useState, useCallback, memo } from "react";
import Link from "next/link";

export interface LoginFormProps {
  onSubmit: (email: string, password: string) => Promise<void>;
  error: string | null;
  isLoading: boolean;
  onRegisterClick: () => void;
}

const LoginForm: React.FC<LoginFormProps> = ({ onSubmit, error, isLoading, onRegisterClick }) => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const handleSubmit = useCallback(async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    await onSubmit(email, password);
  }, [email, password, onSubmit]);

  const handleEmailChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setEmail(e.target.value);
  }, []);

  const handlePasswordChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setPassword(e.target.value);
  }, []);

  return (
    <form onSubmit={handleSubmit} className="w-full flex flex-col gap-3">
      {error && (
        <div className="alert alert-danger" role="alert">
          {error}
        </div>
      )}

      <div className="form-group">
        <label htmlFor="email">Email address</label>
        <div className="relative">
          <span className="input-icon">
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
            className="form-control mt-1"
            id="email"
            value={email}
            onChange={handleEmailChange}
            placeholder="Enter your email"
            required
            autoComplete="email"
          />
        </div>
      </div>

      <div className="form-group">
        <label htmlFor="password">Password</label>
        <div className="relative">
          <span className="input-icon">
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
            className="form-control mt-1"
            id="password"
            value={password}
            onChange={handlePasswordChange}
            placeholder="Enter your password"
            required
            autoComplete="current-password"
          />
        </div>
      </div>

      <button
        type="submit"
        className="btn btn-login text-white font-semibold"
        disabled={isLoading}
      >
        {isLoading ? (
          <>
            <span
              className="spinner-border spinner-border-sm me-2"
              role="status"
              aria-hidden="true"
            />
            Signing in...
          </>
        ) : (
          "Sign in"
        )}
      </button>

      <div className="forgot-password">
        <Link href="/reset-password" className="link-blue">
          Forgot your password?
        </Link>
      </div>

      <div className="create-account">
        <span>Don't have an account? </span>
        <button
          type="button"
          onClick={onRegisterClick}
          className="btn-create-account"
        >
          Create New Account
        </button>
      </div>
    </form>
  );
};

export default LoginForm; 