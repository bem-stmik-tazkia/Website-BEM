import { redirect } from 'next/navigation';

export default async function VolunteerIndexPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  redirect(`/${locale}/agenda?tab=volunteer`);
}

