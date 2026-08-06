"use client";

import React, { useState } from "react";
import Link from "next/link";
import { FiAlertCircle, FiCheckCircle, FiClock, FiFileText, FiEdit2, FiTrash2, FiX, FiUsers, FiHeart, FiEye } from "react-icons/fi";
import { createClient } from "@/utils/supabase/client";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence, LayoutGroup } from "framer-motion";
import { useEffect } from "react";

const CATEGORY_MAP: Record<string, string> = {
  "Technology": "Aplikasi Web & Sistem",
  "Programming": "Aplikasi Mobile",
  "Research": "Karya Tulis & Jurnal",
  "IoT": "Proyek IoT",
  "Multimedia": "Desain & Lainnya"
};

const getCategoryLabel = (id: string) => CATEGORY_MAP[id] || id;

export default function DashboardKaryaList({ initialKaryaList }: { initialKaryaList: any[] }) {
  const supabase = createClient();
  const router = useRouter();
  const [karyaList, setKaryaList] = useState(initialKaryaList);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [deleteReason, setDeleteReason] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [rejectModalData, setRejectModalData] = useState<{
    id: string;
    title: string;
    message: string;
    type: 'upload' | 'edit' | 'deletion';
  } | null>(null);

  const [confirmDeleteData, setConfirmDeleteData] = useState<any | null>(null);
  const [activeTab, setActiveTab] = useState<"all" | "pending" | "approved" | "rejected">("all");
  const [activeCategory, setActiveCategory] = useState<string>("all");
  const [currentPage, setCurrentPage] = useState(1);
  const ITEMS_PER_PAGE = 6;

  // Reset page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [activeTab, activeCategory]);

  // Real-time listener
  useEffect(() => {
    const channel = supabase
      .channel('realtime_karya_dashboard')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'karya' }, (payload) => {
        console.log("Realtime Update Received:", payload);
        // Memaksa Next.js mengambil ulang data dari server secara otomatis
        router.refresh();
        // Karena karyaList menggunakan initialKaryaList sebagai state, 
        // kita juga butuh efek untuk mengupdate karyaList kalau initialKaryaList berubah.
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [supabase, router]);

  // Sync state with server-side props if router.refresh() updates them
  useEffect(() => {
    setKaryaList(initialKaryaList);
  }, [initialKaryaList]);

  const handleDelete = async (karya: any) => {
    if (karya.status === "pending" || karya.status === "rejected") {
      // Direct deletion without approval, open confirm modal first
      setConfirmDeleteData(karya);
    } else if (karya.status === "approved") {
      // Open deletion request modal
      setDeletingId(karya.id);
      setDeleteReason("");
    }
  };

  const confirmDirectDelete = async () => {
    if (!confirmDeleteData) return;
    setIsSubmitting(true);
    const { error } = await supabase.from('karya').delete().eq('id', confirmDeleteData.id);
    if (!error) {
      setKaryaList(prev => prev.filter(k => k.id !== confirmDeleteData.id));
      router.refresh();
      setConfirmDeleteData(null);
    } else {
      alert("Gagal menghapus karya.");
    }
    setIsSubmitting(false);
  };

  const hideDeletedKarya = async (id: string) => {
    setIsSubmitting(true);
    const { error } = await supabase.from('karya').delete().eq('id', id);
    if (!error) {
      setKaryaList(prev => prev.filter(k => k.id !== id));
      router.refresh();
    }
    setIsSubmitting(false);
  };

  const submitDeleteRequest = async () => {
    if (!deletingId || !deleteReason.trim()) return;
    setIsSubmitting(true);

    const { error } = await supabase.from('karya').update({
      status: 'deletion_pending',
      deletion_reason: deleteReason,
      deletion_reject_reason: null
    }).eq('id', deletingId);

    if (!error) {
      setKaryaList(prev => prev.map(k => k.id === deletingId ? { ...k, status: 'deletion_pending', deletion_reason: deleteReason, deletion_reject_reason: null } : k));
      setDeletingId(null);
      router.refresh();
    } else {
      alert("Gagal mengirim permintaan hapus.");
    }
    setIsSubmitting(false);
  };

  const dismissRejectReason = async (karyaId: string) => {
    const { error } = await supabase.from('karya').update({
      deletion_reject_reason: null
    }).eq('id', karyaId);

    setKaryaList(prev => prev.map(k => k.id === karyaId ? { ...k, deletion_reject_reason: null } : k));
    await supabase.from('karya').update({ deletion_reject_reason: null }).eq('id', karyaId);
  };

  const cancelPendingEdit = async (karyaId: string) => {
    setKaryaList(prev => prev.map(k => k.id === karyaId ? { ...k, edit_reject_reason: null, pending_edits: null } : k));
    await supabase.from('karya').update({ edit_reject_reason: null, pending_edits: null }).eq('id', karyaId);
  };

  if (!karyaList || karyaList.length === 0) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center py-16 bg-surface-variant/20 rounded-2xl border border-dashed border-outline-variant/50 relative overflow-hidden"
      >
        <motion.div
          animate={{ scale: [1, 1.1, 1] }}
          transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
          className="w-20 h-20 bg-[var(--color-primary)]/10 rounded-full flex items-center justify-center mx-auto mb-6 relative"
        >
          <div className="absolute inset-0 bg-[var(--color-primary)]/20 rounded-full animate-ping opacity-50" />
          <FiFileText size={32} className="text-[var(--color-primary)] relative z-10" />
        </motion.div>

        <h3 className="text-xl font-bold text-on-surface mb-3">Belum Ada Karya</h3>
        <p className="text-on-surface-variant mb-8 max-w-sm mx-auto text-sm leading-relaxed">
          Ruang pameranmu masih kosong nih. Yuk, bagikan inovasimu sekarang dan jadilah inspirasi!
        </p>
        <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
          <Link
            href="/dashboard/upload"
            className="inline-flex items-center gap-2 bg-[var(--color-primary)] text-white px-6 py-3 rounded-xl font-bold shadow-lg shadow-primary/30 transition-all hover:bg-primary/90"
          >
            Upload Karya Pertamamu
          </Link>
        </motion.div>
      </motion.div>
    );
  }

  const filteredList = karyaList.filter(karya => {
    // Status filter
    if (activeTab === "pending" && karya.status !== "pending" && karya.status !== "deletion_pending") return false;
    if (activeTab === "approved" && karya.status !== "approved") return false;
    if (activeTab === "rejected" && karya.status !== "rejected") return false;
    
    // Category filter
    if (activeCategory !== "all" && karya.category !== activeCategory) return false;
    
    return true;
  });

  const totalPages = Math.ceil(filteredList.length / ITEMS_PER_PAGE);
  const paginatedList = filteredList.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE);

  const counts = {
    all: karyaList.length,
    pending: karyaList.filter(k => k.status === "pending" || k.status === "deletion_pending").length,
    approved: karyaList.filter(k => k.status === "approved").length,
    rejected: karyaList.filter(k => k.status === "rejected").length,
  };

  const TABS = [
    { id: "all",      label: "Semua",  count: counts.all },
    { id: "pending",  label: "Proses", count: counts.pending },
    { id: "approved", label: "Publik", count: counts.approved },
    { id: "rejected", label: "Ditolak",count: counts.rejected },
  ];

  return (
    <>
      {/* ── Tabs & Filters ────────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row gap-4 mb-4 justify-between items-start sm:items-center w-full">
        <LayoutGroup>
          <div className="flex flex-wrap gap-2 pb-2 sm:pb-0 w-full">
            {TABS.map((tab) => (
              <motion.button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className={`relative px-4 py-2 rounded-full text-sm font-bold whitespace-nowrap transition-colors ${
                  activeTab === tab.id
                    ? "text-white"
                    : "bg-surface-variant/30 text-on-surface hover:bg-surface-variant/60"
                }`}
              >
                {/* Animated pill background */}
                {activeTab === tab.id && (
                  <motion.span
                    layoutId="active-tab-pill"
                    className="absolute inset-0 rounded-full bg-[var(--color-primary)] shadow-md shadow-primary/20"
                    transition={{ type: "spring", stiffness: 400, damping: 30 }}
                  />
                )}
                <span className="relative z-10">
                  {tab.label}{" "}
                  <span className="ml-1 opacity-80 font-medium">({tab.count})</span>
                </span>
              </motion.button>
            ))}
          </div>
        </LayoutGroup>

        <select
          value={activeCategory}
          onChange={(e) => setActiveCategory(e.target.value)}
          className="px-4 py-2 rounded-xl text-sm font-bold bg-surface-variant/30 border border-outline-variant/30 outline-none focus:ring-2 focus:ring-primary text-on-surface transition-shadow"
        >
          <option value="all">Semua Kategori</option>
          <option value="Technology">Aplikasi Web & Sistem</option>
          <option value="Programming">Aplikasi Mobile</option>
          <option value="Research">Karya Tulis & Jurnal</option>
          <option value="IoT">Proyek IoT</option>
          <option value="Multimedia">Desain & Lainnya</option>
        </select>
      </div>

      {/* ── Card List ─────────────────────────────────────────── */}
      <AnimatePresence mode="wait">
        <motion.div
          key={activeTab + activeCategory}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8 }}
          transition={{ duration: 0.2 }}
          className="grid grid-cols-1 xl:grid-cols-2 gap-4"
        >
          {filteredList.length === 0 ? (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="text-center py-10 bg-surface-variant/10 rounded-2xl border border-dashed border-outline-variant/30"
            >
              <p className="text-sm text-on-surface-variant font-medium">Tidak ada karya di kategori ini.</p>
            </motion.div>
          ) : (
            <AnimatePresence initial={false}>
              {paginatedList.map((karya, index) => (
                <motion.div
                  key={karya.id}
                  layout
                  initial={{ opacity: 0, y: 20, scale: 0.97 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, x: -30, scale: 0.95, transition: { duration: 0.22 } }}
                  transition={{
                    delay: index * 0.06,
                    duration: 0.38,
                    ease: [0.22, 1, 0.36, 1],
                  }}
                  whileHover={{ y: -4, scale: 1.005 }}
                  whileTap={{ scale: 0.995 }}
                  className="flex flex-col p-5 rounded-2xl border border-outline-variant/30 bg-surface shadow-sm hover:shadow-md hover:border-outline-variant/60 transition-colors gap-4"
                >
                  {/* TOP: Thumbnail & Info */}
                  <div className="flex gap-4 items-start">
                    {/* Thumbnail */}
                    <div className="shrink-0">
                      {karya.image_url ? (
                        <motion.img
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          transition={{ delay: index * 0.06 + 0.1 }}
                          src={karya.image_url}
                          alt={karya.title}
                          className="w-20 h-20 sm:w-28 sm:h-24 object-cover rounded-xl border border-outline-variant/20"
                        />
                      ) : (
                        <div className="w-20 h-20 sm:w-28 sm:h-24 rounded-xl bg-surface-variant/40 border border-outline-variant/20 flex items-center justify-center text-on-surface-variant/40">
                          <FiFileText size={28} />
                        </div>
                      )}
                    </div>

                    <div className="flex-1 min-w-0 flex flex-col">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-[10px] font-bold px-2 py-1 rounded-md bg-surface-variant text-on-surface-variant uppercase tracking-wider shrink-0">
                          {getCategoryLabel(karya.category)}
                        </span>
                      </div>
                      <h3 className="font-bold text-lg text-on-surface line-clamp-2 break-words">{karya.title}</h3>
                      <p className="text-sm text-on-surface-variant line-clamp-3 mt-1 break-words">
                        {karya.description}
                      </p>
                    </div>
                  </div>

                  {/* MIDDLE: Stats & Status Badges */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2 border-t border-outline-variant/10">
                    <div className="flex flex-col gap-1.5">
                      <span className="text-[11px] font-medium text-on-surface-variant/70">
                        Diunggah: {new Date(karya.created_at).toLocaleDateString('id-ID')}
                      </span>
                      {karya.status === 'approved' && (
                        <div className="flex items-center gap-2">
                          <span className="flex items-center gap-1.5 text-on-surface bg-surface-variant/30 px-2 py-1 rounded-md text-[11px] font-medium">
                            <FiUsers size={10} className="text-[var(--color-primary)]" />
                            {karya.views || 0} Dilihat
                          </span>
                          <span className="flex items-center gap-1.5 text-on-surface bg-surface-variant/30 px-2 py-1 rounded-md text-[11px] font-medium">
                            <FiHeart size={10} className="text-red-500" />
                            {karya.likes || 0} Disukai
                          </span>
                        </div>
                      )}
                      {karya.status === 'rejected' && (
                        <p className="text-[11px] font-medium text-red-500/90 flex items-center gap-1.5">
                          💡 <strong>Jangan menyerah!</strong> Perbaiki & ajukan ulang.
                        </p>
                      )}
                    </div>

                    <div className="shrink-0 flex flex-col gap-1.5">
                      {/* Status Badges */}
                      {karya.status === 'pending' && (
                        <div className="flex items-center gap-1.5 px-3 py-1 rounded-lg bg-amber-50 text-amber-600 font-semibold text-xs border border-amber-100 w-fit">
                          <FiClock size={14} className="animate-spin" style={{ animationDuration: '3s' }} />
                          Menunggu Review
                        </div>
                      )}
                      {karya.status === 'approved' && (
                        <div className="flex flex-col gap-1.5 w-fit items-end">
                          <div className="flex items-center gap-1.5 px-3 py-1 rounded-lg bg-green-50 text-green-600 font-semibold text-xs border border-green-100">
                            <FiCheckCircle size={14} /> Disetujui (Publik)
                          </div>
                          {karya.pending_edits && !karya.edit_reject_reason && (
                            <div className="flex items-center gap-1.5 px-3 py-1 rounded-lg bg-amber-50 text-amber-600 font-semibold text-xs border border-amber-100 w-fit">
                              <FiClock size={14} /> Edit Menunggu Review
                            </div>
                          )}
                          {karya.edit_reject_reason && (
                            <button
                              onClick={() => setRejectModalData({ id: karya.id, title: "Usulan Edit Ditolak", message: karya.edit_reject_reason, type: 'edit' })}
                              className="flex items-center gap-1.5 px-3 py-1 rounded-lg bg-red-50 hover:bg-red-100 text-red-600 font-semibold text-xs border border-red-100 w-fit transition-colors"
                            >
                              <FiAlertCircle size={14} /> Edit Ditolak
                            </button>
                          )}
                          {karya.deletion_reject_reason && (
                            <button
                              onClick={() => setRejectModalData({ id: karya.id, title: "Permintaan Hapus Ditolak", message: karya.deletion_reject_reason, type: 'deletion' })}
                              className="flex items-center gap-1.5 px-3 py-1 rounded-lg bg-orange-50 hover:bg-orange-100 text-orange-600 font-semibold text-xs border border-orange-100 w-fit transition-colors"
                            >
                              <FiAlertCircle size={14} /> Hapus Ditolak
                            </button>
                          )}
                        </div>
                      )}
                      {karya.status === 'rejected' && (
                        <div className="flex flex-col gap-1.5 w-fit items-end">
                          <div className="flex items-center gap-1.5 px-3 py-1 rounded-lg bg-red-50 text-red-600 font-semibold text-xs border border-red-100 w-fit">
                            <FiAlertCircle size={14} /> Pengajuan Ditolak
                          </div>
                          {karya.reject_reason && (
                            <button
                              onClick={() => setRejectModalData({ id: karya.id, title: "Karya Ditolak", message: karya.reject_reason, type: 'upload' })}
                              className="flex items-center justify-center gap-1.5 px-3 py-1 rounded-lg bg-red-50 hover:bg-red-100 text-red-600 font-semibold text-xs border border-red-100 w-full transition-colors"
                            >
                              Lihat Catatan
                            </button>
                          )}
                        </div>
                      )}
                      {karya.status === 'deletion_pending' && (
                        <div className="flex items-center gap-1.5 px-3 py-1 rounded-lg bg-purple-50 text-purple-600 font-semibold text-xs border border-purple-100 w-fit">
                          <FiClock size={14} /> Menunggu Hapus
                        </div>
                      )}
                      {karya.status === 'deleted' && (
                        <div className="flex items-center gap-1.5 px-3 py-1 rounded-lg bg-gray-100 text-gray-700 font-semibold text-xs border border-gray-300 w-fit shadow-sm">
                          <FiTrash2 size={14} /> Dihapus Admin
                        </div>
                      )}
                    </div>
                  </div>

                  {/* BOTTOM: Action buttons */}
                  <div className="flex flex-col sm:flex-row gap-2 w-full pt-1">
                    {karya.status !== 'deleted' && (
                      <div className="relative w-full sm:flex-1">
                        <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} className="w-full">
                          <Link
                            href={`/karya/${karya.id}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="w-full flex items-center justify-center gap-1.5 px-3 py-2.5 sm:py-2 rounded-xl bg-[var(--color-primary)]/10 text-[var(--color-primary)] font-semibold text-sm border border-[var(--color-primary)]/20 hover:bg-[var(--color-primary)] hover:text-white transition-colors"
                          >
                            <FiEye size={14} /> Lihat Halaman
                          </Link>
                        </motion.div>
                      </div>
                    )}

                    <div className="flex gap-2 w-full sm:flex-[2]">
                      {karya.status !== 'deletion_pending' && karya.status !== 'deleted' && (
                        <div className="relative flex-1">
                          <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} className="w-full">
                            <Link
                              href={`/dashboard/edit/${karya.id}`}
                              className="w-full flex items-center justify-center gap-1.5 px-3 py-2.5 sm:py-2 rounded-xl bg-surface-variant/50 text-on-surface-variant font-semibold text-sm border border-outline-variant/30 hover:bg-[var(--color-primary)] hover:text-white hover:border-[var(--color-primary)] transition-colors"
                            >
                              <FiEdit2 size={14} /> Edit
                            </Link>
                          </motion.div>
                        </div>
                      )}

                      {karya.status === 'deleted' ? (
                        <div className="relative flex-1">
                          <motion.button
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={() => hideDeletedKarya(karya.id)}
                            disabled={isSubmitting}
                            className="w-full flex items-center justify-center gap-1.5 px-3 py-2.5 sm:py-2 rounded-xl bg-surface-variant/50 text-on-surface-variant font-semibold text-sm border border-outline-variant/30 hover:bg-gray-700 hover:text-white hover:border-gray-700 transition-colors disabled:opacity-50"
                          >
                            <FiX size={14} /> Tutup
                          </motion.button>
                        </div>
                      ) : (
                        <div className="relative flex-1">
                          <motion.button
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={() => handleDelete(karya)}
                            disabled={karya.status === 'deletion_pending'}
                            className="w-full flex items-center justify-center gap-1.5 px-3 py-2.5 sm:py-2 rounded-xl bg-surface-variant/50 text-on-surface-variant font-semibold text-sm border border-outline-variant/30 hover:bg-red-500 hover:text-white hover:border-red-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            <FiTrash2 size={14} /> Hapus
                          </motion.button>
                        </div>
                      )}
                    </div>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          )}
        </motion.div>
      </AnimatePresence>

      {/* ── Standard Pagination ── */}
      {totalPages > 1 && (
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="flex items-center justify-center gap-4 mt-8 mb-4"
        >
          <button
            onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
            disabled={currentPage === 1}
            className="px-4 py-2 rounded-xl bg-surface-variant/30 text-on-surface-variant font-bold text-sm hover:bg-surface-variant/60 transition-colors border border-outline-variant/30 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Sebelumnya
          </button>
          
          <span className="text-sm font-bold text-on-surface-variant">
            Halaman {currentPage} dari {totalPages}
          </span>
          
          <button
            onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
            disabled={currentPage === totalPages}
            className="px-4 py-2 rounded-xl bg-surface-variant/30 text-on-surface-variant font-bold text-sm hover:bg-[var(--color-primary)] hover:text-white transition-colors border border-outline-variant/30 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Selanjutnya
          </button>
        </motion.div>
      )}

      {/* Rejection Modal */}
      <AnimatePresence>
        {rejectModalData && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm px-4"
          >
            <motion.div
              initial={{ scale: 0.95, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, y: 20 }}
              className="bg-surface rounded-2xl p-6 max-w-sm w-full shadow-2xl border border-outline-variant/30 flex flex-col items-center text-center"
            >
              <div className="w-14 h-14 rounded-full bg-red-500/10 text-red-500 flex items-center justify-center mb-4">
                <FiAlertCircle size={24} />
              </div>
              <h3 className="text-xl font-bold text-on-surface mb-2">{rejectModalData.title}</h3>
              <p className="text-on-surface-variant text-sm mb-6 bg-surface-variant/30 p-3 rounded-xl border border-outline-variant/30 w-full text-left">
                {rejectModalData.message}
              </p>

              <div className="flex gap-3 w-full">
                {rejectModalData.type === 'edit' && (
                  <>
                    <button
                      onClick={() => setRejectModalData(null)}
                      className="flex-1 py-2.5 px-4 rounded-xl font-bold text-on-surface-variant bg-surface-variant hover:bg-outline-variant/30 transition-colors shadow-sm"
                    >
                      Tutup
                    </button>
                    <button
                      onClick={() => {
                        cancelPendingEdit(rejectModalData.id);
                        setRejectModalData(null);
                      }}
                      className="flex-1 py-2.5 px-4 rounded-xl font-bold text-white bg-red-500 hover:bg-red-600 transition-colors shadow-sm"
                    >
                      Batalkan & Hapus Draft
                    </button>
                  </>
                )}
                {rejectModalData.type === 'deletion' && (
                  <button
                    onClick={() => {
                      dismissRejectReason(rejectModalData.id);
                      setRejectModalData(null);
                    }}
                    className="flex-1 py-2.5 px-4 rounded-xl font-bold text-white bg-[var(--color-primary)] hover:opacity-90 transition-colors shadow-sm"
                  >
                    Tutup & Mengerti
                  </button>
                )}
                {rejectModalData.type === 'upload' && (
                  <button
                    onClick={() => setRejectModalData(null)}
                    className="flex-1 py-2.5 px-4 rounded-xl font-bold text-white bg-[var(--color-primary)] hover:opacity-90 transition-colors shadow-sm"
                  >
                    Tutup
                  </button>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Deletion Request Modal */}
      <AnimatePresence>
        {deletingId && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm px-4"
          >
            <motion.div
              initial={{ scale: 0.95, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, y: 20 }}
              className="bg-surface rounded-2xl w-full max-w-md overflow-hidden shadow-2xl border border-outline-variant/30"
            >
              <div className="p-6 border-b border-outline-variant/20">
                <h3 className="text-xl font-bold text-on-surface">Ajukan Penghapusan</h3>
                <p className="text-sm text-on-surface-variant mt-2 leading-relaxed">
                  Karya yang sudah dipublikasi memerlukan persetujuan BEM untuk dihapus.
                  Mohon sertakan alasan yang jelas.
                </p>
              </div>
              <div className="p-6">
                <textarea
                  value={deleteReason}
                  onChange={(e) => setDeleteReason(e.target.value)}
                  placeholder="Contoh: Terdapat bug kritikal pada aplikasi, atau ingin mengganti dengan versi baru..."
                  className="w-full min-h-[120px] p-4 bg-surface-variant/20 border border-outline-variant/40 rounded-xl focus:outline-none focus:border-red-400 focus:ring-2 focus:ring-red-400/20 resize-none text-sm transition-all"
                  disabled={isSubmitting}
                />
              </div>
              <div className="px-6 py-4 bg-surface-variant/10 border-t border-outline-variant/20 flex gap-3 justify-end">
                <button
                  onClick={() => { setDeletingId(null); setDeleteReason(""); }}
                  disabled={isSubmitting}
                  className="px-4 py-2 text-sm font-medium text-on-surface-variant hover:bg-surface-variant/50 rounded-lg transition-colors"
                >
                  Batal
                </button>
                <button
                  onClick={submitDeleteRequest}
                  disabled={!deleteReason.trim() || isSubmitting}
                  className="px-6 py-2 bg-red-500 hover:bg-red-600 text-white text-sm font-medium rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 shadow-lg shadow-red-500/20"
                >
                  {isSubmitting ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      Memproses...
                    </>
                  ) : 'Ajukan Hapus'}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Confirm Direct Delete Modal */}
      <AnimatePresence>
        {confirmDeleteData && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm px-4"
          >
            <motion.div
              initial={{ scale: 0.95, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, y: 20 }}
              className="bg-surface rounded-2xl w-full max-w-sm overflow-hidden shadow-2xl border border-outline-variant/30 p-6 flex flex-col items-center text-center"
            >
              <div className="w-14 h-14 rounded-full bg-red-500/10 text-red-500 flex items-center justify-center mb-4">
                <FiTrash2 size={24} />
              </div>
              <h3 className="text-xl font-bold text-on-surface mb-2">Hapus Karya?</h3>
              <p className="text-sm text-on-surface-variant mb-6 leading-relaxed">
                Apakah Anda yakin ingin menghapus karya <strong>{confirmDeleteData.title}</strong> secara permanen? Tindakan ini tidak dapat dibatalkan.
              </p>
              <div className="flex gap-3 w-full">
                <button
                  onClick={() => setConfirmDeleteData(null)}
                  disabled={isSubmitting}
                  className="flex-1 py-2.5 px-4 text-sm font-medium text-on-surface-variant bg-surface-variant/30 hover:bg-surface-variant/50 border border-outline-variant/30 rounded-xl transition-colors"
                >
                  Batal
                </button>
                <button
                  onClick={confirmDirectDelete}
                  disabled={isSubmitting}
                  className="flex-1 py-2.5 px-4 bg-red-500 hover:bg-red-600 text-white text-sm font-medium rounded-xl transition-colors shadow-lg shadow-red-500/20 flex items-center justify-center gap-2"
                >
                  {isSubmitting ? (
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : 'Ya, Hapus'}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
