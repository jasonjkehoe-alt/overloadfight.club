import React, { ErrorInfo, ReactNode } from 'react';
import { ErrorState } from './States';

interface Props {
    children: ReactNode;
    // a new value clears the error, so the next page renders again (App passes the path)
    resetKey?: string;
}

interface State {
    error: Error | null;
}

export class ErrorBoundary extends React.Component<Props, State> {
    public state: State;
    public props: Props;

    constructor(props: Props) {
        super(props);
        this.props = props;
        this.state = { error: null };
    }

    public static getDerivedStateFromError(error: Error): State {
        return { error };
    }

    public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
        console.error('Uncaught error caught by ErrorBoundary:', error, errorInfo);
    }

    public componentDidUpdate(prevProps: Props) {
        if (this.state.error && prevProps.resetKey !== this.props.resetKey) this.setState({ error: null });
    }

    public render() {
        if (this.state.error) {
            return (
                <ErrorState
                    title="Application recovery"
                    message={<>
                        <p>An unexpected interface exception occurred. You can safely reload the workstation.</p>
                        <pre className="mt-4 p-3 bg-black/80 rounded-control border border-line text-xs text-red-300 text-left overflow-x-auto">
                            {this.state.error.message}
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
