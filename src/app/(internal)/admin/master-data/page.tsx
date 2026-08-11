"use client";

import React, { useEffect, useState } from "react";
import { createClient } from "@/utils/supabase/client";
import { FiPlus, FiTrash2, FiSave, FiSettings } from "react-icons/fi";
import { useToast } from "@/components/ui/Toast";

export default function MasterDataPage() {
  const supabase = createClient();
  const { toast } = useToast();

  const [angkatan, setAngkatan] = useState<string[]>([]);
  const [prodi, setProdi] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [newAngkatan, setNewAngkatan] = useState("");
  const [newProdi, setNewProdi] = useState("");

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

  const handleSave = async () => {
    setSaving(true);
    
    const updates = [
      { key: 'master_angkatan', value: JSON.stringify(angkatan) },
      { key: 'master_prodi', value: JSON.stringify(prodi) }
    ];

    const { error } = await supabase.from('system_settings').upsert(updates, { onConflict: 'key' });

    if (error) {
      toast("Gagal menyimpan perubahan.", "error");
    } else {
      toast("Data master berhasil disimpan!", "success");
    }
    setSaving(false);
  };

  const handleAddAngkatan = (e: React.FormEvent) => {
    e.preventDefault();
    const val = newAngkatan.trim();
    if (val && !angkatan.includes(val)) {
      setAngkatan([...angkatan, val].sort((a, b) => Number(a) - Number(b)));
      setNewAngkatan("");
    }
  };

  const handleRemoveAngkatan = (item: string) => {
    setAngkatan(angkatan.filter(a => a !== item));
  };

  const handleAddProdi = (e: React.FormEvent) => {
    e.preventDefault();
    const val = newProdi.trim();
    if (val && !prodi.includes(val)) {
      setProdi([...prodi, val]);
      setNewProdi("");
    }
  };

  const handleRemoveProdi = (item: string) => {
    setProdi(prodi.filter(p => p !== item));
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
        <button
          onClick={handleSave}
          disabled={saving || loading}
          className="flex items-center gap-2 px-5 py-2.5 bg-primary text-white font-bold rounded-xl shadow-sm hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
        >
          <FiSave />
          {saving ? 'Menyimpan...' : 'Simpan Perubahan'}
        </button>
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
                className="flex-1 bg-surface-variant/20 border border-outline-variant/30 rounded-xl px-4 py-2.5 outline-none focus:border-primary text-sm"
              />
              <button
                type="submit"
                disabled={!newAngkatan.trim()}
                className="bg-secondary text-white px-4 py-2.5 rounded-xl font-bold hover:bg-secondary/90 transition-colors disabled:opacity-50 flex items-center justify-center"
              >
                <FiPlus size={20} />
              </button>
            </form>

            <div className="flex-1 overflow-y-auto pr-2" style={{ maxHeight: '400px' }}>
              {angkatan.length === 0 ? (
                <p className="text-sm text-on-surface-variant/70 text-center py-4">Belum ada data angkatan.</p>
              ) : (
                <ul className="space-y-2">
                  {angkatan.map((item) => (
                    <li key={item} className="flex items-center justify-between p-3 bg-surface-variant/10 border border-outline-variant/20 rounded-xl group hover:border-outline-variant/50 transition-colors">
                      <span className="font-bold text-on-surface">Angkatan {item}</span>
                      <button
                        onClick={() => handleRemoveAngkatan(item)}
                        className="text-on-surface-variant/50 hover:text-red-500 hover:bg-red-50 p-1.5 rounded-lg transition-colors"
                        title="Hapus"
                      >
                        <FiTrash2 size={16} />
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>

          {/* Prodi Card */}
          <div className="bg-surface rounded-2xl border border-outline-variant/30 shadow-sm p-6 flex flex-col h-full">
            <h3 className="text-lg font-bold text-on-surface mb-4">Daftar Program Studi</h3>
            
            <form onSubmit={handleAddProdi} className="flex gap-2 mb-6">
              <input
                type="text"
                value={newProdi}
                onChange={(e) => setNewProdi(e.target.value)}
                placeholder="Nama program studi..."
                className="flex-1 bg-surface-variant/20 border border-outline-variant/30 rounded-xl px-4 py-2.5 outline-none focus:border-primary text-sm"
              />
              <button
                type="submit"
                disabled={!newProdi.trim()}
                className="bg-secondary text-white px-4 py-2.5 rounded-xl font-bold hover:bg-secondary/90 transition-colors disabled:opacity-50 flex items-center justify-center"
              >
                <FiPlus size={20} />
              </button>
            </form>

            <div className="flex-1 overflow-y-auto pr-2" style={{ maxHeight: '400px' }}>
              {prodi.length === 0 ? (
                <p className="text-sm text-on-surface-variant/70 text-center py-4">Belum ada data program studi.</p>
              ) : (
                <ul className="space-y-2">
                  {prodi.map((item) => (
                    <li key={item} className="flex items-center justify-between p-3 bg-surface-variant/10 border border-outline-variant/20 rounded-xl group hover:border-outline-variant/50 transition-colors">
                      <span className="font-bold text-on-surface">{item}</span>
                      <button
                        onClick={() => handleRemoveProdi(item)}
                        className="text-on-surface-variant/50 hover:text-red-500 hover:bg-red-50 p-1.5 rounded-lg transition-colors"
                        title="Hapus"
                      >
                        <FiTrash2 size={16} />
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>

        </div>
      )}
    </div>
  );
}
