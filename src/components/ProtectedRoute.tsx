import { ReactNode } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { Loader2 } from 'lucide-react';

type AppRole = 'admin' | 'super_admin' | 'accountant' | 'teacher' | 'student';

interface ProtectedRouteProps {
  children: ReactNode;
  allowedRoles?: AppRole[];
}

export function ProtectedRoute({ children, allowedRoles }: ProtectedRouteProps) {
  const { user, role, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/auth" replace />;
  }

  // super_admin inherits admin and accountant permissions
  const effectiveRoles: AppRole[] = role === 'super_admin'
    ? ['super_admin', 'admin', 'accountant']
    : role ? [role as AppRole] : [];

  if (allowedRoles && effectiveRoles.length > 0 && !allowedRoles.some(r => effectiveRoles.includes(r))) {
    switch (role) {
      case 'admin':
      case 'super_admin':
        return <Navigate to="/admin" replace />;
      case 'accountant':
        return <Navigate to="/accountant" replace />;
      case 'teacher':
        return <Navigate to="/teacher" replace />;
      case 'student':
        return <Navigate to="/student" replace />;
      default:
        return <Navigate to="/" replace />;
    }
  }

  return <>{children}</>;
}
