"use client";

import React, { useState } from "react";
import { FiPlus, FiTrash2, FiUsers, FiChevronDown, FiChevronUp } from "react-icons/fi";
import { KabinetPengurusInti } from "@/types/kabinet";
import ImageUpload from "@/components/ui/ImageUpload";

interface DynamicPengurusProps {
  pengurus: KabinetPengurusInti[];
  onChange: (newPengurus: KabinetPengurusInti[]) => void;
}

export default function DynamicPengurus({ pengurus, onChange }: DynamicPengurusProps) {
  const [expandedIndex, setExpandedIndex] = useState<number | null>(0);

  const handleAdd = () => {
    const colors = [
      { color: "text-blue-600", bg: "bg-blue-100" },
      { color: "text-emerald-600", bg: "bg-emerald-100" },
      { color: "text-indigo-600", bg: "bg-indigo-100" },
      { color: "text-rose-600", bg: "bg-rose-100" },
      { color: "text-orange-600", bg: "bg-orange-100" },
      { color: "text-violet-600", bg: "bg-violet-100" }
    ];
    const theme = colors[pengurus.length % colors.length];
    
    const newItem: KabinetPengurusInti = {
      name: "",
      role: "Ketua BEM",
      ig: "",
      wa: "",
      initials: "KB",
      color: theme.color,
      bg: theme.bg,
      foto: ""
    };
    onChange([...pengurus, newItem]);
    setExpandedIndex(pengurus.length);
  };

  const handleRemove = (index: number) => {
    const newPengurus = [...pengurus];
    newPengurus.splice(index, 1);
    onChange(newPengurus);
    if (expandedIndex === index) {
      setExpandedIndex(null);
    }
  };

  const handleChange = (index: number, field: keyof KabinetPengurusInti, value: string) => {
    const newPengurus = [...pengurus];
    newPengurus[index] = { ...newPengurus[index], [field]: value };
    
    // Auto generate initials if name changes and initials is not customized
    if (field === 'name' && value.trim()) {
      const words = value.trim().split(' ');
      let init = "";
      if (words.length >= 2) {
        init = (words[0][0] + words[1][0]).toUpperCase();
      } else if (words.length === 1) {
        init = words[0].substring(0, 2).toUpperCase();
      }
      newPengurus[index].initials = init;
    }

    onChange(newPengurus);
  };

  return (
    <div className="bg-surface border border-outline-variant/30 rounded-2xl p-6">
      <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
        <h3 className="font-bold text-on-surface flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-indigo-500/10 text-indigo-600 flex items-center justify-center">
            <FiUsers size={16} />
          </div>
          Pengurus Inti
        </h3>
        <button
          type="button"
          onClick={handleAdd}
          className="flex items-center gap-1.5 text-xs font-bold bg-indigo-500/10 text-indigo-600 hover:bg-indigo-600 hover:text-white px-3 py-1.5 rounded-lg transition-colors"
        >
          <FiPlus size={14} /> Tambah Pengurus
        </button>
      </div>

      <div className="space-y-4">
        {pengurus.length === 0 ? (
          <div className="text-center py-8 bg-surface-variant/20 rounded-xl border border-dashed border-outline-variant/50">
            <p className="text-sm text-on-surface-variant">Belum ada pengurus inti.</p>
          </div>
        ) : (
          pengurus.map((item, index) => {
            const isExpanded = expandedIndex === index;
            
            return (
              <div key={index} className="border border-outline-variant/40 rounded-xl bg-background overflow-hidden animate-init-fade-up shadow-sm">
                
                {/* Header (Accordion Toggle) */}
                <div 
                  className={`flex items-center justify-between p-4 cursor-pointer hover:bg-surface-variant/20 transition-colors ${isExpanded ? 'bg-surface-variant/20 border-b border-outline-variant/30' : ''}`}
                  onClick={() => setExpandedIndex(isExpanded ? null : index)}
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm shrink-0 border ${item.bg} ${item.color}`}>
                      {item.foto ? (
                        <img src={item.foto} alt="Avatar" className="w-full h-full rounded-full object-cover" />
                      ) : (
                        item.initials || "?"
                      )}
                    </div>
                    <div>
                      <h4 className="font-bold text-sm text-on-surface">{item.name || "Anggota Baru"}</h4>
                      <p className="text-xs text-primary">{item.role || "Jabatan"}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={(e) => { e.stopPropagation(); handleRemove(index); }}
                      className="w-8 h-8 flex items-center justify-center text-red-500 hover:bg-red-100 rounded-lg transition-colors"
                      title="Hapus"
                    >
                      <FiTrash2 size={16} />
                    </button>
                    <div className="w-8 h-8 flex items-center justify-center text-on-surface-variant">
                      {isExpanded ? <FiChevronUp /> : <FiChevronDown />}
                    </div>
                  </div>
                </div>

                {/* Body (Form Fields) */}
                {isExpanded && (
                  <div className="p-4 md:p-5 grid grid-cols-1 md:grid-cols-12 gap-5 bg-surface/50">
                    
                    {/* Foto Upload Column */}
                    <div className="md:col-span-3 flex flex-col items-center gap-2">
                      <label className="text-xs font-bold text-on-surface-variant uppercase tracking-wider">Foto Profil</label>
                      <ImageUpload 
                        value={item.foto} 
                        onChange={(url) => handleChange(index, 'foto', url)} 
                        className="mt-1"
                      />
                      <input 
                        type="text" 
                        value={item.foto || ""} 
                        onChange={(e) => handleChange(index, 'foto', e.target.value)} 
                        className="w-full mt-1 text-center bg-background border border-outline-variant/50 rounded-lg px-2 py-1.5 text-[10px] focus:border-primary focus:ring-1 focus:ring-primary outline-none" 
                        placeholder="Atau tempel link URL" 
                      />
                    </div>

                    {/* Form Fields Column */}
                    <div className="md:col-span-9 grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-1.5 md:col-span-2">
                        <label className="text-xs font-bold text-on-surface">Nama Lengkap</label>
                        <input 
                          type="text" 
                          value={item.name}
                          onChange={(e) => handleChange(index, 'name', e.target.value)}
                          className="w-full bg-background border border-outline-variant/50 rounded-lg px-3 py-2 text-sm focus:border-primary focus:ring-1 focus:ring-primary outline-none"
                          placeholder="Contoh: Budi Santoso"
                        />
                      </div>
                      
                      <div className="space-y-1.5 md:col-span-2">
                        <label className="text-xs font-bold text-on-surface">Jabatan</label>
                        <input 
                          type="text" 
                          value={item.role}
                          onChange={(e) => handleChange(index, 'role', e.target.value)}
                          className="w-full bg-background border border-outline-variant/50 rounded-lg px-3 py-2 text-sm focus:border-primary focus:ring-1 focus:ring-primary outline-none"
                          placeholder="Contoh: Presiden Mahasiswa"
                        />
                      </div>

                      <div className="space-y-1.5 md:col-span-2">
                        <label className="text-xs font-bold text-on-surface">Link Instagram</label>
                        <input 
                          type="text" 
                          value={item.ig}
                          onChange={(e) => handleChange(index, 'ig', e.target.value)}
                          className="w-full bg-background border border-outline-variant/50 rounded-lg px-3 py-2 text-sm focus:border-primary focus:ring-1 focus:ring-primary outline-none"
                          placeholder="https://instagram.com/username"
                        />
                      </div>

                      <div className="space-y-1.5 md:col-span-2">
                        <label className="text-xs font-bold text-on-surface">Link WhatsApp</label>
                        <input 
                          type="text" 
                          value={item.wa}
                          onChange={(e) => handleChange(index, 'wa', e.target.value)}
                          className="w-full bg-background border border-outline-variant/50 rounded-lg px-3 py-2 text-sm focus:border-primary focus:ring-1 focus:ring-primary outline-none"
                          placeholder="https://wa.me/628123456789"
                        />
                      </div>

                      <div className="space-y-1.5">
                        <label className="text-xs font-bold text-on-surface">Inisial</label>
                        <input 
                          type="text" 
                          value={item.initials}
                          onChange={(e) => handleChange(index, 'initials', e.target.value)}
                          className="w-full bg-background border border-outline-variant/50 rounded-lg px-3 py-2 text-sm focus:border-primary focus:ring-1 focus:ring-primary outline-none uppercase"
                          placeholder="BS"
                          maxLength={3}
                        />
                      </div>
                      
                      {/* Color fields removed for simplicity as requested */}

                    </div>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
