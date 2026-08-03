import React, { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { api } from '~/api/api';
import { X, Search, Plus, Loader2 } from 'lucide-react';
import { Button } from '~/components/ui/button';
import { Input } from '~/components/ui/input';
import { MainLayout } from '~/components/layout/main-layout';
import { AuthGuard } from '~/lib/auth-guard';
import { RoleGuard } from '~/lib/role-guard';
import type ApiError from '~/interfaces/apiError';
import { getErrorMessage } from '~/utils/error-mapper';
import { formatCurrency } from '~/utils/currency-formatter';

interface MailingClientResponse {
  companyName: string;
  nip: string;
  contactFirstName: string;
  contactLastName: string;
  contactId: string;
}

interface MailingProductResponse {
  productId: string;
  name: string;
  dimmension: string;
  stockQuantity: number;
  stockPrice: number;
  promotionalPrice?: number;
}

interface SelectedProduct {
  productId: string;
  name: string;
  dimmension: string;
  price: number;
  quantity: number;
}

export default function MailingCreator() {
  const [contactSearch, setContactSearch] = useState('');
  const [debouncedContactSearch, setDebouncedContactSearch] = useState('');
  const [selectedContacts, setSelectedContacts] = useState<string[]>([]);

  const [selectedProducts, setSelectedProducts] = useState<SelectedProduct[]>([]);
  const [isProductModalOpen, setIsProductModalOpen] = useState(false);
  const [productSearch, setProductSearch] = useState('');
  const [debouncedProductSearch, setDebouncedProductSearch] = useState('');

  const [language, setLanguage] = useState('pl');

  const [isSending, setIsSending] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    const handler = setTimeout(() => setDebouncedContactSearch(contactSearch), 300);
    return () => clearTimeout(handler);
  }, [contactSearch]);

  useEffect(() => {
    const handler = setTimeout(() => setDebouncedProductSearch(productSearch), 300);
    return () => clearTimeout(handler);
  }, [productSearch]);

  const { data: contactsData, isLoading: isLoadingContacts } = useQuery({
    queryKey: ['mailing-contacts', debouncedContactSearch],
    queryFn: async () => {
      const response = await api.get('/mailing/contacts', {
        params: { SearchTerm: debouncedContactSearch, PageSize: 50 },
      });
      return response.data?.data?.items || response.data?.items || [];
    },
  });

  const { data: productsData, isLoading: isLoadingProducts } = useQuery({
    queryKey: ['mailing-products', debouncedProductSearch],
    queryFn: async () => {
      const response = await api.get('/mailing/products', {
        params: { SearchTerm: debouncedProductSearch, PageSize: 50 },
      });
      return response.data?.data?.items || response.data?.items || [];
    },
    enabled: isProductModalOpen,
  });

  const toggleContact = (contactId: string) => {
    setSelectedContacts((prev) =>
      prev.includes(contactId) ? prev.filter((id) => id !== contactId) : [...prev, contactId],
    );
  };

  const addProduct = (product: MailingProductResponse) => {
    if (selectedProducts.some((p) => p.productId === product.productId)) return;

    const initialPrice = product.promotionalPrice
      ? product.promotionalPrice / 10000
      : product.stockPrice / 10000;

    setSelectedProducts((prev) => [
      ...prev,
      {
        productId: product.productId,
        name: product.name,
        dimmension: product.dimmension,
        price: initialPrice,
        quantity: 1,
      },
    ]);
    setIsProductModalOpen(false);
  };

  const removeProduct = (productId: string) => {
    setSelectedProducts((prev) => prev.filter((p) => p.productId !== productId));
  };

  const updateProductAttribute = (
    productId: string,
    field: 'price' | 'quantity',
    value: number,
  ) => {
    setSelectedProducts((prev) =>
      prev.map((p) => (p.productId === productId ? { ...p, [field]: value } : p)),
    );
  };

  // Wysyłanie formularza
  const handleSubmit = async () => {
    setErrorMsg('');
    setSuccessMsg('');

    if (selectedContacts.length === 0) {
      setErrorMsg('Wybierz przynajmniej jednego odbiorcę.');
      return;
    }
    if (selectedProducts.length === 0) {
      setErrorMsg('Wybierz przynajmniej jeden produkt.');
      return;
    }

    setIsSending(true);
    try {
      const payload = {
        to: selectedContacts,
        language: language,
        products: selectedProducts.map((p) => ({
          productId: p.productId,
          quantity: p.quantity,
          price: Math.round(p.price * 10000),
          currencyCode: 'PLN',
        })),
      };

      await api.post('/mailing/offert', payload);
      setSuccessMsg('Mailing został poprawnie wysłany, a oferty zapisane.');

      setSelectedContacts([]);
      setSelectedProducts([]);
      setLanguage('pl');
    } catch (error_: unknown) {
      const err = error_ as ApiError;
      setErrorMsg(
        err.response?.data?.message ||
          getErrorMessage(err.response?.data?.errorCode) ||
          'Błąd podczas wysyłania mailingu.',
      );
    } finally {
      setIsSending(false);
    }
  };

  return (
    <AuthGuard>
      <RoleGuard allowedRoles={['User', 'Manager']}>
        <MainLayout>
          <div className="mx-auto max-w-2xl pb-16 pt-6">
            <h1 className="mb-6 text-2xl font-semibold text-[#004a8f]">Kreator Mailingu</h1>

            {errorMsg && (
              <div className="mb-4 rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700">
                {errorMsg}
              </div>
            )}
            {successMsg && (
              <div className="mb-4 rounded-md border border-green-200 bg-green-50 p-3 text-sm text-green-700">
                {successMsg}
              </div>
            )}

            <div className="mb-6 overflow-hidden rounded-lg border border-gray-300 bg-white shadow-sm">
              <div className="border-b border-gray-200 px-4 py-3">
                <h2 className="text-lg font-medium text-[#004a8f]">1. Wybierz odbiorców</h2>
              </div>
              <div className="p-4">
                <div className="relative mb-4">
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                  <Input
                    type="text"
                    placeholder="Wyszukaj ..."
                    value={contactSearch}
                    onChange={(e) => setContactSearch(e.target.value)}
                    className="pl-9 h-10 w-full"
                  />
                </div>

                <div className="max-h-60 overflow-y-auto rounded-md border border-gray-200 bg-gray-50">
                  {isLoadingContacts ? (
                    <div className="flex h-20 items-center justify-center">
                      <Loader2 className="h-5 w-5 animate-spin text-gray-400" />
                    </div>
                  ) : contactsData?.length === 0 ? (
                    <div className="p-4 text-center text-sm text-gray-500">Brak wyników</div>
                  ) : (
                    contactsData.map((client: MailingClientResponse) => (
                      <label
                        key={client.contactId}
                        className="flex cursor-pointer items-start gap-3 border-b border-gray-200 p-3 hover:bg-white last:border-0"
                      >
                        <input
                          type="checkbox"
                          className="mt-1 h-4 w-4 rounded border-gray-300 text-[#004a8f] focus:ring-[#004a8f]"
                          checked={selectedContacts.includes(client.contactId)}
                          onChange={() => toggleContact(client.contactId)}
                        />
                        <div>
                          <p className="text-sm font-medium text-gray-900">{client.companyName}</p>
                          <p className="text-xs text-gray-500">
                            NIP: {client.nip} | {client.contactFirstName} {client.contactLastName}
                          </p>
                        </div>
                      </label>
                    ))
                  )}
                </div>
              </div>
            </div>

            <div className="mb-6 overflow-hidden rounded-lg border border-gray-300 bg-white shadow-sm">
              <div className="border-b border-gray-200 px-4 py-3">
                <h2 className="text-lg font-medium text-[#004a8f]">2. Oferta produktowa</h2>
              </div>
              <div className="p-4">
                {selectedProducts.length > 0 && (
                  <div className="mb-4 space-y-3">
                    {selectedProducts.map((p) => (
                      <div
                        key={p.productId}
                        className="relative rounded-lg border border-gray-200 bg-gray-50 p-4"
                      >
                        <button
                          onClick={() => removeProduct(p.productId)}
                          className="absolute right-3 top-3 text-red-500 hover:text-red-700"
                        >
                          <X className="h-5 w-5" />
                        </button>
                        <h3 className="pr-8 text-sm font-bold text-gray-900">{p.name}</h3>
                        <p className="mb-4 text-xs text-gray-500">{p.dimmension}</p>

                        <div className="flex flex-wrap items-center gap-4">
                          <div className="flex items-center gap-2">
                            <span className="text-sm text-gray-600">Ilość:</span>
                            <Input
                              type="number"
                              min={1}
                              value={p.quantity}
                              onChange={(e) =>
                                updateProductAttribute(
                                  p.productId,
                                  'quantity',
                                  Number(e.target.value),
                                )
                              }
                              className="h-8 w-20 bg-white px-2 py-1 text-sm"
                            />
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="text-sm text-gray-600">Cena promocyjna:</span>
                            <Input
                              type="number"
                              step="0.01"
                              value={p.price}
                              onChange={(e) =>
                                updateProductAttribute(p.productId, 'price', Number(e.target.value))
                              }
                              className="h-8 w-24 bg-white px-2 py-1 text-sm font-medium"
                            />
                            <span className="text-sm font-bold text-gray-900">PLN</span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                <Button
                  onClick={() => setIsProductModalOpen(true)}
                  className="w-full bg-[#004a8f] hover:bg-[#003870]"
                >
                  Dodaj nowy produkt
                </Button>
              </div>
            </div>

            <div className="mb-8 overflow-hidden rounded-lg border border-gray-300 bg-white shadow-sm">
              <div className="border-b border-gray-200 px-4 py-3">
                <h2 className="text-lg font-medium text-[#004a8f]">3. Ustawienia wiadomości</h2>
              </div>
              <div className="p-4">
                <label className="mb-2 block text-sm text-gray-700">Wybierz język szablonu</label>
                <select
                  value={language}
                  onChange={(e) => setLanguage(e.target.value)}
                  className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-[#004a8f]"
                >
                  <option value="pl">Polski (PL)</option>
                  <option value="en">English (EN)</option>
                </select>
              </div>
            </div>

            <Button
              onClick={handleSubmit}
              disabled={isSending}
              className="h-12 w-full text-base bg-[#004a8f] hover:bg-[#003870]"
            >
              {isSending ? (
                <>
                  <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                  Wysyłanie...
                </>
              ) : (
                'Wyślij'
              )}
            </Button>
          </div>

          {isProductModalOpen && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
              <div className="w-full max-w-lg rounded-xl bg-white p-6 shadow-xl">
                <div className="mb-4 flex items-center justify-between">
                  <h3 className="text-lg font-medium text-[#004a8f]">Wybierz produkt</h3>
                  <button
                    onClick={() => setIsProductModalOpen(false)}
                    className="text-gray-400 hover:text-gray-600"
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
                  {isLoadingProducts ? (
                    <div className="flex h-20 items-center justify-center">
                      <Loader2 className="h-5 w-5 animate-spin text-gray-400" />
                    </div>
                  ) : productsData?.length === 0 ? (
                    <div className="p-4 text-center text-sm text-gray-500">Brak produktów</div>
                  ) : (
                    productsData?.map((product: MailingProductResponse) => (
                      <button
                        key={product.productId}
                        onClick={() => addProduct(product)}
                        className="flex w-full items-center justify-between border-b border-gray-200 bg-white p-3 text-left hover:bg-gray-50 last:border-0"
                      >
                        <div>
                          <p className="text-sm font-bold text-gray-900">{product.name}</p>
                          <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-gray-500">
                            <span>{product.dimmension}</span>
                            <span>•</span>
                            {product.promotionalPrice ? (
                              <div className="flex items-center gap-2">
                                <span className="font-medium text-gray-400 line-through">
                                  {formatCurrency(product.stockPrice)} PLN
                                </span>
                                <span className="font-bold text-red-600">
                                  {formatCurrency(product.promotionalPrice)} PLN
                                </span>
                                <span className="bg-red-100 text-red-700 px-1.5 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider">
                                  Promocja
                                </span>
                              </div>
                            ) : (
                              <span className="font-medium text-[#004a8f]">
                                Cena bazowa: {formatCurrency(product.stockPrice)} PLN
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
          )}
        </MainLayout>
      </RoleGuard>
    </AuthGuard>
  );
}
