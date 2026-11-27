"use client";

import React, { useMemo, useState } from "react";
import {
  FiPlus,
  FiSave,
  FiTrash2,
  FiUpload,
} from "react-icons/fi";
import type {
  CertificateDesignPreset,
  CertificateLayoutConfig,
  CertificateRenderData,
  CertificateSigner,
  CertificateTemplate,
} from "@/types/certificate";
import {
  CERTIFICATE_DESIGN_PRESETS,
  DEFAULT_CERTIFICATE_SIGNERS,
  formatCertificateNumber,
  formatIndonesianLongDate,
} from "@/lib/certificate-utils";
import { saveCertificateTemplate, type CertificateAgendaOption } from "@/app/(internal)/admin/sertifikat/actions";
import { useToast } from "@/components/ui/Toast";
import CertificateCanvasPreview from "./CertificateCanvasPreview";

export default function CertificateDesignStudio({
  template,
  agendas,
  onSaved,
}: {
  template: CertificateTemplate;
  agendas: CertificateAgendaOption[];
  onSaved: (updated: CertificateTemplate) => void;
}) {
  const { success, error: showError } = useToast();

  const [agendaId, setAgendaId] = useState(template.agenda_id || "");
  const [title, setTitle] = useState(template.title || "");
  const [subtitle, setSubtitle] = useState(template.subtitle || "SERTIFIKAT PENGHARGAAN");
  const [description, setDescription] = useState(template.description || "");
  const [eventDateLabel, setEventDateLabel] = useState(template.event_date_label || "");
  const [location, setLocation] = useState(template.location || "");
  const [numberPrefix, setNumberPrefix] = useState(template.number_prefix || "SERT/BEM-TAZKIA");
  const [designPreset, setDesignPreset] = useState<CertificateDesignPreset>(
    template.design_preset || "classic-navy"
  );
  const [backgroundImageUrl, setBackgroundImageUrl] = useState(
    template.background_image_url || ""
  );
  const [layoutConfig, setLayoutConfig] = useState<CertificateLayoutConfig>(
    template.layout_config || {}
  );
  const [signers, setSigners] = useState<CertificateSigner[]>(
    template.signers && template.signers.length > 0
      ? template.signers
      : DEFAULT_CERTIFICATE_SIGNERS
  );
  const [issuedCity, setIssuedCity] = useState(template.issued_city || "Bogor");
  const [issuedDateLabel, setIssuedDateLabel] = useState(
    template.issued_date_label || formatIndonesianLongDate(new Date())
  );

  const [sampleName, setSampleName] = useState("Nama Mahasiswa Contoh");
  const [sampleRole, setSampleRole] = useState("Panitia — Divisi Acara");
  const [uploadingBg, setUploadingBg] = useState(false);
  const [uploadingSignerIdx, setUploadingSignerIdx] = useState<number | null>(null);
  const [saving, setSaving] = useState(false);

  const previewData = useMemo<CertificateRenderData>(
    () => ({
      certificate_code: "TZK-2026-SAMPLE88",
      certificate_number: formatCertificateNumber({ prefix: numberPrefix, sequence: 1 }),
      recipient_name: sampleName || "Nama Penerima",
      role_title: sampleRole || "Peserta",
      activity_title: title || "Kegiatan BEM STMIK Tazkia",
      activity_date_label: eventDateLabel || null,
      issued_date_label: issuedDateLabel || formatIndonesianLongDate(new Date()),
      subtitle: subtitle || "SERTIFIKAT PENGHARGAAN",
      description: description || null,
      location: location || null,
      design_preset: designPreset,
      background_image_url: backgroundImageUrl || null,
      layout_config: layoutConfig,
      signers,
      issued_city: issuedCity || "Bogor",
      verifyUrl:
        typeof window !== "undefined"
          ? `${window.location.origin}/sertifikat/TZK-2026-SAMPLE88`
          : "https://bem.stmiktazkia.ac.id/sertifikat/TZK-2026-SAMPLE88",
    }),
    [
      numberPrefix,
      sampleName,
      sampleRole,
      title,
      eventDateLabel,
      issuedDateLabel,
      subtitle,
      description,
      location,
      designPreset,
      backgroundImageUrl,
      layoutConfig,
      signers,
      issuedCity,
    ]
  );

  const uploadCertificateAsset = async (
    file: File,
    kind: "background" | "signature"
  ): Promise<string | null> => {
    const fd = new FormData();
    fd.append("file", file);
    fd.append("kind", kind);
    const res = await fetch("/api/admin/certificates/upload", {
      method: "POST",
      body: fd,
    });
    const json = await res.json();
    if (!res.ok || !json.publicUrl) {
      throw new Error(json.error || "Gagal mengunggah gambar.");
    }
    return json.publicUrl as string;
  };

  const handleUploadBg = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    setUploadingBg(true);
    try {
      const url = await uploadCertificateAsset(file, "background");
      if (url) {
        setBackgroundImageUrl(url);
        setDesignPreset("custom-bg");
        success("Background template berhasil diunggah!");
      }
    } catch (err: any) {
      showError(err?.message || "Gagal mengunggah background.");
    } finally {
      setUploadingBg(false);
    }
  };

  const handleUploadSignerImage = async (
    idx: number,
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    setUploadingSignerIdx(idx);
    try {
      const url = await uploadCertificateAsset(file, "signature");
      if (url) {
        setSigners((prev) =>
          prev.map((s, i) => (i === idx ? { ...s, signature_url: url } : s))
        );
        success("Gambar tanda tangan berhasil diunggah!");
      }
    } catch (err: any) {
      showError(err?.message || "Gagal mengunggah tanda tangan.");
    } finally {
      setUploadingSignerIdx(null);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await saveCertificateTemplate({
        id: template.id,
        agenda_id: agendaId || null,
        title,
        subtitle,
        description,
        event_date_label: eventDateLabel,
        location,
        number_prefix: numberPrefix,
        design_preset: designPreset,
        background_image_url: backgroundImageUrl || null,
        layout_config: layoutConfig,
        signers,
        issued_city: issuedCity,
        issued_date_label: issuedDateLabel,
      });

      if (!res.ok) {
        showError(res.error || "Gagal menyimpan template sertifikat.");
        return;
      }

      onSaved({
        ...template,
        agenda_id: agendaId || null,
        title,
        subtitle,
        description: description || null,
        event_date_label: eventDateLabel || null,
        location: location || null,
        number_prefix: numberPrefix,
        design_preset: designPreset,
        background_image_url: backgroundImageUrl || null,
        layout_config: layoutConfig,
        signers,
        issued_city: issuedCity,
        issued_date_label: issuedDateLabel || null,
      });
      success("Desain & pengaturan sertifikat berhasil disimpan dan disinkronkan!");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="grid grid-cols-1 xl:grid-cols-12 gap-5 sm:gap-6 items-start">
      {/* Left (Desktop) / Second (Mobile): Configuration Form */}
      <form
        onSubmit={handleSave}
        className="order-2 xl:order-1 xl:col-span-6 bg-surface border border-outline-variant/30 rounded-2xl p-4 sm:p-5 space-y-5 shadow-sm min-w-0"
      >
        <div className="space-y-4">
          <h3 className="text-sm font-extrabold uppercase tracking-wider text-primary border-b border-outline-variant/25 pb-2">
            1. Informasi Acara &amp; Penomoran
          </h3>

          <div className="space-y-1.5">
            <label className="text-xs font-bold text-on-surface">
              Hubungkan ke Agenda BEM
            </label>
            <select
              value={agendaId}
              onChange={(e) => setAgendaId(e.target.value)}
              className="w-full bg-background border border-outline-variant/50 rounded-xl px-3 py-2 text-xs outline-none focus:border-primary"
            >
              <option value="">-- Acara Mandiri / Eksternal --</option>
              {agendas.map((ag) => (
                <option key={ag.id} value={ag.id}>
                  {ag.title}
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1.5 sm:col-span-2">
              <label className="text-xs font-bold text-on-surface">
                Nama Acara di Sertifikat <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full bg-background border border-outline-variant/50 rounded-xl px-3.5 py-2 text-sm outline-none focus:border-primary"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-on-surface">Judul Sertifikat</label>
              <input
                type="text"
                value={subtitle}
                onChange={(e) => setSubtitle(e.target.value)}
                className="w-full bg-background border border-outline-variant/50 rounded-xl px-3.5 py-2 text-xs outline-none focus:border-primary"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-on-surface">Format Prefix Nomor</label>
              <input
                type="text"
                value={numberPrefix}
                onChange={(e) => setNumberPrefix(e.target.value)}
                placeholder="SERT/BEM-TAZKIA"
                className="w-full bg-background border border-outline-variant/50 rounded-xl px-3.5 py-2 text-xs font-mono outline-none focus:border-primary"
              />
              <p className="text-[10px] text-on-surface-variant">
                Mendukung placeholder <code>{"{SEQ}"}</code>, <code>{"{ROMAN_MONTH}"}</code>, <code>{"{YEAR}"}</code>.
              </p>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-on-surface">Tanggal Pelaksanaan</label>
              <input
                type="text"
                value={eventDateLabel}
                onChange={(e) => setEventDateLabel(e.target.value)}
                placeholder="Contoh: 26 November 2026"
                className="w-full bg-background border border-outline-variant/50 rounded-xl px-3.5 py-2 text-xs outline-none focus:border-primary"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-on-surface">Lokasi</label>
              <input
                type="text"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                placeholder="Auditorium STMIK Tazkia"
                className="w-full bg-background border border-outline-variant/50 rounded-xl px-3.5 py-2 text-xs outline-none focus:border-primary"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-on-surface">Kota Penetapan</label>
              <input
                type="text"
                value={issuedCity}
                onChange={(e) => setIssuedCity(e.target.value)}
                className="w-full bg-background border border-outline-variant/50 rounded-xl px-3.5 py-2 text-xs outline-none focus:border-primary"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-on-surface">Tanggal Penetapan Default</label>
              <input
                type="text"
                value={issuedDateLabel}
                onChange={(e) => setIssuedDateLabel(e.target.value)}
                className="w-full bg-background border border-outline-variant/50 rounded-xl px-3.5 py-2 text-xs outline-none focus:border-primary"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-bold text-on-surface">
              Keterangan Tambahan (Opsional, 1-2 kalimat)
            </label>
            <textarea
              rows={2}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Contoh: Yang diselenggarakan oleh Badan Eksekutif Mahasiswa STMIK Tazkia Bogor."
              className="w-full bg-background border border-outline-variant/50 rounded-xl px-3.5 py-2 text-xs outline-none focus:border-primary"
            />
          </div>
        </div>

        {/* 2. Tema & Background Canva */}
        <div className="space-y-4">
          <h3 className="text-sm font-extrabold uppercase tracking-wider text-primary border-b border-outline-variant/25 pb-2">
            2. Desain Visual &amp; Latar Kustom (Canva/Figma)
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            {CERTIFICATE_DESIGN_PRESETS.map((preset) => (
              <button
                key={preset.id}
                type="button"
                onClick={() => setDesignPreset(preset.id)}
                className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
                  designPreset === preset.id
                    ? "border-primary bg-primary/5 ring-2 ring-primary/20"
                    : "border-outline-variant/40 hover:border-primary/40"
                }`}
              >
                <div className="flex items-center gap-2">
                  <span
                    className="w-3 h-3 rounded-full shrink-0"
                    style={{ backgroundColor: preset.primaryColor }}
                  />
                  <span className="text-xs font-bold text-on-surface">{preset.label}</span>
                </div>
                <p className="text-[11px] text-on-surface-variant mt-1 leading-snug">
                  {preset.description}
                </p>
              </button>
            ))}
          </div>

          {designPreset === "custom-bg" && (
            <div className="p-4 rounded-2xl bg-surface-variant/20 border border-outline-variant/30 space-y-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <p className="text-xs font-bold text-on-surface">
                    Upload Background Desain A4 Landscape (PNG/JPG)
                  </p>
                  <p className="text-[11px] text-on-surface-variant">
                    Disarankan rasio A4 Landscape (2480×1754 px) tanpa teks nama/nomor agar diisi otomatis sistem.
                  </p>
                </div>
                <label className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-primary text-white text-xs font-bold cursor-pointer hover:bg-primary/90">
                  <FiUpload size={14} />
                  <span>{uploadingBg ? "Mengunggah..." : "Upload Background"}</span>
                  <input
                    type="file"
                    accept="image/png,image/jpeg,image/webp"
                    onChange={handleUploadBg}
                    className="hidden"
                    disabled={uploadingBg}
                  />
                </label>
              </div>

              <input
                type="text"
                value={backgroundImageUrl}
                onChange={(e) => setBackgroundImageUrl(e.target.value)}
                placeholder="Atau tempel URL gambar background..."
                className="w-full bg-background border border-outline-variant/50 rounded-xl px-3 py-1.5 text-xs outline-none focus:border-primary"
              />

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-1">
                <div>
                  <label className="text-[11px] font-bold text-on-surface-variant block mb-1">
                    Warna Teks
                  </label>
                  <input
                    type="color"
                    value={layoutConfig.textColor || "#102147"}
                    onChange={(e) =>
                      setLayoutConfig((prev) => ({ ...prev, textColor: e.target.value }))
                    }
                    className="w-full h-9 rounded-lg cursor-pointer border border-outline-variant/40"
                  />
                </div>
                <div>
                  <label className="text-[11px] font-bold text-on-surface-variant block mb-1">
                    Warna Aksen
                  </label>
                  <input
                    type="color"
                    value={layoutConfig.accentColor || "#143470"}
                    onChange={(e) =>
                      setLayoutConfig((prev) => ({ ...prev, accentColor: e.target.value }))
                    }
                    className="w-full h-9 rounded-lg cursor-pointer border border-outline-variant/40"
                  />
                </div>
                <div className="col-span-2">
                  <label className="text-[11px] font-bold text-on-surface-variant block mb-1">
                    Geser Posisi Vertikal Teks ({layoutConfig.contentOffsetY || 0}px)
                  </label>
                  <input
                    type="range"
                    min={-180}
                    max={180}
                    step={5}
                    value={layoutConfig.contentOffsetY || 0}
                    onChange={(e) =>
                      setLayoutConfig((prev) => ({
                        ...prev,
                        contentOffsetY: Number(e.target.value),
                      }))
                    }
                    className="w-full"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-[11px] font-bold text-on-surface-variant block mb-1">
                    Panel Latar Putih Transparan ({Math.round((layoutConfig.overlayOpacity || 0) * 100)}%)
                  </label>
                  <input
                    type="range"
                    min={0}
                    max={0.85}
                    step={0.05}
                    value={layoutConfig.overlayOpacity || 0}
                    onChange={(e) =>
                      setLayoutConfig((prev) => ({
                        ...prev,
                        overlayOpacity: Number(e.target.value),
                      }))
                    }
                    className="w-full"
                  />
                </div>
                <div className="flex flex-wrap items-center gap-4 text-xs font-bold">
                  <label className="flex items-center gap-1.5 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={layoutConfig.showLogo !== false}
                      onChange={(e) =>
                        setLayoutConfig((prev) => ({ ...prev, showLogo: e.target.checked }))
                      }
                    />
                    Logo BEM
                  </label>
                  <label className="flex items-center gap-1.5 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={Boolean(layoutConfig.showBorder)}
                      onChange={(e) =>
                        setLayoutConfig((prev) => ({ ...prev, showBorder: e.target.checked }))
                      }
                    />
                    Bingkai Garis
                  </label>
                  <label className="flex items-center gap-1.5 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={layoutConfig.showQr !== false}
                      onChange={(e) =>
                        setLayoutConfig((prev) => ({ ...prev, showQr: e.target.checked }))
                      }
                    />
                    QR Verifikasi
                  </label>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* 3. Penandatangan */}
        <div className="space-y-3">
          <div className="flex items-center justify-between border-b border-outline-variant/25 pb-2">
            <h3 className="text-sm font-extrabold uppercase tracking-wider text-primary">
              3. Penandatangan (Maks 3)
            </h3>
            {signers.length < 3 && (
              <button
                type="button"
                onClick={() =>
                  setSigners((prev) => [...prev, { name: "", role: "", signature_url: null }])
                }
                className="inline-flex items-center gap-1 text-xs font-bold text-primary hover:underline cursor-pointer"
              >
                <FiPlus size={14} /> Tambah Penandatangan
              </button>
            )}
          </div>

          <div className="space-y-2.5">
            {signers.map((signer, idx) => (
              <div
                key={idx}
                className="p-3 rounded-xl bg-surface-variant/15 border border-outline-variant/25 space-y-2"
              >
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <input
                    type="text"
                    placeholder="Nama Pejabat / Penandatangan"
                    value={signer.name}
                    onChange={(e) =>
                      setSigners((prev) =>
                        prev.map((s, i) => (i === idx ? { ...s, name: e.target.value } : s))
                      )
                    }
                    className="bg-background border border-outline-variant/50 rounded-lg px-3 py-1.5 text-xs outline-none focus:border-primary"
                  />
                  <input
                    type="text"
                    placeholder="Jabatan (mis. Ketua BEM STMIK Tazkia)"
                    value={signer.role}
                    onChange={(e) =>
                      setSigners((prev) =>
                        prev.map((s, i) => (i === idx ? { ...s, role: e.target.value } : s))
                      )
                    }
                    className="bg-background border border-outline-variant/50 rounded-lg px-3 py-1.5 text-xs outline-none focus:border-primary"
                  />
                </div>
                <div className="flex flex-wrap items-center justify-between gap-2 text-[11px]">
                  <div className="flex items-center gap-2">
                    <label className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-surface border border-outline-variant/50 font-bold cursor-pointer hover:border-primary hover:text-primary">
                      <FiUpload size={12} />
                      <span>
                        {uploadingSignerIdx === idx
                          ? "Mengunggah..."
                          : signer.signature_url
                            ? "Ganti TTD PNG"
                            : "Upload TTD Transparan"}
                      </span>
                      <input
                        type="file"
                        accept="image/png,image/jpeg,image/webp"
                        onChange={(e) => handleUploadSignerImage(idx, e)}
                        className="hidden"
                      />
                    </label>
                    {signer.signature_url && (
                      <button
                        type="button"
                        onClick={() =>
                          setSigners((prev) =>
                            prev.map((s, i) => (i === idx ? { ...s, signature_url: null } : s))
                          )
                        }
                        className="text-rose-600 font-bold hover:underline cursor-pointer"
                      >
                        Hapus TTD
                      </button>
                    )}
                  </div>
                  {signers.length > 1 && (
                    <button
                      type="button"
                      onClick={() =>
                        setSigners((prev) => prev.filter((_, i) => i !== idx))
                      }
                      className="inline-flex items-center gap-1 text-rose-600 font-bold hover:underline cursor-pointer"
                    >
                      <FiTrash2 size={12} /> Hapus Baris
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="pt-2 flex justify-end">
          <button
            type="submit"
            disabled={saving}
            className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-primary text-white text-sm font-bold hover:bg-primary/90 shadow-sm disabled:opacity-60 cursor-pointer"
          >
            <FiSave size={16} />
            <span>{saving ? "Menyimpan..." : "Simpan Desain Template"}</span>
          </button>
        </div>
      </form>

      {/* Right (Desktop) / First (Mobile): Sticky Live Preview */}
      <div className="order-1 xl:order-2 xl:col-span-6 xl:sticky xl:top-24 space-y-4 min-w-0">
        <div className="bg-surface border border-outline-variant/30 rounded-2xl p-4 sm:p-5 shadow-sm space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <h3 className="text-sm font-extrabold text-on-surface">
                Pratinjau Langsung (A4 Landscape)
              </h3>
              <p className="text-[11px] text-on-surface-variant">
                Otomatis menyesuaikan tema, logo BEM, nomor resmi, tanda tangan, dan QR Code.
              </p>
            </div>
          </div>

          <CertificateCanvasPreview data={previewData} scale={0.5} />

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1">
            <div>
              <label className="text-[10px] font-bold uppercase tracking-wider text-on-surface-variant">
                Simulasi Nama Penerima
              </label>
              <input
                type="text"
                value={sampleName}
                onChange={(e) => setSampleName(e.target.value)}
                className="w-full mt-0.5 bg-background border border-outline-variant/40 rounded-lg px-2.5 py-1.5 text-xs outline-none focus:border-primary"
              />
            </div>
            <div>
              <label className="text-[10px] font-bold uppercase tracking-wider text-on-surface-variant">
                Simulasi Peran / Predikat
              </label>
              <input
                type="text"
                value={sampleRole}
                onChange={(e) => setSampleRole(e.target.value)}
                className="w-full mt-0.5 bg-background border border-outline-variant/40 rounded-lg px-2.5 py-1.5 text-xs outline-none focus:border-primary"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
