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

export { stripHtml, getBaseSiteUrl };

/**
 * Creates an admin/service-role Supabase client to bypass RLS
 * for reading/writing system_settings and cron/background operations.
 */
export function getAdminSupabaseClient() {
  return getServiceRoleClient();
}

/**
 * Escapes characters for Telegram HTML parse mode.
 */
export function escapeHtml(text: string): string {
  return (text || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

export interface TelegramConfig {
  botToken: string;
  chatId: string;
  notifEnabled: boolean;
  techNotifEnabled: boolean;
  reminderEnabled: boolean;
  lastReminderSentAt: string | null;
  isConfigured: boolean;
}

/**
 * Loads Telegram configuration.
 * Sensitive credentials (botToken, chatId) are loaded EXCLUSIVELY from app_secrets.
 * Operational feature flags (techNotifEnabled, reminderEnabled, lastReminderSentAt) are read from system_settings.
 */
export async function getTelegramConfig(): Promise<TelegramConfig> {
  const supabase = getAdminSupabaseClient();
  let notifEnabled = true;
  let techNotifEnabled = true;
  let reminderEnabled = true;
  let lastReminderSentAt: string | null = null;

  const [botToken, chatId, settingsResult] = await Promise.all([
    getSecret("telegram_bot_token"),
    getSecret("telegram_chat_id"),
    supabase
      .from("system_settings")
      .select("key, value")
      .in("key", [
        "telegram_berita_notif_enabled",
        "telegram_tech_notif_enabled",
        "telegram_berita_reminder_enabled",
        "telegram_last_reminder_sent_at",
      ]),
  ]);

  try {
    const { data, error } = settingsResult;
    if (!error && data) {
      const map = data.reduce(
        (acc, curr) => ({ ...acc, [curr.key]: curr.value }),
        {} as Record<string, string>
      );
      if (map["telegram_berita_notif_enabled"] === "false") notifEnabled = false;
      if (map["telegram_tech_notif_enabled"] === "false") techNotifEnabled = false;
      if (map["telegram_berita_reminder_enabled"] === "false") reminderEnabled = false;
      if (map["telegram_last_reminder_sent_at"])
        lastReminderSentAt = map["telegram_last_reminder_sent_at"];
    }
  } catch (err) {
    console.error("Error fetching telegram config from system_settings:", err);
  }

  return {
    botToken: botToken.trim(),
    chatId: chatId.trim(),
    notifEnabled,
    techNotifEnabled,
    reminderEnabled,
    lastReminderSentAt,
    isConfigured: Boolean(botToken.trim() && chatId.trim()),
  };
}

export interface SendTelegramOptions {
  inlineButtons?: Array<Array<{ text: string; url: string }>>;
  disableWebPagePreview?: boolean;
}

/**
 * Sends a text message to Telegram using HTML parse mode.
 */
export async function sendTelegramMessage(
  text: string,
  options?: SendTelegramOptions
): Promise<{ ok: boolean; data?: unknown; error?: string }> {
  try {
    const config = await getTelegramConfig();
    if (!config.isConfigured) {
      return { ok: false, error: "Token bot atau Chat ID Telegram belum dikonfigurasi." };
    }

    const payload: Record<string, unknown> = {
      chat_id: config.chatId,
      text,
      parse_mode: "HTML",
    };

    if (options?.disableWebPagePreview) {
      payload.disable_web_page_preview = true;
    }

    if (options?.inlineButtons && options.inlineButtons.length > 0) {
      payload.reply_markup = {
        inline_keyboard: options.inlineButtons,
      };
    }

    const res = await fetch(`https://api.telegram.org/bot${config.botToken}/sendMessage`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
      signal: AbortSignal.timeout(6000),
    });

    const data = await res.json();
    if (!res.ok || !data.ok) {
      console.error("Telegram sendMessage error:", data);
      return {
        ok: false,
        error: data.description || "Gagal mengirim pesan ke Telegram",
        data,
      };
    }

    return { ok: true, data };
  } catch {
    console.error("sendTelegramMessage exception: gagal menghubungi API Telegram");
    return { ok: false, error: "Gagal menghubungi server Telegram." };
  }
}

/**
 * Sends a photo to Telegram with a caption. If sendPhoto fails (e.g. invalid image URL),
 * gracefully falls back to sending a text message.
 */
export async function sendTelegramPhoto(
  photoUrl: string,
  caption: string,
  options?: SendTelegramOptions
): Promise<{ ok: boolean; data?: unknown; error?: string }> {
  try {
    const config = await getTelegramConfig();
    if (!config.isConfigured) {
      return { ok: false, error: "Token bot atau Chat ID Telegram belum dikonfigurasi." };
    }

    // Telegram caption max length is 1024 characters
    const trimmedCaption =
      caption.length > 1020 ? caption.slice(0, 1015) + "..." : caption;

    const payload: Record<string, unknown> = {
      chat_id: config.chatId,
      photo: photoUrl,
      caption: trimmedCaption,
      parse_mode: "HTML",
    };

    if (options?.inlineButtons && options.inlineButtons.length > 0) {
      payload.reply_markup = {
        inline_keyboard: options.inlineButtons,
      };
    }

    const res = await fetch(`https://api.telegram.org/bot${config.botToken}/sendPhoto`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
      signal: AbortSignal.timeout(6000),
    });

    const data = await res.json();
    if (!res.ok || !data.ok) {
      console.warn("Telegram sendPhoto failed, falling back to sendMessage:", data.description);
      // Fallback to sendMessage
      return await sendTelegramMessage(caption, options);
    }

    return { ok: true, data };
  } catch {
    console.warn("sendTelegramPhoto exception, falling back to sendMessage");
    return await sendTelegramMessage(caption, options);
  }
}

