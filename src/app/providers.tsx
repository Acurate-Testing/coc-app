"use client";
import React from "react";
import { SessionProvider } from "next-auth/react";
import LoadingSpinner from "./(ui)/components/Common/LoadingSpinner";

export function NextAuthProvider({ children }: { children: React.ReactNode }) {
  return (
    <React.Suspense
      fallback={
        <div className="h-screen flex justify-center items-center">
          <LoadingSpinner />
        </div>
      }
    >
      <SessionProvider>{children}</SessionProvider>
    </React.Suspense>
  );
}
