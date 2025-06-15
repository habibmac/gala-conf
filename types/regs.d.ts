export interface Event {
  id: string
  title: string
  logo: string
  package: string
  capabilities?: string[]
}

export interface RegRequestParams {
  per_page: string
  page: string
  sort_by: string
  order: string
  [key: string]: string | string[] | undefined // Allow string arrays and undefined
}

export interface RegItem {
  id: string
  code: string
  date: string
  fullname: string
  ticket_name: string
  ticket_price: string
  total: string
  paid: string
  status: string
  stt_id: string
  ans?: Answer[]
  [key: string]: string
}

export interface ColumnConfig {
  key: string
  header: string
  isVisible: boolean
  isHideable: boolean
  width: number // Width in percentage
  enableSorting?: boolean
  accessor?: (row: RegItem) => string
}

export interface Filter {
  search: string
  ticket_name: string[]
  status: string[]
  date_start: string
  date_end: string
}

export interface TicketGroup {
  id: string
  name: string
  tickets: TicketList[]
  count: number
}

export interface TicketList {
  id: string
  name: string
}

export interface CustomField {
  key: string
  label: string
  slug: string
}

export interface Answer {
  qst_id: number
  qst: string
  ans: string
}