export interface BeritaNotificationPayload {
  id?: string;
  title: string;
  slug: string;
  category?: string;
  excerpt?: string;
  content?: string;
  image_url?: string | null;
  tags?: string[] | string;
  author?: string;
}

/**
 * Sends a formatted announcement for a newly uploaded / published berita to Telegram.
 */
export async function sendNewBeritaNotification(
  berita: BeritaNotificationPayload
): Promise<{ ok: boolean; error?: string }> {
  const config = await getTelegramConfig();
  if (!config.isConfigured) {
    return { ok: false, error: "Bot Telegram belum dikonfigurasi (Bot Token / Chat ID kosong)." };
  }
  if (!config.notifEnabled) {
    return { ok: false, error: "Notifikasi berita Telegram sedang dinonaktifkan di pengaturan." };
  }

  const siteUrl = getBaseSiteUrl();
  const newsUrl = `${siteUrl}/id/berita/${encodeURIComponent(berita.slug)}`;

  const safeTitle = escapeHtml(berita.title);
  const safeCategory = escapeHtml(berita.category || "Berita");
  const safeAuthor = escapeHtml(berita.author || "Humas BEM STMIK Tazkia");

  const rawExcerpt = berita.excerpt || stripHtml(berita.content || "").slice(0, 260);
  const safeExcerpt = escapeHtml(rawExcerpt.trim());

  let tagsArray: string[] = [];
  if (Array.isArray(berita.tags)) {
    tagsArray = berita.tags;
  } else if (typeof berita.tags === "string") {
    tagsArray = berita.tags.split(",").map((t) => t.trim());
  }

  const tagsText = tagsArray
    .filter(Boolean)
    .slice(0, 5)
    .map((t) => `#${escapeHtml(t.replace(/\s+/g, ""))}`)
    .join(" ");

  const todayStr = formatWibDate();

  let message =
    `📢 <b>BERITA TERBARU BEM STMIK TAZKIA</b>\n\n` +
    `📰 <b>${safeTitle}</b>\n\n` +
    `📂 <b>Kategori:</b> ${safeCategory}\n` +
    `✍️ <b>Penulis:</b> ${safeAuthor}\n` +
    `📅 <b>Tanggal:</b> ${todayStr}\n\n` +
    `📝 <b>Ringkasan:</b>\n` +
    `${safeExcerpt}${safeExcerpt.length >= 260 ? "..." : ""}\n\n`;

  if (tagsText) {
    message += `🏷️ <i>${tagsText}</i>\n\n`;
  }

  message += `🔗 <b>Baca Selengkapnya:</b>\n<a href="${newsUrl}">${newsUrl}</a>`;

  const inlineButtons = [
    [
      {
        text: "📖 Baca Berita di Website",
        url: newsUrl,
      },
    ],
  ];

  const validImageUrl = isValidHttpUrl(berita.image_url);

  if (validImageUrl) {
    return await sendTelegramPhoto(validImageUrl, message, { inlineButtons });
  } else {
    return await sendTelegramMessage(message, { inlineButtons });
  }
}

export interface ReminderCheckResult {
  reminded: boolean;
  daysSinceLastPost: number;
  latestBerita: {
    id: string;
    title: string;
    slug: string;
    created_at: string;
  } | null;
  message: string;
  error?: string;
}

