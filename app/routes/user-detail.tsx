import { useState } from 'react';
import { Link, useParams } from 'react-router';
import { ArrowLeft, BarChart3, Layers } from 'lucide-react';
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
import { UserAnalyticsTab } from '~/components/user/user-analytics-tab';

export default function UserDetailPage() {
  const { userId } = useParams<{ userId: string }>();
  const [activeTab, setActiveTab] = useState<'overview' | 'analytics'>('overview');

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
              <div className="border-b border-gray-200">
                <nav className="flex space-x-6" aria-label="Tabs">
                  <button
                    type="button"
                    onClick={() => setActiveTab('overview')}
                    className={`pb-3 text-sm font-semibold flex items-center gap-2 border-b-2 transition-all ${
                      activeTab === 'overview'
                        ? 'border-blue-900 text-blue-900'
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    }`}
                  >
                    <Layers className="w-4 h-4" />
                    <span>Przegląd i Aktywności</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setActiveTab('analytics')}
                    className={`pb-3 text-sm font-semibold flex items-center gap-2 border-b-2 transition-all ${
                      activeTab === 'analytics'
                        ? 'border-blue-900 text-blue-900'
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    }`}
                  >
                    <BarChart3 className="w-4 h-4" />
                    <span>Wykres sprzedaży</span>
                  </button>
                </nav>
              </div>

              {activeTab === 'overview' && (
                <div className="space-y-6">
                  <UserCompaniesTable userId={userId} />
                  <UserContactsTable userId={userId} />
                  <UserSalesTable userId={userId} />
                  <UserTasksTable userId={userId} />
                </div>
              )}

              {activeTab === 'analytics' && (
                <div>
                  <UserAnalyticsTab userId={userId} />
                </div>
              )}
            </HasRole>
          </div>
        </MainLayout>
      </RoleGuard>
    </AuthGuard>
  );
}
