import type { Metadata } from "next";
import { Plus_Jakarta_Sans, Outfit } from "next/font/google";
import LayoutClientWrapper from "@/components/layout/LayoutClientWrapper";
import { ThemeProvider } from "@/components/providers/ThemeProvider";
import { ToastProvider } from "@/components/ui/Toast";
import { createClient } from "@/utils/supabase/server";
import Script from "next/script";
import NextTopLoader from 'nextjs-toploader';
import SiteVisitorTracker from "@/components/SiteVisitorTracker";
import "../globals.css";

const plusJakartaSans = Plus_Jakarta_Sans({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700", "800"],
  variable: "--font-plus-jakarta",
  display: "swap",
});

const outfit = Outfit({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800", "900"],
  variable: "--font-outfit",
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL("https://bem.stmik.tazkia.ac.id"),
  title: "BEM STMIK Tazkia | Badan Eksekutif Mahasiswa",
  description: "Website Resmi BEM STMIK Tazkia — Portal informasi agenda, berita, dokumentasi, dan kegiatan mahasiswa STMIK Tazkia.",
  keywords: ["BEM STMIK Tazkia", "Badan Eksekutif Mahasiswa", "STMIK Tazkia", "Agenda", "Berita", "Dokumentasi", "Kabinet"],
  openGraph: {
    title: "BEM STMIK Tazkia | Badan Eksekutif Mahasiswa",
    description: "Website Resmi BEM STMIK Tazkia — Portal informasi agenda, berita, dokumentasi, dan kegiatan mahasiswa STMIK Tazkia.",
    url: "https://bem.stmik.tazkia.ac.id",
    siteName: "BEM STMIK Tazkia",
    locale: "id_ID",
    type: "website",
    images: [
      {
        url: "/images/logo2.webp",
        width: 1200,
        height: 630,
        alt: "Logo BEM STMIK Tazkia",
      }
    ]
  },
  twitter: {
    card: "summary_large_image",
    title: "BEM STMIK Tazkia | Badan Eksekutif Mahasiswa",
    description: "Website Resmi BEM STMIK Tazkia — Portal informasi agenda, berita, dokumentasi, dan kegiatan mahasiswa STMIK Tazkia.",
    images: ["/images/logo2.webp"],
  },
  verification: {
    google: "NKdorF0xIjBVNflNzjeJir-GhYKYleLPm3C-OVY1gqM",
  },
};

import { NextIntlClientProvider } from 'next-intl';
import { getMessages } from 'next-intl/server';
import { notFound } from 'next/navigation';
import { routing } from '@/i18n/routing';

export default async function RootLayout({
  children,
  params,
}: Readonly<{
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}>) {
  const { locale } = await params;
  
  // Ensure that the incoming `locale` is valid
  if (!routing.locales.includes(locale as any)) {
    notFound();
  }
 
  // Providing all messages to the client
  // side is the easiest way to get started
  const messages = await getMessages();

  let user = null;
  try {
    const supabase = await createClient();
    const { data } = await supabase.auth.getSession();
    user = data.session?.user || null;
  } catch {
    // Tangani error jaringan (walaupun getSession membaca cookie lokal)
    user = null;
  }

  return (
    <html lang={locale} className={`light ${plusJakartaSans.variable} ${outfit.variable}`} suppressHydrationWarning>
      <head>
        <link
          href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@20..48,100..700,0..1,-50..200&display=swap"
          rel="stylesheet"
        />
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=0" />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "WebSite",
              "name": "BEM STMIK Tazkia",
              "alternateName": "Badan Eksekutif Mahasiswa STMIK Tazkia",
              "url": "https://bem.stmik.tazkia.ac.id",
              "potentialAction": {
                "@type": "SearchAction",
                "target": "https://bem.stmik.tazkia.ac.id/id/berita?q={search_term_string}",
                "query-input": "required name=search_term_string"
              }
            })
          }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "Organization",
              "name": "BEM STMIK Tazkia",
              "url": "https://bem.stmik.tazkia.ac.id",
              "logo": "https://bem.stmik.tazkia.ac.id/images/logo2.webp",
              "description": "Badan Eksekutif Mahasiswa (BEM) STMIK Tazkia",
              "contactPoint": {
                "@type": "ContactPoint",
                "contactType": "customer support"
              }
            })
          }}
        />
      </head>
      <body className={`${plusJakartaSans.className} bg-background text-on-background antialiased transition-colors duration-300 overflow-x-hidden w-full`} suppressHydrationWarning>
        <NextTopLoader
          color="#f2791e"
          initialPosition={0.08}
          height={4}
          showSpinner={false}
          easing="ease"
          speed={200}
        />
        <NextIntlClientProvider messages={messages}>
          <ThemeProvider defaultTheme="system">
            <ToastProvider>
              <SiteVisitorTracker />
              <LayoutClientWrapper isLoggedIn={!!user}>{children}</LayoutClientWrapper>
            </ToastProvider>
          </ThemeProvider>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}