/**
 * Checks if the last published berita is >= 7 days old (1 week).
 * If so, and not in 24h cooldown (or if force=true), sends an alert to Telegram.
 */
export async function checkBeritaReminder(
  options?: { force?: boolean }
): Promise<ReminderCheckResult> {
  const config = await getTelegramConfig();

  if (!config.isConfigured) {
    return {
      reminded: false,
      daysSinceLastPost: 0,
      latestBerita: null,
      message: "Telegram belum dikonfigurasi.",
      error: "Bot Token / Chat ID belum diisi.",
    };
  }

  if (!config.reminderEnabled && !options?.force) {
    return {
      reminded: false,
      daysSinceLastPost: 0,
      latestBerita: null,
      message: "Fitur pengingat mingguan dinonaktifkan di pengaturan sistem.",
    };
  }

  const supabase = getAdminSupabaseClient();

  // 1. Fetch latest published berita
  const { data: latestList, error } = await supabase
    .from("berita")
    .select("id, title, slug, created_at, category")
    .eq("is_published", true)
    .order("created_at", { ascending: false })
    .limit(1);

  if (error) {
    return {
      reminded: false,
      daysSinceLastPost: 0,
      latestBerita: null,
      message: "Gagal mengambil data berita dari database.",
      error: error.message,
    };
  }

  const latest = latestList && latestList.length > 0 ? latestList[0] : null;

  const now = new Date();
  let daysSinceLastPost = 999;

  if (latest && latest.created_at) {
    const lastDate = new Date(latest.created_at);
    const diffMs = now.getTime() - lastDate.getTime();
    daysSinceLastPost = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  }

  const isOverdue = daysSinceLastPost >= 7;

  // If not overdue and not force, no reminder needed
  if (!isOverdue && !options?.force) {
    return {
      reminded: false,
      daysSinceLastPost,
      latestBerita: latest,
      message: `Berita masih dalam periode aktif (${daysSinceLastPost} hari yang lalu). Belum mencapai 7 hari.`,
    };
  }

  // Check 24-hour cooldown so we don't spam the chat multiple times on the same day
  if (config.lastReminderSentAt && !options?.force) {
    const lastSentDate = new Date(config.lastReminderSentAt);
    const hoursSinceLastSent =
      (now.getTime() - lastSentDate.getTime()) / (1000 * 60 * 60);

    if (hoursSinceLastSent < 24) {
      return {
        reminded: false,
        daysSinceLastPost,
        latestBerita: latest,
        message: `Peringatan sudah dikirim dalam 24 jam terakhir (${Math.round(hoursSinceLastSent)} jam lalu). Cooldown aktif.`,
      };
    }
  }

  // 2. Compose Telegram Warning Message
  const siteUrl = getBaseSiteUrl();
  const adminNewBeritaUrl = `${siteUrl}/admin/berita/new`;

  let reminderMessage =
    `⚠️ <b>PERINGATAN: WEBSITE BEM BELUM ADA BERITA BARU!</b> ⚠️\n\n` +
    `Halo Rekan Pengurus & Tim Humas BEM STMIK Tazkia! 👋\n\n` +
    `Website BEM Tazkia sudah <b>${daysSinceLastPost >= 999 ? "lama sekali" : `${daysSinceLastPost} hari`}</b> belum ada unggahan berita atau artikel baru (lebih dari 1 minggu).\n\n`;

  if (latest) {
    const formattedLastDate = new Date(latest.created_at).toLocaleDateString("id-ID", {
      timeZone: "Asia/Jakarta",
      weekday: "long",
      day: "numeric",
      month: "long",
      year: "numeric",
    });

    reminderMessage +=
      `📌 <b>Berita Terakhir yang Diterbitkan:</b>\n` +
      `• Judul: <b>${escapeHtml(latest.title)}</b>\n` +
      `• Kategori: <i>${escapeHtml(latest.category || "Berita")}</i>\n` +
      `• Tanggal: <i>${formattedLastDate} (${daysSinceLastPost} hari yang lalu)</i>\n\n`;
  } else {
    reminderMessage += `📌 <i>Belum ada berita yang diterbitkan di website sama sekali.</i>\n\n`;
  }

  reminderMessage +=
    `🎯 <b>Mengapa update berita penting?</b>\n` +
    `• Menjaga portal informasi kampus tetap aktif dan relevan\n` +
    `• Menyampaikan transparansi kegiatan & program kerja BEM ke mahasiswa\n` +
    `• Mengoptimalkan kunjungan & SEO website resmi BEM\n\n` +
    `🚀 <i>Yuk, luangkan waktu sebentar untuk menulis berita atau rilis kegiatan terbaru!</i>`;

  const inlineButtons = [
    [
      {
        text: "✍️ Tulis Berita Baru Sekarang",
        url: adminNewBeritaUrl,
      },
    ],
    [
      {
        text: "🌐 Buka Portal Berita",
        url: `${siteUrl}/id/berita`,
      },
    ],
  ];

  const sendResult = await sendTelegramMessage(reminderMessage, { inlineButtons });

  if (sendResult.ok) {
    // Record reminder sent timestamp to avoid spamming
    try {
      await supabase.from("system_settings").upsert(
        [
          {
            key: "telegram_last_reminder_sent_at",
            value: now.toISOString(),
          },
        ],
        { onConflict: "key" }
      );
    } catch (saveErr) {
      console.error("Gagal menyimpan waktu reminder terakhir:", saveErr);
    }

    return {
      reminded: true,
      daysSinceLastPost,
      latestBerita: latest,
      message: `Peringatan berhasil dikirim ke Telegram! (Sudah ${daysSinceLastPost} hari tidak upload)`,
    };
  } else {
    return {
      reminded: false,
      daysSinceLastPost,
      latestBerita: latest,
      message: "Gagal mengirim pesan peringatan ke Telegram.",
      error: sendResult.error,
    };
  }
}

