import React from "react";
import { getTranslations } from "next-intl/server";
import CertificateVerifyClient from "@/components/certificates/CertificateVerifyClient";
import { buildPageMetadata } from "@/utils/seo";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "CertificateVerify" });
  return buildPageMetadata({
    locale,
    path: "/sertifikat",
    title: `${t("pageTitle")} - BEM STMIK Tazkia`,
    description: t("pageSubtitle"),
  });
}

export default function CertificateLookupPage() {
  return <CertificateVerifyClient initialCode="" schemaReady={true} verification={null} />;
}
