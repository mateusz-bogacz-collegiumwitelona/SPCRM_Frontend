import React, { useEffect, useState } from 'react';
import { AlertCircle, Loader2, Search, X } from 'lucide-react';
import { Button } from '~/components/ui/button';
import { Input } from '~/components/ui/input';
import { MainLayout } from '~/components/layout/main-layout';
import { AuthGuard } from '~/lib/auth-guard';
import { RoleGuard } from '~/lib/role-guard';
import type { FormErrorState } from '~/types/api-error';
import { getErrorMessage } from '~/utils/error-mapper';
import { formatCurrency } from '~/utils/data-formatters';
import { STANDARD_ROLES } from '~/constants/roles';
import { useMailingContacts, useMailingCurrencies, useSendMailing } from '~/hooks/use-mailing';
import { SelectProductDialog } from '~/components/mailing/select-product-dialog';
import type { MailingProductResponse } from '~/types/mailing';

interface SelectedProduct {
  productId: string;
  name: string;
  dimmension: string;
  price: number;
  quantity: number;
  stockPrice: number;
}

export default function MailingCreator() {
  const [contactSearch, setContactSearch] = useState('');
  const [debouncedContactSearch, setDebouncedContactSearch] = useState('');
  const [selectedContacts, setSelectedContacts] = useState<string[]>([]);

  const [selectedProducts, setSelectedProducts] = useState<SelectedProduct[]>([]);
  const [isProductModalOpen, setIsProductModalOpen] = useState(false);

  const [language, setLanguage] = useState('pl');
  const [currencyCode, setCurrencyCode] = useState('PLN');
  const [successMsg, setSuccessMsg] = useState('');
  const [formError, setFormError] = useState<FormErrorState | null>(null);

  useEffect(() => {
    const handler = setTimeout(() => setDebouncedContactSearch(contactSearch), 300);
    return () => clearTimeout(handler);
  }, [contactSearch]);

  const { data: currencies = [] } = useMailingCurrencies();
  const { data: contactsData = [], isLoading: isLoadingContacts } =
    useMailingContacts(debouncedContactSearch);

  const sendMailingMutation = useSendMailing({
    onSuccess: () => {
      setSuccessMsg('Mailing został poprawnie wysłany, a oferty zapisane.');
      setSelectedContacts([]);
      setSelectedProducts([]);
      setLanguage('pl');
    },
    onError: (parsedError) => {
      setFormError(parsedError);
    },
  });

  const toggleContact = (contactId: string) => {
    setSelectedContacts((prev) =>
      prev.includes(contactId) ? prev.filter((id) => id !== contactId) : [...prev, contactId],
    );
  };

  const handleAddProduct = (product: MailingProductResponse) => {
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
        stockPrice: product.stockPrice,
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

  const handleSubmit = () => {
    setFormError(null);
    setSuccessMsg('');

    const validationErrors: string[] = [];
    if (selectedContacts.length === 0) {
      validationErrors.push('Wybierz przynajmniej jednego odbiorcę.');
    }
    if (selectedProducts.length === 0) {
      validationErrors.push('Wybierz przynajmniej jeden produkt.');
    }

    selectedProducts.forEach((p) => {
      if (p.quantity <= 0) {
        validationErrors.push(`Ilość dla produktu "${p.name}" musi być większa od 0.`);
      }
      if (p.price < 0) {
        validationErrors.push(`Cena promocyjna dla produktu "${p.name}" nie może być ujemna.`);
      }
    });

    if (validationErrors.length > 0) {
      setFormError({
        title: getErrorMessage('VALIDATION_ERROR'),
        details: validationErrors,
      });
      return;
    }

    sendMailingMutation.mutate({
      to: selectedContacts,
      language: language,
      products: selectedProducts.map((p) => ({
        productId: p.productId,
        quantity: p.quantity,
        price: Math.round(p.price * 10000),
        currencyCode: currencyCode,
      })),
    });
  };

  return (
    <AuthGuard>
      <RoleGuard allowedRoles={STANDARD_ROLES}>
        <MainLayout>
          <div className="mx-auto max-w-2xl pb-16 pt-6">
            <h1 className="mb-6 text-2xl font-semibold text-brand">Kreator Mailingu</h1>

            {formError && (
              <div className="mb-4 relative flex items-start gap-2.5 p-4 text-red-800 bg-red-50 border border-red-200 rounded-lg text-sm shadow-xs transition-all text-left">
                <AlertCircle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
                <div className="flex-1 pr-4">
                  <p className="font-medium leading-tight">{formError.title}</p>
                  {formError.details && (
                    <ul className="mt-1.5 list-disc list-inside space-y-0.5 text-xs text-red-700">
                      {formError.details.map((detailErr, idx) => (
                        <li key={`${detailErr}-${idx}`}>{detailErr}</li>
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

            {successMsg && (
              <div className="mb-4 rounded-md border border-green-200 bg-green-50 p-3 text-sm text-green-700">
                {successMsg}
              </div>
            )}

            <div className="mb-6 overflow-hidden rounded-lg border border-gray-300 bg-white shadow-sm">
              <div className="border-b border-gray-200 px-4 py-3">
                <h2 className="text-lg font-medium text-brand">1. Wybierz odbiorców</h2>
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
                  ) : contactsData.length === 0 ? (
                    <div className="p-4 text-center text-sm text-gray-500">Brak wyników</div>
                  ) : (
                    contactsData.map((client) => {
                      const checkboxId = `contact-checkbox-${client.contactId}`;
                      return (
                        <label
                          htmlFor={checkboxId}
                          key={client.contactId}
                          className="flex cursor-pointer items-start gap-3 border-b border-gray-200 p-3 hover:bg-white last:border-0"
                        >
                          <input
                            id={checkboxId}
                            type="checkbox"
                            className="mt-1 h-4 w-4 rounded border-gray-300 text-brand focus:ring-brand"
                            checked={selectedContacts.includes(client.contactId)}
                            onChange={() => toggleContact(client.contactId)}
                          />
                          <span className="flex flex-col">
                            <span className="text-sm font-medium text-gray-900">
                              {client.companyName}
                            </span>
                            <span className="text-xs text-gray-500">
                              NIP: {client.nip} | {client.contactFirstName} {client.contactLastName}
                            </span>
                          </span>
                        </label>
                      );
                    })
                  )}
                </div>
              </div>
            </div>

            <div className="mb-6 overflow-hidden rounded-lg border border-gray-300 bg-white shadow-sm">
              <div className="border-b border-gray-200 px-4 py-3">
                <h2 className="text-lg font-medium text-brand">2. Oferta produktowa</h2>
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
                          type="button"
                          onClick={() => removeProduct(p.productId)}
                          className="absolute right-3 top-3 text-red-500 hover:text-red-700 cursor-pointer"
                        >
                          <X className="h-5 w-5" />
                        </button>
                        <h3 className="pr-8 text-sm font-bold text-gray-900">{p.name}</h3>
                        <p className="mb-2 text-xs text-gray-500">{p.dimmension}</p>

                        <p className="mb-4 text-xs text-gray-600 font-medium">
                          Cena bazowa w systemie:{' '}
                          <span className="text-gray-900">
                            {formatCurrency(p.stockPrice, 'PLN', 2)}
                          </span>
                        </p>

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
                            <span className="text-sm text-gray-600">Cena promocyjna oferty:</span>
                            <Input
                              type="number"
                              step="0.01"
                              value={p.price}
                              onChange={(e) =>
                                updateProductAttribute(p.productId, 'price', Number(e.target.value))
                              }
                              className="h-8 w-24 bg-white px-2 py-1 text-sm font-medium"
                            />
                            <span className="text-sm font-bold text-brand">{currencyCode}</span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                <Button
                  type="button"
                  onClick={() => setIsProductModalOpen(true)}
                  className="w-full bg-brand hover:bg-brand-hover"
                >
                  Dodaj nowy produkt
                </Button>
              </div>
            </div>

            <div className="mb-8 overflow-hidden rounded-lg border border-gray-300 bg-white shadow-sm">
              <div className="border-b border-gray-200 px-4 py-3">
                <h2 className="text-lg font-medium text-brand">
                  3. Ustawienia wiadomości i waluty
                </h2>
              </div>
              <div className="p-4 space-y-4">
                <div>
                  <label htmlFor="mailing-lang" className="mb-2 block text-sm text-gray-700">
                    Wybierz język szablonu
                  </label>
                  <select
                    id="mailing-lang"
                    value={language}
                    onChange={(e) => setLanguage(e.target.value)}
                    className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-brand"
                  >
                    <option value="pl">Polski (PL)</option>
                    <option value="en">English (EN)</option>
                  </select>
                </div>

                <div>
                  <label htmlFor="mailing-currency" className="mb-2 block text-sm text-gray-700">
                    Waluta oferty
                  </label>
                  <select
                    id="mailing-currency"
                    value={currencyCode}
                    onChange={(e) => setCurrencyCode(e.target.value)}
                    className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-brand"
                  >
                    {currencies.map((curr) => (
                      <option key={curr.currencyId} value={curr.code}>
                        {curr.name} ({curr.code})
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            <Button
              type="button"
              onClick={handleSubmit}
              disabled={sendMailingMutation.isPending}
              className="h-12 w-full text-base bg-brand hover:bg-brand-hover flex items-center justify-center gap-2"
            >
              {sendMailingMutation.isPending ? (
                <>
                  <Loader2 className="h-5 w-5 animate-spin" />
                  Wysyłanie...
                </>
              ) : (
                'Wyślij'
              )}
            </Button>
          </div>

          <SelectProductDialog
            isOpen={isProductModalOpen}
            onClose={() => setIsProductModalOpen(false)}
            onSelectProduct={handleAddProduct}
          />
        </MainLayout>
      </RoleGuard>
    </AuthGuard>
  );
}
