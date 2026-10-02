import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';

interface Props {
    children: ReactNode;
}

interface State {
    hasError: boolean;
    error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
    public state: State = {
        hasError: false,
        error: null
    };

    public static getDerivedStateFromError(error: Error): State {
        return { hasError: true, error };
    }

    public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
        console.error('Uncaught error caught by ErrorBoundary:', error, errorInfo);
    }

    public render() {
        if (this.state.hasError) {
            return (
                <div className="min-h-screen bg-black text-gray-200 flex flex-col items-center justify-center p-6 font-mono">
                    <div className="max-w-lg w-full bg-[#141414] border border-red-500/40 rounded-2xl p-6 shadow-2xl space-y-4 text-center">
                        <div className="w-12 h-12 rounded-full bg-red-950/60 border border-red-500/50 flex items-center justify-center mx-auto text-red-400">
                            <AlertTriangle className="w-6 h-6" />
                        </div>
                        <h2 className="text-xl font-bold text-white tracking-wide">
                            APPLICATION RECOVERY
                        </h2>
                        <p className="text-xs text-gray-400 leading-relaxed">
                            An unexpected interface exception occurred. You can safely reload the workstation.
                        </p>
                        {this.state.error && (
                            <pre className="p-3 bg-black/80 rounded-xl border border-white/5 text-[11px] text-red-300 text-left overflow-x-auto">
                                {this.state.error.message}
                            </pre>
                        )}
                        <button
                            onClick={() => window.location.reload()}
                            className="px-5 py-2.5 rounded-xl bg-[#ff6600] hover:bg-[#ff8533] text-black font-bold text-xs inline-flex items-center gap-2 transition-all shadow-lg shadow-[#ff6600]/20"
                        >
                            <RefreshCw className="w-4 h-4" />
                            <span>Reload Workstation</span>
                        </button>
                    </div>
                </div>
            );
        }

        return this.props.children;
    }
}
