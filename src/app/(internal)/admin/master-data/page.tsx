"use client";

import React, { useEffect, useState } from "react";
import { createClient } from "@/utils/supabase/client";
import { FiPlus, FiTrash2, FiSettings, FiAlertTriangle, FiX } from "react-icons/fi";
import { useToast } from "@/components/ui/Toast";
import { motion, AnimatePresence } from "framer-motion";

export default function MasterDataPage() {
  const supabase = createClient();
  const { toast } = useToast();

  const [angkatan, setAngkatan] = useState<string[]>([]);
  const [prodi, setProdi] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [addingAngkatan, setAddingAngkatan] = useState(false);
  const [addingProdi, setAddingProdi] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const [newAngkatan, setNewAngkatan] = useState("");
  const [newProdi, setNewProdi] = useState("");

  const [deleteConfirm, setDeleteConfirm] = useState<{ type: 'angkatan' | 'prodi', item: string } | null>(null);

  const fetchData = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('system_settings')
      .select('key, value')
      .in('key', ['master_angkatan', 'master_prodi']);

    if (error) {
      toast("Gagal memuat data master.", "error");
    } else if (data) {
      const angkatanItem = data.find(d => d.key === 'master_angkatan');
      const prodiItem = data.find(d => d.key === 'master_prodi');
      
      setAngkatan(angkatanItem && angkatanItem.value ? JSON.parse(angkatanItem.value) : ["1", "2", "3"]);
      setProdi(prodiItem && prodiItem.value ? JSON.parse(prodiItem.value) : ["Teknik Informatika", "Sistem Informasi", "Bisnis Digital"]);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleAddAngkatan = async (e: React.FormEvent) => {
    e.preventDefault();
    const val = newAngkatan.trim();
    if (!val) return;

    if (angkatan.includes(val)) {
      toast(`Angkatan ${val} sudah ada dalam daftar.`, "error");
      return;
    }

    setAddingAngkatan(true);
    const updated = [...angkatan, val].sort((a, b) => Number(a) - Number(b));
    
    const { error } = await supabase
      .from('system_settings')
      .upsert({ key: 'master_angkatan', value: JSON.stringify(updated) }, { onConflict: 'key' });

    if (error) {
      toast("Gagal menambahkan angkatan.", "error");
    } else {
      setAngkatan(updated);
      setNewAngkatan("");
      toast(`Angkatan ${val} berhasil ditambahkan!`, "success");
    }
    setAddingAngkatan(false);
  };

  const handleAddProdi = async (e: React.FormEvent) => {
    e.preventDefault();
    const val = newProdi.trim();
    if (!val) return;

    if (prodi.some(p => p.toLowerCase() === val.toLowerCase())) {
      toast(`Program studi "${val}" sudah ada dalam daftar.`, "error");
      return;
    }

    setAddingProdi(true);
    const updated = [...prodi, val];

    const { error } = await supabase
      .from('system_settings')
      .upsert({ key: 'master_prodi', value: JSON.stringify(updated) }, { onConflict: 'key' });

    if (error) {
      toast("Gagal menambahkan program studi.", "error");
    } else {
      setProdi(updated);
      setNewProdi("");
      toast(`Program studi "${val}" berhasil ditambahkan!`, "success");
    }
    setAddingProdi(false);
  };

  const executeDelete = async () => {
    if (!deleteConfirm) return;
    setDeleting(true);
    
    if (deleteConfirm.type === 'angkatan') {
      const updated = angkatan.filter(a => a !== deleteConfirm.item);
      const { error } = await supabase
        .from('system_settings')
        .upsert({ key: 'master_angkatan', value: JSON.stringify(updated) }, { onConflict: 'key' });

      if (error) {
        toast("Gagal menghapus angkatan.", "error");
      } else {
        setAngkatan(updated);
        toast(`Angkatan ${deleteConfirm.item} berhasil dihapus!`, "success");
      }
    } else {
      const updated = prodi.filter(p => p !== deleteConfirm.item);
      const { error } = await supabase
        .from('system_settings')
        .upsert({ key: 'master_prodi', value: JSON.stringify(updated) }, { onConflict: 'key' });

      if (error) {
        toast("Gagal menghapus program studi.", "error");
      } else {
        setProdi(updated);
        toast(`Program studi "${deleteConfirm.item}" berhasil dihapus!`, "success");
      }
    }
    setDeleting(false);
    setDeleteConfirm(null);
  };

  return (
    <div className="max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h2 className="text-2xl font-bold text-on-surface flex items-center gap-2">
            <FiSettings className="text-primary" />
            Kelola Master Data
          </h2>
          <p className="text-on-surface-variant mt-1">Atur opsi Angkatan dan Program Studi yang tersedia di formulir mahasiswa.</p>
        </div>
      </div>

      {loading ? (
        <div className="py-12 flex justify-center">
          <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          
          {/* Angkatan Card */}
          <div className="bg-surface rounded-2xl border border-outline-variant/30 shadow-sm p-6 flex flex-col h-full">
            <h3 className="text-lg font-bold text-on-surface mb-4">Daftar Angkatan</h3>
            
            <form onSubmit={handleAddAngkatan} className="flex gap-2 mb-6">
              <input
                type="number"
                value={newAngkatan}
                onChange={(e) => setNewAngkatan(e.target.value)}
                placeholder="Tambah angkatan..."
                disabled={addingAngkatan}
                className="flex-1 bg-surface-variant/20 border border-outline-variant/30 rounded-xl px-4 py-2.5 outline-none focus:border-primary text-sm disabled:opacity-50"
              />
              <button
                type="submit"
                disabled={!newAngkatan.trim() || addingAngkatan}
                className="bg-secondary text-white px-4 py-2.5 rounded-xl font-bold hover:bg-secondary/90 transition-colors disabled:opacity-50 flex items-center justify-center"
              >
                <FiPlus size={20} />
              </button>
            </form>

            <div className="flex-1 overflow-y-auto pr-2 space-y-2" style={{ maxHeight: '400px' }}>
              {angkatan.map((item) => (
                <div key={item} className="flex items-center justify-between p-3.5 bg-surface-variant/10 border border-outline-variant/20 rounded-xl">
                  <span className="font-bold text-sm text-on-surface">Angkatan {item}</span>
                  <button
                    type="button"
                    onClick={() => setDeleteConfirm({ type: 'angkatan', item })}
                    className="text-on-surface-variant/50 hover:text-red-500 p-1.5 rounded-lg transition-colors"
                  >
                    <FiTrash2 size={16} />
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Prodi Card */}
          <div className="bg-surface rounded-2xl border border-outline-variant/30 shadow-sm p-6 flex flex-col h-full">
            <h3 className="text-lg font-bold text-on-surface mb-4">Daftar Program Studi (Prodi)</h3>
            
            <form onSubmit={handleAddProdi} className="flex gap-2 mb-6">
              <input
                type="text"
                value={newProdi}
                onChange={(e) => setNewProdi(e.target.value)}
                placeholder="Tambah prodi..."
                disabled={addingProdi}
                className="flex-1 bg-surface-variant/20 border border-outline-variant/30 rounded-xl px-4 py-2.5 outline-none focus:border-primary text-sm disabled:opacity-50"
              />
              <button
                type="submit"
                disabled={!newProdi.trim() || addingProdi}
                className="bg-secondary text-white px-4 py-2.5 rounded-xl font-bold hover:bg-secondary/90 transition-colors disabled:opacity-50 flex items-center justify-center"
              >
                <FiPlus size={20} />
              </button>
            </form>

            <div className="flex-1 overflow-y-auto pr-2 space-y-2" style={{ maxHeight: '400px' }}>
              {prodi.map((item) => (
                <div key={item} className="flex items-center justify-between p-3.5 bg-surface-variant/10 border border-outline-variant/20 rounded-xl">
                  <span className="font-bold text-sm text-on-surface">{item}</span>
                  <button
                    type="button"
                    onClick={() => setDeleteConfirm({ type: 'prodi', item })}
                    className="text-on-surface-variant/50 hover:text-red-500 p-1.5 rounded-lg transition-colors"
                  >
                    <FiTrash2 size={16} />
                  </button>
                </div>
              ))}
            </div>
          </div>

        </div>
      )}

      <AnimatePresence>
        {deleteConfirm && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/40 backdrop-blur-sm"
              onClick={() => !deleting && setDeleteConfirm(null)}
            />
            
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative bg-surface w-full max-w-sm rounded-2xl shadow-xl overflow-hidden text-left"
            >
              <div className="p-5 border-b border-outline-variant/30 flex justify-between items-center">
                <h3 className="font-bold text-lg text-on-surface flex items-center gap-2">
                  <span className="w-8 h-8 rounded-full bg-red-100 text-red-600 flex items-center justify-center">
                    <FiAlertTriangle size={16} />
                  </span>
                  Hapus Data
                </h3>
                <button 
                  type="button"
                  disabled={deleting}
                  onClick={() => setDeleteConfirm(null)}
                  className="text-on-surface-variant hover:text-on-surface p-1 rounded-full hover:bg-surface-variant/50 transition-colors disabled:opacity-50"
                >
                  <FiX size={20} />
                </button>
              </div>
              
              <div className="p-5">
                <p className="text-on-surface-variant text-sm mb-6 leading-relaxed">
                  Apakah kamu yakin ingin menghapus {deleteConfirm.type === 'angkatan' ? `Angkatan ${deleteConfirm.item}` : `Program Studi "${deleteConfirm.item}"`}? Tindakan ini tidak dapat dibatalkan.
                </p>
                
                <div className="flex justify-end gap-3">
                  <button
                    type="button"
                    disabled={deleting}
                    onClick={() => setDeleteConfirm(null)}
                    className="px-4 py-2 rounded-xl text-sm font-semibold text-on-surface-variant bg-surface-variant/30 hover:bg-surface-variant/50 transition-colors disabled:opacity-50"
                  >
                    Batal
                  </button>
                  <button
                    type="button"
                    disabled={deleting}
                    onClick={executeDelete}
                    className="px-4 py-2 rounded-xl text-sm font-bold text-white bg-red-600 hover:bg-red-700 transition-colors shadow-sm disabled:opacity-50"
                  >
                    {deleting ? "Menghapus..." : "Ya, Hapus"}
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
