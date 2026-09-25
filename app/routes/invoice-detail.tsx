import { useParams } from 'react-router';
import { MainLayout } from '~/components/layout/main-layout';
import { RoleGuard } from '~/lib/role-guard';
import { AuthGuard } from '~/lib/auth-guard';
import { InvoiceInfo } from '~/components/invoice/invoice-info';
import { InvoiceProductsTable } from '~/components/invoice/invoice-products';
import { InvoicePaymentsList } from '~/components/invoice/invoice-payments';
import { STANDARD_ROLES } from '~/constants/roles';
import { useQuery } from '@tanstack/react-query';
import type { InvoiceDetailResponse } from '~/interfaces/invoice';
import { api, isNotFoundError } from '~/api/api';
import NotFound from '~/routes/not-found';
import { PageLoader } from '~/components/layout/page-loader';
import React from 'react';

export default function InvoiceDetail() {
  const { invoiceId } = useParams<{ invoiceId: string }>();

  const { isLoading, error } = useQuery<InvoiceDetailResponse>({
    queryKey: ['invoice-detail', invoiceId],
    queryFn: async () => {
      const response = await api.get(`/invoice/${invoiceId}`);
      return response.data?.data || response.data?.value || response.data;
    },
    retry: false,
    enabled: !!invoiceId,
  });

  if (!invoiceId || isNotFoundError(error)) {
    return <NotFound />;
  }

  if (isLoading) {
    return <PageLoader message="Wczytywanie szczegółów kontaktu..." />;
  }

  return (
    <AuthGuard>
      <RoleGuard allowedRoles={STANDARD_ROLES}>
        <MainLayout>
          <div className="w-full mx-auto p-4 lg:p-6">
            <InvoiceInfo invoiceId={invoiceId} />

            <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 items-start">
              <div className="xl:col-span-2 w-full overflow-hidden">
                <InvoiceProductsTable invoiceId={invoiceId} />
              </div>

              <div className="xl:col-span-1 w-full space-y-6">
                <InvoicePaymentsList invoiceId={invoiceId} />
              </div>
            </div>
          </div>
        </MainLayout>
      </RoleGuard>
    </AuthGuard>
  );
}
