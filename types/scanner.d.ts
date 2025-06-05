
// Types
export interface ScannerSettings {
    event: {
        id: string;
        name: string;
        status: string;
        package: string;
    };
    datetimes: Array<{
        id: string;
        name: string;
        start: string; // API returns string, not number
        end: string; // API returns string, not number
        reg_limit: number | null;
        sold: number;
        reserved: number;
        available: number | null;
        is_active: boolean;
        is_upcoming: boolean;
        is_expired: boolean;
    }>;
    capabilities: {
        lookup: boolean;
        continuous_scan: boolean;
        batch_operations: boolean;
        group_checkin: boolean;
        force_checkin: boolean;
        search: boolean;
        stats: boolean;
    };
    stats: {
        total_checkins: string | number; // API returns string
        total_checkouts: string | number; // API returns string
        currently_checked_in: string | number; // API returns string
    };
    recent_activity: Array<{
        REG_ID: string;
        REG_code: string;
        name: string;
        address: string;
        city: string;
        ticket: string;
        check_time: string;
    }>;
    scanner_config?: {
        continuous_mode: boolean;
        sound_enabled: boolean;
        vibration_enabled: boolean;
        auto_checkout: boolean;
        require_confirmation: boolean;
    };
    supported_formats?: string[];
}

export interface RegistrationData {
    id: string;
    code: string;
    status: string;
    checkin_status: number;
    checkin_status_text: string;
    last_checkin_time: string | null;
    attendee: {
        id: number;
        first_name: string;
        last_name: string;
        full_name: string;
        email: string;
        phone: string;
    };
    ticket: {
        id: number;
        name: string;
        price: number;
    };
    transaction: {
        id: number;
        total: number;
        paid: number;
        status: string;
        is_completed: boolean;
    };
    payment_validation?: {
        requires_payment: boolean;
        payment_completed: boolean;
        registration_approved: boolean;
        can_checkin_payment: boolean;
        payment_message: string;
    };
    group_registrations?: Array<{
        id: string;
        code: string;
        attendee_name: string;
        ticket_name: string;
        checkin_status: number;
        checkin_status_text: string;
        can_checkin: boolean;
        can_checkout: boolean;
        [key: string]: any; // Allow additional properties
        // This allows for flexibility in the group registration data structure
        // while still keeping the core properties defined.
        // You can access properties like:
        // registrationData.group_registrations[0].id
    }> | null | undefined;
        
    can_checkin: boolean;
    can_checkout: boolean;
}

export interface ScanHistoryItem {
    id: string;
    code: string;
    timestamp: number;
    status: 'success' | 'error' | 'duplicate' | 'lookup';
    message?: string;
    attendeeName?: string;
    action?: string;
    registrationData?: RegistrationData;
}

// Scanner modes
export type ScannerMode = 'lookup' | 'continuous' | 'search';