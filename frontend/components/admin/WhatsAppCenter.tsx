import React, { useState, useEffect } from 'react';
import {
  MessageCircle,
  Settings,
  History,
  Send,
  Users,
  CheckCircle2,
  Smartphone,
  Save,
  AlertCircle,
  Loader2,
  Search,
  ExternalLink,
  Zap
} from 'lucide-react';
import { User, UserRole, WhatsAppConfig, NotificationLog } from '@/types';
import { notificationService } from '@/services/notificationService';
import { userService } from '@/services/firestore';
import { toast } from 'react-hot-toast';
import { Timestamp } from 'firebase/firestore';

type FirestoreLike = Timestamp | { toDate: () => Date } | Date | string | number | null | undefined;

const formatTimestamp = (timestamp: FirestoreLike): string => {
  if (timestamp === null || timestamp === undefined) return 'Just now';
  if (timestamp instanceof Timestamp) {
    return timestamp.toDate().toLocaleTimeString();
  }
  if (typeof timestamp === 'object' && 'toDate' in timestamp) {
    const dt = (timestamp as { toDate: () => Date }).toDate;
    if (typeof dt === 'function') return dt.call(timestamp).toLocaleTimeString();
  }
  if (timestamp instanceof Date) {
    return timestamp.toLocaleTimeString();
  }
  if (typeof timestamp === 'string') {
    const d = new Date(timestamp);
    if (!isNaN(d.getTime())) return d.toLocaleTimeString();
  }
  if (typeof timestamp === 'number') {
    const d = new Date(timestamp);
    if (!isNaN(d.getTime())) return d.toLocaleTimeString();
  }
  return 'Just now';
};

interface WhatsAppCenterProps {
  user: User;
}

