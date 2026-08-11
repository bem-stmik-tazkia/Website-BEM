"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { FiHome, FiLogOut } from "react-icons/fi";
import { createClient } from "@/utils/supabase/client";
import AdminNotificationBell from "./AdminNotificationBell";

export default function AdminTopbar({ user }: { user?: any }) {
  const router = useRouter();
  const supabase = createClient();
  const [imgError, setImgError] = useState(false);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  };

  const fullName = user?.user_metadata?.full_name || "BEM Tazkia";
  const avatarUrl = user?.user_metadata?.avatar_url;
  const initial = fullName.charAt(0).toUpperCase();

  return (
    <header className="w-full bg-surface border-b border-outline-variant/30 shadow-sm px-6 py-4 flex items-center justify-end gap-6 sticky top-0 z-10 transition-colors duration-300">
      
      {/* Profile Card */}
      <div className="flex items-center gap-3">
        <div className="text-right hidden sm:block">
          <p className="text-sm font-bold text-on-surface leading-tight">{fullName}</p>
          <p className="text-xs text-on-surface-variant">Administrator</p>
        </div>
        {avatarUrl && !imgError ? (
          <img 
            src={avatarUrl} 
            alt="Avatar" 
            className="w-10 h-10 rounded-full border border-outline-variant/50 shrink-0 object-cover" 
            onError={() => setImgError(true)}
          />
        ) : (
          <div className="w-10 h-10 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold border border-primary/20 shrink-0">
            {initial}
          </div>
        )}
      </div>

      <div className="w-px h-8 bg-outline-variant/30"></div>

      {/* Notification Bell */}
      <AdminNotificationBell />

      <div className="w-px h-8 bg-outline-variant/30"></div>

      {/* Actions */}
      <div className="flex items-center gap-3">
        <Link 
          href="/" 
          title="Kembali ke Web"
          className="flex items-center justify-center w-10 h-10 rounded-full text-on-surface-variant hover:bg-surface-variant hover:text-on-surface transition-colors border border-outline-variant/30 shadow-sm"
        >
          <FiHome size={18} />
        </Link>
        <button 
          onClick={handleLogout}
          title="Logout"
          className="flex items-center justify-center w-10 h-10 rounded-full text-red-500 hover:bg-red-500/10 hover:text-red-500 transition-colors border border-red-500/20 shadow-sm"
        >
          <FiLogOut size={18} />
        </button>
      </div>

    </header>
  );
}
