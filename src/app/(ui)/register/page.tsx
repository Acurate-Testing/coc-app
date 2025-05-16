"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { errorToast } from "@/hooks/useCustomToast";
import { LoadingButton } from "@/stories/Loading-Button/LoadingButton";
import { Button } from "@/stories/Button/Button";

export default function RegisterPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [signupFormData, setSignupFormData] = useState({
    agency_name: "",
    email: "",
    phone: "",
    address: "",
    password: "",
  });

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const response = await fetch("/api/auth/register", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(signupFormData),
      });

      if (!response.ok) {
        const data = await response.text();
        throw new Error(data);
      }
      router.push("/login");
    } catch (error) {
      errorToast(
        error instanceof Error ? error.message : "Something went wrong"
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="card-shadow w-full max-w-md bg-white rounded-2xl mx-auto p-8">
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
        <h3 className="text-2xl font-semibold text-center mb-6">Register</h3>
        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label htmlFor="agency_name">Company Name</label>
            <input
              type="text"
              id="agency_name"
              name="agency_name"
              value={signupFormData.agency_name}
              placeholder="Enter your agency name"
              onChange={(e) =>
                setSignupFormData({
                  ...signupFormData,
                  agency_name: e.target.value,
                })
              }
              required
              className="form-input mt-1"
            />
          </div>

          <div className="mb-4">
            <label htmlFor="email">Email address</label>
            <input
              type="email"
              id="email"
              name="email"
              placeholder="Enter your email"
              value={signupFormData.email}
              onChange={(e) =>
                setSignupFormData({
                  ...signupFormData,
                  email: e.target.value,
                })
              }
              required
              className="form-input mt-1"
            />
          </div>
          <div className="mb-4">
            <label htmlFor="phone">Phone</label>
            <input
              type="number"
              id="phone"
              name="phone"
              placeholder="Enter your phone"
              onChange={(e) =>
                setSignupFormData({
                  ...signupFormData,
                  phone: e.target.value,
                })
              }
              required
              className="form-input mt-1"
            />
          </div>
          <div className="mb-3">
            <label htmlFor="address">Company Address</label>
            <textarea
              id="address"
              name="address"
              rows={2}
              value={signupFormData.address ?? ""}
              onChange={(e) =>
                setSignupFormData({
                  ...signupFormData,
                  address: e.target.value,
                })
              }
              placeholder="Enter address"
              className="form-input !h-auto mt-1"
            />
          </div>

          <div className="mb-6">
            <label htmlFor="password">Password</label>
            <input
              type="password"
              id="password"
              name="password"
              placeholder="Enter password"
              onChange={(e) =>
                setSignupFormData({
                  ...signupFormData,
                  password: e.target.value,
                })
              }
              required
              className="form-input mt-1"
            />
          </div>

          {isLoading ? (
            <LoadingButton
              label="Registering..."
              size="large"
              className="w-full h-[50px] mt-4"
              disabled
            />
          ) : (
            <Button
              label="Register"
              size="large"
              type="submit"
              className="w-full h-[50px] mt-4"
              disabled={isLoading}
            />
          )}
        </form>

        <div className="mt-4 text-center">
          <p>
            Already have an account?{" "}
            <Link href="/login" className="text-blue-600 hover:underline">
              Login
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
