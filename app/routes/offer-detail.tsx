import { useNavigate, useParams } from 'react-router';
import { isNotFoundError } from '~/api/api';
import { AuthGuard } from '~/lib/auth-guard';
import { MainLayout } from '~/components/layout/main-layout';
import React, { useState } from 'react';
import { OfferDetailHeader } from '~/components/offer/offer-detail-header';
import { OfferClientDetail } from '~/components/offer/offer-contact-detail';
import { ExtendOfferValidityDialog } from '~/components/offer/dialogs/extend-offer-validity-dialog';
import { ChangeOfferStatusDialog } from '~/components/offer/dialogs/change-offer-status-dialog';
import { Button } from '~/components/ui/button';
import { CalendarClock, CheckCircle, Mail, Trash2, XCircle } from 'lucide-react';
import { EditOfferProductsDialog } from '~/components/offer/dialogs/edit-offer-products-dialog';
import { OfferProductsTable } from '~/components/offer/offer-product-table';
import { ResendOfferEmailDialog } from '~/components/offer/dialogs/resend-offer-email-dialog';
import { DeleteOfferDialog } from '~/components/offer/dialogs/delete-offer-dialog';
import type { EditableProductItem, OfferProductResponse } from '~/interfaces/offer';
import NotFound from '~/routes/not-found';
import { PageLoader } from '~/components/layout/page-loader';
import { RoleGuard } from '~/lib/role-guard';
import { STANDARD_ROLES } from '~/constants/roles';
import {
  useOfferAllowedActions,
  useOfferDetailMutations,
  useOfferDetails,
} from '~/hooks/use-offers';