/**
 * Sends a simple ping/test message to verify Telegram credentials.
 */
export async function sendTelegramTestPing(): Promise<{ ok: boolean; error?: string }> {
  const config = await getTelegramConfig();
  if (!config.isConfigured) {
    return { ok: false, error: "Bot Token atau Chat ID belum dikonfigurasi." };
  }

  const siteUrl = getBaseSiteUrl();
  const testMsg =
    `🤖 <b>Uji Coba Koneksi Bot Telegram Internal BEM STMIK Tazkia</b>\n\n` +
    `✅ <b>Status:</b> Bot terhubung dan berfungsi dengan baik!\n` +
    `📅 <b>Waktu:</b> ${formatWibDateTime()} WIB\n\n` +
    `Kanal Telegram digunakan untuk notifikasi internal & teknis:\n` +
    `• 📝 Pengajuan, revisi, penarikan & moderasi artikel mahasiswa\n` +
    `• 🤝 Pendaftaran Volunteer & RSVP Event masuk\n` +
    `• 🚨 Kotak Saran & Aduan mahasiswa\n` +
    `• 🚧 Status mode maintenance sistem\n` +
    `• ⏰ Pengingat mingguan jika belum ada berita baru`;

  const inlineButtons = [
    [
      {
        text: "🌐 Kunjungi Portal Admin",
        url: `${siteUrl}/admin`,
      },
    ],
  ];

  return await sendTelegramMessage(testMsg, { inlineButtons });
}



export interface ArticleSubmittedPayload {
  title: string;
  category?: string;
  authorName?: string;
  authorEmail?: string;
  isRevision?: boolean;
  slug?: string;
}

/**
 * Mengirim notifikasi ke Telegram ketika mahasiswa mengajukan artikel baru atau revisi.
 */
export async function sendArticleSubmittedNotification(
  payload: ArticleSubmittedPayload
): Promise<{ ok: boolean; error?: string }> {
  const config = await getTelegramConfig();
  if (!config.isConfigured || !config.techNotifEnabled) {
    return { ok: false, error: "Notifikasi teknis Telegram tidak aktif atau belum dikonfigurasi." };
  }

  const siteUrl = getBaseSiteUrl();
  const safeTitle = escapeHtml(payload.title);
  const safeCategory = escapeHtml(payload.category || "Artikel Mahasiswa");
  const safeAuthor = escapeHtml(payload.authorName || "Mahasiswa STMIK Tazkia");
  const safeEmail = payload.authorEmail ? escapeHtml(payload.authorEmail) : "";
  const jenisText = payload.isRevision ? "Pengajuan Revisi Artikel" : "Artikel Baru";
  const timeStr = formatWibDateTime();

  const message =
    `📝 <b>PENGAJUAN ARTIKEL MAHASISWA BARU</b>\n\n` +
    `Ada karya tulis mahasiswa yang baru saja diajukan dan membutuhkan peninjauan/moderasi admin:\n\n` +
    `📌 <b>Judul:</b> ${safeTitle}\n` +
    `📂 <b>Kategori:</b> ${safeCategory}\n` +
    `👤 <b>Penulis:</b> ${safeAuthor}${safeEmail ? ` (<code>${safeEmail}</code>)` : ""}\n` +
    `📄 <b>Jenis:</b> ${jenisText}\n` +
    `📅 <b>Waktu:</b> ${timeStr} WIB\n\n` +
    `Silakan buka portal admin untuk meninjau dan memoderasi naskah ini.`;

  const inlineButtons = [
    [
      {
        text: "🔍 Buka Panel Moderasi Artikel",
        url: `${siteUrl}/admin/artikel`,
      },
    ],
  ];

  return await sendTelegramMessage(message, { inlineButtons });
}

