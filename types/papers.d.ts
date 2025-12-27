// Author information
export interface Author {
  name: string
  email: string
  affiliation?: string
  is_presenter: boolean
}

// Registration/Ticket information
export interface PaperRegistration {
  registration_id: string
  user_id: string
  registrant_name: string
  registrant_email: string
  registration_status_id: string // RAP, RPP, RCN, RIC
  transaction_status_id?: string // TCM, TIN, TAB, TOP
  submission_fee_paid: boolean
  registration_date: string
}

// Topic information
export interface Topic {
  topic_id: string
  name: string
  description?: string
}

// Reviewer information
export interface Reviewer {
  user_id: string
  name: string
  email: string
  assigned_papers_count: number
  completed_reviews_count?: number
  pending_reviews_count?: number
}

export type PaperPhase = 'abstract' | 'full_paper'
export type PaperStatus = 
  | 'draft' 
  | 'abstract_submitted' 
  | 'abstract_revision' 
  | 'abstract_approved' 
  | 'abstract_rejected'
  | 'full_paper_submitted'
  | 'full_paper_revision'
  | 'full_paper_accepted'
  | 'full_paper_rejected'
  // Legacy support/UI mapping
  | 'pending' 
  | 'under_review'

export type PresentationPreference = 'oral' | 'poster' | 'either'

// Paper submission
export interface Paper {
  paper_id: string
  event_id: string
  reg_id: string
  user_id: string
  topic_id: string
  
  title: string
  abstract: string
  authors: Author[]
  keywords?: string[]
  presentation_preference: PresentationPreference
  
  current_status: PaperStatus
  current_phase: PaperPhase
  
  submitted_at: string
  updated_at: string
  
  // UI Helpers (derived or side-loaded)
  topic: Topic
  assigned_reviewers: Reviewer[]
  review_count: number
  attachment_ids?: string[]
  notes?: string
  registration: PaperRegistration
}

// Review information
export interface Review {
  review_id: string
  paper_id: string
  reviewer_id: string
  reviewer?: Reviewer
  phase: PaperPhase
  version: number

  // Ratings
  quality_score: number // 1-5
  relevance_score: number // 1-5
  originality_score?: number // 1-5

  recommendation: 'accept' | 'minor_revision' | 'major_revision' | 'reject'
  comments: string // Visible to Author
  confidential_notes?: string // Only visible to organizers
  
  submitted_at: string
}

// Paper filters
export interface PaperFilters {
  status?: PaperStatus
  topic_id?: string
  reviewer_ids?: string[]
  search?: string
  date_from?: string
  date_to?: string
}

// Paper list response with pagination
export interface PaperListResponse {
  papers: Paper[]
  total: number
  page: number
  per_page: number
  total_pages: number
}

// Pagination information
export interface PaginationInfo {
  total: number
  page: number
  per_page: number
  total_pages: number
}

// Reviewer workload data
export interface ReviewerWorkload {
  reviewer: Reviewer
  assigned_count: number
  completed_count: number
  pending_count: number
}

// Paper analytics data
export interface PaperAnalytics {
  total_submissions: number
  by_status: {
    pending: number
    under_review: number
    accepted: number
    rejected: number
  }
  by_topic: {
    [topic_id: string]: number
  }
  submissions_over_time: Array<{
    date: string
    count: number
  }>
}

// Column configuration for table
export interface ColumnConfig {
  header: string
  key: string
  width: number
  isVisible: boolean
  isHideable: boolean
  accessor?: (row: any) => any
  enableSorting?: boolean
}
