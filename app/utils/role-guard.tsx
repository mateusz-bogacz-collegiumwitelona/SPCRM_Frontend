import { type ReactNode, useEffect, useState } from 'react';
import { Navigate } from 'react-router';
import { useAuth } from '~/context/auth-context';

interface RoleGuardProps {
  allowedRoles: string[];
  children: ReactNode;
}

export function RoleGuard({ allowedRoles, children }: Readonly<RoleGuardProps>) {
  const { user } = useAuth();

  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  if (!isMounted) {
    return null;
  }

  const token = localStorage.getItem('token');
  const rolesString = localStorage.getItem('role');

  if (!user && !token) return <Navigate to="/" replace />;

  let userRoles: string[];
  try {
    userRoles = user ? user.roles : JSON.parse(rolesString || '[]');
  } catch {
    userRoles = [];
  }

  const hasAccess = userRoles.some((role) => allowedRoles.includes(role));

  if (!hasAccess) return <Navigate to="/dashboard" replace />;

  return <>{children}</>;
}
