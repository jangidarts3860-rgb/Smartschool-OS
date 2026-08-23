import React from 'react';
import {
  Fingerprint,
  History,
  Bot,
  Trash2,
  QrCode,
  CreditCard,
  Clock,
} from 'lucide-react';
import { toast } from 'react-hot-toast';

interface IdentityState {
  name: string;
  address: string;
  accentColor: string;
  logo: string;
  apiKeys: string[];
}

interface Props {
  identity: IdentityState;
  setIdentity: React.Dispatch<React.SetStateAction<IdentityState>>;
  onSave: () => Promise<void>;
  isSaving: boolean;
}

const TechIntegration: React.FC<Props> = ({ identity, setIdentity, onSave, isSaving }) => {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
      <div className="bg-slate-900 p-12 rounded-[3.5rem] border border-white/5 space-y-12 shadow-2xl relative overflow-hidden">
        <div className="flex justify-between items-start">
          <h3 className="text-2xl font-black text-white flex items-center gap-4 tracking-tight">
            <Fingerprint size={32} className="text-indigo-400" /> Biometric Bridge
          </h3>
          <span className="px-4 py-1.5 bg-emerald-500/10 text-emerald-400 rounded-xl text-[10px] font-black uppercase border border-emerald-500/20">Active Link</span>
        </div>
        
        <div className="space-y-8">
          <div className="space-y-3">
            <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-2">Hardware Master API Key</label>
            <div className="relative">
              <input type="password" value="••••••••••••••••••••••••••••••" readOnly placeholder="Configure in school settings" className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-5 text-xs font-mono text-indigo-300 outline-none" />
              <button className="absolute right-4 top-1/2 -translate-y-1/2 p-3 hover:text-white transition-all bg-white/10 rounded-xl"><History size={18}/></button>
            </div>
          </div>
          <div className="p-8 bg-white/5 rounded-[2.5rem] border border-white/5 flex items-center justify-between">
            <div>
              <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Last Poll Cycle</p>
              <p className="text-sm font-black text-indigo-400 mt-1">Today, 02:45 PM (Synced)</p>
            </div>
            <button className="px-6 py-3 bg-indigo-600 text-white rounded-xl font-black text-[10px] uppercase shadow-lg active:scale-95 transition-all">Manual Poll</button>
          </div>
        </div>
      </div>

      <div className="bg-slate-900 p-12 rounded-[3.5rem] border border-white/5 space-y-12 shadow-2xl relative overflow-hidden">
        <h3 className="text-2xl font-black text-white flex items-center gap-4 tracking-tight">
          <Bot size={32} className="text-indigo-400" /> AI Intelligence Hub
        </h3>
        
        <div className="space-y-8">
          <div className="p-6 bg-indigo-500/10 rounded-2xl border border-indigo-500/20">
            <p className="text-[10px] text-indigo-300 font-bold leading-relaxed">
              <span className="text-white font-black">Multi-Key Failover:</span> Add multiple Gemini API keys. If one key reaches its limit, the system will automatically switch to the next one. Keys are stored securely and only accessible to admins.
            </p>
          </div>
          
          <div className="space-y-4">
            {(identity.apiKeys || ['']).map((key, idx) => (
              <div key={idx} className="relative group animate-in slide-in-from-right-2" style={{ animationDelay: `${idx * 100}ms` }}>
                <input 
                  type="password" 
                  value={key}
                  onChange={e => {
                    const newKeys = [...(identity.apiKeys || [''])];
                    newKeys[idx] = e.target.value;
                    setIdentity({...identity, apiKeys: newKeys});
                  }}
                  placeholder={`Enter Gemini API Key #${idx + 1}`}
                  className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-5 text-xs font-mono text-indigo-300 outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 transition-all" 
                />
                {idx > 0 && (
                  <button 
                    onClick={() => {
                      const newKeys = identity.apiKeys?.filter((_, i) => i !== idx);
                      setIdentity({...identity, apiKeys: newKeys});
                    }}
                    className="absolute right-4 top-1/2 -translate-y-1/2 p-3 bg-red-500/10 text-red-500 rounded-xl hover:bg-red-500 hover:text-white transition-all"
                  >
                    <Trash2 size={16}/>
                  </button>
                )}
              </div>
            ))}
            
            <div className="flex gap-4 pt-4">
              <button 
                onClick={() => setIdentity({...identity, apiKeys: [...(identity.apiKeys || []), '']})}
                className="flex-1 py-4 border-2 border-dashed border-white/10 rounded-2xl text-[10px] font-black uppercase tracking-widest text-slate-500 hover:border-indigo-500 hover:text-indigo-400 transition-all"
              >
                + Add Another Key
              </button>
              
              <button 
                onClick={onSave}
                disabled={isSaving}
                className="flex-1 py-4 bg-indigo-600 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-sm shadow-indigo-600/20 hover:bg-indigo-700 active:scale-95 transition-all"
              >
                {isSaving ? 'Saving...' : 'Save AI Config'}
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-slate-900 p-12 rounded-[3.5rem] border border-white/5 space-y-12 shadow-2xl relative overflow-hidden">
        <h3 className="text-2xl font-black text-white flex items-center gap-4 tracking-tight">
          <CreditCard size={32} className="text-indigo-400" /> Payment Gateway
        </h3>
        <div className="p-16 border-4 border-dashed border-white/5 rounded-[3.5rem] flex flex-col items-center justify-center text-center bg-white/2 group hover:border-indigo-500/50 transition-all cursor-pointer">
          <QrCode size={56} className="text-slate-600 mb-8 group-hover:text-indigo-400 transition-colors" />
          <p className="text-2xl font-black text-white tracking-tight leading-none">Global Payments Bridge</p>
          <p className="text-xs font-medium text-slate-500 mt-4 max-w-[240px] leading-relaxed">Connect Razorpay, Stripe, or Paytm production keys to begin digital collections.</p>
          <button 
            onClick={() => toast.loading("Redirecting to payment partner onboarding...")}
            className="mt-10 px-10 py-5 bg-white/5 hover:bg-indigo-600 rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] transition-all border border-white/10 shadow-lg active:scale-95"
          >
            Enable Collections
          </button>
        </div>
      </div>
    </div>
  );
};

export default TechIntegration;
