import type { ReactNode } from 'react';
import { useAuth } from '~/context/auth-context';

interface ActionGuardProps {
  authorId: string;
  children: ReactNode;
}

export const ActionGuard = ({ authorId, children }: ActionGuardProps) => {
  const { user } = useAuth();

  const isCanAccess = user?.userId === authorId || user?.roles.includes('Manager');

  if (!isCanAccess) return null;

  return <>{children}</>;
};
