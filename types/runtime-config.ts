// types/runtime-config.ts
export interface RuntimeConfig {
  oauthClientSecret: string
  public: {
    apiUrl: string
    oauthUrl: string
    oauthClientId: string
    oauthRedirectUri: string
  }
}
