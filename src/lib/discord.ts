import "server-only";
import { getServiceRoleClient } from "@/lib/auth";
import { getSecret } from "@/lib/secrets";
import {
  stripHtml,
  getBaseSiteUrl,
  isValidHttpUrl,
  truncateText,
  formatWibDate,
  formatWibDateTime,
} from "@/lib/notification-utils";
import type { BeritaNotificationPayload } from "@/lib/telegram";

export type DiscordChannelTarget = "berita" | "pengumuman";

export interface DiscordConfig {
  beritaWebhookUrl: string;
  pengumumanWebhookUrl: string;
  beritaNotifEnabled: boolean;
  pengumumanNotifEnabled: boolean;
  hasBeritaWebhook: boolean;
  hasPengumumanWebhook: boolean;
}

export interface DiscordEmbedField {
  name: string;
  value: string;
  inline?: boolean;
}

export interface DiscordEmbed {
  title?: string;
  description?: string;
  url?: string;
  color?: number;
  author?: {
    name: string;
    url?: string;
    icon_url?: string;
  };
  fields?: DiscordEmbedField[];
  image?: { url: string };
  thumbnail?: { url: string };
  footer?: { text: string; icon_url?: string };
  timestamp?: string;
}

export interface DiscordWebhookPayload {
  content?: string;
  username?: string;
  avatar_url?: string;
  embeds?: DiscordEmbed[];
}

export interface DiscordSendResult {
  ok: boolean;
  channel: DiscordChannelTarget;
  error?: string;
}

/**
 * Loads Discord webhook credentials from app_secrets and toggle flags from system_settings.
 */
export async function getDiscordConfig(): Promise<DiscordConfig> {
  const [beritaWebhookUrl, pengumumanWebhookUrl] = await Promise.all([
    getSecret("discord_berita_webhook_url"),
    getSecret("discord_pengumuman_webhook_url"),
  ]);

  let beritaNotifEnabled = true;
  let pengumumanNotifEnabled = true;

  try {
    const supabase = getServiceRoleClient();
    const { data, error } = await supabase
      .from("system_settings")
      .select("key, value")
      .in("key", [
        "discord_berita_notif_enabled",
        "discord_pengumuman_notif_enabled",
      ]);

    if (!error && data) {
      for (const row of data) {
        if (row.key === "discord_berita_notif_enabled" && row.value === "false") {
          beritaNotifEnabled = false;
        }
        if (row.key === "discord_pengumuman_notif_enabled" && row.value === "false") {
          pengumumanNotifEnabled = false;
        }
      }
    }
  } catch (err) {
    console.error("[discord] Error fetching config from system_settings:", err);
  }

  return {
    beritaWebhookUrl: beritaWebhookUrl.trim(),
    pengumumanWebhookUrl: pengumumanWebhookUrl.trim(),
    beritaNotifEnabled,
    pengumumanNotifEnabled,
    hasBeritaWebhook: Boolean(beritaWebhookUrl.trim()),
    hasPengumumanWebhook: Boolean(pengumumanWebhookUrl.trim()),
  };
}

/**
 * Sends a payload to the target Discord webhook channel.
 */
