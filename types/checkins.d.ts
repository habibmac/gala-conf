export interface CheckinFilters {
  search?: string;
  date_start?: string;
  date_end?: string;
}

export interface CheckinItem {
  REG_ID: string;
  REG_code: string;
  name: string;
  address: string;
  city: string;
  ticket: string;
  first_check_time: string;
  data: {
    time: string;
    type: 'checkin' | 'checkout';
  }[];
}

export interface CheckinColumnConfig extends ColumnConfig {
  key: keyof CheckinItem | 'data'; // explicitly include 'data' since it's a special case
  header: string;
  isVisible?: boolean;
  isHideable?: boolean;
  width?: columnWidth;
}

export interface TicketCheckinStats {
  TKT_ID: string;
  TKT_name: string;
  total_registrations: string;
  total_checkins: string;
  total_checkouts: string;
  checkin_percentage: string;
  checkout_percentage: string;
}

interface CustomItemCheckinStats {
  option: string;
  total_registered: number;
  picked_up: number;
  checked_out: number;
  currently_out: number;
  pickup_percentage: number;
}

interface CheckinStats {
  global: {
    total_registrations: number;
    total_checkins: number;
    total_checkouts: number;
    total_remaining: number;
  };
  tickets: TicketCheckinStats[];
  items?: CustomItemCheckinStats[];
}
