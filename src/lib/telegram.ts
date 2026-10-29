import { getServiceRoleClient } from "@/lib/auth";
import { getSecret } from "@/lib/secrets";

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

/**
 * Strips HTML tags and normalizes spaces.
 */
export function stripHtml(text: string): string {
  return (text || "")
    .replace(/<[^>]*>?/gm, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#039;/g, "'")
    .replace(/\s+/g, " ")
    .trim();
}

/**
 * Returns the public website base URL.
 */
export function getBaseSiteUrl(): string {
  return (
    process.env.NEXT_PUBLIC_SITE_URL ||
    process.env.SITE_URL ||
    "https://bem.stmik.tazkia.ac.id"
  ).replace(/\/+$/, "");
}

export interface TelegramConfig {
  botToken: string;
  chatId: string;
  notifEnabled: boolean;
  reminderEnabled: boolean;
  lastReminderSentAt: string | null;
  isConfigured: boolean;
}

/**
 * Loads Telegram configuration.
 * Sensitive credentials (botToken, chatId) are loaded EXCLUSIVELY from environment variables
 * (TELEGRAM_BOT_TOKEN, TELEGRAM_CHAT_ID) for defense in depth.
 * Operational feature flags (notifEnabled, reminderEnabled, lastReminderSentAt) are read from system_settings.
 */
export async function getTelegramConfig(): Promise<TelegramConfig> {
  const supabase = getAdminSupabaseClient();
  const botToken = await getSecret("telegram_bot_token");
  const chatId = await getSecret("telegram_chat_id");
  let notifEnabled = true;
  let reminderEnabled = true;
  let lastReminderSentAt: string | null = null;

  try {
    const { data, error } = await supabase
      .from("system_settings")
      .select("key, value")
      .in("key", [
        "telegram_berita_notif_enabled",
        "telegram_berita_reminder_enabled",
        "telegram_last_reminder_sent_at",
      ]);

    if (!error && data) {
      const map = data.reduce(
        (acc, curr) => ({ ...acc, [curr.key]: curr.value }),
        {} as Record<string, string>
      );
      if (map["telegram_berita_notif_enabled"] === "false") notifEnabled = false;
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
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Network error sending telegram message";
    console.error("sendTelegramMessage exception:", msg);
    return { ok: false, error: msg };
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
    });

    const data = await res.json();
    if (!res.ok || !data.ok) {
      console.warn("Telegram sendPhoto failed, falling back to sendMessage:", data.description);
      // Fallback to sendMessage
      return await sendTelegramMessage(caption, options);
    }

    return { ok: true, data };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Error sending telegram photo";
    console.warn("sendTelegramPhoto exception, falling back to sendMessage:", msg);
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

  const todayStr = new Date().toLocaleDateString("id-ID", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });

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

  // If there is an image URL that looks like a valid external or uploaded URL
  const validImageUrl =
    berita.image_url &&
    (berita.image_url.startsWith("http://") || berita.image_url.startsWith("https://"))
      ? berita.image_url
      : null;

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
    `🤖 <b>Uji Coba Koneksi Bot Telegram BEM STMIK Tazkia</b>\n\n` +
    `✅ <b>Status:</b> Bot terhubung dan berfungsi dengan baik!\n` +
    `📅 <b>Waktu:</b> ${new Date().toLocaleString("id-ID")} WIB\n\n` +
    `Fitur yang aktif:\n` +
    `• 📢 Notifikasi otomatis saat berita baru diupload\n` +
    `• ⏰ Peringatan otomatis jika 1 minggu belum ada upload berita baru`;

  const inlineButtons = [
    [
      {
        text: "🌐 Kunjungi Portal BEM",
        url: siteUrl,
      },
    ],
  ];

  return await sendTelegramMessage(testMsg, { inlineButtons });
}

