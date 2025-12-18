import { cn } from "@/lib/utils";
import { Warning, ArrowsClockwise } from "@phosphor-icons/react";
import { Component, ReactNode } from "react";
import { ErrorReportDialog } from "./ErrorReportDialog";

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    // Log error for debugging but don't expose to user
    console.error('[Error Boundary]', error);
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: any) {
    // Log detailed error information server-side (if error reporting service is configured)
    console.error('[Error Boundary] Component stack:', errorInfo.componentStack);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex items-center justify-center min-h-screen p-8 bg-background">
          <div className="flex flex-col items-center w-full max-w-2xl p-8">
            <Warning
              size={48}
              weight="bold"
              className="text-destructive mb-6 flex-shrink-0"
            />

            <h2 className="text-xl mb-4 font-semibold">Something went wrong</h2>
            
            <p className="text-muted-foreground text-center mb-6 max-w-md">
              We're sorry, but something unexpected happened. Please try reloading the page. If the problem persists, contact support.
            </p>

            {/* Only show error details in development mode */}
            {process.env.NODE_ENV === 'development' && this.state.error && (
              <details className="p-4 w-full rounded bg-muted overflow-auto mb-6">
                <summary className="cursor-pointer text-sm font-medium mb-2">Technical Details (Development Only)</summary>
                <pre className="text-xs text-muted-foreground whitespace-break-spaces mt-2">
                  {this.state.error?.stack}
                </pre>
              </details>
            )}

            <div className="flex gap-2 justify-center">
              <button
                onClick={() => window.location.reload()}
                className={cn(
                  "flex items-center gap-2 px-4 py-2 rounded-lg",
                  "bg-primary text-primary-foreground",
                  "hover:opacity-90 cursor-pointer"
                )}
              >
                <ArrowsClockwise size={16} weight="bold" />
                Reload Page
              </button>
              <ErrorReportDialog 
                error={this.state.error} 
                errorMessage={this.state.error?.message}
              />
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
