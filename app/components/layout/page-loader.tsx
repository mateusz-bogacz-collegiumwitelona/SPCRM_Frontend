import { Loader2 } from 'lucide-react';
import { MainLayout } from '~/components/layout/main-layout';
import { RoleGuard } from '~/lib/role-guard';
import { AuthGuard } from '~/lib/auth-guard';
import { STANDARD_ROLES } from '~/constants/roles';

interface PageLoaderProps {
  readonly message?: string;
  readonly allowedRoles?: readonly string[];
}

export function PageLoader({
  message = 'Wczytywanie danych...',
  allowedRoles = STANDARD_ROLES,
}: Readonly<PageLoaderProps>) {
  return (
    <AuthGuard>
      <RoleGuard allowedRoles={allowedRoles as string[]}>
        <MainLayout>
          <div className="flex h-[50vh] items-center justify-center gap-2 text-brand">
            <Loader2 className="animate-spin w-8 h-8" />
            <span className="text-base font-medium">{message}</span>
          </div>
        </MainLayout>
      </RoleGuard>
    </AuthGuard>
  );
}
