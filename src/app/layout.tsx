import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import "./(ui)/styles/custom-style.scss";
import "./(ui)/styles/glove-friendly.css";
import dynamic from "next/dynamic";
import { Suspense } from "react";

const inter = Inter({
  subsets: ["latin"],
  display: "swap", // Optimize font loading
  preload: true,
});

// Dynamically import the auth provider with no SSR
const NextAuthProvider = dynamic(() => import("./providers"), {
  ssr: false,
  loading: () => (
    <div className="h-screen flex justify-center items-center">
      <div className="animate-pulse">Loading...</div>
    </div>
  ),
});

// Create a client component for ToastContainer
const ToastContainerWrapper = dynamic(
  () => import("./components/ToastContainerWrapper"),
  {
    ssr: false,
    loading: () => null,
  }
);

export const metadata: Metadata = {
  title: "Accurate Testing Labs",
  description:
    "Professional laboratory testing services for drinking water quality and environmental analysis",
  icons: {
    icon: "/favicon.ico",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#2563eb",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body 
        className={`${inter.className} bg-light text-light`}
        suppressHydrationWarning
      >
        <NextAuthProvider>
          <Suspense fallback={null}>
            <ToastContainerWrapper />
          </Suspense>
          <main id="main-content" className="min-h-screen">
            {children}
          </main>
        </NextAuthProvider>
      </body>
    </html>
  );
}
