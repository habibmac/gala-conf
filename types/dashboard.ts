// types/dashboard.d.ts
export interface EventCountdown {
  days: number
  hours: number
  minutes: number
  seconds: number
  isExpired: boolean
  timeUntilStart?: string
  timeUntilEnd?: string
}

export interface TicketCapacity {
  id: string
  name: string
  sold: number
  available: number | null
  reg_limit: number | null
  capacity_percentage: number
  is_sold_out: boolean
}

export interface RecentRegistration {
  id: string
  code: string
  fullname: string
  ticket_name: string
  date: string
  status: string
}

export interface SessionCapacity {
  id: string
  name: string
  date_start: string
  date_end: string
  sold: number
  available: number | null
  reg_limit: number | null
  capacity_percentage: number
  is_active: boolean
  is_upcoming: boolean
  is_expired: boolean
}

export interface DashboardData {
  countdown: EventCountdown
  tickets: TicketCapacity[]
  recent_registrations: RecentRegistration[]
  sessions: SessionCapacity[]
}