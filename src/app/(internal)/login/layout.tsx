import { redirect } from 'next/navigation';
import { getAdminUser } from '@/lib/auth';
import { createClient } from '@/utils/supabase/server';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Login Admin - BEM STMIK Tazkia',
  robots: {
    index: false,
    follow: false,
  },
};

export default async function LoginLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (user) {
    const admin = await getAdminUser();
    if (admin) {
      redirect('/admin');
    } else {
      // Non-admin users are not allowed — redirect to home
      redirect('/');
    }
  }

  return <>{children}</>;
}
