import { redirect } from 'next/navigation';
import { createClient } from '@/utils/supabase/server';

export default async function LoginLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (user) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    if (profile?.role === 'admin') {
      redirect('/admin');
    } else {
      // Non-admin users are not allowed — redirect to home
      redirect('/');
    }
  }

  return <>{children}</>;
}
