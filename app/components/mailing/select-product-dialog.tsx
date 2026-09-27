import React, { useEffect, useState } from 'react';
import { Loader2, Plus, Search, X } from 'lucide-react';
import { Input } from '~/components/ui/input';
import { formatCurrency } from '~/utils/data-formatters';
import { useMailingProducts } from '~/hooks/use-mailing';
import type { MailingProductResponse } from '~/types/mailing';

interface SelectProductDialogProps {
  readonly isOpen: boolean;
  readonly onClose: () => void;
  readonly onSelectProduct: (product: MailingProductResponse) => void;
}

export function SelectProductDialog({
  isOpen,
  onClose,
  onSelectProduct,
}: SelectProductDialogProps) {
  const [productSearch, setProductSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');

  useEffect(() => {
    const handler = setTimeout(() => setDebouncedSearch(productSearch), 300);
    return () => clearTimeout(handler);
  }, [productSearch]);

  const { data: products = [], isLoading } = useMailingProducts(debouncedSearch, isOpen);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-lg rounded-xl bg-white p-6 shadow-xl">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-lg font-medium text-brand">Wybierz produkt</h3>
          <button
            type="button"
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 cursor-pointer"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="relative mb-4">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          <Input
            type="text"
            placeholder="Wyszukaj produkt..."
            value={productSearch}
            onChange={(e) => setProductSearch(e.target.value)}
            className="pl-9 h-10 w-full"
          />
        </div>

        <div className="max-h-72 overflow-y-auto rounded-md border border-gray-200 bg-gray-50">
          {isLoading ? (
            <div className="flex h-20 items-center justify-center">
              <Loader2 className="h-5 w-5 animate-spin text-gray-400" />
            </div>
          ) : products.length === 0 ? (
            <div className="p-4 text-center text-sm text-gray-500">Brak produktów</div>
          ) : (
            products.map((product) => (
              <button
                type="button"
                key={product.productId}
                onClick={() => onSelectProduct(product)}
                className="flex w-full items-center justify-between border-b border-gray-200 bg-white p-3 text-left hover:bg-gray-50 last:border-0 cursor-pointer"
              >
                <div>
                  <p className="text-sm font-bold text-gray-900">{product.name}</p>
                  <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-gray-500">
                    <span>{product.dimmension}</span>
                    <span>•</span>
                    {product.promotionalPrice ? (
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-gray-400 line-through">
                          {formatCurrency(product.stockPrice, 'PLN', 2)}
                        </span>
                        <span className="font-bold text-red-600">
                          {formatCurrency(product.promotionalPrice, 'PLN', 2)}
                        </span>
                        <span className="bg-red-100 text-red-700 px-1.5 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider">
                          Promocja
                        </span>
                      </div>
                    ) : (
                      <span className="font-medium text-brand">
                        Cena bazowa: {formatCurrency(product.stockPrice, 'PLN', 2)}
                      </span>
                    )}
                  </div>
                </div>
                <Plus className="h-5 w-5 text-gray-400" />
              </button>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
