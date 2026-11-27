import type { Metadata, Viewport } from "next";
import { Plus_Jakarta_Sans, Outfit } from "next/font/google";
import LayoutClientWrapper from "@/components/layout/LayoutClientWrapper";
import { ToastProvider } from "@/components/ui/Toast";
import NextTopLoader from "nextjs-toploader";
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

export const metadata: Metadata = {
  metadataBase: new URL("https://bem.stmik.tazkia.ac.id"),
  title: "BEM STMIK Tazkia | Badan Eksekutif Mahasiswa",
  description: "Website Resmi BEM STMIK Tazkia — Portal informasi agenda, berita, dokumentasi, dan kegiatan mahasiswa STMIK Tazkia.",
  robots: {
    index: false,
    follow: false,
  },
  openGraph: {
    title: "BEM STMIK Tazkia | Badan Eksekutif Mahasiswa",
    description: "Website Resmi BEM STMIK Tazkia — Portal informasi agenda, berita, dokumentasi, dan kegiatan mahasiswa STMIK Tazkia.",
    url: "https://bem.stmik.tazkia.ac.id",
    siteName: "BEM STMIK Tazkia",
    locale: "id_ID",
    type: "website",
    images: [
      {
        url: "/images/og-banner.png",
        width: 1200,
        height: 630,
        alt: "BEM STMIK Tazkia",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "BEM STMIK Tazkia | Badan Eksekutif Mahasiswa",
    description: "Website Resmi BEM STMIK Tazkia — Portal informasi agenda, berita, dokumentasi, dan kegiatan mahasiswa STMIK Tazkia.",
    images: ["/images/og-banner.png"],
  },
  icons: {
    icon: "/images/logo2.webp",
    shortcut: "/images/logo2.webp",
    apple: "/images/logo2.webp",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  userScalable: true,
};

import { NextIntlClientProvider } from 'next-intl';
import { getMessages } from 'next-intl/server';

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const messages = await getMessages();

  return (
    <html lang="id" className={`light ${plusJakartaSans.variable} ${outfit.variable}`} suppressHydrationWarning>
      <head />
      <body className={`${plusJakartaSans.className} bg-background text-on-background font-sans antialiased transition-colors duration-300`} suppressHydrationWarning>
        <NextTopLoader
          color="#1b4086"
          initialPosition={0.1}
          height={3}
          showSpinner={false}
          easing="ease"
          speed={200}
          shadow="0 0 10px #1b4086,0 0 5px #1b4086"
        />
        <NextIntlClientProvider messages={messages}>
            <ToastProvider>
              <LayoutClientWrapper>{children}</LayoutClientWrapper>
            </ToastProvider>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
