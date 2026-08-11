import React from "react";
import Link from "next/link";
import { getKegiatans, deleteKegiatan } from "@/app/(internal)/admin/kegiatan/actions";
import { FiPlus, FiEdit2, FiTrash2, FiImage, FiAlertTriangle, FiCheckCircle } from "react-icons/fi";
import { revalidatePath } from "next/cache";
import DeleteButton from "@/app/(internal)/admin/kegiatan/DeleteButton";
import AddDocumentationButton from "./AddDocumentationButton";
import { formatDateToIndo } from "@/utils/dateFormatter";

const getEventStatus = (item: any) => {
  if (!item.date) return "Akan Datang";
  const eventDate = new Date(item.date);
  const today = new Date();
  eventDate.setHours(0,0,0,0);
  today.setHours(0,0,0,0);
  
  if (eventDate < today) return "Selesai";
  if (eventDate.getTime() === today.getTime()) return "Live";
  return "Akan Datang";
};

export const metadata = {
  title: "Kelola Dokumentasi BEM",
};

export default async function DokumentasiAdminPage() {
  const allKegiatans = await getKegiatans();
  
  // Filter for finished events, events happening today (Live), or manual documentation
  const dokumentasiList = allKegiatans.filter(k => 
    (k.type === 'event' && (getEventStatus(k) === 'Selesai' || getEventStatus(k) === 'Live')) || 
    k.type === 'dokumentasi'
  );

  const handleDelete = async (formData: FormData) => {
    "use server";
    const id = formData.get("id") as string;
    if (id) {
      await deleteKegiatan(id);
      revalidatePath("/admin/dokumentasi");
      revalidatePath("/admin/kegiatan");
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-on-surface">Kelola Dokumentasi</h1>
          <p className="text-sm text-on-surface-variant mt-1">Galeri acara yang sudah selesai dan dokumentasi manual.</p>
        </div>
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
          <AddDocumentationButton />
        </div>
      </div>

      <div className="bg-surface border border-outline-variant/30 rounded-2xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-surface-variant/30 text-on-surface-variant text-xs uppercase tracking-wider">
                <th className="p-4 font-bold border-b border-outline-variant/30">Kegiatan</th>
                <th className="p-4 font-bold border-b border-outline-variant/30">Pelaksanaan</th>
                <th className="p-4 font-bold border-b border-outline-variant/30 text-center">Status Galeri</th>
                <th className="p-4 font-bold border-b border-outline-variant/30 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-outline-variant/30">
              {dokumentasiList.length === 0 ? (
                <tr>
                  <td colSpan={4} className="p-8 text-center text-on-surface-variant">
                    Belum ada dokumentasi acara yang selesai.
                  </td>
                </tr>
              ) : (
                dokumentasiList.map((item) => {
                  const hasGallery = item.gallery && item.gallery.length > 0;

                  return (
                  <tr key={item.id} className="hover:bg-surface-variant/10 transition-colors">
                    <td className="p-4">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-xl bg-surface-variant/50 overflow-hidden shrink-0 flex items-center justify-center">
                          {(item.image_url || (item.gallery && item.gallery.length > 0 ? item.gallery[0] : null)) ? (
                            <img src={item.image_url || (item.gallery && item.gallery[0]) || ""} alt={item.title} className="w-full h-full object-cover" />
                          ) : (
                            <FiImage className="text-on-surface-variant/50 text-xl" />
                          )}
                        </div>
                        <div>
                          <p className="font-bold text-sm text-on-surface line-clamp-1">{item.title}</p>
                          <p className="text-xs text-on-surface-variant">{item.category}</p>
                        </div>
                      </div>
                    </td>
                    <td className="p-4">
                      <div className="text-xs text-on-surface-variant">
                        <p className="font-medium text-on-surface">{formatDateToIndo(item.date)}</p>
                      </div>
                    </td>
                    <td className="p-4 text-center">
                      <div className="flex flex-col items-center gap-1">
                        {hasGallery && item.is_published ? (
                          <span className="flex items-center gap-1.5 text-xs font-bold text-emerald-600 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-200">
                            <FiCheckCircle size={14} /> Publik
                          </span>
                        ) : (
                          <span className="flex items-center gap-1.5 text-xs font-bold text-amber-600 bg-amber-50 px-3 py-1 rounded-full border border-amber-200">
                            <FiAlertTriangle size={14} /> Butuh Dokumentasi
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="p-4 text-right">
                      <div className="flex justify-end gap-2">
                        <Link
                          href={`/admin/kegiatan/form?id=${item.id}&from=dokumentasi`}
                          className={`flex items-center gap-1.5 h-8 px-3 rounded-lg text-xs font-bold transition-colors ${
                            !hasGallery 
                            ? 'bg-primary text-white hover:bg-primary/90 shadow-sm' 
                            : 'bg-blue-50 text-blue-600 hover:bg-blue-600 hover:text-white'
                          }`}
                          title="Upload Galeri"
                        >
                          <FiEdit2 size={14} /> {hasGallery ? 'Edit' : 'Upload Galeri'}
                        </Link>
                        <DeleteButton id={item.id} action={handleDelete} />
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
    </div>
  );
}