export async function sendDiscordWebhookMessage(
  target: DiscordChannelTarget,
  payload: DiscordWebhookPayload,
  options?: { ignoreToggle?: boolean }
): Promise<DiscordSendResult> {
  const channelLabel = target === "pengumuman" ? "#Pengumuman" : "#Berita";

  try {
    const config = await getDiscordConfig();
    const webhookUrl =
      target === "pengumuman" ? config.pengumumanWebhookUrl : config.beritaWebhookUrl;
    const isEnabled =
      target === "pengumuman" ? config.pengumumanNotifEnabled : config.beritaNotifEnabled;

    if (!webhookUrl) {
      return {
        ok: false,
        channel: target,
        error: `Webhook Discord untuk channel ${channelLabel} belum dipasang di Pengaturan Sistem.`,
      };
    }

    if (!options?.ignoreToggle && !isEnabled) {
      return {
        ok: false,
        channel: target,
        error: `Siaran Discord untuk channel ${channelLabel} sedang dinonaktifkan di Pengaturan Sistem.`,
      };
    }

    const bodyPayload: DiscordWebhookPayload = {
      username: payload.username || "BEM STMIK Tazkia",
      ...payload,
    };

    const res = await fetch(`${webhookUrl}?wait=true`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(bodyPayload),
    });

    if (!res.ok) {
      let errMsg = `HTTP ${res.status}`;
      try {
        const errData = await res.json();
        if (errData?.message) errMsg = errData.message;
      } catch {
        // Ignore parse error on non-JSON error responses
      }
      console.error(`[discord] Webhook error (${channelLabel}):`, errMsg);
      return {
        ok: false,
        channel: target,
        error: `Gagal mengirim ke Discord ${channelLabel}: ${errMsg}`,
      };
    }

    return { ok: true, channel: target };
  } catch {
    console.error(`[discord] Exception (${channelLabel}): gagal menghubungi endpoint webhook Discord`);
    return { ok: false, channel: target, error: `Gagal menghubungi server Discord (${channelLabel}).` };
  }
}

/**
 * Sends a test embed ping to the specified Discord channel (#Berita or #Pengumuman).
 */
export async function sendDiscordTestPing(
  target: DiscordChannelTarget
): Promise<DiscordSendResult> {
  const siteUrl = getBaseSiteUrl();
  const isPengumuman = target === "pengumuman";
  const channelLabel = isPengumuman ? "#Pengumuman" : "#Berita";

  const embed: DiscordEmbed = {
    author: {
      name: "🤖 Uji Coba Koneksi Webhook Discord BEM STMIK Tazkia",
    },
    title: `Channel ${channelLabel} Berhasil Terhubung!`,
    url: siteUrl,
    color: isPengumuman ? 0xf2791e : 0x1b4086,
    description: isPengumuman
      ? "Channel ini siap menerima siaran otomatis untuk:\n• 📢 **Pengumuman Resmi BEM**\n• 📅 **Agenda & Event Terbaru**\n• 🤝 **Open Recruitment & Volunteer**\n• 📸 **Dokumentasi Kegiatan**\n• 🟢 **Info Rilis & Pembaruan Sistem**"
      : "Channel ini siap menerima siaran otomatis untuk:\n• 📰 **Berita & Kabar Kampus Terbaru**\n• ✍️ **Artikel Mahasiswa yang Resmi Tayang**",
    fields: [
      { name: "Status Koneksi", value: "✅ Aktif & Siap Siaran", inline: true },
      { name: "Waktu Uji", value: `${formatWibDateTime()} WIB`, inline: true },
    ],
    footer: { text: "Portal Resmi BEM STMIK Tazkia • Pengaturan Sistem" },
    timestamp: new Date().toISOString(),
  };

  return sendDiscordWebhookMessage(
    target,
    {
      content: `🔔 **Tes Koneksi Webhook Discord (${channelLabel})**`,
      embeds: [embed],
    },
    { ignoreToggle: true }
  );
}

/**
 * Sends a newly published / broadcasted Berita or Pengumuman to Discord.
 * Automatically routes category "Pengumuman" to #Pengumuman and others to #Berita.
 */
