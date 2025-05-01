import React, {ReactNode} from "react";

interface FallbackProps {
  error: Error;
  resetErrorBoundary: () => void;
}

interface Props {
  fallback?: ReactNode | ((props: FallbackProps) => ReactNode);
  onReset?: () => void;
  onError?: (error: Error, info: React.ErrorInfo) => void;
  children?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

class RsnErrorBoundary extends React.Component<Props, State> {
    state: State = { 
      hasError: false,
      error: null
    };
  
    static getDerivedStateFromError(error: Error): State {
      return { hasError: true, error };
    }
  
    componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
      if (this.props.onError) {
        this.props.onError(error, errorInfo);
      }
    }

    resetErrorBoundary = () => {
      this.props.onReset?.();
      this.setState({ hasError: false, error: null });
    }
  
    render(): any {
      if (this.state.hasError) {
        const fallback = this.props.fallback;

        if (typeof fallback === 'function') {
          return fallback({
            error: this.state.error!,
            resetErrorBoundary: this.resetErrorBoundary
          });
        }

        if (fallback) {
          return fallback;
        }

        // Default fallback UI
        return (
          <div>Error in RsnErrorBoundary</div>
        );
      }
  
      return this.props.children;
    }
}

export default RsnErrorBoundary;