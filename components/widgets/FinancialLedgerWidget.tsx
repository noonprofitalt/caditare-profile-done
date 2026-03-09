import React from 'react';
import { Candidate, AdvancePayment, AdvancePaymentType } from '../../types';
import { Trash2, Plus } from 'lucide-react';

interface FinancialLedgerWidgetProps {
    candidate: Candidate;
    isEditing?: boolean;
    onUpdate?: (payments: AdvancePayment[], usdRateEmb?: number, usdRateFA?: number) => void;
}

const DEFAULT_ROWS: string[] = [
    'Register Fee',
    'Offer',
    'Work Permit',
    'Embassy USD',
    'Balance Pay',
    'Ticket',
    'Deposit',
    'Other'
];

const FinancialLedgerWidget: React.FC<FinancialLedgerWidgetProps> = ({
    candidate,
    isEditing = false,
    onUpdate
}) => {
    const payments = candidate.advancePayments || [];
    const customTypes = payments
        .filter(p => !DEFAULT_ROWS.includes(p.type))
        .map(p => p.type);

    const allTypes = Array.from(new Set([...DEFAULT_ROWS, ...customTypes]));

    const totalAmount = payments.reduce((sum, p) => sum + (Number(p.amount) || 0), 0);

    const handleUpdatePayment = (type: string, field: keyof AdvancePayment, value: any) => {
        if (!onUpdate) return;
        const all = [...payments];
        const existIdx = all.findIndex(p => p.type === type);

        const paymentToUpdate = existIdx >= 0 ? { ...all[existIdx] } : { id: `adv-${Date.now()}-${type}`, type: type as AdvancePaymentType };

        // Special mapping for dates vs booleans if needed, but keeping the original string structure
        (paymentToUpdate as any)[field] = value;

        if (field === 'informedDate' && value) {
            paymentToUpdate.informed = true;
        }

        if (existIdx >= 0) {
            all[existIdx] = paymentToUpdate;
        } else {
            all.push(paymentToUpdate);
        }

        onUpdate(all, candidate.usdRateEmb, candidate.usdRateFA);
    };

    const handleDeleteCustom = (type: string) => {
        if (!onUpdate) return;
        const all = payments.filter(p => p.type !== type);
        onUpdate(all, candidate.usdRateEmb, candidate.usdRateFA);
    };

    const handleAddCustom = () => {
        const newType = window.prompt("Enter new custom payment type:");
        if (newType && newType.trim()) {
            const trimmed = newType.trim();
            if (!allTypes.find(t => t.toLowerCase() === trimmed.toLowerCase())) {
                const all = [...payments, { type: trimmed as AdvancePaymentType, id: `adv-${Date.now()}` }];
                if (onUpdate) onUpdate(all, candidate.usdRateEmb, candidate.usdRateFA);
            } else {
                alert('This payment type already exists.');
            }
        }
    };

    const handleUsdRateEmbChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (!onUpdate) return;
        onUpdate(payments, e.target.value ? parseFloat(e.target.value) : undefined, candidate.usdRateFA);
    };

    const handleUsdRateFAChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (!onUpdate) return;
        onUpdate(payments, candidate.usdRateEmb, e.target.value ? parseFloat(e.target.value) : undefined);
    };

    return (
        <div className="w-full">
            <div className="flex justify-between items-center mb-4">
                <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider flex items-center gap-2">
                    <span className="w-6 h-1 bg-green-500 rounded-full"></span>
                    Advance Payment Tracking
                </h3>
                <div className="text-xs font-bold text-slate-500 bg-white px-3 py-1.5 rounded-lg border border-slate-200 shadow-sm flex items-center gap-2">
                    Total Paid:
                    <span className="text-green-600 text-sm">
                        Rs. {totalAmount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </span>
                </div>
            </div>

            {isEditing ? (
                <div className="bg-green-50/50 p-6 rounded-xl border border-green-200 border-dashed">
                    <div className="overflow-x-auto">
                        <table className="w-full text-xs">
                            <thead>
                                <tr className="border-b-2 border-green-200">
                                    <th className="text-left py-2 px-2 font-bold text-slate-600 uppercase">#</th>
                                    <th className="text-left py-2 px-2 font-bold text-slate-600 uppercase">Payment Type</th>
                                    <th className="text-left py-2 px-2 font-bold text-slate-600 uppercase">Informed</th>
                                    <th className="text-left py-2 px-2 font-bold text-slate-600 uppercase">Sign Date</th>
                                    <th className="text-left py-2 px-2 font-bold text-slate-600 uppercase">Invoice No</th>
                                    <th className="text-left py-2 px-2 font-bold text-slate-600 uppercase">Amount (Rs)</th>
                                    <th className="text-left py-2 px-2 font-bold text-slate-600 uppercase">Remarks</th>
                                </tr>
                            </thead>
                            <tbody>
                                {allTypes.map((type, idx) => {
                                    const payment = payments.find(p => p.type === type) || {} as Partial<AdvancePayment>;
                                    const isDefault = DEFAULT_ROWS.includes(type);

                                    return (
                                        <tr key={type} className="border-b border-green-100 hover:bg-green-50/50">
                                            <td className="py-2 px-2 font-bold text-slate-500">{idx + 1}</td>
                                            <td className="py-2 px-2 font-bold text-slate-700">{type}</td>
                                            <td className="py-2 px-2">
                                                <input
                                                    type="date"
                                                    value={payment.informedDate || ''}
                                                    onChange={(e) => handleUpdatePayment(type, 'informedDate', e.target.value)}
                                                    className="w-full px-1.5 py-1 border border-slate-300 rounded text-xs focus:outline-none focus:ring-1 focus:ring-green-500"
                                                />
                                            </td>
                                            <td className="py-2 px-2">
                                                <input
                                                    type="date"
                                                    value={payment.signDate || ''}
                                                    onChange={(e) => handleUpdatePayment(type, 'signDate', e.target.value)}
                                                    className="w-full px-1.5 py-1 border border-slate-300 rounded text-xs focus:outline-none focus:ring-1 focus:ring-green-500"
                                                />
                                            </td>
                                            <td className="py-2 px-2">
                                                <input
                                                    type="text"
                                                    value={payment.invoiceNo || ''}
                                                    onChange={(e) => handleUpdatePayment(type, 'invoiceNo', e.target.value)}
                                                    placeholder="Inv#"
                                                    className="w-full px-1.5 py-1 border border-slate-300 rounded text-xs focus:outline-none focus:ring-1 focus:ring-green-500"
                                                />
                                            </td>
                                            <td className="py-2 px-2">
                                                <input
                                                    type="number"
                                                    value={payment.amount || ''}
                                                    onChange={(e) => handleUpdatePayment(type, 'amount', e.target.value ? parseFloat(e.target.value) : undefined)}
                                                    placeholder="0"
                                                    className="w-full px-1.5 py-1 border border-slate-300 rounded text-xs focus:outline-none focus:ring-1 focus:ring-green-500"
                                                />
                                            </td>
                                            <td className="py-2 px-2 flex gap-1 items-center">
                                                <input
                                                    type="text"
                                                    value={payment.remarks || ''}
                                                    onChange={(e) => handleUpdatePayment(type, 'remarks', e.target.value)}
                                                    placeholder="Notes..."
                                                    className="w-full px-1.5 py-1 border border-slate-300 rounded text-xs focus:outline-none focus:ring-1 focus:ring-green-500"
                                                />
                                                {!isDefault && (
                                                    <button
                                                        type="button"
                                                        className="text-red-400 hover:text-red-600 p-1 flex-shrink-0"
                                                        onClick={() => handleDeleteCustom(type)}
                                                        title="Delete custom payment type"
                                                    >
                                                        <Trash2 size={12} />
                                                    </button>
                                                )}
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>

                    <div className="mt-3 flex justify-end">
                        <button
                            type="button"
                            className="flex items-center gap-1.5 text-xs font-bold text-green-700 hover:text-green-800 bg-green-100 hover:bg-green-200 px-3 py-1.5 rounded-lg transition-colors"
                            onClick={handleAddCustom}
                        >
                            <Plus size={14} /> Add Custom Payment
                        </button>
                    </div>

                    <div className="mt-4 grid grid-cols-2 gap-4 pt-3 border-t border-green-200">
                        <div>
                            <label className="block text-xs font-bold text-slate-500 uppercase mb-1">USD Rate EMB</label>
                            <input
                                type="number"
                                step="0.01"
                                value={candidate.usdRateEmb ?? ''}
                                onChange={handleUsdRateEmbChange}
                                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-green-500"
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-slate-500 uppercase mb-1">USD Rate F/A</label>
                            <input
                                type="number"
                                step="0.01"
                                value={candidate.usdRateFA ?? ''}
                                onChange={handleUsdRateFAChange}
                                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-green-500"
                            />
                        </div>
                    </div>
                </div>
            ) : (
                <div className="bg-green-50/30 p-5 rounded-xl border border-green-100">
                    <div className="overflow-x-auto">
                        <table className="w-full text-xs">
                            <thead>
                                <tr className="border-b-2 border-green-200">
                                    <th className="text-left py-2 px-2 font-bold text-slate-600 uppercase">#</th>
                                    <th className="text-left py-2 px-2 font-bold text-slate-600 uppercase">Type</th>
                                    <th className="text-left py-2 px-2 font-bold text-slate-600 uppercase">Informed</th>
                                    <th className="text-left py-2 px-2 font-bold text-slate-600 uppercase">Sign Date</th>
                                    <th className="text-left py-2 px-2 font-bold text-slate-600 uppercase">Invoice</th>
                                    <th className="text-right py-2 px-2 font-bold text-slate-600 uppercase">Amount</th>
                                    <th className="text-left py-2 px-2 font-bold text-slate-600 uppercase">Remarks</th>
                                </tr>
                            </thead>
                            <tbody>
                                {allTypes.map((type, idx) => {
                                    const payment = payments.find(p => p.type === type);
                                    const hasData = payment && (payment.amount || payment.invoiceNo || payment.informedDate || payment.signDate || payment.remarks);

                                    // Optionally hide purely empty rows in read-only to save space, like the previous iteration.
                                    // But the original component from the screenshot left them all visible to act as an actual checklist/ledger!
                                    // I will leave them visible to match the user's preference for the exact old view.
                                    return (
                                        <tr key={type} className={`border-b border-green-100 ${hasData ? 'bg-green-50/50' : ''}`}>
                                            <td className="py-2 px-2 font-bold text-slate-400">{idx + 1}</td>
                                            <td className="py-2 px-2 font-bold text-slate-700">{type}</td>
                                            <td className="py-2 px-2 text-slate-600">{payment?.informedDate ? new Date(payment.informedDate).toLocaleDateString() : '-'}</td>
                                            <td className="py-2 px-2 text-slate-600">{payment?.signDate ? new Date(payment.signDate).toLocaleDateString() : '-'}</td>
                                            <td className="py-2 px-2 font-mono text-slate-600">{payment?.invoiceNo || '-'}</td>
                                            <td className="py-2 px-2 text-right font-bold text-green-700">{payment?.amount !== undefined ? `Rs. ${payment.amount.toLocaleString()}` : '-'}</td>
                                            <td className="py-2 px-2 text-slate-500 italic">{payment?.remarks || '-'}</td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                    {(candidate.usdRateEmb !== undefined || candidate.usdRateFA !== undefined) && (
                        <div className="mt-3 pt-3 border-t border-green-100 flex gap-6 text-xs">
                            {candidate.usdRateEmb !== undefined && (
                                <div><span className="font-bold text-slate-500 uppercase">USD Rate EMB:</span> <span className="font-bold text-slate-800 ml-1">{candidate.usdRateEmb}</span></div>
                            )}
                            {candidate.usdRateFA !== undefined && (
                                <div><span className="font-bold text-slate-500 uppercase">USD Rate F/A:</span> <span className="font-bold text-slate-800 ml-1">{candidate.usdRateFA}</span></div>
                            )}
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

export default FinancialLedgerWidget;
