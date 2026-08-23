
import React, { useState, useEffect } from 'react';
import { 
  Bell, 
  BellOff, 
  CheckCircle2, 
  Clock, 
  DollarSign, 
  Calendar, 
  Megaphone, 
  Settings2,
  X,
  ChevronRight,
  CheckCheck
} from 'lucide-react';
import { db } from '@/services/firebase';
import { collection, onSnapshot, query, where, orderBy, writeBatch, doc } from 'firebase/firestore';
import { User } from '@/types';
import type { NotificationItem } from '@/types';
import { MOCK_NOTIFICATIONS } from '@/constants';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-hot-toast';

const IS_MOCK_MODE = import.meta.env.VITE_USE_MOCK === 'true' || import.meta.env.VITE_DEMO_MODE === 'true';

interface NotificationBellProps {
  user: User;
}

const NotificationBell: React.FC<NotificationBellProps> = ({ user }) => {
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [isSilent, setIsSilent] = useState(false);

  useEffect(() => {
    if (!user?.schoolId || !user?.id) return;

    if (IS_MOCK_MODE) {
      setNotifications(MOCK_NOTIFICATIONS.map(n => ({ ...n, isRead: n.isRead })));
      return;
    }

    // Real-time listener for internal notifications
    const notificationsRef = collection(db, 'schools', user.schoolId, 'users', user.id, 'notifications');
    const q = query(notificationsRef, orderBy('createdAt', 'desc'));

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const notifs = snapshot.docs.map((doc: any) => ({
        id: doc.id,
        ...doc.data()
      }));
      setNotifications(notifs);
      
      // Notify if new unread notification arrives (and not silent)
      const hasNew = snapshot.docChanges().some((change: any) => change.type === 'added' && !change.doc.data().isRead);
      if (hasNew && !isSilent && !isOpen) {
        // We could play a sound here if we wanted
      }
    });

    return () => unsubscribe();
  }, [user?.id, user?.schoolId, isSilent, isOpen]);

  const unreadCount = notifications.filter(n => !n.isRead).length;

  const markAllAsRead = async () => {
    if (unreadCount === 0 || !user?.schoolId) return;
    
    try {
      const batch = writeBatch(db);
      notifications.filter(n => !n.isRead).forEach(n => {
        const ref = doc(db, 'schools', user.schoolId, 'users', user.id, 'notifications', n.id);
        batch.update(ref, { isRead: true });
      });
      await batch.commit();
      toast.success("All caught up!");
    } catch (e) {
      toast.error("Failed to clear notifications");
    }
  };

  const handleNotificationClick = async (notif: any) => {
    // 1. Mark as read in Firestore
    if (!notif.isRead && user?.schoolId) {
      const ref = doc(db, 'schools', user.schoolId, 'users', user.id, 'notifications', notif.id);
      await writeBatch(db).update(ref, { isRead: true }).commit();
    }

    // 2. Navigate based on type
    setIsOpen(false);
    if (notif.link) {
      navigate(notif.link);
    } else {
      // Default routing fallback
      switch (notif.type) {
        case 'FEES': navigate('/parent/fees'); break;
        case 'ATTENDANCE': navigate(user.role === 'PARENT' ? '/student/academics' : '/teacher/attendance'); break;
        case 'NOTICE': navigate('/admin/announcements'); break;
        case 'HOMEWORK': navigate(user.role === 'PARENT' ? '/student/academics' : '/teacher/homework'); break;
        default: break;
      }
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'FEES': return <div className="p-2 bg-emerald-500/10 text-emerald-500 rounded-xl"><DollarSign size={16}/></div>;
      case 'ATTENDANCE': return <div className="p-2 bg-amber-500/10 text-amber-500 rounded-xl"><Calendar size={16}/></div>;
      case 'NOTICE': return <div className="p-2 bg-indigo-500/10 text-indigo-500 rounded-xl"><Megaphone size={16}/></div>;
      default: return <div className="p-2 bg-slate-500/10 text-slate-500 rounded-xl"><Bell size={16}/></div>;
    }
  };

  return (
    <div className="relative">
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-3 bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-100 dark:border-white/5 hover:scale-105 transition-all group"
      >
        {isSilent ? <BellOff size={20} className="text-slate-400" /> : <Bell size={20} className="text-slate-600 dark:text-slate-300 group-hover:rotate-12 transition-transform" />}
        {unreadCount > 0 && !isSilent && (
          <span className="absolute top-2 right-2 w-5 h-5 bg-rose-500 text-white text-[10px] font-black rounded-full flex items-center justify-center border-2 border-white dark:border-slate-800 animate-bounce">
            {unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <>
          <div className="fixed inset-0 z-[998]" onClick={() => setIsOpen(false)} />
          <div className="absolute right-0 mt-4 w-[380px] bg-white/80 dark:bg-slate-900/90 backdrop-blur-2xl rounded-[32px] shadow-2xl border border-white/20 z-[999] overflow-hidden animate-in fade-in slide-in-from-top-4 duration-300">
            <div className="p-6 border-b border-white/10 flex items-center justify-between">
              <div>
                <h3 className="text-lg font-black dark:text-white">Updates & Alerts</h3>
                <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mt-0.5">Your school heartbeat</p>
              </div>
              <div className="flex items-center gap-2">
                <button 
                  onClick={() => setIsSilent(!isSilent)}
                  className={`p-2 rounded-xl transition-all ${isSilent ? 'bg-rose-500/10 text-rose-500' : 'bg-slate-100 dark:bg-slate-800 text-slate-500'}`}
                  title="Silent mode"
                >
                  {isSilent ? <BellOff size={18} /> : <Settings2 size={18} />}
                </button>
                <button onClick={() => setIsOpen(false)} className="p-2 text-slate-400 hover:text-slate-600"><X size={18}/></button>
              </div>
            </div>

            <div className="max-h-[450px] overflow-y-auto p-4 space-y-3 custom-scrollbar">
              {notifications.length > 0 ? (
                notifications.map((notif) => (
                  <div 
                    key={notif.id}
                    onClick={() => handleNotificationClick(notif)}
                    className={`p-4 rounded-3xl transition-all border cursor-pointer ${notif.isRead ? 'bg-transparent border-transparent opacity-60' : 'bg-white dark:bg-slate-800/50 border-white/10 shadow-sm hover:border-indigo-500/30'}`}
                  >
                    <div className="flex gap-4">
                      {getTypeIcon(notif.type!)}
                      <div className="flex-1 min-w-0">
                        <div className="flex justify-between items-start">
                          <h4 className="text-sm font-black dark:text-white truncate">{notif.title}</h4>
                          <span className="text-[9px] font-bold text-slate-400 uppercase">
                             {notif.createdAt instanceof Date ? notif.createdAt.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}) : 'Now'}
                           </span>
                        </div>
                        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">{notif.message}</p>
                        <div className="mt-3 flex items-center justify-between">
                          <span className="text-[9px] font-black text-indigo-500 uppercase tracking-widest flex items-center gap-1">
                            View Details <ChevronRight size={10}/>
                          </span>
                          {!notif.isRead && <div className="w-1.5 h-1.5 bg-indigo-500 rounded-full" />}
                        </div>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="py-20 text-center space-y-4">
                  <div className="w-16 h-16 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center mx-auto"><Bell size={24} className="text-slate-300" /></div>
                  <p className="text-sm font-bold text-slate-400 tracking-tight">All caught up! No new updates.</p>
                </div>
              )}
            </div>

            <div className="p-4 bg-slate-50 dark:bg-white/5 border-t border-white/5 text-center">
              <button 
                onClick={markAllAsRead}
                disabled={unreadCount === 0}
                className="text-[10px] font-black text-indigo-600 dark:text-indigo-400 uppercase tracking-widest hover:underline disabled:opacity-30 flex items-center justify-center gap-2 mx-auto"
              >
                <CheckCheck size={14} /> Mark all as read
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default NotificationBell;
