import type { Metadata, Viewport } from "next";
import Script from "next/script";
import { AppProvider } from "@/components/AppProvider";
import { SiteHeader } from "@/components/SiteHeader";
import { translate } from "@/lib/i18n";
import { HOME_SEO } from "@/lib/seo";
import { SITE_URL, langAlternates, serverLang } from "@/lib/serverLang";
import "./globals.css";

const GA_ID = "G-9P8L9T8BS6";

export async function generateMetadata(): Promise<Metadata> {
  const { lang, fromParam } = await serverLang();
  const seo = HOME_SEO[lang];
  return {
    metadataBase: new URL(SITE_URL),
    title: { default: seo.title, template: `%s | ${translate(lang, "siteName")}` },
    description: seo.description,
    keywords: seo.keywords,
    applicationName: translate(lang, "siteName"),
    authors: [{ name: "제임스웹" }],
    alternates: langAlternates("/", lang, fromParam),
    openGraph: {
      type: "website",
      siteName: translate(lang, "siteName"),
      title: seo.title,
      description: seo.description,
      locale: lang === "ko" ? "ko_KR" : "en_US",
      alternateLocale: lang === "ko" ? "en_US" : "ko_KR",
      images: [{ url: "/og-image.jpg", width: 1200, height: 630 }],
    },
    twitter: { card: "summary_large_image", title: seo.title, description: seo.description, images: ["/og-image.jpg"] },
    robots: { index: true, follow: true, googleBot: { index: true, follow: true, "max-image-preview": "large" } },
    icons: {
      icon: "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'%3E%3Crect width='100' height='100' rx='22' fill='%230e1420'/%3E%3Ctext x='50' y='68' font-size='58' text-anchor='middle'%3E%F0%9F%95%B9%EF%B8%8F%3C/text%3E%3C/svg%3E",
    },
  };
}

export const viewport: Viewport = { width: "device-width", initialScale: 1, themeColor: "#0e1420" };

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const { lang, fixed } = await serverLang();
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
        {/* Google Analytics (gtag.js) — 페이지 이동은 GA4 향상된 측정(브라우저 기록 변경)으로 자동 집계 */}
        <Script src={`https://www.googletagmanager.com/gtag/js?id=${GA_ID}`} strategy="afterInteractive" />
        <Script id="ga-init" strategy="afterInteractive">
          {`window.dataLayer = window.dataLayer || [];
function gtag(){dataLayer.push(arguments);}
gtag('js', new Date());
gtag('config', '${GA_ID}');`}
        </Script>
        <AppProvider initialLang={lang} langFromCookie={fixed}>
          <SiteHeader />
          {children}
        </AppProvider>
      </body>
    </html>
  );
}
