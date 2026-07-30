import { useParams } from 'react-router';
import { MainLayout } from '~/components/layout/main-layout';
import { SaleInfo } from '~/components/deals/sale-info';
import React from 'react';
import { SaleProductsTable } from '~/components/deals/sale-products';
import { SaleNote } from '~/components/deals/sale-note';
import { RoleGuard } from '~/lib/role-guard';
import { AuthGuard } from '~/lib/auth-guard';

export default function SaleDetail() {
  const { dealId } = useParams<{ dealId: string }>();

  if (!dealId) return null;

  return (
    <AuthGuard>
      <RoleGuard allowedRoles={['User', 'Manager']}>
        <MainLayout>
          <div className="w-full mx-auto p-4 lg:p-6">
            <SaleInfo dealId={dealId} />

            <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 items-start">
              <div className="xl:col-span-2 w-full overflow-hidden">
                <SaleProductsTable dealId={dealId} />
              </div>

              <div className="xl:col-span-1 w-full">
                <SaleNote dealId={dealId} />
              </div>
            </div>
          </div>
        </MainLayout>
      </RoleGuard>
    </AuthGuard>
  );
}
