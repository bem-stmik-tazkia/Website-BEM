export type DynamicFieldType =
  | "text"
  | "textarea"
  | "number"
  | "email"
  | "tel"
  | "select"
  | "file"
  | "image";

export interface DynamicFormField {
  id: string;
  type: DynamicFieldType;
  label: string;
  required: boolean;
  placeholder?: string;
  options?: string[]; // Used when type === 'select'
}

export interface AgendaItem {
  id: string;
  agenda_id: string;
  name: string;
  description?: string | null;
  quota: number | null;
  participant_type: "individu" | "tim";
  rulebook_url?: string | null;
  sort_order: number;
  created_at?: string;
  updated_at?: string;
  filled_count?: number;
  rejected_count?: number;
}

export interface AgendaItemInput {
  id?: string;
  name: string;
  description?: string | null;
  quota: number | null;
  participant_type?: "individu" | "tim";
  rulebook_url?: string | null;
  sort_order?: number;
}

export interface AgendaKegiatan {
  id: string;
  title: string;
  slug: string;
  type: "event" | "volunteer" | "dokumentasi";
  date: string | null;
  end_date?: string;
  location: string | null;
  image_url: string | null;
  registration_link: string | null;
  status: string | null; // e.g., "Akan Datang", "Sedang Berjalan", "Selesai"
  description: string | null;
  created_at: string;
  category: string | null; // e.g., "Kaderisasi", "TEKNOLOGI & WEB"
  time_range: string | null; // e.g., "08:00 - 15:00 WIB"
  deadline: string | null; // for volunteer or registration cutoff
  is_urgent: boolean; // for volunteer
  is_published: boolean; // Live / Draft
  gallery?: string[]; // for finished event documentation
  video_url?: string | null; // for youtube/instagram video link
  online_link?: string | null; // for online event link
  form_schema?: DynamicFormField[]; // Dynamic form for registrations
  speakers?: { name: string; role: string; photo: string }[]; // Array of event speakers
  max_participants?: number | null; // Global quota fallback when no sub-items
  allow_multiple_items?: boolean; // For multi-competition events
  items?: AgendaItem[]; // Sub-positions (volunteer) or competitions (event)
  accepted_count?: number; // Live filled count across active registrations
}

export type KegiatanFormInput = Omit<Partial<AgendaKegiatan>, "items"> & {
  items?: AgendaItemInput[];
};

export type ApplicationStatus = "accepted" | "rejected";

export interface VolunteerApplication {
  id: string;
  agenda_id: string;
  item_id?: string | null;
  item_name?: string | null;
  status?: ApplicationStatus;
  batch_id?: string | null;
  responses: Record<string, string>; // Maps field ID to the response value (or file/image URL)
  portofolio_url?: string | null;
  created_at: string;
}
