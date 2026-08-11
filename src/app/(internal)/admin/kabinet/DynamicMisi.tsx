"use client";

import React from "react";
import { FiPlus, FiTrash2, FiTarget } from "react-icons/fi";

interface DynamicMisiProps {
  misi: string[];
  onChange: (newMisi: string[]) => void;
}

export default function DynamicMisi({ misi, onChange }: DynamicMisiProps) {
  
  const handleAdd = () => {
    onChange([...misi, ""]);
  };

  const handleRemove = (index: number) => {
    const newMisi = [...misi];
    newMisi.splice(index, 1);
    onChange(newMisi);
  };

  const handleChange = (index: number, value: string) => {
    const newMisi = [...misi];
    newMisi[index] = value;
    onChange(newMisi);
  };

  return (
    <div className="bg-surface border border-outline-variant/30 rounded-2xl p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-bold text-on-surface flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
            <FiTarget size={16} />
          </div>
          Misi Kabinet
        </h3>
        <button
          type="button"
          onClick={handleAdd}
          className="flex items-center gap-1.5 text-xs font-bold bg-primary/10 text-primary hover:bg-primary hover:text-white px-3 py-1.5 rounded-lg transition-colors"
        >
          <FiPlus size={14} /> Tambah Misi
        </button>
      </div>

      <div className="space-y-3">
        {misi.length === 0 ? (
          <div className="text-center py-6 bg-surface-variant/20 rounded-xl border border-dashed border-outline-variant/50">
            <p className="text-sm text-on-surface-variant">Belum ada misi. Klik tombol Tambah Misi.</p>
          </div>
        ) : (
          misi.map((item, index) => (
            <div key={index} className="flex gap-3 items-start animate-init-fade-up">
              <div className="w-8 h-10 flex items-center justify-center font-bold text-on-surface-variant/50 shrink-0">
                {index + 1}.
              </div>
              <textarea
                value={item}
                onChange={(e) => handleChange(index, e.target.value)}
                className="flex-1 bg-background border border-outline-variant/50 rounded-xl px-4 py-2 text-sm focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all min-h-[60px]"
                placeholder="Tulis misi..."
              />
              <button
                type="button"
                onClick={() => handleRemove(index)}
                className="w-10 h-10 shrink-0 flex items-center justify-center text-red-500 bg-red-50 hover:bg-red-500 hover:text-white rounded-xl transition-colors mt-0"
                title="Hapus"
              >
                <FiTrash2 size={16} />
              </button>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
