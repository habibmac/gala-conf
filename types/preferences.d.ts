export interface UserPreferences {
  sidebarExpanded: boolean;
  theme: 'dark' | 'light' | 'system';
  locale: string;
  itemsPerPage: number;
}

export interface PreferencesResponse {
  success: boolean;
  data: UserPreferences;
}