import type { Metadata } from "next";
import LayoutClientWrapper from "@/components/layout/LayoutClientWrapper";
import { ThemeProvider } from "@/components/providers/ThemeProvider";
import { ToastProvider } from "@/components/ui/Toast";
import { createClient } from "@/utils/supabase/server";
import Script from "next/script";
import "./globals.css";

export const metadata: Metadata = {
  title: "BEM STMIK Tazkia | Portal Inovasi Mahasiswa",
  description: "Website Resmi BEM STMIK Tazkia dan Etalase Karya Inovasi Teknologi Mahasiswa",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  return (
    <html lang="id" className="light" suppressHydrationWarning>
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
        <ThemeProvider defaultTheme="system">
          <ToastProvider>
            <LayoutClientWrapper isLoggedIn={!!user}>{children}</LayoutClientWrapper>
          </ToastProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}

