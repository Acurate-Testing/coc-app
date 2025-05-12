import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./(ui)/globals.css";
import "bootstrap/dist/css/bootstrap.min.css";
import { NextAuthProvider } from "./providers";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Next.js Auth App",
  description: "Next.js application with SQLite and authentication",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <NextAuthProvider>{children}</NextAuthProvider>
      </body>
    </html>
  );
}
