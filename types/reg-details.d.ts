// types/registration-details.d.ts
export interface RegistrationDetails {
  id: string
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
}

export interface SpecialAttendeeData {
  is_vip: boolean
  display_priority: boolean
  special_treatment: boolean
  notes: string | null
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

export interface RegistrationAnswer {
  qst_id: number
  qst: string
  ans: string
}
