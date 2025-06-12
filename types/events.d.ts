export interface EvtRequestParams {
  search?: Ref<string>
  evtStatus?: Ref<string>
  page?: Ref<number>
  perPage?: Ref<number>
}

export interface EvtDatetime {
  id: string
  name: string
  start: string // Unix timestamp as string
  end: string // Unix timestamp as string
  reg_limit: string | null // Unix timestamp as string or null
  sold: number
  reserved: number
  available: number | null
  is_active: boolean
  is_upcoming: boolean
  is_expired: boolean
}
