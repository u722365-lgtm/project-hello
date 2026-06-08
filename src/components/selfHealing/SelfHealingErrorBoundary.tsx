import { Component, type ErrorInfo, type ReactNode } from "react";
import { Link } from "react-router-dom";
import { capture } from "@/lib/selfHealing/errorCapture";
import { Button } from "@/components/ui/button";
import { AlertTriangle, RefreshCw } from "lucide-react";

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  message?: string;
}

export class SelfHealingErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false };

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, message: error.message };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    capture({
      kind: "react",
      message: error.message,
      stack: error.stack,
      context: { componentStack: info.componentStack?.slice(0, 1500) },
    });
  }

  reset = () => this.setState({ hasError: false, message: undefined });

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) return this.props.fallback;
      return (
        <div className="min-h-[40vh] flex items-center justify-center p-6">
          <div className="max-w-md text-center space-y-3 rounded-2xl border border-border bg-card/80 backdrop-blur-xl p-6">
            <AlertTriangle className="h-8 w-8 mx-auto text-destructive" />
            <h2 className="text-lg font-semibold">ShadowTalk caught an error</h2>
            <p className="text-sm text-muted-foreground">
              The self-healing engine has logged this and is generating a fix.
            </p>
            <p className="text-xs text-muted-foreground font-mono break-words">
              {this.state.message}
            </p>
            <div className="flex flex-wrap items-center justify-center gap-2">
              <Button onClick={this.reset} size="sm" variant="outline">
                <RefreshCw className="h-3 w-3 mr-2" /> Retry
              </Button>
              <Button asChild size="sm" variant="secondary">
                <Link to="/self-healing">View diagnostics</Link>
              </Button>
            </div>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}
