"use server";

import { revalidatePath } from "next/cache";
import { after } from "next/server";
import { requireAdmin, getServiceRoleClient } from "@/lib/auth";
import type { AgendaKegiatan, VolunteerApplication } from "@/types/agenda";
import type {
  CertificateDesignPreset,
  CertificateLayoutConfig,
  CertificateRecord,
  CertificateSigner,
  CertificateStatus,
  CertificateTemplate,
} from "@/types/certificate";
import {
  buildTemplateSnapshot,
  clampCertificateLayoutConfig,
  DEFAULT_CERTIFICATE_SIGNERS,
  extractApplicantInfoForCertificate,
  extractOwnCertificateStoragePath,
  formatCertificateNumber,
  formatIndonesianLongDate,
  generateCertificateCode,
  sanitizeCertificateAssetUrl,
  sanitizeCertificateText,
} from "@/lib/certificate-utils";

const UUID_REGEX =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const VALID_PRESETS = new Set<CertificateDesignPreset>([
  "classic-navy",
  "emerald-gold",
  "modern-royal",
  "custom-bg",
]);
const MAX_BATCH_RECIPIENTS = 500;

function isMissingCertificatesTableError(err: { code?: string; message?: string } | null | undefined): boolean {
  if (!err) return false;
  const msg = (err.message || "").toLowerCase();
  return (
    err.code === "42P01" ||
    err.code === "PGRST205" ||
    msg.includes("certificate_templates") ||
    msg.includes("does not exist") ||
    msg.includes("schema cache")
  );
}

function revalidateCertificatePaths(templateId?: string | null) {
  try {
    revalidatePath("/admin/sertifikat");
    if (templateId) {
      revalidatePath(`/admin/sertifikat/${templateId}`);
    }
    revalidatePath("/[locale]/dashboard", "page");
    revalidatePath("/[locale]/dashboard/kegiatan", "page");
    revalidatePath("/[locale]/dashboard/sertifikat", "page");
    revalidatePath("/[locale]/sertifikat", "page");
  } catch (err) {
    console.warn("[revalidateCertificatePaths] Non-fatal cache warning:", err);
  }
}

async function cleanupUnreferencedCertificateAssets(assetUrls: Array<string | null | undefined>) {
  const storagePaths = Array.from(
    new Set(
      assetUrls
        .map((url) => (url ? extractOwnCertificateStoragePath(url) : null))
        .filter((p): p is string => Boolean(p))
    )
  );
  if (storagePaths.length === 0) return;

  try {
    const bgService = getServiceRoleClient();
    for (const storagePath of storagePaths) {
      const [{ count: tplBgCount }, { count: tplSigCount }, { count: certFileCount }, { count: certSnapCount }] =
        await Promise.all([
          bgService
            .from("certificate_templates")
            .select("id", { count: "exact", head: true })
            .ilike("background_image_url", `%${storagePath}%`),
          bgService
            .from("certificate_templates")
            .select("id", { count: "exact", head: true })
            .filter("signers::text", "ilike", `%${storagePath}%`),
          bgService
            .from("certificates")
            .select("id", { count: "exact", head: true })
            .ilike("custom_file_url", `%${storagePath}%`),
          bgService
            .from("certificates")
            .select("id", { count: "exact", head: true })
            .filter("render_snapshot::text", "ilike", `%${storagePath}%`),
        ]);

      if (
        (tplBgCount ?? 0) === 0 &&
        (tplSigCount ?? 0) === 0 &&
        (certFileCount ?? 0) === 0 &&
        (certSnapCount ?? 0) === 0
      ) {
        await bgService.storage.from("public_images").remove([storagePath]);
      }
    }
  } catch (err) {
    console.warn("[cleanupUnreferencedCertificateAssets] Storage cleanup skipped:", err);
  }
}

export interface CertificateAgendaOption {
  id: string;
  title: string;
  type: "event" | "volunteer" | "dokumentasi";
  date: string | null;
  location: string | null;
  accepted_count: number;
}

