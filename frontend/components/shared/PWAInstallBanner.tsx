import React, { useState, useEffect } from 'react';
import { Download, X, Smartphone, ArrowRight } from 'lucide-react';
import { useInstallPrompt } from '@/hooks/useInstallPrompt';

const PWAInstallBanner: React.FC = () => {
  const { isInstallable, isStandalone, handleInstallClick } = useInstallPrompt();
  const [isVisible, setIsVisible] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    // Show banner after a delay when page loads
    const timer = setTimeout(() => {
      if (isInstallable && !isStandalone && !dismissed) {
        setIsVisible(true);
      }
    }, 3000);
    return () => clearTimeout(timer);
  }, [isInstallable, isStandalone, dismissed]);

  if (!isVisible || isStandalone) return null;

  const handleDismiss = () => {
    setIsVisible(false);
    setDismissed(true);
  };

  return (
    <div
      className="fixed bottom-0 left-0 right-0 z-50 p-4 animate-in slide-in-from-bottom duration-500"
      style={{
        animationDelay: '3s',
      }}
    >
      <div className="glass-panel rounded-[2rem] p-4 md:p-6 max-w-4xl mx-auto shadow-2xl hover-lift border border-indigo-500/30">
        <div className="flex items-center justify-between gap-4">
          {/* Icon */}
          <div className="hidden md:flex w-14 h-14 bg-gradient-to-br from-indigo-500 to-purple-500 rounded-2xl items-center justify-center shadow-lg shadow-indigo-500/30 shrink-0">
            <Smartphone size={24} className="text-white" />
          </div>

          {/* Content */}
          <div className="flex-1 text-center md:text-left">
            <h4 className="text-sm font-black text-slate-900 dark:text-white tracking-tight">
              Install SmartSchool OS
            </h4>
            <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-1">
              Add to home screen for the full app experience
            </p>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-3 shrink-0">
            <button
              onClick={handleInstallClick}
              className="flex items-center gap-2 px-5 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest hover:scale-105 active:scale-95 transition-all shadow-lg shadow-indigo-500/30"
            >
              <Download size={14} />
              <span className="hidden md:inline">Install</span>
            </button>
            <button
              onClick={handleDismiss}
              aria-label="Dismiss install prompt"
              className="p-3 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            >
              <X size={18} className="text-slate-400" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PWAInstallBanner;