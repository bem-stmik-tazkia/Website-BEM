import type { Metadata } from "next";
import LayoutClientWrapper from "@/components/layout/LayoutClientWrapper";
import { ThemeProvider } from "@/components/providers/ThemeProvider";
import { ToastProvider } from "@/components/ui/Toast";
import { createClient } from "@/utils/supabase/server";
import Script from "next/script";
import "../globals.css";

export const metadata: Metadata = {
  title: "BEM STMIK Tazkia | Badan Eksekutif Mahasiswa",
  description: "Website Resmi BEM STMIK Tazkia — Portal informasi agenda, berita, dokumentasi, dan kegiatan mahasiswa STMIK Tazkia.",
  keywords: ["BEM STMIK Tazkia", "Badan Eksekutif Mahasiswa", "STMIK Tazkia", "Agenda", "Berita", "Dokumentasi", "Kabinet"],
  openGraph: {
    title: "BEM STMIK Tazkia | Badan Eksekutif Mahasiswa",
    description: "Website Resmi BEM STMIK Tazkia — Portal informasi agenda, berita, dokumentasi, dan kegiatan mahasiswa STMIK Tazkia.",
    url: "https://bem-stmik-tazkia.vercel.app",
    siteName: "BEM STMIK Tazkia",
    locale: "id_ID",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "BEM STMIK Tazkia | Badan Eksekutif Mahasiswa",
    description: "Website Resmi BEM STMIK Tazkia — Portal informasi agenda, berita, dokumentasi, dan kegiatan mahasiswa STMIK Tazkia.",
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

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  return (
    <html lang={locale} className="light" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@300;400;500;600;700;800&family=Outfit:wght@400;500;600;700;800;900&display=swap"
          rel="stylesheet"
        />
        <link
          href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@20..48,100..700,0..1,-50..200&display=swap"
          rel="stylesheet"
        />
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=0" />
      </head>
      <body className="bg-background text-on-background font-sans antialiased transition-colors duration-300" suppressHydrationWarning>
        <NextIntlClientProvider messages={messages}>
          <ThemeProvider defaultTheme="system">
            <ToastProvider>
              <LayoutClientWrapper isLoggedIn={!!user}>{children}</LayoutClientWrapper>
            </ToastProvider>
          </ThemeProvider>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}

