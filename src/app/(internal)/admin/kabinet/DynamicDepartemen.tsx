"use client";

import React, { useState } from "react";
import { FiPlus, FiTrash2, FiBriefcase, FiChevronDown, FiChevronUp, FiUsers, FiTarget } from "react-icons/fi";
import { KabinetDepartemen, KabinetDepartemenAnggota, KabinetDepartemenProker } from "@/types/kabinet";
import ImageUpload from "@/components/ui/ImageUpload";
import LottieUpload from "@/components/ui/LottieUpload";

interface DynamicDepartemenProps {
  departemen: KabinetDepartemen[];
  onChange: (newDepartemen: KabinetDepartemen[]) => void;
}

export default function DynamicDepartemen({ departemen, onChange }: DynamicDepartemenProps) {
  const [expandedIndex, setExpandedIndex] = useState<number | null>(0);
  const [activeTab, setActiveTab] = useState<{ [deptIndex: number]: 'info' | 'anggota' | 'proker' }>({});

  const handleAddDept = () => {
    const colors = [
      { color: "text-blue-600", bg: "bg-blue-100" },
      { color: "text-emerald-600", bg: "bg-emerald-100" },
      { color: "text-indigo-600", bg: "bg-indigo-100" },
      { color: "text-rose-600", bg: "bg-rose-100" },
      { color: "text-orange-600", bg: "bg-orange-100" },
      { color: "text-violet-600", bg: "bg-violet-100" },
      { color: "text-neutral-900", bg: "bg-neutral-200" }
    ];
    const theme = colors[departemen.length % colors.length];

    const newItem: KabinetDepartemen = {
      id: Math.random().toString(36).substring(2, 9),
      nama: "",
      singkatan: "",
      deskripsi: "",
      warna: theme.color,
      warnaBg: theme.bg,
      icon: "🏢",
      anggota: [],
      proker: []
    };
    const newDeptList = [...departemen, newItem];
    onChange(newDeptList);
    setExpandedIndex(newDeptList.length - 1);
    setActiveTab({ ...activeTab, [newDeptList.length - 1]: 'info' });
  };

  const handleRemoveDept = (index: number) => {
    const newDeptList = [...departemen];
    newDeptList.splice(index, 1);
    onChange(newDeptList);
    if (expandedIndex === index) setExpandedIndex(null);
  };

  const handleChangeDept = (index: number, field: keyof KabinetDepartemen, value: any) => {
    const newDeptList = [...departemen];
    newDeptList[index] = { ...newDeptList[index], [field]: value };
    onChange(newDeptList);
  };

  // Anggota Operations
  const handleAddAnggota = (deptIndex: number) => {
    const newAnggota: KabinetDepartemenAnggota = {
      name: "", role: "Anggota", initials: "?", ig: "", wa: "", foto: ""
    };
    const newDeptList = [...departemen];
    newDeptList[deptIndex].anggota.push(newAnggota);
    onChange(newDeptList);
  };

  const handleRemoveAnggota = (deptIndex: number, anggotaIndex: number) => {
    const newDeptList = [...departemen];
    newDeptList[deptIndex].anggota.splice(anggotaIndex, 1);
    onChange(newDeptList);
  };

  const handleChangeAnggota = (deptIndex: number, anggotaIndex: number, field: keyof KabinetDepartemenAnggota, value: string) => {
    const newDeptList = [...departemen];
    newDeptList[deptIndex].anggota[anggotaIndex] = { ...newDeptList[deptIndex].anggota[anggotaIndex], [field]: value };
    
    // Auto generate initials
    if (field === 'name' && value.trim()) {
      const words = value.trim().split(' ');
      let init = "";
      if (words.length >= 2) {
        init = (words[0][0] + words[1][0]).toUpperCase();
      } else if (words.length === 1) {
        init = words[0].substring(0, 2).toUpperCase();
      }
      newDeptList[deptIndex].anggota[anggotaIndex].initials = init;
    }
    onChange(newDeptList);
  };

  // Proker Operations
  const handleAddProker = (deptIndex: number) => {
    const newProker: KabinetDepartemenProker = {
      nama: "", deskripsi: "", tag: "Wajib", icon: ""
    };
    const newDeptList = [...departemen];
    newDeptList[deptIndex].proker.push(newProker);
    onChange(newDeptList);
  };

  const handleRemoveProker = (deptIndex: number, prokerIndex: number) => {
    const newDeptList = [...departemen];
    newDeptList[deptIndex].proker.splice(prokerIndex, 1);
    onChange(newDeptList);
  };

  const handleChangeProker = (deptIndex: number, prokerIndex: number, field: keyof KabinetDepartemenProker, value: string) => {
    const newDeptList = [...departemen];
    newDeptList[deptIndex].proker[prokerIndex] = { ...newDeptList[deptIndex].proker[prokerIndex], [field]: value };
    onChange(newDeptList);
  };

  const currentTab = (deptIndex: number) => activeTab[deptIndex] || 'info';
  const setTab = (deptIndex: number, tab: 'info' | 'anggota' | 'proker') => setActiveTab({ ...activeTab, [deptIndex]: tab });

  return (
    <div className="bg-surface border border-outline-variant/30 rounded-2xl p-6">
      <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
        <h3 className="font-bold text-on-surface flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-orange-500/10 text-orange-600 flex items-center justify-center">
            <FiBriefcase size={16} />
          </div>
          Departemen & Kementerian
        </h3>
        <button
          type="button"
          onClick={handleAddDept}
          className="flex items-center gap-1.5 text-xs font-bold bg-orange-500/10 text-orange-600 hover:bg-orange-600 hover:text-white px-3 py-1.5 rounded-lg transition-colors"
        >
          <FiPlus size={14} /> Tambah Departemen
        </button>
      </div>

      <div className="space-y-4">
        {departemen.length === 0 ? (
          <div className="text-center py-8 bg-surface-variant/20 rounded-xl border border-dashed border-outline-variant/50">
            <p className="text-sm text-on-surface-variant">Belum ada departemen. Klik tombol tambah departemen.</p>
          </div>
        ) : (
          departemen.map((dept, deptIndex) => {
            const isExpanded = expandedIndex === deptIndex;
            const tab = currentTab(deptIndex);
            
            return (
              <div key={dept.id || deptIndex} className="border border-outline-variant/40 rounded-xl bg-background overflow-hidden shadow-sm">
                
                {/* Header */}
                <div 
                  className={`flex items-center justify-between p-4 cursor-pointer hover:bg-surface-variant/20 transition-colors ${isExpanded ? 'bg-surface-variant/20 border-b border-outline-variant/30' : ''}`}
                  onClick={() => setExpandedIndex(isExpanded ? null : deptIndex)}
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-xl shrink-0 ${dept.warnaBg} ${dept.warna}`}>
                      {dept.icon.startsWith('http') ? <img src={dept.icon} className="w-6 h-6 object-contain" alt="" /> : dept.icon || "🏢"}
                    </div>
                    <div>
                      <h4 className="font-bold text-sm text-on-surface">{dept.nama || "Nama Departemen"}</h4>
                      <p className="text-xs text-on-surface-variant">{dept.anggota.length} Anggota • {dept.proker.length} Proker</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={(e) => { e.stopPropagation(); handleRemoveDept(deptIndex); }}
                      className="w-8 h-8 flex items-center justify-center text-red-500 hover:bg-red-100 rounded-lg transition-colors"
                      title="Hapus Departemen"
                    >
                      <FiTrash2 size={16} />
                    </button>
                    <div className="w-8 h-8 flex items-center justify-center text-on-surface-variant">
                      {isExpanded ? <FiChevronUp /> : <FiChevronDown />}
                    </div>
                  </div>
                </div>

                {/* Body */}
                {isExpanded && (
                  <div className="bg-surface/50 border-b border-outline-variant/20">
                    
                    {/* Tabs */}
                    <div className="flex border-b border-outline-variant/30 px-2 pt-2">
                      <button type="button" onClick={() => setTab(deptIndex, 'info')} className={`px-4 py-2 text-xs font-bold border-b-2 transition-colors ${tab === 'info' ? 'border-primary text-primary' : 'border-transparent text-on-surface-variant hover:text-on-surface'}`}>Info Dasar</button>
                      <button type="button" onClick={() => setTab(deptIndex, 'anggota')} className={`px-4 py-2 text-xs font-bold border-b-2 transition-colors ${tab === 'anggota' ? 'border-primary text-primary' : 'border-transparent text-on-surface-variant hover:text-on-surface'}`}>Anggota ({dept.anggota.length})</button>
                      <button type="button" onClick={() => setTab(deptIndex, 'proker')} className={`px-4 py-2 text-xs font-bold border-b-2 transition-colors ${tab === 'proker' ? 'border-primary text-primary' : 'border-transparent text-on-surface-variant hover:text-on-surface'}`}>Proker ({dept.proker.length})</button>
                    </div>

                    {/* Info Tab */}
                    {tab === 'info' && (
                      <div className="p-4 md:p-5 grid grid-cols-1 md:grid-cols-2 gap-4 animate-init-fade-up">
                        <div className="space-y-1.5 md:col-span-2">
                          <label className="text-xs font-bold text-on-surface">Nama Departemen</label>
                          <input type="text" value={dept.nama} onChange={(e) => handleChangeDept(deptIndex, 'nama', e.target.value)} className="w-full bg-background border border-outline-variant/50 rounded-lg px-3 py-2 text-sm focus:border-primary outline-none" placeholder="Contoh: Departemen Komunikasi dan Informasi" />
                        </div>
                        <div className="space-y-1.5">
                          <label className="text-xs font-bold text-on-surface">Singkatan</label>
                          <input type="text" value={dept.singkatan} onChange={(e) => handleChangeDept(deptIndex, 'singkatan', e.target.value)} className="w-full bg-background border border-outline-variant/50 rounded-lg px-3 py-2 text-sm focus:border-primary outline-none uppercase" placeholder="KOMINFO" />
                        </div>
                        <div className="space-y-2 md:col-span-2">
                          <label className="text-xs font-bold text-on-surface">Ikon Departemen (Upload Lottie / Gambar / Link)</label>
                          <div className="flex flex-col sm:flex-row gap-4 items-start">
                            <div className="shrink-0">
                              <LottieUpload 
                                value={dept.icon} 
                                onChange={(url) => handleChangeDept(deptIndex, 'icon', url)} 
                                className="w-28" 
                              />
                            </div>
                            <div className="flex-1 w-full space-y-2">
                              <p className="text-[10px] text-on-surface-variant leading-relaxed">
                                💡 <strong>Upload File Custom:</strong> Klik kotak di kiri lalu pilih file animasi Lottie (<strong>.json</strong> atau <strong>.lottie</strong>) yang Anda download dari LottieFiles, atau upload gambar biasa.
                              </p>
                              <div className="space-y-1">
                                <label className="text-[10px] font-bold text-on-surface-variant">Atau Paste Asset URL / Link Direct Lottie JSON / Emoji:</label>
                                <input 
                                  type="text" 
                                  value={dept.icon} 
                                  onChange={(e) => handleChangeDept(deptIndex, 'icon', e.target.value)} 
                                  className="w-full bg-background border border-outline-variant/50 rounded-lg px-3 py-2 text-xs focus:border-primary outline-none font-mono" 
                                  placeholder="https://lottie.host/.../anim.json atau /animations/Calendar.lottie" 
                                />
                                {dept.icon.includes('/share/') && (
                                  <div className="p-2 rounded-lg bg-amber-500/10 border border-amber-500/30 text-amber-600 text-[10px] space-y-1 font-medium mt-1">
                                    <p className="font-bold flex items-center gap-1">⚠️ Perhatian: Link yang ditempel adalah Link Halaman Web Share</p>
                                    <p>Link web share (seperti <code>/share/...</code>) tidak bisa diputar langsung oleh pemutar Lottie.</p>
                                    <p className="font-bold text-primary">Solusi Mudah:</p>
                                    <ul className="list-disc pl-4 space-y-0.5">
                                      <li>Klik tombol <strong>Download</strong> di LottieFiles (.json atau .lottie), lalu klik kotak <strong>Upload Lottie</strong> di sebelah kiri.</li>
                                      <li>ATAU kopy <strong>Lottie JSON Asset URL</strong> (link langsung yang berakhiran <code>.json</code>).</li>
                                    </ul>
                                  </div>
                                )}
                              </div>
                              
                              {/* Quick Preset Lottie Buttons */}
                              <div className="pt-1">
                                <span className="text-[10px] font-bold text-on-surface-variant block mb-1">Preset Animasi Lokal BEM:</span>
                                <div className="flex flex-wrap gap-1.5">
                                  {[
                                    { label: "📢 Medkom", value: "/animations/Social Media Marketing announcement.lottie" },
                                    { label: "📅 Event/Agenda", value: "/animations/Calendar.lottie" },
                                    { label: "💻 Developer", value: "/animations/Developer.lottie" },
                                    { label: "💡 Visi (Lampu)", value: "/animations/lamp.lottie" },
                                    { label: "🎯 Misi (Target)", value: "/animations/Target.lottie" },
                                    { label: "❤️ Pengmas", value: "/animations/Heart Animated.lottie" },
                                    { label: "🚀 Humas", value: "/animations/Marketing Campaign - Creative 3D Animation.lottie" },
                                  ].map((item, idx) => (
                                    <button
                                      key={idx}
                                      type="button"
                                      onClick={() => handleChangeDept(deptIndex, 'icon', item.value)}
                                      className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border transition-all ${
                                        dept.icon === item.value
                                          ? "bg-primary text-white border-primary shadow-sm"
                                          : "bg-surface text-on-surface-variant border-outline-variant/40 hover:border-primary hover:text-primary"
                                      }`}
                                    >
                                      {item.label}
                                    </button>
                                  ))}
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                        {/* Color fields removed for simplicity as requested */}
                      </div>
                    )}

                    {/* Anggota Tab */}
                    {tab === 'anggota' && (
                      <div className="p-4 md:p-5 animate-init-fade-up space-y-4">
                        {dept.anggota.map((ang, angIdx) => (
                          <div key={angIdx} className="bg-background border border-outline-variant/50 p-4 rounded-xl relative group">
                            <button type="button" onClick={() => handleRemoveAnggota(deptIndex, angIdx)} className="absolute top-2 right-2 p-1.5 text-red-500 bg-red-50 hover:bg-red-500 hover:text-white rounded-lg transition-colors"><FiTrash2 size={14} /></button>
                            <div className="flex flex-col md:flex-row gap-4">
                              <div className="shrink-0 flex flex-col gap-1 items-center w-24">
                                <label className="text-[10px] font-bold text-on-surface-variant uppercase">Foto</label>
                                <ImageUpload value={ang.foto || ""} onChange={(url) => handleChangeAnggota(deptIndex, angIdx, 'foto', url)} className="w-full" />
                                <input 
                                  type="text" 
                                  value={ang.foto || ""} 
                                  onChange={(e) => handleChangeAnggota(deptIndex, angIdx, 'foto', e.target.value)} 
                                  className="w-full mt-1 text-center bg-surface border border-outline-variant/50 rounded-lg px-2 py-1.5 text-[10px] focus:border-primary focus:ring-1 focus:ring-primary outline-none" 
                                  placeholder="Link foto" 
                                />
                              </div>
                              <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 gap-3">
                                <div className="space-y-1">
                                  <label className="text-xs font-bold text-on-surface">Nama Anggota</label>
                                  <input type="text" value={ang.name} onChange={(e) => handleChangeAnggota(deptIndex, angIdx, 'name', e.target.value)} className="w-full bg-surface border border-outline-variant/50 rounded-md px-2.5 py-1.5 text-xs outline-none" placeholder="Nama" />
                                </div>
                                <div className="space-y-1">
                                  <label className="text-xs font-bold text-on-surface">Jabatan</label>
                                  <input type="text" value={ang.role} onChange={(e) => handleChangeAnggota(deptIndex, angIdx, 'role', e.target.value)} className="w-full bg-surface border border-outline-variant/50 rounded-md px-2.5 py-1.5 text-xs outline-none" placeholder="Staff Ahli" />
                                </div>
                                <div className="space-y-1">
                                  <label className="text-xs font-bold text-on-surface">Link Instagram</label>
                                  <input type="text" value={ang.ig} onChange={(e) => handleChangeAnggota(deptIndex, angIdx, 'ig', e.target.value)} className="w-full bg-surface border border-outline-variant/50 rounded-md px-2.5 py-1.5 text-xs outline-none" placeholder="https://instagram.com/..." />
                                </div>
                                <div className="space-y-1">
                                  <label className="text-xs font-bold text-on-surface">Link WhatsApp</label>
                                  <input type="text" value={ang.wa || ""} onChange={(e) => handleChangeAnggota(deptIndex, angIdx, 'wa', e.target.value)} className="w-full bg-surface border border-outline-variant/50 rounded-md px-2.5 py-1.5 text-xs outline-none" placeholder="https://wa.me/..." />
                                </div>
                                <div className="space-y-1 sm:col-span-2">
                                  <label className="text-xs font-bold text-on-surface">Inisial</label>
                                  <input type="text" value={ang.initials} onChange={(e) => handleChangeAnggota(deptIndex, angIdx, 'initials', e.target.value)} className="w-full bg-surface border border-outline-variant/50 rounded-md px-2.5 py-1.5 text-xs outline-none uppercase" placeholder="XX" maxLength={3} />
                                </div>
                              </div>
                            </div>
                          </div>
                        ))}
                        <button type="button" onClick={() => handleAddAnggota(deptIndex)} className="w-full py-3 rounded-xl border-2 border-dashed border-outline-variant/50 text-sm font-bold text-on-surface-variant hover:text-primary hover:border-primary hover:bg-primary/5 transition-colors flex items-center justify-center gap-2">
                          <FiPlus /> Tambah Anggota
                        </button>
                      </div>
                    )}

                    {/* Proker Tab */}
                    {tab === 'proker' && (
                      <div className="p-4 md:p-5 animate-init-fade-up space-y-4">
                        {dept.proker.map((pr, prIdx) => (
                          <div key={prIdx} className="bg-background border border-outline-variant/50 p-4 rounded-xl relative group flex flex-col sm:flex-row gap-4 items-start">
                            <button type="button" onClick={() => handleRemoveProker(deptIndex, prIdx)} className="absolute top-2 right-2 p-1.5 text-red-500 bg-red-50 hover:bg-red-500 hover:text-white rounded-lg transition-colors z-10"><FiTrash2 size={14} /></button>
                            
                            <div className="shrink-0 flex flex-col items-center gap-1 w-full sm:w-24">
                              <label className="text-[10px] font-bold text-on-surface-variant uppercase">Ikon Proker</label>
                              <LottieUpload value={pr.icon || ""} onChange={(url) => handleChangeProker(deptIndex, prIdx, 'icon', url)} className="w-20" />
                              <input 
                                type="text" 
                                value={pr.icon || ""} 
                                onChange={(e) => handleChangeProker(deptIndex, prIdx, 'icon', e.target.value)} 
                                className="w-full text-center bg-surface border border-outline-variant/50 rounded-lg px-2 py-1 text-[10px] focus:border-primary outline-none font-mono mt-1" 
                                placeholder="Link lottie" 
                              />
                            </div>

                            <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 gap-3 w-full pr-8">
                              <div className="space-y-1">
                                <label className="text-xs font-bold text-on-surface">Nama Proker</label>
                                <input type="text" value={pr.nama} onChange={(e) => handleChangeProker(deptIndex, prIdx, 'nama', e.target.value)} className="w-full bg-surface border border-outline-variant/50 rounded-md px-2.5 py-1.5 text-xs outline-none" placeholder="Nama Program" />
                              </div>
                              <div className="space-y-1">
                                <label className="text-xs font-bold text-on-surface">Tag / Kategori</label>
                                <input type="text" value={pr.tag} onChange={(e) => handleChangeProker(deptIndex, prIdx, 'tag', e.target.value)} className="w-full bg-surface border border-outline-variant/50 rounded-md px-2.5 py-1.5 text-xs outline-none" placeholder="Wajib / Pilihan" />
                              </div>
                              <div className="space-y-1 sm:col-span-2">
                                <label className="text-xs font-bold text-on-surface">Deskripsi Proker</label>
                                <textarea value={pr.deskripsi} onChange={(e) => handleChangeProker(deptIndex, prIdx, 'deskripsi', e.target.value)} className="w-full bg-surface border border-outline-variant/50 rounded-md px-2.5 py-1.5 text-xs outline-none min-h-[60px]" placeholder="Deskripsi..." />
                              </div>
                            </div>
                          </div>
                        ))}
                        <button type="button" onClick={() => handleAddProker(deptIndex)} className="w-full py-3 rounded-xl border-2 border-dashed border-outline-variant/50 text-sm font-bold text-on-surface-variant hover:text-primary hover:border-primary hover:bg-primary/5 transition-colors flex items-center justify-center gap-2">
                          <FiPlus /> Tambah Proker
                        </button>
                      </div>
                    )}

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
