import React, { Component, ErrorInfo, ReactNode } from 'react';

interface Props {
    children: ReactNode;
    fallback?: ReactNode;
    onError?: (error: Error, errorInfo: ErrorInfo) => void;
}

interface State {
    hasError: boolean;
    error: Error | null;
    errorInfo: ErrorInfo | null;
}

/**
 * Error Boundary Component
 * Catches JavaScript errors anywhere in the child component tree
 * and displays a fallback UI instead of crashing the whole app.
 * 
 * Usage:
 * <ErrorBoundary>
 *   <YourComponent />
 * </ErrorBoundary>
 */
export class ErrorBoundary extends Component<Props, State> {
    constructor(props: Props) {
        super(props);
        this.state = {
            hasError: false,
            error: null,
            errorInfo: null
        };
    }

    static getDerivedStateFromError(error: Error): Partial<State> {
        // Update state so the next render will show the fallback UI
        return { hasError: true, error };
    }

    componentDidCatch(error: Error, errorInfo: ErrorInfo) {
        // Log error to console in development
        if (process.env.NODE_ENV === 'development') {
            console.error('ErrorBoundary caught an error:', error, errorInfo);
        }

        // Call custom error handler if provided
        this.props.onError?.(error, errorInfo);

        // Update state with error details
        this.setState({
            error,
            errorInfo
        });

        // TODO: Log to external service (Sentry, LogRocket, etc.)
        // logErrorToService(error, errorInfo);
    }

    handleReset = () => {
        this.setState({
            hasError: false,
            error: null,
            errorInfo: null
        });
    };

    render() {
        if (this.state.hasError) {
            // Custom fallback UI
            if (this.props.fallback) {
                return this.props.fallback;
            }

            // Default fallback UI
            return (
                <div className="min-h-screen flex items-center justify-center bg-slate-100 p-4">
                    <div className="bg-white rounded-3xl shadow-2xl max-w-2xl w-full p-8 border-4 border-red-200">
                        <div className="text-center mb-6">
                            <div className="text-6xl mb-4">😵</div>
                            <h1 className="text-3xl font-black text-slate-900 uppercase mb-2">
                                Něco se pokazilo
                            </h1>
                            <p className="text-slate-600 font-bold">
                                Aplikace narazila na neočekávanou chybu.
                            </p>
                        </div>

                        {process.env.NODE_ENV === 'development' && this.state.error && (
                            <div className="bg-red-50 border-2 border-red-200 rounded-xl p-4 mb-6">
                                <h3 className="font-black text-red-900 text-sm uppercase mb-2">
                                    Error Details (Development Only):
                                </h3>
                                <pre className="text-xs text-red-700 overflow-auto max-h-48 font-mono">
                                    {this.state.error.toString()}
                                    {this.state.errorInfo?.componentStack}
                                </pre>
                            </div>
                        )}

                        <div className="flex flex-col sm:flex-row gap-3">
                            <button
                                onClick={this.handleReset}
                                className="flex-1 bg-slate-900 text-white px-6 py-4 rounded-xl font-black uppercase tracking-wide hover:bg-slate-800 transition-colors shadow-lg"
                            >
                                Zkusit znovu
                            </button>
                            <button
                                onClick={() => window.location.href = '/'}
                                className="flex-1 bg-orange-600 text-white px-6 py-4 rounded-xl font-black uppercase tracking-wide hover:bg-orange-700 transition-colors shadow-lg"
                            >
                                Domů
                            </button>
                        </div>

                        <div className="mt-6 text-center">
                            <p className="text-xs text-slate-500 font-bold">
                                Pokud problém přetrvává, kontaktujte podporu.
                            </p>
                        </div>
                    </div>
                </div>
            );
        }

        return this.props.children;
    }
}
