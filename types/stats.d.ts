// types/stats.ts
export interface AttendeeStats {
  total_approved: number;
  total_pending: number;
  by_status: Record<string, number>;
  by_ticket: Record<string, number>;
}

export interface TransactionStats {
  daily_registrations: {
    date: string;
    approved: number;
    pending: number;
  }[];
  total_revenue: {
    gross_sales: number;
    nett_sales: number;
  };
}

interface RegistrationChartData {
  date: string;
  Registrations: number;
}

export interface CustomFieldValue {
  value: string;
  count: number;
}

export interface CustomFieldStats {
  [key: string]: {
    label: string;
    values: CustomFieldValue[];
  };
}

export interface StatsFilters {
  date_start?: string;
  date_end?: string;
  group?: string;
}

interface ChartDataItem {
  name: string;
  value: number;
  category?: string;
}

export interface CustomFieldChartItem {
  value: string;
  count: number;
}

interface customFieldChartType {
  label: string;
  values: customFieldItemType[];
}
