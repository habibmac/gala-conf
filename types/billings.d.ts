interface Billing {
  id: string;
  amount: number;
  status: string;
  request_date: number; // Changed to number for timestamp
  event_id: string;
  transferred_date: number | null; // Changed to number | null for timestamp
  proof?: string;
}

export interface BillingSummary {
  pending_amount: number;
  paid_amount: number;
}

export interface BillingFilters {
  search?: string;
  status?: string;
  date_start?: string;
  date_end?: string;
}

interface StatusConfig {
  [key: string]: {
    icon: string;
    color: string;
    bgColor: string;
  };
}
