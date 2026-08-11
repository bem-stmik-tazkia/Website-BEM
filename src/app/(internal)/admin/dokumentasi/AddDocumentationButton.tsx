"use client";

import React, { useState } from "react";
import Link from "next/link";
import { FiPlus, FiX, FiImage, FiFileText } from "react-icons/fi";
import { motion, AnimatePresence } from "framer-motion";
import { useRouter } from "next/navigation";

export default function AddDocumentationButton() {
  const [showModal, setShowModal] = useState(false);
  const router = useRouter();

  return (
    <>
      <button 
        onClick={() => setShowModal(true)}
        className="flex items-center gap-2 bg-primary text-white px-4 py-2.5 rounded-xl font-bold text-sm hover:bg-primary/90 transition-all hover:shadow-md"
      >
        <FiPlus size={18} /> <span>Tambah Dokumentasi</span>
      </button>

      <AnimatePresence>
        {showModal && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowModal(false)}
              className="absolute inset-0 bg-black/40 backdrop-blur-sm"
            />
            
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative bg-surface w-full max-w-lg rounded-2xl shadow-xl overflow-hidden text-left border border-outline-variant/30"
            >
              <div className="p-5 border-b border-outline-variant/30 flex justify-between items-center">
                <h3 className="font-bold text-lg text-on-surface">Pilih Tipe Dokumentasi</h3>
                <button 
                  onClick={() => setShowModal(false)}
                  className="text-on-surface-variant hover:text-on-surface p-1 rounded-full hover:bg-surface-variant/50 transition-colors"
                >
                  <FiX size={20} />
                </button>
              </div>
              
              <div className="p-5 space-y-4">
                <p className="text-on-surface-variant text-sm mb-4">Pilih format pengisian data dokumentasi yang paling sesuai dengan kebutuhanmu.</p>
                
                <button 
                  onClick={() => { setShowModal(false); router.push("/admin/dokumentasi/tambah"); }}
                  className="w-full text-left p-4 rounded-xl border border-outline-variant/50 hover:border-primary hover:bg-primary/5 transition-all group"
                >
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 rounded-full bg-primary/10 text-primary flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform">
                      <FiImage size={24} />
                    </div>
                    <div>
                      <h4 className="font-bold text-on-surface mb-1">Dokumentasi Biasa (Cepat)</h4>
                      <p className="text-xs text-on-surface-variant leading-relaxed">Form simpel untuk dokumentasi ringan seperti Galeri Baksos, kunjungan, atau acara tanpa pembicara khusus. (Hanya Judul, Foto, Kategori & Waktu).</p>
                    </div>
                  </div>
                </button>

                <button 
                  onClick={() => { setShowModal(false); router.push("/admin/kegiatan/form?type=dokumentasi&from=dokumentasi"); }}
                  className="w-full text-left p-4 rounded-xl border border-outline-variant/50 hover:border-secondary hover:bg-secondary/5 transition-all group"
                >
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 rounded-full bg-secondary/10 text-secondary flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform">
                      <FiFileText size={24} />
                    </div>
                    <div>
                      <h4 className="font-bold text-on-surface mb-1">Dokumentasi Event Lengkap</h4>
                      <p className="text-xs text-on-surface-variant leading-relaxed">Gunakan ini jika ingin mengarsipkan acara besar masa lalu secara lengkap, beserta data Pembicara / Pemateri, Deskripsi Lengkap, dan Lokasi Detail.</p>
                    </div>
                  </div>
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
}
