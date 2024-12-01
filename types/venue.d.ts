// types/venue.ts
export interface SeatHistory {
    action: string;
    notes: string;
    updated_at: string;
}

export interface Registration {
    reg_code: string;
    reg_date: string;
    reg_status: string;
    trx_status: string;
    trx_date: string;
    trx_steps: string;
    payment_status: string;
    payment_response: string;
}

export interface SeatBooking {
    attendee: string;
    status: string;
    phone: string;
    reg_code: string;
    history: SeatHistory[];
    registrations: Registration[];
    current_status: string;
}

export interface VenueConfig {
    duration_days: number;
    ticket_day_scope: Array<{
        ticket_id: number;
        days: number[];
    }>;
    seat_reset: string;
    pricing_type: string;
}

// types/venue.ts
interface VenueLayout {
    layout: {
        width: number;
        height: number;
        stage: {
            width: number;
            rows: number;
            startRow: number;
        };
        aisles: Array<{
            afterCol: number;
            width: number;
        }>;
    };
    seats: Array<{
        code: string;
        row: number;
        col: number;
        type: 'vip' | 'premium';
    }>;
}

interface VenueData {
    has_seating: boolean;
    layout?: VenueLayout;
    qst_id?: string;
}