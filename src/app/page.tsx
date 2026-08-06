import { Suspense } from "react";
import { Metadata } from "next";
import Hero from "@/components/home/Hero";
import SaranAduan from "@/components/home/SaranAduan";
import KaryaProjekServer from "@/components/home/KaryaProjekServer";
import BeritaSorotan from "@/components/home/BeritaSorotan";
import EventVolunteerServer from "@/components/home/EventVolunteerServer";
import {
  KaryaSkeleton,
  BeritaSkeleton,
  EventVolunteerSkeleton,
} from "@/components/home/HomeSkeleton";

export const metadata: Metadata = {
  title: "BEM STMIK Tazkia | Beranda",
  description:
    "Selamat datang di portal resmi BEM STMIK Tazkia. Satu langkah untuk STMIK Tazkia berdampak.",
};

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
    </>
  );
}
