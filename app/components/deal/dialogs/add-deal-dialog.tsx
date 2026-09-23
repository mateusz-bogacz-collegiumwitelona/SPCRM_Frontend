import React, { useEffect, useMemo, useRef, useState } from 'react';
import { keepPreviousData, useQuery } from '@tanstack/react-query';
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
import { AlertCircle, CalendarIcon, Loader2, Plus, Search, Trash2, X } from 'lucide-react';
import { getErrorMessage } from '~/utils/error-mapper';
import type { ApiError, FormErrorState } from '~/interfaces/api-error';
import { formatCurrency } from '~/utils/data-formatters';
import { Popover, PopoverContent, PopoverTrigger } from '~/components/ui/popover';
import { Calendar } from '~/components/ui/calendar';
import { format } from 'date-fns';
import { pl } from 'date-fns/locale';
import { cn } from '~/utils/utils';
import type { AddDealPayload, AddDealProductItem, ContactDealResponse } from '~/interfaces/deal';

interface CurrencySimple {
  currencyId: string;
  name: string;
  code: string;
  decimalPlace: number;
}

interface PagedResult<T> {
  items: T[];
  pageNumber: number;
  pageSize: number;
  totalCount: number;
  totalPages: number;
  hasPreviousPage: boolean;
  hasNextPage: boolean;
}

interface ProductItemResponse {
  productId: string;
  name: string;
  dimension?: string;
  dimmension?: string;
  stockPrice: number;
  promotionalPrice?: number;
}

interface AddDealDialogProps {
  readonly isOpen: boolean;
  readonly onClose: () => void;
  readonly onSuccess: () => void;
}

