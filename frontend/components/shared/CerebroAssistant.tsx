import React, { useState, useEffect, useRef } from 'react';
import {
  Brain, X, Send, Sparkles,
  ChevronRight, Maximize2, Minimize2, Trash2
} from 'lucide-react';
import { getAIResponse } from '@/services/geminiService';
import { User } from '@/types';
import { toast } from 'react-hot-toast';

const CHAT_HISTORY_VERSION = 'v2';
const CHAT_HISTORY_MAX_AGE_MS = 7 * 24 * 60 * 60 * 1000; // 7 days
const CHAT_HISTORY_MAX_MESSAGES = 50;

const SUGGESTED_ACTIONS = [
  "Analyze current page data",
  "Draft a school notice",
  "Identify struggling students",
  "Check fee collection trends"
];

interface Message {
  role: 'user' | 'bot';
  text: string;
  ts: number;
}

function getStorageKey(uid?: string): string {
  return `cerebro_chat_history_${CHAT_HISTORY_VERSION}_${uid || 'anon'}`;
}

function loadMessages(uid?: string): Message[] {
  try {
    const saved = localStorage.getItem(getStorageKey(uid));
    if (saved) {
      const parsed = JSON.parse(saved);
      if (Array.isArray(parsed)) {
        const cutoff = Date.now() - CHAT_HISTORY_MAX_AGE_MS;
        const recent = parsed.filter((m: Message) => m.ts && m.ts > cutoff);
        if (recent.length > 0) return recent.slice(-CHAT_HISTORY_MAX_MESSAGES);
      }
    }
  } catch {}
  return [{ role: 'bot' as const, text: 'Greetings, I am Cerebro. How can I assist you with institutional intelligence today?', ts: Date.now() }];
}

function saveMessages(messages: Message[], uid?: string) {
  try {
    const trimmed = messages.slice(-CHAT_HISTORY_MAX_MESSAGES);
    localStorage.setItem(getStorageKey(uid), JSON.stringify(trimmed));
  } catch {}
}

interface Props {
  user?: User;
}

