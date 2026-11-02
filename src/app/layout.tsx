import type { Metadata, Viewport } from "next";
import { Plus_Jakarta_Sans } from "next/font/google";
import { Footer, Header, MobileNav } from "@/components/shell";
import { themeScript } from "@/components/theme";
import { BadgeToaster } from "@/components/badge-toast";
import "./globals.css";

const jakarta = Plus_Jakarta_Sans({ subsets: ["latin"], variable: "--font-jakarta", display: "swap" });

export const metadata: Metadata = {
  title: { default: "Stockzz: Learn the stock market by doing", template: "%s · Stockzz" },
  description:
    "Interactive lessons and a 10-round market simulation with ₹1,00,000 of virtual money. Every decision is reviewed on its reasoning, not just its profit.",
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#ffffff" },
    { media: "(prefers-color-scheme: dark)", color: "#0a0908" },
  ],
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en-IN" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      </head>
      <body className={`${jakarta.variable} min-h-screen antialiased`}>
        <Header />
        <main id="main" className="mx-auto max-w-[1536px] px-4 py-8 sm:px-6 sm:py-10 lg:px-8">
          {children}
        </main>
        <Footer />
        <MobileNav />
        <BadgeToaster />
      </body>
    </html>
  );
}
