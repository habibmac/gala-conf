export interface ApiErrorResponse {
  code: string
  message: string
  data?: {
    status: number
    [key: string]: any
  }
  errors?: string[]
}

export interface ApiError extends Error {
  response?: {
    data: ApiErrorResponse
    status: number
    statusText: string
  }
}

export interface ApiErrorResult {
  errorMessage: string
  errorDescription: string
}
