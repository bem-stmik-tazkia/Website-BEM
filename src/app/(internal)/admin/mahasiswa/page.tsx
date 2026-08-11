"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import {
  FiPlus, FiEdit2, FiTrash2, FiUser, FiSearch,
  FiCheckCircle, FiShield, FiUsers
} from "react-icons/fi";
import { motion, AnimatePresence } from "framer-motion";
import { getMahasiswa, deleteMahasiswa } from "./actions";
import { useToast } from "@/components/ui/Toast";
import { createClient } from "@/utils/supabase/client";
import { useRouter } from "next/navigation";

type Tab = "profil" | "akun";

export default function AdminMahasiswaPage() {
  const supabase = createClient();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<Tab>("profil");

  // ── Tab Profil Mahasiswa ──────────────────────────────────────────
  const [mahasiswas, setMahasiswas] = useState<any[]>([]);
  const [filtered, setFiltered] = useState<any[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [deleteModal, setDeleteModal] = useState({ isOpen: false, id: "", name: "" });
  const toast = useToast();

  // ── Tab Akun Sistem ───────────────────────────────────────────────
  const [users, setUsers] = useState<any[]>([]);
  const [usersLoading, setUsersLoading] = useState(false);
  const [usersFetched, setUsersFetched] = useState(false);
  const [creatingProfile, setCreatingProfile] = useState<string | null>(null);
  // map user_id → mahasiswa_profile untuk cross-reference status
  const [profileByUserId, setProfileByUserId] = useState<Record<string, any>>({});

  // ── Fetch Profil Mahasiswa ────────────────────────────────────────
  const fetchData = async () => {
    setLoading(true);
    const data = await getMahasiswa();
    setMahasiswas(data);
    setFiltered(data);
    setLoading(false);
  };

  useEffect(() => {
    fetchData();

    // Listen for real-time changes
    const channel = supabase
      .channel('realtime_admin_mahasiswa')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'mahasiswa_profiles' }, () => {
        fetchData();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [supabase]);

  useEffect(() => {
    if (!search) {
      setFiltered(mahasiswas);
    } else {
      const lower = search.toLowerCase();
      setFiltered(
        mahasiswas.filter(
          (m) =>
            m.full_name?.toLowerCase().includes(lower) ||
            m.email?.toLowerCase().includes(lower) ||
            m.prodi?.toLowerCase().includes(lower)
        )
      );
    }
  }, [search, mahasiswas]);

  // ── Fetch Akun Sistem (lazy, hanya saat tab aktif) ────────────────
  useEffect(() => {
    if (activeTab === "akun" && !usersFetched) {
      const fetchUsers = async () => {
        setUsersLoading(true);

        // Ambil semua akun sistem
        const { data: profilesData } = await supabase
          .from("profiles")
          .select("*")
          .order("role", { ascending: true });

        // Ambil mahasiswa_profiles untuk cross-reference status terhubung
        const { data: mhsData } = await supabase
          .from("mahasiswa_profiles")
          .select("id, user_id, prodi")
          .not("user_id", "is", null);

        const map: Record<string, any> = {};
        (mhsData || []).forEach((m) => { if (m.user_id) map[m.user_id] = m; });

        if (profilesData) setUsers(profilesData);
        setProfileByUserId(map);
        setUsersLoading(false);
        setUsersFetched(true);
      };
      fetchUsers();
    }
  }, [activeTab, usersFetched]);

  // ── Buat Profil dari Akun Sistem (tanpa perlu tahu email) ─────────
  const handleCreateProfileFromAccount = async (user: any) => {
    setCreatingProfile(user.id);
    // Insert profil minimal pakai nama dari Google, email bisa dilengkapi admin lewat edit
    const { data: inserted, error } = await supabase
      .from("mahasiswa_profiles")
      .insert([{ 
        user_id: user.id, 
        full_name: user.full_name || "Tanpa Nama", 
        email: user.email || "", 
        prodi: "-", 
        angkatan: 0, 
        skills: [] 
      }])
      .select("id")
      .single();

    if (error) {
      toast.error("Gagal membuat profil: " + error.message);
      setCreatingProfile(null);
    } else {
      toast.success(`Profil untuk ${user.full_name || "akun ini"} berhasil dibuat! Lengkapi emailnya sekarang.`);
      // Langsung ke form edit untuk lengkapi email, prodi, angkatan
      router.push(`/admin/mahasiswa/form?id=${inserted.id}`);
    }
  };

  // ── Delete Mahasiswa ──────────────────────────────────────────────
  const handleDeleteClick = (id: string, name: string) => {
    setDeleteModal({ isOpen: true, id, name });
  };

  const confirmDelete = async () => {
    const res = await deleteMahasiswa(deleteModal.id);
    if (res.success) {
      toast.success("Profil mahasiswa berhasil dihapus!");
      setDeleteModal({ isOpen: false, id: "", name: "" });
      fetchData();
    } else {
      toast.error("Gagal menghapus: " + res.error);
    }
  };

  const tabs: { key: Tab; label: string; icon: React.ReactNode }[] = [
    { key: "profil", label: "Profil Mahasiswa", icon: <FiUsers size={16} /> },
    { key: "akun",   label: "Akun Sistem",      icon: <FiShield size={16} /> },
  ];

  return (
    <div>
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
        <div>
          <h2 className="text-2xl font-bold text-on-surface mb-1">Kelola Mahasiswa</h2>
          <p className="text-on-surface-variant text-sm">
            Daftarkan mahasiswa dan kelola semua akun yang terdaftar di sistem.
          </p>
        </div>
        {activeTab === "profil" && (
          <Link
            href="/admin/mahasiswa/form"
            className="bg-primary text-white px-4 py-2.5 rounded-xl font-bold hover:bg-primary/90 transition-all shadow-sm flex items-center justify-center gap-2 whitespace-nowrap"
          >
            <FiPlus size={18} /> Tambah Mahasiswa
          </Link>
        )}
      </div>

      {/* Tabs */}
      <div className="flex gap-1 p-1 bg-surface-variant/30 rounded-xl w-fit mb-6 border border-outline-variant/20">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-all duration-200 ${
              activeTab === tab.key
                ? "bg-white text-primary shadow-sm border border-outline-variant/20"
                : "text-on-surface-variant hover:text-on-surface"
            }`}
          >
            {tab.icon}
            {tab.label}
            {tab.key === "profil" && (
              <span className={`text-xs px-1.5 py-0.5 rounded-full font-bold ${
                activeTab === "profil"
                  ? "bg-primary/10 text-primary"
                  : "bg-surface-variant/50 text-on-surface-variant"
              }`}>
                {mahasiswas.length}
              </span>
            )}
            {tab.key === "akun" && usersFetched && (
              <span className={`text-xs px-1.5 py-0.5 rounded-full font-bold ${
                activeTab === "akun"
                  ? "bg-primary/10 text-primary"
                  : "bg-surface-variant/50 text-on-surface-variant"
              }`}>
                {users.length}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* ── TAB: Profil Mahasiswa ── */}
      {activeTab === "profil" && (
        <div className="bg-surface border border-outline-variant/30 rounded-2xl shadow-sm overflow-hidden flex flex-col">
          {/* Toolbar */}
          <div className="p-4 border-b border-outline-variant/30 flex flex-col sm:flex-row gap-4 justify-between items-center bg-surface-variant/10">
            <div className="relative w-full sm:max-w-xs">
              <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant" />
              <input
                type="text"
                placeholder="Cari nama atau email..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full bg-white border border-outline-variant/40 rounded-xl pl-10 pr-4 py-2 text-sm focus:outline-none focus:border-primary"
              />
            </div>
            <div className="text-sm font-medium text-on-surface-variant">
              Total: {filtered.length} Mahasiswa
            </div>
          </div>

          {/* Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-surface-variant/20 text-on-surface-variant text-sm border-b border-outline-variant/20">
                  <th className="py-4 px-6 font-medium whitespace-nowrap">Profil</th>
                  <th className="py-4 px-6 font-medium whitespace-nowrap">Email Kampus</th>
                  <th className="py-4 px-6 font-medium whitespace-nowrap">Prodi &amp; Angkatan</th>
                  <th className="py-4 px-6 font-medium whitespace-nowrap">Status Akun</th>
                  <th className="py-4 px-6 font-medium text-right whitespace-nowrap">Aksi</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={5} className="py-10 text-center text-on-surface-variant/70">
                      <div className="flex justify-center items-center gap-2">
                        <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                        Memuat data...
                      </div>
                    </td>
                  </tr>
                ) : filtered.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-10 text-center text-on-surface-variant/70">
                      Tidak ada data mahasiswa ditemukan.
                    </td>
                  </tr>
                ) : (
                  filtered.map((m) => (
                    <tr key={m.id} className="border-b border-gray-50 hover:bg-surface-variant/10 transition-colors">
                      <td className="py-4 px-6">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-primary/10 text-primary flex items-center justify-center shrink-0 overflow-hidden">
                            {m.avatar_url ? (
                              <img src={m.avatar_url} alt={m.full_name} className="w-full h-full object-cover" />
                            ) : (
                              <FiUser size={18} />
                            )}
                          </div>
                          <div>
                            <div className="font-bold text-on-surface line-clamp-1">{m.full_name}</div>
                            {m.is_featured && (
                              <span className="text-[10px] bg-secondary/10 text-secondary px-2 py-0.5 rounded-full font-bold uppercase mt-1 inline-block">
                                Featured
                              </span>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="py-4 px-6 text-sm text-on-surface-variant">{m.email}</td>
                      <td className="py-4 px-6 text-sm text-on-surface-variant">
                        <div className="font-medium text-on-surface">{m.prodi || <span className="italic text-on-surface-variant/50">Belum diisi</span>}</div>
                        <div className="text-xs mt-0.5">{m.angkatan ? `Angkatan ${m.angkatan}` : ""}</div>
                      </td>
                      <td className="py-4 px-6">
                        {m.user_id ? (
                          <span className="flex items-center gap-1.5 w-fit bg-green-50 text-green-600 px-2.5 py-1 rounded-lg text-xs font-bold uppercase tracking-wider">
                            <FiCheckCircle size={14} /> Terklaim
                          </span>
                        ) : (
                          <span className="flex items-center gap-1.5 w-fit bg-surface-variant/30 text-on-surface-variant px-2.5 py-1 rounded-lg text-xs font-bold uppercase tracking-wider">
                            Menunggu
                          </span>
                        )}
                      </td>
                      <td className="py-4 px-6">
                        <div className="flex items-center justify-end gap-2">
                          <Link
                            href={`/admin/mahasiswa/form?id=${m.id}`}
                            className="p-2 bg-surface-variant/30 text-on-surface-variant hover:text-primary hover:bg-primary/10 rounded-lg transition-colors"
                            title="Edit Mahasiswa"
                          >
                            <FiEdit2 size={16} />
                          </Link>
                          <button
                            onClick={() => handleDeleteClick(m.id, m.full_name)}
                            className="p-2 bg-surface-variant/30 text-on-surface-variant hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                            title="Hapus Mahasiswa"
                          >
                            <FiTrash2 size={16} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ── TAB: Akun Sistem ── */}
      {activeTab === "akun" && (
        <div className="bg-surface border border-outline-variant/30 rounded-2xl shadow-sm overflow-hidden">
          <div className="p-4 border-b border-outline-variant/30 bg-surface-variant/10 flex items-center justify-between gap-4">
            <p className="text-sm text-on-surface-variant">
              Daftar semua akun yang telah login. Akun yang <strong>belum terhubung</strong> bisa dibuatkan profilnya dengan tombol <strong>"Buat Profil"</strong>.
            </p>
            <span className="text-xs text-on-surface-variant/70 whitespace-nowrap">
              {users.filter(u => u.role !== "admin" && !profileByUserId[u.id]).length} belum terhubung
            </span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-surface-variant/20 text-on-surface-variant text-sm border-b border-outline-variant/20">
                  <th className="py-4 px-6 font-medium whitespace-nowrap">Pengguna</th>
                  <th className="py-4 px-6 font-medium whitespace-nowrap">ID Pengguna</th>
                  <th className="py-4 px-6 font-medium whitespace-nowrap">Role</th>
                  <th className="py-4 px-6 font-medium whitespace-nowrap">Status Profil</th>
                  <th className="py-4 px-6 font-medium text-right whitespace-nowrap">Aksi</th>
                </tr>
              </thead>
              <tbody>
                {usersLoading ? (
                  <tr>
                    <td colSpan={5} className="py-10 text-center text-on-surface-variant/70">
                      <div className="flex justify-center items-center gap-2">
                        <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                        Memuat data akun...
                      </div>
                    </td>
                  </tr>
                ) : users.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-10 text-center text-on-surface-variant/70">
                      Belum ada pengguna terdaftar.
                    </td>
                  </tr>
                ) : (
                  users.map((user) => {
                    const linkedProfile = profileByUserId[user.id];
                    const isAdmin = user.role === "admin";
                    return (
                      <tr key={user.id} className="border-b border-gray-50 hover:bg-surface-variant/10 transition-colors">
                        <td className="py-4 px-6">
                          <div className="flex items-center gap-3">
                            <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${isAdmin ? "bg-indigo-100 text-indigo-600" : "bg-blue-100 text-blue-600"}`}>
                              {isAdmin ? <FiShield size={18} /> : <FiUser size={18} />}
                            </div>
                            <div className="font-bold text-on-surface">{user.full_name || "Tanpa Nama"}</div>
                          </div>
                        </td>
                        <td className="py-4 px-6">
                          <code className="text-xs text-on-surface-variant bg-surface-variant/30 px-2 py-1 rounded">
                            {user.id}
                          </code>
                        </td>
                        <td className="py-4 px-6">
                          {isAdmin ? (
                            <span className="flex items-center gap-1.5 w-fit bg-indigo-50 text-indigo-600 px-3 py-1.5 rounded-lg text-xs font-bold uppercase tracking-wider">
                              <FiShield size={13} /> Admin
                            </span>
                          ) : (
                            <span className="flex items-center gap-1.5 w-fit bg-surface-variant/30 text-on-surface-variant px-3 py-1.5 rounded-lg text-xs font-medium uppercase tracking-wider">
                              <FiUser size={13} /> User
                            </span>
                          )}
                        </td>
                        <td className="py-4 px-6">
                          {isAdmin ? (
                            <span className="text-xs text-on-surface-variant/50 italic">—</span>
                          ) : linkedProfile ? (
                            <div>
                              <span className="flex items-center gap-1.5 w-fit bg-green-50 text-green-600 px-2.5 py-1 rounded-lg text-xs font-bold uppercase tracking-wider">
                                <FiCheckCircle size={13} /> Terhubung
                              </span>
                              {linkedProfile.prodi && (
                                <div className="text-xs text-on-surface-variant mt-1">{linkedProfile.prodi}</div>
                              )}
                            </div>
                          ) : (
                            <span className="flex items-center gap-1.5 w-fit bg-amber-50 text-amber-600 px-2.5 py-1 rounded-lg text-xs font-bold uppercase tracking-wider">
                              Belum Ada Profil
                            </span>
                          )}
                        </td>
                        <td className="py-4 px-6">
                          <div className="flex items-center justify-end gap-2">
                            {/* Kalau sudah terhubung → shortcut edit profil */}
                            {!isAdmin && linkedProfile && (
                              <Link
                                href={`/admin/mahasiswa/form?id=${linkedProfile.id}`}
                                className="p-2 bg-surface-variant/30 text-on-surface-variant hover:text-primary hover:bg-primary/10 rounded-lg transition-colors"
                                title="Edit Profil"
                              >
                                <FiEdit2 size={16} />
                              </Link>
                            )}
                            {/* Kalau belum terhubung → tombol buat profil */}
                            {!isAdmin && !linkedProfile && (
                              <button
                                onClick={() => handleCreateProfileFromAccount(user)}
                                disabled={creatingProfile === user.id}
                                className="flex items-center gap-1.5 px-3 py-1.5 bg-primary text-white text-xs font-bold rounded-lg hover:bg-primary/90 transition-all disabled:opacity-60 whitespace-nowrap"
                                title="Buat Profil Mahasiswa"
                              >
                                {creatingProfile === user.id ? (
                                  <div className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                ) : (
                                  <FiPlus size={13} />
                                )}
                                Buat Profil
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      <AnimatePresence>
        {deleteModal.isOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/40 backdrop-blur-sm"
              onClick={() => setDeleteModal({ isOpen: false, id: "", name: "" })}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="relative bg-surface rounded-2xl p-6 md:p-8 max-w-sm w-full shadow-2xl border border-outline-variant/20"
            >
              <div className="w-14 h-14 bg-red-50 text-red-500 rounded-full flex items-center justify-center mx-auto mb-5">
                <FiTrash2 size={24} />
              </div>
              <h3 className="text-xl font-bold text-center text-on-surface mb-2">Hapus Profil?</h3>
              <p className="text-center text-on-surface-variant text-sm mb-8">
                Apakah Anda yakin ingin menghapus profil mahasiswa{" "}
                <strong className="text-on-surface">{deleteModal.name}</strong>? Tindakan ini tidak dapat dibatalkan.
              </p>
              <div className="flex gap-3">
                <button
                  onClick={() => setDeleteModal({ isOpen: false, id: "", name: "" })}
                  className="flex-1 py-3 px-4 rounded-xl font-bold text-on-surface-variant bg-surface-variant/30 hover:bg-surface-variant/50 transition-colors"
                >
                  Batal
                </button>
                <button
                  onClick={confirmDelete}
                  className="flex-1 py-3 px-4 rounded-xl font-bold text-white bg-red-500 hover:bg-red-600 shadow-md shadow-red-500/20 transition-all hover:-translate-y-0.5"
                >
                  Ya, Hapus
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
