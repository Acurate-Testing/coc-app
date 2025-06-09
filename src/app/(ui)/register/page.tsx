"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { errorToast } from "@/hooks/useCustomToast";
import { LoadingButton } from "@/stories/Loading-Button/LoadingButton";
import { Button } from "@/stories/Button/Button";
import { useMediaQuery } from "react-responsive";

export default function RegisterPage() {
  const router = useRouter();
  const isMobile = useMediaQuery({ maxWidth: 767 });
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

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Registration failed");
      }

      router.push("/login");
    } catch (error) {
      errorToast(
        error instanceof Error ? error.message : "Registration failed"
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-6">
        <div>
          <h2 className="text-center text-2xl sm:text-3xl font-extrabold text-gray-900">
            Create your account
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            Or{" "}
            <Link
              href="/login"
              className="font-medium text-themeColor hover:text-blue-700"
            >
              sign in to your account
            </Link>
          </p>
        </div>
        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          <div className="space-y-4">
            <div>
              <label
                htmlFor="agency_name"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Customer Name
              </label>
              <input
                id="agency_name"
                name="agency_name"
                type="text"
                required
                className="form-input w-full"
                placeholder="Enter your customer name"
                value={signupFormData.agency_name}
                onChange={(e) =>
                  setSignupFormData({
                    ...signupFormData,
                    agency_name: e.target.value,
                  })
                }
              />
            </div>
            <div>
              <label
                htmlFor="email"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Email address
              </label>
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                required
                className="form-input w-full"
                placeholder="Enter your email"
                value={signupFormData.email}
                onChange={(e) =>
                  setSignupFormData({
                    ...signupFormData,
                    email: e.target.value,
                  })
                }
              />
            </div>
            <div>
              <label
                htmlFor="password"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Password
              </label>
              <input
                id="password"
                name="password"
                type="password"
                autoComplete="new-password"
                required
                className="form-input w-full"
                placeholder="Create a password"
                value={signupFormData.password}
                onChange={(e) =>
                  setSignupFormData({
                    ...signupFormData,
                    password: e.target.value,
                  })
                }
              />
            </div>
            <div>
              <label
                htmlFor="phone"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Phone Number
              </label>
              <input
                id="phone"
                name="phone"
                type="tel"
                className="form-input w-full"
                placeholder="Enter your phone number"
                value={signupFormData.phone}
                onChange={(e) =>
                  setSignupFormData({
                    ...signupFormData,
                    phone: e.target.value,
                  })
                }
              />
            </div>
            <div>
              <label
                htmlFor="address"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Address
              </label>
              <input
                id="address"
                name="address"
                type="text"
                className="form-input w-full"
                placeholder="Enter your address"
                value={signupFormData.address}
                onChange={(e) =>
                  setSignupFormData({
                    ...signupFormData,
                    address: e.target.value,
                  })
                }
              />
            </div>
          </div>

          <div>
            <LoadingButton
              type="submit"
              loading={isLoading}
              label={isMobile ? "Create Account" : "Create your account"}
              className="w-full h-[60px] text-base font-medium rounded-xl bg-themeColor hover:bg-blue-700 text-white transition-colors duration-200"
            />
          </div>
        </form>
      </div>
    </div>
  );
}
