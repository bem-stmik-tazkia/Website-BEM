import type { Metadata, Viewport } from "next";
import { Plus_Jakarta_Sans, Outfit } from "next/font/google";
import LayoutClientWrapper from "@/components/layout/LayoutClientWrapper";
import { ToastProvider } from "@/components/ui/Toast";
import NextTopLoader from 'nextjs-toploader';
import SiteVisitorTracker from "@/components/SiteVisitorTracker";
import { NextIntlClientProvider } from 'next-intl';
import { getMessages } from 'next-intl/server';
import { notFound } from 'next/navigation';
import { routing } from '@/i18n/routing';
import { SITE_NAME, SITE_URL, getOgLocale, safeJsonLdStringify } from '@/utils/seo';
import "../globals.css";

const plusJakartaSans = Plus_Jakarta_Sans({
  subsets: ["latin"],
  variable: "--font-plus-jakarta",
  display: "swap",
});

const outfit = Outfit({
  subsets: ["latin"],
  variable: "--font-outfit",
  display: "swap",
});

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const activeLocale = routing.locales.includes(locale as (typeof routing.locales)[number])
    ? locale
    : routing.defaultLocale;
  const ogLocale = getOgLocale(activeLocale);

  return {
    metadataBase: new URL(SITE_URL),
    title: "BEM STMIK Tazkia | Badan Eksekutif Mahasiswa",
    description:
      "Website Resmi BEM STMIK Tazkia — Portal informasi agenda, berita, artikel mahasiswa, dokumentasi, dan kegiatan mahasiswa STMIK Tazkia.",
    keywords: [
      "BEM STMIK Tazkia",
      "Badan Eksekutif Mahasiswa",
      "STMIK Tazkia",
      "Agenda",
      "Berita",
      "Artikel Mahasiswa",
      "Dokumentasi",
      "Kabinet",
    ],
    openGraph: {
      title: "BEM STMIK Tazkia | Badan Eksekutif Mahasiswa",
      description:
        "Website Resmi BEM STMIK Tazkia — Portal informasi agenda, berita, artikel mahasiswa, dokumentasi, dan kegiatan mahasiswa STMIK Tazkia.",
      url: `${SITE_URL}/${activeLocale}`,
      siteName: SITE_NAME,
      locale: ogLocale,
      alternateLocale: routing.locales
        .filter((l) => l !== activeLocale)
        .map((l) => getOgLocale(l)),
      type: "website",
      images: [
        {
          url: "/images/og-banner.png",
          width: 1200,
          height: 630,
          alt: "BEM STMIK Tazkia - Badan Eksekutif Mahasiswa",
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: "BEM STMIK Tazkia | Badan Eksekutif Mahasiswa",
      description:
        "Website Resmi BEM STMIK Tazkia — Portal informasi agenda, berita, artikel mahasiswa, dokumentasi, dan kegiatan mahasiswa STMIK Tazkia.",
      images: ["/images/og-banner.png"],
    },
    icons: {
      icon: "/images/logo2.webp",
      shortcut: "/images/logo2.webp",
      apple: "/images/logo2.webp",
    },
    verification: {
      google: "NKdorF0xIjBVNflNzjeJir-GhYKYleLPm3C-OVY1gqM",
    },
  };
}

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  userScalable: true,
};

const websiteJsonLd = {
  "@context": "https://schema.org",
  "@type": "WebSite",
  name: SITE_NAME,
  alternateName: "Badan Eksekutif Mahasiswa STMIK Tazkia",
  url: SITE_URL,
  potentialAction: {
    "@type": "SearchAction",
    target: `${SITE_URL}/id/berita?q={search_term_string}`,
    "query-input": "required name=search_term_string",
  },
};

const organizationJsonLd = {
  "@context": "https://schema.org",
  "@type": "Organization",
  name: SITE_NAME,
  alternateName: "Badan Eksekutif Mahasiswa STMIK Tazkia",
  url: SITE_URL,
  logo: `${SITE_URL}/images/logo2.webp`,
  email: "bem@stmik.tazkia.ac.id",
  description: "Badan Eksekutif Mahasiswa (BEM) STMIK Tazkia",
  address: {
    "@type": "PostalAddress",
    streetAddress: "Jalan Raya Dramaga Km.7, Kelurahan Margajaya, Kecamatan Bogor Barat",
    addressLocality: "Kota Bogor",
    addressRegion: "Jawa Barat",
    postalCode: "16680",
    addressCountry: "ID",
  },
  sameAs: [
    "https://www.instagram.com/bem_stmiktazkia",
    "https://www.youtube.com/@ofcbemstmiktazkia",
    "https://www.tiktok.com/@bem.stmik.tazkia",
    "https://discord.gg/dFVN24ZMXU",
  ],
  contactPoint: {
    "@type": "ContactPoint",
    email: "bem@stmik.tazkia.ac.id",
    contactType: "customer support",
  },
};

export default async function RootLayout({
  children,
  params,
}: Readonly<{
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}>) {
  const { locale } = await params;

  // Ensure that the incoming `locale` is valid
  if (!routing.locales.includes(locale as (typeof routing.locales)[number])) {
    notFound();
  }

  const messages = await getMessages();

  return (
    <html lang={locale} dir="ltr" className={`light ${plusJakartaSans.variable} ${outfit.variable}`} suppressHydrationWarning>
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: safeJsonLdStringify(websiteJsonLd) }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: safeJsonLdStringify(organizationJsonLd) }}
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
            <ToastProvider>
              <SiteVisitorTracker />
              <LayoutClientWrapper>{children}</LayoutClientWrapper>
            </ToastProvider>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
