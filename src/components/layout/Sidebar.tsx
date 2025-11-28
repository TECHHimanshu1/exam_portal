
import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { 
  Home, 
  Users, 
  BookOpen, 
  FileText, 
  BarChart, 
  Settings,
  User,
  BookCopy,
  PenTool,
  GraduationCap,
  Clock,
  Award
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { UserRole } from '@/types';

type NavItem = {
  title: string;
  href: string;
  icon: React.ReactNode;
};

const navItems: Record<UserRole, NavItem[]> = {
  admin: [
    { title: 'Dashboard', href: '/admin/dashboard', icon: <Home size={18} /> },
    { title: 'User Management', href: '/admin/users', icon: <Users size={18} /> },
    { title: 'Exams', href: '/admin/exams', icon: <FileText size={18} /> },
    { title: 'Reports', href: '/admin/reports', icon: <BarChart size={18} /> },
    { title: 'Settings', href: '/admin/settings', icon: <Settings size={18} /> },
  ],
  teacher: [
    { title: 'Dashboard', href: '/teacher/dashboard', icon: <Home size={18} /> },
    { title: 'Question Bank', href: '/teacher/questions', icon: <BookOpen size={18} /> },
    { title: 'Exams', href: '/teacher/exams', icon: <FileText size={18} /> },
    { title: 'Results', href: '/teacher/results', icon: <Award size={18} /> },
    { title: 'Profile', href: '/teacher/profile', icon: <User size={18} /> },
  ],
  student: [
    { title: 'Dashboard', href: '/student/dashboard', icon: <Home size={18} /> },
    { title: 'Exams', href: '/student/exams', icon: <BookCopy size={18} /> },
    { title: 'Results', href: '/student/results', icon: <Award size={18} /> },
    { title: 'Profile', href: '/student/profile', icon: <User size={18} /> },
  ],
};

interface SidebarProps {
  userRole: UserRole;
}

export const Sidebar: React.FC<SidebarProps> = ({ userRole }) => {
  const location = useLocation();
  const items = navItems[userRole];

  return (
    <aside className="fixed left-0 top-16 h-[calc(100vh-4rem)] w-64 bg-white dark:bg-slate-900 border-r border-border overflow-y-auto transition-all shadow-sm">
      <div className="flex flex-col h-full">
        <div className="p-4">
          <div className="text-sm font-medium text-muted-foreground mb-2">
            {userRole === 'admin' && 'Admin Portal'}
            {userRole === 'teacher' && 'Teacher Portal'}
            {userRole === 'student' && 'Student Portal'}
          </div>
        </div>
        
        <nav className="space-y-1 px-2">
          {items.map((item) => (
            <Link
              key={item.href}
              to={item.href}
              className={cn(
                "flex items-center rounded-md px-3 py-2 text-sm font-medium transition-all",
                location.pathname === item.href
                  ? "bg-primary text-primary-foreground shadow-sm"
                  : "text-muted-foreground hover:bg-secondary hover:text-foreground"
              )}
            >
              <span className="mr-3">{item.icon}</span>
              {item.title}
            </Link>
          ))}
        </nav>
        
        <div className="mt-auto p-4">
          <div className="rounded-lg bg-secondary/50 p-4">
            <div className="flex items-center space-x-3">
              <div className="rounded-full bg-primary/10 p-2">
                {userRole === 'admin' && <BookOpen size={20} className="text-primary" />}
                {userRole === 'teacher' && <PenTool size={20} className="text-primary" />}
                {userRole === 'student' && <GraduationCap size={20} className="text-primary" />}
              </div>
              <div>
                <h5 className="text-sm font-medium">Need Help?</h5>
                <p className="text-xs text-muted-foreground">View documentation</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </aside>
  );
};
