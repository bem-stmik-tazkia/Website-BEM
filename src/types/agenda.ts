export interface AgendaKegiatan {
  id: string;
  title: string;
  slug: string;
  type: 'event' | 'volunteer' | 'dokumentasi';
  date: string | null;
  location: string | null;
  image_url: string | null;
  registration_link: string | null;
  status: string | null; // e.g., "Akan Datang", "Sedang Berjalan", "Selesai"
  description: string | null;
  created_at: string;
  category: string | null; // e.g., "Kaderisasi", "TEKNOLOGI & WEB"
  time_range: string | null; // e.g., "08:00 - 15:00 WIB"
  deadline: string | null; // for volunteer
  is_urgent: boolean; // for volunteer
  is_published: boolean; // Live / Draft
  gallery?: string[]; // for finished event documentation
  video_url?: string | null; // for youtube/instagram video link
  online_link?: string | null; // for online event link
  form_schema?: DynamicFormField[]; // Dynamic form for volunteer applications
  speakers?: { name: string; role: string; photo: string }[]; // Array of event speakers
  max_participants?: number | null; // Quota for event/volunteer
}

export interface DynamicFormField {
  id: string;
  type: 'text' | 'textarea' | 'number' | 'email' | 'tel' | 'file' | 'image';
  label: string;
  required: boolean;
  placeholder?: string;
}

export interface VolunteerApplication {
  id: string;
  agenda_id: string;
  responses: Record<string, string>; // Maps field ID to the response value (or file URL)
  created_at: string;
}
