/**
 * Finance Types
 * Transaction, invoice, and advance payment types
 */

export enum TransactionType {
    REVENUE = 'Revenue',
    EXPENSE = 'Expense',
}

export enum TransactionCategory {
    COMMISSION = 'Commission',
    VISA_FEE = 'Visa Fee',
    FLIGHT_TICKET = 'Flight Ticket',
    MEDICAL_FEE = 'Medical Fee',
    EMBASSY_FEE = 'Embassy Fee',
    AGENT_COMMISSION = 'Agent Commission',
    OFFICE_RENT = 'Office Rent',
    OTHER = 'Other',
}

export enum InvoiceStatus {
    DRAFT = 'Draft',
    SENT = 'Sent',
    PAID = 'Paid',
    OVERDUE = 'Overdue',
    CANCELLED = 'Cancelled',
}

export enum AdvancePaymentType {
    REGISTER_FEE = 'Register Fee',
    OFFER = 'Offer',
    WORK_PERMIT = 'Work Permit',
    EMB_USD = 'Embassy USD',
    BALANCE_PAY = 'Balance Pay',
    TICKET = 'Ticket',
    DEPOSIT = 'Deposit',
    OTHER = 'Other',
}

export interface AdvancePayment {
    id: string;
    type: AdvancePaymentType;
    informed?: boolean;
    informedDate?: string;
    signDate?: string;
    invoiceNo?: string;
    amount?: number;
    remarks?: string;
}

export interface PaymentRecord {
    id: string;
    date: string;
    amount: string;
    notes?: string;
}

export interface FinanceTransaction {
    id: string;
    candidateId: string;
    employerId: string;
    type: TransactionType;
    category: TransactionCategory;
    amount: number;
    status: 'Pending' | 'Completed' | 'Reversed';
    timestamp: string;
    description?: string;
    referenceId?: string;
}

export interface Invoice {
    id: string;
    employerId: string;
    candidateId: string;
    amount: number;
    issuedDate: string;
    dueDate: string;
    status: InvoiceStatus;
    items: { description: string; amount: number }[];
    billingAddress?: string;
}
