import { AuthGuard } from '~/lib/auth-guard';
import { useParams } from 'react-router';
import { MainLayout } from '~/components/main-layout';
import { DealInfo } from '~/components/deals/deal-info';
import React from 'react';
import { DealProductsTable } from '~/components/deals/deal-products';
import { DealNote } from '~/components/deals/deal-note';

export default function DealDetail() {
  const { dealId } = useParams<{ dealId: string }>();

  if (!dealId) return null;

  return (
    <AuthGuard allowedRoles={['User', 'Manager']}>
      <MainLayout>
        <div className="w-full mx-auto p-4 lg:p-6">
          <DealInfo dealId={dealId} />

          <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 items-start">
            <div className="xl:col-span-2 w-full overflow-hidden">
              <DealProductsTable dealId={dealId} />
            </div>

            <div className="xl:col-span-1 w-full">
              <DealNote dealId={dealId} />
            </div>
          </div>
        </div>
      </MainLayout>
    </AuthGuard>
  );
}
