"use client";

import React, { useState } from "react";
import { SiDiscord } from "react-icons/si";
import { useToast } from "@/components/ui/Toast";

interface BroadcastKegiatanButtonProps {
  id: string;
  title: string;
  isPublished?: boolean;
}

export default function BroadcastKegiatanButton({
  id,
  title,
  isPublished = false,
}: BroadcastKegiatanButtonProps) {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);

  const handleBroadcast = async () => {
    if (!isPublished) {
      toast("Kegiatan masih berstatus Draft. Aktifkan status Live terlebih dahulu sebelum menyiarkan ke Discord.", "info");
      return;
    }

    const confirmSend = window.confirm(
      `Apakah Anda yakin ingin menyiarkan "${title}" ke Discord #Pengumuman?`
    );
    if (!confirmSend) return;

    try {
      setLoading(true);
      const res = await fetch("/api/admin/discord", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "broadcast_kegiatan",
          kegiatanId: id,
        }),
      });

      const json = await res.json();
      if (res.ok && json.ok) {
        toast(json.message || `"${title}" berhasil disiarkan ke Discord #Pengumuman!`, "success");
      } else {
        toast("Gagal: " + (json.error || "Terjadi kesalahan"), "error");
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Terjadi kesalahan";
      toast("Error: " + msg, "error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <button
      type="button"
      onClick={handleBroadcast}
      disabled={loading}
      title={isPublished ? "Siarkan ke Discord #Pengumuman" : "Aktifkan Live dulu untuk siarkan ke Discord"}
      className={`w-8 h-8 rounded-lg flex items-center justify-center transition-colors disabled:opacity-50 ${
        isPublished
          ? "bg-indigo-50 text-indigo-600 hover:bg-indigo-600 hover:text-white dark:bg-indigo-950/40 dark:text-indigo-400"
          : "bg-surface-variant/30 text-on-surface-variant/40"
      }`}
    >
      <SiDiscord size={14} className={loading ? "animate-spin" : ""} />
    </button>
  );
}
