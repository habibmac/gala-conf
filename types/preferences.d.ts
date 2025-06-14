export interface UserPreferences {
  theme: 'dark' | 'light' | 'system'
  locale: string
  itemsPerPage: number
  sidebarExpanded: boolean
  timezone: string
}

export interface PreferencesResponse {
  success: boolean
  data: UserPreferences
}
