import { useParams } from 'react-router';
import { MainLayout } from '~/components/layout/main-layout';
import { RoleGuard } from '~/components/guards/role-guard';
import { AuthGuard } from '~/components/guards/auth-guard';
import { InvoiceInfo } from '~/components/invoice/invoice-info';
import { InvoiceProductsTable } from '~/components/invoice/invoice-products';
import { InvoicePaymentsList } from '~/components/invoice/invoice-payments';
import { STANDARD_ROLES } from '~/constants/roles';
import { isNotFoundError } from '~/lib/client';
import NotFound from '~/routes/not-found';
import { PageLoader } from '~/components/layout/page-loader';
import React from 'react';
import { useInvoiceDetails } from '~/hooks/use-invoices';

export default function InvoiceDetail() {
  const { invoiceId } = useParams<{ invoiceId: string }>();

  const { isLoading, error } = useInvoiceDetails(invoiceId);

  if (!invoiceId || isNotFoundError(error)) {
    return <NotFound />;
  }

  if (isLoading) {
    return <PageLoader message="Wczytywanie szczegółów faktury..." />;
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
