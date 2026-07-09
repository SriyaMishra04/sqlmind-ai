export interface CRMLead {
  created_at?: string;
  name: string;
  email: string;
  country_code?: string;
  mobile_without_country_code?: string;
  company?: string;
  city?: string;
  state?: string;
  country?: string;
  lead_owner?: string;
  crm_status?: string;
  crm_note?: string;
  data_source?: string;
  possession_time?: string;
  description?: string;
}

export interface ImportStats {
  totalImported: number;
  totalSkipped: number;
  processingTimeMs: number;
}

export interface ProcessedRecord {
  rowNumber: number;
  success: boolean;
  lead?: CRMLead;
  reason?: string;
  originalData: Record<string, string>;
}

export interface ImportResponse {
  records: CRMLead[];
  skipped: { rowNumber: number; reason: string; originalData: Record<string, string> }[];
  stats: ImportStats;
}
