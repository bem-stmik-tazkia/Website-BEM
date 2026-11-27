"use client";

import React, { useState, useRef, useEffect } from "react";
import { FiSearch, FiUser } from "react-icons/fi";
import UserAvatar from "@/components/ui/UserAvatar";

interface Profile {
  user_id: string;
  full_name: string;
  avatar_url: string;
}

interface TeamMemberAutocompleteProps {
  value: string;
  onChange: (value: string, user_id?: string, avatar?: string) => void;
  mahasiswaList: Profile[];
  placeholder?: string;
  id?: string;
  disabled?: boolean;
}

export default function TeamMemberAutocomplete({ value, onChange, mahasiswaList, placeholder, id, disabled }: TeamMemberAutocompleteProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState("");
  const wrapperRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const filteredList = mahasiswaList.filter(
    m => m.full_name?.toLowerCase().includes(search.toLowerCase())
  );

  const handleSelect = (profile: Profile) => {
    onChange(profile.full_name, profile.user_id, profile.avatar_url);
    setSearch("");
    setIsOpen(false);
  };

  const handleManualTyping = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setSearch(val);
    onChange(val, "", ""); // Reset user_id and avatar if manually typed
    setIsOpen(true);
  };

  return (
    <div className="relative w-full" ref={wrapperRef}>
      <input
        id={id}
        type="text"
        value={value || search}
        onChange={handleManualTyping}
        onFocus={() => !disabled && setIsOpen(true)}
        placeholder={placeholder}
        disabled={disabled}
        className={`w-full bg-surface border border-outline-variant/30 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-[var(--color-primary)] focus:ring-1 focus:ring-[var(--color-primary)] transition-all ${disabled ? 'opacity-70 cursor-not-allowed bg-surface-variant/30 text-on-surface-variant' : ''}`}
      />
      
      {isOpen && (
        <div className="absolute top-full left-0 w-full mt-1 bg-surface border border-outline-variant/30 rounded-xl shadow-xl z-50 max-h-60 overflow-y-auto">
          {search && (
            <div className="px-4 py-2 text-xs text-on-surface-variant bg-surface-variant/20 border-b border-outline-variant/20 flex items-center gap-2">
              <FiSearch /> Mencari: "{search}"
            </div>
          )}
          
          {filteredList.length > 0 ? (
            <div className="p-1">
              {filteredList.map((m, idx) => (
                <div
                  key={idx}
                  onClick={() => handleSelect(m)}
                  className="flex items-center gap-3 px-3 py-2 hover:bg-surface-variant/30 cursor-pointer rounded-lg transition-colors"
                >
                  <div className="w-8 h-8 rounded-full overflow-hidden shrink-0 bg-primary/10 flex items-center justify-center border border-outline-variant/30">
                    <UserAvatar
                      src={m.avatar_url}
                      alt={m.full_name}
                      size={32}
                      fallback={<FiUser className="text-primary" />}
                    />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-on-surface line-clamp-1">{m.full_name}</p>
                    <p className="text-[10px] text-on-surface-variant">Mahasiswa Terdaftar</p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="p-4 text-center text-xs text-on-surface-variant">
              Tidak ada mahasiswa ditemukan.<br/>Ketik nama secara manual untuk anggota luar.
            </div>
          )}
        </div>
      )}
    </div>
  );
}
