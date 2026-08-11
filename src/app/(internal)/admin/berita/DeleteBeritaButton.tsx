"use client";
import React, { useState } from "react";
import { FiTrash2, FiAlertTriangle, FiX } from "react-icons/fi";
import { motion, AnimatePresence } from "framer-motion";
import { useToast } from "@/components/ui/Toast";
import { useTransition } from "react";

export default function DeleteBeritaButton({ id, action }: { id: string, action: (formData: FormData) => Promise<void> }) {
  const [showModal, setShowModal] = useState(false);
  const { toast } = useToast();
  const [isPending, startTransition] = useTransition();

  const handleConfirm = () => {
    startTransition(async () => {
      try {
        const formData = new FormData();
        formData.append("id", id);
        await action(formData);
        toast("Berita berhasil dihapus!", "success");
        setShowModal(false);
      } catch (error) {
        toast("Gagal menghapus berita.", "error");
      }
    });
  };

  return (
    <>
      <button
        type="button"
        className="p-2.5 text-red-500 hover:bg-red-50 rounded-lg transition-colors cursor-pointer"
        title="Hapus Berita"
        onClick={() => setShowModal(true)}
      >
        <FiTrash2 size={16} />
      </button>

      <AnimatePresence>
        {showModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/40 backdrop-blur-sm"
              onClick={() => setShowModal(false)}
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
                  Hapus Berita
                </h3>
                <button 
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="text-on-surface-variant hover:text-on-surface p-1 rounded-full hover:bg-surface-variant/50 transition-colors cursor-pointer"
                >
                  <FiX size={20} />
                </button>
              </div>
              
              <div className="p-5">
                <p className="text-on-surface-variant text-sm mb-6 leading-relaxed">
                  Apakah kamu yakin ingin menghapus berita ini? Tindakan ini tidak dapat dibatalkan.
                </p>
                
                <div className="flex justify-end gap-3">
                  <button
                    type="button"
                    onClick={() => setShowModal(false)}
                    className="px-4 py-2 rounded-xl text-sm font-semibold text-on-surface-variant bg-surface-variant/30 hover:bg-surface-variant/50 transition-colors cursor-pointer"
                  >
                    Batal
                  </button>
                  <button
                    type="button"
                    onClick={handleConfirm}
                    disabled={isPending}
                    className="px-4 py-2 rounded-xl text-sm font-bold text-white bg-red-600 hover:bg-red-700 transition-colors shadow-sm cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isPending ? "Menghapus..." : "Ya, Hapus"}
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
}
