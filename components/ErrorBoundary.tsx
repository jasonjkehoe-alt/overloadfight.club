import React, { ErrorInfo, ReactNode } from 'react';
import { ErrorState } from './States';

interface Props {
    children: ReactNode;
    // a new value clears the error, so the next page renders again (App passes the path)
    resetKey?: string;
}

interface State {
    // a flag beside the error, so a thrown null or undefined still shows the fallback
    hasError: boolean;
    error: unknown;
}

export class ErrorBoundary extends React.Component<Props, State> {
    public state: State;
    public props: Props;

    constructor(props: Props) {
        super(props);
        this.props = props;
        this.state = { hasError: false, error: null };
    }

    public static getDerivedStateFromError(error: unknown): State {
        return { hasError: true, error };
    }

    public componentDidCatch(error: unknown, errorInfo: ErrorInfo) {
        console.error('Uncaught error caught by ErrorBoundary:', error, errorInfo);
    }

    public componentDidUpdate(prevProps: Props, prevState: State) {
        // only an error from the page before: one thrown by the new page itself stays
        if (prevState.hasError && prevProps.resetKey !== this.props.resetKey) this.setState({ hasError: false, error: null });
    }

    public render() {
        if (this.state.hasError) {
            return (
                <ErrorState
                    title="Application recovery"
                    message={<>
                        <p>An unexpected interface exception occurred. You can safely reload the workstation.</p>
                        <pre className="mt-4 p-3 bg-black/80 rounded-control border border-line text-xs text-red-300 text-left overflow-x-auto">
                            {this.state.error instanceof Error ? this.state.error.message : String(this.state.error)}
                        </pre>
                    </>}
                    onRetry={() => window.location.reload()}
                    retryLabel="Reload Workstation"
                />
            );
        }

        return this.props.children;
    }
}
