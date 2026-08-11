"use client";

import React, { useState } from "react";
import { FiTrash2, FiAlertTriangle, FiX } from "react-icons/fi";
import { motion, AnimatePresence } from "framer-motion";

export default function DeleteButton({ id, action }: { id: string, action: (formData: FormData) => void }) {
  const [showModal, setShowModal] = useState(false);

  return (
    <>
      <button
        type="button"
        className="w-8 h-8 rounded-lg bg-red-50 text-red-600 flex items-center justify-center hover:bg-red-600 hover:text-white transition-colors cursor-pointer"
        title="Hapus"
        onClick={() => setShowModal(true)}
      >
        <FiTrash2 size={14} />
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
                  Hapus Data
                </h3>
                <button 
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="text-on-surface-variant hover:text-on-surface p-1 rounded-full hover:bg-surface-variant/50 transition-colors"
                >
                  <FiX size={20} />
                </button>
              </div>
              
              <div className="p-5">
                <p className="text-on-surface-variant text-sm mb-6 leading-relaxed">
                  Apakah kamu yakin ingin menghapus data ini? Tindakan ini tidak dapat dibatalkan.
                </p>
                
                <div className="flex justify-end gap-3">
                  <button
                    type="button"
                    onClick={() => setShowModal(false)}
                    className="px-4 py-2 rounded-xl text-sm font-semibold text-on-surface-variant bg-surface-variant/30 hover:bg-surface-variant/50 transition-colors"
                  >
                    Batal
                  </button>
                  <form action={action} onSubmit={() => setShowModal(false)}>
                    <input type="hidden" name="id" value={id} />
                    <button
                      type="submit"
                      className="px-4 py-2 rounded-xl text-sm font-bold text-white bg-red-600 hover:bg-red-700 transition-colors shadow-sm"
                    >
                      Ya, Hapus
                    </button>
                  </form>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
}
