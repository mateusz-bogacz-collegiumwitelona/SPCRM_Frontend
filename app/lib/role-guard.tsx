import { type ReactNode } from 'react';
import { Navigate } from 'react-router';
import { useAuth } from '~/context/auth-context';
import { Loader2 } from 'lucide-react';

interface RoleGuardProps {
  allowedRoles: string[];
  children: ReactNode;
  redirectTo?: string;
}

export function RoleGuard({ allowedRoles, children, redirectTo }: Readonly<RoleGuardProps>) {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50">
        <Loader2 className="h-8 w-8 animate-spin text-[#004a8f]" />
      </div>
    );
  }

  if (!user) return <Navigate to="/" replace />;

  const hasAccess = user.roles.some((role) => allowedRoles.includes(role));

  if (!hasAccess) {
    return redirectTo ? <Navigate to={redirectTo} replace /> : null;
  }

  return <>{children}</>;
}