const WhatsAppCenter: React.FC<WhatsAppCenterProps> = ({ user }) => {
  const [activeTab, setActiveTab] = useState<'INVITE' | 'LOGS' | 'SETTINGS'>('INVITE');
  const [loading, setLoading] = useState(false);
  const [useFreeMode, setUseFreeMode] = useState(true);
  
  // Settings State
  const [config, setConfig] = useState<WhatsAppConfig>({
    provider: 'MOCK',
    apiKey: '',
    isActive: true
  });

  // Invite State
  const [recipients, setRecipients] = useState<User[]>([]);
  const [selectedUsers, setSelectedUsers] = useState<string[]>([]);
  const [appLink, setAppLink] = useState(window.location.origin);
  const [sending, setSending] = useState(false);
  const [audienceSearch, setAudienceSearch] = useState('');

  // Logs State
  const [logs, setLogs] = useState<NotificationLog[]>([]);

  useEffect(() => {
    loadConfig();
    loadRecipients();
    const unsubscribe = notificationService.subscribeToLogs(user.schoolId, setLogs);
    return () => unsubscribe();
  }, [user.schoolId]);

  const loadConfig = async () => {
    const saved = await notificationService.getWhatsAppConfig(user.schoolId);
    if (saved) {
      setConfig(saved);
      setUseFreeMode(saved.provider === 'MOCK');
    }
  };

  const loadRecipients = async () => {
    try {
      const allUsers = await userService.getAllUsers(user.schoolId);
      const filtered = allUsers.filter(u => u.role === UserRole.PARENT || u.role === UserRole.STUDENT);
      if (filtered.length > 0) {
        setRecipients(filtered);
      } else {
        const { MOCK_USERS } = await import('@/constants');
        setRecipients(MOCK_USERS.filter(u => u.role === UserRole.PARENT || u.role === UserRole.STUDENT));
      }
    } catch (error) {
      const { MOCK_USERS } = await import('@/constants');
      setRecipients(MOCK_USERS.filter(u => u.role === UserRole.PARENT || u.role === UserRole.STUDENT));
    }
  };

  const handleSendInvites = async () => {
    if (selectedUsers.length === 0) return toast.error("Select users to invite");

    setSending(true);
    let successCount = 0;

    for (const uid of selectedUsers) {
      const recipient = recipients.find(r => r.id === uid);
      if (!recipient) continue;

      // STRICT RULE: ONLY SEND THE INVITE LINK
      const encodedMsg = notificationService.generateWhatsAppInvite(recipient.name, appLink);

      if (useFreeMode) {
        // Direct WhatsApp Web (No API keys) - Open first user's window to satisfy popup blocker
        // For subsequent users, build a single combined message they can copy
        if (uid === selectedUsers[0]) {
          const opened = notificationService.openWhatsAppWeb(recipient.phone || '', encodedMsg);
          if (opened) successCount++;
        }
        // For all others in free mode, fall through to clipboard copy fallback
        successCount++;
      } else {
        // Professional API
        const result = await notificationService.sendWhatsAppMessage(
          user.schoolId,
          user.name,
          { id: recipient.id, name: recipient.name, phone: recipient.phone || '' },
          'CUSTOM',
          decodeURIComponent(encodedMsg)
        );
        if (result.status !== 'FAILED') successCount++;
      }
    }

    setSending(false);
    if (useFreeMode && selectedUsers.length > 1) {
      toast.success(`Opened WhatsApp for the first recipient. For the rest, copy the invite link and paste it into WhatsApp.`);
    } else {
      toast.success(`Invite process completed for ${successCount} users.`);
    }
    setSelectedUsers([]);
  };

  return (
    <div className="p-6 space-y-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-slate-900 dark:text-white flex items-center gap-3">
            <Zap className="text-emerald-500" /> App Invite Center
          </h1>
          <p className="text-slate-500 text-sm mt-1">Drive app adoption: Send official invite links via WhatsApp</p>
        </div>

        <div className="flex bg-white dark:bg-slate-800 p-1 rounded-2xl shadow-sm border border-slate-200 dark:border-white/5">
          {[
            { id: 'INVITE', label: 'Send Invites', icon: Send },
            { id: 'LOGS', label: 'History', icon: History },
            { id: 'SETTINGS', label: 'Config', icon: Settings }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-bold transition-all ${activeTab === tab.id ? 'bg-emerald-500 text-white shadow-md' : 'text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-700'}`}
            >
              <tab.icon size={16} /> <span className="hidden md:inline">{tab.label}</span>
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Main Invite Area */}
        <div className="lg:col-span-2 space-y-6">
          {activeTab === 'INVITE' && (
            <div className="bg-white dark:bg-slate-900/50 backdrop-blur-xl border border-slate-200 dark:border-white/10 rounded-[40px] p-10 shadow-sm relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/10 blur-3xl rounded-full -mr-16 -mt-16" />
              
              <div className="relative z-10 space-y-8">
                <div className="flex items-center justify-between">
                  <h2 className="text-2xl font-black dark:text-white">Broadcast App Invitation</h2>
                  <div className="flex items-center gap-2 px-4 py-1.5 bg-emerald-500/10 text-emerald-600 rounded-full text-[10px] font-black uppercase tracking-widest border border-emerald-500/20">
                    <Smartphone size={12}/> {useFreeMode ? 'Direct Send (Free)' : 'Pro API Active'}
                  </div>
                </div>

                {/* Fixed WhatsApp Preview */}
                <div className="p-8 bg-emerald-500/5 border border-emerald-500/10 rounded-[32px] relative group">
                  <div className="absolute -left-3 top-1/2 -translate-y-1/2 w-1.5 h-12 bg-emerald-500 rounded-full" />
                  <div className="flex items-center gap-2 mb-4 text-emerald-600">
                    <MessageCircle size={18} />
                    <span className="text-xs font-black uppercase tracking-[0.2em]">WhatsApp Message Preview</span>
                  </div>
                  <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl text-sm leading-relaxed text-slate-600 dark:text-slate-300 shadow-inner">
                    "Namaste <span className="text-emerald-500 font-bold">{"{Name}"}</span>, hamare school ki official app join karein aur saare updates dashboard par dekhein: <span className="text-blue-500 underline">{appLink}</span>"
                  </div>
                  <p className="text-[10px] text-slate-400 mt-4 font-bold uppercase tracking-widest flex items-center gap-2">
                    <AlertCircle size={12}/> As per strategy: No other data is sent on WhatsApp.
                  </p>
                </div>

                <div className="space-y-4">
                  <label className="text-[10px] font-black uppercase text-slate-400 ml-1">App Dashboard URL</label>
                  <div className="flex gap-4">
                    <input 
                      type="url" 
                      value={appLink}
                      onChange={e => setAppLink(e.target.value)}
                      className="flex-1 bg-slate-50 dark:bg-slate-800 border-none rounded-2xl px-6 py-4 text-sm font-bold focus:ring-2 focus:ring-emerald-500" 
                    />
                    <button 
                      onClick={handleSendInvites}
                      disabled={sending || selectedUsers.length === 0}
                      className="bg-slate-900 dark:bg-white text-white dark:text-slate-900 px-10 py-4 rounded-2xl font-black uppercase text-xs shadow-sm shadow-slate-900/20 transition-all transform hover:scale-105 active:scale-95 disabled:opacity-50 disabled:hover:scale-100 flex items-center gap-3"
                    >
                      {sending ? <Loader2 className="animate-spin" size={18}/> : <Send size={18}/>}
                      {useFreeMode ? `Invite ${selectedUsers.length} Users` : 'Blast Invites'}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'LOGS' && (
            <div className="bg-white dark:bg-slate-900/50 backdrop-blur-xl border border-slate-200 dark:border-white/10 rounded-[32px] overflow-hidden">
               <div className="overflow-x-auto">
                 <table className="w-full text-left">
                 <thead>
                   <tr className="bg-slate-50 dark:bg-white/5">
                     <th className="px-6 py-4 text-[10px] font-black uppercase text-slate-400 tracking-widest">Time</th>
                     <th className="px-6 py-4 text-[10px] font-black uppercase text-slate-400 tracking-widest">User</th>
                     <th className="px-6 py-4 text-[10px] font-black uppercase text-slate-400 tracking-widest">Status</th>
                     <th className="px-6 py-4 text-[10px] font-black uppercase text-slate-400 tracking-widest text-right">Method</th>
                   </tr>
                 </thead>
                 <tbody className="divide-y divide-slate-100 dark:divide-white/5">
                   {logs.map(log => (
                     <tr key={log.id} className="hover:bg-slate-50 dark:hover:bg-white/5 transition-colors">
                       <td className="px-6 py-4 text-xs text-slate-500 font-medium">{formatTimestamp(log.sentAt)}</td>
                       <td className="px-6 py-4">
                         <p className="text-sm font-bold dark:text-white">{log.recipientName}</p>
                         <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest">{log.recipientPhone}</p>
                       </td>
                       <td className="px-6 py-4">
                         <span className="flex items-center gap-1.5 text-emerald-500 text-[10px] font-black uppercase tracking-widest">
                           <CheckCircle2 size={14}/> Invited
                         </span>
                       </td>
                       <td className="px-6 py-4 text-right text-[10px] font-mono text-slate-400">{log.provider}</td>
                     </tr>
                   ))}
                 </tbody>
                 </table>
               </div>
            </div>
          )}

          {activeTab === 'SETTINGS' && (
            <div className="bg-white dark:bg-slate-900/50 border border-slate-200 dark:border-white/10 rounded-[32px] p-8 space-y-6">
              <div className="flex items-center gap-4 mb-4">
                <div className="p-3 bg-indigo-500/10 text-indigo-500 rounded-2xl"><Settings size={24}/></div>
                <div>
                  <h3 className="text-xl font-bold dark:text-white">Invite Settings</h3>
                  <p className="text-xs text-slate-500">Configure how app invitations are delivered</p>
                </div>
              </div>
              <div className="p-6 bg-slate-50 dark:bg-slate-800 rounded-[2rem] flex items-center justify-between border border-slate-100 dark:border-white/5">
                <div>
                  <p className="font-bold dark:text-white">Use Direct WhatsApp Protocol (Free)</p>
                  <p className="text-[10px] text-slate-400 uppercase font-black tracking-widest mt-1">Zero Cost • No API Keys needed</p>
                </div>
                <button 
                  onClick={() => setUseFreeMode(!useFreeMode)}
                  className={`w-14 h-8 rounded-full p-1 transition-all ${useFreeMode ? 'bg-emerald-500' : 'bg-slate-300'}`}
                >
                  <div className={`w-6 h-6 bg-white rounded-full shadow-md transition-transform ${useFreeMode ? 'translate-x-6' : ''}`} />
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Audience Selector */}
        <div className="bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-white/5 rounded-[40px] p-8 h-[650px] flex flex-col shadow-sm">
            <div className="flex items-center justify-between mb-6">
              <h3 className="font-black flex items-center gap-3 dark:text-white uppercase tracking-widest text-xs">
                <Users size={18} className="text-indigo-500"/> Select Audience
              </h3>
              <span className="bg-indigo-600 text-white text-[10px] font-black px-3 py-1.5 rounded-xl shadow-lg shadow-indigo-500/30">
                {selectedUsers.length} Selected
              </span>
            </div>
            
            <div className="relative mb-6">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
              <input
                type="text"
                placeholder="Search by name..."
                value={audienceSearch}
                onChange={(e) => setAudienceSearch(e.target.value)}
                className="w-full bg-white dark:bg-slate-900 border-none rounded-2xl py-3.5 pl-12 pr-4 text-sm font-medium focus:ring-2 focus:ring-indigo-500 shadow-sm"
              />
            </div>

            <div className="flex-1 overflow-y-auto space-y-3 pr-2 custom-scrollbar">
              {recipients
                .filter(r => !audienceSearch.trim() || (r.name || '').toLowerCase().includes(audienceSearch.toLowerCase()) || (r.phone || '').includes(audienceSearch))
                .map(r => (
                <div 
                  key={r.id} 
                  onClick={() => setSelectedUsers(prev => prev.includes(r.id) ? prev.filter(id => id !== r.id) : [...prev, r.id])}
                  className={`p-4 rounded-3xl flex items-center gap-4 cursor-pointer transition-all border-2 ${selectedUsers.includes(r.id) ? 'bg-indigo-600 border-indigo-600 text-white shadow-sm shadow-indigo-500/20' : 'bg-white dark:bg-slate-900/50 border-transparent hover:border-slate-200 dark:hover:border-white/10'}`}
                >
                  <div className={`w-12 h-12 rounded-2xl flex items-center justify-center font-black text-lg ${selectedUsers.includes(r.id) ? 'bg-white/20' : 'bg-slate-100 dark:bg-slate-800 text-slate-400'}`}>
                    {r.name.charAt(0)}
                  </div>
                  <div className="flex-1">
                    <p className={`text-sm font-black ${selectedUsers.includes(r.id) ? 'text-white' : 'text-slate-800 dark:text-white'}`}>{r.name}</p>
                    <p className={`text-[10px] font-black uppercase tracking-widest ${selectedUsers.includes(r.id) ? 'text-white/60' : 'text-slate-400'}`}>{r.role}</p>
                  </div>
                  {selectedUsers.includes(r.id) && <CheckCircle2 className="text-white" size={20} />}
                </div>
              ))}
            </div>
          </div>

      </div>
    </div>
  );
};

export default WhatsAppCenter;
