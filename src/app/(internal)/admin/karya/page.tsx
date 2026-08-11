"use client";

import React, { useEffect, useState } from "react";
import { createClient } from "@/utils/supabase/client";
import { FiCheck, FiX, FiEye, FiTrash2, FiFileText, FiAlertCircle } from "react-icons/fi";
import { motion, AnimatePresence } from "framer-motion";
import { useToast } from "@/components/ui/Toast";
import { TECH_STACKS } from "@/lib/techStack";
import { KTI_TOOLS } from "@/lib/ktiTools";
import { IOT_COMPONENTS } from "@/lib/iotComponents";

const getBadgeDef = (label: string) => {
  return (
    TECH_STACKS.find((t) => t.label === label) ||
    KTI_TOOLS.find((t) => t.label === label) ||
    IOT_COMPONENTS.find((t) => t.label === label)
  );
};

const CATEGORY_MAP: Record<string, string> = {
  "Technology": "Aplikasi Web & Sistem",
  "Programming": "Aplikasi Mobile",
  "Research": "Karya Tulis & Jurnal",
  "IoT": "Proyek IoT",
  "Multimedia": "Desain & Lainnya"
};

const getCategoryLabel = (id: string) => CATEGORY_MAP[id] || id;

export default function KaryaApprovalPage() {
  const supabase = createClient();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState<'persetujuan' | 'data'>('persetujuan');

  const [karyaList, setKaryaList] = useState<any[]>([]);
  const [approvedList, setApprovedList] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Reject modal state for both new uploads, deletion requests, and edit requests
  const [rejectingId, setRejectingId] = useState<string | null>(null);
  const [rejectReason, setRejectReason] = useState("");
  const [rejectType, setRejectType] = useState<'upload' | 'deletion' | 'edit' | null>(null);

  // Confirm modal state
  const [confirmingId, setConfirmingId] = useState<string | null>(null);
  const [confirmingAction, setConfirmingAction] = useState<'upload' | 'deletion' | 'edit' | null>(null);
  
  const [viewReasonData, setViewReasonData] = useState<string | null>(null);

  // Preview modal state
  const [previewingKarya, setPreviewingKarya] = useState<any | null>(null);

  const fetchPersetujuan = async () => {
    const { data: karyaData, error: karyaError } = await supabase
      .from('karya')
      .select('*')
      .or('status.in.(pending,deletion_pending),pending_edits.not.is.null')
      .order('created_at', { ascending: false });

    if (!karyaError && karyaData) {
      // Filter out rejected edits so they disappear from Persetujuan tab
      const validPendingData = karyaData.filter(k => 
        k.status === 'pending' || 
        k.status === 'deletion_pending' || 
        (k.pending_edits !== null && k.edit_reject_reason === null)
      );

      // Fix corrupted states in background: if it has pending_edits but status is 'pending' or 'rejected', it should be 'approved'
      const corruptedItems = karyaData.filter(k => k.pending_edits !== null && k.status !== 'approved' && k.status !== 'pending');
      if (corruptedItems.length > 0) {
        corruptedItems.forEach(async (item) => {
          await supabase.from('karya').update({ status: 'approved' }).eq('id', item.id);
        });
      }

      const userIds = [...new Set(validPendingData.map(k => k.user_id).filter(Boolean))];
      let profilesMap: Record<string, string> = {};
      if (userIds.length > 0) {
        const { data: profilesData, error: profError } = await supabase.from('profiles').select('id, full_name').in('id', userIds);
        if (profError) console.error("Error fetching profiles:", profError);
        if (profilesData) profilesData.forEach(p => profilesMap[p.id] = p.full_name);
      }
      setKaryaList(validPendingData.map(item => ({ ...item, profiles: { full_name: profilesMap[item.user_id] || 'Unknown User' } })));
    } else {
      setKaryaList([]);
    }
  };

  const fetchDataKarya = async () => {
    const { data: karyaData, error: karyaError } = await supabase
      .from('karya')
      .select('*')
      .in('status', ['approved', 'deletion_pending'])
      .order('created_at', { ascending: false });

    if (!karyaError && karyaData) {
      const userIds = [...new Set(karyaData.map(k => k.user_id).filter(Boolean))];
      let profilesMap: Record<string, string> = {};
      if (userIds.length > 0) {
        const { data: profilesData, error: profError } = await supabase.from('profiles').select('id, full_name').in('id', userIds);
        if (profError) console.error("Error fetching profiles:", profError);
        if (profilesData) profilesData.forEach(p => profilesMap[p.id] = p.full_name);
      }
      setApprovedList(karyaData.map(item => ({ ...item, profiles: { full_name: profilesMap[item.user_id] || 'Unknown User' } })));
    } else {
      setApprovedList([]);
    }
  };

  const fetchAllData = async () => {
    setLoading(true);
    await Promise.all([fetchPersetujuan(), fetchDataKarya()]);
    setLoading(false);
  };

  useEffect(() => {
    fetchAllData();

    // Listen for real-time changes
    const channel = supabase
      .channel('realtime_admin_karya')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'karya' }, () => {
        fetchPersetujuan();
        fetchDataKarya();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const handleConfirmAction = async () => {
    if (!confirmingId || !confirmingAction) return;

    try {
      if (confirmingAction === 'upload') {
        const { error } = await supabase.from('karya').update({ status: 'approved' }).eq('id', confirmingId);
        if (error) throw error;
        toast("Karya berhasil disetujui untuk dipublikasi!", "success");
      } else if (confirmingAction === 'deletion') {
        const { error } = await supabase.from('karya').update({ 
          status: 'deleted',
          deletion_reason: null,
          deletion_reject_reason: null
        }).eq('id', confirmingId);
        if (error) throw error;
        toast("Karya berhasil dihapus secara permanen!", "success");
      } else if (confirmingAction === 'edit') {
        const { data } = await supabase.from('karya').select('pending_edits').eq('id', confirmingId).single();
        if (data && data.pending_edits) {
          const { error } = await supabase.from('karya').update({
            ...data.pending_edits,
            pending_edits: null,
            edit_reject_reason: null
          }).eq('id', confirmingId);
          if (error) throw error;
          toast("Edit karya berhasil disetujui dan diperbarui ke publik!", "success");
        }
      }
    } catch (e: any) {
      toast(e.message || "Terjadi kesalahan sistem.", "error");
    } finally {
      setConfirmingId(null);
      setConfirmingAction(null);
      fetchPersetujuan();
    }
  };

  const handleReject = async () => {
    if (!rejectingId || !rejectReason.trim() || !rejectType) return;

    try {
      if (rejectType === 'upload') {
        const { error } = await supabase.from('karya').update({ status: 'rejected', reject_reason: rejectReason }).eq('id', rejectingId);
        if (error) throw error;
        toast("Pengajuan karya berhasil ditolak.", "success");
      } else if (rejectType === 'deletion') {
        const { error } = await supabase.from('karya').update({ status: 'approved', deletion_reject_reason: rejectReason, deletion_reason: null }).eq('id', rejectingId);
        if (error) throw error;
        toast("Permintaan hapus karya berhasil ditolak.", "success");
      } else if (rejectType === 'edit') {
        const { error } = await supabase.from('karya').update({ edit_reject_reason: rejectReason }).eq('id', rejectingId);
        if (error) throw error;
        toast("Usulan edit karya berhasil ditolak.", "success");
      }
    } catch (e: any) {
      toast(e.message || "Terjadi kesalahan sistem.", "error");
    } finally {
      setRejectingId(null);
      setRejectReason("");
      setRejectType(null);
      fetchPersetujuan();
    }
  };

  const openRejectModal = (id: string, type: 'upload' | 'deletion' | 'edit') => {
    setRejectingId(id);
    setRejectType(type);
    setRejectReason("");
  };

  // Hitung jumlah pengajuan yang perlu di-review
  const pendingCount = karyaList.filter(k => 
    k.status === 'pending' || 
    k.status === 'deletion_pending' || 
    (k.pending_edits !== null && k.edit_reject_reason === null)
  ).length;

  return (
    <div>
      <div className="mb-8 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-on-surface">Kelola Karya</h2>
          <p className="text-on-surface-variant">Manajemen pengajuan dan data karya inovasi mahasiswa.</p>
        </div>

        {/* Tabs */}
        <div className="flex bg-surface-variant/30 p-1 rounded-xl w-fit border border-outline-variant/30">
          <button
            onClick={() => {
              if (activeTab !== 'persetujuan') {
                setActiveTab('persetujuan');
              }
            }}
            className={`px-5 py-2.5 rounded-lg text-sm font-bold transition-all flex items-center gap-2 ${activeTab === 'persetujuan' ? 'bg-white text-[var(--color-primary)] shadow-sm' : 'text-on-surface-variant hover:text-on-surface'}`}
          >
            Persetujuan
            <span className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full shadow-sm ${pendingCount > 0 ? 'bg-red-500 text-white' : 'bg-surface-variant/50 text-on-surface-variant'}`}>
              {pendingCount}
            </span>
          </button>
          <button
            onClick={() => {
              if (activeTab !== 'data') {
                setActiveTab('data');
              }
            }}
            className={`px-5 py-2.5 rounded-lg text-sm font-bold transition-all flex items-center gap-2 ${activeTab === 'data' ? 'bg-white text-[var(--color-primary)] shadow-sm' : 'text-on-surface-variant hover:text-on-surface'}`}
          >
            Data Karya
            <span className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full shadow-sm ${approvedList.length > 0 ? 'bg-[var(--color-primary)] text-white' : 'bg-surface-variant/50 text-on-surface-variant'}`}>
              {approvedList.length}
            </span>
          </button>
        </div>
      </div>

      <div className="bg-surface rounded-2xl border border-outline-variant/20 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[800px]">
            <thead>
              <tr className="bg-surface-variant/20 text-on-surface-variant text-sm border-b border-outline-variant/20">
                <th className="py-4 px-6 font-medium">Judul & Info</th>
                <th className="py-4 px-6 font-medium">Pengunggah</th>
                {activeTab === 'persetujuan' && <th className="py-4 px-6 font-medium">Status / Jenis</th>}
                {activeTab === 'data' && <th className="py-4 px-6 font-medium">Tanggal Publikasi</th>}
                <th className="py-4 px-6 font-medium text-right">Aksi</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={5} className="py-10 text-center text-on-surface-variant/70">Memuat data...</td>
                </tr>
              ) : activeTab === 'persetujuan' ? (
                karyaList.length === 0 ? (
                  <tr key="empty-persetujuan">
                    <td colSpan={5} className="py-10 text-center text-on-surface-variant/70">Tidak ada pengajuan yang menunggu persetujuan.</td>
                  </tr>
                ) : (
                  karyaList.map((item) => (
                    <tr key={item.id} className="border-b border-gray-50 hover:bg-surface-variant/20/50 transition-colors">
                      <td className="py-4 px-6">
                        <div className="flex items-center gap-3">
                          <div className="shrink-0 w-12 h-12 bg-surface-variant/30 rounded-lg overflow-hidden border border-outline-variant/20 flex items-center justify-center">
                            {item.image_url ? (
                              <img src={item.image_url} alt={item.title} className="w-full h-full object-cover" />
                            ) : (
                              <FiFileText className="text-on-surface-variant/50" size={20} />
                            )}
                          </div>
                          <div>
                            <div className="font-bold text-on-surface line-clamp-1">{item.title}</div>
                            <div className="text-xs text-on-surface-variant line-clamp-1">{item.description}</div>
                          </div>
                        </div>
                      </td>
                      <td className="py-4 px-6 text-sm text-on-surface-variant font-medium">
                        {item.profiles?.full_name || 'Unknown User'}
                      </td>
                      <td className="py-4 px-6">
                        {item.pending_edits ? (
                          <span className="bg-amber-50 text-amber-600 px-2.5 py-1 rounded-md text-[10px] font-extrabold uppercase tracking-widest border border-amber-100 inline-block text-center">Edit Data</span>
                        ) : item.status === 'pending' || item.status === 'rejected' ? (
                          <span className="bg-blue-50 text-blue-600 px-2.5 py-1 rounded-md text-[10px] font-extrabold uppercase tracking-widest border border-blue-100 inline-block text-center">Upload Baru</span>
                        ) : (
                          <div className="flex flex-col gap-1.5 w-max">
                            <span className="bg-orange-50 text-orange-600 px-2.5 py-1 rounded-md text-[10px] font-extrabold uppercase tracking-widest border border-orange-100 text-center w-full">Permintaan Hapus</span>
                            <button 
                              onClick={() => setViewReasonData(item.deletion_reason || "Tidak ada alasan.")}
                              className="text-[10px] bg-orange-50 text-orange-700 hover:bg-orange-100 border border-orange-100 px-2 py-1 rounded-md transition-colors w-full font-semibold flex items-center justify-center gap-1"
                            >
                              <FiEye size={10} /> Lihat Alasan
                            </button>
                          </div>
                        )}
                      </td>
                      <td className="py-4 px-6">
                        <div className="flex justify-end gap-2">
                          <button
                            onClick={() => setPreviewingKarya(item.pending_edits ? { ...item, ...item.pending_edits, is_edit_preview: true } : item)}
                            className="px-3 py-1.5 bg-surface-variant/50 text-on-surface-variant hover:text-[var(--color-primary)] rounded-lg hover:bg-surface-variant transition-colors flex items-center gap-1 text-sm font-medium border border-outline-variant/30"
                          >
                            <FiEye /> Preview
                          </button>

                          {item.pending_edits ? (
                            <>
                              <button
                                onClick={() => { setConfirmingId(item.id); setConfirmingAction('edit'); }}
                                className="px-3 py-1.5 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors flex items-center gap-1 text-sm font-medium"
                              >
                                <FiCheck /> Terima Edit
                              </button>
                              <button
                                onClick={() => openRejectModal(item.id, 'edit')}
                                className="px-3 py-1.5 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors flex items-center gap-1 text-sm font-medium"
                              >
                                <FiX /> Tolak
                              </button>
                            </>
                          ) : item.status === 'pending' ? (
                            <>
                              <button
                                onClick={() => { setConfirmingId(item.id); setConfirmingAction('upload'); }}
                                className="px-3 py-1.5 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors flex items-center gap-1 text-sm font-medium"
                              >
                                <FiCheck /> Terima
                              </button>
                              <button
                                onClick={() => openRejectModal(item.id, 'upload')}
                                className="px-3 py-1.5 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors flex items-center gap-1 text-sm font-medium"
                              >
                                <FiX /> Tolak
                              </button>
                            </>
                          ) : (
                            <>
                              <button
                                onClick={() => { setConfirmingId(item.id); setConfirmingAction('deletion'); }}
                                className="px-3 py-1.5 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors flex items-center gap-1 text-sm font-medium"
                                title="Hapus Permanen"
                              >
                                <FiTrash2 /> Setujui Hapus
                              </button>
                              <button
                                onClick={() => openRejectModal(item.id, 'deletion')}
                                className="px-3 py-1.5 bg-surface-variant/50 text-on-surface-variant hover:text-red-500 rounded-lg hover:bg-red-50 transition-colors flex items-center gap-1 text-sm font-medium border border-outline-variant/30"
                                title="Tolak dan Kembalikan ke Publik"
                              >
                                <FiX /> Tolak Hapus
                              </button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))
                )
              ) : (
                approvedList.length === 0 ? (
                  <tr key="empty-data">
                    <td colSpan={4} className="py-10 text-center text-on-surface-variant/70">Tidak ada data karya mahasiswa.</td>
                  </tr>
                ) : (
                  approvedList.map((item) => (
                    <tr key={item.id} className="border-b border-gray-50 hover:bg-surface-variant/20/50 transition-colors">
                      <td className="py-4 px-6">
                        <div className="flex items-center gap-3">
                          <div className="shrink-0 w-12 h-12 bg-surface-variant/30 rounded-lg overflow-hidden border border-outline-variant/20 flex items-center justify-center">
                            {item.image_url ? (
                              <img src={item.image_url} alt={item.title} className="w-full h-full object-cover" />
                            ) : (
                              <FiFileText className="text-on-surface-variant/50" size={20} />
                            )}
                          </div>
                          <div>
                            <div className="font-bold text-on-surface line-clamp-1 flex items-center gap-2">
                              {item.title}
                              <span className="bg-surface-variant/50 text-on-surface-variant px-2 py-0.5 rounded-md text-[9px] font-bold uppercase tracking-wider border border-outline-variant/30">
                                {getCategoryLabel(item.category)}
                              </span>
                              {item.status === 'deletion_pending' && (
                                <span className="bg-orange-50 text-orange-600 px-2 py-0.5 rounded-md text-[9px] font-bold uppercase tracking-wider border border-orange-100">
                                  Menunggu Hapus
                                </span>
                              )}
                              {item.pending_edits && (
                                <span className="bg-amber-50 text-amber-600 px-2 py-0.5 rounded-md text-[9px] font-bold uppercase tracking-wider border border-amber-100">
                                  Ada Usulan Edit
                                </span>
                              )}
                            </div>
                            <div className="text-xs text-on-surface-variant line-clamp-1">{item.description}</div>
                          </div>
                        </div>
                      </td>
                      <td className="py-4 px-6 text-sm text-on-surface-variant font-medium">
                        {item.profiles?.full_name || 'Unknown User'}
                      </td>
                      <td className="py-4 px-6 text-sm text-on-surface-variant">
                        {new Date(item.created_at).toLocaleDateString('id-ID')}
                      </td>
                      <td className="py-4 px-6">
                        <div className="flex justify-end gap-2">
                          <button
                            onClick={() => setPreviewingKarya(item)}
                            className="px-3 py-1.5 bg-surface-variant/50 text-on-surface-variant hover:text-[var(--color-primary)] rounded-lg hover:bg-surface-variant transition-colors flex items-center gap-1 text-sm font-medium border border-outline-variant/30"
                          >
                            <FiEye /> Detail
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Reject Modal */}
      {rejectingId && rejectType && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-surface rounded-2xl shadow-xl w-full max-w-md overflow-hidden">
            <div className="px-6 py-5 border-b border-outline-variant/20">
              <h3 className="text-lg font-bold text-on-surface">
                {rejectType === 'upload' ? 'Tolak Pengajuan Karya' : rejectType === 'edit' ? 'Tolak Usulan Edit' : 'Tolak Permintaan Hapus'}
              </h3>
              <p className="text-sm text-on-surface-variant mt-1">
                {rejectType === 'upload'
                  ? 'Berikan alasan penolakan agar pengunggah bisa memperbaiki karyanya.'
                  : rejectType === 'edit'
                    ? 'Berikan alasan menolak usulan edit ini.'
                    : 'Berikan alasan mengapa karya ini tidak boleh dihapus dari publik.'}
              </p>
            </div>
            <div className="p-6">
              <textarea
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                placeholder="Tuliskan alasan penolakan di sini..."
                className="w-full p-3 bg-surface-variant/20 border border-outline-variant/30 rounded-xl focus:outline-none focus:border-red-400 focus:ring-2 focus:ring-red-400/20 resize-none min-h-[100px] text-sm"
              />
            </div>
            <div className="px-6 py-4 bg-surface-variant/20 border-t border-outline-variant/20 flex justify-end gap-3">
              <button
                onClick={() => { setRejectingId(null); setRejectReason(""); setRejectType(null); }}
                className="px-4 py-2 text-sm font-medium text-on-surface-variant hover:text-on-surface hover:bg-surface-variant/30 rounded-lg transition-colors"
              >
                Batal
              </button>
              <button
                onClick={handleReject}
                disabled={!rejectReason.trim()}
                className="px-4 py-2 text-sm font-medium bg-red-500 text-white rounded-lg hover:bg-red-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                Kirim Penolakan
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Confirm Modal */}
      {confirmingId && confirmingAction && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-surface rounded-2xl shadow-xl w-full max-w-md overflow-hidden">
            <div className="px-6 py-5 border-b border-outline-variant/20">
              <h3 className="text-lg font-bold text-on-surface">
                {confirmingAction === 'upload' ? 'Setujui Karya' : confirmingAction === 'edit' ? 'Setujui Usulan Edit' : 'Setujui Penghapusan'}
              </h3>
              <p className="text-sm text-on-surface-variant mt-1">
                {confirmingAction === 'upload'
                  ? 'Yakin ingin menyetujui karya ini untuk dipublikasi?'
                  : confirmingAction === 'edit'
                    ? 'Yakin ingin menyetujui usulan perubahan data karya ini?'
                    : 'Yakin ingin menyetujui penghapusan karya ini secara permanen?'}
              </p>
            </div>
            <div className="px-6 py-4 bg-surface-variant/20 border-t border-outline-variant/20 flex justify-end gap-3">
              <button
                onClick={() => { setConfirmingId(null); setConfirmingAction(null); }}
                className="px-4 py-2 text-sm font-medium text-on-surface-variant hover:text-on-surface hover:bg-surface-variant/30 rounded-lg transition-colors"
              >
                Batal
              </button>
              <button
                onClick={handleConfirmAction}
                className={`px-4 py-2 text-sm font-medium text-white rounded-lg transition-colors ${confirmingAction === 'deletion' ? 'bg-red-500 hover:bg-red-600' : 'bg-green-500 hover:bg-green-600'}`}
              >
                {confirmingAction === 'upload' ? 'Ya, Setujui' : confirmingAction === 'edit' ? 'Ya, Setujui Edit' : 'Ya, Hapus Permanen'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* View Reason Modal */}
      <AnimatePresence>
        {viewReasonData && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4"
          >
            <motion.div
              initial={{ scale: 0.95, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, y: 20 }}
              className="bg-surface rounded-2xl shadow-xl w-full max-w-sm overflow-hidden"
            >
              <div className="px-6 py-5 border-b border-outline-variant/20">
                <h3 className="text-lg font-bold text-on-surface flex items-center gap-2">
                  <FiAlertCircle className="text-orange-500" />
                  Alasan Penghapusan
                </h3>
              </div>
              <div className="p-6">
                <div className="bg-orange-50 text-orange-800 p-4 rounded-xl text-sm border border-orange-100">
                  {viewReasonData}
                </div>
              </div>
              <div className="px-6 py-4 bg-surface-variant/20 border-t border-outline-variant/20 flex justify-end">
                <button
                  onClick={() => setViewReasonData(null)}
                  className="px-4 py-2 text-sm font-medium bg-surface-variant/50 hover:bg-surface-variant text-on-surface-variant rounded-lg transition-colors"
                >
                  Tutup
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Preview Modal */}
      {previewingKarya && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-surface rounded-2xl shadow-xl w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden">
            {previewingKarya.is_edit_preview && (
              <div className="px-6 py-2 bg-amber-100 border-b border-amber-200 text-amber-800 text-xs font-bold text-center tracking-wider">
                ⚠️ MENAMPILKAN DATA USULAN BARU (EDIT)
              </div>
            )}
            <div className="px-6 py-5 border-b border-outline-variant/20 flex justify-between items-center bg-surface sticky top-0 z-10">
              <div>
                <h3 className="text-xl font-bold text-on-surface">{previewingKarya.title}</h3>
                <p className="text-sm text-[var(--color-primary)] font-bold uppercase tracking-wider">{getCategoryLabel(previewingKarya.category)}</p>
              </div>
              <button
                onClick={() => setPreviewingKarya(null)}
                className="w-8 h-8 flex items-center justify-center rounded-full bg-surface-variant/50 text-on-surface-variant hover:bg-red-50 hover:text-red-500 transition-colors"
              >
                <FiX size={18} />
              </button>
            </div>

            <div className="p-6 overflow-y-auto space-y-6">

              {/* Cover Image */}
              {previewingKarya.image_url && (
                <div className="w-full h-48 sm:h-64 rounded-xl overflow-hidden border border-outline-variant/20 bg-surface-variant/10">
                  <img src={previewingKarya.image_url} alt="Cover" className="w-full h-full object-cover" />
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h4 className="text-xs font-bold text-on-surface-variant uppercase tracking-wider mb-2">Pengunggah</h4>
                  <p className="text-on-surface font-medium">{previewingKarya.profiles?.full_name}</p>
                </div>
                <div>
                  <h4 className="text-xs font-bold text-on-surface-variant uppercase tracking-wider mb-2">Tech Stack</h4>
                  <div className="flex flex-wrap gap-2">
                    {(Array.isArray(previewingKarya.tech_stack) ? previewingKarya.tech_stack : (previewingKarya.tech_stack || '').split(',')).map((tech: string, i: number) => {
                      const label = tech.trim();
                      const def = getBadgeDef(label);
                      if (def) {
                        const Icon = def.icon;
                        return (
                          <span key={i} className="flex items-center gap-1.5 px-2.5 py-1 border text-[11px] font-semibold rounded-md whitespace-nowrap" style={{ backgroundColor: `${def.color}10`, color: def.color, borderColor: `${def.color}30` }}>
                            <Icon size={12} /> {def.label}
                          </span>
                        );
                      }
                      return (
                        <span key={i} className="px-2.5 py-1 bg-surface-variant/30 text-on-surface-variant rounded-md text-[11px] font-semibold border border-outline-variant/20 whitespace-nowrap">
                          {label}
                        </span>
                      );
                    })}
                  </div>
                </div>
              </div>

              <div>
                <h4 className="text-xs font-bold text-on-surface-variant uppercase tracking-wider mb-2">Deskripsi Singkat</h4>
                <p className="text-on-surface leading-relaxed text-sm bg-surface-variant/10 p-4 rounded-xl border border-outline-variant/20">{previewingKarya.description}</p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="bg-surface-variant/10 p-4 rounded-xl border border-outline-variant/30">
                  <h4 className="text-xs font-bold text-on-surface-variant uppercase tracking-wider mb-2">GitHub Repository</h4>
                  {previewingKarya.github_url ? (
                    <a href={previewingKarya.github_url} target="_blank" rel="noreferrer" className="text-[var(--color-primary)] font-medium text-sm hover:underline break-all">
                      {previewingKarya.github_url}
                    </a>
                  ) : (
                    <span className="text-on-surface-variant/60 text-sm italic">Tidak disertakan</span>
                  )}
                </div>
                <div className="bg-surface-variant/10 p-4 rounded-xl border border-outline-variant/30">
                  <h4 className="text-xs font-bold text-on-surface-variant uppercase tracking-wider mb-2">Live Demo / Link</h4>
                  {previewingKarya.live_url ? (
                    <a href={previewingKarya.live_url} target="_blank" rel="noreferrer" className="text-[var(--color-primary)] font-medium text-sm hover:underline break-all">
                      {previewingKarya.live_url}
                    </a>
                  ) : (
                    <span className="text-on-surface-variant/60 text-sm italic">Tidak disertakan</span>
                  )}
                </div>
              </div>

              <div>
                <h4 className="text-xs font-bold text-on-surface-variant uppercase tracking-wider mb-3">Fitur Utama</h4>
                <div className="space-y-3 bg-surface-variant/10 p-4 rounded-xl border border-outline-variant/20">
                  {previewingKarya.features && previewingKarya.features.map((f: any, i: number) => (
                    <div key={i} className="border-l-2 border-[var(--color-secondary)] pl-3">
                      <h5 className="font-bold text-sm text-on-surface">{f.title}</h5>
                      <p className="text-xs text-on-surface-variant mt-1">{f.desc}</p>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <h4 className="text-xs font-bold text-on-surface-variant uppercase tracking-wider mb-3">Anggota Tim</h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {previewingKarya.team && previewingKarya.team.map((t: string | any, i: number) => {
                    let name = typeof t === 'string' ? t : t.name || '';
                    let role = typeof t === 'string' ? '' : t.role || '';
                    let avatar = typeof t === 'string' ? '' : t.avatar || '';
                    if (typeof t === 'string' && t.includes('(')) {
                      name = t.substring(0, t.lastIndexOf('(')).trim();
                      role = t.substring(t.lastIndexOf('(') + 1, t.length - 1).trim();
                    }

                    // Fallback to initials if no avatar
                    const getInitials = (n: string) => {
                      return n.split(' ').map(w => w[0]).join('').substring(0, 2).toUpperCase() || '?';
                    };

                    return (
                      <div key={i} className="bg-surface-variant/10 p-3 rounded-xl border border-outline-variant/20 flex items-center gap-3">
                        <div className="shrink-0 w-10 h-10 rounded-full bg-gradient-to-br from-primary/80 to-secondary/80 text-white flex items-center justify-center font-bold text-sm border border-outline-variant/20 overflow-hidden shadow-sm">
                          {avatar ? (
                            <img src={avatar} alt={name} className="w-full h-full object-cover" />
                          ) : (
                            getInitials(name)
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-bold text-sm text-on-surface truncate">{name}</p>
                          <p className="text-[10px] text-[var(--color-secondary)] font-bold uppercase tracking-wider mt-0.5 truncate">{role}</p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {previewingKarya.gallery && previewingKarya.gallery.length > 0 && (
                <div>
                  <h4 className="text-xs font-bold text-on-surface-variant uppercase tracking-wider mb-3">Galeri / Dokumentasi</h4>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                    {previewingKarya.gallery.map((g: any, i: number) => (
                      <div key={i} className="flex flex-col bg-surface-variant/10 rounded-lg overflow-hidden border border-outline-variant/20">
                        <div className="aspect-video relative overflow-hidden group">
                          <img src={typeof g === 'string' ? g : g.url} alt={`Gallery ${i}`} className="w-full h-full object-cover transition-transform group-hover:scale-105" />
                        </div>
                        {(typeof g !== 'string' && g.caption) && (
                          <div className="p-2 border-t border-outline-variant/20">
                            <p className="text-[10px] font-medium text-on-surface-variant leading-snug">{g.caption}</p>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

            </div>
          </div>
        </div>
      )}
    </div>
  );
}
