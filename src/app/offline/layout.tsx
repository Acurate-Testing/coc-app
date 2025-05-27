import type { Metadata, Viewport } from "next";

export const metadata: Metadata = {
  title: "Offline - Accurate Testing App",
  description: "You are currently offline",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export default function OfflineLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
} 