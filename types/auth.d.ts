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
