import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';

interface Props {
    children: ReactNode;
}

interface State {
    hasError: boolean;
    error: Error | null;
}

class ErrorBoundary extends Component<Props, State> {
    public state: State = {
        hasError: false,
        error: null,
    };

    public static getDerivedStateFromError(error: Error): State {
        return { hasError: true, error };
    }

    public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
        console.error('Uncaught error:', error, errorInfo);
    }

    private handleReset = () => {
        this.setState({ hasError: false, error: null });
        window.location.reload();
    };

    public render() {
        if (this.state.hasError) {
            return (
                <div className="flex flex-col items-center justify-center min-h-[400px] p-8 text-center animate-in fade-in zoom-in duration-300">
                    <div className="w-20 h-20 bg-red-50 rounded-full flex items-center justify-center mb-6 shadow-inner ring-8 ring-red-50/50">
                        <AlertTriangle size={32} className="text-red-500 animate-pulse" />
                    </div>
                    <h2 className="text-2xl font-black text-slate-900 mb-2">Something went wrong</h2>
                    <p className="text-sm text-slate-500 max-w-md mb-8 leading-relaxed">
                        We encountered an unexpected error while rendering this component. Our team has been notified.
                    </p>
                    <div className="flex gap-4">
                        <button
                            onClick={this.handleReset}
                            className="flex items-center gap-2 px-6 py-3 bg-slate-900 text-white rounded-xl font-bold hover:bg-slate-800 transition-all active:scale-95 shadow-lg shadow-slate-200"
                        >
                            <RefreshCw size={18} /> Reload Page
                        </button>
                        <button
                            onClick={() => window.history.back()}
                            className="px-6 py-3 bg-white text-slate-700 border border-slate-200 rounded-xl font-bold hover:bg-slate-50 transition-all active:scale-95"
                        >
                            Go Back
                        </button>
                    </div>
                    {process.env.NODE_ENV === 'development' && this.state.error && (
                        <div className="mt-12 text-left bg-slate-50 p-6 rounded-2xl border border-slate-200 w-full max-w-3xl overflow-auto">
                            <p className="font-mono text-xs text-red-600 font-bold mb-2">{this.state.error.toString()}</p>
                            <pre className="font-mono text-[10px] text-slate-500 whitespace-pre-wrap">
                                {this.state.error.stack}
                            </pre>
                        </div>
                    )}
                </div>
            );
        }

        return this.props.children;
    }
}

export default ErrorBoundary;
