import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { FinanceService } from '../services/financeService';
import { CandidateService } from '../services/candidateService';
import { PartnerService } from '../services/partnerService';
import {
    FinanceTransaction, TransactionType, TransactionCategory,
    Invoice, InvoiceStatus
} from '../types';
import {
    TrendingUp, TrendingDown, Receipt,
    ArrowUpRight, ArrowDownRight, Search, Filter,
    Download, Plus, CreditCard, PieChart,
    FileText, AlertCircle
} from 'lucide-react';

const FinanceLedger: React.FC = () => {
    // Transaction Modal State
    const [isTransactionModalOpen, setIsTransactionModalOpen] = useState(false);
    const [newTxType, setNewTxType] = useState<TransactionType>(TransactionType.EXPENSE);
    const [newTxAmount, setNewTxAmount] = useState('');
    const [newTxDescription, setNewTxDescription] = useState('');
    const [newTxCategory, setNewTxCategory] = useState<TransactionCategory>(TransactionCategory.OFFICE_RENT);

    const [transactions, setTransactions] = useState<FinanceTransaction[]>([]);
    const [invoices, setInvoices] = useState<Invoice[]>([]);
    const [candidateNames, setCandidateNames] = useState<Record<string, string>>({});
    const [employerNames, setEmployerNames] = useState<Record<string, string>>({});
    const [projection, setProjection] = useState(0);
    const [actualRevenue, setActualRevenue] = useState(0);
    const [expenses, setExpenses] = useState(0);
    const [activeTab, setActiveTab] = useState<'overview' | 'transactions' | 'invoices'>('overview');
    const [isLoading, setIsLoading] = useState(true);

    const refreshFinanceData = async () => {
        setIsLoading(true);
        try {
            const [rawTxData, rawInvData] = await Promise.all([
                Promise.resolve(FinanceService.getTransactions() || []),
                Promise.resolve(FinanceService.getInvoices() || [])
            ]);

            const txData = (rawTxData || []).filter(t => t && t.id);
            const invData = (rawInvData || []).filter(i => i && i.id);

            setTransactions(txData);
            setInvoices(invData);
            setActualRevenue(FinanceService.calculateTotalActualRevenue(txData) || 0);
            setExpenses(FinanceService.calculateTotalExpenses(txData) || 0);

            // Fetch candidate names for the ledger
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

            // Fetch projection (Needs candidates and employers)
            const allCandidates = await CandidateService.getCandidates();
            const allEmployers = await PartnerService.getEmployers();

            // Map employers
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
        }
    };

    React.useEffect(() => {
        refreshFinanceData();
    }, []);

    const handleAddTransaction = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newTxAmount || !newTxDescription) return;

        await FinanceService.addTransaction({
            type: newTxType,
            amount: parseFloat(newTxAmount),
            description: newTxDescription,
            category: newTxCategory,
            candidateId: 'system', // Use system for generic transactions
            employerId: 'system',  // Use system for generic transactions
        });

        refreshFinanceData();
        setIsTransactionModalOpen(false);
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
            link.setAttribute('download', `finance_report_${new Date().toISOString().split('T')[0]}.csv`);
            link.style.visibility = 'hidden';
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
        }
    };

    if (isLoading) return <div className="p-8 text-center text-slate-500 flex flex-col items-center justify-center h-96 gap-4">
        <TrendingUp size={48} className="text-blue-600 animate-pulse" />
        <p className="font-bold">Loading Financial Ledger...</p>
    </div>;

    const netProfit = actualRevenue - expenses;

    const getCategoryColor = (category: TransactionCategory) => {
        switch (category) {
            case TransactionCategory.COMMISSION: return 'bg-green-100 text-green-700';
            case TransactionCategory.FLIGHT_TICKET: return 'bg-blue-100 text-blue-700';
            case TransactionCategory.VISA_FEE: return 'bg-purple-100 text-purple-700';
            case TransactionCategory.AGENT_COMMISSION: return 'bg-red-100 text-red-700';
            default: return 'bg-slate-100 text-slate-700';
        }
    };

    const getInvoiceStatusColor = (status: InvoiceStatus) => {
        switch (status) {
            case InvoiceStatus.PAID: return 'bg-green-100 text-green-700';
            case InvoiceStatus.SENT: return 'bg-blue-100 text-blue-700';
            case InvoiceStatus.OVERDUE: return 'bg-red-100 text-red-700';
            default: return 'bg-slate-100 text-slate-700';
        }
    };

    const formatCategory = (category: string) => {
        if (!category) return 'OTHER';
        return category.toString().replace(/_/g, ' ');
    };

    return (
        <div className="p-8 max-w-7xl mx-auto space-y-8 animate-in fade-in duration-500">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-3xl font-bold text-slate-900">Agency Finance Ledger</h2>
                    <p className="text-slate-500 mt-1">Track recruitment revenue, operational expenses, and profit projections.</p>
                </div>
                <div className="flex gap-3">
                    <button
                        onClick={handleExportReport}
                        className="px-5 py-2.5 bg-white border border-slate-200 text-slate-600 rounded-xl text-sm font-bold flex items-center gap-2 hover:bg-slate-50 transition-all"
                    >
                        <Download size={18} /> Export Report
                    </button>
                    <button
                        onClick={() => setIsTransactionModalOpen(true)}
                        className="px-5 py-2.5 bg-blue-600 text-white rounded-xl text-sm font-bold flex items-center gap-2 hover:bg-blue-700 shadow-lg shadow-blue-100 transition-all"
                    >
                        <Plus size={18} /> Record Transaction
                    </button>
                </div>
            </div>

            {/* KPI DASHBOARD */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm relative overflow-hidden group">
                    <div className="absolute right-[-10px] top-[-10px] opacity-5 text-blue-600 rotate-12 group-hover:rotate-0 transition-transform duration-500">
                        <TrendingUp size={100} />
                    </div>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Projected Revenue</p>
                    <h4 className="text-3xl font-black text-slate-800">${projection.toLocaleString()}</h4>
                    <div className="mt-4 flex items-center gap-1.5 text-xs font-bold text-blue-600 bg-blue-50 w-fit px-2 py-1 rounded-lg">
                        <ArrowUpRight size={14} /> Based on Pipeline
                    </div>
                </div>

                <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm relative overflow-hidden group">
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Actual Revenue</p>
                    <h4 className="text-3xl font-black text-green-600">${actualRevenue.toLocaleString()}</h4>
                    <div className="mt-4 flex items-center gap-1.5 text-xs font-bold text-green-600 bg-green-50 w-fit px-2 py-1 rounded-lg">
                        <CreditCard size={14} /> Collected Funds
                    </div>
                </div>

                <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm relative overflow-hidden group">
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Total Expenses</p>
                    <h4 className="text-3xl font-black text-slate-800">${expenses.toLocaleString()}</h4>
                    <div className="mt-4 flex items-center gap-1.5 text-xs font-bold text-red-500 bg-red-50 w-fit px-2 py-1 rounded-lg">
                        <TrendingDown size={14} /> Operations Cost
                    </div>
                </div>

                <div className="bg-white p-6 rounded-2xl border border-slate-900 shadow-sm relative overflow-hidden group text-white bg-slate-900">
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Net Profit</p>
                    <h4 className={`text-3xl font-black ${netProfit >= 0 ? 'text-white' : 'text-red-400'}`}>${netProfit.toLocaleString()}</h4>
                    <div className="mt-4 flex items-center gap-1.5 text-xs font-bold text-emerald-400 bg-emerald-400/10 w-fit px-2 py-1 rounded-lg">
                        <PieChart size={14} /> Actual Earnings
                    </div>
                </div>
            </div>

            {/* MAIN CONTENT TABS */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden min-h-[500px]">
                <div className="flex border-b border-slate-100 overflow-x-auto no-scrollbar">
                    <div className="flex min-w-max">
                        {[
                            { id: 'overview', label: 'Financial Overview', icon: PieChart },
                            { id: 'transactions', label: 'Recent Transactions', icon: Receipt },
                            { id: 'invoices', label: 'Partner Invoices', icon: FileText },
                        ].map((tab) => (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id as 'overview' | 'transactions' | 'invoices')}
                                className={`flex items-center gap-2 px-6 sm:px-8 py-5 text-sm font-bold transition-all relative ${activeTab === tab.id ? 'text-blue-600' : 'text-slate-400 hover:text-slate-600'
                                    }`}
                            >
                                <tab.icon size={18} />
                                {tab.label}
                                {activeTab === tab.id && <div className="absolute bottom-0 left-0 right-0 h-1 bg-blue-600"></div>}
                            </button>
                        ))}
                    </div>
                </div>

                <div className="p-4 md:p-6">
                    {activeTab === 'transactions' && (
                        <div className="space-y-4">
                            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4">
                                <div className="relative w-full md:w-96">
                                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                                    <input type="text" placeholder="Search transactions..." className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 outline-none" />
                                </div>
                                <button className="flex items-center gap-2 text-slate-400 hover:text-slate-600 font-bold text-xs uppercase tracking-widest">
                                    <Filter size={14} /> Filter
                                </button>
                            </div>
                            <div className="overflow-x-auto -mx-4 md:mx-0">
                                <div className="min-w-[700px] md:min-w-0 px-4 md:px-0">
                                    <table className="w-full text-left border-collapse">
                                        <thead>
                                            <tr className="text-[10px] font-bold text-slate-400 uppercase tracking-widest border-b border-slate-50">
                                                <th className="px-4 py-3">Date</th>
                                                <th className="px-4 py-3">Description</th>
                                                <th className="px-4 py-3 hidden sm:table-cell">Category</th>
                                                <th className="px-4 py-3 hidden md:table-cell">Type</th>
                                                <th className="px-4 py-3 text-right">Amount</th>
                                            </tr>
                                        </thead>
                                        <tbody className="text-sm font-medium text-slate-700 divide-y divide-slate-50">
                                            {transactions.map(tx => (
                                                <tr key={tx.id} className="hover:bg-slate-50/50 transition-colors group">
                                                    <td className="px-4 py-3 text-[11px] text-slate-400">{new Date(tx.timestamp).toLocaleDateString()}</td>
                                                    <td className="px-4 py-3">
                                                        <p className="font-bold text-slate-800 line-clamp-1">{tx.description}</p>
                                                        <div className="flex flex-wrap gap-x-2 text-[10px] text-slate-400 mt-1">
                                                            <Link to={`/candidates/${tx.candidateId}`} className="text-blue-600 hover:underline">Cnv: {candidateNames[tx.candidateId] || tx.candidateId}</Link>
                                                            <span>•</span>
                                                            <Link to={`/partners/${tx.employerId}`} className="text-blue-600 hover:underline">
                                                                Emp: {employerNames[tx.employerId]?.split(' ')[0] || 'System'}
                                                            </Link>
                                                        </div>
                                                    </td>
                                                    <td className="px-4 py-3 hidden sm:table-cell">
                                                        <span className={`px-2 py-0.5 rounded-[4px] text-[9px] font-black uppercase ${getCategoryColor(tx.category)}`}>
                                                            {formatCategory(tx.category)}
                                                        </span>
                                                    </td>
                                                    <td className="px-4 py-3 hidden md:table-cell">
                                                        <span className={`flex items-center gap-1 ${tx.type === TransactionType.REVENUE ? 'text-green-600' : 'text-red-500'}`}>
                                                            {tx.type === TransactionType.REVENUE ? <ArrowUpRight size={14} /> : <ArrowDownRight size={14} />}
                                                            {tx.type}
                                                        </span>
                                                    </td>
                                                    <td className={`px-4 py-3 text-right font-black ${tx.type === TransactionType.REVENUE ? 'text-green-600' : 'text-slate-800'}`}>
                                                        {tx.type === TransactionType.EXPENSE ? '-' : '+'}${tx.amount.toLocaleString()}
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        </div>
                    )}

                    {activeTab === 'invoices' && (
                        <div className="space-y-4">
                            <div className="overflow-x-auto -mx-4 md:mx-0">
                                <div className="min-w-[700px] md:min-w-0 px-4 md:px-0">
                                    <table className="w-full text-left border-collapse">
                                        <thead>
                                            <tr className="text-[10px] font-bold text-slate-400 uppercase tracking-widest border-b border-slate-50">
                                                <th className="px-4 py-3">Invoice #</th>
                                                <th className="px-4 py-3">Employer</th>
                                                <th className="px-4 py-3 hidden sm:table-cell">Due Date</th>
                                                <th className="px-4 py-3">Status</th>
                                                <th className="px-4 py-3 text-right">Amount</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-slate-50 text-sm">
                                            {invoices.map(inv => (
                                                <tr key={inv.id} className="hover:bg-slate-50 transition-colors cursor-pointer">
                                                    <td className="px-4 py-4 font-bold text-blue-600">{inv.id}</td>
                                                    <td className="px-4 py-4">
                                                        <Link to={`/partners/${inv.employerId}`} className="font-bold text-blue-800 hover:underline">
                                                            {employerNames[inv.employerId] || `Employer: ${inv.employerId}`}
                                                        </Link>
                                                        <Link to={`/candidates/${inv.candidateId}`} className="block text-[10px] text-slate-400 hover:text-blue-600 hover:underline mt-1">
                                                            Candidate: {candidateNames[inv.candidateId] || inv.candidateId}
                                                        </Link>
                                                    </td>
                                                    <td className="px-4 py-4 text-slate-500 font-medium hidden sm:table-cell">
                                                        {new Date(inv.dueDate).toLocaleDateString()}
                                                    </td>
                                                    <td className="px-4 py-4">
                                                        <span className={`px-2 py-1 rounded-[4px] text-[9px] font-black uppercase ${getInvoiceStatusColor(inv.status)}`}>
                                                            {inv.status}
                                                        </span>
                                                    </td>
                                                    <td className="px-4 py-4 text-right font-black text-slate-900">
                                                        ${inv.amount.toLocaleString()}
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                            {invoices.length === 0 && (
                                <div className="p-8 text-center border-2 border-dashed border-slate-200 rounded-2xl">
                                    <div className="w-16 h-16 bg-slate-50 text-slate-300 rounded-full flex items-center justify-center mx-auto mb-4">
                                        <FileText size={32} />
                                    </div>
                                    <h3 className="text-lg font-bold text-slate-800">No Invoices</h3>
                                    <p className="text-slate-400 text-sm max-w-md mx-auto mt-2">Create invoices automatically when candidates are placed.</p>
                                </div>
                            )}
                        </div>
                    )}

                    {
                        activeTab === 'overview' && (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                <div className="space-y-6">
                                    <h4 className="text-lg font-bold text-slate-800">Revenue Breakdown</h4>
                                    <div className="bg-slate-50 rounded-2xl p-6 space-y-4">
                                        {[
                                            { label: 'Placement Commissions', value: 85, color: 'bg-green-500' },
                                            { label: 'Admin Fees', value: 10, color: 'bg-blue-500' },
                                            { label: 'Other Revenue', value: 5, color: 'bg-slate-400' },
                                        ].map((item, i) => (
                                            <div key={i} className="space-y-2">
                                                <div className="flex justify-between text-xs font-bold uppercase tracking-widest text-slate-400">
                                                    <span>{item.label}</span>
                                                    <span className="text-slate-800">{item.value}%</span>
                                                </div>
                                                <div className="h-2 w-full bg-slate-200 rounded-full overflow-hidden">
                                                    <div className={`h-full ${item.color}`} style={{ width: `${item.value}%` }}></div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                <div className="space-y-6">
                                    <h4 className="text-lg font-bold text-slate-800">Operational Risk</h4>
                                    <div className="p-6 border border-amber-100 bg-amber-50 rounded-2xl flex gap-4">
                                        <div className="p-3 bg-white text-amber-600 rounded-xl shadow-sm h-fit">
                                            <AlertCircle size={24} />
                                        </div>
                                        <div>
                                            <h5 className="font-bold text-amber-800">Pending Expenses Alert</h5>
                                            <p className="text-sm text-amber-700 mt-1">There are 12 candidates in Visa processing without recorded expense entries. Total estimated pending cost: **$1,800**.</p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )
                    }
                </div >
            </div >

            {/* ADD TRANSACTION MODAL */}
            {
                isTransactionModalOpen && (
                    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={() => setIsTransactionModalOpen(false)}>
                        <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200" onClick={e => e.stopPropagation()}>
                            <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50">
                                <h3 className="text-lg font-black text-slate-800 flex items-center gap-2">
                                    <Plus size={20} className="text-blue-600" /> Record Transaction
                                </h3>
                                <button onClick={() => setIsTransactionModalOpen(false)} className="text-slate-400 hover:text-slate-600 transition-colors">
                                    <AlertCircle size={20} className="rotate-45" />
                                </button>
                            </div>
                            <form onSubmit={handleAddTransaction} className="p-6 space-y-4">
                                <div className="grid grid-cols-2 gap-4">
                                    <button
                                        type="button"
                                        onClick={() => setNewTxType(TransactionType.REVENUE)}
                                        className={`p-3 rounded-xl border-2 font-bold text-sm transition-all flex items-center justify-center gap-2 ${newTxType === TransactionType.REVENUE ? 'border-green-500 bg-green-50 text-green-700' : 'border-slate-100 text-slate-400 hover:border-slate-200'}`}
                                    >
                                        <ArrowUpRight size={16} /> Income
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setNewTxType(TransactionType.EXPENSE)}
                                        className={`p-3 rounded-xl border-2 font-bold text-sm transition-all flex items-center justify-center gap-2 ${newTxType === TransactionType.EXPENSE ? 'border-red-500 bg-red-50 text-red-700' : 'border-slate-100 text-slate-400 hover:border-slate-200'}`}
                                    >
                                        <ArrowDownRight size={16} /> Expense
                                    </button>
                                </div>

                                <div>
                                    <label className="text-xs font-black text-slate-500 uppercase tracking-widest block mb-2">Amount ($)</label>
                                    <input
                                        type="number"
                                        required
                                        placeholder="0.00"
                                        value={newTxAmount}
                                        onChange={(e) => setNewTxAmount(e.target.value)}
                                        className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl font-bold text-lg text-slate-800 focus:ring-2 focus:ring-blue-500 outline-none"
                                    />
                                </div>

                                <div>
                                    <label className="text-xs font-black text-slate-500 uppercase tracking-widest block mb-2">Description</label>
                                    <input
                                        type="text"
                                        required
                                        placeholder="What is this for?"
                                        value={newTxDescription}
                                        onChange={(e) => setNewTxDescription(e.target.value)}
                                        className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl font-medium text-slate-800 focus:ring-2 focus:ring-blue-500 outline-none"
                                    />
                                </div>

                                <div>
                                    <label className="text-xs font-black text-slate-500 uppercase tracking-widest block mb-2">Category</label>
                                    <select
                                        className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl font-medium text-slate-800 focus:ring-2 focus:ring-blue-500 outline-none"
                                        value={newTxCategory}
                                        onChange={(e) => setNewTxCategory(e.target.value as TransactionCategory)}
                                    >
                                        {Object.values(TransactionCategory).map(cat => (
                                            <option key={cat} value={cat}>{cat.replace('_', ' ')}</option>
                                        ))}
                                    </select>
                                </div>

                                <button
                                    type="submit"
                                    className="w-full py-4 bg-blue-600 text-white rounded-xl font-black shadow-lg shadow-blue-200 hover:bg-blue-700 hover:scale-[1.02] transition-all mt-4"
                                >
                                    Save Transaction
                                </button>
                            </form>
                        </div>
                    </div>
                )
            }
        </div>
    );
};

export default FinanceLedger;