export interface ArticleWithdrawnPayload {
  title: string;
  category?: string;
  authorName?: string;
  authorEmail?: string;
}

/**
 * Mengirim notifikasi ke Telegram ketika mahasiswa menarik pengajuan artikel kembali ke draf.
 */
export async function sendArticleWithdrawnNotification(
  payload: ArticleWithdrawnPayload
): Promise<{ ok: boolean; error?: string }> {
  const config = await getTelegramConfig();
  if (!config.isConfigured || !config.techNotifEnabled) {
    return { ok: false, error: "Notifikasi teknis Telegram tidak aktif atau belum dikonfigurasi." };
  }

  const siteUrl = getBaseSiteUrl();
  const safeTitle = escapeHtml(payload.title);
  const safeCategory = escapeHtml(payload.category || "Artikel Mahasiswa");
  const safeAuthor = escapeHtml(payload.authorName || "Mahasiswa STMIK Tazkia");
  const safeEmail = payload.authorEmail ? escapeHtml(payload.authorEmail) : "";
  const timeStr = formatWibDateTime();

  const message =
    `↩️ <b>PENGAJUAN ARTIKEL DITARIK (KEMBALI KE DRAF)</b>\n\n` +
    `Penulis telah menarik naskah artikelnya dari antrean moderasi untuk diperbaiki/diedit secara mandiri:\n\n` +
    `📌 <b>Judul:</b> ${safeTitle}\n` +
    `📂 <b>Kategori:</b> ${safeCategory}\n` +
    `👤 <b>Penulis:</b> ${safeAuthor}${safeEmail ? ` (<code>${safeEmail}</code>)` : ""}\n` +
    `📅 <b>Waktu:</b> ${timeStr} WIB\n\n` +
    `ℹ️ <i>Artikel telah dikeluarkan dari antrean review dan kembali berstatus draf di dashboard penulis.</i>`;

  const inlineButtons = [
    [
      {
        text: "🛡️ Buka Panel Moderasi Artikel",
        url: `${siteUrl}/admin/artikel`,
      },
    ],
  ];

  return await sendTelegramMessage(message, { inlineButtons });
}

export interface ArticleModeratedPayload {
  title: string;
  action: "approved" | "rejected" | "unpublished";
  category?: string;
  note?: string;
  authorName?: string;
  adminName?: string;
  slug?: string;
  isRevision?: boolean;
}

/**
 * Mengirim notifikasi audit ke Telegram ketika artikel disetujui, ditolak (minta revisi), atau di-unpublish.
 */
