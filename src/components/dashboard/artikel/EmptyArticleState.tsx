"use client";

import React from "react";
import { Link } from "@/i18n/routing";
import { FiEdit3, FiFileText } from "react-icons/fi";

interface Props {
  hasFilter: boolean;
  onResetFilter?: () => void;
}

export default function EmptyArticleState({ hasFilter, onResetFilter }: Props) {
  if (hasFilter) {
    return (
      <div className="flex flex-col items-center justify-center p-8 sm:p-12 text-center bg-surface border border-outline-variant/30 rounded-2xl">
        <div className="w-14 h-14 rounded-2xl bg-surface-variant/40 flex items-center justify-center text-on-surface-variant mb-3">
          <FiFileText size={28} />
        </div>
        <h4 className="font-bold text-base text-on-surface">Tidak ada artikel yang cocok</h4>
        <p className="text-xs text-on-surface-variant mt-1 max-w-xs">
          Coba ganti kata kunci pencarian atau ubah tab filter kategori di atas.
        </p>
        {onResetFilter && (
          <button
            onClick={onResetFilter}
            type="button"
            className="mt-4 px-4 py-2 bg-surface border border-outline-variant/40 text-on-surface text-xs font-semibold rounded-xl hover:bg-surface-variant/30 transition-colors cursor-pointer"
          >
            Reset Filter
          </button>
        )}
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center p-8 sm:p-16 text-center bg-surface border border-dashed border-outline-variant/50 rounded-3xl animate-fade-in">
      <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-3xl bg-primary/10 text-primary flex items-center justify-center mb-4 shadow-inner">
        <FiEdit3 size={32} />
      </div>
      <h3 className="text-lg sm:text-xl font-bold text-on-surface">
        Belum Ada Artikel yang Ditulis
      </h3>
      <p className="text-xs sm:text-sm text-on-surface-variant mt-1.5 max-w-md leading-relaxed">
        Suarakan aspirasi, karya ilmiah, liputan kegiatan, atau opini positif Anda untuk mahasiswa STMIK Tazkia. Tulisan yang dikirimkan akan dimoderasi oleh pengurus BEM sebelum diterbitkan.
      </p>
      <Link
        href="/dashboard/artikel/baru"
        className="mt-6 inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-primary hover:bg-primary/90 text-white font-bold text-xs sm:text-sm shadow-md shadow-primary/25 transition-all hover:scale-[1.02]"
      >
        <FiEdit3 size={16} />
        <span>Tulis Artikel Pertama Anda</span>
      </Link>
    </div>
  );
}

