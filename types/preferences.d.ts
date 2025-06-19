export interface UserPreferences {
  language: string
  locale: string
  timezone: string
  theme: 'dark' | 'light' | 'system'
  itemsPerPage?: number
  sidebarExpanded?: boolean
}

export interface PreferencesResponse {
  success: boolean
  data: UserPreferences
}