export async function sendArticleModeratedNotification(
  payload: ArticleModeratedPayload
): Promise<{ ok: boolean; error?: string }> {
  const config = await getTelegramConfig();
  if (!config.isConfigured || !config.techNotifEnabled) {
    return { ok: false, error: "Notifikasi teknis Telegram tidak aktif atau belum dikonfigurasi." };
  }

  const siteUrl = getBaseSiteUrl();
  const safeTitle = escapeHtml(payload.title);
  const safeAuthor = escapeHtml(payload.authorName || "Mahasiswa");
  const safeAdmin = escapeHtml(payload.adminName || "Administrator BEM");
  const safeCategory = escapeHtml(payload.category || "Artikel Mahasiswa");
  const timeStr = formatWibDateTime();

  let message = "";
  const inlineButtons: Array<Array<{ text: string; url: string }>> = [];

  if (payload.action === "approved") {
    const articleUrl = payload.slug
      ? `${siteUrl}/id/artikel/${encodeURIComponent(payload.slug)}`
      : `${siteUrl}/id/artikel`;
    message =
      `✅ <b>ARTIKEL MAHASISWA DISETUJUI & TAYANG</b>\n\n` +
      `Karya tulis mahasiswa telah disetujui oleh admin dan kini resmi tayang di website:\n\n` +
      `📌 <b>Judul:</b> ${safeTitle}\n` +
      `📂 <b>Kategori:</b> ${safeCategory}\n` +
      `👤 <b>Penulis:</b> ${safeAuthor}\n` +
      `🛡️ <b>Disetujui Oleh:</b> ${safeAdmin}\n` +
      `📅 <b>Waktu Tayang:</b> ${timeStr} WIB\n\n` +
      `Artikel sudah dapat diakses dan dibaca oleh seluruh mahasiswa dan publik.`;

    inlineButtons.push([
      {
        text: "📖 Baca Artikel di Website",
        url: articleUrl,
      },
    ]);
  } else if (payload.action === "rejected") {
    const safeNote = escapeHtml(payload.note || "Tidak ada catatan evaluasi.");
    message =
      `⚠️ <b>ARTIKEL MAHASISWA DIKEMBALIKAN (REVISI)</b>\n\n` +
      `Karya tulis mahasiswa telah dimoderasi dan dikembalikan kepada penulis untuk perbaikan:\n\n` +
      `📌 <b>Judul:</b> ${safeTitle}\n` +
      `👤 <b>Penulis:</b> ${safeAuthor}\n` +
      `🛡️ <b>Dimoderasi Oleh:</b> ${safeAdmin}\n` +
      `📅 <b>Waktu:</b> ${timeStr} WIB\n\n` +
      `📝 <b>Catatan Evaluasi / Alasan:</b>\n` +
      `<i>"${safeNote}"</i>\n\n` +
      `Status artikel di dashboard penulis kini menjadi perlu revisi/ditolak.`;

    inlineButtons.push([
      {
        text: "🛡️ Buka Panel Moderasi",
        url: `${siteUrl}/admin/artikel`,
      },
    ]);
  } else {
    message =
      `🛑 <b>ARTIKEL MAHASISWA DITURUNKAN (UNPUBLISH)</b>\n\n` +
      `Sebuah artikel yang sebelumnya tayang telah diturunkan dari publik oleh administrator:\n\n` +
      `📌 <b>Judul:</b> ${safeTitle}\n` +
      `👤 <b>Penulis:</b> ${safeAuthor}\n` +
      `🛡️ <b>Diturunkan Oleh:</b> ${safeAdmin}\n` +
      `📅 <b>Waktu:</b> ${timeStr} WIB\n\n` +
      `Artikel tidak lagi tampil di katalog publik dan kembali berstatus draf di dashboard penulis.`;

    inlineButtons.push([
      {
        text: "🛡️ Buka Panel Moderasi",
        url: `${siteUrl}/admin/artikel`,
      },
    ]);
  }

  return await sendTelegramMessage(message, { inlineButtons });
}

export interface MaintenanceModePayload {
  isEnabled: boolean;
  message?: string;
  estimatedTime?: string;
  adminName?: string;
  releaseVersion?: string;
  releaseTitle?: string;
  releaseFeatures?: string[];
}

/**
 * Mengirim notifikasi ke Telegram saat mode maintenance dinyalakan atau dimatikan/beres.
 */
