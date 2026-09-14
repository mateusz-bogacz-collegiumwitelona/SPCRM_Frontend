import { useParams } from 'react-router';
import { MainLayout } from '~/components/layout/main-layout';
import { DealInfo } from '~/components/deal/deal-info';
import { SaleProductsTable } from '~/components/deal/deal-products';
import { DealNote } from '~/components/deal/deal-note';
import { RoleGuard } from '~/lib/role-guard';
import { AuthGuard } from '~/lib/auth-guard';
import { DealTasks } from '~/components/deal/deal-tasks';

export default function DealDetail() {
  const { dealId } = useParams<{ dealId: string }>();

  if (!dealId) return null;

  return (
    <AuthGuard>
      <RoleGuard allowedRoles={['User', 'Manager']}>
        <MainLayout>
          <div className="w-full mx-auto p-4 lg:p-6">
            <DealInfo dealId={dealId} />

            <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 items-start">
              <div className="xl:col-span-2 w-full overflow-hidden">
                <SaleProductsTable dealId={dealId} />
              </div>

              <div className="xl:col-span-1 w-full space-y-6">
                <DealTasks dealId={dealId} />
                <DealNote dealId={dealId} />
              </div>
            </div>
          </div>
        </MainLayout>
      </RoleGuard>
    </AuthGuard>
  );
}
