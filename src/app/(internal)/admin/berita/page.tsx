import React from "react";
import Link from "next/link";
import { createClient } from "@/utils/supabase/server";
import { FiPlus, FiEdit2, FiTrash2, FiEye, FiEyeOff } from "react-icons/fi";
import { revalidatePath } from "next/cache";
import Image from "next/image";
import DeleteBeritaButton from "./DeleteBeritaButton";
import RealtimeRefresher from "@/components/RealtimeRefresher";

export const revalidate = 0;

async function handleDelete(formData: FormData) {
  "use server";
  const supabase = await createClient();
  const id = formData.get("id") as string;
  if (id) {
    const { error } = await supabase.from("berita").delete().eq("id", id);
    if (error) throw new Error(error.message);
    
    revalidatePath("/admin/berita");
    revalidatePath("/berita");
  }
}

async function handleTogglePublish(formData: FormData) {
  "use server";
  const supabase = await createClient();
  const id = formData.get("id") as string;
  const currentStatus = formData.get("is_published") === "true";
  if (id) {
    await supabase.from("berita").update({ is_published: !currentStatus }).eq("id", id);
    revalidatePath("/admin/berita");
    revalidatePath("/berita");
  }
}

export default async function AdminBeritaPage() {
  const supabase = await createClient();
  const { data: berita } = await supabase
    .from("berita")
    .select("*")
    .order("created_at", { ascending: false });

  return (
    <div className="space-y-6">
      <RealtimeRefresher table="berita" />
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-on-surface">Kelola Berita</h1>
          <p className="text-sm text-on-surface-variant mt-1">
            Daftar semua berita dan informasi yang dipublikasikan.
          </p>
        </div>
        <Link
          href="/admin/berita/new"
          className="flex items-center gap-2 bg-primary text-white px-4 py-2.5 rounded-xl font-bold text-sm hover:bg-primary/90 transition-all hover:shadow-md shrink-0"
        >
          <FiPlus size={18} /> Tambah Berita
        </Link>
      </div>

      <div className="bg-surface border border-outline-variant/30 rounded-2xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-surface-variant/30 text-on-surface-variant text-xs uppercase tracking-wider">
                <th className="p-4 font-bold border-b border-outline-variant/30">Berita</th>
                <th className="p-4 font-bold border-b border-outline-variant/30">Kategori</th>
                <th className="p-4 font-bold border-b border-outline-variant/30 text-center">Status</th>
                <th className="p-4 font-bold border-b border-outline-variant/30">Statistik</th>
                <th className="p-4 font-bold border-b border-outline-variant/30">Tanggal</th>
                <th className="p-4 font-bold border-b border-outline-variant/30 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-outline-variant/30">
              {!berita || berita.length === 0 ? (
                <tr>
                  <td colSpan={6} className="p-12 text-center text-on-surface-variant">
                    <div className="flex flex-col items-center gap-3">
                      <div className="w-16 h-16 bg-surface-variant/50 rounded-full flex items-center justify-center">
                        <FiPlus className="text-2xl text-on-surface-variant/50" />
                      </div>
                      <p className="font-bold text-on-surface">Belum ada berita</p>
                      <p className="text-sm">Klik tombol "Tambah Berita" untuk membuat berita pertama.</p>
                    </div>
                  </td>
                </tr>
              ) : (
                berita.map((item) => (
                  <tr key={item.id} className="hover:bg-surface-variant/10 transition-colors">
                    <td className="p-4">
                      <div className="flex items-center gap-3">
                        <div className="w-14 h-14 rounded-xl bg-surface-variant/50 overflow-hidden shrink-0 flex items-center justify-center border border-outline-variant/20">
                          {item.image_url ? (
                            <img src={item.image_url} alt={item.title} className="w-full h-full object-cover" />
                          ) : (
                            <span className="text-on-surface-variant/40 text-xl">📰</span>
                          )}
                        </div>
                        <div>
                          <p className="font-bold text-sm text-on-surface line-clamp-1 max-w-[220px]">{item.title}</p>
                          <p className="text-xs text-on-surface-variant mt-0.5 line-clamp-1 max-w-[220px]">{item.slug}</p>
                        </div>
                      </div>
                    </td>
                    <td className="p-4">
                      <span className="bg-surface-variant/30 text-on-surface-variant px-2.5 py-1 rounded-lg text-xs font-bold uppercase tracking-wider">
                        {item.category}
                      </span>
                    </td>
                    <td className="p-4 text-center">
                      <form action={handleTogglePublish}>
                        <input type="hidden" name="id" value={item.id} />
                        <input type="hidden" name="is_published" value={String(item.is_published)} />
                        <button
                          type="submit"
                          title={item.is_published ? "Klik untuk jadikan Draft" : "Klik untuk Publikasikan"}
                          className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold transition-all hover:opacity-80 cursor-pointer ${
                            item.is_published
                              ? "bg-emerald-100 text-emerald-700 border border-emerald-200"
                              : "bg-amber-50 text-amber-600 border border-amber-200"
                          }`}
                        >
                          {item.is_published ? (
                            <><FiEye size={12} /> Publik</>
                          ) : (
                            <><FiEyeOff size={12} /> Draft</>
                          )}
                        </button>
                      </form>
                    </td>
                    <td className="p-4">
                      <div className="text-sm text-on-surface-variant flex items-center gap-3">
                        <span title="Views">👁 {item.views ?? 0}</span>
                        <span title="Likes" className="text-red-500">❤ {item.likes ?? 0}</span>
                      </div>
                    </td>
                    <td className="p-4 text-sm text-on-surface-variant whitespace-nowrap">
                      {new Date(item.created_at).toLocaleDateString("id-ID")}
                    </td>
                    <td className="p-4 text-right">
                      <div className="flex justify-end gap-2">
                        <Link
                          href={`/admin/berita/${item.id}`}
                          className="p-2.5 text-blue-500 hover:bg-blue-50 rounded-lg transition-colors"
                          title="Edit Berita"
                        >
                          <FiEdit2 size={16} />
                        </Link>
                        <DeleteBeritaButton id={item.id} action={handleDelete} />
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
