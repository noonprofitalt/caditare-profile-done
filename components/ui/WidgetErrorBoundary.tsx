import React from 'react';
import ErrorBoundary from '../ErrorBoundary';
import { AlertTriangle, RefreshCcw } from 'lucide-react';

interface Props {
    children: React.ReactNode;
    fallbackTitle?: string;
    minHeight?: string;
}

const WidgetErrorBoundary: React.FC<Props> = ({ children, fallbackTitle = "Widget Error", minHeight = "200px" }) => {
    const fallback = (
        <div
            className={`flex flex-col items-center justify-center p-6 text-center bg-red-50/50 rounded-2xl border border-red-100`}
            style={{ minHeight }}
        >
            <div className="w-10 h-10 bg-red-100 text-red-500 rounded-full flex items-center justify-center mb-3">
                <AlertTriangle size={20} />
            </div>
            <h3 className="text-sm font-bold text-slate-800 mb-1">{fallbackTitle}</h3>
            <p className="text-xs text-slate-500 mb-4 max-w-[200px]">
                This section failed to load.
            </p>
            <button
                onClick={() => window.location.reload()}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-white border border-slate-200 shadow-sm text-slate-600 rounded-lg hover:bg-slate-50 transition-colors duration-200 text-xs font-bold"
            >
                <RefreshCcw size={12} /> Retry
            </button>
        </div>
    );

    return (
        <ErrorBoundary fallback={fallback}>
            {children}
        </ErrorBoundary>
    );
};

export default WidgetErrorBoundary;