export async function sendDiscordBeritaNotification(
  berita: BeritaNotificationPayload
): Promise<DiscordSendResult> {
  const siteUrl = getBaseSiteUrl();
  const newsUrl = `${siteUrl}/id/berita/${encodeURIComponent(berita.slug)}`;
  const isPengumuman = berita.category?.trim().toLowerCase() === "pengumuman";
  const target: DiscordChannelTarget = isPengumuman ? "pengumuman" : "berita";

  const rawExcerpt = berita.excerpt || stripHtml(berita.content || "");
  const cleanExcerpt = truncateText(rawExcerpt, 380);

  let tagsArray: string[] = [];
  if (Array.isArray(berita.tags)) {
    tagsArray = berita.tags;
  } else if (typeof berita.tags === "string") {
    tagsArray = berita.tags.split(",").map((t) => t.trim());
  }

  const tagsText = tagsArray
    .filter(Boolean)
    .slice(0, 5)
    .map((t) => `#${t.replace(/\s+/g, "")}`)
    .join(" ");

  const fields: DiscordEmbedField[] = [
    { name: "📂 Kategori", value: berita.category || "Berita", inline: true },
    { name: "✍️ Penulis", value: berita.author || "Humas BEM STMIK Tazkia", inline: true },
    { name: "📅 Tanggal", value: formatWibDate(), inline: true },
  ];

  if (tagsText) {
    fields.push({ name: "🏷️ Topik", value: truncateText(tagsText, 250), inline: false });
  }

  const validImageUrl = isValidHttpUrl(berita.image_url);

  const embed: DiscordEmbed = {
    author: {
      name: isPengumuman
        ? "📢 PENGUMUMAN RESMI BEM STMIK TAZKIA"
        : "📰 BERITA TERBARU BEM STMIK TAZKIA",
    },
    title: truncateText(berita.title, 250),
    url: newsUrl,
    color: isPengumuman ? 0xf2791e : 0x1b4086,
    description: `${cleanExcerpt}\n\n🔗 **[Baca Selengkapnya di Website](${newsUrl})**`,
    fields,
    ...(validImageUrl ? { image: { url: validImageUrl } } : {}),
    footer: { text: "BEM STMIK Tazkia • Portal Berita & Pengumuman" },
    timestamp: new Date().toISOString(),
  };

  return sendDiscordWebhookMessage(target, {
    content: isPengumuman
      ? `📢 **Pengumuman Baru:** **${truncateText(berita.title, 180)}**`
      : `📰 **Berita Terbaru:** **${truncateText(berita.title, 180)}**`,
    embeds: [embed],
  });
}

export interface DiscordArticlePublishedPayload {
  title: string;
  category?: string | null;
  authorName?: string | null;
  slug?: string | null;
  coverUrl?: string | null;
}

/**
 * Broadcasts an approved/published student article to Discord #Berita.
 */
export async function sendDiscordArticlePublishedNotification(
  payload: DiscordArticlePublishedPayload
): Promise<DiscordSendResult> {
  const siteUrl = getBaseSiteUrl();
  const articleUrl = payload.slug
    ? `${siteUrl}/id/artikel/${encodeURIComponent(payload.slug)}`
    : `${siteUrl}/id/artikel`;
  const validCoverUrl = isValidHttpUrl(payload.coverUrl);

  const embed: DiscordEmbed = {
    author: {
      name: "✍️ KARYA TULIS MAHASISWA • RESMI TAYANG",
    },
    title: truncateText(payload.title, 250),
    url: articleUrl,
    color: 0x006684,
    description: `Artikel karya mahasiswa STMIK Tazkia telah terbit di portal resmi BEM.\n\n📖 **[Baca Artikel Lengkapnya di Website](${articleUrl})**`,
    fields: [
      { name: "📂 Kategori", value: payload.category || "Artikel Mahasiswa", inline: true },
      { name: "👤 Penulis", value: payload.authorName || "Mahasiswa STMIK Tazkia", inline: true },
      { name: "📅 Terbit", value: formatWibDate(), inline: true },
    ],
    ...(validCoverUrl ? { image: { url: validCoverUrl } } : {}),
    footer: { text: "BEM STMIK Tazkia • Ruang Karya & Opini Mahasiswa" },
    timestamp: new Date().toISOString(),
  };

  return sendDiscordWebhookMessage("berita", {
    content: `✍️ **Artikel Mahasiswa Baru Terbit:** **${truncateText(payload.title, 180)}**`,
    embeds: [embed],
  });
}

