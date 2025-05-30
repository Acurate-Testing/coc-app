import { Metadata } from "next";
import { UserOnboardForm } from "./user-onboard-form";

export const metadata: Metadata = {
  title: "User Onboarding",
  description: "Set up your account",
};

export default function UserOnboardPage() {
  return (
    <div className="container relative min-h-screen flex-col items-center justify-center grid lg:max-w-none lg:grid-cols-1 lg:px-0">
      <div className="mx-auto flex w-full flex-col justify-center space-y-6 sm:w-[350px]">
        <div className="flex flex-col space-y-2 text-center">
          <h1 className="text-2xl font-semibold tracking-tight">
            Welcome to the platform
          </h1>
          <p className="text-sm text-muted-foreground">
            Set up your account to get started
          </p>
        </div>
        <UserOnboardForm />
      </div>
    </div>
  );
}
