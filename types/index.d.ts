export interface UserProfile {
    ID: string;
    user_login: string;
    user_nicename: string;
    user_email: string;
    user_registered: string;
    user_status: string;
    display_name: string;
    user_roles: string[];
    capabilities: Record<string, boolean>;
    avatar: string;
}

export interface Event {
    id: string;
    title: string;
    logo: string;
    package: string;
    capabilities?: string[];
}

export interface RegRequestParams {
    per_page: string;
    page: string;
    sort_by: string;
    order: string;
    [key: string]: string; // This allows for additional string keys
}

export interface EvtRequestParams {
    search?: Ref<string>;
    evtStatus?: Ref<string>;
    page?: Ref<number>;
    perPage?: Ref<number>;
}
