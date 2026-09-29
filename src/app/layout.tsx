import type { Metadata, Viewport } from "next";
import { cookies, headers } from "next/headers";
import { AppProvider } from "@/components/AppProvider";
import { SiteHeader } from "@/components/SiteHeader";
import { LANG_COOKIE, normLang, pickLang, translate, type Lang } from "@/lib/i18n";
import "./globals.css";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://minigame-on.vercel.app";

async function serverLang(): Promise<{ lang: Lang; fromCookie: boolean }> {
  const c = normLang((await cookies()).get(LANG_COOKIE)?.value);
  if (c) return { lang: c, fromCookie: true };
  return { lang: pickLang((await headers()).get("accept-language")), fromCookie: false };
}

export async function generateMetadata(): Promise<Metadata> {
  const { lang } = await serverLang();
  const title = lang === "ko" ? "미니 게임 천국 | Mini Game Heaven" : "Mini Game Heaven | 미니 게임 천국";
  const description = translate(lang, "metaDescription");
  return {
    metadataBase: new URL(SITE_URL),
    title: { default: title, template: `%s | ${translate(lang, "siteName")}` },
    description,
    authors: [{ name: "제임스웹" }],
    alternates: { canonical: "/" },
    openGraph: {
      type: "website",
      siteName: translate(lang, "siteName"),
      title,
      description,
      locale: lang === "ko" ? "ko_KR" : "en_US",
      alternateLocale: lang === "ko" ? "en_US" : "ko_KR",
      images: [{ url: "/og-image.jpg", width: 1200, height: 630 }],
    },
    twitter: { card: "summary_large_image", title, description, images: ["/og-image.jpg"] },
    icons: {
      icon: "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'%3E%3Crect width='100' height='100' rx='22' fill='%230e1420'/%3E%3Ctext x='50' y='68' font-size='58' text-anchor='middle'%3E%F0%9F%95%B9%EF%B8%8F%3C/text%3E%3C/svg%3E",
    },
  };
}

export const viewport: Viewport = { width: "device-width", initialScale: 1, themeColor: "#0e1420" };

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const { lang, fromCookie } = await serverLang();
  return (
    <html lang={lang}>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        {/* eslint-disable-next-line @next/next/no-page-custom-font */}
        <link
          href="https://fonts.googleapis.com/css2?family=Gothic+A1:wght@300;400;500;600;700&family=Space+Mono:wght@400;700&family=Noto+Sans+KR:wght@400;500;600;700;900&display=swap"
          rel="stylesheet"
        />
      </head>
      <body>
        <AppProvider initialLang={lang} langFromCookie={fromCookie}>
          <SiteHeader />
          {children}
        </AppProvider>
      </body>
    </html>
  );
}
