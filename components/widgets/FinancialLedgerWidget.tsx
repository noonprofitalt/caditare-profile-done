import React from 'react';
import { Candidate, AdvancePayment, AdvancePaymentType } from '../../types';
import { DollarSign, FileText, Calendar, CheckSquare, Square, Save, Info, Plus } from 'lucide-react';

interface FinancialLedgerWidgetProps {
    candidate: Candidate;
    isEditing?: boolean;
    onUpdate?: (payments: AdvancePayment[]) => void;
}

const DEFAULT_ROWS: AdvancePaymentType[] = [
    AdvancePaymentType.REGISTER_FEE,
    AdvancePaymentType.OFFER,
    AdvancePaymentType.WORK_PERMIT,
    AdvancePaymentType.EMB_USD,
    AdvancePaymentType.BALANCE_PAY,
    AdvancePaymentType.TICKET,
    AdvancePaymentType.DEPOSIT,
    AdvancePaymentType.OTHER,
];

// Helper to get consistent row label
const getRowLabel = (type: AdvancePaymentType): string => {
    switch (type) {
        case AdvancePaymentType.REGISTER_FEE: return 'REGISTER FEE';
        case AdvancePaymentType.OFFER: return 'OFFER';
        case AdvancePaymentType.WORK_PERMIT: return 'WORKPERMIT';
        case AdvancePaymentType.EMB_USD: return 'EMB USD';
        case AdvancePaymentType.BALANCE_PAY: return 'BALANCE PAY.';
        case AdvancePaymentType.TICKET: return 'TICKET';
        case AdvancePaymentType.DEPOSIT: return 'DEPOSIT';
        case AdvancePaymentType.OTHER: return 'OTHER';
        default: return String(type).toUpperCase();
    }
};