const CerebroAssistant: React.FC<Props> = ({ user }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [query, setQuery] = useState('');
  const [messages, setMessages] = useState<Message[]>(() => loadMessages(user?.id));
  const [isTyping, setIsTyping] = useState(false);
  const [apiStatus, setApiStatus] = useState<'unknown' | 'online' | 'offline' | 'degraded'>('unknown');
  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (user?.id) {
      setMessages(loadMessages(user.id));
    }
  }, [user?.id]);

  useEffect(() => { saveMessages(messages, user?.id); }, [messages, user?.id]);

  const scrollToBottom = () => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Probe API health when assistant opens
  useEffect(() => {
    if (!isOpen || apiStatus !== 'unknown') return;
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch('/api/cerebro-ask', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ query: 'ping', schoolId: 'healthcheck' }),
        });
        if (cancelled) return;
        if (res.status === 401) setApiStatus('online'); // Auth required but endpoint exists
        else if (res.ok || res.status === 400 || res.status === 429) setApiStatus('online');
        else setApiStatus('offline');
      } catch {
        if (!cancelled) setApiStatus('offline');
      }
    })();
    return () => { cancelled = true; };
  }, [isOpen, apiStatus]);

  const handleSend = async () => {
    if (!query.trim() || isTyping) return;

    const sanitized = query.trim().slice(0, 2000);
    const userMsg: Message = { role: 'user', text: sanitized, ts: Date.now() };
    setMessages(prev => [...prev, userMsg]);
    setQuery('');
    setIsTyping(true);

    try {
      const responseText = await getAIResponse(sanitized, {
        user,
        schoolName: user?.schoolName || 'SmartSchool',
        schoolConfig: user?.schoolConfig || { aiFallback: true }
      });

      const botMsg: Message = { role: 'bot', text: responseText, ts: Date.now() };
      setMessages(prev => [...prev, botMsg]);
      setApiStatus('online');
    } catch (error: any) {
      const errMsg = error?.message || '';
      if (errMsg.toLowerCase().includes('unavailable') || errMsg.toLowerCase().includes('exhausted')) {
        setApiStatus('degraded');
      } else if (errMsg.toLowerCase().includes('rate limit')) {
        setApiStatus('online');
      } else {
        setApiStatus('offline');
      }
      toast.error(errMsg || "Failed to connect to Neural Engine");
      setMessages(prev => [...prev, {
        role: 'bot',
        text: "I encountered an error while processing your request. Please try again in a moment.",
        ts: Date.now()
      }]);
    } finally {
      setIsTyping(false);
    }
  };

  const clearHistory = () => {
    const initial: Message[] = [{ role: 'bot' as const, text: 'Greetings, I am Cerebro. How can I assist you with institutional intelligence today?', ts: Date.now() }];
    setMessages(initial);
    saveMessages(initial, user?.id);
    toast.success('Chat history cleared');
  };

  const statusInfo = {
    online: { label: 'Online', color: 'text-emerald-400', dot: 'bg-emerald-400' },
    degraded: { label: 'Degraded', color: 'text-amber-400', dot: 'bg-amber-400' },
    offline: { label: 'Offline', color: 'text-rose-400', dot: 'bg-rose-400' },
    unknown: { label: 'Connecting...', color: 'text-slate-400', dot: 'bg-slate-400' },
  }[apiStatus];

  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-24 right-4 lg:bottom-8 lg:right-8 z-40 group"
        aria-label="Open Cerebro AI assistant"
      >
        <div className="absolute inset-0 bg-indigo-600 rounded-full animate-ping opacity-20 scale-150"></div>
        <div className="relative w-14 h-14 sm:w-16 sm:h-16 bg-slate-900 text-white rounded-full flex items-center justify-center shadow-2xl border-2 border-indigo-500/30 hover:scale-110 active:scale-95 transition-all">
           <Brain size={24} className="group-hover:rotate-12 transition-transform" />
           <div className={`absolute -top-1 -right-1 w-4 h-4 ${statusInfo.dot} rounded-full border-2 border-white ${apiStatus === 'online' ? 'animate-pulse' : ''}`}></div>
        </div>
      </button>
    );
  }

  return (
    <div className={`fixed bottom-24 right-4 left-4 sm:left-auto lg:bottom-8 lg:right-8 z-50 bg-white dark:bg-slate-950 rounded-[2rem] border border-slate-200 dark:border-slate-800 shadow-2xl flex flex-col transition-all duration-500 ${isMinimized ? 'w-72 h-16' : 'w-auto sm:w-[400px] max-w-[calc(100vw-2rem)] h-[70vh] sm:h-[600px]'} animate-in slide-in-from-bottom-10`} role="dialog" aria-label="Cerebro AI assistant">

      {/* Header */}
      <div className="p-5 flex justify-between items-center border-b border-slate-100 dark:border-slate-900 bg-slate-900 text-white rounded-t-[2rem]">
         <div className="flex items-center gap-3">
            <div className="p-2 bg-indigo-500/20 rounded-lg text-indigo-400">
               <Brain size={18} />
            </div>
            <div>
               <h4 className="text-sm font-black leading-none">Cerebro AI</h4>
               <p className={`text-[9px] font-black uppercase tracking-widest mt-1 flex items-center gap-1 ${statusInfo.color}`} data-testid="cerebro-status">
                  <div className={`w-1.5 h-1.5 ${statusInfo.dot} rounded-full ${apiStatus === 'online' ? 'animate-pulse' : ''}`}></div> {statusInfo.label}
               </p>
            </div>
         </div>
         <div className="flex items-center gap-2">
            <button
              onClick={clearHistory}
              className="p-2 hover:bg-white/10 rounded-lg text-slate-400 transition-all"
              title="Clear history"
              aria-label="Clear chat history"
            >
               <Trash2 size={16} />
            </button>
            <button
              onClick={() => setIsMinimized(!isMinimized)}
              className="p-2 hover:bg-white/10 rounded-lg text-slate-400 transition-all"
              aria-label={isMinimized ? 'Maximize' : 'Minimize'}
            >
               {isMinimized ? <Maximize2 size={16} /> : <Minimize2 size={16} />}
            </button>
            <button
              onClick={() => setIsOpen(false)}
              className="p-2 hover:bg-white/10 rounded-lg text-slate-400 transition-all"
              aria-label="Close Cerebro"
            >
               <X size={16} />
            </button>
         </div>
      </div>

      {!isMinimized && (
        <>
          <div className="flex-1 overflow-y-auto p-6 space-y-6 no-scrollbar" role="log" aria-live="polite">
             {messages.map((msg, i) => (
               <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-[80%] p-4 rounded-[1.5rem] text-xs font-medium leading-relaxed ${msg.role === 'user' ? 'bg-indigo-600 text-white rounded-tr-none' : 'bg-slate-100 dark:bg-slate-900 text-slate-800 dark:text-slate-200 rounded-tl-none border border-slate-200 dark:border-slate-800'}`}>
                     {msg.text}
                  </div>
               </div>
             ))}
             {isTyping && (
               <div className="flex justify-start">
                  <div className="bg-slate-50 dark:bg-slate-900 p-4 rounded-[1.5rem] rounded-tl-none border border-slate-100 dark:border-slate-800 flex gap-1" aria-label="Cerebro is typing">
                     <span className="w-1.5 h-1.5 bg-slate-300 rounded-full animate-bounce [animation-delay:-0.3s]"></span>
                     <span className="w-1.5 h-1.5 bg-slate-300 rounded-full animate-bounce [animation-delay:-0.15s]"></span>
                     <span className="w-1.5 h-1.5 bg-slate-300 rounded-full animate-bounce"></span>
                  </div>
               </div>
             )}
             <div ref={chatEndRef} />
          </div>

          <div className="px-6 py-2 overflow-x-auto no-scrollbar flex gap-2">
             {SUGGESTED_ACTIONS.map((action, i) => (
               <button
                 key={i}
                 onClick={() => setQuery(action)}
                 className="whitespace-nowrap px-4 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-full text-[10px] font-black uppercase tracking-widest text-slate-500 dark:text-slate-400 hover:border-indigo-500 transition-all"
               >
                  {action}
               </button>
             ))}
          </div>

          <div className="p-6">
             <div className="relative group">
                <input
                  type="text"
                  value={query}
                  onChange={(e) => setQuery(e.target.value.slice(0, 2000))}
                  onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                  placeholder="Ask Cerebro anything..."
                  maxLength={2000}
                  className="w-full bg-slate-50 dark:bg-slate-900 border-2 border-slate-100 dark:border-slate-800 rounded-2xl py-4 pl-4 pr-16 text-xs font-bold outline-none focus:border-indigo-500 transition-all dark:text-white"
                  aria-label="Ask Cerebro"
                />
                <button
                  onClick={handleSend}
                  disabled={isTyping}
                  className="absolute right-2 top-2 p-3 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-500/20 disabled:opacity-50"
                  aria-label="Send message"
                >
                   <Send size={16} />
                </button>
             </div>
             <p className="text-[9px] font-black text-slate-400 text-center mt-4 uppercase tracking-[0.2em] flex items-center justify-center gap-2">
                <Sparkles size={10} className="text-amber-500" /> Powered by Gemini • Cerebro Engine
             </p>
          </div>
        </>
      )}
    </div>
  );
};

export default CerebroAssistant;
