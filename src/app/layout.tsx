// Root layout minimal — diperlukan agar Next.js tidak membuat DefaultLayout otomatis.
// <html> dan <body> yang sebenarnya ada di src/app/[locale]/layout.tsx
export default function RootLayout({ children }: { children: React.ReactNode }) {
  return children;
}
