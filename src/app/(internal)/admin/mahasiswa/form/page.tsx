"use client";

import React, { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { FiArrowLeft, FiSave } from "react-icons/fi";
import { getMahasiswaById, saveMahasiswa } from "../actions";
import { useToast } from "@/components/ui/Toast";

export default function AdminMahasiswaFormPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const id = searchParams?.get("id");
  const toast = useToast();

  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(!!id);

  const [formData, setFormData] = useState({
    full_name: "",
    email: "",
    angkatan: "2",
    prodi: "Teknik Informatika",
    is_featured: false,
  });
  
  const [isDirty, setIsDirty] = useState(false);

  // Load from local storage on initial mount if adding new
  useEffect(() => {
    if (!id) {
      const savedDraft = localStorage.getItem("mahasiswaDraft");
      if (savedDraft) {
        try {
          setFormData(JSON.parse(savedDraft));
          setIsDirty(true);
        } catch (e) {
          console.error("Failed to parse draft", e);
        }
      }
      setFetching(false);
    }
  }, [id]);

  useEffect(() => {
    if (id) {
      const fetchInitial = async () => {
        const data = await getMahasiswaById(id);
        if (data) {
          setFormData({
            full_name: data.full_name || "",
            email: data.email || "",
            angkatan: data.angkatan ? data.angkatan.toString() : "2",
            prodi: data.prodi || "Teknik Informatika",
            is_featured: data.is_featured || false,
          });
          setIsDirty(false); // Reset dirty for edit mode
        }
        setFetching(false);
      };
      fetchInitial();
    }
  }, [id]);

  // Handle browser refresh/close warning
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (isDirty) {
        e.preventDefault();
        e.returnValue = "";
      }
    };
    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, [isDirty]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    let newValue: string | boolean = value;
    
    if (type === "checkbox") {
      newValue = (e.target as HTMLInputElement).checked;
    }
    
    const newFormData = { ...formData, [name]: newValue };
    setFormData(newFormData);
    setIsDirty(true);
    
    // Auto-save draft if creating new
    if (!id) {
      localStorage.setItem("mahasiswaDraft", JSON.stringify(newFormData));
    }
  };

  const handleCancel = (e: React.MouseEvent) => {
    e.preventDefault();
    if (isDirty) {
      if (!window.confirm("Kamu memiliki perubahan yang belum disimpan. Yakin ingin membatalkan?")) {
        return;
      }
    }
    router.push("/admin/mahasiswa");
  };

  if (fetching) {
    return <div className="p-10 text-center font-bold text-primary">Memuat data profil...</div>;
  }

  return (
    <div className="max-w-2xl mx-auto">
      <div className="flex items-center gap-4 mb-8">
        <button 
          onClick={handleCancel}
          className="w-10 h-10 bg-surface border border-outline-variant/30 rounded-full flex items-center justify-center text-on-surface-variant hover:text-primary hover:border-primary transition-colors"
        >
          <FiArrowLeft size={20} />
        </button>
        <div>
          <h2 className="text-2xl font-bold text-on-surface">
            {id ? "Edit Mahasiswa" : "Tambah Mahasiswa Baru"}
          </h2>
          <p className="text-sm text-on-surface-variant mt-1">
            Isi data dasar mahasiswa. Email ini akan digunakan sebagai syarat login.
          </p>
        </div>
      </div>

      <div className="bg-surface border border-outline-variant/30 rounded-3xl p-6 md:p-8 shadow-sm">
        <form 
          onSubmit={async (e) => {
            e.preventDefault();
            setLoading(true);
            try {
              const formData = new FormData(e.currentTarget);
              const res = await saveMahasiswa(formData);
              if (res && res.success) {
                localStorage.removeItem("mahasiswaDraft");
                toast.success("Berhasil menyimpan data mahasiswa!");
                router.push("/admin/mahasiswa");
              } else {
                toast.error("Gagal menyimpan data.");
                setLoading(false);
              }
            } catch (err: any) {
              toast.error("Gagal menyimpan data: " + err.message);
              setLoading(false);
            }
          }}
          className="space-y-6"
        >
          {id && <input type="hidden" name="id" value={id} />}

          <div>
            <label htmlFor="full_name" className="block text-sm font-bold text-on-surface mb-2">Nama Lengkap *</label>
            <input 
              type="text" 
              id="full_name"
              name="full_name"
              required
              value={formData.full_name}
              onChange={handleChange}
              className="w-full bg-surface-variant/30 border border-outline-variant/50 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-primary transition-colors"
              placeholder="Nama lengkap sesuai KTP/KTM"
            />
          </div>

          <div>
            <label htmlFor="email" className="block text-sm font-bold text-on-surface mb-2">
              Email Kampus {id ? "(Opsional)" : "(Syarat Login *)"}
            </label>
            <input 
              type="email" 
              id="email"
              name="email"
              required={!id}
              value={formData.email}
              onChange={handleChange}
              className="w-full bg-surface-variant/30 border border-outline-variant/50 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-primary transition-colors"
              placeholder="email@stmik-tazkia.ac.id"
            />
            <p className="text-xs text-on-surface-variant/70 mt-2">
              {id 
                ? "Boleh dikosongkan jika kamu belum tahu emailnya. Karena akun ini sudah terhubung, mahasiswa tetap bisa melengkapinya sendiri nanti." 
                : "Wajib diisi jika membuat dari awal. Email ini akan digunakan oleh mahasiswa untuk 'Login with Google'. Pastikan tidak ada salah ketik."}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label htmlFor="angkatan" className="block text-sm font-bold text-on-surface mb-2">Angkatan *</label>
              <input 
                type="number" 
                id="angkatan"
                name="angkatan"
                required
                value={formData.angkatan}
                onChange={handleChange}
                className="w-full bg-surface-variant/30 border border-outline-variant/50 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-primary transition-colors"
                placeholder="Contoh: 1, 2, 3..."
              />
            </div>
            
            <div>
              <label htmlFor="prodi" className="block text-sm font-bold text-on-surface mb-2">Program Studi *</label>
              <input
                type="text"
                id="prodi"
                name="prodi"
                list="prodi-list"
                required
                value={formData.prodi}
                onChange={handleChange}
                className="w-full bg-surface-variant/30 border border-outline-variant/50 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-primary transition-colors"
                placeholder="Ketik atau pilih program studi..."
              />
              <datalist id="prodi-list">
                <option value="Teknik Informatika" />
                <option value="Sistem Informasi" />
                <option value="Bisnis Digital" />
              </datalist>
              <p className="text-xs text-on-surface-variant/70 mt-2">
                Kamu bisa memilih dari daftar atau mengetik jurusan baru secara manual.
              </p>
            </div>
          </div>

          <div className="pt-4 border-t border-outline-variant/20">
            <label className="flex items-center gap-3 cursor-pointer group">
              <input 
                type="checkbox" 
                name="is_featured"
                checked={formData.is_featured}
                onChange={handleChange}
                className="w-5 h-5 rounded border-outline-variant text-primary focus:ring-primary cursor-pointer accent-primary" 
              />
              <div>
                <span className="block text-sm font-bold text-on-surface group-hover:text-primary transition-colors">Featured Profile</span>
                <span className="block text-xs text-on-surface-variant mt-0.5">Tampilkan mahasiswa ini di urutan atas halaman profil (opsional).</span>
              </div>
            </label>
          </div>

          <div className="pt-8 flex justify-end gap-3">
            <button
              type="button"
              onClick={handleCancel}
              className="px-6 py-3 rounded-xl font-bold text-on-surface-variant bg-surface border border-outline-variant/50 hover:bg-surface-variant hover:text-on-surface transition-all"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-3 rounded-xl font-bold text-white bg-primary hover:bg-primary/90 hover:-translate-y-0.5 shadow-md transition-all flex items-center gap-2 disabled:opacity-70 disabled:hover:translate-y-0"
            >
              {loading ? (
                <>
                  <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Menyimpan...
                </>
              ) : (
                <>
                  <FiSave /> Simpan Data
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
