import React, { Component, ErrorInfo, ReactNode } from "react";

interface Props {
    children?: ReactNode;
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
        console.error("Uncaught error:", error, errorInfo);
    }

    public render() {
        if (this.state.hasError) {
            return (
                <div className="min-h-screen flex items-center justify-center bg-background p-4">
                    <div className="max-w-md w-full bg-card border border-destructive/50 rounded-2xl p-8 text-center shadow-2xl">
                        <h1 className="text-2xl font-bold text-destructive mb-4">¡Oops! Algo salió mal</h1>
                        <p className="text-muted-foreground mb-6">
                            Ha ocurrido un error inesperado. Por favor, intenta recargar la página.
                        </p>
                        <div className="bg-secondary/50 p-4 rounded-lg text-left mb-6 overflow-auto max-h-40">
                            <code className="text-xs text-secondary-foreground whitespace-pre-wrap">
                                {this.state.error?.toString()}
                            </code>
                        </div>
                        <button
                            onClick={() => window.location.reload()}
                            className="w-full h-12 bg-primary text-primary-foreground rounded-xl font-medium hover:opacity-90 transition-opacity"
                        >
                            Recargar Página
                        </button>
                    </div>
                </div>
            );
        }

        return this.props.children;
    }
}

export default ErrorBoundary;
