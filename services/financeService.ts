import {
    FinanceTransaction, TransactionType, TransactionCategory,
    Invoice, InvoiceStatus, Candidate, WorkflowStage, Employer
} from '../types';
import { CandidateService } from './candidateService';
import { PartnerService } from './partnerService';

const TRANSACTION_STORAGE_KEY = 'caditare_transactions_v2';
const INVOICE_STORAGE_KEY = 'caditare_invoices_v2';

const MOCK_TRANSACTIONS: FinanceTransaction[] = [
    {
        id: 'tx-1',
        candidateId: 'cand-1',
        employerId: 'emp-1',
        type: TransactionType.REVENUE,
        category: TransactionCategory.COMMISSION,
        amount: 450,
        status: 'Completed',
        timestamp: '2025-02-01T10:00:00Z',
        description: 'Placement commission for John Doe'
    },
    {
        id: 'tx-2',
        candidateId: 'cand-1',
        employerId: 'emp-1',
        type: TransactionType.EXPENSE,
        category: TransactionCategory.VISA_FEE,
        amount: 150,
        status: 'Completed',
        timestamp: '2025-02-02T14:00:00Z',
        description: 'Saudi Visa Fee'
    },
    {
        id: 'tx-3',
        candidateId: 'cand-1',
        employerId: 'emp-1',
        type: TransactionType.EXPENSE,
        category: TransactionCategory.FLIGHT_TICKET,
        amount: 320,
        status: 'Completed',
        timestamp: '2025-02-05T09:00:00Z',
        description: 'Ticket to Riyadh'
    }
];

const MOCK_INVOICES: Invoice[] = [
    {
        id: 'inv-2025-001',
        employerId: 'emp-1',
        candidateId: 'cand-1',
        amount: 450,
        issuedDate: '2025-02-06T10:00:00Z',
        dueDate: '2025-03-06T10:00:00Z',
        status: InvoiceStatus.SENT,
        items: [
            { description: 'Recruitment Commission - Senior Engineer', amount: 450 }
        ],
        billingAddress: 'Al-Fanar Tower, Riyadh, Saudi Arabia'
    }
];

export class FinanceService {
    static getTransactions(): FinanceTransaction[] {
        const stored = localStorage.getItem(TRANSACTION_STORAGE_KEY);
        if (stored) {
            try {
                const parsed = JSON.parse(stored);
                return Array.isArray(parsed) ? parsed : [];
            } catch (e) {
                console.error("Failed to parse transactions", e);
            }
        }
        // Initialize with MOCK data if empty, but save it so we can add to it later
        this.saveTransactions(MOCK_TRANSACTIONS);
        return MOCK_TRANSACTIONS;
    }

    static saveTransactions(txs: FinanceTransaction[]): void {
        try {
            localStorage.setItem(TRANSACTION_STORAGE_KEY, JSON.stringify(txs));
            // Trigger storage event for cross-tab or same-tab updates
            window.dispatchEvent(new Event('storage'));
        } catch (e) {
            console.error("Failed to save transactions", e);
        }
    }

    static addTransaction(tx: Omit<FinanceTransaction, 'id' | 'timestamp' | 'status'>): FinanceTransaction {
        const txs = this.getTransactions();
        const newTx: FinanceTransaction = {
            ...tx,
            id: `tx-${Date.now()}`,
            timestamp: new Date().toISOString(),
            status: 'Completed'
        };
        txs.unshift(newTx); // Add to top
        this.saveTransactions(txs);
        return newTx;
    }

    static getInvoices(): Invoice[] {
        const stored = localStorage.getItem(INVOICE_STORAGE_KEY);
        if (stored) {
            try {
                const parsed = JSON.parse(stored);
                return Array.isArray(parsed) ? parsed : [];
            } catch (e) {
                console.error("Failed to parse invoices", e);
            }
        }
        this.saveInvoices(MOCK_INVOICES);
        return MOCK_INVOICES;
    }

    static saveInvoices(invs: Invoice[]): void {
        try {
            localStorage.setItem(INVOICE_STORAGE_KEY, JSON.stringify(invs));
        } catch (e) {
            console.error("Failed to save invoices", e);
        }
    }

    /**
     * REVENUE PROJECTION LOGIC
     * Calculates potential revenue based on active candidates in the pipeline
     */
    static getProjectedRevenue(candidates: Candidate[], employers: Employer[] = []): number {
        return candidates.reduce((total, candidate) => {
            if (!candidate) return total;
            // If already departed, it's actual revenue, not projected
            if (candidate.stage === WorkflowStage.DEPARTED) return total;

            const employer = employers.find(e => e.id === candidate.jobId || (candidate as Candidate & { employerId?: string }).employerId); // fallback
            const commission = employer?.commissionPerHire || 450; // Use default if no specific employer found

            return total + commission;
        }, 0);
    }

    /**
     * ACTUAL REVENUE
     * Sum of all REVENUE transactions
     */
    static getTotalActualRevenue(): number {
        const txs = this.getTransactions();
        if (!txs) return 0;
        return txs
            .filter(tx => tx && tx.type === TransactionType.REVENUE && tx.status === 'Completed')
            .reduce((sum, tx) => sum + tx.amount, 0);
    }

    /**
     * TOTAL EXPENSES
     * Sum of all EXPENSE transactions
     */
    static getTotalExpenses(): number {
        const txs = this.getTransactions();
        if (!txs) return 0;
        return txs
            .filter(tx => tx && tx.type === TransactionType.EXPENSE && tx.status === 'Completed')
            .reduce((sum, tx) => sum + tx.amount, 0);
    }

    /**
     * NET PROFIT
     */
    static getNetProfit(): number {
        return this.getTotalActualRevenue() - this.getTotalExpenses();
    }

    static generateInvoice(candidate: Candidate, employer: Employer): Invoice {
        const invs = this.getInvoices();
        const amount = employer.commissionPerHire || 450;
        const newInv: Invoice = {
            id: `INV-${new Date().getFullYear()}-${invs.length + 101}`,
            employerId: employer.id,
            candidateId: candidate.id,
            amount,
            issuedDate: new Date().toISOString(),
            dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(), // 30 days
            status: InvoiceStatus.DRAFT,
            items: [
                { description: `Recruitment Commission - ${candidate.role}`, amount }
            ],
            billingAddress: employer.companyName + ', ' + employer.country
        };
        invs.unshift(newInv);
        this.saveInvoices(invs);
        return newInv;
    }
}
