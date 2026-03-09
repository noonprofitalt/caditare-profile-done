import React, { useState, useEffect, useMemo } from 'react';
import { useToast } from '../context/ToastContext';
import { Link } from 'react-router-dom';
import { FinanceService } from '../services/financeService';
import { CandidateService } from '../services/candidateService';
import { PartnerService } from '../services/partnerService';
import {
    FinanceTransaction, TransactionType, TransactionCategory,
    Invoice, InvoiceStatus
} from '../types';
import {
    TrendingUp, TrendingDown, Receipt, Search, Filter,
    Download, Plus, PieChart, FileText, AlertCircle, RefreshCw, X,
    Edit2, Trash2, CheckCircle, ChevronDown
} from 'lucide-react';
import { supabase } from '../services/supabase';

const FinanceLedger: React.FC = () => {
    const toast = useToast();
    const [isTransactionModalOpen, setIsTransactionModalOpen] = useState(false);
    const [isInvoiceModalOpen, setIsInvoiceModalOpen] = useState(false);

    // Transaction Modal State
    const [editingTransaction, setEditingTransaction] = useState<FinanceTransaction | null>(null);
    const [newTxType, setNewTxType] = useState<TransactionType>(TransactionType.EXPENSE);
    const [newTxAmount, setNewTxAmount] = useState('');
    const [newTxDescription, setNewTxDescription] = useState('');
    const [newTxCategory, setNewTxCategory] = useState<TransactionCategory>(TransactionCategory.OFFICE_RENT);

    // Invoice Modal State
    const [editingInvoice, setEditingInvoice] = useState<Invoice | null>(null);
    const [newInvStatus, setNewInvStatus] = useState<InvoiceStatus>(InvoiceStatus.DRAFT);
    const [newInvAmount, setNewInvAmount] = useState('');
    const [newInvDueDate, setNewInvDueDate] = useState('');

    const [transactions, setTransactions] = useState<FinanceTransaction[]>([]);
    const [invoices, setInvoices] = useState<Invoice[]>([]);
    const [candidateNames, setCandidateNames] = useState<Record<string, string>>({});
    const [employerNames, setEmployerNames] = useState<Record<string, string>>({});

    const [projection, setProjection] = useState(0);
    const [actualRevenue, setActualRevenue] = useState(0);
    const [expenses, setExpenses] = useState(0);
    const [activeTab, setActiveTab] = useState<'overview' | 'transactions' | 'invoices'>('overview');
    const [isLoading, setIsLoading] = useState(true);
    const [isRefreshing, setIsRefreshing] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');

    const refreshFinanceData = async () => {
        setIsRefreshing(true);
        try {
            const [rawTxData, rawInvData] = await Promise.all([
                Promise.resolve(FinanceService.getTransactions() || []),
                Promise.resolve(FinanceService.getInvoices() || [])
            ]);

            const txData = (rawTxData || []).filter(t => t && t.id);
            const invData = (rawInvData || []).filter(i => i && i.id);

            if (txData.length > 0) localStorage.setItem('caditare_offline_finance_tx', JSON.stringify(txData));
            if (invData.length > 0) localStorage.setItem('caditare_offline_finance_inv', JSON.stringify(invData));

            setTransactions(txData.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()));
            setInvoices(invData.sort((a, b) => new Date(b.issuedDate || b.dueDate).getTime() - new Date(a.issuedDate || a.dueDate).getTime()));

            setActualRevenue(FinanceService.calculateTotalActualRevenue(txData) || 0);
            setExpenses(FinanceService.calculateTotalExpenses(txData) || 0);

            const uniqueCandIds = Array.from(new Set([
                ...txData.map(t => t.candidateId),
                ...invData.map(i => i.candidateId)
            ])).filter(id => id && id !== 'system');

            const nameMap: Record<string, string> = {};
            await Promise.all(uniqueCandIds.map(async id => {
                const cand = await CandidateService.getCandidateById(id);
                if (cand && cand.name) {
                    nameMap[id] = cand.name.split(' ')[0];
                } else {
                    nameMap[id] = id;
                }
            }));
            setCandidateNames(nameMap);

            const allCandidates = await CandidateService.getCandidates();
            const allEmployers = await PartnerService.getEmployers();

            const empMap: Record<string, string> = {};
            allEmployers.forEach(e => {
                empMap[e.id] = e.companyName;
            });
            setEmployerNames(empMap);

            setProjection(FinanceService.getProjectedRevenue(allCandidates, allEmployers) || 0);
        } catch (error) {
            console.error("Failed to load finance data", error);
        } finally {
            setIsLoading(false);
            setIsRefreshing(false);
        }
    };

    useEffect(() => {
        refreshFinanceData();
        const channel = supabase ? supabase.channel('public:finance') : null;
        if (!channel) return;

        const subscription = channel
            .on('postgres_changes', { event: '*', schema: 'public', table: 'finance_transactions' }, () => refreshFinanceData())
            .on('postgres_changes', { event: '*', schema: 'public', table: 'invoices' }, () => refreshFinanceData())
            .subscribe();

        return () => { subscription.unsubscribe(); };
    }, []);

    const handleSaveTransaction = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newTxAmount || isNaN(parseFloat(newTxAmount))) {
            toast.error("Please enter a valid amount");
            return;
        }

        try {
            if (editingTransaction) {
                await FinanceService.updateTransaction(editingTransaction.id, {
                    type: newTxType,
                    amount: parseFloat(newTxAmount),
                    description: newTxDescription,
                    category: newTxCategory
                });
                toast.success('Transaction updated');
            } else {
                await FinanceService.addTransaction({
                    type: newTxType,
                    amount: parseFloat(newTxAmount) || 0,
                    description: newTxDescription || 'Manual Entry',
                    category: newTxCategory,
                    candidateId: 'system',
                    employerId: 'system',
                });
                toast.success('Transaction recorded');
            }

            refreshFinanceData();
            closeTransactionModal();
        } catch (error) {
            toast.error('Failed to save record.');
        }
    };

    const handleDeleteTransaction = async (id: string) => {
        if (!window.confirm('Are you sure you want to delete this transaction?')) return;
        try {
            await FinanceService.deleteTransaction(id);
            refreshFinanceData();
            toast.success('Transaction deleted');
        } catch (error) {
            toast.error('Failed to delete transaction');
        }
    };

    const handleSaveInvoice = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!editingInvoice) return;

        try {
            await FinanceService.updateInvoice(editingInvoice.id, {
                status: newInvStatus,
                amount: parseFloat(newInvAmount),
                dueDate: newInvDueDate
            });
            refreshFinanceData();
            setIsInvoiceModalOpen(false);
            setEditingInvoice(null);
            toast.success('Invoice updated');
        } catch (error) {
            toast.error('Failed to update invoice');
        }
    };

    const handleDeleteInvoice = async (id: string) => {
        if (!window.confirm('Are you sure you want to delete this invoice?')) return;
        try {
            await FinanceService.deleteInvoice(id);
            refreshFinanceData();
            toast.success('Invoice deleted');
        } catch (error) {
            toast.error('Failed to delete invoice');
        }
    };

    const openEditTransaction = (tx: FinanceTransaction) => {
        setEditingTransaction(tx);
        setNewTxType(tx.type);
        setNewTxAmount(tx.amount.toString());
        setNewTxDescription(tx.description || '');
        setNewTxCategory(tx.category);
        setIsTransactionModalOpen(true);
    };

    const openEditInvoice = (inv: Invoice) => {
        setEditingInvoice(inv);
        setNewInvStatus(inv.status);
        setNewInvAmount(inv.amount.toString());
        setNewInvDueDate(new Date(inv.dueDate).toISOString().split('T')[0]);
        setIsInvoiceModalOpen(true);
    };

    const closeTransactionModal = () => {
        setIsTransactionModalOpen(false);
        setEditingTransaction(null);
        setNewTxAmount('');
        setNewTxDescription('');
        setNewTxType(TransactionType.EXPENSE);
    };

    const handleExportReport = () => {
        const headers = ['Date', 'Description', 'Category', 'Type', 'Amount', 'Candidate', 'Employer'];
        const csvContent = [
            headers.join(','),
            ...transactions.map(tx => [
                new Date(tx.timestamp).toLocaleDateString(),
                `"${tx.description}"`,
                tx.category,
                tx.type,
                tx.amount,
                tx.candidateId || '',
                tx.employerId || ''
            ].join(','))
        ].join('\n');

        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        if (link.download !== undefined) {
            const url = URL.createObjectURL(blob);
            link.setAttribute('href', url);
            link.setAttribute('download', `Finance_Ledger_${new Date().toISOString().split('T')[0]}.csv`);
            link.style.visibility = 'hidden';
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
        }
    };

    const categoryBreakdown = useMemo(() => {
        const breakdown: Record<string, number> = {};
        transactions.forEach(tx => {
            if (tx.type === TransactionType.EXPENSE) {
                breakdown[tx.category] = (breakdown[tx.category] || 0) + tx.amount;
            }
        });
        const totalExp = Object.values(breakdown).reduce((sum, val) => sum + val, 0);
        return Object.entries(breakdown)
            .map(([cat, amount]) => ({
                category: cat,
                amount,
                percentage: totalExp > 0 ? (amount / totalExp) * 100 : 0
            }))
            .sort((a, b) => b.amount - a.amount)
            .slice(0, 5);
    }, [transactions]);

    const formatCatName = (cat: string) => cat.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());

    const filteredTransactions = useMemo(() => {
        if (!searchQuery.trim()) return transactions;
        const q = searchQuery.toLowerCase();
        return transactions.filter(t =>
            (t.description || '').toLowerCase().includes(q) ||
            t.category.toLowerCase().includes(q) ||
            (candidateNames[t.candidateId]?.toLowerCase() || '').includes(q) ||
            (employerNames[t.employerId]?.toLowerCase() || '').includes(q)
        );
    }, [transactions, searchQuery, candidateNames, employerNames]);

    const filteredInvoices = useMemo(() => {
        if (!searchQuery.trim()) return invoices;
        const q = searchQuery.toLowerCase();
        return invoices.filter(i =>
            i.id.toLowerCase().includes(q) ||
            (candidateNames[i.candidateId]?.toLowerCase() || '').includes(q) ||
            (employerNames[i.employerId]?.toLowerCase() || '').includes(q)
        );
    }, [invoices, searchQuery, candidateNames, employerNames]);

    const netProfit = actualRevenue - expenses;

    return (
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 flex flex-col h-full m-3 sm:m-4 md:m-8 animate-in fade-in duration-500">
            {/* Header */}
            <div className="p-6 border-b border-slate-100 flex items-center justify-between flex-wrap gap-4">
                <div>
                    <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
                        Finance Ledger
                        {isRefreshing && <RefreshCw size={14} className="animate-spin text-blue-500" />}
                    </h2>
                    <p className="text-slate-500 text-sm">Monitor revenue, track expenses, and manage client invoicing</p>
                </div>
                <div className="flex items-center gap-3">
                    <button
                        onClick={refreshFinanceData}
                        disabled={isLoading || isRefreshing}
                        className="p-2 sm:p-1.5 text-slate-400 hover:text-blue-600 transition-colors disabled:opacity-50 btn-touch"
                        title="Refresh Data"
                    >
                        <RefreshCw size={16} />
                    </button>
                    {(activeTab === 'transactions' || activeTab === 'invoices') && (
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                            <input
                                type="text"
                                placeholder={`Search ${activeTab}...`}
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="pl-9 pr-4 py-2.5 sm:py-2 text-sm border border-slate-200 rounded-lg outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 w-full sm:w-64 bg-slate-50 focus:bg-white transition-all"
                            />
                        </div>
                    )}
                    <button
                        onClick={handleExportReport}
                        className="px-4 py-2.5 sm:py-2 text-sm border border-slate-200 text-slate-600 rounded-lg hover:bg-slate-50 font-medium transition-colors flex items-center justify-center gap-2 btn-touch"
                    >
                        <Download size={16} /> <span className="hidden sm:inline">Export</span>
                    </button>
                    <button
                        onClick={() => setIsTransactionModalOpen(true)}
                        className="px-4 py-2.5 sm:py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors flex items-center justify-center gap-2 btn-touch"
                    >
                        <Plus size={16} /> <span className="hidden sm:inline">Record Entry</span><span className="sm:hidden">Entry</span>
                    </button>
                </div>
            </div>

            {/* KPI Metrics */}
            <div className="grid grid-cols-2 md:grid-cols-4 border-b border-slate-100">
                <div className="p-4 sm:p-6 border-r border-b md:border-b-0 border-slate-100">
                    <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Projected Pipeline</p>
                    <div className="flex items-baseline gap-2">
                        <span className="text-2xl font-bold text-slate-900">${projection.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                    </div>
                </div>
                <div className="p-4 sm:p-6 border-r md:border-r border-b md:border-b-0 border-slate-100">
                    <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Actual Revenue</p>
                    <div className="flex items-baseline gap-2">
                        <span className="text-2xl font-bold text-green-700">${actualRevenue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                    </div>
                </div>
                <div className="p-4 sm:p-6 border-r border-slate-100">
                    <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Total Expenses</p>
                    <div className="flex items-baseline gap-2">
                        <span className="text-2xl font-bold text-slate-900">${expenses.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                    </div>
                </div>
                <div className="p-4 sm:p-6 bg-slate-50">
                    <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Net Profit</p>
                    <div className="flex items-baseline gap-2">
                        <span className={`text-2xl font-bold ${netProfit >= 0 ? 'text-slate-900' : 'text-red-600'}`}>${Math.abs(netProfit).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                        {netProfit < 0 && <span className="text-xs font-bold text-red-600">(Loss)</span>}
                    </div>
                </div>
            </div>

            {/* Tabs */}
            <div className="flex border-b border-slate-200 overflow-x-auto scrollbar-none snap-x snap-mandatory">
                {[
                    { id: 'overview', label: 'Overview', icon: PieChart },
                    { id: 'transactions', label: 'Transactions', icon: Receipt },
                    { id: 'invoices', label: 'Invoices', icon: FileText },
                ].map((tab) => (
                    <button
                        key={tab.id}
                        onClick={() => {
                            setActiveTab(tab.id as any);
                            setSearchQuery('');
                        }}
                        className={`flex shrink-0 snap-start items-center justify-center gap-2 px-6 py-4 text-sm font-medium border-b-2 transition-colors btn-touch ${activeTab === tab.id
                            ? 'border-blue-600 text-blue-600'
                            : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'
                            }`}
                    >
                        <tab.icon size={16} />
                        {tab.label}
                    </button>
                ))}
            </div>

            {/* Tab Contents */}
            <div className="flex-1 overflow-auto bg-white min-h-[400px]">
                {isLoading && (
                    <div className="p-12 text-center text-slate-500">
                        <RefreshCw size={24} className="animate-spin mx-auto text-blue-500 mb-4" />
                        <p className="text-sm">Loading financial data...</p>
                    </div>
                )}

                {!isLoading && activeTab === 'overview' && (
                    <div className="p-6 grid grid-cols-1 lg:grid-cols-2 gap-8">
                        <div>
                            <h3 className="text-sm font-bold text-slate-800 mb-4 border-b border-slate-100 pb-2">Top Expenses</h3>
                            {categoryBreakdown.length > 0 ? (
                                <div className="space-y-4">
                                    {categoryBreakdown.map((item, i) => (
                                        <div key={i}>
                                            <div className="flex justify-between text-sm mb-1">
                                                <span className="text-slate-700">{formatCatName(item.category)}</span>
                                                <span className="text-slate-900 font-medium">${item.amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} <span className="text-slate-400 text-xs ml-1">({item.percentage.toFixed(0)}%)</span></span>
                                            </div>
                                            <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                                                <div
                                                    className="h-full bg-slate-400 rounded-full"
                                                    style={{ width: `${item.percentage}%` }}
                                                />
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <p className="text-sm text-slate-500 italic">No expenses recorded yet.</p>
                            )}
                        </div>

                        <div>
                            <h3 className="text-sm font-bold text-slate-800 mb-4 border-b border-slate-100 pb-2">System Alerts</h3>
                            <div className="space-y-3">
                                {invoices.filter(i => i.status !== InvoiceStatus.PAID).length > 0 ? (
                                    <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg flex items-start gap-3">
                                        <AlertCircle size={16} className="text-yellow-600 mt-0.5" />
                                        <div>
                                            <p className="text-sm font-medium text-yellow-800">Unpaid Invoices</p>
                                            <p className="text-xs text-yellow-700 mt-0.5">There are {invoices.filter(i => i.status !== InvoiceStatus.PAID).length} pending or overdue invoices requiring attention.</p>
                                        </div>
                                    </div>
                                ) : (
                                    <p className="text-sm text-slate-500 italic">No active alerts.</p>
                                )}
                            </div>
                        </div>
                    </div>
                )}

                {!isLoading && activeTab === 'transactions' && (
                    <div className="overflow-x-auto bg-white min-h-[300px]">
                        <table className="w-full text-left text-sm whitespace-nowrap">
                            <thead className="bg-slate-50 text-slate-600 font-medium text-xs border-b border-slate-200">
                                <tr>
                                    <th className="px-6 py-4">Date</th>
                                    <th className="px-6 py-4">Type</th>
                                    <th className="px-6 py-4">Description</th>
                                    <th className="px-6 py-4">Category</th>
                                    <th className="px-6 py-4 text-right">Amount</th>
                                    <th className="px-6 py-4 text-center">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {filteredTransactions.length > 0 ? filteredTransactions.map(tx => (
                                    <tr key={tx.id} className="hover:bg-slate-50 transition-colors">
                                        <td className="px-6 py-3 text-slate-500 text-xs text-nowrap">
                                            {new Date(tx.timestamp).toLocaleString(undefined, {
                                                year: 'numeric', month: 'short', day: 'numeric',
                                                hour: '2-digit', minute: '2-digit'
                                            })}
                                        </td>
                                        <td className="px-6 py-3">
                                            {tx.type === TransactionType.REVENUE ? (
                                                <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-green-50 text-green-700 border border-green-200">Income</span>
                                            ) : (
                                                <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-red-50 text-red-700 border border-red-200">Expense</span>
                                            )}
                                        </td>
                                        <td className="px-6 py-3">
                                            <div className="font-medium text-slate-900">{tx.description}</div>
                                            <div className="text-[10px] text-slate-500 mt-0.5">
                                                {tx.employerId && tx.employerId !== 'system' && <span>Partner: {employerNames[tx.employerId] || tx.employerId}</span>}
                                                {tx.candidateId && tx.candidateId !== 'system' && <span className="ml-2">Candidate: {candidateNames[tx.candidateId] || tx.candidateId}</span>}
                                            </div>
                                        </td>
                                        <td className="px-6 py-3 text-slate-600 text-xs font-medium">
                                            <span className="px-2 py-1 bg-slate-100 rounded text-slate-600 border border-slate-200">{formatCatName(tx.category)}</span>
                                        </td>
                                        <td className="px-6 py-3 text-right">
                                            <span className={`font-semibold ${tx.type === TransactionType.REVENUE ? 'text-green-600' : 'text-slate-900'}`}>
                                                {tx.type === TransactionType.EXPENSE ? '-' : '+'}${tx.amount.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                                            </span>
                                        </td>
                                        <td className="px-6 py-3 text-center">
                                            <div className="flex items-center justify-center gap-1">
                                                <button onClick={() => openEditTransaction(tx)} className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-white rounded transition-all">
                                                    <Edit2 size={14} />
                                                </button>
                                                <button onClick={() => handleDeleteTransaction(tx.id)} className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-white rounded transition-all">
                                                    <Trash2 size={14} />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                )) : (
                                    <tr>
                                        <td colSpan={6} className="px-6 py-12 text-center text-slate-500">
                                            No transactions found.
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                )}

                {!isLoading && activeTab === 'invoices' && (
                    <div className="overflow-x-auto bg-white min-h-[300px]">
                        <table className="w-full text-left text-sm whitespace-nowrap">
                            <thead className="bg-slate-50 text-slate-600 font-medium text-xs border-b border-slate-200">
                                <tr>
                                    <th className="px-6 py-4">Invoice ID</th>
                                    <th className="px-6 py-4">Details</th>
                                    <th className="px-6 py-4">Status</th>
                                    <th className="px-6 py-4 text-right">Amount</th>
                                    <th className="px-6 py-4 text-center">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {filteredInvoices.length > 0 ? filteredInvoices.map(inv => (
                                    <tr key={inv.id} className="hover:bg-slate-50 transition-colors">
                                        <td className="px-6 py-3">
                                            <span className="text-blue-600 font-medium text-xs">{inv.id}</span>
                                            <div className="text-[10px] text-slate-400 mt-0.5">Due: {new Date(inv.dueDate).toLocaleDateString()}</div>
                                        </td>
                                        <td className="px-6 py-3">
                                            <div className="font-medium text-slate-900">{employerNames[inv.employerId] || inv.employerId}</div>
                                            <div className="text-[10px] text-slate-500 mt-0.5">For: {candidateNames[inv.candidateId] || inv.candidateId}</div>
                                        </td>
                                        <td className="px-6 py-3">
                                            <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider border
                                            ${inv.status === InvoiceStatus.PAID ? 'bg-green-50 text-green-700 border-green-200' :
                                                    inv.status === InvoiceStatus.OVERDUE ? 'bg-red-50 text-red-700 border-red-200' :
                                                        'bg-blue-50 text-blue-700 border-blue-200'}`}>
                                                {inv.status}
                                            </span>
                                        </td>
                                        <td className="px-6 py-3 text-right">
                                            <span className="font-semibold text-slate-900">${(inv.amount || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                                        </td>
                                        <td className="px-6 py-3 text-center">
                                            <div className="flex items-center justify-center gap-1">
                                                <button onClick={() => openEditInvoice(inv)} className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-white rounded transition-all">
                                                    <Edit2 size={14} />
                                                </button>
                                                <button onClick={() => handleDeleteInvoice(inv.id)} className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-white rounded transition-all">
                                                    <Trash2 size={14} />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                )) : (
                                    <tr>
                                        <td colSpan={5} className="px-6 py-12 text-center text-slate-500">
                                            No invoices found.
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {/* Transaction Entry/Edit Modal */}
            {isTransactionModalOpen && (
                <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-xl shadow-lg w-full max-w-sm overflow-hidden border border-slate-200 flex flex-col">
                        <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
                            <h3 className="font-bold text-slate-800">{editingTransaction ? 'Edit Transaction' : 'Record Manual Entry'}</h3>
                            <button onClick={closeTransactionModal} className="text-slate-400 hover:text-slate-600">
                                <X size={18} />
                            </button>
                        </div>
                        <form onSubmit={handleSaveTransaction} className="p-5 space-y-4">
                            <div className="flex gap-2">
                                <button type="button" onClick={() => setNewTxType(TransactionType.REVENUE)} className={`flex-1 py-2 rounded border text-sm font-medium transition-colors ${newTxType === TransactionType.REVENUE ? 'bg-green-50 border-green-200 text-green-700' : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'}`}>Income</button>
                                <button type="button" onClick={() => setNewTxType(TransactionType.EXPENSE)} className={`flex-1 py-2 rounded border text-sm font-medium transition-colors ${newTxType === TransactionType.EXPENSE ? 'bg-red-50 border-red-200 text-red-700' : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'}`}>Expense</button>
                            </div>
                            <div>
                                <label className="text-xs font-medium text-slate-700 block mb-1">Amount ($)</label>
                                <input type="number" step="0.01" required value={newTxAmount} onChange={e => setNewTxAmount(e.target.value)} className="w-full px-3 py-2 border border-slate-200 rounded outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 text-sm" placeholder="e.g. 500.00" autoFocus />
                            </div>
                            <div>
                                <label className="text-xs font-medium text-slate-700 block mb-1">Description</label>
                                <input type="text" required value={newTxDescription} onChange={e => setNewTxDescription(e.target.value)} className="w-full px-3 py-2 border border-slate-200 rounded outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 text-sm" placeholder="Brief description..." />
                            </div>
                            <div>
                                <label className="text-xs font-medium text-slate-700 block mb-1">Category</label>
                                <select value={newTxCategory} onChange={e => setNewTxCategory(e.target.value as TransactionCategory)} className="w-full px-3 py-2 border border-slate-200 rounded outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 text-sm bg-white">
                                    {Object.values(TransactionCategory).map(cat => (
                                        <option key={cat} value={cat}>{formatCatName(cat)}</option>
                                    ))}
                                </select>
                            </div>
                            <div className="pt-2">
                                <button type="submit" className="w-full py-3 sm:py-2 bg-blue-600 text-white rounded-lg font-medium text-sm hover:bg-blue-700 transition-colors btn-touch">
                                    {editingTransaction ? 'Update Changes' : 'Save Record'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Invoice Edit Modal */}
            {isInvoiceModalOpen && editingInvoice && (
                <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-xl shadow-lg w-full max-w-sm overflow-hidden border border-slate-200 flex flex-col">
                        <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
                            <h3 className="font-bold text-slate-800">Edit Invoice {editingInvoice.id}</h3>
                            <button onClick={() => setIsInvoiceModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                                <X size={18} />
                            </button>
                        </div>
                        <form onSubmit={handleSaveInvoice} className="p-5 space-y-4">
                            <div>
                                <label className="text-xs font-medium text-slate-700 block mb-1">Partner</label>
                                <input type="text" disabled value={employerNames[editingInvoice.employerId] || editingInvoice.employerId} className="w-full px-3 py-2 border border-slate-100 bg-slate-50 text-slate-400 rounded text-sm" />
                            </div>
                            <div>
                                <label className="text-xs font-medium text-slate-700 block mb-1">Status</label>
                                <select value={newInvStatus} onChange={e => setNewInvStatus(e.target.value as InvoiceStatus)} className="w-full px-3 py-2 border border-slate-200 rounded outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 text-sm bg-white">
                                    {Object.values(InvoiceStatus).map(s => (
                                        <option key={s} value={s}>{s}</option>
                                    ))}
                                </select>
                            </div>
                            <div>
                                <label className="text-xs font-medium text-slate-700 block mb-1">Amount ($)</label>
                                <input type="number" step="0.01" required value={newInvAmount} onChange={e => setNewInvAmount(e.target.value)} className="w-full px-3 py-2 border border-slate-200 rounded outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 text-sm" />
                            </div>
                            <div>
                                <label className="text-xs font-medium text-slate-700 block mb-1">Due Date</label>
                                <input type="date" required value={newInvDueDate} onChange={e => setNewInvDueDate(e.target.value)} className="w-full px-3 py-2 border border-slate-200 rounded outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 text-sm" />
                            </div>
                            <div className="pt-2">
                                <button type="submit" className="w-full py-3 sm:py-2 bg-blue-600 text-white rounded-lg font-medium text-sm hover:bg-blue-700 transition-colors btn-touch">
                                    Update Invoice
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default FinanceLedger;