export async function sendMaintenanceModeNotification(
  payload: MaintenanceModePayload
): Promise<{ ok: boolean; error?: string }> {
  const config = await getTelegramConfig();
  if (!config.isConfigured || !config.techNotifEnabled) {
    return { ok: false, error: "Notifikasi teknis Telegram tidak aktif atau belum dikonfigurasi." };
  }

  const siteUrl = getBaseSiteUrl();
  const safeAdmin = escapeHtml(payload.adminName || "Administrator BEM");
  const timeStr = formatWibDateTime();

  let message = "";
  const inlineButtons: Array<Array<{ text: string; url: string }>> = [];

  if (payload.isEnabled) {
    const safeMsg = escapeHtml(
      payload.message?.trim() ||
        "Pembaruan sistem, optimalisasi database, dan peningkatan keamanan portal resmi BEM STMIK Tazkia."
    );
    const safeTime = escapeHtml(payload.estimatedTime?.trim() || "1-2 Jam");

    message =
      `🚧 <b>PEMBERITAHUAN: MODE MAINTENANCE DIAKTIFKAN</b> 🚧\n\n` +
      `Website resmi BEM STMIK Tazkia saat ini sedang dialihkan ke <b>Mode Pemeliharaan (Maintenance Mode)</b>.\n\n` +
      `📢 <b>Pesan Pemeliharaan:</b>\n` +
      `<i>"${safeMsg}"</i>\n\n` +
      `⏳ <b>Estimasi Pengerjaan:</b> ${safeTime}\n` +
      `🛡️ <b>Diaktifkan Oleh:</b> ${safeAdmin}\n` +
      `📅 <b>Waktu Mulai:</b> ${timeStr} WIB\n\n` +
      `Akses pengunjung publik sementara ditutup dan dialihkan ke layar pemeliharaan. Pengurus tetap dapat mengakses portal internal.`;

    inlineButtons.push([
      {
        text: "🌐 Pantau Website",
        url: siteUrl,
      },
    ]);
  } else {
    const versionStr = payload.releaseVersion ? ` (${escapeHtml(payload.releaseVersion)})` : "";
    const releaseTitleStr = payload.releaseTitle ? escapeHtml(payload.releaseTitle) : "Pembaruan & Peningkatan Sistem";

    let featuresBlock = "";
    if (payload.releaseFeatures && payload.releaseFeatures.length > 0) {
      const validFeatures = payload.releaseFeatures
        .map((f) => f.trim())
        .filter((f) => f.length > 0);

      if (validFeatures.length > 0) {
        featuresBlock =
          `\n\n✨ <b>Poin-poin Fitur Baru & Peningkatan:</b>\n` +
          validFeatures.map((f, i) => `  ${i + 1}. ${escapeHtml(f)}`).join("\n");
      }
    }

    message =
      `🟢 <b>PEMELIHARAAN SELESAI: WEBSITE KEMBALI NORMAL</b> 🟢\n\n` +
      `Proses pemeliharaan sistem website BEM STMIK Tazkia telah <b>selesai</b> dan situs kini kembali beroperasi normal untuk seluruh pengguna dan publik!\n\n` +
      `📦 <b>Pembaruan:</b> ${releaseTitleStr}${versionStr}` +
      featuresBlock +
      `\n\n🛡️ <b>Dinonaktifkan Oleh:</b> ${safeAdmin}\n` +
      `📅 <b>Waktu Selesai:</b> ${timeStr} WIB\n\n` +
      `Terima kasih atas kesabaran dan kerja keras seluruh tim! Silakan akses portal seperti biasa.`;

    inlineButtons.push([
      {
        text: "🌐 Kunjungi Website",
        url: siteUrl,
      },
    ]);
  }

  return await sendTelegramMessage(message, { inlineButtons });
}

export interface SaranAduanNotificationPayload {
  nama: string;
  kategori: string;
  deskripsi: string;
  excelLink?: string | null;
}

/**
 * Mengirim notifikasi pesan baru Kotak Saran / Aduan mahasiswa ke Telegram internal pengurus.
 */
export async function sendSaranAduanNotification(
  payload: SaranAduanNotificationPayload
): Promise<{ ok: boolean; error?: string }> {
  const config = await getTelegramConfig();
  if (!config.isConfigured || !config.techNotifEnabled) {
    return { ok: false, error: "Notifikasi teknis Telegram tidak aktif atau belum dikonfigurasi." };
  }

  const siteUrl = getBaseSiteUrl();
  const safeNama = escapeHtml(payload.nama || "Mahasiswa / Anonim");
  const safeKategori = escapeHtml(payload.kategori || "Umum");
  const safeDeskripsi = escapeHtml(truncateText(payload.deskripsi, 1500));
  const wibTime = formatWibDateTime();
  const validExcelLink = isValidHttpUrl(payload.excelLink);

  let message =
    `🚨 <b>Pesan Baru di Kotak Saran / Aduan!</b> 🚨\n\n` +
    `👤 <b>Pengirim:</b> ${safeNama}\n` +
    `📂 <b>Kategori:</b> ${safeKategori}\n` +
    `📅 <b>Waktu:</b> ${wibTime} WIB\n` +
    `📝 <b>Pesan:</b>\n${safeDeskripsi}\n\n`;

  if (validExcelLink) {
    message += `📊 <a href="${escapeHtml(validExcelLink)}">Lihat Rekap Spreadsheet</a>`;
  } else {
    message += `📊 <i>Link Excel belum diatur di Pengaturan Sistem</i>`;
  }

  const inlineButtons = [
    [
      {
        text: "💬 Buka Kotak Saran Admin",
        url: `${siteUrl}/admin/saran-aduan`,
      },
    ],
  ];

  return await sendTelegramMessage(message, { inlineButtons });
}

export interface VolunteerAppliedNotificationPayload {
  agendaId: string;
  agendaTitle: string;
  agendaType?: "volunteer" | "event" | string;
  selectedItems?: string[];
  fields: Array<{ label: string; value: string }>;
  totalParticipants?: number;
}

/**
 * Mengirim notifikasi ke Telegram internal pengurus saat ada pendaftar volunteer / RSVP event baru.
 */
