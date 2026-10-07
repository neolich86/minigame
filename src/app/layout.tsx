import type { Metadata, Viewport } from "next";
import Script from "next/script";
import { AppProvider } from "@/components/AppProvider";
import { SiteHeader } from "@/components/SiteHeader";
import { translate } from "@/lib/i18n";
import { HOME_SEO } from "@/lib/seo";
import { SITE_URL, serverLang } from "@/lib/serverLang";
import "./globals.css";

const GA_ID = "G-9P8L9T8BS6";
const ADSENSE_CLIENT = "ca-pub-9826307769121956";

export async function generateMetadata(): Promise<Metadata> {
  const { lang } = await serverLang();
  const seo = HOME_SEO[lang];
  // 검색엔진 소유 확인 — Vercel 환경변수에 값만 넣으면 <meta> 가 들어간다
  const google = process.env.GOOGLE_SITE_VERIFICATION;
  const naver = process.env.NAVER_SITE_VERIFICATION;
  return {
    metadataBase: new URL(SITE_URL),
    title: { default: seo.title, template: `%s | ${translate(lang, "siteName")}` },
    description: seo.description,
    keywords: seo.keywords,
    applicationName: translate(lang, "siteName"),
    authors: [{ name: "제임스웹" }],
    // 대표 주소(canonical)는 페이지마다 따로 지정한다 — 여기서 정하면 지정 안 한 페이지가 모두 홈을 가리키게 됨
    alternates: { types: { "application/rss+xml": [{ url: "/rss.xml", title: translate(lang, "siteName") }] } },
    verification: {
      ...(google ? { google } : {}),
      ...(naver ? { other: { "naver-site-verification": naver } } : {}),
    },
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
  };
}

export const viewport: Viewport = { width: "device-width", initialScale: 1, themeColor: "#0e1420" };

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const { lang, fixed } = await serverLang();
  return (
    <html lang={lang}>
      <head>
        {/* Google AdSense — 사이트 소유 확인 겸 자동 광고용. 크롤러가 바로 읽도록 <head>에 일반 script 태그로 둔다 */}
        <meta name="google-adsense-account" content={ADSENSE_CLIENT} />
        <script async src={`https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${ADSENSE_CLIENT}`} crossOrigin="anonymous" />
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
