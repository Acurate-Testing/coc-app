import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import "./(ui)/styles/custom-style.scss";
import { NextAuthProvider } from "./providers";
import { Slide, ToastContainer } from "react-toastify";

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
        <ToastContainer position="top-center" newestOnTop transition={Slide} />
        <NextAuthProvider>{children}</NextAuthProvider>
      </body>
    </html>
  );
}
