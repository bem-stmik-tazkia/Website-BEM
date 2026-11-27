import React from "react";
import { redirect } from "next/navigation";
import { getStudentDashboardData } from "@/lib/student-dashboard";
import StudentDashboardOverview from "@/components/dashboard/StudentDashboardOverview";

export const dynamic = "force-dynamic";

export default async function StudentDashboardPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const { user, registrations, articles, certificates } =
    await getStudentDashboardData();

  if (!user) {
    redirect(`/masuk?next=${encodeURIComponent(`/${locale}/dashboard`)}`);
  }

  return (
    <StudentDashboardOverview
      user={user}
      registrations={registrations}
      articles={articles}
      certificates={certificates}
    />
  );
}
