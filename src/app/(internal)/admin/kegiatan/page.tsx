import React from "react";
import Link from "next/link";
import { getKegiatans, deleteKegiatan } from "./actions";
import { requireAdmin } from "@/lib/auth";
import { FiPlus, FiEdit2, FiCalendar, FiCheckCircle, FiXCircle, FiUsers } from "react-icons/fi";
import { revalidatePath } from "next/cache";
import DeleteButton from "./DeleteButton";
import BroadcastKegiatanButton from "./BroadcastKegiatanButton";
import { formatDateToIndo } from "@/utils/dateFormatter";

const getEventStatus = (item: any) => {
  if (item.type === 'volunteer') {
    if (!item.deadline) return "Buka";
    const deadlineDate = new Date(item.deadline);
    const today = new Date();
    deadlineDate.setHours(0,0,0,0);
    today.setHours(0,0,0,0);
    return deadlineDate >= today ? "Pendaftaran Buka" : "Ditutup";
  }

  if (!item.date) return "Akan Datang";
  const eventDate = new Date(item.date);
  const now = new Date();
  const today = new Date(now);
  eventDate.setHours(0,0,0,0);
  today.setHours(0,0,0,0);
  
  if (eventDate < today) return "Selesai";
  if (eventDate.getTime() === today.getTime()) {
    if (item.time_range) {
      const timeMatch = item.time_range.match(/(\d{1,2})[:.](\d{2})\s*(?:-|s\/d|to)\s*(\d{1,2})[:.](\d{2})/i);
      if (timeMatch) {
        const endHour = parseInt(timeMatch[3], 10);
        const endMin = parseInt(timeMatch[4], 10);
        const eventEnd = new Date(today);
        eventEnd.setHours(endHour, endMin, 0, 0);
        if (now.getTime() > eventEnd.getTime()) {
          return "Selesai";
        }
      }
    }
    return "Live";
  }
  return "Akan Datang";
};

export const metadata = {
  title: "Kelola Kegiatan BEM",
};

