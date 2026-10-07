import React from 'react';
import { AlertTriangle, Inbox, RefreshCw, LucideIcon } from 'lucide-react';

// The three states every view shows while it loads, when it has nothing to
// show, and when its data failed. compact is for a section inside a page.

interface LoadingProps {
    label?: React.ReactNode;
    compact?: boolean;
}

export const Loading: React.FC<LoadingProps> = ({ label, compact }) => (
    <div role="status" className={`flex flex-col items-center justify-center gap-3 font-mono ${compact ? 'py-8' : 'py-24'}`}>
        <div className={`${compact ? 'w-6 h-6 border-2' : 'w-10 h-10 border-4'} border-brand border-t-transparent rounded-full animate-spin`} />
        {label && <div className="text-brand text-xs uppercase tracking-wider">{label}</div>}
    </div>
);

interface EmptyStateProps {
    title: string;
    message?: React.ReactNode;
    icon?: LucideIcon;
    action?: React.ReactNode;
    compact?: boolean;
}

export const EmptyState: React.FC<EmptyStateProps> = ({ title, message, icon: Icon = Inbox, action, compact }) => (
    <div className={`flex flex-col items-center text-center gap-2 font-mono ${compact ? 'py-8 px-4' : 'py-16 px-6'}`}>
        <Icon className="w-6 h-6 text-gray-600 mb-1" />
        <p className="text-sm font-bold text-gray-300">{title}</p>
        {message && <div className="text-xs text-gray-500 max-w-md leading-relaxed">{message}</div>}
        {action && <div className="mt-2">{action}</div>}
    </div>
);

interface ErrorStateProps {
    title?: string;
    message?: React.ReactNode;
    onRetry?: () => void;
    retryLabel?: string;
    action?: React.ReactNode;
    compact?: boolean;
}

export const ErrorState: React.FC<ErrorStateProps> = ({ title = 'Could not load this', message, onRetry, retryLabel = 'Retry', action, compact }) => (
    <div role="alert" className={`bg-surface-card border border-red-900/60 rounded-card text-center font-mono ${compact ? 'p-4' : 'p-8 max-w-xl mx-auto my-16'}`}>
        <div className={`${compact ? 'w-8 h-8 mb-2' : 'w-12 h-12 mb-4'} rounded-full bg-red-950/60 border border-red-700/60 text-red-400 flex items-center justify-center mx-auto`}>
            <AlertTriangle className={compact ? 'w-4 h-4' : 'w-6 h-6'} />
        </div>
        <h3 className={`${compact ? 'text-sm mb-1' : 'text-lg mb-2'} font-bold text-white tracking-wide uppercase`}>{title}</h3>
        {message && <div className={`${compact ? 'text-xs' : 'text-sm'} text-gray-400 leading-relaxed`}>{message}</div>}
        {(onRetry || action) && (
            <div className={`flex gap-4 justify-center ${compact ? 'mt-4' : 'mt-6'}`}>
                {action}
                {onRetry && (
                    <button
                        onClick={onRetry}
                        className="px-5 py-2.5 bg-brand hover:bg-brand-hover text-black font-bold rounded-control text-xs uppercase tracking-wider inline-flex items-center gap-2 transition-colors"
                    >
                        <RefreshCw className="w-4 h-4" />
                        {retryLabel}
                    </button>
                )}
            </div>
        )}
    </div>
);
