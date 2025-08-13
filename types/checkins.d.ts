// Base stats interface that all stats share
export interface BaseCheckinStats {
  total_registrations: number
  unique_checkins: number
  checkin_rate: number
}

// Extended for global stats API
export interface GlobalCheckinStats extends BaseCheckinStats {
  total_checkins: number // Total checkin events
  total_checkouts: number // Total checkout events
  never_checked_in: number // People who haven't checked in
  currently_present: number // Currently at venue
}

// Ticket stats API response
export interface TicketCheckinStats extends BaseCheckinStats {
  ticket_name: string
}

// Custom field option (single answer option)
export interface CustomStatsOption extends BaseCheckinStats {
  answer: string
  total_checkouts: number
  currently_present: number
}

// Custom field stats API response
export interface CustomCheckinStats {
  title: string
  data: CustomStatsOption[]
}

export interface CheckinColumnConfig extends ColumnConfig {
  key: keyof CheckinItem | 'checkin_data' | 'notes'
  header: string
  isVisible?: boolean
  isHideable?: boolean
  width?: columnWidth
}

export interface CheckinFilters {
  search?: string
  datetime_start?: string
  datetime_end?: string
  datetime?: string
}

export interface CheckinItem {
  id: string
  code: string
  session: string
  stt_id: string
  name: string
  address: string
  ticket: string
  first_check_time: string
  checkin_data?: CheckinData[]
}

interface CheckinData {
  time: string
  type: 'checkin' | 'checkout'
  note?: string
}

export interface StatsCard {
  bgColor: string
  color: string
  icon: string
  title: string
  value: number
  percentage?: string
}