export function AddDealDialog({ isOpen, onClose, onSuccess }: AddDealDialogProps) {
  const [contactSearch, setContactSearch] = useState('');
  const [debouncedContactSearch, setDebouncedContactSearch] = useState('');
  const [selectedContact, setSelectedContact] = useState<ContactDealResponse | null>(null);
  const [contactPage, setContactPage] = useState(1);
  const isScrollAppend = useRef(false);
  const [accumulatedContacts, setAccumulatedContacts] = useState<ContactDealResponse[]>([]);

  const [closeDate, setCloseDate] = useState<Date | undefined>(undefined);
  const [currencyId, setCurrencyId] = useState<string>('');
  const [selectedProducts, setSelectedProducts] = useState<AddDealProductItem[]>([]);
  const [isProductPickerOpen, setIsProductPickerOpen] = useState<boolean>(false);
  const [productSearch, setProductSearch] = useState<string>('');
  const [debouncedProductSearch, setDebouncedProductSearch] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [formError, setFormError] = useState<FormErrorState | null>(null);

  useEffect(() => {
    const handler = setTimeout(() => setDebouncedContactSearch(contactSearch), 300);
    return () => clearTimeout(handler);
  }, [contactSearch]);

  useEffect(() => {
    isScrollAppend.current = false;
    setContactPage(1);
  }, [debouncedContactSearch]);

  useEffect(() => {
    const handler = setTimeout(() => setDebouncedProductSearch(productSearch), 300);
    return () => clearTimeout(handler);
  }, [productSearch]);

  const { data: currencies = [] } = useQuery<CurrencySimple[]>({
    queryKey: ['currencies-simple'],
    queryFn: async () => {
      const res = await api.get('/currency/simple');
      return res.data?.data || res.data?.value || res.data || [];
    },
    enabled: isOpen,
  });

  useEffect(() => {
    if (currencies.length > 0 && !currencyId) {
      const pln = currencies.find((c) => c.code === 'PLN') || currencies[0];
      setCurrencyId(pln.currencyId);
    }
  }, [currencies, currencyId]);

  const {
    data: contactsData,
    isLoading: isLoadingContacts,
    isFetching: isFetchingContacts,
  } = useQuery<PagedResult<ContactDealResponse>>({
    queryKey: ['contacts-to-deal', contactPage, debouncedContactSearch],
    queryFn: async () => {
      const res = await api.get('/contacts/to-deals', {
        params: {
          PageNumber: contactPage,
          PageSize: 20,
          SearchTerm: debouncedContactSearch || undefined,
        },
      });
      return res.data?.data || res.data?.value || res.data;
    },
    placeholderData: keepPreviousData,
    enabled: isOpen && !selectedContact,
  });

  const totalContactPages = contactsData?.totalPages || 1;

  useEffect(() => {
    const items = contactsData?.items;
    if (!items) return;

    if (contactPage === 1 || !isScrollAppend.current) {
      setAccumulatedContacts(items);
      return;
    }

    setAccumulatedContacts((prev) => {
      const existingIds = new Set(prev.map((c) => c.contactId));
      const newItems = items.filter((c) => !existingIds.has(c.contactId));
      return [...prev, ...newItems];
    });
  }, [contactsData, contactPage]);

  const handleContactListScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const { scrollTop, scrollHeight, clientHeight } = e.currentTarget;
    const isNearBottom = scrollHeight - scrollTop - clientHeight < 50;

    if (isNearBottom && contactPage < totalContactPages && !isFetchingContacts) {
      isScrollAppend.current = true;
      setContactPage((prev) => prev + 1);
    }
  };

  const { data: availableProducts = [], isLoading: isLoadingProducts } = useQuery<
    ProductItemResponse[]
  >({
    queryKey: ['deal-products-search', debouncedProductSearch],
    queryFn: async () => {
      const res = await api.get('/mailing/products', {
        params: { SearchTerm: debouncedProductSearch, PageSize: 30 },
      });
      return res.data?.data?.items || res.data?.items || [];
    },
    enabled: isProductPickerOpen,
  });

  const resetForm = () => {
    setSelectedContact(null);
    setContactSearch('');
    setCloseDate(undefined);
    setSelectedProducts([]);
    setFormError(null);
    setContactPage(1);
    isScrollAppend.current = false;
  };

  const handleClose = () => {
    if (!isLoading) {
      resetForm();
      onClose();
    }
  };

  const handleAddProduct = (product: ProductItemResponse) => {
    if (selectedProducts.some((p) => p.productId === product.productId)) return;

    const initialPrice = product.promotionalPrice
      ? product.promotionalPrice / 10000
      : (product.stockPrice ?? 0) / 10000;

    setSelectedProducts((prev) => [
      ...prev,
      {
        productId: product.productId,
        name: product.name,
        dimension: product.dimension || product.dimmension,
        quantity: 1,
        unitPrice: initialPrice,
        stockPrice: product.stockPrice,
      },
    ]);
    setIsProductPickerOpen(false);
  };

  const handleUpdateProduct = (
    productId: string,
    field: 'quantity' | 'unitPrice',
    value: number,
  ) => {
    setSelectedProducts((prev) =>
      prev.map((p) => (p.productId === productId ? { ...p, [field]: value } : p)),
    );
  };

  const handleRemoveProduct = (productId: string) => {
    setSelectedProducts((prev) => prev.filter((p) => p.productId !== productId));
  };

  const selectedCurrency = currencies.find((c) => c.currencyId === currencyId);

  const totalDealValue = useMemo(
    () => selectedProducts.reduce((acc, p) => acc + (p.quantity || 0) * (p.unitPrice || 0), 0),
    [selectedProducts],
  );

  const handleSubmit = async (e: React.SyntheticEvent<HTMLFormElement>) => {
    e.preventDefault();
    setFormError(null);

    const validationErrors: string[] = [];
    if (!selectedContact) {
      validationErrors.push('Wybierz kontrahenta / kontakt.');
    }
    if (!currencyId) {
      validationErrors.push('Wybierz walutę.');
    }
    if (!closeDate) {
      validationErrors.push('Wskaż planowaną datę zakończenia transakcji.');
    }
    if (selectedProducts.length === 0) {
      validationErrors.push('Dodaj co najmniej jeden produkt do transakcji.');
    }

    selectedProducts.forEach((p) => {
      if (p.quantity <= 0) {
        validationErrors.push(`Ilość dla pozycji "${p.name}" musi być większa od zera.`);
      }
      if (p.unitPrice < 0) {
        validationErrors.push(`Cena jednostkowa dla "${p.name}" nie może być ujemna.`);
      }
    });

    if (validationErrors.length > 0) {
      setFormError({
        title: getErrorMessage('VALIDATION_ERROR'),
        details: validationErrors,
      });
      return;
    }

    setIsLoading(true);

    const payload: AddDealPayload = {
      companyId: selectedContact!.companyId,
      currencyId: currencyId,
      closeDate: closeDate!.toISOString(),
      contactId: selectedContact!.contactId,
      products: selectedProducts.map((p) => ({
        productId: p.productId,
        quantity: Number(p.quantity),
        unitPrice: Math.round(Number(p.unitPrice) * 10000),
      })),
    };

    try {
      await api.post('/sales', payload);
      resetForm();
      onSuccess();
      onClose();
    } catch (err: unknown) {
      const apiError = err as ApiError;
      const responseData = apiError.response?.data;
      const code = responseData?.errorCode;
      const fallback =
        responseData?.message || apiError.message || 'Wystąpił błąd podczas dodawania transakcji.';

      setFormError({
        title: getErrorMessage(code, fallback),
        details:
          responseData?.errors && responseData.errors.length > 0 ? responseData.errors : undefined,
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-2xl bg-white max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-[#004a8f] text-lg font-semibold">
            Dodaj nową transakcję
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} noValidate className="space-y-5 pt-2">
          {formError && (
            <div className="relative flex items-start gap-2.5 p-4 text-red-800 bg-red-50 border border-red-200 rounded-lg text-sm shadow-xs transition-all text-left">
              <AlertCircle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
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
                <X className="w-4 h-4" />
              </button>
            </div>
          )}

          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">
              Kontrahent / Kontakt *
            </label>
            {selectedContact ? (
              <div className="flex items-center justify-between p-3 border border-gray-300 rounded-md bg-gray-50 text-sm">
                <div>
                  <div className="flex items-center gap-2">
                    <p className="font-semibold text-gray-900">
                      {selectedContact.contactFirstName} {selectedContact.contactLastName}
                    </p>
                    {selectedContact.isPrimary && (
                      <span className="bg-blue-100 text-[#004a8f] px-1.5 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider">
                        Główny
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-gray-600 font-medium">{selectedContact.companyName}</p>
                  <p className="text-xs text-gray-500">NIP: {selectedContact.nip}</p>
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => setSelectedContact(null)}
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
                    placeholder="Wyszukaj kontakt lub firmę..."
                    value={contactSearch}
                    onChange={(e) => setContactSearch(e.target.value)}
                    className="pl-9 h-10 text-sm w-full"
                  />
                </div>

                <div
                  onScroll={handleContactListScroll}
                  className="max-h-56 overflow-y-auto rounded-md border border-gray-200 bg-gray-50 divide-y"
                >
                  {isLoadingContacts && contactPage === 1 ? (
                    <div className="flex h-20 items-center justify-center">
                      <Loader2 className="h-5 w-5 animate-spin text-gray-400" />
                    </div>
                  ) : accumulatedContacts.length === 0 ? (
                    <div className="p-4 text-center text-sm text-gray-500">Brak wyników</div>
                  ) : (
                    <>
                      {accumulatedContacts.map((contact) => (
                        <button
                          type="button"
                          key={contact.contactId}
                          onClick={() => setSelectedContact(contact)}
                          className="w-full text-left p-3 hover:bg-white flex justify-between items-center transition-colors"
                        >
                          <div>
                            <div className="flex items-center gap-2">
                              <p className="text-sm font-medium text-gray-900">
                                {contact.contactFirstName} {contact.contactLastName}
                              </p>
                              {contact.isPrimary && (
                                <span className="bg-blue-100 text-[#004a8f] px-1.5 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider">
                                  Główny
                                </span>
                              )}
                            </div>
                            <p className="text-xs text-gray-500">
                              {contact.companyName} | NIP: {contact.nip}
                            </p>
                          </div>
                          <Plus className="h-4 w-4 text-gray-400 shrink-0" />
                        </button>
                      ))}

                      {isFetchingContacts && contactPage > 1 && (
                        <div className="p-2.5 flex justify-center items-center bg-white">
                          <Loader2 className="h-4 w-4 animate-spin text-gray-400" />
                        </div>
                      )}
                    </>
                  )}
                </div>
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label
                htmlFor="deal-currency"
                className="block text-xs font-medium text-gray-700 mb-1"
              >
                Waluta *
              </label>
              <select
                id="deal-currency"
                value={currencyId}
                onChange={(e) => setCurrencyId(e.target.value)}
                className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-[#004a8f]"
              >
                {currencies.map((c) => (
                  <option key={c.currencyId} value={c.currencyId}>
                    {c.name} ({c.code})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label id="close-date-label" className="block text-xs font-medium text-gray-700 mb-1">
                Planowana data zamknięcia *
              </label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      'w-full justify-start text-left font-normal border-gray-300 h-9 text-sm',
                      !closeDate && 'text-gray-400',
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {closeDate ? format(closeDate, 'PPP', { locale: pl }) : 'Wybierz datę'}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0 bg-white" align="start">
                  <Calendar
                    mode="single"
                    selected={closeDate}
                    onSelect={(date) => setCloseDate(date)}
                  />
                </PopoverContent>
              </Popover>
            </div>
          </div>

          <div className="space-y-3 pt-2 border-t border-gray-100">
            <div className="flex justify-between items-center">
              <label id="products-label" className="block text-xs font-medium text-gray-700">
                Pozycje transakcji *
              </label>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setIsProductPickerOpen(true)}
                className="text-xs border-[#004a8f] text-[#004a8f] hover:bg-blue-50"
              >
                <Plus className="mr-1 h-3.5 w-3.5" /> Dodaj produkt
              </Button>
            </div>

            {selectedProducts.length === 0 ? (
              <p className="text-xs text-center py-6 text-gray-400 border border-dashed border-gray-200 rounded-md">
                Brak dodanych produktów. Kliknij przycisk powyżej, aby dodać pozycję.
              </p>
            ) : (
              <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
                {selectedProducts.map((p) => (
                  <div
                    key={p.productId}
                    className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3 bg-gray-50 border border-gray-200 rounded-lg text-sm"
                  >
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-gray-900 truncate">{p.name}</p>
                      {p.dimension && <p className="text-xs text-gray-500">{p.dimension}</p>}
                    </div>

                    <div className="flex items-center gap-3 shrink-0">
                      <div className="flex items-center gap-1.5">
                        <span className="text-xs text-gray-500">Ilość:</span>
                        <Input
                          type="number"
                          min={1}
                          value={p.quantity}
                          onChange={(e) =>
                            handleUpdateProduct(p.productId, 'quantity', Number(e.target.value))
                          }
                          className="w-16 h-8 text-xs bg-white"
                        />
                      </div>

                      <div className="flex items-center gap-1.5">
                        <span className="text-xs text-gray-500">Cena:</span>
                        <Input
                          type="number"
                          step="0.01"
                          min={0}
                          value={p.unitPrice}
                          onChange={(e) =>
                            handleUpdateProduct(p.productId, 'unitPrice', Number(e.target.value))
                          }
                          className="w-24 h-8 text-xs bg-white font-medium"
                        />
                      </div>

                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => handleRemoveProduct(p.productId)}
                        className="text-red-500 hover:text-red-700 h-8 w-8 p-0 shrink-0"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            <div className="flex justify-between items-center p-3 bg-blue-50 border border-blue-100 rounded-md text-sm font-semibold text-[#004a8f]">
              <span>Łączna wartość:</span>
              <span>
                {formatCurrency(
                  totalDealValue * 10000,
                  selectedCurrency?.code || 'PLN',
                  selectedCurrency?.decimalPlace ?? 2,
                )}
              </span>
            </div>
          </div>

          <DialogFooter className="pt-3">
            <Button
              type="button"
              variant="outline"
              onClick={handleClose}
              disabled={isLoading}
              className="border-gray-300 text-gray-700"
            >
              Anuluj
            </Button>
            <Button
              type="submit"
              disabled={isLoading}
              className="bg-[#004a8f] text-white hover:bg-[#003870]"
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Zapisywanie...
                </>
              ) : (
                'Utwórz transakcję'
              )}
            </Button>
          </DialogFooter>
        </form>

        {isProductPickerOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
            <div className="w-full max-w-lg rounded-xl bg-white p-6 shadow-xl space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-medium text-[#004a8f]">Wybierz produkt</h3>
                <button
                  type="button"
                  onClick={() => setIsProductPickerOpen(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  type="text"
                  placeholder="Wyszukaj produkt po nazwie..."
                  value={productSearch}
                  onChange={(e) => setProductSearch(e.target.value)}
                  className="pl-9 h-10 w-full"
                />
              </div>

              <div className="max-h-64 overflow-y-auto rounded-md border border-gray-200 bg-gray-50">
                {isLoadingProducts ? (
                  <div className="flex h-20 items-center justify-center">
                    <Loader2 className="h-5 w-5 animate-spin text-gray-400" />
                  </div>
                ) : availableProducts.length === 0 ? (
                  <div className="p-4 text-center text-sm text-gray-500">Brak produktów</div>
                ) : (
                  availableProducts.map((product) => (
                    <button
                      type="button"
                      key={product.productId}
                      onClick={() => handleAddProduct(product)}
                      className="flex w-full items-center justify-between border-b border-gray-200 bg-white p-3 text-left hover:bg-gray-50 last:border-0"
                    >
                      <div>
                        <p className="text-sm font-bold text-gray-900">{product.name}</p>
                        <div className="mt-1 flex items-center gap-2 text-xs text-gray-500">
                          {(product.dimension || product.dimmension) && (
                            <span>{product.dimension || product.dimmension}</span>
                          )}
                          <span>•</span>
                          <span className="font-medium text-[#004a8f]">
                            {formatCurrency(
                              product.promotionalPrice ?? product.stockPrice,
                              selectedCurrency?.code || 'PLN',
                              2,
                            )}
                          </span>
                        </div>
                      </div>
                      <Plus className="h-5 w-5 text-gray-400" />
                    </button>
                  ))
                )}
              </div>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
