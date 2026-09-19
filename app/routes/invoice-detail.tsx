import { useParams } from 'react-router';
import { MainLayout } from '~/components/layout/main-layout';
import { RoleGuard } from '~/lib/role-guard';
import { AuthGuard } from '~/lib/auth-guard';
import { InvoiceInfo } from '~/components/invoice/invoice-info';
import { InvoiceProductsTable } from '~/components/invoice/invoice-products';

export default function InvoiceDetail() {
  const { invoiceId } = useParams<{ invoiceId: string }>();

  if (!invoiceId) return null;

  return (
    <AuthGuard>
      <RoleGuard allowedRoles={['User', 'Manager']}>
        <MainLayout>
          <div className="w-full mx-auto p-4 lg:p-6">
            <InvoiceInfo invoiceId={invoiceId} />

            <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 items-start">
              <div className="xl:col-span-2 w-full overflow-hidden">
                <InvoiceProductsTable invoiceId={invoiceId} />
              </div>
            </div>
          </div>
        </MainLayout>
      </RoleGuard>
    </AuthGuard>
  );
}