export interface CertificateAdminOverview {
  schemaReady: boolean;
  templates: CertificateTemplate[];
  agendas: CertificateAgendaOption[];
  stats: {
    totalTemplates: number;
    totalIssued: number;
    totalRevoked: number;
    linkedToAccountCount: number;
  };
  recentCertificates: CertificateRecord[];
}

export async function getCertificateAdminOverview(): Promise<CertificateAdminOverview> {
  await requireAdmin();
  const service = getServiceRoleClient();

  const [templatesRes, certsRes, agendasRes, appsRes] = await Promise.all([
    service
      .from("certificate_templates")
      .select("*")
      .order("created_at", { ascending: false }),
    service
      .from("certificates")
      .select("*")
      .order("issued_at", { ascending: false }),
    service
      .from("agendas")
      .select("id, title, type, date, location")
      .order("created_at", { ascending: false }),
    service
      .from("volunteer_applications")
      .select("agenda_id, status"),
  ]);

  if (isMissingCertificatesTableError(templatesRes.error) || isMissingCertificatesTableError(certsRes.error)) {
    return {
      schemaReady: false,
      templates: [],
      agendas: [],
      stats: {
        totalTemplates: 0,
        totalIssued: 0,
        totalRevoked: 0,
        linkedToAccountCount: 0,
      },
      recentCertificates: [],
    };
  }

  const certs = (certsRes.data || []) as CertificateRecord[];
  const templateCountMap = new Map<string, { total: number; issued: number }>();
  for (const cert of certs) {
    if (!cert.template_id) continue;
    const prev = templateCountMap.get(cert.template_id) || { total: 0, issued: 0 };
    prev.total += 1;
    if (cert.status === "issued") prev.issued += 1;
    templateCountMap.set(cert.template_id, prev);
  }

  const templates = ((templatesRes.data || []) as CertificateTemplate[]).map((tpl) => {
    const counts = templateCountMap.get(tpl.id);
    return {
      ...tpl,
      signers: Array.isArray(tpl.signers) ? tpl.signers : DEFAULT_CERTIFICATE_SIGNERS,
      layout_config: tpl.layout_config || {},
      certificate_count: counts?.total || 0,
      issued_count: counts?.issued || 0,
    };
  });

  const acceptedCountMap = new Map<string, number>();
  for (const app of (appsRes.data || []) as Array<{ agenda_id: string; status: string | null }>) {
    if (app.status !== "rejected" && app.status !== "pending") {
      acceptedCountMap.set(app.agenda_id, (acceptedCountMap.get(app.agenda_id) || 0) + 1);
    }
  }

  const agendas: CertificateAgendaOption[] = ((agendasRes.data || []) as any[]).map((ag) => ({
    id: ag.id,
    title: ag.title,
    type: ag.type || "event",
    date: ag.date || null,
    location: ag.location || null,
    accepted_count: acceptedCountMap.get(ag.id) || 0,
  }));

  return {
    schemaReady: true,
    templates,
    agendas,
    stats: {
      totalTemplates: templates.length,
      totalIssued: certs.filter((c) => c.status === "issued").length,
      totalRevoked: certs.filter((c) => c.status === "revoked").length,
      linkedToAccountCount: certs.filter((c) => Boolean(c.user_id)).length,
    },
    recentCertificates: certs.slice(0, 12),
  };
}

export interface AcceptedApplicantCandidate {
  application_id: string;
  user_id: string | null;
  item_name: string | null;
  recipient_name: string;
  role_title: string;
  created_at: string;
  already_issued: boolean;
  existing_certificate_code: string | null;
}

export interface CertificateTemplateDetailData {
  schemaReady: boolean;
  template: CertificateTemplate | null;
  certificates: CertificateRecord[];
  agendas: CertificateAgendaOption[];
  acceptedCandidates: AcceptedApplicantCandidate[];
}

