"use client";

import React, { useState } from "react";
import { KabinetProfile } from "@/types/kabinet";
import { saveKabinetProfile } from "./actions";
import { FiSave, FiAlertCircle } from "react-icons/fi";
import { useToast } from "@/components/ui/Toast";
import DynamicMisi from "./DynamicMisi";
import DynamicPengurus from "./DynamicPengurus";
import DynamicProkerUtama from "./DynamicProkerUtama";
import DynamicDepartemen from "./DynamicDepartemen";

export default function KabinetForm({ initialData }: { initialData: KabinetProfile }) {
  const [formData, setFormData] = useState<KabinetProfile>(initialData);
  const [isLoading, setIsLoading] = useState(false);
  const { success, error: showError, toast } = useToast();
  const toastShown = React.useRef(false);

  React.useEffect(() => {
    const saved = localStorage.getItem("kabinet_draft");
    if (saved) {
      try {
        setFormData(JSON.parse(saved));
        if (!toastShown.current) {
          toast("Draft tersimpan dimuat ulang.", "success");
          toastShown.current = true;
        }
      } catch (e) {}
    }
  }, [toast]);

  React.useEffect(() => {
    localStorage.setItem("kabinet_draft", JSON.stringify(formData));
  }, [formData]);

  const isDirty = JSON.stringify(formData) !== JSON.stringify(initialData);

  React.useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (isDirty) {
        e.preventDefault();
        e.returnValue = "";
      }
    };
    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, [isDirty]);

  const handleSave = async () => {
    setIsLoading(true);
    
    try {
      await saveKabinetProfile(formData);
      localStorage.removeItem("kabinet_draft");
      success("Profil Kabinet berhasil disimpan!");
    } catch (e: any) {
      console.error(e);
      showError("Gagal menyimpan data: " + e.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="bg-surface rounded-2xl shadow-sm border border-outline-variant/30 overflow-hidden">
      <div className="p-6 md:p-8 space-y-8">
        
        {/* Basic Fields */}
        <div className="space-y-6">
          <h3 className="text-lg font-bold text-on-surface border-b border-outline-variant/30 pb-2">Informasi Dasar</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-sm font-bold text-on-surface">Periode</label>
              <input 
                type="text" 
                value={formData.periode}
                onChange={(e) => setFormData({...formData, periode: e.target.value})}
                className="w-full bg-background border border-outline-variant/50 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all"
                placeholder="Contoh: 2024/2025"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-bold text-on-surface">Nama Kabinet</label>
              <input 
                type="text" 
                value={formData.nama_kabinet}
                onChange={(e) => setFormData({...formData, nama_kabinet: e.target.value})}
                className="w-full bg-background border border-outline-variant/50 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all"
                placeholder="Contoh: Sinergi Aktif"
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-bold text-on-surface">Visi</label>
            <textarea 
              value={formData.visi}
              onChange={(e) => setFormData({...formData, visi: e.target.value})}
              className="w-full bg-background border border-outline-variant/50 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all min-h-[100px]"
              placeholder="Tuliskan visi kabinet..."
            />
          </div>
        </div>

        <DynamicMisi 
          misi={formData.misi || []} 
          onChange={(newMisi) => setFormData({...formData, misi: newMisi})} 
        />
        
        <DynamicPengurus 
          pengurus={formData.pengurus_inti || []} 
          onChange={(newPengurus) => setFormData({...formData, pengurus_inti: newPengurus})} 
        />
        
        <DynamicProkerUtama 
          proker={formData.proker_utama || []} 
          onChange={(newProker) => setFormData({...formData, proker_utama: newProker})} 
        />
        
        <DynamicDepartemen 
          departemen={formData.departemen || []} 
          onChange={(newDepartemen) => setFormData({...formData, departemen: newDepartemen})} 
        />

      </div>

      <div className="bg-surface-container-lowest border-t border-outline-variant/30 p-6 flex justify-end sticky bottom-0 z-20 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)]">
        <button
          onClick={handleSave}
          disabled={isLoading}
          className="flex items-center gap-2 bg-primary text-white px-6 py-2.5 rounded-xl font-bold text-sm hover:bg-primary/90 transition-all hover:-translate-y-0.5 hover:shadow-md disabled:opacity-70 disabled:hover:translate-y-0"
        >
          {isLoading ? (
            <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
          ) : (
            <FiSave size={18} />
          )}
          {isLoading ? "Menyimpan..." : "Simpan Perubahan"}
        </button>
      </div>
    </div>
  );
}
