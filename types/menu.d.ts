export interface MenuItem {
  name: string
  to: string
  roles?: string[]
  capabilities?: string[]
  permissions?: string[]
  packages?: string[]
  group: string
  icon?: string
  order?: number
  generatedLink?: { path: string }
}

export interface MenuGroup {
  id: string
  label: string
  menus: MenuItem[]
}
