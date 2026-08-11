import { Suspense } from "react";
import { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import Hero from "@/components/home/Hero";
import SaranAduan from "@/components/home/SaranAduan";
import KaryaProjekServer from "@/components/home/KaryaProjekServer";
import BeritaSorotan from "@/components/home/BeritaSorotan";
import EventVolunteerServer from "@/components/home/EventVolunteerServer";
import HomeTourClient from "@/components/home/HomeTourClient";
import {
  KaryaSkeleton,
  BeritaSkeleton,
  EventVolunteerSkeleton,
} from "@/components/home/HomeSkeleton";

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'LandingPage' });
  return {
    title: t('title'),
    description: t('desc'),
  };
}

export default function Home() {
  return (
    <>
      {/* Hero tidak menunggu data apapun — langsung tampil */}
      <Hero />

      {/* Karya & Berita fetch secara paralel (tidak saling menunggu) */}
      <Suspense fallback={<KaryaSkeleton />}>
        <KaryaProjekServer />
      </Suspense>

      <Suspense fallback={<BeritaSkeleton />}>
        <BeritaSorotan />
      </Suspense>

      <Suspense fallback={<EventVolunteerSkeleton />}>
        <EventVolunteerServer />
      </Suspense>

      <SaranAduan />
      
      <HomeTourClient />
    </>
  );
}