export default async function KegiatanAdminPage({
  searchParams,
}: {
  searchParams?: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const resolvedSearchParams = searchParams ? await searchParams : {};
  const filter = typeof resolvedSearchParams?.filter === 'string' ? resolvedSearchParams.filter : 'semua';
  const allKegiatans = await getKegiatans();
  
  // Filter out finished events and pure dokumentasi (they go to Kelola Dokumentasi)
  const activeKegiatans = allKegiatans.filter(k => 
    k.type !== 'dokumentasi' && !(k.type === 'event' && getEventStatus(k) === 'Selesai')
  );

  const kegiatans = filter === "semua" 
    ? activeKegiatans 
    : activeKegiatans.filter(k => k.type === (filter === "agenda" ? "event" : "volunteer"));

  const handleDelete = async (formData: FormData) => {
    "use server";
    await requireAdmin();
    const id = formData.get("id") as string;
    if (id) {
      await deleteKegiatan(id);
      revalidatePath("/admin/kegiatan");
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Row */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-on-surface">Kelola Kegiatan</h1>
          <p className="text-sm text-on-surface-variant mt-1">
            Atur daftar Agenda, Event Lomba, dan Open Recruitment BEM.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5 shrink-0">
          <Link
            href="/admin/kegiatan/form?type=event"
            className="inline-flex items-center justify-center gap-2 bg-primary text-white px-4 py-2.5 rounded-xl font-bold text-sm hover:bg-primary/90 transition-all hover:shadow-md whitespace-nowrap"
          >
            <FiPlus size={17} />
            <span>Tambah Event / Lomba</span>
          </Link>
          <Link
            href="/admin/kegiatan/form?type=volunteer"
            className="inline-flex items-center justify-center gap-2 bg-emerald-600 text-white px-4 py-2.5 rounded-xl font-bold text-sm hover:bg-emerald-700 transition-all hover:shadow-md whitespace-nowrap"
          >
            <FiUsers size={16} />
            <span>Tambah Oprec / Volunteer</span>
          </Link>
        </div>
      </div>

      {/* Filter Tabs Row */}
      <div className="flex items-center justify-between gap-4">
        <div className="bg-surface border border-outline-variant/30 rounded-xl p-1 inline-flex items-center gap-1">
          <Link
            href="/admin/kegiatan"
            className={`px-4 py-2 rounded-lg text-sm font-bold transition-all whitespace-nowrap ${
              filter === "semua"
                ? "bg-primary/10 text-primary"
                : "text-on-surface-variant hover:text-primary"
            }`}
          >
            Semua
          </Link>
          <Link
            href="/admin/kegiatan?filter=agenda"
            className={`px-4 py-2 rounded-lg text-sm font-bold transition-all whitespace-nowrap ${
              filter === "agenda"
                ? "bg-blue-50 text-blue-600"
                : "text-on-surface-variant hover:text-blue-600"
            }`}
          >
            Agenda &amp; Lomba
          </Link>
          <Link
            href="/admin/kegiatan?filter=volunteer"
            className={`px-4 py-2 rounded-lg text-sm font-bold transition-all whitespace-nowrap ${
              filter === "volunteer"
                ? "bg-emerald-50 text-emerald-600"
                : "text-on-surface-variant hover:text-emerald-600"
            }`}
          >
            Oprec / Volunteer
          </Link>
        </div>
      </div>

      <div className="bg-surface border border-outline-variant/30 rounded-2xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-surface-variant/30 text-on-surface-variant text-xs uppercase tracking-wider">
                <th className="p-4 font-bold border-b border-outline-variant/30">Kegiatan</th>
                <th className="p-4 font-bold border-b border-outline-variant/30">Tipe</th>
                <th className="p-4 font-bold border-b border-outline-variant/30">Jadwal / Deadline</th>
                <th className="p-4 font-bold border-b border-outline-variant/30 text-center">Status</th>
                <th className="p-4 font-bold border-b border-outline-variant/30 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-outline-variant/30">
              {kegiatans.length === 0 ? (
                <tr>
                  <td colSpan={5} className="p-12 text-center text-on-surface-variant">
                    <div className="flex flex-col items-center gap-2.5">
                      <div className="w-14 h-14 bg-surface-variant/50 rounded-full flex items-center justify-center">
                        <FiCalendar className="text-2xl text-on-surface-variant/50" />
                      </div>
                      <p className="font-bold text-on-surface">
                        {filter === "volunteer"
                          ? "Belum ada Open Recruitment / Volunteer"
                          : filter === "agenda"
                          ? "Belum ada Agenda / Event / Lomba"
                          : "Belum ada data kegiatan"}
                      </p>
                      <p className="text-xs max-w-md">
                        {filter === "volunteer"
                          ? "Klik tombol \"Tambah Oprec / Volunteer\" di kanan atas untuk membuat open recruitment baru."
                          : "Pilih tombol \"Tambah Event / Lomba\" atau \"Tambah Oprec / Volunteer\" di kanan atas untuk mulai menambahkan."}
                      </p>
                    </div>
                  </td>
                </tr>
              ) : (
                kegiatans.map((item) => (
                  <tr key={item.id} className="hover:bg-surface-variant/10 transition-colors">
                    <td className="p-4">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-xl bg-surface-variant/50 overflow-hidden shrink-0 flex items-center justify-center">
                          {item.image_url ? (
                            <img src={item.image_url} alt={item.title} className="w-full h-full object-cover" />
                          ) : (
                            <FiCalendar className="text-on-surface-variant/50 text-xl" />
                          )}
                        </div>
                        <div>
                          <p className="font-bold text-sm text-on-surface line-clamp-1">{item.title}</p>
                          <p className="text-xs text-on-surface-variant">{item.category}</p>
                          {item.items && item.items.length > 0 ? (
                            <p className="text-[11px] font-semibold text-primary mt-0.5">
                              {item.items.length} {item.type === "volunteer" ? "Posisi" : "Cabang Lomba"} •{" "}
                              {(() => {
                                const totalFilled = item.items.reduce((s, it) => s + (it.filled_count || 0), 0);
                                const totalQuota = item.items.reduce((s, it) => s + (it.quota || 0), 0);
                                const hasUnlimited = item.items.some((it) => it.quota == null);
                                return hasUnlimited
                                  ? `${totalFilled} Terisi`
                                  : `${totalFilled}/${totalQuota} Terisi`;
                              })()}
                            </p>
                          ) : (item.type === "volunteer" || (item.form_schema && item.form_schema.length > 0)) ? (
                            <p className="text-[11px] text-on-surface-variant mt-0.5">
                              {item.max_participants
                                ? `${item.accepted_count || 0}/${item.max_participants} Terisi`
                                : `${item.accepted_count || 0} Pendaftar`}
                            </p>
                          ) : null}
                        </div>
                      </div>
                    </td>
                    <td className="p-4">
                      <span className={`px-2.5 py-1 text-[10px] font-bold rounded-md uppercase tracking-wider ${
                        item.type === 'event' ? 'bg-blue-100 text-blue-700' : 'bg-emerald-100 text-emerald-700'
                      }`}>
                        {item.type === 'event' ? 'Agenda' : 'Oprec'}
                      </span>
                    </td>
                    <td className="p-4">
                      {item.type === 'event' ? (
                        <div className="text-xs text-on-surface-variant">
                          <p className="font-medium text-on-surface">{formatDateToIndo(item.date)}</p>
                          <p>{item.time_range}</p>
                        </div>
                      ) : (
                        <div className="text-xs text-on-surface-variant">
                          <p className="font-medium text-on-surface">{formatDateToIndo(item.deadline)}</p>
                          {item.is_urgent && <span className="text-[10px] font-bold text-red-500">SEGERA</span>}
                        </div>
                      )}
                    </td>
                    <td className="p-4 text-center">
                      <div className="flex flex-col items-center gap-1">
                        {item.is_published ? (
                          <span className="flex items-center gap-1 text-xs font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full">
                            <FiCheckCircle size={12} /> Live
                          </span>
                        ) : (
                          <span className="flex items-center gap-1 text-xs font-bold text-on-surface-variant bg-surface-variant/50 px-2 py-0.5 rounded-full">
                            <FiXCircle size={12} /> Draft
                          </span>
                        )}
                        <span className="text-[10px] text-on-surface-variant font-bold">{getEventStatus(item)}</span>
                      </div>
                    </td>
                    <td className="p-4 text-right">
                      <div className="flex justify-end gap-2">
                        {(item.type === 'volunteer' || (item.type === 'event' && ((item.form_schema && item.form_schema.length > 0) || (item.items && item.items.length > 0)))) && (
                          <Link
                            href={`/admin/kegiatan/${item.id}/pendaftar`}
                            className={`h-8 px-3 rounded-lg flex items-center justify-center transition-colors text-xs font-bold ${
                              item.type === 'event' 
                                ? 'bg-blue-50 text-blue-600 hover:bg-blue-600 hover:text-white' 
                                : 'bg-emerald-50 text-emerald-600 hover:bg-emerald-600 hover:text-white'
                            }`}
                            title="Lihat Pendaftar"
                          >
                            Pendaftar
                          </Link>
                        )}
                        <BroadcastKegiatanButton
                          id={item.id}
                          title={item.title}
                          isPublished={item.is_published}
                        />
                        <Link
                          href={`/admin/kegiatan/form?id=${item.id}`}
                          className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center hover:bg-blue-600 hover:text-white transition-colors"
                          title="Edit"
                        >
                          <FiEdit2 size={14} />
                        </Link>
                        <DeleteButton id={item.id} action={handleDelete} />
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