export interface DiscordKegiatanPayload {
  id?: string;
  title: string;
  slug?: string | null;
  type: "event" | "volunteer" | "dokumentasi" | string;
  category?: string | null;
  description?: string | null;
  date?: string | null;
  end_date?: string | null;
  time_range?: string | null;
  deadline?: string | null;
  location?: string | null;
  online_link?: string | null;
  image_url?: string | null;
  gallery?: string[] | null;
  is_urgent?: boolean;
  max_participants?: number | null;
  hasRegistrationForm?: boolean;
}

const KEGIATAN_META: Record<
  string,
  { author: string; prefix: string; color: number; cta: string }
> = {
  volunteer: {
    author: "🤝 OPEN RECRUITMENT & VOLUNTEER BEM STMIK TAZKIA",
    prefix: "🤝 **Open Recruitment Baru Dibuka!**",
    color: 0x10b981,
    cta: "Daftar Sekarang di Website",
  },
  dokumentasi: {
    author: "📸 DOKUMENTASI KEGIATAN BEM STMIK TAZKIA",
    prefix: "📸 **Dokumentasi Kegiatan Baru Tersedia!**",
    color: 0x7c3aed,
    cta: "Lihat Galeri Dokumentasi",
  },
  event: {
    author: "📅 AGENDA & EVENT BEM STMIK TAZKIA",
    prefix: "📅 **Agenda / Event Terbaru BEM!**",
    color: 0x006684,
    cta: "Lihat Detail Kegiatan",
  },
};

/**
 * Broadcasts a published Event, Volunteer/Oprec, or Dokumentasi to Discord #Pengumuman.
 */
export async function sendDiscordKegiatanNotification(
  kegiatan: DiscordKegiatanPayload
): Promise<DiscordSendResult> {
  const siteUrl = getBaseSiteUrl();
  const typeKey =
    kegiatan.type === "volunteer" || kegiatan.type === "dokumentasi"
      ? kegiatan.type
      : "event";
  const meta = KEGIATAN_META[typeKey];

  const detailSlug = kegiatan.slug || kegiatan.id;
  const targetUrl =
    typeKey === "dokumentasi"
      ? `${siteUrl}/id/dokumentasi`
      : detailSlug
      ? `${siteUrl}/id/agenda/${encodeURIComponent(detailSlug)}`
      : `${siteUrl}/id/agenda`;

  const fields: DiscordEmbedField[] = [
    { name: "📂 Kategori", value: kegiatan.category || "Kegiatan BEM", inline: true },
  ];

  if (typeKey === "volunteer") {
    fields.push({
      name: "⏳ Batas Pendaftaran",
      value: kegiatan.deadline ? formatWibDate(kegiatan.deadline) : "Terbuka",
      inline: true,
    });
    if (kegiatan.max_participants) {
      fields.push({
        name: "👥 Kuota",
        value: `${kegiatan.max_participants} peserta`,
        inline: true,
      });
    }
    if (kegiatan.is_urgent) {
      fields.push({
        name: "🔥 Prioritas",
        value: "SEGERA / URGENT",
        inline: true,
      });
    }
  } else {
    const dateText = kegiatan.date
      ? kegiatan.end_date && kegiatan.end_date !== kegiatan.date
        ? `${formatWibDate(kegiatan.date)} – ${formatWibDate(kegiatan.end_date)}`
        : formatWibDate(kegiatan.date)
      : "-";
    fields.push({ name: "📅 Tanggal", value: dateText, inline: true });

    if (kegiatan.time_range && kegiatan.time_range !== "-") {
      fields.push({ name: "🕒 Waktu", value: kegiatan.time_range, inline: true });
    }
    if (kegiatan.location && kegiatan.location !== "-") {
      fields.push({ name: "📍 Lokasi", value: truncateText(kegiatan.location, 150), inline: true });
    }
    if (typeKey === "event" && kegiatan.hasRegistrationForm) {
      fields.push({
        name: "🎟️ Pendaftaran",
        value: kegiatan.max_participants
          ? `Wajib RSVP (Kuota ${kegiatan.max_participants})`
          : "Wajib RSVP di Website",
        inline: true,
      });
    }
    if (typeKey === "dokumentasi") {
      const photoCount = Array.isArray(kegiatan.gallery)
        ? kegiatan.gallery.filter(Boolean).length
        : 0;
      if (photoCount > 0) {
        fields.push({ name: "🖼️ Galeri", value: `${photoCount} foto`, inline: true });
      }
    }
  }

  const galleryFirst = Array.isArray(kegiatan.gallery)
    ? kegiatan.gallery.find((url) => Boolean(isValidHttpUrl(url)))
    : null;
  const validImageUrl = isValidHttpUrl(kegiatan.image_url) || isValidHttpUrl(galleryFirst);

  const cleanDesc = truncateText(stripHtml(kegiatan.description || ""), 360);
  const descBody = cleanDesc
    ? `${cleanDesc}\n\n🔗 **[${meta.cta}](${targetUrl})**`
    : `🔗 **[${meta.cta}](${targetUrl})**`;

  const embed: DiscordEmbed = {
    author: { name: meta.author },
    title: truncateText(kegiatan.title, 250),
    url: targetUrl,
    color: typeKey === "volunteer" && kegiatan.is_urgent ? 0xef4444 : meta.color,
    description: descBody,
    fields,
    ...(validImageUrl ? { image: { url: validImageUrl } } : {}),
    footer: { text: "BEM STMIK Tazkia • Info Kegiatan & Open Recruitment" },
    timestamp: new Date().toISOString(),
  };

  return sendDiscordWebhookMessage("pengumuman", {
    content: `${meta.prefix} **${truncateText(kegiatan.title, 180)}**`,
    embeds: [embed],
  });
}

