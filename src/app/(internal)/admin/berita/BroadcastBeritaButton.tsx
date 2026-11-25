"use client";

import React, { useState } from "react";
import { SiDiscord } from "react-icons/si";
import { useToast } from "@/components/ui/Toast";

interface BroadcastBeritaButtonProps {
  id: string;
  title: string;
  category?: string;
  isPublished?: boolean;
}

export default function BroadcastBeritaButton({
  id,
  title,
  category,
  isPublished = true,
}: BroadcastBeritaButtonProps) {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);

  const channelLabel =
    category?.trim().toLowerCase() === "pengumuman" ? "#Pengumuman" : "#Berita";

  const handleBroadcast = async () => {
    if (!isPublished) {
      toast("Berita masih berstatus Draft. Publikasikan terlebih dahulu sebelum menyiarkan ke Discord.", "info");
      return;
    }

    const confirmSend = window.confirm(
      `Apakah Anda yakin ingin menyiarkan "${title}" ke Discord ${channelLabel}?`
    );
    if (!confirmSend) return;

    try {
      setLoading(true);
      const res = await fetch("/api/admin/discord", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "broadcast_berita",
          beritaId: id,
        }),
      });

      const json = await res.json();
      if (res.ok && json.ok) {
        toast(json.message || `Berita "${title}" berhasil disiarkan ke Discord ${channelLabel}!`, "success");
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
      title={isPublished ? `Siarkan ke Discord ${channelLabel}` : "Publikasikan dulu untuk siarkan ke Discord"}
      className={`p-2.5 rounded-lg transition-colors disabled:opacity-50 ${
        isPublished
          ? "text-indigo-600 hover:text-indigo-700 hover:bg-indigo-50 dark:text-indigo-400 dark:hover:bg-indigo-950/40"
          : "text-on-surface-variant/40 hover:bg-surface-variant/20"
      }`}
    >
      <SiDiscord size={16} className={loading ? "animate-spin" : ""} />
    </button>
  );
}
