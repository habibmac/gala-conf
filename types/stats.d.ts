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

export interface customFieldChartType {
  label: string;
  values: customFieldItemType[];
}

// For the question info
interface QuestionInfo {
  QST_ID: string;
  QST_display_text: string;
  QST_type: string;
}

// For each option's stats
interface OptionStats {
  answer: string;
  total_registered: string | number;
  picked_up: string | number;
  checked_out: string | number;
  currently_out: string | number;
  pickup_percentage: string | number;
}

// For each question's full data
interface QuestionStats {
  info: QuestionInfo;
  options: OptionStats[];
}

// Main CheckinStats interface
export interface CheckinStats {
  global: {
    total_registrations: number;
    total_checkins: number;
    total_checkouts: number;
    currently_checked_in: number;
  };
  tickets: TicketCheckinStats[];
  custom: {
    questions: QuestionStats[];
  };
}