export async function getCertificateTemplateDetail(
  templateId: string
): Promise<CertificateTemplateDetailData> {
  await requireAdmin();
  if (!UUID_REGEX.test(templateId)) {
    return {
      schemaReady: true,
      template: null,
      certificates: [],
      agendas: [],
      acceptedCandidates: [],
    };
  }

  const service = getServiceRoleClient();
  const [tplRes, certsRes, agendasRes] = await Promise.all([
    service
      .from("certificate_templates")
      .select("*")
      .eq("id", templateId)
      .maybeSingle(),
    service
      .from("certificates")
      .select("*")
      .eq("template_id", templateId)
      .order("created_at", { ascending: false }),
    service
      .from("agendas")
      .select("id, title, type, date, location, form_schema")
      .order("created_at", { ascending: false }),
  ]);

  if (isMissingCertificatesTableError(tplRes.error)) {
    return {
      schemaReady: false,
      template: null,
      certificates: [],
      agendas: [],
      acceptedCandidates: [],
    };
  }

  if (tplRes.error || !tplRes.data) {
    return {
      schemaReady: true,
      template: null,
      certificates: [],
      agendas: [],
      acceptedCandidates: [],
    };
  }

  const template = {
    ...(tplRes.data as CertificateTemplate),
    signers: Array.isArray(tplRes.data.signers)
      ? (tplRes.data.signers as CertificateSigner[])
      : DEFAULT_CERTIFICATE_SIGNERS,
    layout_config: (tplRes.data.layout_config || {}) as CertificateLayoutConfig,
  };
  const certificates = (certsRes.data || []) as CertificateRecord[];

  const agendasData = (agendasRes.data || []) as Array<
    Pick<AgendaKegiatan, "id" | "title" | "type" | "date" | "location" | "form_schema">
  >;

  let acceptedCandidates: AcceptedApplicantCandidate[] = [];
  if (template.agenda_id) {
    const linkedAgenda = agendasData.find((a) => a.id === template.agenda_id);
    const [appsRes, itemsRes] = await Promise.all([
      service
        .from("volunteer_applications")
        .select("*")
        .eq("agenda_id", template.agenda_id)
        .neq("status", "rejected")
        .neq("status", "pending")
        .order("created_at", { ascending: true }),
      service
        .from("agenda_items")
        .select("*")
        .eq("agenda_id", template.agenda_id),
    ]);

    const issuedByAppId = new Map<string, string>();
    for (const c of certificates) {
      if (c.application_id) {
        issuedByAppId.set(c.application_id, c.certificate_code);
      }
    }

    const apps = (appsRes.data || []) as VolunteerApplication[];
    const items = (itemsRes.data || []) as any[];
    const formSchema = Array.isArray(linkedAgenda?.form_schema)
      ? linkedAgenda.form_schema
      : [];

    acceptedCandidates = apps.map((app) => {
      const info = extractApplicantInfoForCertificate(
        app,
        formSchema,
        items,
        linkedAgenda?.type || "event"
      );
      const existingCode = issuedByAppId.get(app.id) || null;
      return {
        application_id: app.id,
        user_id: app.user_id || null,
        item_name: app.item_name || null,
        recipient_name: info.recipient_name,
        role_title: info.role_title,
        created_at: app.created_at,
        already_issued: Boolean(existingCode),
        existing_certificate_code: existingCode,
      };
    });
  }

  return {
    schemaReady: true,
    template,
    certificates,
    agendas: agendasData.map((a) => ({
      id: a.id,
      title: a.title,
      type: a.type || "event",
      date: a.date || null,
      location: a.location || null,
      accepted_count: 0,
    })),
    acceptedCandidates,
  };
}

