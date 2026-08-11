"use client";

import React, { useState } from "react";
import { FiDownload, FiX, FiFileText } from "react-icons/fi";

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

export default function ExportPendaftarButton({ applications, fields, agendaTitle }: { applications: any[], fields: any[], agendaTitle: string }) {
  const [isOpen, setIsOpen] = useState(false);

  const generateCSV = () => {
    // 1. Headers
    const headers = ["Waktu Submit", ...fields.map(f => `"${f.label.replace(/"/g, '""')}"`)];
    
    // 2. Rows
    const rows = applications.map(app => {
      const date = formatDateWithTime(app.created_at);
      const rowData = [`"${date}"`];
      
      fields.forEach(field => {
        let answer = app.responses[field.id] || "";
        answer = answer.replace(/"/g, '""'); // Escape double quotes
        rowData.push(`"${answer}"`);
      });
      
      return rowData.join(",");
    });

    const csvContent = "\uFEFF" + headers.join(",") + "\n" + rows.join("\n");
    return csvContent;
  };

  const handleDownload = () => {
    const csvContent = generateCSV();
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", `Data_Pendaftar_${agendaTitle.replace(/[^a-zA-Z0-9]/g, '_')}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    setIsOpen(false);
  };

  return (
    <>
      <button 
        onClick={() => setIsOpen(true)}
        className="flex items-center gap-2 bg-primary text-on-primary px-4 py-2 rounded-xl text-sm font-bold hover:bg-primary/90 transition-colors shadow-sm"
      >
        <FiDownload /> Export Data
      </button>

      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-surface w-full max-w-4xl rounded-3xl shadow-xl overflow-hidden flex flex-col max-h-[90vh] animate-in fade-in zoom-in-95 duration-200">
            <div className="p-6 border-b border-outline-variant/30 flex justify-between items-center bg-surface-variant/10">
              <h2 className="text-xl font-bold text-on-surface flex items-center gap-2">
                <FiFileText className="text-primary" /> Preview Data Export
              </h2>
              <button 
                onClick={() => setIsOpen(false)}
                className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-surface-variant/50 transition-colors"
              >
                <FiX size={20} />
              </button>
            </div>
            
            <div className="p-6 overflow-auto flex-1 bg-surface-variant/5">
              <p className="text-sm text-on-surface-variant mb-4 font-medium bg-blue-50 text-blue-800 p-3 rounded-lg border border-blue-200">
                <strong className="text-blue-900">Perhatian:</strong> Berikut ini hanyalah <strong className="text-blue-900">pratinjau (preview) 5 data teratas</strong>. 
                Saat tombol Download ditekan, <strong className="text-blue-900">seluruh {applications.length} data pendaftar</strong> akan ter-export ke dalam Excel secara utuh.
              </p>
              
              <div className="bg-surface border border-outline-variant/30 rounded-xl overflow-x-auto">
                <table className="w-full text-left border-collapse min-w-[800px]">
                  <thead>
                    <tr className="bg-surface-variant/20 text-on-surface-variant text-xs uppercase tracking-wider">
                      <th className="p-3 font-bold border-b border-outline-variant/30">Waktu Submit</th>
                      {fields.map(field => (
                        <th key={field.id} className="p-3 font-bold border-b border-outline-variant/30">{field.label}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-outline-variant/20">
                    {applications.slice(0, 5).map((app: any) => (
                      <tr key={app.id}>
                        <td className="p-3 text-xs whitespace-nowrap font-medium">{formatDateWithTime(app.created_at)}</td>
                        {fields.map(field => (
                          <td key={field.id} className="p-3 text-xs truncate max-w-[200px]" title={app.responses[field.id]}>
                            {app.responses[field.id] || "-"}
                          </td>
                        ))}
                      </tr>
                    ))}
                    {applications.length === 0 && (
                      <tr>
                        <td colSpan={fields.length + 1} className="p-8 text-center text-on-surface-variant text-sm">
                          Belum ada data pendaftar.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
              
              {applications.length > 5 && (
                <p className="text-xs text-center text-on-surface-variant mt-4 font-medium italic">
                  ... dan {applications.length - 5} baris data lainnya (Total {applications.length} baris pendaftar).
                </p>
              )}
            </div>

            <div className="p-6 border-t border-outline-variant/30 bg-surface flex justify-end gap-3">
              <button 
                onClick={() => setIsOpen(false)}
                className="px-5 py-2.5 rounded-xl text-sm font-bold border border-outline-variant hover:bg-surface-variant/20 transition-colors text-on-surface"
              >
                Batal
              </button>
              <button 
                onClick={handleDownload}
                disabled={applications.length === 0}
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold bg-primary text-on-primary hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <FiDownload size={16} /> Download (Excel / CSV)
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
