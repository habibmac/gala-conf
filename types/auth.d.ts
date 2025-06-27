export interface UserProfile {
  ID: string
  user_login: string
  user_nicename: string
  user_email: string
  user_registered: string
  user_status: string
  display_name: string
  user_roles: string[]
  capabilities: Record<string, boolean>
  avatar: string
  first_name?: string
  last_name?: string
  google_linked?: boolean
}

interface AuthResponse {
  access_token: string
  refresh_token: string
  expires_in: number
  token_type: string
  scope: string
}

export interface UserProfile {
  ID: string
  user_login: string
  user_nicename: string
  user_email: string
  user_registered: string
  user_status: string
  display_name: string
  user_roles: string[]
  capabilities: Record<string, boolean>
  avatar: string
  first_name?: string
  last_name?: string
  google_linked?: boolean
}

// Add registration response types
export interface RegistrationResponse {
  message: string
  user_id: number
  email_sent?: boolean
  tokens?: {
    access_token: string
    refresh_token: string
    expires_in: number
    token_type: string
    scope: string
  }
  user?: {
    id: number
    username: string
    email: string
    first_name: string
    last_name: string
    role: string
    google_linked?: boolean
  }
  requires_login?: boolean
}