export interface SaveCertificateTemplateInput {
  id?: string;
  agenda_id?: string | null;
  title: string;
  subtitle?: string;
  description?: string | null;
  event_date_label?: string | null;
  location?: string | null;
  number_prefix?: string;
  design_preset: CertificateDesignPreset;
  background_image_url?: string | null;
  layout_config?: CertificateLayoutConfig;
  signers?: CertificateSigner[];
  issued_city?: string;
  issued_date_label?: string | null;
}

export async function saveCertificateTemplate(
  input: SaveCertificateTemplateInput
): Promise<{ ok: boolean; id?: string; error?: string }> {
  try {
    const { user } = await requireAdmin();
    const service = getServiceRoleClient();

    const cleanTitle = sanitizeCertificateText(input.title, 200);
    if (!cleanTitle) {
      return { ok: false, error: "Judul kegiatan pada sertifikat wajib diisi." };
    }

    if (
      input.background_image_url &&
      input.background_image_url.trim() !== "" &&
      !sanitizeCertificateAssetUrl(input.background_image_url, { allowPdf: false })
    ) {
      return {
        ok: false,
        error: "URL background template tidak valid atau tidak menggunakan HTTPS yang aman.",
      };
    }

    const cleanBgUrl = sanitizeCertificateAssetUrl(input.background_image_url, {
      allowPdf: false,
    });

    const cleanSigners: CertificateSigner[] = [];
    for (const s of (input.signers || []).slice(0, 3)) {
      const sigName = sanitizeCertificateText(s?.name, 100);
      const sigRole = sanitizeCertificateText(s?.role, 120);
      if (s?.signature_url && s.signature_url.trim() !== "") {
        const safeSig = sanitizeCertificateAssetUrl(s.signature_url, { allowPdf: false });
        if (!safeSig) {
          return {
            ok: false,
            error: "URL gambar tanda tangan tidak valid atau diblokir demi keamanan.",
          };
        }
        if (sigName || sigRole) {
          cleanSigners.push({ name: sigName, role: sigRole, signature_url: safeSig });
        }
      } else if (sigName || sigRole) {
        cleanSigners.push({ name: sigName, role: sigRole, signature_url: null });
      }
    }

    const preset = VALID_PRESETS.has(input.design_preset)
      ? input.design_preset
      : "classic-navy";

    const payload = {
      agenda_id: input.agenda_id && UUID_REGEX.test(input.agenda_id) ? input.agenda_id : null,
      title: cleanTitle,
      subtitle: sanitizeCertificateText(input.subtitle, 120) || "SERTIFIKAT PENGHARGAAN",
      description: input.description ? sanitizeCertificateText(input.description, 600) : null,
      event_date_label: input.event_date_label
        ? sanitizeCertificateText(input.event_date_label, 120)
        : null,
      location: input.location ? sanitizeCertificateText(input.location, 200) : null,
      number_prefix:
        sanitizeCertificateText(input.number_prefix, 80) || "SERT/BEM-TAZKIA",
      design_preset: preset,
      background_image_url: cleanBgUrl,
      layout_config: clampCertificateLayoutConfig(input.layout_config),
      signers: cleanSigners,
      issued_city: sanitizeCertificateText(input.issued_city, 80) || "Bogor",
      issued_date_label:
        sanitizeCertificateText(input.issued_date_label, 120) ||
        formatIndonesianLongDate(new Date()),
    };

    if (input.id && UUID_REGEX.test(input.id)) {
      const { error } = await service
        .from("certificate_templates")
        .update(payload)
        .eq("id", input.id);

      if (error) {
        return { ok: false, error: error.message };
      }

      // Sinkronkan render_snapshot & metadata acara pada sertifikat terhubung
      const snapshot = buildTemplateSnapshot(payload);
      await service
        .from("certificates")
        .update({
          agenda_id: payload.agenda_id,
          activity_title: payload.title,
          activity_date_label: payload.event_date_label,
          render_snapshot: snapshot,
        })
        .eq("template_id", input.id);

      revalidateCertificatePaths(input.id);
      return { ok: true, id: input.id };
    }

    const { data: inserted, error } = await service
      .from("certificate_templates")
      .insert([{ ...payload, created_by: user.id }])
      .select("id")
      .single();

    if (error || !inserted) {
      return { ok: false, error: error?.message || "Gagal membuat template sertifikat." };
    }

    revalidateCertificatePaths(inserted.id);
    return { ok: true, id: inserted.id };
  } catch (err: any) {
    return { ok: false, error: err?.message || "Terjadi kesalahan server." };
  }
}

