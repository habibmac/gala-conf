// types/runtime-config.ts
export interface RuntimeConfig {
    public: {
        apiUrl: string;
        oauthUrl: string;
        oauthClientId: string;
        oauthClientSecret: string;
        oauthRedirectUri: string;
    }
}