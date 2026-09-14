import React, { useEffect, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '~/api/api';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '~/components/ui/dialog';
import { Button } from '~/components/ui/button';
import { Input } from '~/components/ui/input';
import { AlertCircle, Loader2, Package, Plus, Search, X } from 'lucide-react';
import { getErrorMessage } from '~/utils/error-mapper';
import type { ApiError, FormErrorState } from '~/interfaces/api-error';
import { formatCurrency } from '~/utils/data-formatters';

interface ProductItemResponse {
  productId: string;
  name: string;
  dimension?: string;
  dimmension?: string;
  stockPrice: number;
  promotionalPrice?: number;
}

interface AddDealProductDialogProps {
  readonly isOpen: boolean;
  readonly onClose: () => void;
  readonly dealId: string;
  readonly currencyCode?: string;
}

export const AddDealProductDialog: React.FC<AddDealProductDialogProps> = ({
  isOpen,
  onClose,
  dealId,
  currencyCode = 'PLN',
}) => {
  const queryClient = useQueryClient();

  const [productSearch, setProductSearch] = useState('');
  const [debouncedProductSearch, setDebouncedProductSearch] = useState('');
  const [selectedProduct, setSelectedProduct] = useState<ProductItemResponse | null>(null);

  const [quantity, setQuantity] = useState<number>(1);
  const [unitPrice, setUnitPrice] = useState<number>(0);

  const [formError, setFormError] = useState<FormErrorState | null>(null);

  useEffect(() => {
    const handler = setTimeout(() => setDebouncedProductSearch(productSearch), 300);
    return () => clearTimeout(handler);
  }, [productSearch]);

  const { data: availableProducts = [], isLoading: isLoadingProducts } = useQuery<
    ProductItemResponse[]
  >({
    queryKey: ['deal-products-search', debouncedProductSearch],
    queryFn: async () => {
      const res = await api.get('/mailing/products', {
        params: { SearchTerm: debouncedProductSearch || undefined, PageSize: 30 },
      });
      return res.data?.data?.items || res.data?.items || [];
    },
    enabled: isOpen && !selectedProduct,
  });

  const resetForm = () => {
    setSelectedProduct(null);
    setProductSearch('');
    setQuantity(1);
    setUnitPrice(0);
    setFormError(null);
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  const handleSelectProduct = (product: ProductItemResponse) => {
    setSelectedProduct(product);
    const initialPrice = product.promotionalPrice
      ? product.promotionalPrice / 10000
      : (product.stockPrice ?? 0) / 10000;
    setUnitPrice(initialPrice);
    setQuantity(1);
    setFormError(null);
  };

  const addProductMutation = useMutation({
    mutationFn: async () => {
      if (!selectedProduct) return;
      const payload = {
        productId: selectedProduct.productId,
        quantity: Number(quantity),
        unitPrice: Math.round(Number(unitPrice) * 10000),
      };
      return await api.put(`/sales/${dealId}/products`, payload);
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['deal-products', dealId] });
      await queryClient.invalidateQueries({ queryKey: ['deal-info', dealId] });
      await queryClient.invalidateQueries({ queryKey: ['deals-list'] });
      handleClose();
    },
    onError: (err: unknown) => {
      const apiError = err as ApiError;
      const responseData = apiError.response?.data;
      const code = responseData?.errorCode;
      const fallback =
        responseData?.message || apiError.message || 'Nie udało się dodać produktu do transakcji.';

      setFormError({
        title: getErrorMessage(code, fallback),
        details:
          responseData?.errors && responseData.errors.length > 0 ? responseData.errors : undefined,
      });
    },
  });

  const handleSubmit = (e: React.SyntheticEvent<HTMLFormElement>) => {
    e.preventDefault();
    setFormError(null);

    const validationErrors: string[] = [];
    if (!selectedProduct) {
      validationErrors.push('Wybierz produkt z listy.');
    }
    if (quantity <= 0) {
      validationErrors.push('Ilość musi być większa od zera.');
    }
    if (unitPrice < 0) {
      validationErrors.push('Cena jednostkowa nie może być ujemna.');
    }

    if (validationErrors.length > 0) {
      setFormError({
        title: getErrorMessage('VALIDATION_ERROR'),
        details: validationErrors,
      });
      return;
    }

    addProductMutation.mutate();
  };

  const totalValue = (quantity || 0) * (unitPrice || 0);

  return (
    <Dialog
      open={isOpen}
      onOpenChange={(open) => !open && !addProductMutation.isPending && handleClose()}
    >
      <DialogContent className="sm:max-w-xl bg-white max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-[#004a8f] text-lg font-semibold flex items-center gap-2">
            <Package className="w-5 h-5 text-[#004a8f]" />
            Dodaj pozycję do zamówienia
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} noValidate className="space-y-4 pt-2">
          {formError && (
            <div className="relative flex items-start gap-2.5 p-3 text-red-800 bg-red-50 border border-red-200 rounded-lg text-sm shadow-xs transition-all text-left">
              <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
              <div className="flex-1 pr-4">
                <p className="font-medium leading-tight">{formError.title}</p>
                {formError.details && formError.details.length > 0 && (
                  <ul className="mt-1.5 list-disc list-inside space-y-0.5 text-xs text-red-700">
                    {formError.details.map((detailErr, idx) => (
                      <li key={idx}>{detailErr}</li>
                    ))}
                  </ul>
                )}
              </div>
              <button
                type="button"
                onClick={() => setFormError(null)}
                className="text-red-400 hover:text-red-700 p-0.5 rounded transition-colors"
                title="Zamknij"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1.5">Produkt *</label>
            {selectedProduct ? (
              <div className="flex items-center justify-between p-3 border border-gray-300 rounded-md bg-gray-50 text-sm">
                <div>
                  <p className="font-bold text-gray-900">{selectedProduct.name}</p>
                  <p className="text-xs text-gray-500">
                    {selectedProduct.dimension || selectedProduct.dimmension || 'Brak wymiaru'}
                  </p>
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => setSelectedProduct(null)}
                  className="text-gray-500 hover:text-red-600 h-8 w-8 p-0"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            ) : (
              <div className="space-y-2">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    type="text"
                    placeholder="Szukaj produktu po nazwie..."
                    value={productSearch}
                    onChange={(e) => setProductSearch(e.target.value)}
                    className="pl-9 h-10 text-sm w-full bg-white"
                  />
                </div>

                <div className="max-h-52 overflow-y-auto rounded-md border border-gray-200 bg-gray-50 divide-y divide-gray-200">
                  {isLoadingProducts ? (
                    <div className="flex h-20 items-center justify-center">
                      <Loader2 className="h-5 w-5 animate-spin text-gray-400" />
                    </div>
                  ) : availableProducts.length === 0 ? (
                    <p className="p-4 text-center text-xs text-gray-500">Brak wyników</p>
                  ) : (
                    availableProducts.map((p) => (
                      <button
                        type="button"
                        key={p.productId}
                        onClick={() => handleSelectProduct(p)}
                        className="w-full text-left p-3 hover:bg-white flex justify-between items-center transition-colors"
                      >
                        <div>
                          <p className="text-sm font-semibold text-gray-900">{p.name}</p>
                          <p className="text-xs text-gray-500">
                            {p.dimension || p.dimmension || 'Standard'}
                          </p>
                        </div>
                        <div className="text-right">
                          <span className="text-xs font-bold text-[#004a8f]">
                            {formatCurrency(p.promotionalPrice ?? p.stockPrice, currencyCode, 2)}
                          </span>
                        </div>
                      </button>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Krok 2: Parametry pozycji (Ilość i Cena) */}
          {selectedProduct && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 border-t border-gray-100">
              <div>
                <label
                  htmlFor="product-quantity"
                  className="block text-xs font-semibold text-gray-700 mb-1"
                >
                  Ilość *
                </label>
                <Input
                  id="product-quantity"
                  type="number"
                  min={1}
                  value={quantity}
                  onChange={(e) => setQuantity(Number(e.target.value))}
                  className="h-10 bg-white"
                />
              </div>

              <div>
                <label
                  htmlFor="product-unit-price"
                  className="block text-xs font-semibold text-gray-700 mb-1"
                >
                  Cena jednostkowa netto ({currencyCode}) *
                </label>
                <Input
                  id="product-unit-price"
                  type="number"
                  step="0.01"
                  min={0}
                  value={unitPrice}
                  onChange={(e) => setUnitPrice(Number(e.target.value))}
                  className="h-10 bg-white font-medium"
                />
              </div>

              <div className="sm:col-span-2 p-3 bg-blue-50 border border-blue-100 rounded-md flex justify-between items-center text-sm font-semibold text-[#004a8f]">
                <span>Łączna wartość pozycji:</span>
                <span>{formatCurrency(totalValue * 10000, currencyCode, 2)}</span>
              </div>
            </div>
          )}

          <DialogFooter className="pt-3 border-t border-gray-100">
            <Button
              type="button"
              variant="outline"
              onClick={handleClose}
              disabled={addProductMutation.isPending}
              className="border-gray-300 text-gray-700"
            >
              Anuluj
            </Button>
            <Button
              type="submit"
              disabled={addProductMutation.isPending || !selectedProduct}
              className="bg-[#004a8f] text-white hover:bg-[#003870] flex items-center gap-2"
            >
              {addProductMutation.isPending && <Loader2 className="w-4 h-4 animate-spin" />}
              Dodaj do zamówienia
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};
