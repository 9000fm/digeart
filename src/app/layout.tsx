import type { Metadata, Viewport } from "next";
import { headers } from "next/headers";
import { Space_Mono } from "next/font/google";
import localFont from "next/font/local";
import { SessionProvider } from "next-auth/react";
import ThemeProvider from "@/components/ThemeProvider";
import LanguageProvider from "@/components/LanguageProvider";
import PreferencesProvider from "@/components/PreferencesProvider";
import { LOCALES, type Locale } from "@/lib/i18n";
import "./globals.css";

function detectLocaleFromHeader(header: string | null): Locale {
  if (!header) return "en";
  const first = header.split(",")[0]?.trim().toLowerCase() ?? "";
  for (const loc of LOCALES) {
    if (first.startsWith(loc)) return loc as Locale;
  }
  if (first.startsWith("ja")) return "ja";
  return "en";
}

const spaceMono = Space_Mono({ subsets: ["latin"], weight: ["400", "700"] });
// Self-hosted (was next/font/google) — kills the dev-only "Failed to find font
// override values for 'Big Shoulders'" warning Next emits when its metrics DB
// lacks the renamed family. Same 700-weight latin face, no external fetch.
const bigShoulders = localFont({
  src: "./fonts/BigShoulders-Bold.woff2",
  weight: "700",
  variable: "--font-banner",
  display: "swap",
});
const displayFont = localFont({
  src: "./fonts/FlexingDemoRegular.ttf",
  variable: "--font-display",
  display: "swap",
});

export const metadata: Metadata = {
  title: "digeart · music from the underground",
  description: "Music from the underground.",
  openGraph: {
    title: "digeart",
    description: "Music from the underground.",
    url: "https://digeart.vercel.app",
    siteName: "digeart",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "digeart",
    description: "Music from the underground.",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const h = await headers();
  const serverLocale = detectLocaleFromHeader(h.get("accept-language"));
  return (
    <html lang={serverLocale}>
      <head>
        {/* Warm the YouTube thumbnail connection so covers load faster */}
        <link rel="preconnect" href="https://i.ytimg.com" crossOrigin="" />
        <link rel="dns-prefetch" href="https://i.ytimg.com" />
      </head>
      <body className={`${spaceMono.className} ${displayFont.variable} ${bigShoulders.variable} antialiased`}>
        <SessionProvider>
          <ThemeProvider>
            <LanguageProvider serverLocale={serverLocale}>
              <PreferencesProvider>
                {children}
              </PreferencesProvider>
            </LanguageProvider>
          </ThemeProvider>
        </SessionProvider>
      </body>
    </html>
  );
}
