"use client";

import { Inter } from "next/font/google";
import "./globals.css";
import Navbar from "@/components/Navbar";
import { usePathname } from "next/navigation";

const inter = Inter({ subsets: ["latin"] });

export default function RootLayout({ children }) {
  const pathname = usePathname();
  const isLanding = pathname === '/landing';

  return (
    <html lang="en">
      <head>
        <title>SkillMatrix</title>
        <meta name="description" content="A college-only social platform for achievements and portfolios" />
        <link rel="icon" href="/skill-icon.png" type="image/png" />
      </head>
      <body className={`${inter.className} bg-gray-50`}>
        <Navbar />
        <main className={isLanding ? "min-h-screen" : "min-h-screen pt-16"}>
          {children}
        </main>
      </body>
    </html>
  );
}