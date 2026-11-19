import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import Link from "next/link";
import { I18nProvider } from "@/features/i18n/i18n-provider";
import { LocaleSwitcher } from "@/features/i18n/locale-switcher";
import { getDictionary } from "@/i18n/get-dictionary";
import { getLocale } from "@/i18n/get-locale";
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

export default async function RootLayout({ children }: LayoutProps<"/">) {
  const locale = await getLocale();
  const dictionary = await getDictionary(locale);

  return (
    <html
      lang={locale}
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="flex min-h-full flex-col bg-background font-sans text-foreground">
        <I18nProvider locale={locale} dictionary={dictionary}>
          <header className="border-b border-border">
            <div className="mx-auto flex h-14 w-full max-w-5xl items-center justify-between gap-4 px-4 sm:px-6">
              <Link href="/" className="text-sm font-semibold tracking-tight">
                {dictionary.brand}
              </Link>
              <LocaleSwitcher />
            </div>
          </header>
          <main className="mx-auto flex w-full max-w-5xl flex-1 flex-col px-4 py-10 sm:px-6">
            {children}
          </main>
        </I18nProvider>
      </body>
    </html>
  );
}
