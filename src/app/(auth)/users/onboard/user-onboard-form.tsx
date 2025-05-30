"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { Button } from "@/stories/Button/Button";
import { LoadingButton } from "@/stories/Loading-Button/LoadingButton";
import { toast } from "sonner";

const formSchema = z
  .object({
    password: z.string().min(8, "Password must be at least 8 characters"),
    confirmPassword: z.string(),
  })
  .refine(
    (data: { password: string; confirmPassword: string }) =>
      data.password === data.confirmPassword,
    {
      message: "Passwords don't match",
      path: ["confirmPassword"],
    }
  );

type FormValues = z.infer<typeof formSchema>;

export function UserOnboardForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isLoading, setIsLoading] = useState(false);
  const [isValidating, setIsValidating] = useState(true);

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      password: "",
      confirmPassword: "",
    },
  });

  useEffect(() => {
    async function validateToken() {
      const token = searchParams.get("token");
      if (!token) {
        toast.error("Invalid invite link");
        router.push("/login");
        return;
      }

      try {
        const response = await fetch(
          `/api/users/validate-invite?token=${token}`
        );
        if (!response.ok) {
          throw new Error("Invalid or expired invite link");
        }
        setIsValidating(false);
      } catch (error) {
        toast.error(
          error instanceof Error ? error.message : "Invalid invite link"
        );
        router.push("/login");
      }
    }

    validateToken();
  }, [searchParams, router]);

  async function onSubmit(values: FormValues) {
    try {
      setIsLoading(true);
      const token = searchParams.get("token");
      if (!token) {
        toast.error("Invalid invite link");
        return;
      }

      const response = await fetch("/api/users/onboard", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          token,
          password: values.password,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to create account");
      }

      toast.success("Account created successfully");
      router.push("/login");
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Something went wrong"
      );
    } finally {
      setIsLoading(false);
    }
  }

  if (isValidating) {
    return (
      <div className="flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
      <div className="space-y-2">
        <label htmlFor="password" className="text-sm font-medium">
          Password
        </label>
        <input
          id="password"
          type="password"
          className="w-full h-10 px-3 py-2 border rounded-md"
          placeholder="Enter your password"
          {...form.register("password")}
        />
        {form.formState.errors.password && (
          <p className="text-sm text-red-500">
            {form.formState.errors.password.message}
          </p>
        )}
      </div>

      <div className="space-y-2">
        <label htmlFor="confirmPassword" className="text-sm font-medium">
          Confirm Password
        </label>
        <input
          id="confirmPassword"
          type="password"
          className="w-full h-10 px-3 py-2 border rounded-md"
          placeholder="Confirm your password"
          {...form.register("confirmPassword")}
        />
        {form.formState.errors.confirmPassword && (
          <p className="text-sm text-red-500">
            {form.formState.errors.confirmPassword.message}
          </p>
        )}
      </div>

      {isLoading ? (
        <LoadingButton
          label="Creating account..."
          className="w-full"
          disabled
        />
      ) : (
        <Button label="Create account" className="w-full" type="submit" />
      )}
    </form>
  );
}
