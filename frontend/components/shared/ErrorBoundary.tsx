import React, { Component, ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import { AlertTriangle, RefreshCcw, Home } from 'lucide-react';

interface Props {
  children: ReactNode;
  fallbackLabel?: string;
  onReset?: () => void;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

const ErrorBoundaryContent: React.FC<{ fallbackLabel?: string; onReset?: () => void }> = ({ fallbackLabel, onReset }) => {
  const navigate = useNavigate();
  
  const handleReset = () => {
    onReset?.();
    window.location.reload();
  };
  
  return (
    <div className="min-h-[400px] flex flex-col items-center justify-center p-10 text-center bg-white dark:bg-slate-950 rounded-[2.5rem] border border-red-100 dark:border-red-900/30 shadow-sm">
      <div className="w-20 h-20 bg-red-50 dark:bg-red-900/20 rounded-[2rem] flex items-center justify-center mb-6">
        <AlertTriangle size={36} className="text-red-500" />
      </div>
      <h3 className="text-xl font-black text-slate-900 dark:text-white tracking-tight mb-2">
        {fallbackLabel || 'Something went wrong'}
      </h3>
      <p className="text-sm text-slate-500 dark:text-slate-400 mb-2 max-w-sm leading-relaxed">
        This section encountered an unexpected error and could not render. Your data is safe.
      </p>
      <div className="flex gap-3 mt-6">
        <button
          onClick={handleReset}
          className="flex items-center gap-2 px-6 py-3 bg-indigo-600 text-white rounded-2xl font-black text-xs uppercase tracking-widest shadow-lg hover:bg-indigo-700 transition-all active:scale-95"
        >
          <RefreshCcw size={16} /> Try Again
        </button>
        <button
          onClick={() => navigate('/')}
          className="flex items-center gap-2 px-6 py-3 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-slate-200 dark:hover:bg-slate-700 transition-all"
        >
          <Home size={16} /> Go Home
        </button>
      </div>
    </div>
  );
};

class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    console.error('[SmartSchool ErrorBoundary]', error, info.componentStack);
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null });
    this.props.onReset?.();
  };

  render() {
    if (this.state.hasError) {
      return (
        <ErrorBoundaryContent 
          fallbackLabel={this.props.fallbackLabel} 
          onReset={this.handleReset} 
        />
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;