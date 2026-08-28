import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { api } from '~/api/api';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '~/components/ui/dialog';
import { Button } from '~/components/ui/button';
import { AlertTriangle, Loader2 } from 'lucide-react';

interface ProductItem {
  id: string;
  name: string;
  category: string;
}

interface SteelGradeOption {
  id: string;
  name: string;
}

interface DeleteSteelGradeDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (reassignments: { productId: string; newSteelGradeId: string }[]) => Promise<void>;
  isLoading: boolean;
  steelGradeId?: string;
  steelGradeName?: string;
}

export const DeleteSteelGradeDialog: React.FC<DeleteSteelGradeDialogProps> = ({
  isOpen,
  onClose,
  onConfirm,
  isLoading,
  steelGradeId,
  steelGradeName,
}) => {
  const [reassignments, setReassignments] = useState<Record<string, string>>({});
  const [bulkGradeId, setBulkGradeId] = useState<string>('');

  const { data: associatedProducts = [], isLoading: isLoadingProducts } = useQuery<ProductItem[]>({
    queryKey: ['steel-grade-products', steelGradeId],
    queryFn: async () => {
      const res = await api.get(`/steel-grade/${steelGradeId}/products`);
      return (res.data?.value || res.data?.data || res.data || []) as ProductItem[];
    },
    enabled: isOpen && !!steelGradeId,
  });
  const { data: steelGrades = [] } = useQuery<SteelGradeOption[]>({
    queryKey: ['product-steel-grades'],
    queryFn: async () => {
      const res = await api.get('/products/steel-grades');
      return (res.data?.value || res.data?.data || res.data || []) as SteelGradeOption[];
    },
    enabled: isOpen,
  });

  const availableReplacements = steelGrades.filter((g) => g.id !== steelGradeId);

  const handleBulkChange = (targetGradeId: string) => {
    setBulkGradeId(targetGradeId);
    if (!targetGradeId) return;

    const nextState: Record<string, string> = {};
    associatedProducts.forEach((p) => {
      nextState[p.id] = targetGradeId;
    });
    setReassignments(nextState);
  };

  const handleProductGradeChange = (productId: string, newGradeId: string) => {
    setReassignments((prev) => ({
      ...prev,
      [productId]: newGradeId,
    }));
  };

  const allAssigned = associatedProducts.every((p) => Boolean(reassignments[p.id]));

  const handleConfirm = async () => {
    const payload = Object.entries(reassignments).map(([productId, newSteelGradeId]) => ({
      productId,
      newSteelGradeId,
    }));
    await onConfirm(payload);
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && !isLoading && onClose()}>
      <DialogContent className="sm:max-w-160 max-h-[85vh] flex flex-col">
        <DialogHeader className="border-b border-gray-100 pb-3 flex flex-col items-center gap-2">
          <div className="w-10 h-10 rounded-full bg-red-50 flex items-center justify-center">
            <AlertTriangle className="w-5 h-5 text-red-600" />
          </div>
          <DialogTitle className="text-lg font-normal text-gray-900 text-center">
            Usuwanie gatunku stali: {steelGradeName}
          </DialogTitle>
        </DialogHeader>

        {isLoadingProducts ? (
          <div className="py-12 flex flex-col items-center justify-center text-gray-500 gap-2">
            <Loader2 className="w-6 h-6 animate-spin text-[#004a8f]" />
            <span className="text-xs">Sprawdzanie powiązanych produktów...</span>
          </div>
        ) : (
          <div className="py-3 space-y-4 overflow-y-auto pr-1">
            {associatedProducts.length === 0 ? (
              <p className="text-sm text-gray-600 text-center">
                Brak powiązanych produktów. Gatunek można bezpiecznie usunąć.
              </p>
            ) : (
              <div className="space-y-3">
                <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 text-xs text-amber-900 flex justify-between items-center gap-4">
                  <span>
                    Ten gatunek jest przypisany do <strong>{associatedProducts.length}</strong>{' '}
                    produktów. Wybierz nowy gatunek dla każdego z nich:
                  </span>

                  <select
                    value={bulkGradeId}
                    onChange={(e) => handleBulkChange(e.target.value)}
                    className="shrink-0 border border-amber-300 rounded bg-white px-2 py-1 text-xs text-gray-800"
                  >
                    <option value="">Ustaw dla wszystkich...</option>
                    {availableReplacements.map((g) => (
                      <option key={g.id} value={g.id}>
                        {g.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="border border-gray-200 rounded-md divide-y max-h-60 overflow-y-auto">
                  {associatedProducts.map((product) => (
                    <div
                      key={product.id}
                      className="p-2.5 flex items-center justify-between text-xs bg-white hover:bg-gray-50 gap-4"
                    >
                      <div className="min-w-0">
                        <p className="font-medium text-gray-900 truncate">{product.name}</p>
                        <span className="text-gray-500 text-[11px]">{product.category}</span>
                      </div>

                      <select
                        value={reassignments[product.id] || ''}
                        onChange={(e) => handleProductGradeChange(product.id, e.target.value)}
                        className={`border rounded px-2 py-1 text-xs bg-white shrink-0 w-48 ${
                          reassignments[product.id]
                            ? 'border-gray-300'
                            : 'border-red-300 bg-red-50/20'
                        }`}
                        required
                      >
                        <option value="" disabled>
                          Wybierz nowy gatunek...
                        </option>
                        {availableReplacements.map((g) => (
                          <option key={g.id} value={g.id}>
                            {g.name}
                          </option>
                        ))}
                      </select>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        <div className="flex justify-end gap-3 border-t border-gray-100 pt-3 mt-auto">
          <Button variant="outline" onClick={onClose} disabled={isLoading} className="text-xs">
            Anuluj
          </Button>
          <Button
            variant="destructive"
            onClick={handleConfirm}
            disabled={isLoading || !allAssigned || isLoadingProducts}
            className="bg-red-600 text-white hover:bg-red-700 flex items-center gap-2 text-xs"
          >
            {isLoading && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
            Potwierdź i usuń
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
