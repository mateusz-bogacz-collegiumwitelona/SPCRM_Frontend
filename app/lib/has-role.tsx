import { type ReactNode } from 'react';
import { useAuth } from '~/context/auth-context';

interface HasRoleProps {
  allowedRoles: string[];
  children: ReactNode;
}

export const HasRole = ({ allowedRoles, children }: HasRoleProps) => {
  const { user } = useAuth();
  if (!user) return null;

  const hasAccess = user.roles.some((role) => allowedRoles.includes(role));
  return hasAccess ? <>{children}</> : null;
};