const FinancialLedgerWidget: React.FC<FinancialLedgerWidgetProps> = ({
    candidate,
    isEditing = false,
    onUpdate
}) => {
    // Merge existing payments with default empty rows to guarantee the 8-row table
    const currentPayments = candidate.advancePayments || [];

    const formattedRows = DEFAULT_ROWS.map(rowType => {
        return currentPayments.find(p => p.type === rowType) || {
            id: crypto.randomUUID(), // Temp ID for UI purposes
            type: rowType,
            informed: false,
            informedDate: '',
            signDate: '',
            invoiceNo: '',
            amount: undefined,
            remarks: '',
        };
    });

    const handleFieldChange = (idx: number, field: keyof AdvancePayment, value: any) => {
        if (!onUpdate) return;

        // Create a new array with updated reference
        const updatedRows = [...formattedRows];
        updatedRows[idx] = { ...updatedRows[idx], [field]: value };

        // Only pass back the rows that have actual data (filtering empty defaults from payload)
        const validPayments = updatedRows.filter(r =>
            r.informed || !!r.signDate || !!r.invoiceNo || r.amount !== undefined || !!r.remarks
        );

        onUpdate(validPayments);
    };

    const totalAmount = formattedRows.reduce((sum, row) => sum + (Number(row.amount) || 0), 0);

    return (
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm">
            <div className="bg-slate-50 border-b border-slate-200 px-5 py-4 flex items-center justify-between">
                <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider flex items-center gap-2">
                    <div className="w-6 h-6 rounded-md bg-emerald-100 text-emerald-600 flex items-center justify-center">
                        <DollarSign size={14} strokeWidth={3} />
                    </div>
                    Financial Ledger & Payments
                </h3>

                <div className="text-xs font-bold text-slate-500 bg-white px-3 py-1.5 rounded-lg border border-slate-200 shadow-sm flex items-center gap-2">
                    Total Paid:
                    <span className="text-emerald-600 text-sm">
                        Rs. {totalAmount.toLocaleString()}
                    </span>
                </div>
            </div>

            <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                    <thead>
                        <tr className="bg-slate-50 border-b border-slate-200">
                            <th className="py-3 px-4 text-[10px] font-black tracking-widest text-slate-400 uppercase w-40">Advance</th>
                            <th className="py-3 px-4 text-[10px] font-black tracking-widest text-slate-400 uppercase w-24 text-center">Informed</th>
                            <th className="py-3 px-4 text-[10px] font-black tracking-widest text-slate-400 uppercase w-32">Sign Date</th>
                            <th className="py-3 px-4 text-[10px] font-black tracking-widest text-slate-400 uppercase w-32">Invoice No</th>
                            <th className="py-3 px-4 text-[10px] font-black tracking-widest text-slate-400 uppercase w-40">Amount (RS)</th>
                            <th className="py-3 px-4 text-[10px] font-black tracking-widest text-slate-400 uppercase">Remarks</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                        {formattedRows.map((row, idx) => {
                            const hasData = row.informed || !!row.signDate || !!row.invoiceNo || row.amount !== undefined || !!row.remarks;
                            const isHighlight = hasData && !isEditing;

                            return (
                                <tr key={row.type} className={`hover:bg-slate-50/50 transition-colors ${isHighlight ? 'bg-emerald-50/20' : ''}`}>
                                    {/* Advance Column */}
                                    <td className="py-2.5 px-4">
                                        <span className={`text-[11px] font-bold uppercase ${isHighlight ? 'text-slate-800' : 'text-slate-500'}`}>
                                            {getRowLabel(row.type)}
                                        </span>
                                    </td>

                                    {/* Informed Column */}
                                    <td className="py-2.5 px-4 text-center">
                                        {isEditing ? (
                                            <button
                                                onClick={() => handleFieldChange(idx, 'informed', !row.informed)}
                                                className={`w-5 h-5 rounded mx-auto flex items-center justify-center transition-colors ${row.informed ? 'bg-blue-500 text-white border-blue-600' : 'bg-white border-2 border-slate-300 text-transparent hover:border-blue-400'}`}
                                            >
                                                {row.informed && <CheckSquare size={12} strokeWidth={3} />}
                                            </button>
                                        ) : (
                                            <div className={`w-5 h-5 rounded mx-auto flex items-center justify-center ${row.informed ? 'bg-blue-100 text-blue-600' : 'bg-slate-100 text-slate-300'}`}>
                                                {row.informed ? <CheckSquare size={12} /> : <Square size={12} />}
                                            </div>
                                        )}
                                    </td>

                                    {/* Sign Date Column */}
                                    <td className="py-2.5 px-4">
                                        {isEditing ? (
                                            <input
                                                type="date"
                                                value={row.signDate || ''}
                                                onChange={(e) => handleFieldChange(idx, 'signDate', e.target.value)}
                                                className="w-full text-xs px-2 py-1.5 border border-slate-200 rounded-md focus:ring-1 focus:ring-emerald-500 outline-none"
                                            />
                                        ) : (
                                            <span className="text-xs font-semibold text-slate-700">
                                                {row.signDate ? new Date(row.signDate).toLocaleDateString('en-GB') : '-'}
                                            </span>
                                        )}
                                    </td>

                                    {/* Invoice No Column */}
                                    <td className="py-2.5 px-4">
                                        {isEditing ? (
                                            <input
                                                type="text"
                                                value={row.invoiceNo || ''}
                                                onChange={(e) => handleFieldChange(idx, 'invoiceNo', e.target.value)}
                                                placeholder="e.g. 3416"
                                                className="w-full text-xs px-2 py-1.5 border border-slate-200 rounded-md focus:ring-1 focus:ring-emerald-500 outline-none"
                                            />
                                        ) : (
                                            <div className="flex items-center gap-1.5">
                                                {row.invoiceNo && <FileText size={10} className="text-slate-400" />}
                                                <span className="text-xs font-bold text-slate-700">
                                                    {row.invoiceNo || '-'}
                                                </span>
                                            </div>
                                        )}
                                    </td>

                                    {/* Amount Column */}
                                    <td className="py-2.5 px-4">
                                        {isEditing ? (
                                            <div className="relative">
                                                <span className="absolute left-2.5 top-1.5 text-xs text-slate-400 font-bold">Rs.</span>
                                                <input
                                                    type="number"
                                                    value={row.amount || ''}
                                                    onChange={(e) => handleFieldChange(idx, 'amount', e.target.value ? Number(e.target.value) : undefined)}
                                                    placeholder="0.00"
                                                    className="w-full text-xs pl-8 pr-2 py-1.5 border border-slate-200 rounded-md focus:ring-1 focus:ring-emerald-500 outline-none"
                                                />
                                            </div>
                                        ) : (
                                            <span className={`text-xs font-bold ${row.amount ? 'text-emerald-700' : 'text-slate-400'}`}>
                                                {row.amount ? `Rs. ${row.amount.toLocaleString()}` : '-'}
                                            </span>
                                        )}
                                    </td>

                                    {/* Remarks Column */}
                                    <td className="py-2.5 px-4">
                                        {isEditing ? (
                                            <input
                                                type="text"
                                                value={row.remarks || ''}
                                                onChange={(e) => handleFieldChange(idx, 'remarks', e.target.value)}
                                                placeholder="e.g. Euro 500 Paid"
                                                className="w-full text-xs px-2 py-1.5 border border-slate-200 rounded-md focus:ring-1 focus:ring-emerald-500 outline-none text-red-600"
                                            />
                                        ) : (
                                            <span className={`text-[11px] font-semibold ${row.remarks?.toLowerCase().includes('euro') || row.remarks?.toLowerCase().includes('usd') ? 'text-red-600' : 'text-slate-600'}`}>
                                                {row.remarks || '-'}
                                            </span>
                                        )}
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>

            {candidate.workflowMilestones?.stampResult && !isEditing && (
                <div className="bg-red-50 border-t border-red-100 p-3 px-5 flex items-start gap-3">
                    <Info size={14} className="text-red-500 mt-0.5" />
                    <div>
                        <p className="text-[10px] font-bold text-red-600 uppercase tracking-wider mb-0.5">Payment Remark (from bottom of form)</p>
                        <p className="text-xs font-medium text-red-800">{candidate.workflowMilestones.stampResult}</p>
                    </div>
                </div>
            )}

            {isEditing && (
                <div className="bg-slate-50 border-t border-slate-200 p-3 px-5 flex justify-between items-center text-xs text-slate-500">
                    <span>Editing ledger. All changes save with the main profile save button.</span>
                </div>
            )}
        </div>
    );
};

export default FinancialLedgerWidget;
