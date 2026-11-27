import React from "react";
import { getTranslations } from "next-intl/server";
import { verifyCertificateCode } from "@/lib/certificate-verify-server";
import CertificateVerifyClient from "@/components/certificates/CertificateVerifyClient";

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string; code: string }>;
}) {
  const { locale, code } = await params;
  const t = await getTranslations({ locale, namespace: "CertificateVerify" });
  const cleanCode = decodeURIComponent(code || "").toUpperCase();
  return {
    title: `${t("pageTitle")} (${cleanCode}) - BEM STMIK Tazkia`,
    description: t("pageSubtitle"),
    robots: {
      index: false,
      follow: false,
    },
  };
}

export default async function CertificateCodeVerifyPage({
  params,
}: {
  params: Promise<{ locale: string; code: string }>;
}) {
  const { code } = await params;
  const cleanCode = decodeURIComponent(code || "").trim();
  const { schemaReady, rateLimited, result } = await verifyCertificateCode(cleanCode);

  return (
    <CertificateVerifyClient
      initialCode={cleanCode}
      schemaReady={schemaReady}
      rateLimited={rateLimited}
      verification={result}
    />
  );
}