export async function deleteCertificateTemplate(
  templateId: string
): Promise<{ ok: boolean; error?: string }> {
  try {
    await requireAdmin();
    if (!UUID_REGEX.test(templateId)) {
      return { ok: false, error: "ID template tidak valid." };
    }
    const service = getServiceRoleClient();
    const { data: existingTpl } = await service
      .from("certificate_templates")
      .select("background_image_url, signers")
      .eq("id", templateId)
      .maybeSingle();

    const { error } = await service
      .from("certificate_templates")
      .delete()
      .eq("id", templateId);

    if (error) return { ok: false, error: error.message };

    if (existingTpl) {
      const assetsToCheck: Array<string | null | undefined> = [
        existingTpl.background_image_url,
        ...(Array.isArray(existingTpl.signers)
          ? existingTpl.signers.map((s: any) => s?.signature_url)
          : []),
      ];
      after(() => cleanupUnreferencedCertificateAssets(assetsToCheck));
    }

    revalidateCertificatePaths(templateId);
    return { ok: true };
  } catch (err: any) {
    return { ok: false, error: err?.message || "Gagal menghapus template." };
  }
}

export interface IssueRecipientPayload {
  application_id?: string | null;
  user_id?: string | null;
  recipient_name: string;
  role_title: string;
  certificate_number?: string | null;
  description_override?: string | null;
  custom_file_url?: string | null;
  issued_date_label?: string | null;
}

