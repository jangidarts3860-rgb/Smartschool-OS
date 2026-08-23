import {
    LayoutDashboard,
    Users,
    GraduationCap,
    School,
    CalendarCheck,
    IndianRupee,
    FileText,
    BookOpen,
    Bus,
    Megaphone,
    BookMarked,
    BarChart3,
    Settings,
    ChevronDown,
    Bell,
    TrendingUp,
    Brain,
    User,
    ClipboardList,
    Award,
    CalendarDays,
    Table,
    Library,
    MapPin,
    MessageSquare,
    Wallet,
    MoreHorizontal,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { UserRole } from '@/types';

export interface NavItem {
    id: string;
    label: string;
    icon: LucideIcon;
    path: string;
    badge?: number;
    children?: Omit<NavItem, 'icon' | 'children'>[];
}

export interface NavGroup {
    label: string;
    items: NavItem[];
}

export const adminNavGroups: NavGroup[] = [
    {
        label: 'MAIN',
        items: [
            { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, path: '/admin/dashboard' },
            { id: 'intelligence', label: 'Cerebro AI', icon: Brain, path: '/admin/intelligence' },
        ],
    },
    {
        label: 'PEOPLE',
        items: [
            { id: 'students', label: 'Students', icon: Users, path: '/admin/students' },
            { id: 'teachers', label: 'Teachers', icon: GraduationCap, path: '/admin/teachers' },
        ],
    },
    {
        label: 'ACADEMICS',
        items: [
            { id: 'classes', label: 'Classes', icon: School, path: '/admin/classes' },
            { id: 'attendance', label: 'Attendance', icon: CalendarCheck, path: '/admin/attendance' },
            { id: 'exams', label: 'Exams', icon: FileText, path: '/admin/exams' },
            { id: 'results', label: 'Marks Entry', icon: TrendingUp, path: '/admin/results' },
            { id: 'homework', label: 'Homework', icon: BookOpen, path: '/admin/homework' },
            { id: 'report-cards', label: 'Report Cards', icon: FileText, path: '/admin/report-cards' },
            { id: 'academic', label: 'Academic Setup', icon: BookMarked, path: '/admin/academic/setup',
              children: [
                  { id: 'academic-setup', label: 'Setup', path: '/admin/academic/setup' },
                  { id: 'subjects', label: 'Subjects', path: '/admin/academic/subjects' },
                  { id: 'timetable', label: 'Time Table', path: '/admin/academic/timetable' },
              ],
            },
        ],
    },
    {
        label: 'FINANCE',
        items: [
            { id: 'fees', label: 'Fees', icon: IndianRupee, path: '/admin/fees' },
            { id: 'reports', label: 'Reports', icon: BarChart3, path: '/admin/reports' },
        ],
    },
    {
        label: 'COMMUNICATION',
        items: [
            { id: 'announcements', label: 'Notices', icon: Megaphone, path: '/admin/announcements' },
            { id: 'notifications', label: 'Alert Center', icon: Bell, path: '/admin/notifications' },
            { id: 'whatsapp', label: 'WhatsApp', icon: MessageSquare, path: '/admin/whatsapp' },
        ],
    },
    {
        label: 'RESOURCES',
        items: [
            { id: 'library', label: 'Library', icon: BookOpen, path: '/admin/library' },
            { id: 'bus-tracking', label: 'Bus Tracking', icon: Bus, path: '/admin/bus-tracking' },
        ],
    },
    {
        label: 'CONFIG',
        items: [
            { id: 'settings', label: 'School Settings', icon: Settings, path: '/admin/settings' },
        ],
    },
];

// Flat list for backward compatibility (used in mobile nav)
export const adminNavItems: NavItem[] = adminNavGroups.flatMap(g => g.items);

export const adminMobileNavItems: NavItem[] = [
    { id: 'dashboard', label: 'Home', icon: LayoutDashboard, path: '/admin/dashboard' },
    { id: 'students', label: 'Students', icon: Users, path: '/admin/students' },
    { id: 'attendance', label: 'Attendance', icon: CalendarCheck, path: '/admin/attendance' },
    { id: 'fees', label: 'Fees', icon: IndianRupee, path: '/admin/fees' },
    { id: 'more', label: 'More', icon: MoreHorizontal, path: '/admin/settings' },
];

export const teacherNavItems: NavItem[] = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, path: '/teacher/dashboard' },
    { id: 'students', label: 'My Students', icon: Users, path: '/teacher/students' },
    { id: 'attendance', label: 'Attendance', icon: CalendarCheck, path: '/teacher/attendance' },
    { id: 'homework', label: 'Homework', icon: BookOpen, path: '/teacher/homework' },
    { id: 'library', label: 'Library', icon: Library, path: '/teacher/library' },
    { id: 'grades', label: 'Grades', icon: TrendingUp, path: '/teacher/grades' },
    { id: 'announcements', label: 'Notices', icon: Megaphone, path: '/teacher/announcements' },
    { id: 'settings', label: 'Settings', icon: Settings, path: '/teacher/settings' },
];

