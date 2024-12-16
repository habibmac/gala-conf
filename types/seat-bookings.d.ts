// types/seat-bookings.ts
export interface BookingData {
    name: string;
    status: 'RPP' | 'RAP' | 'RCN'; // Explicit status types
    reg_code: string;
}

export interface LegendItem {
    name: string;
    display_name: string;
    class: string;
}

export interface TicketScope {
    day: number;
    name: string;
    id: number;
    start: string;
    end: string;
}

export interface SeatItem {
    code: string;
    row: number;
    col: number;
    class: number;
    type: string;
    status: 'active' | 'inactive' | 'pending';
    bookings: BookingData[] | null;
}

export interface SeatLayout {
    width: number;
    height: number;
    stage: {
        width: number;
        startRow: number;
        rows: number;
    };
    aisles: Array<{
        afterCol: number;
        width: number;
    }>;
}

export interface SeatData {
    layout: SeatLayout;
    legend: LegendItem[];
    ticket_scopes: TicketScope[];
    seats: SeatItem[];
}