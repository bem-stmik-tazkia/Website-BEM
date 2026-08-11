"use client";

import React from "react";
import { FiPlus, FiTrash2, FiTarget, FiStar } from "react-icons/fi";
import { KabinetProkerUtama } from "@/types/kabinet";
import LottieUpload from "@/components/ui/LottieUpload";

interface DynamicProkerUtamaProps {
  proker: KabinetProkerUtama[];
  onChange: (newProker: KabinetProkerUtama[]) => void;
}

export default function DynamicProkerUtama({ proker, onChange }: DynamicProkerUtamaProps) {
  
  const handleAdd = () => {
    onChange([...proker, { nama: "", deskripsi: "", icon: "⭐", tag: "Unggulan" }]);
  };

  const handleRemove = (index: number) => {
    const newProker = [...proker];
    newProker.splice(index, 1);
    onChange(newProker);
  };

  const handleChange = (index: number, field: keyof KabinetProkerUtama, value: string) => {
    const newProker = [...proker];
    newProker[index] = { ...newProker[index], [field]: value };
    onChange(newProker);
  };

  return (
    <div className="bg-surface border border-outline-variant/30 rounded-2xl p-6">
      <div className="flex flex-wrap items-center justify-between gap-4 mb-4">
        <h3 className="font-bold text-on-surface flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-yellow-500/10 text-yellow-600 flex items-center justify-center">
            <FiStar size={16} />
          </div>
          Program Kerja Utama
        </h3>
        <button
          type="button"
          onClick={handleAdd}
          className="flex items-center gap-1.5 text-xs font-bold bg-yellow-500/10 text-yellow-600 hover:bg-yellow-500 hover:text-white px-3 py-1.5 rounded-lg transition-colors"
        >
          <FiPlus size={14} /> Tambah Proker Utama
        </button>
      </div>

      <div className="space-y-4">
        {proker.length === 0 ? (
          <div className="text-center py-6 bg-surface-variant/20 rounded-xl border border-dashed border-outline-variant/50">
            <p className="text-sm text-on-surface-variant">Belum ada proker utama.</p>
          </div>
        ) : (
          proker.map((item, index) => (
            <div key={index} className="flex flex-col sm:flex-row gap-3 items-start animate-init-fade-up bg-background border border-outline-variant/50 p-4 rounded-xl relative group">
              <button
                type="button"
                onClick={() => handleRemove(index)}
                className="absolute top-3 right-3 w-8 h-8 flex items-center justify-center text-red-500 bg-red-50 hover:bg-red-500 hover:text-white rounded-lg transition-colors z-10"
                title="Hapus"
              >
                <FiTrash2 size={16} />
              </button>
              
              <div className="w-full sm:w-auto shrink-0 space-y-1.5 flex flex-col items-center">
                <label className="text-xs font-bold text-on-surface">Ikon / Lottie / Gambar</label>
                <LottieUpload 
                  value={item.icon}
                  onChange={(url) => handleChange(index, 'icon', url)}
                  className="w-24"
                />
                <input 
                  type="text" 
                  value={item.icon}
                  onChange={(e) => handleChange(index, 'icon', e.target.value)}
                  className="w-full sm:w-28 mt-1 text-center bg-surface border border-outline-variant/50 rounded-lg px-2 py-1.5 text-[10px] focus:border-primary focus:ring-1 focus:ring-primary outline-none font-mono"
                  placeholder="URL lottie / emoji"
                />
              </div>

              <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 gap-3 w-full pr-8 sm:pr-10">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-on-surface">Nama Proker</label>
                  <input 
                    type="text" 
                    value={item.nama}
                    onChange={(e) => handleChange(index, 'nama', e.target.value)}
                    className="w-full bg-surface border border-outline-variant/50 rounded-lg px-3 py-2 text-sm focus:border-primary focus:ring-1 focus:ring-primary outline-none"
                    placeholder="Nama Program"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-on-surface">Label / Tag</label>
                  <input 
                    type="text" 
                    value={item.tag}
                    onChange={(e) => handleChange(index, 'tag', e.target.value)}
                    className="w-full bg-surface border border-outline-variant/50 rounded-lg px-3 py-2 text-sm focus:border-primary focus:ring-1 focus:ring-primary outline-none"
                    placeholder="Contoh: Unggulan"
                  />
                </div>
                <div className="space-y-1.5 sm:col-span-2">
                  <label className="text-xs font-bold text-on-surface">Deskripsi</label>
                  <textarea 
                    value={item.deskripsi}
                    onChange={(e) => handleChange(index, 'deskripsi', e.target.value)}
                    className="w-full bg-surface border border-outline-variant/50 rounded-lg px-3 py-2 text-sm focus:border-primary focus:ring-1 focus:ring-primary outline-none min-h-[60px]"
                    placeholder="Deskripsi singkat..."
                  />
                </div>
              </div>

            </div>
          ))
        )}
      </div>
    </div>
  );
}
