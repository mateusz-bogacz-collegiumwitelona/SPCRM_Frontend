import { Navigate } from 'react-router';
import { useAuth } from '~/context/auth-context';
import { Loader2 } from 'lucide-react';

interface AuthGuardProps {
  children: React.ReactNode;
  allowedRoles: string[];
}

export const AuthGuard = ({ children, allowedRoles }: AuthGuardProps) => {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50">
        <Loader2 className="h-8 w-8 animate-spin text-blue-900" />
      </div>
    );
  }

  if (!user) return <Navigate to="/" replace />;

  const hasRequiredRole = user.roles.some((role) => allowedRoles.includes(role));

  if (!hasRequiredRole) return <Navigate to="/" replace />;

  return <>{children}</>;
};
