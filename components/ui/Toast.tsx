import React, { useEffect, useState } from 'react';
import { X, CheckCircle, AlertCircle, Info, AlertTriangle } from 'lucide-react';

export type ToastType = 'success' | 'error' | 'info' | 'warning';

interface ToastProps {
    message: string;
    type?: ToastType;
    duration?: number;
    onClose: () => void;
}

export const Toast: React.FC<ToastProps> = ({
    message,
    type = 'info',
    duration = 3000,
    onClose
}) => {
    const [isVisible, setIsVisible] = useState(true);

    useEffect(() => {
        const timer = setTimeout(() => {
            setIsVisible(false);
            setTimeout(onClose, 300); // Wait for fade-out animation
        }, duration);

        return () => clearTimeout(timer);
    }, [duration, onClose]);

    const icons = {
        success: <CheckCircle className="text-emerald-500" size={18} />,
        error: <AlertCircle className="text-rose-500" size={18} />,
        info: <Info className="text-blue-500" size={18} />,
        warning: <AlertTriangle className="text-amber-500" size={18} />,
    };

    const colors = {
        success: 'bg-emerald-50 border-emerald-100 text-emerald-900',
        error: 'bg-rose-50 border-rose-100 text-rose-900',
        info: 'bg-blue-50 border-blue-100 text-blue-900',
        warning: 'bg-amber-50 border-amber-100 text-amber-900',
    };

    return (
        <div className={`fixed bottom-8 right-8 z-[100] transition-all duration-300 transform ${isVisible ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-0'
            }`}>
            <div className={`flex items-center gap-3 px-4 py-3 rounded-2xl border shadow-xl backdrop-blur-md ${colors[type]}`}>
                {icons[type]}
                <span className="text-sm font-bold pr-2">{message}</span>
                <button
                    onClick={() => setIsVisible(false)}
                    className="p-1 hover:bg-black/5 rounded-lg transition-colors"
                >
                    <X size={14} className="opacity-40" />
                </button>
            </div>
        </div>
    );
};

export const useToast = () => {
    const [toast, setToast] = useState<{ message: string; type: ToastType } | null>(null);

    const showToast = (message: string, type: ToastType = 'info') => {
        setToast({ message, type });
    };

    const ToastContainer = () => (
        toast ? <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} /> : null
    );

    return { showToast, ToastContainer };
};