const OfferDetail: React.FC = () => {
  const { offerId } = useParams<{ offerId: string }>();
  const navigate = useNavigate();

  const [isExtendModalOpen, setIsExtendModalOpen] = useState(false);
  const [statusDialogState, setStatusDialogState] = useState<{
    isOpen: boolean;
    targetStatus: 'Accepted' | 'Rejected' | null;
  }>({
    isOpen: false,
    targetStatus: null,
  });

  const [isResendModalOpen, setIsResendModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isEditProductsOpen, setIsEditProductsOpen] = useState(false);
  const [productsToEdit, setProductsToEdit] = useState<EditableProductItem[]>([]);

  const {
    data: basicInfo,
    isLoading: isBasicInfoLoading,
    isError,
    error,
  } = useOfferDetails(offerId);

  const { data: allowedActions } = useOfferAllowedActions(offerId);

  const {
    updateProductsMutation,
    extendValidityMutation,
    changeStatusMutation,
    resendEmailMutation,
    deleteOfferMutation,
  } = useOfferDetailMutations(offerId);

  const handleOpenEditProducts = (currentProducts: OfferProductResponse[]) => {
    setProductsToEdit(
      currentProducts.map((p) => ({
        productId: p.productId,
        productName: p.productName,
        steelGrade: p.steelGrade,
        quantity: p.quantity,
        quotedPrice: p.quotedPrice,
      })),
    );
    setIsEditProductsOpen(true);
  };

  const canAccept = allowedActions?.allowedStatusTransitions?.includes('Accepted');
  const canReject = allowedActions?.allowedStatusTransitions?.includes('Rejected');
  const canExtend = allowedActions?.canExtendValidity;
  const canResendEmail = allowedActions?.canResendEmail;
  const canDelete = allowedActions?.canDelete;

  if (!offerId || isNotFoundError(error)) {
    return <NotFound />;
  }

  if (isBasicInfoLoading) {
    return <PageLoader message="Wczytywanie szczegółów oferty..." />;
  }

  return (
    <AuthGuard>
      <RoleGuard allowedRoles={STANDARD_ROLES}>
        <MainLayout>
          <div className="bg-white lg:bg-layout-bg w-full min-h-screen pb-12">
            <div className="p-4 lg:p-8 max-w-[1600px] mx-auto space-y-6">
              <div className="flex flex-col gap-4">
                <OfferDetailHeader
                  isLoading={isBasicInfoLoading}
                  isError={isError}
                  basicInfo={basicInfo}
                />

                <div className="flex flex-wrap items-center justify-end gap-2.5">
                  {canResendEmail && (
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setIsResendModalOpen(true)}
                      className="text-brand border-blue-200 bg-blue-50/50 hover:bg-blue-100 flex items-center gap-1.5 text-xs sm:text-sm"
                    >
                      <Mail className="w-4 h-4" />
                      Wyślij e-mail ponownie
                    </Button>
                  )}

                  {canReject && (
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() =>
                        setStatusDialogState({ isOpen: true, targetStatus: 'Rejected' })
                      }
                      className="text-red-600 border-red-200 hover:bg-red-50 flex items-center gap-1.5 text-xs sm:text-sm"
                    >
                      <XCircle className="w-4 h-4" />
                      Odrzuć ofertę
                    </Button>
                  )}

                  {canAccept && (
                    <Button
                      type="button"
                      onClick={() =>
                        setStatusDialogState({ isOpen: true, targetStatus: 'Accepted' })
                      }
                      className="bg-green-600 hover:bg-green-700 text-white flex items-center gap-1.5 text-xs sm:text-sm"
                    >
                      <CheckCircle className="w-4 h-4" />
                      Zaakceptuj ofertę
                    </Button>
                  )}

                  {canExtend && (
                    <Button
                      type="button"
                      onClick={() => setIsExtendModalOpen(true)}
                      className="bg-brand text-white hover:bg-brand-hover flex items-center gap-2 font-medium text-xs sm:text-sm"
                    >
                      <CalendarClock className="w-4 h-4" />
                      Przedłuż ważność
                    </Button>
                  )}

                  {canDelete && (
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setIsDeleteModalOpen(true)}
                      className="text-red-600 border-red-200 hover:bg-red-50 flex items-center gap-1.5 text-xs sm:text-sm"
                    >
                      <Trash2 className="w-4 h-4" />
                      Usuń ofertę
                    </Button>
                  )}
                </div>
              </div>

              {offerId && <OfferClientDetail offerId={offerId} />}

              {offerId && (
                <OfferProductsTable
                  offerId={offerId}
                  canEdit={allowedActions?.canEdit}
                  onEditProducts={handleOpenEditProducts}
                />
              )}
            </div>
          </div>

          <ExtendOfferValidityDialog
            isOpen={isExtendModalOpen}
            onClose={() => setIsExtendModalOpen(false)}
            onConfirm={async (newDate) => {
              await extendValidityMutation.mutateAsync(newDate);
              setIsExtendModalOpen(false);
            }}
            isLoading={extendValidityMutation.isPending}
            offerName={basicInfo?.offerName}
            currentValidUntil={basicInfo?.validUntil}
          />

          <ChangeOfferStatusDialog
            isOpen={statusDialogState.isOpen}
            targetStatus={statusDialogState.targetStatus}
            onClose={() => setStatusDialogState({ isOpen: false, targetStatus: null })}
            onConfirm={async (status) => {
              await changeStatusMutation.mutateAsync(status);
              setStatusDialogState({ isOpen: false, targetStatus: null });
            }}
            isLoading={changeStatusMutation.isPending}
            offerName={basicInfo?.offerName}
          />

          <EditOfferProductsDialog
            isOpen={isEditProductsOpen}
            onClose={() => setIsEditProductsOpen(false)}
            onConfirm={async (items) => {
              await updateProductsMutation.mutateAsync(items);
              setIsEditProductsOpen(false);
            }}
            isLoading={updateProductsMutation.isPending}
            initialProducts={productsToEdit}
          />

          <ResendOfferEmailDialog
            isOpen={isResendModalOpen}
            onClose={() => setIsResendModalOpen(false)}
            onConfirm={async (language) => {
              await resendEmailMutation.mutateAsync(language);
              setIsResendModalOpen(false);
            }}
            isLoading={resendEmailMutation.isPending}
            offerName={basicInfo?.offerName}
            recipientEmail={basicInfo?.contactEmail}
            recipientName={`${basicInfo?.contactFirstName ?? ''} ${basicInfo?.contactLastName ?? ''}`.trim()}
          />

          <DeleteOfferDialog
            isOpen={isDeleteModalOpen}
            onClose={() => setIsDeleteModalOpen(false)}
            onConfirm={async () => {
              await deleteOfferMutation.mutateAsync();
              setIsDeleteModalOpen(false);
              navigate('/offers');
            }}
            isLoading={deleteOfferMutation.isPending}
            offerName={basicInfo?.offerName}
          />
        </MainLayout>
      </RoleGuard>
    </AuthGuard>
  );
};

export default OfferDetail;
