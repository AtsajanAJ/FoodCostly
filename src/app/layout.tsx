import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import Link from "next/link";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: {
    default: "FoodCostly",
    template: "%s · FoodCostly",
  },
  description:
    "Restaurant cost and inventory management for ingredient purchasing, recipes, sales, and profitability.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="flex min-h-full flex-col bg-background font-sans text-foreground">
        <header className="border-b border-border">
          <div className="mx-auto flex h-14 w-full max-w-5xl items-center px-4 sm:px-6">
            <Link href="/" className="text-sm font-semibold tracking-tight">
              FoodCostly
            </Link>
          </div>
        </header>
        <main className="mx-auto flex w-full max-w-5xl flex-1 flex-col px-4 py-10 sm:px-6">
          {children}
        </main>
      </body>
    </html>
  );
}