export async function issueCertificatesBatch({
  templateId,
  recipients,
}: {
  templateId: string;
  recipients: IssueRecipientPayload[];
}): Promise<{
  ok: boolean;
  insertedCount: number;
  skippedCount: number;
  error?: string;
}> {
  try {
    const { user } = await requireAdmin();
    if (!UUID_REGEX.test(templateId)) {
      return { ok: false, insertedCount: 0, skippedCount: 0, error: "ID template tidak valid." };
    }
    if (!Array.isArray(recipients) || recipients.length === 0) {
      return { ok: false, insertedCount: 0, skippedCount: 0, error: "Pilih minimal 1 penerima." };
    }
    if (recipients.length > MAX_BATCH_RECIPIENTS) {
      return {
        ok: false,
        insertedCount: 0,
        skippedCount: 0,
        error: `Maksimal ${MAX_BATCH_RECIPIENTS} sertifikat dalam sekali penerbitan.`,
      };
    }

    const service = getServiceRoleClient();
    const [{ data: tpl, error: tplErr }, { data: existingCerts }] = await Promise.all([
      service.from("certificate_templates").select("*").eq("id", templateId).single(),
      service
        .from("certificates")
        .select("id, application_id, certificate_code")
        .eq("template_id", templateId),
    ]);

    if (tplErr || !tpl) {
      return { ok: false, insertedCount: 0, skippedCount: 0, error: "Template sertifikat tidak ditemukan." };
    }

    const existingAppIds = new Set(
      (existingCerts || [])
        .map((c: any) => c.application_id)
        .filter((v: unknown): v is string => typeof v === "string")
    );
    const usedCodes = new Set(
      (existingCerts || []).map((c: any) => String(c.certificate_code || "").toUpperCase())
    );

    const snapshot = buildTemplateSnapshot(tpl as CertificateTemplate);
    const now = new Date();
    const defaultIssuedLabel =
      (tpl as CertificateTemplate).issued_date_label || formatIndonesianLongDate(now);

    let seq = (existingCerts || []).length + 1;
    let skippedCount = 0;

    const rowsToInsert: Record<string, unknown>[] = [];
    for (const r of recipients) {
      const cleanName = sanitizeCertificateText(r.recipient_name, 120);
      if (!cleanName) {
        skippedCount++;
        continue;
      }

      if (
        r.custom_file_url &&
        r.custom_file_url.trim() !== "" &&
        !sanitizeCertificateAssetUrl(r.custom_file_url, { allowPdf: true })
      ) {
        return {
          ok: false,
          insertedCount: 0,
          skippedCount,
          error: `URL berkas khusus untuk "${cleanName}" tidak valid atau diblokir keamanan.`,
        };
      }

      const appId =
        r.application_id && UUID_REGEX.test(r.application_id) ? r.application_id : null;
      if (appId && existingAppIds.has(appId)) {
        skippedCount++;
        continue;
      }

      let code = generateCertificateCode(now);
      let guard = 0;
      while (usedCodes.has(code) && guard < 10) {
        code = generateCertificateCode(now);
        guard++;
      }
      usedCodes.add(code);

      const cleanCustomNum = sanitizeCertificateText(r.certificate_number, 100);
      const certNumber =
        cleanCustomNum ||
        formatCertificateNumber({
          prefix: tpl.number_prefix,
          sequence: seq,
          issuedDate: now,
        });
      seq++;

      rowsToInsert.push({
        certificate_code: code,
        certificate_number: certNumber,
        template_id: templateId,
        agenda_id: tpl.agenda_id || null,
        application_id: appId,
        user_id: r.user_id && UUID_REGEX.test(r.user_id) ? r.user_id : null,
        recipient_name: cleanName,
        role_title: sanitizeCertificateText(r.role_title, 120) || "Peserta",
        activity_title: tpl.title,
        activity_date_label: tpl.event_date_label || null,
        description_override: r.description_override
          ? sanitizeCertificateText(r.description_override, 400)
          : null,
        issued_at: now.toISOString(),
        issued_date_label:
          sanitizeCertificateText(r.issued_date_label, 120) || defaultIssuedLabel,
        custom_file_url: sanitizeCertificateAssetUrl(r.custom_file_url, {
          allowPdf: true,
        }),
        render_snapshot: snapshot,
        status: "issued",
        created_by: user.id,
      });

      if (appId) existingAppIds.add(appId);
    }

    if (rowsToInsert.length === 0) {
      return {
        ok: false,
        insertedCount: 0,
        skippedCount,
        error: "Semua penerima terpilih sudah memiliki sertifikat atau datanya kosong.",
      };
    }

    const { error: insertErr } = await service.from("certificates").insert(rowsToInsert);
    if (insertErr) {
      return {
        ok: false,
        insertedCount: 0,
        skippedCount,
        error: insertErr.message,
      };
    }

    revalidateCertificatePaths(templateId);
    return {
      ok: true,
      insertedCount: rowsToInsert.length,
      skippedCount,
    };
  } catch (err: any) {
    return {
      ok: false,
      insertedCount: 0,
      skippedCount: 0,
      error: err?.message || "Gagal menerbitkan sertifikat.",
    };
  }
}

