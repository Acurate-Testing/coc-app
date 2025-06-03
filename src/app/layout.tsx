import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import "./(ui)/styles/custom-style.scss";
import "./(ui)/styles/glove-friendly.css";
import dynamic from "next/dynamic";
import { Suspense } from "react";
import { registerServiceWorker } from "./service-worker";
import NextAuthProvider from "./providers";
import { Toaster } from "sonner";
import ErrorBoundary from "./(ui)/components/Common/ErrorBoundary";

const inter = Inter({
  subsets: ["latin"],
  display: "swap", // Optimize font loading
  preload: true,
});

// Dynamically import the auth provider with no SSR
const ToastContainerWrapper = dynamic(
  () => import("./components/ToastContainerWrapper"),
  {
    ssr: false,
    loading: () => null,
  }
);

export const metadata: Metadata = {
  title: "COC App",
  description: "Certificate of Conformity Application",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "COC App",
  },
  icons: {
    icon: "/icons/icon-192x192.png",
    shortcut: "/icons/icon-192x192.png",
    apple: "/icons/icon-192x192.png",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  themeColor: "#2563eb",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  // Register service worker on client side
  if (typeof window !== "undefined") {
    registerServiceWorker();
  }

  // Check if the current path is the onboarding page
  const isOnboardingPage =
    typeof window !== "undefined" &&
    window.location.pathname.startsWith("/users/onboard");

  return (
    <html lang="en">
      <head>
        <meta name="theme-color" content="#2563eb" />
        <link rel="apple-touch-icon" href="/logo-at.png" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="apple-mobile-web-app-title" content="COC App" />
      </head>
      <body
        className={`${inter.className} bg-light text-light`}
        suppressHydrationWarning
      >
        <ErrorBoundary>
          {isOnboardingPage ? (
            children
          ) : (
            <NextAuthProvider>
              <Suspense fallback={null}>
                <ToastContainerWrapper />
              </Suspense>
              <main id="main-content" className="min-h-screen">
                {children}
              </main>
            </NextAuthProvider>
          )}
        </ErrorBoundary>
        <Toaster />
      </body>
    </html>
  );
}
