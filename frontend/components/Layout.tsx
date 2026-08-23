import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate, Link } from 'react-router-dom';
import {
  Bell,
  LogOut,
  Menu,
  X,
  ChevronDown,
  ChevronRight,
  Loader2,
  Wifi,
  WifiOff,
  Download,
  CloudOff,
  CheckCircle2,
  Info,
  MoreHorizontal,
  Settings,
  Table,
  Library,
  Bus,
  Megaphone,
  Sparkles,
} from 'lucide-react';
import { User, UserRole } from '@/types';
import { adminNavGroups, adminNavItems, adminMobileNavItems, teacherNavItems, teacherMobileNavItems, studentNavItems, studentMobileNavItems, parentNavItems, parentMobileNavItems, NavItem, NavGroup } from '@/config/navItems';
import NotificationBell from './shared/NotificationBell';
import { useInstallPrompt } from '@/hooks/useInstallPrompt';
import { toast } from 'react-hot-toast';
import Avatar from './shared/Avatar';

interface LayoutProps {
  user: User;
  onLogout: () => void;
  isDarkMode: boolean;
  toggleTheme: () => void;
  children: React.ReactNode;
}

const Layout: React.FC<LayoutProps> = ({
  user,
  onLogout,
  isDarkMode,
  toggleTheme,
  children,
}) => {
  const location = useLocation();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [profileMenuOpen, setProfileMenuOpen] = useState(false);
  const [expandedMenus, setExpandedMenus] = useState<Record<string, boolean>>({});
  const [expandedGroups, setExpandedGroups] = useState<Record<string, boolean>>(() => {
    try {
      const saved = localStorage.getItem('ss_sidebar_groups');
      return saved ? JSON.parse(saved) : {};
    } catch { return {}; }
  });
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [showIosTip, setShowIosTip] = useState(false);
  const [showMoreDrawer, setShowMoreDrawer] = useState(false);

  const { isInstallable, isStandalone, handleInstallClick } = useInstallPrompt();

  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      toast.success('Back Online - Syncing changes...', { icon: '✅' });
    };
    const handleOffline = () => {
      setIsOnline(false);
      toast.error('Offline Mode - Data locally saved', { icon: '⚠️' });
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    const isIos = /iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as any).MSStream;
    if (isIos && !isStandalone) {
       setShowIosTip(true);
    }

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [isStandalone]);

  // Close more drawer on route change
  useEffect(() => {
    setShowMoreDrawer(false);
  }, [location.pathname]);

  const currentPath = location.pathname;

  const getPageTitle = (path: string): string => {
    const titleMap: Record<string, string> = {
      'dashboard': 'Dashboard',
      'intelligence': 'Cerebro AI',
      'students': 'Students',
      'teachers': 'Teachers',
      'classes': 'Classes',
      'attendance': 'Attendance',
      'fees': 'Fee Management',
      'exams': 'Exam Management',
      'results': 'Marks Entry',
      'homework': 'Homework',
      'library': 'Library',
      'bus-tracking': 'Bus Tracking',
      'announcements': 'Notice Board',
      'report-cards': 'Report Cards',
      'whatsapp': 'WhatsApp Center',
      'notifications': 'Alert Center',
      'reports': 'Reports & Analytics',
      'settings': 'Settings',
      'academic': 'Academic Setup',
      'subjects': 'Subject Management',
      'timetable': 'Timetable Management',
      'student-profile': 'Student Profile',
      'teacher-profile': 'Teacher Profile',
      'academics': 'Academics',
      'grades': 'Grades',
      'parent': 'Parent Portal',
    };
    const segment = path.split('/').pop() || '';
    return titleMap[segment] || segment.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase()) || 'Dashboard';
  };

  const toggleSubmenu = (id: string) => {
    setExpandedMenus((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const toggleGroup = (label: string) => {
    setExpandedGroups((prev) => {
      const next = { ...prev, [label]: !prev[label] };
      localStorage.setItem('ss_sidebar_groups', JSON.stringify(next));
      return next;
    });
  };

  const isActive = (path: string): boolean => {
    if (currentPath === path) return true;
    return currentPath.startsWith(path) && path.length > 1 && path.split('/').length >= 3;
  };

  const renderNavItem = (item: NavItem, isMobile = false) => {
    const active = isActive(item.path);
    const hasChildren = item.children && item.children.length > 0;
    const isExpanded = expandedMenus[item.id];

    if (isMobile) {
      return (
        <button
          key={item.id}
          onClick={() => {
            navigate(item.path);
            setSidebarOpen(false);
          }}
          className={`flex flex-col items-center gap-1 p-2 rounded-xl transition-all ${active ? 'text-indigo-400' : 'text-gray-400 hover:text-gray-200'
            }`}
        >
          <item.icon className="w-5 h-5" />
          <span className="text-[10px] font-medium">{item.label}</span>
        </button>
      );
    }

    return (
      <div key={item.id}>
        <Link
          to={hasChildren ? '#' : item.path}
          aria-current={active ? 'page' : undefined}
          aria-expanded={hasChildren ? isExpanded : undefined}
          aria-label={item.label}
          onClick={(e) => {
            if (hasChildren) {
              e.preventDefault();
              toggleSubmenu(item.id);
            } else {
              setSidebarOpen(false);
            }
          }}
          className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all group focus-ring ${active
            ? 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/30'
            : 'text-gray-400 hover:bg-white/5 hover:text-gray-200'
            }`}
        >
          <item.icon className={`w-5 h-5 ${active ? 'text-indigo-400' : 'group-hover:text-gray-200'}`} aria-hidden="true" />
          <span className="flex-1 text-sm font-medium">{item.label}</span>
          {item.badge ? (
            <span className="bg-red-500/20 text-red-300 text-xs px-2 py-0.5 rounded-full" aria-label={`${item.badge} notifications`}>
              {item.badge}
            </span>
          ) : null}
          {hasChildren ? (
            <span className="sr-only">{isExpanded ? 'Collapse' : 'Expand'} menu</span>
          ) : null}
          {hasChildren ? (
            isExpanded ? <ChevronDown className="w-4 h-4" aria-hidden="true" /> : <ChevronRight className="w-4 h-4" aria-hidden="true" />
          ) : null}
        </Link>

         {hasChildren && isExpanded && (
           <div className="ml-4 mt-1 space-y-1 border-l border-white/10 pl-4">
             {item.children?.map((child) => {
               const childActive = currentPath === child.path;
               return (
                 <Link
                   key={child.id}
                   to={child.path}
                   onClick={() => setSidebarOpen(false)}
                   className={`block px-3 py-2 rounded-lg text-sm transition-all ${childActive
                     ? 'text-indigo-300 bg-indigo-500/10'
                     : 'text-gray-500 hover:text-gray-300 hover:bg-white/5'
                     }`}
                 >
                   {child.label}
                 </Link>
               );
             })}
           </div>
         )}
      </div>
    );
  };

  const renderGroupedSidebar = () => {
    return (
      <nav className="flex-1 px-4 space-y-4 overflow-y-auto no-scrollbar">
        {adminNavGroups.map((group) => {
          const isGroupExpanded = expandedGroups[group.label] !== false; // default expanded
          return (
            <div key={group.label}>
              <button
                onClick={() => toggleGroup(group.label)}
                className="flex items-center justify-between w-full px-4 py-1.5 text-[9px] font-black text-zinc-500 uppercase tracking-[0.2em] hover:text-zinc-300 transition-colors"
              >
                {group.label}
                {isGroupExpanded ? <ChevronDown size={10} /> : <ChevronRight size={10} />}
              </button>
              {isGroupExpanded && (
                <div className="space-y-0.5 mt-1">
                  {group.items.map((item) => renderNavItem(item))}
                </div>
              )}
            </div>
          );
        })}
      </nav>
    );
  };

  // More drawer items for admin/teacher/student/parent mobile
  const getMoreDrawerItems = (): NavItem[] => {
    if (user.role === UserRole.ADMIN || user.role === UserRole.SUPER_ADMIN) {
      return adminNavItems.filter(item => !['dashboard', 'students', 'attendance', 'fees', 'more'].includes(item.id));
    }
    if (user.role === UserRole.TEACHER) {
      return teacherNavItems.slice(4); // library, grades, announcements, settings
    }
    if (user.role === UserRole.STUDENT) {
      return studentNavItems.slice(4); // timetable, library, transport, notices
    }
    if (user.role === UserRole.PARENT) {
      return parentNavItems.slice(4); // results, library, transport, notices, settings
    }
    return [];
  };

  return (
    <div className="min-h-screen bg-gray-950 text-white">
      {/* Network Banner */}
      {!isOnline && (
        <div className="fixed top-0 left-0 right-0 z-[100] bg-rose-500 text-white px-4 py-1.5 flex items-center justify-center gap-3 shadow-lg animate-in slide-in-from-top duration-300">
           <WifiOff size={14} className="animate-pulse" />
           <span className="text-[10px] font-black uppercase tracking-widest">Offline Mode — Data is being cached locally</span>
        </div>
      )}

      {/* Desktop Sidebar */}
      <aside className="hidden lg:flex fixed left-0 top-0 h-full w-64 flex-col bg-black/50 backdrop-blur-3xl border-r border-white/5 z-40">
        <div className="p-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-600 to-purple-700 flex items-center justify-center border border-indigo-500/30 p-1.5 shadow-lg shadow-indigo-500/20">
              <img src={user.schoolConfig?.logoUrl || "/logo.png"} alt={`${user.schoolName || 'SmartSchool'} Logo`} className="w-full h-full object-contain filter drop-shadow-sm" />
            </div>
            <div>
              <h1 className="font-black text-base tracking-tight truncate max-w-[140px] text-white">{user.schoolName || 'SmartSchool'}</h1>
              <div className="flex items-center gap-1.5 mt-0.5">
                <span className="dot-pulse w-1.5 h-1.5" aria-hidden="true" />
                <p className="text-[9px] font-black text-emerald-500 uppercase tracking-widest">Live</p>
              </div>
            </div>
          </div>
        </div>

        {user.role === UserRole.ADMIN
          ? renderGroupedSidebar()
          : (
            <nav className="flex-1 px-4 space-y-1 overflow-y-auto no-scrollbar">
              {user.role === UserRole.TEACHER
                ? teacherNavItems.map((item) => renderNavItem(item))
                : user.role === UserRole.STUDENT
                ? studentNavItems.map((item) => renderNavItem(item))
                : parentNavItems.map((item) => renderNavItem(item))
              }
            </nav>
          )
        }

        {/* Quick Role & Status Card for Non-Admin sidebars */}
        {user.role !== UserRole.ADMIN && (
          <div className="mx-4 mb-2 p-3.5 rounded-2xl bg-gradient-to-br from-indigo-950/60 via-slate-900/60 to-black/80 border border-white/10 shadow-lg relative overflow-hidden shrink-0">
             <div className="absolute top-0 right-0 w-24 h-24 bg-indigo-500/10 rounded-full blur-xl pointer-events-none" />
             <div className="flex items-center gap-3 mb-1.5">
                <div className="w-7 h-7 rounded-xl bg-indigo-500/20 flex items-center justify-center text-indigo-400 border border-indigo-500/30 shrink-0">
                   <Sparkles size={14} />
                </div>
                <div className="min-w-0">
                   <p className="text-xs font-black text-white leading-tight truncate">
                     {user.role === UserRole.TEACHER ? 'Faculty Portal' : user.role === UserRole.STUDENT ? 'Student Hub' : 'Parent Care'}
                   </p>
                   <p className="text-[8px] font-bold text-emerald-400 uppercase tracking-widest flex items-center gap-1 mt-0.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse shrink-0" /> Live Connected
                   </p>
                </div>
             </div>
             <p className="text-[9px] text-slate-400 leading-snug">
                {user.role === UserRole.TEACHER && 'Academic session 2026-27 is active.'}
                {user.role === UserRole.STUDENT && 'Class materials & timetable synced.'}
                {user.role === UserRole.PARENT && 'Real-time school updates & tracking.'}
             </p>
          </div>
        )}

        <div className="p-4 space-y-2 border-t border-white/5 shrink-0">
          {/* User Profile Pill */}
          <div className="flex items-center gap-2.5 p-2 rounded-xl bg-white/5 border border-white/5 mb-2">
             <Avatar src={user.avatar} name={user.name} role={user.role} size="sm" className="w-8 h-8 rounded-full border border-indigo-500/30 shrink-0" />
             <div className="min-w-0 flex-1">
                <p className="text-xs font-bold text-white truncate leading-tight">{user.name}</p>
                <p className="text-[8px] font-black text-indigo-400 uppercase tracking-wider">{user.role}</p>
             </div>
          </div>

          {isInstallable && (
            <button
              onClick={handleInstallClick}
              className="flex items-center gap-3 px-4 py-3 rounded-xl bg-indigo-600 text-white hover:bg-indigo-700 transition-all w-full shadow-lg shadow-indigo-500/20"
            >
              <Download className="w-5 h-5" />
              <span className="text-sm font-bold">Install App</span>
            </button>
          )}

          {showIosTip && (
            <div className="p-4 bg-white/5 rounded-xl border border-white/10 space-y-2">
               <div className="flex items-center gap-2 text-indigo-400">
                  <Info size={14} />
                  <span className="text-[9px] font-black uppercase tracking-widest">iOS Tip</span>
               </div>
               <p className="text-[10px] text-gray-400 leading-relaxed">Tap <span className="text-white">Share</span> then <span className="text-white">"Add to Home Screen"</span> for full experience.</p>
            </div>
          )}

          <button
            onClick={onLogout}
            aria-label="Logout from account"
            className="flex items-center gap-3 px-4 py-3 rounded-xl text-gray-400 hover:bg-red-500/10 hover:text-red-400 transition-all w-full hover:translate-x-1"
          >
            <LogOut className="w-5 h-5" />
            <span className="text-sm font-medium">Logout</span>
          </button>
        </div>
      </aside>

      {/* Mobile Sidebar Overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Mobile Sidebar */}
      <aside
        className={`fixed left-0 top-0 h-full w-64 flex-col bg-black/80 backdrop-blur-3xl border-r border-white/5 z-50 lg:hidden transition-transform ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'
          }`}
      >
        <div className="p-6 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-indigo-500/20 flex items-center justify-center border border-indigo-500/30 p-1">
              <img src={user.schoolConfig?.logoUrl || "/logo.png"} alt={`${user.schoolName || 'SmartSchool'} Logo`} className="w-full h-full object-contain" />
            </div>
            <span className="font-bold text-lg truncate max-w-[140px]">{user.schoolName || 'SmartSchool'}</span>
          </div>
          <button onClick={() => setSidebarOpen(false)} className="text-gray-400">
            <X className="w-6 h-6" />
          </button>
        </div>
        <nav className="flex-1 px-4 space-y-1 overflow-y-auto">
          {user.role === UserRole.ADMIN
            ? adminNavGroups.flatMap(g => g.items).map((item) => renderNavItem(item))
            : user.role === UserRole.TEACHER
            ? teacherNavItems.map((item) => renderNavItem(item))
            : user.role === UserRole.STUDENT
            ? studentNavItems.map((item) => renderNavItem(item))
            : parentNavItems.map((item) => renderNavItem(item))
          }
        </nav>
      </aside>

      {/* Main Content Area */}
      <div className="lg:ml-64 min-h-screen flex flex-col">
        {/* Header */}
        <header className="sticky top-0 z-30 bg-black/20 backdrop-blur-3xl border-b border-white/5 px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button
                onClick={() => setSidebarOpen(true)}
                className="lg:hidden p-2 rounded-xl bg-white/5 text-gray-300 hover:bg-white/10 transition-all hover:scale-105"
                aria-label="Open navigation menu"
              >
                <Menu className="w-5 h-5" aria-hidden="true" />
              </button>
              <div>
                <h2 className="text-base font-black capitalize tracking-tight text-white" aria-live="polite">
                  {getPageTitle(currentPath)}
                </h2>
                <p className="text-[10px] text-gray-500 font-medium">Welcome back, <span className="text-indigo-400">{user.name}</span></p>
              </div>
            </div>

            <div className="flex items-center gap-4">
              <NotificationBell user={user} />

              <div className="relative">
                <button
                  onClick={() => setProfileMenuOpen(!profileMenuOpen)}
                  className="flex items-center gap-2 p-1 md:p-1.5 rounded-full md:rounded-2xl bg-white/5 hover:bg-white/10 transition-all hover:scale-105 border border-white/5 shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
                  aria-label="Open profile menu"
                  aria-expanded={profileMenuOpen}
                >
                  <Avatar src={user.avatar} name={user.name} role={user.role} className="w-9 h-9 md:w-10 md:h-10 rounded-full border-2 border-indigo-500/30 shadow-[0_0_15px_rgba(99,102,241,0.2)]" />
                  <ChevronDown className={`w-4 h-4 text-gray-400 hidden sm:block transition-transform duration-200 mr-1 ${profileMenuOpen ? 'rotate-180' : ''}`} aria-hidden="true" />
                </button>

                {profileMenuOpen && (
                  <div className="absolute right-0 mt-2 w-48 bg-black/80 backdrop-blur-3xl border border-white/10 rounded-2xl shadow-2xl py-2">
                    <div className="px-4 py-2 border-b border-white/5">
                      <p className="text-sm font-medium">{user.name}</p>
                      <p className="text-xs text-gray-500 capitalize">{user.role.toLowerCase()}</p>
                    </div>
                    <button
                      onClick={() => {
                        setProfileMenuOpen(false);
                        const rolePath = user.role === UserRole.TEACHER ? '/teacher' : user.role === UserRole.STUDENT ? '/student' : user.role === UserRole.PARENT ? '/parent' : '/admin';
                        navigate(`${rolePath}/settings`);
                      }}
                      className="w-full text-left px-4 py-2 text-sm text-gray-300 hover:bg-white/5 transition-all"
                    >
                      Settings
                    </button>
                    <button
                      onClick={() => {
                        setProfileMenuOpen(false);
                        onLogout();
                      }}
                      className="w-full text-left px-4 py-2 text-sm text-red-400 hover:bg-red-500/10 transition-all"
                    >
                      Logout
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 p-4 sm:p-6">
          <React.Suspense
            fallback={
              <div className="flex items-center justify-center h-64">
                <Loader2 className="w-8 h-8 text-indigo-400 animate-spin" />
              </div>
            }
          >
            {children}
          </React.Suspense>
        </main>
      </div>

      {/* Mobile Bottom Nav */}
      <div className="lg:hidden fixed bottom-0 left-0 right-0 z-40 pointer-events-none flex flex-col justify-end pb-[env(safe-area-inset-bottom)]">
        <nav className="pointer-events-auto mx-4 mb-4 bg-black/80 backdrop-blur-2xl border border-white/10 rounded-[2rem] shadow-2xl p-1.5 flex items-center justify-around relative">
          {/* We map over the items based on user role */}
          {(user.role === UserRole.ADMIN ? adminMobileNavItems :
            user.role === UserRole.TEACHER ? teacherMobileNavItems :
            user.role === UserRole.STUDENT ? studentMobileNavItems :
            parentMobileNavItems).map((item) => {
              const isMore = item.id === 'more';
              const anyMoreActive = isMore ? getMoreDrawerItems().some(i => isActive(i.path)) : false;
              const active = isMore ? (showMoreDrawer || anyMoreActive) : isActive(item.path);

              return (
                <button
                  key={item.id}
                  onClick={() => {
                    if (isMore) {
                      setShowMoreDrawer(v => !v);
                    } else {
                      navigate(item.path);
                      setSidebarOpen(false);
                    }
                  }}
                  aria-label={item.label}
                  aria-current={active && !isMore ? 'page' : undefined}
                  className="group relative flex flex-col items-center justify-center min-h-[48px] min-w-[64px] rounded-3xl transition-all duration-300 ease-spring active:scale-90"
                >
                  {/* Active Indicator Background */}
                  {active && (
                    <span className="absolute inset-0 bg-indigo-500/10 border border-indigo-500/20 rounded-3xl -z-10 animate-in zoom-in duration-300" />
                  )}
                  
                  {/* Icon */}
                  <div className={`relative mb-1 transition-all duration-300 ${active ? 'text-indigo-400 translate-y-0.5' : 'text-slate-400 group-hover:text-slate-200'}`}>
                    <item.icon 
                      className={`w-5 h-5 transition-all duration-300 ${active ? 'stroke-[2.5px] drop-shadow-[0_0_8px_rgba(129,140,248,0.5)]' : 'stroke-2'}`} 
                      aria-hidden="true" 
                    />
                  </div>
                  
                  {/* Label */}
                  <span className={`text-[9px] font-bold tracking-wide transition-all duration-300 ${active ? 'text-indigo-300 opacity-100' : 'text-slate-500 opacity-0 h-0 overflow-hidden'}`}>
                    {item.label}
                  </span>
                </button>
              );
          })}
        </nav>
      </div>

      {/* Mobile More Drawer */}
      {showMoreDrawer && (
        <>
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 lg:hidden transition-opacity" onClick={() => setShowMoreDrawer(false)} />
          <div className="fixed bottom-0 left-0 right-0 bg-gray-950/95 backdrop-blur-3xl border-t border-white/10 z-50 lg:hidden rounded-t-[2.5rem] animate-in slide-in-from-bottom duration-300 pb-[env(safe-area-inset-bottom)]">
            {/* Drag handle */}
            <div className="flex justify-center pt-4 pb-2">
              <div className="w-12 h-1.5 bg-white/20 rounded-full" />
            </div>
            <div className="px-6 pb-2 pt-2 flex items-center justify-between">
              <h3 className="text-sm font-black text-white uppercase tracking-widest">More Options</h3>
              <button onClick={() => setShowMoreDrawer(false)} className="w-8 h-8 flex items-center justify-center text-gray-400 hover:text-white bg-white/5 rounded-full transition-all active:scale-95">
                <X size={16} />
              </button>
            </div>
            <div className="grid grid-cols-4 gap-3 px-4 pb-8 pt-4">
              {getMoreDrawerItems().map((item) => {
                const active = isActive(item.path);
                return (
                  <button
                    key={item.id}
                    onClick={() => {
                      navigate(item.path);
                      setShowMoreDrawer(false);
                    }}
                    aria-label={item.label}
                    aria-current={active ? 'page' : undefined}
                    className={`flex flex-col items-center gap-2 p-4 rounded-[1.5rem] transition-all duration-300 active:scale-95 ${
                      active
                        ? 'bg-indigo-500/20 text-indigo-400 border border-indigo-500/30 shadow-[0_0_15px_rgba(99,102,241,0.15)]'
                        : 'text-slate-400 hover:bg-white/5 hover:text-slate-200 bg-white/[0.03] border border-white/5'
                    }`}
                  >
                    <item.icon className={`w-6 h-6 ${active ? 'stroke-[2.5px]' : 'stroke-2'}`} aria-hidden="true" />
                    <span className="text-[10px] font-bold uppercase tracking-wider text-center leading-tight">{item.label}</span>
                  </button>
                );
              })}
            </div>
          </div>
        </>
      )}

      {/* Mobile bottom padding spacer - Increased to account for floating navbar + safe area */}
      <div className="lg:hidden h-28 w-full" />
    </div>
  );
};

export default Layout;
