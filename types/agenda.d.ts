export interface AgendaItem {
  date: string
  type: 'event_setup' | 'registration_opens' | 'registration_closes' | 'event_datetime'
  title: string
  description: string
  icon: string
  status: 'upcoming' | 'active' | 'completed'
  tickets?: TicketInfo[]
  datetime_info?: DatetimeInfo
  event_info?: EventInfo
  count?: number
}

export interface TicketInfo {
  ticket_id: string
  ticket_name: string
  ticket_price: number
}

export interface DatetimeInfo {
  datetime_id: string
  name: string
  start_date: string
  end_date: string
  time_range: string
  sold: number
  available: number | null
  is_active: boolean
  is_upcoming: boolean
  is_expired: boolean
}

export interface EventInfo {
  event_id: string
  event_name: string
}

export interface AgendaDay {
  date: string
  formatted_date: string
  day_name: string
  items: AgendaItem[]
  item_count: number
  status: 'upcoming' | 'active' | 'completed'
}

export interface AgendaProgress {
  total_items: number
  completed_items: number
  active_items: number
  upcoming_items: number
  completion_percentage: number
  is_event_completed: boolean
  next_milestone: {
    title: string
    date: string
    type: string
    status: string
  } | null
}

export interface AgendaResponse {
  success: boolean
  data: AgendaDay[]
  progress: AgendaProgress
  meta: {
    total_days: number
    total_items: number
    only_upcoming: boolean
    event_id: number
    generated_at: string
  }
}

export interface AgendaParams {
  only_upcoming?: boolean
}
