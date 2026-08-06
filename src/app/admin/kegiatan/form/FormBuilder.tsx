"use client";

import React from "react";
import { FiPlus, FiTrash2, FiAlignLeft, FiType, FiFile, FiImage, FiHash, FiMail, FiPhone, FiMenu } from "react-icons/fi";
import { DynamicFormField } from "@/types/agenda";

interface FormBuilderProps {
  fields: DynamicFormField[];
  onChange: (fields: DynamicFormField[]) => void;
}

export default function FormBuilder({ fields, onChange }: FormBuilderProps) {
  const [draggedIndex, setDraggedIndex] = React.useState<number | null>(null);

  const handleDragStart = (e: React.DragEvent, index: number) => {
    setDraggedIndex(index);
    e.dataTransfer.effectAllowed = "move";
    e.dataTransfer.setData("text/html", index.toString());
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
  };

  const handleDrag = (e: React.DragEvent) => {
    if (e.clientY > 0) {
      const buffer = 100;
      if (e.clientY < buffer) {
        window.scrollBy(0, -15);
      } else if (window.innerHeight - e.clientY < buffer) {
        window.scrollBy(0, 15);
      }
    }
  };

  const handleDrop = (e: React.DragEvent, dropIndex: number) => {
    e.preventDefault();
    if (draggedIndex === null || draggedIndex === dropIndex) {
      setDraggedIndex(null);
      return;
    }
    const newFields = [...fields];
    const draggedItem = newFields[draggedIndex];
    newFields.splice(draggedIndex, 1);
    newFields.splice(dropIndex, 0, draggedItem);
    onChange(newFields);
    setDraggedIndex(null);
  };

  const addField = (type: DynamicFormField['type']) => {
    const newId = `field_${Date.now()}`;
    const newField: DynamicFormField = {
      id: newId,
      type,
      label: `Pertanyaan Baru (${type})`,
      required: true,
      placeholder: ""
    };
    onChange([...fields, newField]);

    // Auto scroll to the new field after DOM updates
    setTimeout(() => {
      const el = document.getElementById(newId);
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'center' });
        // Optional: highlight it briefly
        el.classList.add('ring-2', 'ring-primary');
        setTimeout(() => el.classList.remove('ring-2', 'ring-primary'), 1000);
      }
    }, 100);
  };

  const removeField = (id: string) => {
    onChange(fields.filter(f => f.id !== id));
  };

  const updateField = (id: string, updates: Partial<DynamicFormField>) => {
    onChange(fields.map(f => f.id === id ? { ...f, ...updates } : f));
  };

  const getIcon = (type: string) => {
    switch (type) {
      case 'text': return <FiType />;
      case 'textarea': return <FiAlignLeft />;
      case 'number': return <FiHash />;
      case 'email': return <FiMail />;
      case 'tel': return <FiPhone />;
      case 'file': return <FiFile />;
      case 'image': return <FiImage />;
      default: return <FiType />;
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <label className="text-sm font-bold text-on-surface">Penyusun Formulir (Dynamic Form Builder)</label>
        <div className="flex flex-wrap gap-2">
          <button type="button" onClick={() => addField('text')} className="flex items-center gap-1 text-xs font-bold bg-blue-50 text-blue-600 px-3 py-1.5 rounded-lg hover:bg-blue-100 transition-colors" title="Tambah Teks Pendek"><FiPlus /> Teks</button>
          <button type="button" onClick={() => addField('textarea')} className="flex items-center gap-1 text-xs font-bold bg-green-50 text-green-600 px-3 py-1.5 rounded-lg hover:bg-green-100 transition-colors" title="Tambah Paragraf"><FiPlus /> Paragraf</button>
          <button type="button" onClick={() => addField('number')} className="flex items-center gap-1 text-xs font-bold bg-indigo-50 text-indigo-600 px-3 py-1.5 rounded-lg hover:bg-indigo-100 transition-colors" title="Tambah Angka"><FiPlus /> Angka</button>
          <button type="button" onClick={() => addField('email')} className="flex items-center gap-1 text-xs font-bold bg-teal-50 text-teal-600 px-3 py-1.5 rounded-lg hover:bg-teal-100 transition-colors" title="Tambah Email"><FiPlus /> Email</button>
          <button type="button" onClick={() => addField('tel')} className="flex items-center gap-1 text-xs font-bold bg-cyan-50 text-cyan-600 px-3 py-1.5 rounded-lg hover:bg-cyan-100 transition-colors" title="Tambah No Telepon/WA"><FiPlus /> No WA</button>
          <button type="button" onClick={() => addField('file')} className="flex items-center gap-1 text-xs font-bold bg-orange-50 text-orange-600 px-3 py-1.5 rounded-lg hover:bg-orange-100 transition-colors" title="Tambah Upload Dokumen"><FiPlus /> Dokumen</button>
          <button type="button" onClick={() => addField('image')} className="flex items-center gap-1 text-xs font-bold bg-purple-50 text-purple-600 px-3 py-1.5 rounded-lg hover:bg-purple-100 transition-colors" title="Tambah Upload Gambar"><FiPlus /> Gambar</button>
        </div>
      </div>
      
      {fields.length === 0 ? (
        <div className="p-8 border border-dashed border-outline-variant/50 rounded-xl text-center text-on-surface-variant bg-surface-variant/10 text-sm">
          Belum ada pertanyaan. Tambahkan pertanyaan untuk formulir pendaftaran ini.
        </div>
      ) : (
        <div className="space-y-3">
          {fields.map((field, index) => (
            <div 
              key={field.id} 
              id={field.id}
              draggable
              onDragStart={(e) => handleDragStart(e, index)}
              onDragOver={handleDragOver}
              onDrag={handleDrag}
              onDrop={(e) => handleDrop(e, index)}
              onDragEnd={() => setDraggedIndex(null)}
              className={`p-4 border rounded-xl bg-surface flex flex-col md:flex-row gap-4 md:items-start group transition-all ${
                draggedIndex === index ? 'opacity-50 border-primary border-dashed' : 'border-outline-variant/30 hover:border-outline-variant/60'
              }`}
            >
              <div className="flex flex-col items-center gap-2 mt-1">
                <div 
                  className="w-8 h-8 rounded-full bg-surface-variant flex items-center justify-center text-on-surface-variant cursor-grab active:cursor-grabbing hover:bg-primary hover:text-white transition-colors"
                  title="Tarik untuk memindahkan (Drag & Drop)"
                >
                  <FiMenu />
                </div>
                <div className="text-xs font-bold text-on-surface-variant/50">#{index + 1}</div>
              </div>
              <div className="flex-grow space-y-3">
                <div className="flex items-center gap-2 text-xs font-bold text-on-surface-variant uppercase tracking-wider mb-1">
                  {getIcon(field.type)} 
                  {field.type === 'text' && <span>Teks Pendek <span className="text-[10px] font-normal text-on-surface-variant/70 normal-case ml-1">(Maks. 100 karakter)</span></span>}
                  {field.type === 'textarea' && <span>Teks Panjang / Paragraf <span className="text-[10px] font-normal text-on-surface-variant/70 normal-case ml-1">(Maks. 500 karakter)</span></span>}
                  {field.type === 'number' && <span>Angka <span className="text-[10px] font-normal text-on-surface-variant/70 normal-case ml-1">(Maks. 20 digit)</span></span>}
                  {field.type === 'email' && <span>Alamat Email <span className="text-[10px] font-normal text-on-surface-variant/70 normal-case ml-1">(Maks. 100 karakter)</span></span>}
                  {field.type === 'tel' && <span>Nomor Telepon / WA <span className="text-[10px] font-normal text-on-surface-variant/70 normal-case ml-1">(Maks. 15 digit)</span></span>}
                  {field.type === 'file' && <span>Upload Dokumen / File <span className="text-[10px] font-normal text-on-surface-variant/70 normal-case ml-1">(Maks. 5MB)</span></span>}
                  {field.type === 'image' && <span>Upload Gambar <span className="text-[10px] font-normal text-on-surface-variant/70 normal-case ml-1">(Maks. 5MB)</span></span>}
                </div>
                
                <input 
                  type="text" 
                  value={field.label} 
                  onChange={(e) => updateField(field.id, { label: e.target.value })} 
                  className="w-full bg-background border border-outline-variant/50 rounded-xl px-4 py-2.5 text-sm focus:border-primary outline-none font-bold" 
                  placeholder="Pertanyaan (Contoh: Nama Lengkap)"
                />
                
                {['text', 'textarea', 'number', 'email', 'tel'].includes(field.type) && (
                  <input 
                    type="text" 
                    value={field.placeholder || ""} 
                    onChange={(e) => updateField(field.id, { placeholder: e.target.value })} 
                    className="w-full bg-background border border-outline-variant/50 rounded-xl px-4 py-2 text-xs focus:border-primary outline-none" 
                    placeholder="Teks bantuan bayangan (Placeholder) - Opsional"
                  />
                )}
                
                <div className="flex justify-between items-center pt-2">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input 
                      type="checkbox" 
                      checked={field.required} 
                      onChange={(e) => updateField(field.id, { required: e.target.checked })} 
                      className="w-4 h-4 text-primary focus:ring-primary rounded" 
                    />
                    <span className="text-xs font-bold text-on-surface">Wajib Diisi</span>
                  </label>
                  
                  <button 
                    type="button" 
                    onClick={() => removeField(field.id)}
                    className="text-red-500 hover:bg-red-50 p-2 rounded-lg transition-colors"
                    title="Hapus Pertanyaan"
                  >
                    <FiTrash2 size={16} />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
