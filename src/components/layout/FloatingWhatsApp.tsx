"use client";

import { motion, AnimatePresence } from "framer-motion";
import { useState, useEffect } from "react";
import { SiWhatsapp } from "react-icons/si";
import { FiX } from "react-icons/fi";
import { createClient } from "@/utils/supabase/client";

export default function FloatingWhatsApp() {
  const [phone, setPhone] = useState<string>("");
  const [isOpen, setIsOpen] = useState(false);
  const [hasLoaded, setHasLoaded] = useState(false);

  useEffect(() => {
    async function fetchPhone() {
      try {
        const supabase = createClient();
        const { data, error } = await supabase
          .from("system_settings")
          .select("value")
          .eq("key", "admin_whatsapp")
          .maybeSingle();
          
        if (!error && data?.value) {
          setPhone(data.value);
        }
      } catch (e) {
        // ignore
      } finally {
        setHasLoaded(true);
      }
    }
    fetchPhone();
  }, []);

  if (!hasLoaded || !phone) return null;

  // Format phone for wa.me link (remove leading 0 or +62 and replace with 62)
  const formattedPhone = phone.startsWith("0") 
    ? `62${phone.substring(1)}` 
    : phone.replace(/[^0-9]/g, "");

  const waLink = `https://wa.me/${formattedPhone}`;

  return (
    <div className="fixed bottom-[10.5rem] right-4 md:bottom-24 md:right-6 z-[60] flex flex-col items-end">
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.9 }}
            transition={{ type: "spring", stiffness: 300, damping: 25 }}
            className="mb-4 bg-surface rounded-2xl shadow-xl border border-outline-variant/30 overflow-hidden w-72 origin-bottom-right"
          >
            <div className="bg-[#25D366] p-4 flex items-center justify-between text-white">
              <div className="flex items-center gap-3">
                <SiWhatsapp size={24} />
                <h3 className="font-bold">Hubungi Admin</h3>
              </div>
              <button 
                onClick={() => setIsOpen(false)}
                className="text-white/80 hover:text-white p-1 rounded-full hover:bg-white/20 transition-colors"
                aria-label="Tutup"
              >
                <FiX size={18} />
              </button>
            </div>
            <div className="p-5 bg-surface">
              <p className="text-sm text-on-surface-variant mb-4">
                Halo! Butuh bantuan atau ada pertanyaan terkait BEM STMIK Tazkia? Silakan hubungi kami via WhatsApp.
              </p>
              <a
                href={waLink}
                target="_blank"
                rel="noopener noreferrer"
                className="block w-full text-center bg-[#25D366] hover:bg-[#20b858] text-white font-bold py-2.5 rounded-xl transition-all shadow-md hover:shadow-lg active:scale-95"
              >
                Mulai Chat
              </a>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <motion.button
        onClick={() => setIsOpen(!isOpen)}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        className="w-14 h-14 bg-[#25D366] text-white rounded-full flex items-center justify-center shadow-lg hover:shadow-xl transition-shadow relative"
        aria-label="WhatsApp Admin"
      >
        <motion.div
          animate={!isOpen ? { 
            scale: [1, 1.2, 1],
            rotate: [0, 10, -10, 0]
          } : {}}
          transition={{ 
            repeat: Infinity, 
            duration: 2, 
            repeatDelay: 3 
          }}
        >
          {isOpen ? <FiX size={26} /> : <SiWhatsapp size={28} />}
        </motion.div>
        
        {/* Pulse effect */}
        {!isOpen && (
          <span className="absolute w-full h-full rounded-full bg-[#25D366] opacity-40 animate-ping" style={{ animationDuration: '3s' }}></span>
        )}
      </motion.button>
    </div>
  );
}
