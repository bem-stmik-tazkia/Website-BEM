"use client";

import React, { useEffect, useState } from "react";
import { createClient } from "@/utils/supabase/client";
import { FiTrash2, FiMessageSquare, FiEye, FiX, FiLink, FiHelpCircle, FiChevronDown, FiCopy } from "react-icons/fi";
import { useToast } from "@/components/ui/Toast";

const GOOGLE_SCRIPT_CODE = `function doPost(e) {
  try {
    var postData = JSON.parse(e.postData.contents);
    var sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
    var rowData = [
      postData.tanggal, 
      postData.nama, 
      postData.kategori, 
      postData.deskripsi
    ];
    sheet.appendRow(rowData);
    return ContentService.createTextOutput(JSON.stringify({"status": "success"}))
      .setMimeType(ContentService.MimeType.JSON);
  } catch (error) {
    return ContentService.createTextOutput(JSON.stringify({"error": error.toString()}))
      .setMimeType(ContentService.MimeType.JSON);
  }
}`;

export default function SaranAduanAdminPage() {
  const supabase = createClient();
  const { toast } = useToast();
  
  const [saranList, setSaranList] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [confirmingId, setConfirmingId] = useState<string | null>(null);
  const [detailItem, setDetailItem] = useState<any | null>(null);

  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [webhookUrl, setWebhookUrl] = useState("");
  const [isSavingWebhook, setIsSavingWebhook] = useState(false);
  const [showGuide, setShowGuide] = useState(false);

  const fetchData = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('saran_aduan')
      .select('*')
      .order('created_at', { ascending: false });

    if (!error && data) {
      setSaranList(data);
    } else {
      setSaranList([]);
    }
    setLoading(false);
  };

  const fetchWebhookUrl = async () => {
    const { data } = await supabase.from('system_settings').select('value').eq('key', 'google_sheets_webhook_url').maybeSingle();
    if (data) setWebhookUrl(data.value);
  };

  useEffect(() => {
    fetchData();
    fetchWebhookUrl();
  }, []);

  const handleDelete = async () => {
    if (!confirmingId) return;

    try {
      const { error } = await supabase.from('saran_aduan').delete().eq('id', confirmingId);
      if (error) throw error;
      toast("Data berhasil dihapus.", "success");
      fetchData();
    } catch (e: any) {
      toast(e.message || "Terjadi kesalahan sistem.", "error");
    } finally {
      setConfirmingId(null);
    }
  };

  const handleSaveWebhook = async () => {
    setIsSavingWebhook(true);
    try {
      const { error } = await supabase.from('system_settings').upsert({ key: 'google_sheets_webhook_url', value: webhookUrl });
      if (error) throw error;
      toast("Link Integrasi Excel berhasil disimpan.", "success");
      setIsSettingsOpen(false);
    } catch (e: any) {
      toast("Gagal menyimpan: " + e.message, "error");
    } finally {
      setIsSavingWebhook(false);
    }
  };

  const handleCopyCode = () => {
    navigator.clipboard.writeText(GOOGLE_SCRIPT_CODE);
    toast("Script disalin ke clipboard!", "success");
  };

  return (
    <div>
      <div className="mb-8 flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-on-surface flex items-center gap-2">
            <FiMessageSquare className="text-primary" />
            Kotak Saran & Aduan
          </h2>
          <p className="text-on-surface-variant mt-1">Daftar aspirasi, kritik, dan saran dari mahasiswa.</p>
        </div>
        <button onClick={() => setIsSettingsOpen(true)} className="flex items-center gap-2 bg-primary/10 text-primary hover:bg-primary/20 px-4 py-2.5 rounded-xl font-bold text-sm transition-colors border border-primary/20 shadow-soft w-fit">
          <FiLink size={18} />
          Integrasi Excel
        </button>
      </div>

      <div className="bg-surface rounded-2xl border border-outline-variant/20 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[800px]">
            <thead>
              <tr className="bg-surface-variant/20 text-on-surface-variant text-sm border-b border-outline-variant/20">
                <th className="py-4 px-6 font-medium">Tanggal</th>
                <th className="py-4 px-6 font-medium w-1/4">Pengirim</th>
                <th className="py-4 px-6 font-medium">Kategori</th>
                <th className="py-4 px-6 font-medium w-2/5">Deskripsi</th>
                <th className="py-4 px-6 font-medium text-right">Aksi</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={5} className="py-10 text-center text-on-surface-variant/70">Memuat data...</td>
                </tr>
              ) : saranList.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-10 text-center text-on-surface-variant/70">Belum ada saran atau aduan.</td>
                </tr>
              ) : (
                saranList.map((item) => (
                  <tr key={item.id} className="border-b border-gray-50 hover:bg-surface-variant/20/50 transition-colors">
                    <td className="py-4 px-6 text-sm text-on-surface-variant whitespace-nowrap align-top">
                      {new Date(item.created_at).toLocaleDateString('id-ID', {
                        day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit'
                      })}
                    </td>
                    <td className="py-4 px-6 align-top">
                      <div className="font-bold text-sm text-on-surface">{item.nama || 'Anonim'}</div>

                    </td>
                    <td className="py-4 px-6 align-top">
                      <span className={`px-2.5 py-1 rounded-md text-[10px] font-extrabold uppercase tracking-widest border ${
                        item.kategori === 'saran' ? 'bg-blue-50 text-blue-600 border-blue-100' : 
                        item.kategori === 'aduan' ? 'bg-red-50 text-red-600 border-red-100' : 
                        'bg-gray-50 text-gray-600 border-gray-200'
                      }`}>
                        {item.kategori}
                      </span>
                    </td>
                    <td className="py-4 px-6 text-sm text-on-surface align-top">
                      <div className="max-w-sm line-clamp-2 break-words break-all" title={item.deskripsi}>
                        {item.deskripsi}
                      </div>
                    </td>
                    <td className="py-4 px-6 align-top">
                      <div className="flex justify-end gap-2">
                        <button
                          onClick={() => setDetailItem(item)}
                          className="w-8 h-8 flex items-center justify-center bg-surface-variant/50 text-on-surface-variant hover:text-primary rounded-lg hover:bg-primary/10 transition-colors border border-outline-variant/30"
                          title="Lihat Detail"
                        >
                          <FiEye size={16} />
                        </button>
                        <button
                          onClick={() => setConfirmingId(item.id)}
                          className="w-8 h-8 flex items-center justify-center bg-surface-variant/50 text-on-surface-variant hover:text-red-500 rounded-lg hover:bg-red-50 transition-colors border border-outline-variant/30"
                          title="Hapus"
                        >
                          <FiTrash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Detail Modal */}
      {detailItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-surface rounded-2xl shadow-xl w-full max-w-lg overflow-hidden flex flex-col max-h-[90vh]">
            <div className="px-6 py-5 border-b border-outline-variant/20 flex justify-between items-center bg-surface-variant/10">
              <h3 className="text-lg font-bold text-on-surface flex items-center gap-2 capitalize">
                <FiMessageSquare className="text-primary" />
                Detail {detailItem.kategori}
              </h3>
              <button onClick={() => setDetailItem(null)} className="text-on-surface-variant hover:text-on-surface p-1 rounded-full hover:bg-surface-variant/50 transition-colors">
                <FiX size={20} />
              </button>
            </div>
            <div className="px-6 py-5 overflow-y-auto">
              <div className="mb-4">
                <div className="text-xs text-on-surface-variant font-bold uppercase tracking-wider mb-1">Pengirim</div>
                <div className="font-semibold text-on-surface">{detailItem.nama || 'Anonim'}</div>

              </div>
              <div className="mb-4">
                <div className="text-xs text-on-surface-variant font-bold uppercase tracking-wider mb-1">Tanggal Dikirim</div>
                <div className="text-sm text-on-surface">{new Date(detailItem.created_at).toLocaleString('id-ID', { dateStyle: 'full', timeStyle: 'medium' })}</div>
              </div>
              <div>
                <div className="text-xs text-on-surface-variant font-bold uppercase tracking-wider mb-2">Isi Laporan</div>
                <div className="p-4 bg-surface-variant/20 rounded-xl text-sm text-on-surface whitespace-pre-wrap leading-relaxed border border-outline-variant/20 break-words break-all">
                  {detailItem.deskripsi}
                </div>
              </div>
            </div>
            <div className="px-6 py-4 border-t border-outline-variant/20 flex justify-end">
              <button
                onClick={() => setDetailItem(null)}
                className="px-5 py-2.5 text-sm font-bold bg-primary text-white rounded-xl hover:bg-primary/90 transition-colors shadow-soft"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Integrasi Excel Settings Modal */}
      {isSettingsOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-surface rounded-2xl shadow-xl w-full max-w-xl overflow-hidden flex flex-col max-h-[90vh]">
            <div className="px-6 py-5 border-b border-outline-variant/20 flex justify-between items-center bg-surface-variant/10">
              <h3 className="text-lg font-bold text-on-surface flex items-center gap-2">
                <FiLink className="text-primary" />
                Integrasi Excel Online
              </h3>
              <button onClick={() => setIsSettingsOpen(false)} className="text-on-surface-variant hover:text-on-surface p-1 rounded-full hover:bg-surface-variant/50 transition-colors">
                <FiX size={20} />
              </button>
            </div>
            <div className="px-6 py-5 overflow-y-auto flex-1">
              <p className="text-sm text-on-surface-variant mb-4 leading-relaxed">
                Masukkan <strong>Web App URL</strong> dari Google Apps Script untuk menghubungkan data kotak saran secara otomatis (real-time) ke Google Sheets.
              </p>
              <div className="flex flex-col gap-2 mb-6">
                <label className="text-xs font-bold text-on-surface uppercase tracking-wider">URL Webhook Google Sheets</label>
                <input
                  type="text"
                  value={webhookUrl}
                  onChange={(e) => setWebhookUrl(e.target.value)}
                  placeholder="https://script.google.com/macros/s/.../exec"
                  className="w-full px-4 py-3 text-sm rounded-xl border border-outline-variant/50 bg-surface focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all text-on-surface"
                />
              </div>

              {/* Accordion Panduan */}
              <div className="border border-outline-variant/30 rounded-xl overflow-hidden">
                <button 
                  onClick={() => setShowGuide(!showGuide)}
                  className="w-full flex items-center justify-between px-4 py-3 bg-surface-variant/20 hover:bg-surface-variant/40 transition-colors"
                >
                  <span className="font-bold text-sm text-on-surface flex items-center gap-2">
                    <FiHelpCircle size={18} className="text-primary" />
                    Cara Setup (Panduan Lengkap)
                  </span>
                  <FiChevronDown 
                    size={20} 
                    className="text-on-surface-variant transition-transform duration-300" 
                    style={{ transform: showGuide ? 'rotate(180deg)' : 'rotate(0deg)' }} 
                  />
                </button>
                
                {showGuide && (
                  <div className="p-4 bg-surface text-sm text-on-surface-variant border-t border-outline-variant/30 space-y-2 leading-relaxed">
                    <p>1. Buat <strong>Google Sheets baru</strong>.</p>
                    <p>2. Di baris A1 sampai D1 isi judul: <strong>Tanggal, Nama, Kategori, Deskripsi</strong>.</p>
                    <p>3. Klik menu <strong>Extensions (Ekstensi) &gt; Apps Script</strong>.</p>
                    <p>4. Hapus semua kode bawaan, lalu <strong>Copy-Paste</strong> kode di bawah ini:</p>
                    
                    <div className="relative group mt-2 mb-3">
                      <pre className="bg-surface-variant/30 p-4 rounded-lg text-[11px] overflow-x-auto border border-outline-variant/30 font-mono text-on-surface">
                        {GOOGLE_SCRIPT_CODE}
                      </pre>
                      <button 
                        onClick={handleCopyCode}
                        className="absolute top-2 right-2 p-2 bg-surface rounded-md shadow-sm border border-outline-variant/30 opacity-0 group-hover:opacity-100 transition-opacity hover:bg-surface-variant text-on-surface"
                        title="Copy Code"
                      >
                        <FiCopy size={14} />
                      </button>
                    </div>

                    <p>5. Simpan (Ctrl+S).</p>
                    <p>6. Klik tombol biru <strong>Deploy &gt; New Deployment</strong>.</p>
                    <p>7. Pilih tipe pengaktifan <strong>Web App</strong>.</p>
                    <p>8. <strong>PENTING:</strong> Pada bagian <em>"Who has access"</em> wajib ubah menjadi <strong>"Anyone"</strong>.</p>
                    <p>9. Klik Deploy, lalu berikan izin akses (Authorize access).</p>
                    <p>10. Copy URL Web App yang muncul, lalu paste ke kotak isian di atas. Selesai!</p>
                  </div>
                )}
              </div>

            </div>
            <div className="px-6 py-4 bg-surface-variant/20 border-t border-outline-variant/20 flex justify-end gap-3">
              <button
                onClick={() => setIsSettingsOpen(false)}
                className="px-4 py-2.5 text-sm font-medium text-on-surface-variant hover:text-on-surface hover:bg-surface-variant/30 rounded-xl transition-colors"
              >
                Tutup
              </button>
              <button
                onClick={handleSaveWebhook}
                disabled={isSavingWebhook}
                className="px-5 py-2.5 text-sm font-bold bg-primary text-white rounded-xl hover:bg-primary/90 transition-colors shadow-soft disabled:opacity-70 flex items-center gap-2"
              >
                {isSavingWebhook ? 'Menyimpan...' : 'Simpan Pengaturan'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Confirm Delete Modal */}
      {confirmingId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-surface rounded-2xl shadow-xl w-full max-w-md overflow-hidden">
            <div className="px-6 py-5 border-b border-outline-variant/20">
              <h3 className="text-lg font-bold text-on-surface">Konfirmasi Hapus</h3>
              <p className="text-sm text-on-surface-variant mt-1">
                Yakin ingin menghapus masukan ini secara permanen? Data yang dihapus tidak dapat dikembalikan.
              </p>
            </div>
            <div className="px-6 py-4 bg-surface-variant/20 border-t border-outline-variant/20 flex justify-end gap-3">
              <button
                onClick={() => setConfirmingId(null)}
                className="px-4 py-2 text-sm font-medium text-on-surface-variant hover:text-on-surface hover:bg-surface-variant/30 rounded-lg transition-colors"
              >
                Batal
              </button>
              <button
                onClick={handleDelete}
                className="px-4 py-2 text-sm font-medium bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
              >
                Ya, Hapus
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
