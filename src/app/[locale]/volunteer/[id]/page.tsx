import { permanentRedirect } from 'next/navigation';

export default async function VolunteerDetailRedirectPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  permanentRedirect(`/${locale}/agenda?tab=volunteer`);
}
