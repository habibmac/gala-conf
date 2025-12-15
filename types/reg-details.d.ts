// types/registration-details.d.ts
export interface RegistrationDetails {
  id: string
  backend_id: string
  code: string
  date: string
  fullname: string
  phone: string
  email: string
  address: string
  city: string
  ticket_name: string
  ticket_price: string
  total: string
  paid: string
  is_group: boolean
  status: string
  stt_id: string
  reg_url: string
  reg_url_link: string
  invoice_url: string
  receipt_url: string
  ticket_url: string
  age: number
  gender: string
  country_code: string
  txn: TransactionDetails
  pmt: PaymentDetail[]
  ans: RegistrationAnswer[]
  special_attendee?: SpecialAttendeeData
  group_info?: GroupRegistrationInfo
  edit_history?: EditHistoryEntry[]
}

export interface EditHistoryEntry {
  id: number
  field_name: string
  old_value: string
  new_value: string
  changed_by: {
    id: number
    name: string
    login: string
  }
  user_agent: string
  ip_address: string
  created_at: string
}

export interface SpecialAttendeeData {
  is_vip: boolean
  notes: string | null
  display_priority: string
}

export interface GroupRegistrationInfo {
  total_members: number
  group_code: string
  members: GroupMember[]
}

export interface GroupMember {
  id: string
  code: string
  fullname: string
  email: string
  ticket_name: string
  status: string
  stt_id: string
  is_primary: boolean
  is_current: boolean
}

export interface TransactionDetails {
  id: number
  size: number
  reg_paid: number
  total: number
  paid: number
  pay_method: string
  stt_id: string
  status: string
  is_complete: boolean
}

export interface PaymentDetail {
  timestamp: string
  amount: number
  status: string
  details: PaymentGatewayDetails
  gateway_response: string
  method: string
}

export interface PaymentGatewayDetails {
  e_reg_url_link: string
  ee_payment_method: string
  MerchantCode: string
  PaymentId: string
  RefNo: string
  Amount: string
  Currency: string
  Remark: string
  TransId: string
  AuthCode: string
  Status: string
  ErrDesc: string
  PaymentDate: string
}

export interface QuestionOption {
  value: string
  label: string
}

export interface RegistrationAnswer {
  qst_id: number
  qst: string
  qst_type: string
  qst_group?: string
  qst_group_order?: number
  ans: string
  options?: QuestionOption[]
}
