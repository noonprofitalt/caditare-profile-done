import {
    FinanceTransaction, TransactionType, TransactionCategory,
    Invoice, InvoiceStatus, Candidate, WorkflowStage, Employer
} from '../types';
import { supabase } from './supabase';
import { AuditService } from './auditService';

export class FinanceService {

    // --- TRANSACTIONS ---

    static async getTransactions(): Promise<FinanceTransaction[]> {
        const { data, error } = await supabase
            .from('finance_transactions')
            .select('*')
            .order('timestamp', { ascending: false });

        if (error) {
            console.error('Error fetching transactions:', error);
            return [];
        }

        return (data || []).map((row: any) => ({
            id: row.id,
            candidateId: row.candidate_id,
            employerId: row.employer_id,
            type: row.type as TransactionType,
            category: row.category as TransactionCategory,
            amount: parseFloat(row.amount),
            status: row.status as any,
            timestamp: row.timestamp,
            description: row.description,
            referenceId: row.reference_id
        }));
    }

    static async addTransaction(tx: Omit<FinanceTransaction, 'id' | 'timestamp' | 'status'>): Promise<FinanceTransaction | null> {
        const newTx = {
            id: `tx-${Date.now()}`, // Keep frontend ID generation for now to match TEXT type in DB
            candidate_id: tx.candidateId === 'system' ? null : tx.candidateId, // Handle 'system' placeholder
            employer_id: tx.employerId === 'system' ? null : tx.employerId,    // Handle 'system' placeholder
            type: tx.type,
            category: tx.category,
            amount: tx.amount,
            status: 'Completed',
            timestamp: new Date().toISOString(),
            description: tx.description
        };

        const { data, error } = await supabase
            .from('finance_transactions')
            .insert(newTx)
            .select()
            .single();

        if (error) {
            console.error('Error adding transaction:', error);
            return null;
        }

        const result = {
            id: data.id,
            candidateId: data.candidate_id || 'system',
            employerId: data.employer_id || 'system',
            type: data.type as TransactionType,
            category: data.category as TransactionCategory,
            amount: parseFloat(data.amount),
            status: data.status as any,
            timestamp: data.timestamp,
            description: data.description,
            referenceId: data.reference_id
        };

        const auditUserId = await AuditService.getCurrentUserId();
        AuditService.log('FINANCE_TRANSACTION_CREATED', {
            transactionId: result.id,
            type: result.type,
            amount: result.amount,
            candidateId: result.candidateId,
            employerId: result.employerId
        }, auditUserId);

        return result;
    }

    static async updateTransaction(id: string, updates: Partial<FinanceTransaction>): Promise<boolean> {
        const dbUpdates: any = {};
        if (updates.type) dbUpdates.type = updates.type;
        if (updates.category) dbUpdates.category = updates.category;
        if (updates.amount !== undefined) dbUpdates.amount = updates.amount;
        if (updates.description) dbUpdates.description = updates.description;
        if (updates.candidateId) dbUpdates.candidate_id = updates.candidateId === 'system' ? null : updates.candidateId;
        if (updates.employerId) dbUpdates.employer_id = updates.employerId === 'system' ? null : updates.employerId;

        const { error } = await supabase
            .from('finance_transactions')
            .update(dbUpdates)
            .eq('id', id);

        if (error) {
            console.error('Error updating transaction:', error);
            return false;
        }

        const auditUserId = await AuditService.getCurrentUserId();
        AuditService.log('FINANCE_TRANSACTION_UPDATED', { transactionId: id, updates: dbUpdates }, auditUserId);
        return true;
    }

    static async deleteTransaction(id: string): Promise<boolean> {
        const { error } = await supabase
            .from('finance_transactions')
            .delete()
            .eq('id', id);

        if (error) {
            console.error('Error deleting transaction:', error);
            return false;
        }

        const auditUserId = await AuditService.getCurrentUserId();
        AuditService.log('FINANCE_TRANSACTION_DELETED', { transactionId: id }, auditUserId);
        return true;
    }

    // --- INVOICES ---

    static async getInvoices(): Promise<Invoice[]> {
        const { data, error } = await supabase
            .from('invoices')
            .select('*')
            .order('issued_date', { ascending: false });

        if (error) {
            console.error('Error fetching invoices:', error);
            return [];
        }

        return (data || []).map((row: any) => ({
            id: row.id,
            employerId: row.employer_id,
            candidateId: row.candidate_id,
            amount: parseFloat(row.amount),
            issuedDate: row.issued_date,
            dueDate: row.due_date,
            status: row.status as InvoiceStatus,
            items: row.items,
            billingAddress: row.billing_address
        }));
    }

