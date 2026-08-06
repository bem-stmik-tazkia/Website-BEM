"use client";

import React, { useState, useEffect } from "react";
import { createClient } from "@/utils/supabase/client";
import { motion, AnimatePresence } from "framer-motion";

const DUMMY_CHATS = [
  "Event BEM kemarin seru banget! ✨",
  "Tolong perbaiki AC di lab komputer 🙏",
  "Kapan oprec panitia selanjutnya?",
  "Website BEM makin keren euy 🔥",
  "Adain lomba e-sport dong min 🎮",
  "Semangat terus BEM STMIK Tazkia!",
  "Usul: perbanyak acara seminar teknologi 💻",
  "Fasilitas parkir kadang penuh, tolong ditertibkan 🚗",
  "Bikin merchandise jaket BEM dong! 🧥"
];

const CHAT_COLORS = [
  "bg-blue-100 text-blue-800 border-blue-200",
  "bg-green-100 text-green-800 border-green-200",
  "bg-purple-100 text-purple-800 border-purple-200",
  "bg-orange-100 text-orange-800 border-orange-200",
  "bg-pink-100 text-pink-800 border-pink-200",
  "bg-teal-100 text-teal-800 border-teal-200",
];

const EMOJI_DB = [
  { emoji: '🍎', name: 'Buah Apel' },
  { emoji: '🍌', name: 'Buah Pisang' },
  { emoji: '🍉', name: 'Buah Semangka' },
  { emoji: '🍇', name: 'Buah Anggur' },
  { emoji: '🍓', name: 'Buah Stroberi' },
  { emoji: '🍔', name: 'Burger' },
  { emoji: '🍕', name: 'Pizza' },
  { emoji: '🚗', name: 'Mobil Merah' },
  { emoji: '⚽', name: 'Bola Sepak' },
  { emoji: '🎸', name: 'Gitar' },
  { emoji: '🐶', name: 'Wajah Anjing' },
  { emoji: '🐱', name: 'Wajah Kucing' },
  { emoji: '🐼', name: 'Wajah Panda' },
  { emoji: '🚀', name: 'Roket' },
  { emoji: '🌻', name: 'Bunga Matahari' }
];

