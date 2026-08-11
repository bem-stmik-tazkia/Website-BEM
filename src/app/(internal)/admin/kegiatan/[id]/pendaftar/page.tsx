import React from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { FiArrowLeft, FiDownload, FiExternalLink } from "react-icons/fi";
import { getKegiatanById, getVolunteerApplications } from "../../actions";

const formatDateWithTime = (dateStr: string) => {
  const date = new Date(dateStr);
  const months = ["Januari", "Februari", "Maret", "April", "Mei", "Juni", "Juli", "Agustus", "September", "Oktober", "November", "Desember"];
  const day = date.getDate();
  const month = months[date.getMonth()];
  const year = date.getFullYear();
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  return `${day} ${month} ${year}, ${hours}:${minutes}`;
};
import ExportPendaftarButton from "./ExportPendaftarButton";

export const metadata = {
  title: "Kelola Pendaftar - BEM STMIK Tazkia Admin",
};

export default async function KelolaPendaftarPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const agenda = await getKegiatanById(id);
  
  const hasRegistration = agenda?.form_schema && agenda.form_schema.length > 0;
  
  if (!agenda || (agenda.type !== 'volunteer' && !(agenda.type === 'event' && hasRegistration))) {
    notFound();
  }

  const applications = await getVolunteerApplications(id);
  const fields = agenda.form_schema || [];

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4 mb-6">
        <Link href="/admin/kegiatan" className="w-10 h-10 flex items-center justify-center rounded-xl bg-surface border border-outline-variant/30 hover:bg-surface-variant/30 transition-colors">
          <FiArrowLeft />
        </Link>
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-on-surface">Data Pendaftar</h1>
          <p className="text-sm text-on-surface-variant mt-1">Posisi: {agenda.title}</p>
        </div>
      </div>

      <div className="bg-surface rounded-2xl border border-outline-variant/30 overflow-hidden shadow-sm">
        <div className="p-6 border-b border-outline-variant/30 flex justify-between items-center bg-surface-variant/10">
          <div>
            <h2 className="font-bold text-lg">Total Pendaftar: {applications.length}</h2>
            <p className="text-xs text-on-surface-variant">Data pendaftar pertama (terlama) berada pada urutan teratas.</p>
          </div>
          <ExportPendaftarButton applications={applications} fields={fields} agendaTitle={agenda.title} />
        </div>

        {applications.length === 0 ? (
          <div className="p-12 text-center text-on-surface-variant">
            Belum ada pendaftar untuk open recruitment ini.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse min-w-[800px]">
              <thead>
                <tr className="bg-surface-variant/20 text-on-surface-variant text-xs uppercase tracking-wider">
                  <th className="p-4 font-bold">Waktu Submit</th>
                  {fields.map(field => (
                    <th key={field.id} className="p-4 font-bold">{field.label}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-outline-variant/20">
                {applications.map((app: any) => (
                  <tr key={app.id} className="hover:bg-surface-variant/5 transition-colors">
                    <td className="p-4 text-xs whitespace-nowrap text-on-surface-variant font-medium">
                      {formatDateWithTime(app.created_at)}
                    </td>
                    
                    {fields.map(field => {
                      const answer = app.responses[field.id];
                      return (
                        <td key={field.id} className="p-4 text-sm text-on-surface max-w-[250px]">
                          {field.type === 'file' || field.type === 'image' ? (
                            answer ? (
                              <a href={answer} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-primary bg-primary/10 px-3 py-1.5 rounded-lg text-xs font-bold hover:bg-primary/20 transition-colors">
                                Lihat Lampiran <FiExternalLink size={12} />
                              </a>
                            ) : (
                              <span className="text-on-surface-variant/50 italic text-xs">Kosong</span>
                            )
                          ) : (
                            <div className="truncate" title={answer}>
                              {answer || <span className="text-on-surface-variant/50 italic text-xs">Kosong</span>}
                            </div>
                          )}
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
