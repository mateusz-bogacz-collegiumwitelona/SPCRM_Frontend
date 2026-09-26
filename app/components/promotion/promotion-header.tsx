import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '~/api/api';
import { useAuth } from '~/context/auth-context';
import { Button } from '~/components/ui/button';
import { ArrowLeft, Pencil, Play, PowerOff, Trash2 } from 'lucide-react';
import { format } from 'date-fns';
import { pl } from 'date-fns/locale';
import { DeactivatePromotionDialog } from '~/components/promotion/dialogs/deactivate-promotion-dialog';
import { ActivatePromotionDialog } from '~/components/promotion/dialogs/activate-promotion-dialog';
import { DeletePromotionDialog } from '~/components/promotion/dialogs/delete-promotion-dialog';
import { EditPromotionDialog } from '~/components/promotion/dialogs/edit-promotion-dialog';
import type { EditPromotionRequest, PromotionDetailResponse } from '~/interfaces/promotion';
import { MANAGEMENT_ROLES } from '~/constants/roles';

export const PromotionHeader: React.FC<{ readonly promotion: PromotionDetailResponse }> = ({
  promotion,
}) => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [isDeactivateOpen, setIsDeactivateOpen] = useState(false);
  const [isActivateOpen, setIsActivateOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);

  const canManage = user?.roles.some((role) => MANAGEMENT_ROLES.includes(role));

  const deactivateMutation = useMutation({
    mutationFn: async () => api.patch(`/promotion/${promotion.id}/deactivate`),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['promotion-details', promotion.id] });
      await queryClient.invalidateQueries({ queryKey: ['promotions-list'] });
      setIsDeactivateOpen(false);
    },
  });

  const activateMutation = useMutation({
    mutationFn: async (endDate: Date) =>
      api.patch('/promotion/activate', { id: promotion.id, endDate: endDate.toISOString() }),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['promotion-details', promotion.id] });
      await queryClient.invalidateQueries({ queryKey: ['promotions-list'] });
      setIsActivateOpen(false);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async () => api.delete(`/promotion/${promotion.id}`),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['promotions-list'] });
      navigate('/promotions');
    },
  });

  const editMutation = useMutation({
    mutationFn: async (payload: EditPromotionRequest) => api.patch('/promotion/edit', payload),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['promotion-details', promotion.id] });
      await queryClient.invalidateQueries({ queryKey: ['promotions-list'] });
      setIsEditOpen(false);
    },
  });

  const isExpired = Boolean(promotion.endDate && new Date(promotion.endDate) < new Date());

  const renderStatusBadge = () => {
    if (promotion.isActive && !isExpired) {
      return (
        <span className="bg-green-100 text-green-700 text-xs font-semibold px-2.5 py-0.5 rounded-full uppercase tracking-wider">
          Aktywna
        </span>
      );
    }
    if (isExpired) {
      return (
        <span className="bg-gray-100 text-gray-700 text-xs font-semibold px-2.5 py-0.5 rounded-full uppercase tracking-wider">
          Wygasła
        </span>
      );
    }
    return (
      <span className="bg-gray-100 text-gray-700 text-xs font-semibold px-2.5 py-0.5 rounded-full uppercase tracking-wider">
        Zakończona
      </span>
    );
  };

  return (
    <>
      <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm mb-6 relative overflow-hidden">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex flex-wrap items-center gap-3 mb-2">
              <Link
                to="/promotions"
                className="text-gray-500 hover:text-blue-900 transition-colors"
                title="Powrót do listy promocji"
              >
                <ArrowLeft className="w-5 h-5" />
              </Link>
              <h1 className="text-2xl font-semibold text-gray-900">{promotion.name}</h1>

              {canManage && (
                <div className="flex items-center gap-1">
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="text-blue-900 hover:bg-blue-50 h-8 w-8"
                    onClick={() => setIsEditOpen(true)}
                    title="Edytuj promocję"
                  >
                    <Pencil className="w-4 h-4" />
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="text-red-500 hover:bg-red-50 hover:text-red-700 h-8 w-8"
                    onClick={() => setIsDeleteOpen(true)}
                    title="Usuń promocję"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              )}

              {renderStatusBadge()}

              {typeof promotion.discountPercentage === 'number' && (
                <span className="bg-red-50 text-red-700 border border-red-200 text-xs font-bold px-2.5 py-0.5 rounded-full">
                  -{promotion.discountPercentage}%
                </span>
              )}
            </div>

            <p className="text-gray-500 ml-8 text-sm">
              Utworzono:{' '}
              <span className="font-medium text-gray-900">
                {format(new Date(promotion.createdAt), 'dd MMMM yyyy, HH:mm', { locale: pl })}
              </span>
              {promotion.updateAt && (
                <>
                  {' '}
                  | Ostatnia zmiana:{' '}
                  <span className="font-medium text-gray-900">
                    {format(new Date(promotion.updateAt), 'dd MMMM yyyy, HH:mm', { locale: pl })}
                  </span>
                </>
              )}
            </p>
          </div>

          {canManage && (
            <div>
              {promotion.isActive ? (
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsDeactivateOpen(true)}
                  className="text-amber-700 border-amber-300 hover:bg-amber-50 flex items-center gap-2"
                >
                  <PowerOff className="w-4 h-4" /> Zakończ promocję
                </Button>
              ) : (
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsActivateOpen(true)}
                  className="text-green-700 border-green-300 hover:bg-green-50 flex items-center gap-2"
                >
                  <Play className="w-4 h-4" /> Wznów promocję
                </Button>
              )}
            </div>
          )}
        </div>
      </div>

      <DeactivatePromotionDialog
        isOpen={isDeactivateOpen}
        onClose={() => setIsDeactivateOpen(false)}
        onConfirm={async () => {
          await deactivateMutation.mutateAsync();
        }}
        isLoading={deactivateMutation.isPending}
        promotionName={promotion.name}
      />
      <ActivatePromotionDialog
        isOpen={isActivateOpen}
        onClose={() => setIsActivateOpen(false)}
        onConfirm={async (endDate) => {
          await activateMutation.mutateAsync(endDate);
        }}
        isLoading={activateMutation.isPending}
        promotionName={promotion.name}
      />
      <DeletePromotionDialog
        isOpen={isDeleteOpen}
        onClose={() => setIsDeleteOpen(false)}
        onConfirm={async () => {
          await deleteMutation.mutateAsync();
        }}
        isLoading={deleteMutation.isPending}
        promotionName={promotion.name}
      />
      <EditPromotionDialog
        isOpen={isEditOpen}
        onClose={() => setIsEditOpen(false)}
        onSave={async (payload) => {
          await editMutation.mutateAsync(payload);
        }}
        isLoading={editMutation.isPending}
        initialData={promotion}
      />
    </>
  );
};
