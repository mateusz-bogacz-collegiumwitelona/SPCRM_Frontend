import { Link, useParams } from 'react-router';
import { ArrowLeft } from 'lucide-react';
import { MainLayout } from '~/components/layout/main-layout';
import { AuthGuard } from '~/lib/auth-guard';
import { RoleGuard } from '~/lib/role-guard';
import { HasRole } from '~/lib/has-role';
import { Button } from '~/components/ui/button';
import { UserProfileCard } from '~/components/user/user-profile-card';
import { UserCompaniesTable } from '~/components/user/user-companies-table';
import { UserContactsTable } from '~/components/user/user-contacts-table';
import { UserSalesTable } from '~/components/user/user-sales-table';
import { UserTasksTable } from '~/components/user/user-tasks-table';

export default function UserDetailPage() {
  const { userId } = useParams<{ userId: string }>();

  if (!userId) {
    return null;
  }

  return (
    <AuthGuard>
      <RoleGuard allowedRoles={['Admin', 'Manager']}>
        <MainLayout>
          <div className="mb-4">
            <Button
              asChild
              variant="outline"
              size="sm"
              className="bg-white border-gray-300 text-gray-700 hover:bg-gray-50"
            >
              <Link to="/users" className="flex items-center gap-2">
                <ArrowLeft className="w-4 h-4" />
                <span>Wróć do listy</span>
              </Link>
            </Button>
          </div>

          <div className="space-y-6">
            <UserProfileCard userId={userId} />

            <HasRole allowedRoles={['Manager']}>
              <UserCompaniesTable userId={userId} />
              <UserContactsTable userId={userId} />
              <UserSalesTable userId={userId} />
              <UserTasksTable userId={userId} />
            </HasRole>
          </div>
        </MainLayout>
      </RoleGuard>
    </AuthGuard>
  );
}