export default function SaranAduan() {
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [fieldErrors, setFieldErrors] = useState({ kategori: false, deskripsi: false });
  const [successMsg, setSuccessMsg] = useState("");
  const supabase = createClient();

  // Form states
  const [nama, setNama] = useState("");
  const [kategori, setKategori] = useState("");
  const [deskripsi, setDeskripsi] = useState("");
  const [isFormFocused, setIsFormFocused] = useState(false);
  const isFormFocusedRef = React.useRef(false);

  React.useEffect(() => {
    isFormFocusedRef.current = isFormFocused;
  }, [isFormFocused]);

  const [captchaOptions, setCaptchaOptions] = useState<typeof EMOJI_DB>([]);
  const [captchaTarget, setCaptchaTarget] = useState<typeof EMOJI_DB[0] | null>(null);
  const [isCaptchaSolved, setIsCaptchaSolved] = useState(false);
  const [captchaError, setCaptchaError] = useState(false);
  
  interface Bubble {
    id: number;
    textIdx: number;
  }
  const [bubbles, setBubbles] = useState<Bubble[]>([]);
  const bubbleIdRef = React.useRef(0);

  const generateCaptcha = () => {
    setIsCaptchaSolved(false);
    setCaptchaError(false);
    const shuffled = [...EMOJI_DB].sort(() => 0.5 - Math.random());
    const selectedOptions = shuffled.slice(0, 5);
    setCaptchaOptions(selectedOptions);
    const target = selectedOptions[Math.floor(Math.random() * selectedOptions.length)];
    setCaptchaTarget(target);
  };

  useEffect(() => {
    generateCaptcha();
    
    // Initial bubbles
    setBubbles([
      { id: bubbleIdRef.current++, textIdx: 0 },
      { id: bubbleIdRef.current++, textIdx: 1 },
    ]);

    // Live chat bubble cycle
    const interval = setInterval(() => {
      if (!isFormFocusedRef.current) {
        setBubbles(prev => {
          let newTextIdx = Math.floor(Math.random() * DUMMY_CHATS.length);
          // Prevent exact duplicate of the most recent message
          if (prev.length > 0 && prev[prev.length - 1].textIdx === newTextIdx) {
            newTextIdx = (newTextIdx + 1) % DUMMY_CHATS.length;
          }

          const newBubble = {
            id: bubbleIdRef.current++,
            textIdx: newTextIdx,
          };
          
          // Keep max 2 bubbles on screen
          const nextBubbles = [...prev, newBubble];
          if (nextBubbles.length > 2) {
            return nextBubbles.slice(nextBubbles.length - 2);
          }
          return nextBubbles;
        });
      }
    }, 4000);
    return () => clearInterval(interval);
  }, []);

  const handleCaptchaClick = (item: typeof EMOJI_DB[0]) => {
    if (isCaptchaSolved) return;
    
    if (item.emoji === captchaTarget?.emoji) {
      setIsCaptchaSolved(true);
      setCaptchaError(false);
    } else {
      setCaptchaError(true);
      setTimeout(() => {
        generateCaptcha();
      }, 1500);
    }
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setErrorMsg("");
    setSuccessMsg("");
    setFieldErrors({ kategori: false, deskripsi: false });

    // Manual Validation
    let hasError = false;
    let newFieldErrors = { kategori: false, deskripsi: false };

    if (!kategori) {
      newFieldErrors.kategori = true;
      hasError = true;
    }
    if (!deskripsi || !deskripsi.trim()) {
      newFieldErrors.deskripsi = true;
      hasError = true;
    }

    if (!isCaptchaSolved) {
      setErrorMsg("Selesaikan verifikasi keamanan (puzzle) terlebih dahulu.");
      return;
    }

    if (hasError) {
      setFieldErrors(newFieldErrors);
      setErrorMsg("Mohon lengkapi kolom yang wajib diisi (berwarna merah).");
      return;
    }

    // Handle empty name
    const finalNama = nama && nama.trim() !== "" ? nama : "Anonim";

    setIsLoading(true);

    try {
      const { error } = await supabase
        .from("saran_aduan")
        .insert([{ nama: finalNama, kategori, deskripsi }]);

      if (error) {
        throw error;
      }

      // Try to forward to Google Sheets if Webhook URL is set
      try {
        const { data: settingData } = await supabase
          .from('system_settings')
          .select('value')
          .eq('key', 'google_sheets_webhook_url')
          .maybeSingle();
        
        if (settingData && settingData.value) {
          await fetch('/api/saran-webhook', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              webhookUrl: settingData.value,
              payload: {
                nama: finalNama,
                kategori,
                deskripsi,
                tanggal: new Date().toLocaleString('id-ID', { 
                  day: 'numeric', 
                  month: 'long', 
                  year: 'numeric', 
                  hour: '2-digit', 
                  minute: '2-digit',
                  second: '2-digit'
                }) + ' WIB'
              }
            })
          });
        }
      } catch (webhookErr) {
        console.error("Gagal mengirim ke Excel Webhook:", webhookErr);
        // Kita tidak menggagalkan proses form jika excel gagal
      }

      setSuccessMsg("Terima kasih! Saran/Aduan Anda telah terkirim.");
      setNama("");
      setKategori("");
      setDeskripsi("");
      generateCaptcha(); // Reset puzzle untuk pengiriman berikutnya

      // Hilangkan pesan sukses setelah 5 detik
      setTimeout(() => {
        setSuccessMsg("");
      }, 5000);
    } catch (error: any) {
      console.error("Error submitting:", error);
      setErrorMsg("Terjadi kesalahan sistem. Silakan coba lagi.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <section id="saran" className="py-10 md:py-20 relative bg-surface-variant overflow-hidden">
      {/* Decorative background elements */}
      <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-primary/5 rounded-full blur-[100px] -translate-y-1/2 translate-x-1/3 z-0"></div>
      <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-secondary/5 rounded-full blur-[80px] translate-y-1/3 -translate-x-1/4 z-0"></div>

      <div className="max-w-7xl mx-auto px-container-padding-mobile md:px-container-padding-desktop relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-16 items-start">
          
          {/* Text Content */}
          <div className="lg:sticky lg:top-28">
            
            {/* Live Chat Bubbles Area */}
            <div 
              className="relative h-56 md:h-64 mb-4 w-full hidden sm:block overflow-hidden"
              style={{ WebkitMaskImage: 'linear-gradient(to bottom, transparent 0%, black 25%, black 100%)', maskImage: 'linear-gradient(to bottom, transparent 0%, black 25%, black 100%)' }}
            >
              <div className="absolute bottom-0 left-0 flex flex-col gap-3.5 w-full pb-2 px-1">
                <AnimatePresence initial={false}>
                  {bubbles.map((bubble, i) => {
                    const colorClass = CHAT_COLORS[bubble.textIdx % CHAT_COLORS.length];
                    // Alternate slight margins to make it look a bit dynamic
                    const marginLeft = i % 2 !== 0 ? 'ml-8' : 'ml-2';
                    return (
                      <motion.div
                        layout
                        key={bubble.id}
                        initial={{ opacity: 0, scale: 0.8, y: 20, x: -10 }}
                        animate={{ opacity: 1, scale: 1, y: 0, x: 0 }}
                        exit={{ opacity: 0, scale: 0.8, filter: "blur(4px)" }}
                        transition={{ duration: 0.5, type: "spring", bounce: 0.3 }}
                        className={`px-4 py-3.5 rounded-2xl rounded-bl-sm shadow-sm border max-w-[280px] bg-surface/90 backdrop-blur-md flex gap-3 items-start relative z-0 ${colorClass} ${marginLeft}`}
                      >
                        <div className="w-8 h-8 rounded-full bg-white/60 flex items-center justify-center shrink-0 shadow-sm mt-0.5">
                          <span className="material-symbols-outlined text-[18px] opacity-80">person</span>
                        </div>
                        <div>
                          <p className="text-xs md:text-sm font-bold leading-relaxed">{DUMMY_CHATS[bubble.textIdx]}</p>
                          <span className="text-[10px] opacity-60 mt-1 block font-medium">Mahasiswa STMIK Tazkia</span>
                        </div>
                      </motion.div>
                    )
                  })}
                </AnimatePresence>
              </div>
            </div>
            
            <h2 className="font-display-md text-3xl md:text-4xl lg:text-5xl text-on-background mb-4 md:mb-6 leading-tight">
              Kotak <span className="text-primary">Saran & Aduan</span>
            </h2>
            
            <p className="font-body-lg text-on-surface-variant leading-relaxed mb-6 md:mb-8 max-w-xl text-sm md:text-base">
              BEM STMIK Tazkia selalu terbuka untuk mendengar aspirasi, kritik, maupun keluhan dari seluruh mahasiswa. Suara Anda sangat berarti untuk membangun kampus yang lebih baik.
            </p>

            <div className="flex flex-col gap-4 md:gap-6">
              <div className="flex items-start gap-3.5 md:gap-4 p-3 md:p-4 rounded-2xl bg-surface/40 border border-outline-variant/20">
                <div className="w-10 h-10 md:w-12 md:h-12 rounded-xl md:rounded-2xl bg-primary/10 text-primary shadow-sm flex items-center justify-center shrink-0">
                  <span className="material-symbols-outlined text-[20px] md:text-[24px]">lightbulb</span>
                </div>
                <div>
                  <h4 className="font-headline-sm text-sm md:text-base font-bold text-on-background mb-1">Saran Konstruktif</h4>
                  <p className="text-xs md:text-sm text-on-surface-variant leading-relaxed">Punya ide program kerja atau masukan untuk BEM? Sampaikan di sini.</p>
                </div>
              </div>
              
              <div className="flex items-start gap-3.5 md:gap-4 p-3 md:p-4 rounded-2xl bg-surface/40 border border-outline-variant/20">
                <div className="w-10 h-10 md:w-12 md:h-12 rounded-xl md:rounded-2xl bg-secondary/10 text-secondary shadow-sm flex items-center justify-center shrink-0">
                  <span className="material-symbols-outlined text-[20px] md:text-[24px]">report</span>
                </div>
                <div>
                  <h4 className="font-headline-sm text-sm md:text-base font-bold text-on-background mb-1">Aduan Fasilitas / Layanan</h4>
                  <p className="text-xs md:text-sm text-on-surface-variant leading-relaxed">Laporkan kendala terkait fasilitas kampus atau layanan kemahasiswaan. Kami jamin kerahasiaannya.</p>
                </div>
              </div>
            </div>
          </div>

          {/* Form Box */}
          <div className="bg-surface rounded-2xl md:rounded-3xl p-6 md:p-8 shadow-[0_20px_60px_-15px_rgba(27,64,134,0.08)] border border-outline-variant/30">
            <form className="flex flex-col gap-4" onSubmit={handleSubmit} noValidate>
              
              <div className="flex flex-col gap-1.5">
                  <div className="flex justify-between items-center">
                    <label className="text-xs md:text-sm font-bold text-on-background">Nama (Opsional)</label>
                    <span className={`text-[10px] ${nama.length >= 50 ? 'text-red-500 font-bold' : 'text-on-surface-variant'}`}>{nama.length}/50</span>
                  </div>
                  <input type="text" name="nama" value={nama} onChange={(e) => setNama(e.target.value)} onFocus={() => setIsFormFocused(true)} onBlur={() => setIsFormFocused(false)} maxLength={50} placeholder="Anonim" className={`w-full px-3.5 py-2.5 text-sm rounded-xl border bg-surface-variant/20 focus:bg-surface focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all text-on-background ${nama.length >= 50 ? 'border-red-500' : 'border-outline-variant/30'}`} />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs md:text-sm font-bold text-on-surface">
                  Kategori Laporan <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <select name="kategori" value={kategori} onChange={(e) => setKategori(e.target.value)} onFocus={() => setIsFormFocused(true)} onBlur={() => setIsFormFocused(false)} className={`w-full bg-surface-variant/20 border rounded-xl px-4 py-3 outline-none transition-all duration-300 text-sm text-on-surface appearance-none cursor-pointer ${fieldErrors.kategori ? "border-red-500 focus:border-red-500 focus:ring-2 focus:ring-red-500/20" : "border-outline-variant/30 focus:bg-surface focus:border-primary focus:ring-2 focus:ring-primary/20"}`}>
                    <option value="" disabled>Pilih Kategori</option>
                    <option value="saran">Saran & Masukan</option>
                    <option value="aduan">Aduan Mahasiswa</option>
                    <option value="lainnya">Lainnya</option>
                  </select>
                  <span className="material-symbols-outlined absolute right-3.5 top-1/2 -translate-y-1/2 text-outline pointer-events-none text-[18px]">expand_more</span>
                </div>
              </div>

              <div className="flex flex-col gap-1.5">
                <div className="flex justify-between items-center">
                  <label className="text-xs md:text-sm font-bold text-on-surface">
                    Deskripsi Detail <span className="text-red-500">*</span>
                  </label>
                  <span className={`text-[10px] font-medium ${deskripsi.length >= 1000 ? 'text-red-500 font-bold' : 'text-on-surface-variant'}`}>{deskripsi.length}/1000</span>
                </div>
                <textarea name="deskripsi" value={deskripsi} onChange={(e) => setDeskripsi(e.target.value)} onFocus={() => setIsFormFocused(true)} onBlur={() => setIsFormFocused(false)} maxLength={1000} rows={4} placeholder="Jelaskan secara rinci apa yang ingin Anda sampaikan..." className={`w-full bg-surface-variant/20 border rounded-xl px-4 py-3 outline-none transition-all duration-300 text-sm text-on-surface resize-none ${fieldErrors.deskripsi || deskripsi.length >= 1000 ? "border-red-500 focus:border-red-500 focus:ring-2 focus:ring-red-500/20" : "border-outline-variant/30 focus:bg-surface focus:border-primary focus:ring-2 focus:ring-primary/20"}`}></textarea>
              </div>

              {/* Custom Error Message */}
              {errorMsg && (
                <div className="flex items-center gap-2 bg-red-50 text-red-600 px-4 py-3 rounded-xl text-sm font-bold border border-red-200 animate-fade-in">
                  <span className="material-symbols-outlined text-[18px]">error</span>
                  {errorMsg}
                </div>
              )}

              {/* Custom Success Message */}
              {successMsg && (
                <div className="flex items-center gap-2 bg-green-50 text-green-700 px-4 py-3 rounded-xl text-sm font-bold border border-green-200 animate-fade-in">
                  <span className="material-symbols-outlined text-[18px]">check_circle</span>
                  {successMsg}
                </div>
              )}

            {/* Anti-Spam Puzzle */}
            <div className={`p-4 rounded-xl border ${isCaptchaSolved ? 'bg-green-50/50 border-green-200' : captchaError ? 'bg-red-50/50 border-red-200' : 'bg-surface-variant/20 border-outline-variant/30'} transition-colors`}>
              <div className="flex flex-col gap-2.5">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className={`text-xs md:text-sm font-bold ${isCaptchaSolved ? 'text-green-700' : captchaError ? 'text-red-600' : 'text-on-surface'}`}>
                      {isCaptchaSolved ? '✓ Keamanan Lolos' : captchaError ? '❌ Salah tebak!' : '🛡️ Verifikasi Keamanan'}
                    </h4>
                    {!isCaptchaSolved && (
                      <p className="text-xs text-on-surface-variant mt-0.5">
                        Buktikan Anda bukan robot, klik gambar <strong className="text-primary font-extrabold">{captchaTarget?.name}</strong>:
                      </p>
                    )}
                  </div>
                  {isCaptchaSolved && (
                    <span className="text-[11px] font-bold text-green-600 bg-green-100 px-2.5 py-0.5 rounded-full border border-green-200">Terverifikasi</span>
                  )}
                </div>
                
                {!isCaptchaSolved && (
                  <div className="grid grid-cols-5 gap-2 mt-1">
                    {captchaOptions.map((item, index) => (
                      <button
                        key={index}
                        type="button"
                        onClick={() => handleCaptchaClick(item)}
                        disabled={captchaError}
                        className={`text-2xl sm:text-3xl p-2.5 sm:p-3 rounded-xl border-2 flex items-center justify-center transition-all hover:-translate-y-0.5 hover:shadow-sm active:scale-95 ${captchaError ? 'opacity-50 cursor-not-allowed border-red-200 bg-red-50' : 'bg-surface border-outline-variant/30 hover:border-primary/50 hover:bg-primary/5'}`}
                      >
                        {item.emoji}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="mt-2 flex w-full justify-center rounded-xl bg-primary px-4 py-3.5 text-sm font-bold text-white shadow-soft transition-all hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-primary/50 disabled:opacity-50 disabled:cursor-not-allowed items-center gap-2 group cursor-pointer relative overflow-hidden"
            >
              {isLoading ? "Mengirim..." : "Kirim Pesan"}
              {!isLoading && <span className="material-symbols-outlined text-[18px] group-hover:translate-x-1 transition-transform">send</span>}
            </button>
              
              <p className="text-[10px] md:text-xs text-center text-on-surface-variant">
                Identitas pelapor (jika ada) akan dirahasiakan dan hanya digunakan untuk keperluan tindak lanjut internal BEM.
              </p>
            </form>
          </div>

        </div>
      </div>
    </section>
  );
}
