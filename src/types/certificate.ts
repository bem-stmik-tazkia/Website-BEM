export type CertificateDesignPreset =
  | "classic-navy"
  | "emerald-gold"
  | "modern-royal"
  | "custom-bg";

export type CertificateStatus = "issued" | "revoked";

export interface CertificateSigner {
  name: string;
  role: string;
  signature_url?: string | null;
}

export interface CertificateLayoutConfig {
  textColor?: string;
  accentColor?: string;
  showLogo?: boolean;
  showBorder?: boolean;
  showQr?: boolean;
  badgeText?: string;
  contentOffsetY?: number;
  overlayOpacity?: number;
}

export interface CertificateRenderSnapshot {
  subtitle?: string;
  description?: string | null;
  location?: string | null;
  design_preset?: CertificateDesignPreset;
  background_image_url?: string | null;
  layout_config?: CertificateLayoutConfig;
  signers?: CertificateSigner[];
  issued_city?: string;
}

export interface CertificateTemplate {
  id: string;
  agenda_id: string | null;
  title: string;
  subtitle: string;
  description: string | null;
  event_date_label: string | null;
  location: string | null;
  number_prefix: string;
  design_preset: CertificateDesignPreset;
  background_image_url: string | null;
  layout_config: CertificateLayoutConfig;
  signers: CertificateSigner[];
  issued_city: string;
  issued_date_label: string | null;
  created_by?: string | null;
  created_at: string;
  updated_at: string;
  certificate_count?: number;
  issued_count?: number;
}

export interface CertificateRecord {
  id: string;
  certificate_code: string;
  certificate_number: string;
  template_id: string | null;
  agenda_id: string | null;
  application_id: string | null;
  user_id: string | null;
  recipient_name: string;
  role_title: string;
  activity_title: string;
  activity_date_label: string | null;
  description_override: string | null;
  issued_at: string;
  issued_date_label: string | null;
  custom_file_url: string | null;
  render_snapshot: CertificateRenderSnapshot;
  status: CertificateStatus;
  revoked_reason: string | null;
  revoked_at: string | null;
  created_by?: string | null;
  created_at: string;
  updated_at: string;
}

export interface PublicCertificateVerification {
  found: boolean;
  certificate_code?: string;
  certificate_number?: string;
  recipient_name?: string;
  role_title?: string;
  activity_title?: string;
  activity_date_label?: string | null;
  description?: string | null;
  subtitle?: string;
  design_preset?: CertificateDesignPreset;
  issued_city?: string;
  issued_date_label?: string | null;
  issued_at?: string;
  status?: CertificateStatus;
  revoked_reason?: string | null;
  revoked_at?: string | null;
  signers_summary?: Array<{ name: string; role: string }>;
}

export interface CertificateCsvRow {
  recipient_name: string;
  role_title: string;
  certificate_number?: string | null;
  description_override?: string | null;
}

export interface CertificateRenderData {
  certificate_code: string;
  certificate_number: string;
  recipient_name: string;
  role_title: string;
  activity_title: string;
  activity_date_label?: string | null;
  issued_date_label?: string | null;
  subtitle: string;
  description?: string | null;
  location?: string | null;
  design_preset: CertificateDesignPreset;
  background_image_url?: string | null;
  layout_config: CertificateLayoutConfig;
  signers: CertificateSigner[];
  issued_city: string;
  verifyUrl: string;
}