export interface DiscordReleaseUpdatePayload {
  releaseVersion?: string;
  releaseTitle?: string;
  releaseFeatures?: string[];
}

/**
 * Announces portal updates / What's New after maintenance finishes to Discord #Pengumuman.
 */
export async function sendDiscordReleaseUpdateNotification(
  payload: DiscordReleaseUpdatePayload
): Promise<DiscordSendResult> {
  const siteUrl = getBaseSiteUrl();
  const versionStr = payload.releaseVersion?.trim() ? ` (${payload.releaseVersion.trim()})` : "";
  const titleStr = payload.releaseTitle?.trim() || "Pembaruan Sistem Portal BEM";

  const validFeatures = (payload.releaseFeatures || [])
    .map((f) => f.trim())
    .filter(Boolean);

  const featuresText =
    validFeatures.length > 0
      ? `\n\n✨ **Yang Baru di Pembaruan Ini:**\n${validFeatures
          .slice(0, 10)
          .map((f) => `• ${f}`)
          .join("\n")}`
      : "";

  const embed: DiscordEmbed = {
    author: { name: "🟢 PEMBARUAN PORTAL RESMI BEM STMIK TAZKIA" },
    title: truncateText(`${titleStr}${versionStr}`, 250),
    url: siteUrl,
    color: 0x10b981,
    description:
      `Website resmi BEM STMIK Tazkia telah selesai diperbarui dan kembali beroperasi normal.${featuresText}\n\n🌐 **[Kunjungi Website BEM STMIK Tazkia](${siteUrl})**`,
    fields: [
      { name: "📦 Versi", value: payload.releaseVersion?.trim() || "Terbaru", inline: true },
      { name: "📅 Tanggal Rilis", value: formatWibDate(), inline: true },
    ],
    footer: { text: "BEM STMIK Tazkia • Changelog & Pengumuman Sistem" },
    timestamp: new Date().toISOString(),
  };

  return sendDiscordWebhookMessage("pengumuman", {
    content: `🟢 **Pembaruan Portal BEM Selesai${versionStr}!**`,
    embeds: [embed],
  });
}
