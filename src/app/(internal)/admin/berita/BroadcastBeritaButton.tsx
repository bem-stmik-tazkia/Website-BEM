"use client";

import React, { useState } from "react";
import { FiSend } from "react-icons/fi";
import { useToast } from "@/components/ui/Toast";

interface BroadcastBeritaButtonProps {
  id: string;
  title: string;
}

export default function BroadcastBeritaButton({ id, title }: BroadcastBeritaButtonProps) {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);

  const handleBroadcast = async () => {
    const confirmSend = window.confirm(
      `Apakah Anda yakin ingin mengirim pemberitahuan berita "${title}" ke Telegram?`
    );
    if (!confirmSend) return;

    try {
      setLoading(true);
      const res = await fetch("/api/admin/berita/telegram", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "broadcast_news",
          beritaId: id,
        }),
      });

      const json = await res.json();
      if (res.ok && json.ok) {
        toast(`Berita "${title}" berhasil disiarkan ke Telegram!`, "success");
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
      title="Siarkan Berita ke Telegram"
      className="p-2.5 text-sky-600 hover:text-sky-700 hover:bg-sky-50 dark:hover:bg-sky-950/40 rounded-lg transition-colors disabled:opacity-50"
    >
      <FiSend size={16} className={loading ? "animate-spin" : ""} />
    </button>
  );
}