export async function updateCertificateRecord(
  certId: string,
  patch: {
    recipient_name: string;
    role_title: string;
    certificate_number: string;
    issued_date_label?: string | null;
    description_override?: string | null;
    custom_file_url?: string | null;
  }
): Promise<{ ok: boolean; error?: string }> {
  try {
    await requireAdmin();
    if (!UUID_REGEX.test(certId)) {
      return { ok: false, error: "ID sertifikat tidak valid." };
    }
    const cleanName = sanitizeCertificateText(patch.recipient_name, 120);
    const cleanNumber = sanitizeCertificateText(patch.certificate_number, 100);
    if (!cleanName || !cleanNumber) {
      return { ok: false, error: "Nama penerima dan nomor sertifikat wajib diisi." };
    }

    if (
      patch.custom_file_url &&
      patch.custom_file_url.trim() !== "" &&
      !sanitizeCertificateAssetUrl(patch.custom_file_url, { allowPdf: true })
    ) {
      return {
        ok: false,
        error: "URL file sertifikat khusus tidak valid atau diblokir demi keamanan.",
      };
    }

    const service = getServiceRoleClient();
    const { data: existingCert } = await service
      .from("certificates")
      .select("custom_file_url")
      .eq("id", certId)
      .maybeSingle();

    const nextCustomFileUrl = sanitizeCertificateAssetUrl(patch.custom_file_url, {
      allowPdf: true,
    });

    const updatePayload: Record<string, unknown> = {
      recipient_name: cleanName,
      role_title: sanitizeCertificateText(patch.role_title, 120) || "Peserta",
      certificate_number: cleanNumber,
      issued_date_label: patch.issued_date_label
        ? sanitizeCertificateText(patch.issued_date_label, 120)
        : null,
      description_override: patch.description_override
        ? sanitizeCertificateText(patch.description_override, 400)
        : null,
      custom_file_url: nextCustomFileUrl,
    };

    const { data: updated, error } = await service
      .from("certificates")
      .update(updatePayload)
      .eq("id", certId)
      .select("template_id")
      .single();

    if (error) return { ok: false, error: error.message };

    if (
      existingCert?.custom_file_url &&
      existingCert.custom_file_url !== nextCustomFileUrl
    ) {
      after(() => cleanupUnreferencedCertificateAssets([existingCert.custom_file_url]));
    }

    revalidateCertificatePaths(updated?.template_id);
    return { ok: true };
  } catch (err: any) {
    return { ok: false, error: err?.message || "Gagal memperbarui sertifikat." };
  }
}

export async function setCertificateStatus(
  certId: string,
  status: CertificateStatus,
  reason?: string | null
): Promise<{ ok: boolean; error?: string }> {
  try {
    await requireAdmin();
    if (!UUID_REGEX.test(certId)) {
      return { ok: false, error: "ID sertifikat tidak valid." };
    }
    if (status !== "issued" && status !== "revoked") {
      return { ok: false, error: "Status sertifikat tidak valid." };
    }

    const service = getServiceRoleClient();
    const cleanReason = reason ? sanitizeCertificateText(reason, 300) : null;
    const { data: updated, error } = await service
      .from("certificates")
      .update({
        status,
        revoked_reason: status === "revoked" ? cleanReason || "Dicabut oleh admin." : null,
        revoked_at: status === "revoked" ? new Date().toISOString() : null,
      })
      .eq("id", certId)
      .select("template_id")
      .single();

    if (error) return { ok: false, error: error.message };

    revalidateCertificatePaths(updated?.template_id);
    return { ok: true };
  } catch (err: any) {
    return { ok: false, error: err?.message || "Gagal mengubah status sertifikat." };
  }
}

export async function deleteCertificateRecord(
  certId: string
): Promise<{ ok: boolean; error?: string }> {
  try {
    await requireAdmin();
    if (!UUID_REGEX.test(certId)) {
      return { ok: false, error: "ID sertifikat tidak valid." };
    }
    const service = getServiceRoleClient();
    const { data: existing } = await service
      .from("certificates")
      .select("id, template_id, custom_file_url")
      .eq("id", certId)
      .maybeSingle();

    const { error } = await service.from("certificates").delete().eq("id", certId);
    if (error) return { ok: false, error: error.message };

    if (existing?.custom_file_url) {
      after(() => cleanupUnreferencedCertificateAssets([existing.custom_file_url]));
    }

    revalidateCertificatePaths(existing?.template_id);
    return { ok: true };
  } catch (err: any) {
    return { ok: false, error: err?.message || "Gagal menghapus sertifikat." };
  }
}
