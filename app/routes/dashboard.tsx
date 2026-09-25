import React from 'react';
import { AuthGuard } from '~/lib/auth-guard';
import { MainLayout } from '~/components/layout/main-layout';
import { useAuth } from '~/context/auth-context';
import AdminDashboard from '~/routes/admin/dashboard';
import ManagerDashboard from '~/routes/manager/dashboard';
import UserDashboard from '~/routes/user/dashboard';
import { ROLES } from '~/constants/roles';

export default function DashboardRoute() {
  const { user } = useAuth();

  const renderDashboardByRole = () => {
    const roles = user?.roles || [];
    if (roles.includes(ROLES.ADMIN)) return <AdminDashboard />;

    if (roles.includes(ROLES.MANAGER)) return <ManagerDashboard />;

    return <UserDashboard />;
  };

  return (
    <AuthGuard>
      <MainLayout>{renderDashboardByRole()}</MainLayout>
    </AuthGuard>
  );
}
