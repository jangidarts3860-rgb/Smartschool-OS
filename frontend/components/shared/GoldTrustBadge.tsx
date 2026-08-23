import React from 'react';
import { Shield, CheckCircle, Lock } from 'lucide-react';

const GoldTrustBadge: React.FC = () => {
    return (
        <div className="p-5 bg-gradient-to-br from-amber-50 to-yellow-50 dark:from-amber-950/30 dark:to-yellow-950/30 rounded-2xl border border-amber-200 dark:border-amber-800/30 flex items-start gap-4 shadow-lg shadow-amber-500/10">
            <div className="w-12 h-12 bg-gradient-to-br from-amber-400 to-yellow-500 rounded-xl flex items-center justify-center shrink-0 shadow-lg shadow-amber-500/30">
                <Shield size={22} className="text-white" />
            </div>
            <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                    <span className="text-[11px] font-black text-amber-800 dark:text-amber-300 uppercase tracking-widest">
                        🏆 Gold Trust Badge
                    </span>
                    <CheckCircle size={14} className="text-emerald-500" />
                </div>
                <p className="text-[9px] font-bold text-amber-700 dark:text-amber-400 leading-relaxed">
                    🔒 Bank-Grade Encrypted: Your credentials are cryptographically protected using bcrypt hashing (work factor 10). School Admins have zero visibility into your password. Not even the system stores plaintext credentials.
                </p>
                <div className="flex items-center gap-4 mt-3 pt-3 border-t border-amber-200 dark:border-amber-800/30">
                    <div className="flex items-center gap-1.5">
                        <Lock size={10} className="text-emerald-500" />
                        <span className="text-[8px] font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-widest">bcrypt Hashed</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                        <CheckCircle size={10} className="text-emerald-500" />
                        <span className="text-[8px] font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-widest">Zero-Knowledge</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                        <Shield size={10} className="text-emerald-500" />
                        <span className="text-[8px] font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-widest">Admin Blind</span>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default GoldTrustBadge;
