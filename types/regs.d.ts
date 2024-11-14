export interface Event {
  id: string;
  title: string;
  logo: string;
  package: string;
  capabilities?: string[];
}

export interface RegRequestParams {
  per_page: string;
  page: string;
  sort_by: string;
  order: string;
  [key: string]: string | string[] | undefined; // Allow string arrays and undefined
}

export interface Reg {
  id: string;
  code: string;
  date: string;
  fullname: string;
  ticket_name: string;
  ticket_price: string;
  total: string;
  paid: string;
  status: string;
  stt_id: string;
  [key: string]: any;
}

export interface ColumnConfig {
  key: string;
  header: string;
  isVisible: boolean;
  isHideable: boolean;
  width: number; // Width in percentage
  accessor?: (row: Reg) => string;
}

interface Filter {
  search: string;
  ticket_name: string[];
  status: string[];
  date_start: string; // Allow undefined
  date_end: string; // Allow undefined
}
