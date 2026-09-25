import type { ReactNode } from 'react';
import { useAuth } from '~/context/auth-context';
import { ROLES } from '~/constants/roles';

interface ActionGuardProps {
  authorId: string;
  children: ReactNode;
}

export const ActionGuard = ({ authorId, children }: ActionGuardProps) => {
  const { user } = useAuth();

  const isCanAccess = user?.userId === authorId || user?.roles.includes(ROLES.MANAGER);

  if (!isCanAccess) return null;

  return <>{children}</>;
};
