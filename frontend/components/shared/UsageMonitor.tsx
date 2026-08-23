import React, { useState, useEffect } from 'react';
import { 
  Activity, 
  AlertTriangle, 
  Bell, 
  CheckCircle2, 
  TrendingUp,
  MessageSquare,
  Shield,
  X,
  RefreshCw
} from 'lucide-react';
import { usageService } from '@/services/usageService';

interface UsageStats {
  messageCount: number;
  apiCalls: number;
  storageUsed: number;
  lastUpdated: Date | null;
}

interface SchoolUsageLimit {
  monthlyMessageLimit: number;
  monthlyApiLimit: number;
  storageLimit: number;
  isUnlimited: boolean;
  tier: 'FREE' | 'BASIC' | 'PREMIUM' | 'ENTERPRISE';
}

interface AlertItem {
  id?: string;
  alertType: string;
  threshold: number;
  currentUsage: number;
  percentage: number;
}

interface Props {
  schoolId: string;
  isAdmin?: boolean;
}

const UsageMonitor: React.FC<Props> = ({ schoolId, isAdmin = false }) => {
  const [stats, setStats] = useState<UsageStats | null>(null);
  const [limits, setLimits] = useState<SchoolUsageLimit | null>(null);
  const [alerts, setAlerts] = useState<AlertItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [showDetails, setShowDetails] = useState(false);

  useEffect(() => {
    let unsubscribe: (() => void) | null = null;
    
    try {
      unsubscribe = usageService.subscribeToUsage(schoolId, (usageStats) => {
        if (usageStats) {
          setStats(usageStats);
          setLoading(false);
        }
      });

      usageService.getLimits(schoolId).then(setLimits).catch(() => {});
      usageService.getActiveAlerts(schoolId).then(setAlerts).catch(() => {});
    } catch (err) {
      console.warn('UsageMonitor subscription error:', err);
      setLoading(false);
    }

    return () => {
      if (unsubscribe) {
        try {
          unsubscribe();
        } catch (e) {
          // Ignore unmount errors during logout
        }
      }
    };
  }, [schoolId]);

  const messagePercentage = stats && limits && !limits.isUnlimited
    ? Math.min(100, (stats.messageCount / limits.monthlyMessageLimit) * 100)
    : 0;

  const messagePercentageDisplay = Math.round(messagePercentage);
  const usageColor = usageService.getUsageColor(messagePercentage);
  const daysLeft = usageService.getDaysUntilReset();
  const tierDisplay = limits ? usageService.getTierDisplay(limits.tier) : 'Loading...';

  const getProgressBarColor = () => {
    if (messagePercentage >= 100) return 'bg-red-500';
    if (messagePercentage >= 90) return 'bg-red-400';
    if (messagePercentage >= 75) return 'bg-amber-500';
    return 'bg-indigo-500';
  };

  return (
    <div className="relative">
      {/* Compact Usage Bar (always visible) */}
      <div 
        onClick={() => setShowDetails(!showDetails)}
        className="flex items-center gap-3 px-4 py-2 bg-slate-100 dark:bg-slate-800/50 rounded-xl cursor-pointer hover:bg-slate-200 dark:hover:bg-slate-700/50 transition-all"
      >
        <Activity size={16} className={usageColor} />
        <span className="text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest">
          Messages
        </span>
        <div className="flex-1 max-w-[80px] h-2 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
          <div 
            className={`h-full ${getProgressBarColor()} transition-all duration-500`}
            style={{ width: `${messagePercentageDisplay}%` }}
          />
        </div>
        <span className={`text-xs font-black ${usageColor}`}>
          {stats?.messageCount || 0}/{limits?.monthlyMessageLimit || 500}
        </span>
        {alerts.length > 0 && (
          <div className="relative">
            <Bell size={14} className="text-amber-500" />
            <div className="absolute -top-1 -right-1 w-4 h-4 bg-amber-500 rounded-full flex items-center justify-center">
              <span className="text-[8px] font-black text-white">{alerts.length}</span>
            </div>
          </div>
        )}
      </div>

      {/* Detailed Usage Panel */}
      {showDetails && (
        <div className="absolute top-full right-0 mt-2 w-80 bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-700 p-6 z-50 animate-in fade-in zoom-in-95 duration-200">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 rounded-2xl flex items-center justify-center">
                <Shield size={20} />
              </div>
              <div>
                <h3 className="text-sm font-black text-slate-900 dark:text-white">Usage Monitor</h3>
                <p className="text-[10px] font-medium text-slate-500 dark:text-slate-400">{tierDisplay}</p>
              </div>
            </div>
            <button 
              onClick={() => setShowDetails(false)}
              className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors"
            >
              <X size={16} className="text-slate-400" />
            </button>
          </div>

          {/* Message Usage */}
          <div className="space-y-4">
            <div className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-2xl">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <MessageSquare size={16} className="text-indigo-500" />
                  <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Monthly Messages</span>
                </div>
                <span className="text-xs font-bold text-slate-500 dark:text-slate-400">{daysLeft} days left</span>
              </div>
              
              <div className="flex items-end gap-3 mb-3">
                <span className={`text-3xl font-black ${usageColor}`}>
                  {stats?.messageCount || 0}
                </span>
                <span className="text-sm font-medium text-slate-400 mb-1">/ {limits?.monthlyMessageLimit || 500}</span>
              </div>

              <div className="w-full h-3 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                <div 
                  className={`h-full ${getProgressBarColor()} transition-all duration-500 rounded-full`}
                  style={{ width: `${messagePercentageDisplay}%` }}
                />
              </div>

              {messagePercentage >= 80 && (
                <div className="flex items-center gap-2 mt-3 text-amber-500">
                  <AlertTriangle size={12} />
                  <span className="text-[10px] font-bold">Approaching limit</span>
                </div>
              )}
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-2 gap-3">
              <div className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-2xl text-center">
                <p className="text-2xl font-black text-slate-900 dark:text-white">
                  {daysLeft}
                </p>
                <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Days Left</p>
              </div>
              <div className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-2xl text-center">
                <p className="text-2xl font-black text-slate-900 dark:text-white">
                  {(limits?.monthlyMessageLimit ?? 0) - (stats?.messageCount || 0)}
                </p>
                <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Remaining</p>
              </div>
            </div>

            {/* Active Alerts */}
            {alerts.length > 0 && (
              <div className="space-y-2">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Active Alerts</p>
                {alerts.slice(0, 3).map((alert, idx) => (
                  <div key={alert.id || idx} className="flex items-center gap-3 p-3 bg-amber-50 dark:bg-amber-900/20 rounded-xl">
                    <AlertTriangle size={14} className="text-amber-500" />
                    <div className="flex-1">
                      <p className="text-xs font-bold text-amber-700 dark:text-amber-400">
                        {alert.percentage.toFixed(0)}% Quota Used
                      </p>
                      <p className="text-[9px] text-amber-600 dark:text-amber-500">
                        {alert.currentUsage} / {alert.threshold} messages
                      </p>
                    </div>
                    <button className="p-1.5 hover:bg-amber-100 dark:hover:bg-amber-900/30 rounded-lg transition-colors">
                      <CheckCircle2 size={14} className="text-amber-500" />
                    </button>
                  </div>
                ))}
              </div>
            )}

            {/* Admin Actions */}
            {isAdmin && (
              <div className="pt-4 border-t border-slate-100 dark:border-slate-800">
                <button className="w-full flex items-center justify-center gap-2 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest transition-all">
                  <TrendingUp size={14} />
                  Upgrade Plan
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Critical Alert Banner */}
      {messagePercentage >= 100 && (
        <div className="fixed bottom-6 left-6 right-6 md:left-auto md:right-6 md:w-96 bg-red-600 text-white p-6 rounded-3xl shadow-2xl z-50 animate-bounce">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 bg-white/20 rounded-2xl flex items-center justify-center">
              <AlertTriangle size={24} />
            </div>
            <div className="flex-1">
              <h4 className="text-lg font-black mb-1">Message Limit Reached</h4>
              <p className="text-sm font-medium opacity-90 mb-3">
                You've used all {limits?.monthlyMessageLimit} messages for this month.
              </p>
              <div className="flex gap-3">
                <button className="px-4 py-2 bg-white/20 hover:bg-white/30 rounded-xl font-bold text-xs transition-all">
                  Upgrade Now
                </button>
                <button 
                  onClick={() => setShowDetails(true)}
                  className="px-4 py-2 bg-white text-red-600 hover:bg-red-50 rounded-xl font-bold text-xs transition-all"
                >
                  View Details
                </button>
              </div>
            </div>
            <button className="p-2 hover:bg-white/10 rounded-xl transition-colors">
              <X size={20} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default UsageMonitor;