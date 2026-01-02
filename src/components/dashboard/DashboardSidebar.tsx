import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { cn } from '@/lib/utils';
import {
  LayoutDashboard,
  Users,
  GraduationCap,
  BookOpen,
  Calendar,
  CreditCard,
  FileText,
  Settings,
  LogOut,
  ClipboardList,
  Clock,
  BarChart3,
  UserCircle,
  ChefHat,
  Scissors,
} from 'lucide-react';
import { Button } from '@/components/ui/button';

interface NavItem {
  title: string;
  href: string;
  icon: React.ElementType;
}

const adminNavItems: NavItem[] = [
  { title: 'Dashboard', href: '/admin', icon: LayoutDashboard },
  { title: 'Students', href: '/admin/students', icon: Users },
  { title: 'Teachers', href: '/admin/teachers', icon: GraduationCap },
  { title: 'Programs', href: '/admin/programs', icon: BookOpen },
  { title: 'Sessions', href: '/admin/sessions', icon: Calendar },
  { title: 'Attendance', href: '/admin/attendance', icon: ClipboardList },
  { title: 'Geo Check-ins', href: '/admin/geolocation', icon: Clock },
  { title: 'Payments', href: '/admin/payments', icon: CreditCard },
  { title: 'Reports', href: '/admin/reports', icon: BarChart3 },
  { title: 'Settings', href: '/admin/settings', icon: Settings },
];

const teacherNavItems: NavItem[] = [
  { title: 'Dashboard', href: '/teacher', icon: LayoutDashboard },
  { title: 'My Classes', href: '/teacher/classes', icon: BookOpen },
  { title: 'Students', href: '/teacher/students', icon: Users },
  { title: 'Attendance', href: '/teacher/attendance', icon: ClipboardList },
  { title: 'Timetable', href: '/teacher/timetable', icon: Calendar },
  { title: 'Grades', href: '/teacher/grades', icon: FileText },
  { title: 'Profile', href: '/teacher/profile', icon: UserCircle },
];

const studentNavItems: NavItem[] = [
  { title: 'Dashboard', href: '/student', icon: LayoutDashboard },
  { title: 'Sessions', href: '/student/sessions', icon: Calendar },
  { title: 'Check-In', href: '/student/checkin', icon: Clock },
  { title: 'My Courses', href: '/student/courses', icon: BookOpen },
  { title: 'Grades', href: '/student/grades', icon: FileText },
  { title: 'Payments', href: '/student/payments', icon: CreditCard },
  { title: 'Profile', href: '/student/profile', icon: UserCircle },
];

interface DashboardSidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

export function DashboardSidebar({ isOpen, onClose }: DashboardSidebarProps) {
  const { role, signOut, user } = useAuth();
  const location = useLocation();

  const navItems = role === 'admin' 
    ? adminNavItems 
    : role === 'teacher' 
    ? teacherNavItems 
    : studentNavItems;

  const handleSignOut = async () => {
    await signOut();
  };

  return (
    <>
      {/* Mobile overlay */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={onClose}
        />
      )}
      
      {/* Sidebar */}
      <aside
        className={cn(
          "fixed left-0 top-0 h-full w-64 bg-card border-r border-border z-50 transform transition-transform duration-300 lg:translate-x-0",
          isOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <div className="flex flex-col h-full">
          {/* Logo */}
          <div className="p-6 border-b border-border">
            <Link to="/" className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-primary rounded-lg flex items-center justify-center">
                <GraduationCap className="w-6 h-6 text-primary-foreground" />
              </div>
              <div>
                <h2 className="font-display font-bold text-foreground">Meranos</h2>
                <p className="text-xs text-muted-foreground capitalize">{role} Portal</p>
              </div>
            </Link>
          </div>

          {/* Navigation */}
          <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
            {navItems.map((item) => {
              const isActive = location.pathname === item.href;
              return (
                <Link
                  key={item.href}
                  to={item.href}
                  onClick={onClose}
                  className={cn(
                    "flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-all duration-200",
                    isActive
                      ? "bg-primary text-primary-foreground shadow-md"
                      : "text-muted-foreground hover:bg-secondary hover:text-foreground"
                  )}
                >
                  <item.icon className="w-5 h-5" />
                  {item.title}
                </Link>
              );
            })}
          </nav>

          {/* User section */}
          <div className="p-4 border-t border-border">
            <div className="flex items-center gap-3 px-4 py-3 mb-2">
              <div className="w-10 h-10 bg-secondary rounded-full flex items-center justify-center">
                <UserCircle className="w-6 h-6 text-muted-foreground" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-foreground truncate">
                  {user?.user_metadata?.full_name || user?.email?.split('@')[0]}
                </p>
                <p className="text-xs text-muted-foreground capitalize">{role}</p>
              </div>
            </div>
            <Button
              variant="ghost"
              className="w-full justify-start text-muted-foreground hover:text-destructive"
              onClick={handleSignOut}
            >
              <LogOut className="w-5 h-5 mr-3" />
              Sign Out
            </Button>
          </div>
        </div>
      </aside>
    </>
  );
}