export async function sendVolunteerAppliedNotification(
  payload: VolunteerAppliedNotificationPayload
): Promise<{ ok: boolean; error?: string }> {
  const config = await getTelegramConfig();
  if (!config.isConfigured || !config.techNotifEnabled) {
    return { ok: false, error: "Notifikasi teknis Telegram tidak aktif atau belum dikonfigurasi." };
  }

  const siteUrl = getBaseSiteUrl();
  const isVolunteer = payload.agendaType === "volunteer";
  const header = isVolunteer
    ? "🤝 <b>PENDAFTAR VOLUNTEER / OPREC BARU</b>"
    : "🎟️ <b>PENDAFTARAN RSVP EVENT BARU</b>";

  const safeTitle = escapeHtml(payload.agendaTitle || "Kegiatan BEM");
  const timeStr = formatWibDateTime();

  const summaryLines = payload.fields
    .filter((f) => f.value && f.value.trim().length > 0)
    .slice(0, 6)
    .map((f) => `• <b>${escapeHtml(f.label)}:</b> ${escapeHtml(truncateText(f.value, 140))}`)
    .join("\n");

  const countLine =
    typeof payload.totalParticipants === "number"
      ? `👥 <b>Total Pendaftar Saat Ini:</b> ${payload.totalParticipants} orang\n`
      : "";

  const selectedLine =
    payload.selectedItems && payload.selectedItems.length > 0
      ? `🏷️ <b>${isVolunteer ? "Posisi Dipilih" : "Cabang Lomba"}:</b> ${escapeHtml(
          payload.selectedItems.join(", ")
        )}\n`
      : "";

  const message =
    `${header}\n\n` +
    `📌 <b>Kegiatan / Program:</b> ${safeTitle}\n` +
    selectedLine +
    countLine +
    `📅 <b>Waktu Daftar:</b> ${timeStr} WIB\n` +
    (summaryLines ? `\n📋 <b>Ringkasan Data Pendaftar:</b>\n${summaryLines}\n` : "") +
    `\nSilakan cek panel admin untuk meninjau data lengkap dan berkas pendaftar.`;

  const inlineButtons = [
    [
      {
        text: "📋 Lihat Data Pendaftar",
        url: `${siteUrl}/admin/kegiatan/${encodeURIComponent(payload.agendaId)}/pendaftar`,
      },
    ],
  ];

  return await sendTelegramMessage(message, { inlineButtons });
}

export interface VolunteerModeratedNotificationPayload {
  agendaId: string;
  agendaTitle: string;
  status: "accepted" | "rejected" | "pending";
  applicantLabel: string;
  itemName?: string | null;
  adminName?: string;
}

/**
 * Mengirim log audit ke Telegram internal saat admin memverifikasi/mengubah status pendaftar.
 */
export async function sendVolunteerModeratedNotification(
  payload: VolunteerModeratedNotificationPayload
): Promise<{ ok: boolean; error?: string }> {
  if (payload.status === "pending") {
    return { ok: true };
  }

  const config = await getTelegramConfig();
  if (!config.isConfigured || !config.techNotifEnabled) {
    return { ok: false, error: "Notifikasi teknis Telegram tidak aktif atau belum dikonfigurasi." };
  }

  const siteUrl = getBaseSiteUrl();
  const isAccepted = payload.status === "accepted";
  const header = isAccepted
    ? "✅ <b>PENDAFTAR DITERIMA PANITIA</b>"
    : "❌ <b>PENDAFTAR DITOLAK PANITIA</b>";

  const safeAgenda = escapeHtml(payload.agendaTitle || "Kegiatan BEM");
  const safeApplicant = escapeHtml(payload.applicantLabel || "Mahasiswa");
  const safeAdmin = escapeHtml(payload.adminName || "Administrator BEM");
  const itemLine = payload.itemName
    ? `🏷️ <b>Posisi / Cabang:</b> ${escapeHtml(payload.itemName)}\n`
    : "";
  const timeStr = formatWibDateTime();

  const message =
    `${header}\n\n` +
    `📌 <b>Kegiatan:</b> ${safeAgenda}\n` +
    itemLine +
    `👤 <b>Pendaftar:</b> ${safeApplicant}\n` +
    `🛡️ <b>Diverifikasi Oleh:</b> ${safeAdmin}\n` +
    `📅 <b>Waktu:</b> ${timeStr} WIB`;

  const inlineButtons = [
    [
      {
        text: "📋 Lihat Data Pendaftar",
        url: `${siteUrl}/admin/kegiatan/${encodeURIComponent(payload.agendaId)}/pendaftar`,
      },
    ],
  ];

  return await sendTelegramMessage(message, { inlineButtons });
}
