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
    [key: string]: string | string[] | undefined; // Allow string arrays and undefined
}

export interface EvtRequestParams {
    search?: Ref<string>;
    evtStatus?: Ref<string>;
    page?: Ref<number>;
    perPage?: Ref<number>;
}

interface AuthResponse {
    access_token: string;
    refresh_token: string;
    expires_in: number;
    token_type: string;
    scope: string;
}

export interface ColumnConfig {
    key: string;
    header: string;
    isVisible: boolean;
    isHideable: boolean;
    width: number; // Width in percentage
}

interface Filter {
    search: string;
    ticket_name: string[];
    status: string[];
    date_start: string; // Allow undefined
    date_end: string; // Allow undefined
}

interface Reg {
    id: string;
    code: string;
    date: string;
    fullname: string;
    ticket_name: string;
    ticket_price: string;
    total: string;
    paid: string;
    status: string;
    stt_id: string;
    [key: string]: any;
}
