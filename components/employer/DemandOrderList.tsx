import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { DemandOrder, DemandOrderStatus } from '../../types';
import { DemandOrderService } from '../../services/demandOrderService';
import {
    Package, Plus, Calendar, MapPin, Users, Clock,
    ChevronRight, AlertTriangle, CheckCircle2, TrendingUp, Briefcase, ExternalLink, Loader
} from 'lucide-react';

interface DemandOrderListProps {
    employerId: string;
    onSelectOrder: (order: DemandOrder) => void;
    selectedOrderId?: string;
    onCreateNew: () => void;
}

const DemandOrderList: React.FC<DemandOrderListProps> = ({
    employerId,
    onSelectOrder,
    selectedOrderId,
    onCreateNew,
}) => {
    const [filter, setFilter] = useState<'all' | 'open' | 'filled' | 'closed'>('all');
    const [orders, setOrders] = useState<DemandOrder[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const loadOrders = async () => {
            setIsLoading(true);
            try {
                const data = await DemandOrderService.getByEmployerId(employerId);
                setOrders(data || []);
            } catch (error) {
                console.error("Failed to load demand orders", error);
            } finally {
                setIsLoading(false);
            }
        };
        loadOrders();
    }, [employerId]);

    const filteredOrders = orders.filter(o => {
        if (filter === 'all') return true;
        if (filter === 'open') return o.status === DemandOrderStatus.OPEN || o.status === DemandOrderStatus.PARTIALLY_FILLED;
        if (filter === 'filled') return o.status === DemandOrderStatus.FILLED;
        if (filter === 'closed') return o.status === DemandOrderStatus.CLOSED || o.status === DemandOrderStatus.CANCELLED;
        return true;
    });

    const getStatusConfig = (status: DemandOrderStatus) => {
        switch (status) {
            case DemandOrderStatus.OPEN:
                return { color: 'bg-blue-100 text-blue-700 border-blue-200', icon: TrendingUp };
            case DemandOrderStatus.PARTIALLY_FILLED:
                return { color: 'bg-amber-100 text-amber-700 border-amber-200', icon: Clock };
            case DemandOrderStatus.FILLED:
                return { color: 'bg-green-100 text-green-700 border-green-200', icon: CheckCircle2 };
            case DemandOrderStatus.CLOSED:
                return { color: 'bg-slate-100 text-slate-600 border-slate-200', icon: CheckCircle2 };
            case DemandOrderStatus.CANCELLED:
                return { color: 'bg-red-100 text-red-700 border-red-200', icon: AlertTriangle };
            default:
                return { color: 'bg-slate-100 text-slate-600 border-slate-200', icon: Package };
        }
    };

    const getDaysUntilDeadline = (deadline?: string) => {
        if (!deadline) return null;
        const days = Math.ceil((new Date(deadline).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
        return days;
    };

    const stats = {
        total: orders.length,
        open: orders.filter(o => o.status === DemandOrderStatus.OPEN || o.status === DemandOrderStatus.PARTIALLY_FILLED).length,
        totalPositions: orders.reduce((sum, o) => sum + o.positionsRequired, 0),
        totalFilled: orders.reduce((sum, o) => sum + o.positionsFilled, 0),
    };

    if (isLoading) return (
        <div className="flex flex-col items-center justify-center p-12 text-slate-400">
            <Loader className="animate-spin mb-2" size={24} />
            <p className="text-xs font-bold">Loading orders...</p>
        </div>
    );

    return (
        <div className="space-y-6">
            {/* Stats Bar */}
            <div className="grid grid-cols-4 gap-3">
                {[
                    { label: 'Total Orders', value: stats.total, color: 'text-slate-800' },
                    { label: 'Active', value: stats.open, color: 'text-blue-600' },
                    { label: 'Positions', value: stats.totalPositions, color: 'text-purple-600' },
                    { label: 'Filled', value: stats.totalFilled, color: 'text-green-600' },
                ].map((s, i) => (
                    <div key={i} className="bg-white/60 backdrop-blur rounded-xl p-3 border border-slate-100">
                        <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">{s.label}</p>
                        <p className={`text-xl font-black ${s.color}`}>{s.value}</p>
                    </div>
                ))}
            </div>

            {/* Filters + Create */}
            <div className="flex items-center justify-between">
                <div className="flex gap-1 bg-slate-100 p-1 rounded-xl">
                    {(['all', 'open', 'filled', 'closed'] as const).map(f => (
                        <button
                            key={f}
                            onClick={() => setFilter(f)}
                            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all capitalize ${filter === f
                                ? 'bg-white text-slate-800 shadow-sm'
                                : 'text-slate-500 hover:text-slate-700'
                                }`}
                        >
                            {f}
                        </button>
                    ))}
                </div>
                <button
                    onClick={onCreateNew}
                    className="px-4 py-2 bg-blue-600 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 hover:bg-blue-700 shadow-lg shadow-blue-100 transition-all"
                >
                    <Plus size={14} /> New Demand Order
                </button>
            </div>

            {/* Order List */}
            <div className="space-y-3">
                {filteredOrders.length === 0 ? (
                    <div className="text-center py-16 bg-white rounded-2xl border border-dashed border-slate-200">
                        <Package size={40} className="mx-auto text-slate-300 mb-3" />
                        <p className="text-sm font-bold text-slate-400">No demand orders found</p>
                        <p className="text-xs text-slate-400 mt-1">Create one to start matching candidates</p>
                    </div>
                ) : (
                    filteredOrders.map(order => {
                        const statusConfig = getStatusConfig(order.status);
                        const fillPercent = order.positionsRequired > 0
                            ? Math.round((order.positionsFilled / order.positionsRequired) * 100)
                            : 0;
                        const daysLeft = getDaysUntilDeadline(order.deadline);
                        const isSelected = selectedOrderId === order.id;

                        return (
                            <div
                                key={order.id}
                                onClick={() => onSelectOrder(order)}
                                className={`bg-white rounded-2xl border p-5 cursor-pointer transition-all hover:shadow-md group ${isSelected
                                    ? 'border-blue-300 ring-2 ring-blue-100 shadow-md'
                                    : 'border-slate-200 hover:border-blue-200'
                                    }`}
                            >
                                <div className="flex items-start justify-between mb-3">
                                    <div className="flex-1">
                                        <h4 className="text-sm font-bold text-slate-800 group-hover:text-blue-700 transition-colors">
                                            {order.title}
                                        </h4>
                                        <div className="flex items-center gap-3 mt-1.5">
                                            <span className="text-[10px] text-slate-500 flex items-center gap-1">
                                                <MapPin size={10} /> {order.location}, {order.country}
                                            </span>
                                            <span className="text-[10px] text-green-600 font-bold">{order.salaryRange}</span>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <Link
                                            to={`/jobs?employer=${order.employerId}`}
                                            onClick={(e) => e.stopPropagation()}
                                            className="p-1.5 bg-blue-50 text-blue-500 rounded-lg border border-blue-100 hover:bg-blue-100 transition-all"
                                            title="View on Job Board"
                                        >
                                            <Briefcase size={12} />
                                        </Link>
                                        <span className={`text-[9px] font-bold px-2 py-1 rounded-lg border ${statusConfig.color}`}>
                                            {order.status}
                                        </span>
                                        <ChevronRight size={16} className={`text-slate-300 group-hover:text-blue-500 transition-colors ${isSelected ? 'text-blue-500' : ''}`} />
                                    </div>
                                </div>

                                {/* Progress Bar */}
                                <div className="flex items-center gap-3">
                                    <div className="flex-1">
                                        <div className="flex items-center justify-between mb-1">
                                            <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1">
                                                <Users size={10} /> {order.positionsFilled}/{order.positionsRequired} filled
                                            </span>
                                            <span className="text-[9px] font-black text-slate-700">{fillPercent}%</span>
                                        </div>
                                        <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
                                            <div
                                                className={`h-full rounded-full transition-all duration-700 ${fillPercent >= 100 ? 'bg-green-500' : fillPercent > 50 ? 'bg-blue-500' : 'bg-blue-400'
                                                    }`}
                                                style={{ width: `${fillPercent}%` }}
                                            />
                                        </div>
                                    </div>
                                    {daysLeft !== null && (
                                        <span className={`text-[9px] font-bold px-2 py-1 rounded-lg flex items-center gap-1 whitespace-nowrap ${daysLeft <= 7 ? 'bg-red-50 text-red-600' :
                                            daysLeft <= 30 ? 'bg-amber-50 text-amber-600' :
                                                'bg-slate-50 text-slate-500'
                                            }`}>
                                            <Calendar size={10} />
                                            {daysLeft > 0 ? `${daysLeft}d left` : 'Overdue'}
                                        </span>
                                    )}
                                </div>
                            </div>
                        );
                    })
                )}
            </div>
        </div>
    );
};

export default DemandOrderList;
