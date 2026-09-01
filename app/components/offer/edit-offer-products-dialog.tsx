import React, { useState, useEffect, useRef } from 'react';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '~/components/ui/dialog';
import { Button } from '~/components/ui/button';
import { useQuery } from '@tanstack/react-query';
import { api } from '~/api/api';
import { AlertCircle, Loader2, Plus, Trash2, Edit3, Search } from 'lucide-react';

export interface EditableProductItem {
  productId: string;
  productName: string;
  steelGrade?: string;
  quantity: number;
  quotedPrice: number; // long x100000
}

interface EditOfferProductsDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (
    items: { productId: string; quantity: number; quotedPrice: number }[],
  ) => Promise<void>;
  isLoading: boolean;
  initialProducts: EditableProductItem[];
  currencyCode?: string;
  decimalPlaces?: number;
}

interface ProductSearchResult {
  id: string;
  name: string;
  steelGrade?: string;
  pricePerUnit: number;
}

export const EditOfferProductsDialog: React.FC<EditOfferProductsDialogProps> = ({
  isOpen,
  onClose,
  onConfirm,
  isLoading,
  initialProducts,
  currencyCode = 'PLN',
  decimalPlaces = 2,
}) => {
  const [items, setItems] = useState<EditableProductItem[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const dropdownRef = useRef<HTMLDivElement>(null);

  // Debounce zapytania (300 ms)
  useEffect(() => {
    const handler = setTimeout(() => setDebouncedQuery(searchTerm.trim()), 300);
    return () => clearTimeout(handler);
  }, [searchTerm]);

  // Pobieranie pasujących produktów z poprawnego endpointu /products/search
  const { data: searchResults, isFetching: isSearching } = useQuery<ProductSearchResult[]>({
    queryKey: ['products-async-search', debouncedQuery],
    queryFn: async () => {
      if (!debouncedQuery) return [];
      const res = await api.get('/products/search', {
        params: { Query: debouncedQuery, Limit: 20 },
      });
      return res.data?.data || res.data?.value || res.data || [];
    },
    enabled: isOpen && debouncedQuery.length >= 2,
  });

  // Zamykanie listy po kliknięciu poza nią
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    if (isOpen) {
      setItems(initialProducts.map((p) => ({ ...p })));
      setError(null);
      setSearchTerm('');
      setIsDropdownOpen(false);
    }
  }, [isOpen, initialProducts]);

  const handleSelectProduct = (prod: ProductSearchResult) => {
    if (items.some((item) => item.productId === prod.id)) {
      setError('Ten produkt znajduje się już na liście.');
      return;
    }

    setItems((prev) => [
      ...prev,
      {
        productId: prod.id,
        productName: prod.name,
        steelGrade: prod.steelGrade,
        quantity: 1,
        quotedPrice: prod.pricePerUnit || 10000,
      },
    ]);

    setSearchTerm('');
    setIsDropdownOpen(false);
    setError(null);
  };

  const handleQuantityChange = (index: number, quantity: number) => {
    const updated = [...items];
    updated[index].quantity = Math.max(1, quantity);
    setItems(updated);
  };

  const handlePriceChange = (index: number, displayPrice: number) => {
    const updated = [...items];
    const multiplier = Math.pow(10, decimalPlaces + 2);
    updated[index].quotedPrice = Math.round(displayPrice * multiplier);
    setItems(updated);
  };

  const handleRemoveItem = (index: number) => {
    setItems(items.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.SyntheticEvent) => {
    e.preventDefault();

    if (items.length === 0) {
      setError('Oferta musi zawierać co najmniej jeden produkt.');
      return;
    }

    for (const item of items) {
      if (item.quantity <= 0) {
        setError(`Ilość dla ${item.productName} musi być większa od zera.`);
        return;
      }
      if (item.quotedPrice <= 0) {
        setError(`Cena dla ${item.productName} musi być większa od zera.`);
        return;
      }
    }

    try {
      setError(null);
      await onConfirm(
        items.map((i) => ({
          productId: i.productId,
          quantity: i.quantity,
          quotedPrice: i.quotedPrice,
        })),
      );
      onClose();
    } catch (err: unknown) {
      setError('Wystąpił błąd podczas zapisywania pozycji.');
    }
  };

  const multiplier = Math.pow(10, decimalPlaces + 2);

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && !isLoading && onClose()}>
      <DialogContent className="sm:max-w-175 max-h-[90vh] flex flex-col p-0">
        <DialogHeader className="p-6 pb-4 border-b border-gray-100 flex flex-row items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-blue-50 text-[#004a8f] flex items-center justify-center shrink-0">
            <Edit3 className="w-5 h-5" />
          </div>
          <div>
            <DialogTitle className="text-xl font-bold text-gray-900">
              Edycja pozycji oferty
            </DialogTitle>
            <p className="text-xs text-gray-500 mt-0.5">
              Wyszukaj i dodaj produkty lub zmień ilości i ceny
            </p>
          </div>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-4">
          {error && (
            <div className="flex items-center gap-2 p-3 text-red-700 bg-red-50 border border-red-200 rounded-lg text-xs">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <p>{error}</p>
            </div>
          )}

          {/* Wyszukiwarka produktów */}
          <div ref={dropdownRef} className="relative">
            <div className="relative">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                  setIsDropdownOpen(true);
                }}
                onFocus={() => setIsDropdownOpen(true)}
                placeholder="Wpisz min. 2 znaki (np. nazwę lub gatunek stali)..."
                className="w-full pl-9 pr-10 py-2 border border-gray-300 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-[#004a8f]"
              />
              {isSearching && (
                <Loader2 className="absolute right-3 top-2.5 h-4 w-4 animate-spin text-gray-400" />
              )}
            </div>

            {/* Lista wyników */}
            {isDropdownOpen && debouncedQuery.length >= 2 && (
              <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-xl z-50 max-h-56 overflow-y-auto divide-y">
                {searchResults && searchResults.length > 0 ? (
                  searchResults.map((prod) => (
                    <button
                      key={prod.id}
                      type="button"
                      onClick={() => handleSelectProduct(prod)}
                      className="w-full text-left px-4 py-2.5 hover:bg-blue-50 flex items-center justify-between text-xs sm:text-sm transition-colors cursor-pointer"
                    >
                      <div>
                        <span className="font-semibold text-gray-900">{prod.name}</span>
                        {prod.steelGrade && (
                          <span className="ml-2 bg-gray-100 text-gray-600 px-2 py-0.5 rounded text-xs font-normal">
                            {prod.steelGrade}
                          </span>
                        )}
                      </div>
                      <Plus className="w-4 h-4 text-[#004a8f]" />
                    </button>
                  ))
                ) : !isSearching ? (
                  <div className="p-3 text-center text-xs text-gray-500">
                    Brak wyników dla frazy „{debouncedQuery}”.
                  </div>
                ) : null}
              </div>
            )}
          </div>

          {/* Tabela pozycji */}
          <div className="border border-gray-200 rounded-lg overflow-hidden">
            <table className="w-full text-left text-xs sm:text-sm">
              <thead className="bg-gray-50 border-b border-gray-200 text-gray-700">
                <tr>
                  <th className="py-2.5 px-3">Produkt</th>
                  <th className="py-2.5 px-3 w-24">Ilość</th>
                  <th className="py-2.5 px-3 w-32">Cena jedn. ({currencyCode})</th>
                  <th className="py-2.5 px-3 w-12 text-center">Usuń</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {items.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="text-center py-6 text-gray-500 text-xs">
                      Brak pozycji na liście. Wyszukaj produkt powyżej, aby go dodać.
                    </td>
                  </tr>
                ) : (
                  items.map((item, index) => (
                    <tr key={item.productId} className="hover:bg-gray-50/50">
                      <td className="py-2 px-3">
                        <div className="font-semibold text-gray-900">{item.productName}</div>
                        {item.steelGrade && (
                          <span className="text-[10px] text-gray-500">{item.steelGrade}</span>
                        )}
                      </td>
                      <td className="py-2 px-3">
                        <input
                          type="number"
                          min="1"
                          value={item.quantity}
                          onChange={(e) =>
                            handleQuantityChange(index, Number.parseInt(e.target.value) || 1)
                          }
                          className="w-full border border-gray-300 rounded px-2 py-1 text-xs sm:text-sm"
                        />
                      </td>
                      <td className="py-2 px-3">
                        <input
                          type="number"
                          step="0.01"
                          min="0.01"
                          value={(item.quotedPrice / multiplier).toFixed(decimalPlaces)}
                          onChange={(e) =>
                            handlePriceChange(index, Number.parseFloat(e.target.value) || 0)
                          }
                          className="w-full border border-gray-300 rounded px-2 py-1 text-xs sm:text-sm font-medium"
                        />
                      </td>
                      <td className="py-2 px-3 text-center">
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          onClick={() => handleRemoveItem(index)}
                          className="h-8 w-8 text-red-500 hover:text-red-700 hover:bg-red-50"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </form>

        <DialogFooter className="p-4 border-t border-gray-100 flex justify-end gap-3 bg-gray-50/50">
          <Button
            type="button"
            variant="outline"
            onClick={onClose}
            disabled={isLoading}
            className="text-gray-700 border-gray-300"
          >
            Anuluj
          </Button>
          <Button
            type="button"
            onClick={handleSubmit}
            disabled={isLoading || items.length === 0}
            className="bg-[#004a8f] text-white hover:bg-[#003870] flex items-center gap-2"
          >
            {isLoading && <Loader2 className="w-4 h-4 animate-spin" />}
            Zapisz zmiany
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
