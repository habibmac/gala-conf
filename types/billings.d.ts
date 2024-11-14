export interface Billing {
    id: string;
    date: string;
    description: string;
    type: 'fee' | 'payment' | 'refund';
    amount: number;
    status: 'pending' | 'paid' | 'cancelled';
    reference: string;
    metadata?: Record<string, any>;
}

export interface BillingSummary {
    pending_amount: number;
    paid_amount: number;
}

export interface BillingFilters {
    search?: string;
    type?: string;
    status?: string;
    date_start?: string;
    date_end?: string;
}