    static async generateInvoice(candidate: Candidate, employer: Employer): Promise<Invoice | null> {
        // Generate ID
        const year = new Date().getFullYear();
        const { count } = await supabase.from('invoices').select('id', { count: 'exact', head: true });
        const nextNum = (count || 0) + 101;
        const invId = `INV-${year}-${nextNum}`;

        const amount = employer.commissionPerHire || 450;

        const newInv = {
            id: invId,
            employer_id: employer.id,
            candidate_id: candidate.id,
            amount,
            issued_date: new Date().toISOString(),
            due_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(), // 30 days
            status: InvoiceStatus.DRAFT,
            items: [
                { description: `Recruitment Commission - ${candidate.role}`, amount }
            ],
            billing_address: `${employer.companyName}, ${employer.country}`
        };

        const { data, error } = await supabase
            .from('invoices')
            .insert(newInv)
            .select()
            .single();

        if (error) {
            console.error('Error generating invoice:', error);
            return null;
        }

        const result = {
            id: data.id,
            employerId: data.employer_id,
            candidateId: data.candidate_id,
            amount: parseFloat(data.amount),
            issuedDate: data.issued_date,
            dueDate: data.due_date,
            status: data.status as InvoiceStatus,
            items: data.items,
            billingAddress: data.billing_address
        };

        const auditUserId = await AuditService.getCurrentUserId();
        AuditService.log('INVOICE_GENERATED', {
            invoiceId: result.id,
            amount: result.amount,
            candidateId: result.candidateId,
            employerId: result.employerId
        }, auditUserId);

        return result;
    }

    static async updateInvoice(id: string, updates: Partial<Invoice>): Promise<boolean> {
        const dbUpdates: any = {};
        if (updates.status) dbUpdates.status = updates.status;
        if (updates.amount !== undefined) dbUpdates.amount = updates.amount;
        if (updates.dueDate) dbUpdates.due_date = updates.dueDate;
        if (updates.billingAddress) dbUpdates.billing_address = updates.billingAddress;

        const { error } = await supabase
            .from('invoices')
            .update(dbUpdates)
            .eq('id', id);

        if (error) {
            console.error('Error updating invoice:', error);
            return false;
        }

        const auditUserId = await AuditService.getCurrentUserId();
        AuditService.log('INVOICE_UPDATED', { invoiceId: id, updates: dbUpdates }, auditUserId);
        return true;
    }

    static async deleteInvoice(id: string): Promise<boolean> {
        const { error } = await supabase
            .from('invoices')
            .delete()
            .eq('id', id);

        if (error) {
            console.error('Error deleting invoice:', error);
            return false;
        }

        const auditUserId = await AuditService.getCurrentUserId();
        AuditService.log('INVOICE_DELETED', { invoiceId: id }, auditUserId);
        return true;
    }

    // --- CALCULATIONS (Stateless) ---

    /**
     * REVENUE PROJECTION LOGIC
     * Calculates potential revenue based on active candidates in the pipeline
     */
    static getProjectedRevenue(candidates: Candidate[], employers: Employer[] = []): number {
        const HIGH_PROBABILITY_STAGES = [
            WorkflowStage.VISA_RECEIVED,
            WorkflowStage.SLBFE_REGISTRATION,
            WorkflowStage.TICKET_ISSUED
        ];

        return candidates.reduce((total, candidate) => {
            if (!candidate) return total;

            // Only count candidates who are in the late, high-probability stages
            if (!HIGH_PROBABILITY_STAGES.includes(candidate.stage)) return total;

            const employer = employers.find(e => e.id === candidate.jobId || (candidate as Candidate & { employerId?: string }).employerId); // fallback
            const commission = employer?.commissionPerHire || 450; // Use default if no specific employer found

            return total + commission;
        }, 0);
    }

    /**
     * ACTUAL REVENUE
     * Sum of all REVENUE transactions in the provided list
     */
    static calculateTotalActualRevenue(transactions: FinanceTransaction[]): number {
        return transactions
            .filter(tx => tx && tx.type === TransactionType.REVENUE && tx.status === 'Completed' && typeof tx.amount === 'number')
            .reduce((sum, tx) => sum + (tx.amount || 0), 0);
    }

    /**
     * TOTAL EXPENSES
     * Sum of all EXPENSE transactions in the provided list
     */
    static calculateTotalExpenses(transactions: FinanceTransaction[]): number {
        return transactions
            .filter(tx => tx && tx.type === TransactionType.EXPENSE && tx.status === 'Completed' && typeof tx.amount === 'number')
            .reduce((sum, tx) => sum + (tx.amount || 0), 0);
    }

    /**
     * NET PROFIT
     */
    static calculateNetProfit(revenue: number, expenses: number): number {
        return revenue - expenses;
    }
}