export const teacherMobileNavItems: NavItem[] = [
    { id: 'dashboard', label: 'Home', icon: LayoutDashboard, path: '/teacher/dashboard' },
    { id: 'students', label: 'Students', icon: Users, path: '/teacher/students' },
    { id: 'attendance', label: 'Attendance', icon: CalendarCheck, path: '/teacher/attendance' },
    { id: 'homework', label: 'Homework', icon: BookOpen, path: '/teacher/homework' },
    { id: 'more', label: 'More', icon: MoreHorizontal, path: '/teacher/settings' },
];

export const studentNavItems: NavItem[] = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, path: '/student/dashboard' },
    { id: 'academics', label: 'Academics', icon: BookOpen, path: '/student/academics' },
    { id: 'homework', label: 'Homework', icon: BookOpen, path: '/student/homework' },
    { id: 'notices', label: 'Notices', icon: Megaphone, path: '/student/notices' },
    { id: 'fees', label: 'Fees', icon: IndianRupee, path: '/student/fees' },
    { id: 'attendance', label: 'Attendance', icon: CalendarCheck, path: '/student/attendance' },
    { id: 'timetable', label: 'Timetable', icon: Table, path: '/student/timetable' },
    { id: 'library', label: 'Library', icon: Library, path: '/student/library' },
    { id: 'transport', label: 'Transport', icon: Bus, path: '/student/transport' },
];

export const studentMobileNavItems: NavItem[] = [
    { id: 'dashboard', label: 'Home', icon: LayoutDashboard, path: '/student/dashboard' },
    { id: 'academics', label: 'Academics', icon: BookOpen, path: '/student/academics' },
    { id: 'homework', label: 'Homework', icon: BookOpen, path: '/student/homework' },
    { id: 'fees', label: 'Fees', icon: IndianRupee, path: '/student/fees' },
    { id: 'more', label: 'More', icon: MoreHorizontal, path: '/student/attendance' },
];

export const parentNavItems: NavItem[] = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, path: '/parent/dashboard' },
    { id: 'homework', label: 'Homework', icon: BookOpen, path: '/parent/homework' },
    { id: 'fees', label: 'Fees', icon: IndianRupee, path: '/parent/fees' },
    { id: 'attendance', label: 'Attendance', icon: CalendarCheck, path: '/parent/attendance' },
    { id: 'results', label: 'Results', icon: Award, path: '/parent/results' },
    { id: 'library', label: 'Library', icon: Library, path: '/parent/library' },
    { id: 'transport', label: 'Transport', icon: Bus, path: '/parent/transport' },
    { id: 'notices', label: 'Notices', icon: Megaphone, path: '/parent/notices' },
    { id: 'settings', label: 'Settings', icon: Settings, path: '/parent/settings' },
];

export const parentMobileNavItems: NavItem[] = [
    { id: 'dashboard', label: 'Home', icon: LayoutDashboard, path: '/parent/dashboard' },
    { id: 'homework', label: 'Homework', icon: BookOpen, path: '/parent/homework' },
    { id: 'fees', label: 'Fees', icon: IndianRupee, path: '/parent/fees' },
    { id: 'attendance', label: 'Attendance', icon: CalendarCheck, path: '/parent/attendance' },
    { id: 'more', label: 'More', icon: MoreHorizontal, path: '/parent/results' },
];

export const getRoleBasePath = (role: UserRole): string => {
    switch (role) {
        case UserRole.ADMIN: return '/admin/dashboard';
        case UserRole.TEACHER: return '/teacher/dashboard';
        case UserRole.STUDENT: return '/student/dashboard';
        case UserRole.PARENT: return '/parent/dashboard';
        default: return '/';
    }
};
