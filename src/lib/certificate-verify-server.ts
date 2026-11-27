import "server-only";
import { headers } from "next/headers";
import { getServiceRoleClient } from "@/lib/auth";
import { checkRateLimit, getClientIp } from "@/lib/rateLimit";
import { isValidCertificateCodeFormat } from "@/lib/certificate-utils";
import type { PublicCertificateVerification } from "@/types/certificate";

export async function verifyCertificateCode(rawCode: string): Promise<{
  schemaReady: boolean;
  rateLimited: boolean;
  result: PublicCertificateVerification;
}> {
  const clean = decodeURIComponent(rawCode || "").trim().toUpperCase();
  if (!clean) {
    return { schemaReady: true, rateLimited: false, result: { found: false } };
  }

  if (!isValidCertificateCodeFormat(clean)) {
    return { schemaReady: true, rateLimited: false, result: { found: false } };
  }

  try {
    const reqHeaders = await headers();
    const clientIp = getClientIp({ headers: reqHeaders } as unknown as Request);
    const rateLimit = await checkRateLimit(`cert_verify_${clientIp}`, {
      limit: 30,
      windowMs: 5 * 60 * 1000,
    });

    if (!rateLimit.success) {
      return { schemaReady: true, rateLimited: true, result: { found: false } };
    }

    const service = getServiceRoleClient();
    const { data, error } = await service.rpc("verify_certificate", {
      p_code: clean,
    });

    if (error) {
      const msg = (error.message || "").toLowerCase();
      if (
        error.code === "42883" ||
        error.code === "PGRST202" ||
        msg.includes("verify_certificate")
      ) {
        return { schemaReady: false, rateLimited: false, result: { found: false } };
      }
      console.warn("[verifyCertificateCode] RPC error:", error.message);
      return { schemaReady: true, rateLimited: false, result: { found: false } };
    }

    if (!data || typeof data !== "object") {
      return { schemaReady: true, rateLimited: false, result: { found: false } };
    }

    return {
      schemaReady: true,
      rateLimited: false,
      result: data as PublicCertificateVerification,
    };
  } catch (err) {
    console.warn("[verifyCertificateCode] Unexpected error:", err);
    return { schemaReady: true, rateLimited: false, result: { found: false } };
  }
}
