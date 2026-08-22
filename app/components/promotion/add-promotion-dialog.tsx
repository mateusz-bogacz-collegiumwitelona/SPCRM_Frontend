import React, { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { api } from '~/api/api';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '~/components/ui/dialog';
import { Button } from '~/components/ui/button';
import { AlertCircle, Loader2, Calendar as CalendarIcon, X } from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from '~/components/ui/popover';
import { Calendar } from '~/components/ui/calendar';
import { format } from 'date-fns';
import { pl } from 'date-fns/locale';
import { cn } from '~/utils/utils';

export interface AddPromotionRequestPayload {
  name: string;
  productId: string;
  startDate?: string | null;
  endDate?: string | null;
  discountPercentage?: number | null;
  promotionalPrice?: number | null;
  currencyId?: string | null;
  contactId?: string | null;
  minQuantity?: number | null;
  minWeight?: number | null;
}

interface ProductOption {
  productId: string;
  name: string;
  dimmension: string;
  stockPrice: number;
}

interface CurrencyOption {
  currencyId: string;
  name: string;
  code: string;
  decimalPlace: number;
}

interface ContactOption {
  contactId: string;
  contactFirstName: string;
  contactLastName: string;
  companyName: string;
}

interface AddPromotionDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (payload: AddPromotionRequestPayload) => Promise<void>;
  isLoading: boolean;
}

export const AddPromotionDialog: React.FC<AddPromotionDialogProps> = ({
  isOpen,
  onClose,
  onSave,
  isLoading,
}) => {
  const [name, setName] = useState('');
  const [productId, setProductId] = useState('');
  const [discountType, setDiscountType] = useState<'percentage' | 'fixed'>('percentage');
  const [discountPercentage, setDiscountPercentage] = useState('');
  const [promotionalPrice, setPromotionalPrice] = useState('');
  const [currencyId, setCurrencyId] = useState('');
  const [contactId, setContactId] = useState('');
  const [startDate, setStartDate] = useState<Date | undefined>();
  const [endDate, setEndDate] = useState<Date | undefined>();
  const [minQuantity, setMinQuantity] = useState('');
  const [minWeight, setMinWeight] = useState('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const { data: products = [] } = useQuery<ProductOption[]>({
    queryKey: ['mailing-products-list'],
    queryFn: async () => {
      const res = await api.get('/mailing/products', { params: { PageNumber: 1, PageSize: 100 } });
      return res.data?.data?.items || [];
    },
    enabled: isOpen,
  });

  const { data: currencies = [] } = useQuery<CurrencyOption[]>({
    queryKey: ['currencies-simple'],
    queryFn: async () => {
      const res = await api.get('/currency/simple');
      return res.data?.data || [];
    },
    enabled: isOpen,
  });

  const { data: contacts = [] } = useQuery<ContactOption[]>({
    queryKey: ['mailing-contacts-list'],
    queryFn: async () => {
      const res = await api.get('/mailing/contacts', { params: { PageNumber: 1, PageSize: 100 } });
      return res.data?.data?.items || [];
    },
    enabled: isOpen,
  });

  useEffect(() => {
    if (isOpen) {
      setName('');
      setProductId('');
      setDiscountType('percentage');
      setDiscountPercentage('');
      setPromotionalPrice('');
      setContactId('');
      setStartDate(undefined);
      setEndDate(undefined);
      setMinQuantity('');
      setMinWeight('');
      setErrorMessage(null);
    }
  }, [isOpen]);

  useEffect(() => {
    if (currencies.length > 0 && !currencyId) {
      setCurrencyId(currencies[0].currencyId);
    }
  }, [currencies, currencyId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!name.trim()) {
      setErrorMessage('Nazwa promocji jest wymagana.');
      return;
    }

    if (!productId) {
      setErrorMessage('Wybierz produkt objęty promocją.');
      return;
    }

    if (startDate && endDate && endDate < startDate) {
      setErrorMessage('Data zakończenia nie może być wcześniejsza niż data rozpoczęcia.');
      return;
    }

    const payload: AddPromotionRequestPayload = {
      name: name.trim(),
      productId,
      startDate: startDate ? startDate.toISOString() : null,
      endDate: endDate ? endDate.toISOString() : null,
      contactId: contactId ? contactId : null,
      minQuantity: minQuantity ? Number(minQuantity) : null,
      minWeight: minWeight ? Math.round(Number(minWeight) * 1000) : null,
    };

    if (discountType === 'percentage') {
      const parsed = Number.parseFloat(discountPercentage);
      if (Number.isNaN(parsed) || parsed <= 0 || parsed > 100) {
        setErrorMessage('Podaj poprawny rabat procentowy (1-100%).');
        return;
      }
      payload.discountPercentage = parsed;
      payload.promotionalPrice = null;
      payload.currencyId = null;
    } else {
      const parsedPrice = Number.parseFloat(promotionalPrice);
      if (Number.isNaN(parsedPrice) || parsedPrice <= 0) {
        setErrorMessage('Podaj poprawną cenę promocyjną.');
        return;
      }
      if (!currencyId) {
        setErrorMessage('Wybierz walutę dla ceny promocyjnej.');
        return;
      }
      payload.promotionalPrice = Math.round(parsedPrice * 100);
      payload.currencyId = currencyId;
      payload.discountPercentage = null;
    }

    await onSave(payload);
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && !isLoading && onClose()}>
      <DialogContent className="sm:max-w-175 max-h-[90vh] overflow-y-auto">
        <DialogHeader className="border-b border-gray-100 pb-4">
          <DialogTitle className="text-xl font-normal text-blue-900">
            Utwórz nową promocję
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-5 py-4">
          {errorMessage && (
            <div className="flex items-center gap-2 p-3 text-red-700 bg-red-50 border border-red-200 rounded-lg text-sm">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <p>{errorMessage}</p>
            </div>
          )}

          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-gray-700">Nazwa promocji *</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="np. Wiosenna Zniżka na Rury Precyzyjne"
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-blue-900"
              required
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-gray-700">Produkt *</label>
            <select
              value={productId}
              onChange={(e) => setProductId(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-blue-900 bg-white"
              required
            >
              <option value="">-- Wybierz produkt --</option>
              {products.map((p) => (
                <option key={p.productId} value={p.productId}>
                  {p.name} ({p.dimmension})
                </option>
              ))}
            </select>
          </div>

          <div className="p-4 bg-gray-50 border border-gray-200 rounded-lg space-y-4">
            <div className="flex items-center gap-6 border-b border-gray-200 pb-3">
              <label className="flex items-center gap-2 text-sm font-medium text-gray-800 cursor-pointer">
                <input
                  type="radio"
                  name="addDiscountType"
                  checked={discountType === 'percentage'}
                  onChange={() => setDiscountType('percentage')}
                  className="text-blue-900 focus:ring-blue-900"
                />
                Rabat procentowy (%)
              </label>
              <label className="flex items-center gap-2 text-sm font-medium text-gray-800 cursor-pointer">
                <input
                  type="radio"
                  name="addDiscountType"
                  checked={discountType === 'fixed'}
                  onChange={() => setDiscountType('fixed')}
                  className="text-blue-900 focus:ring-blue-900"
                />
                Sztywna cena jednostkowa
              </label>
            </div>

            {discountType === 'percentage' ? (
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-gray-700">Wysokość rabatu (%) *</label>
                <input
                  type="number"
                  min="1"
                  max="100"
                  step="0.01"
                  value={discountPercentage}
                  onChange={(e) => setDiscountPercentage(e.target.value)}
                  placeholder="np. 15"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-blue-900 bg-white"
                  required
                />
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-gray-700">Cena promocyjna *</label>
                  <input
                    type="number"
                    min="0.01"
                    step="0.01"
                    value={promotionalPrice}
                    onChange={(e) => setPromotionalPrice(e.target.value)}
                    placeholder="np. 125.50"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-blue-900 bg-white"
                    required
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-gray-700">Waluta *</label>
                  <select
                    value={currencyId}
                    onChange={(e) => setCurrencyId(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-blue-900 bg-white"
                    required
                  >
                    {currencies.map((c) => (
                      <option key={c.currencyId} value={c.currencyId}>
                        {c.code} ({c.name})
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <div className="flex justify-between items-center">
                <label className="text-xs font-semibold text-gray-700">Data rozpoczęcia</label>
                {startDate && (
                  <button
                    type="button"
                    onClick={() => setStartDate(undefined)}
                    className="text-[10px] text-gray-500 hover:text-red-600 flex items-center gap-0.5"
                  >
                    <X className="w-3 h-3" /> Wyczyść
                  </button>
                )}
              </div>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      'w-full justify-start text-left font-normal border-gray-300 text-sm py-2 h-auto',
                      !startDate && 'text-gray-500',
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4 shrink-0" />
                    {startDate ? (
                      format(startDate, 'dd MMMM yyyy', { locale: pl })
                    ) : (
                      <span>Od teraz</span>
                    )}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0 z-100" align="start">
                  <Calendar
                    mode="single"
                    selected={startDate}
                    onSelect={setStartDate}
                    initialFocus
                    locale={pl}
                  />
                </PopoverContent>
              </Popover>
            </div>

            <div className="space-y-1.5">
              <div className="flex justify-between items-center">
                <label className="text-xs font-semibold text-gray-700">Data zakończenia</label>
                {endDate && (
                  <button
                    type="button"
                    onClick={() => setEndDate(undefined)}
                    className="text-[10px] text-gray-500 hover:text-red-600 flex items-center gap-0.5"
                  >
                    <X className="w-3 h-3" /> Wyczyść
                  </button>
                )}
              </div>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      'w-full justify-start text-left font-normal border-gray-300 text-sm py-2 h-auto',
                      !endDate && 'text-gray-500',
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4 shrink-0" />
                    {endDate ? (
                      format(endDate, 'dd MMMM yyyy', { locale: pl })
                    ) : (
                      <span>Do odwołania</span>
                    )}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0 z-100" align="start">
                  <Calendar
                    mode="single"
                    selected={endDate}
                    onSelect={setEndDate}
                    initialFocus
                    locale={pl}
                  />
                </PopoverContent>
              </Popover>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-gray-700">
                Minimalny wolumen (szt.)
              </label>
              <input
                type="number"
                min="1"
                value={minQuantity}
                onChange={(e) => setMinQuantity(e.target.value)}
                placeholder="Brak limitu"
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-blue-900"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-gray-700">Minimalna waga (kg)</label>
              <input
                type="number"
                min="0.1"
                step="0.1"
                value={minWeight}
                onChange={(e) => setMinWeight(e.target.value)}
                placeholder="Brak limitu"
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-blue-900"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-gray-700">Dedykowany klient</label>
            <select
              value={contactId}
              onChange={(e) => setContactId(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-blue-900 bg-white"
            >
              <option value="">Promocja ogólna (dla wszystkich klientów)</option>
              {contacts.map((c) => (
                <option key={c.contactId} value={c.contactId}>
                  {c.contactFirstName} {c.contactLastName} ({c.companyName})
                </option>
              ))}
            </select>
          </div>

          <DialogFooter className="pt-4 border-t border-gray-100 flex justify-end gap-3">
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
              type="submit"
              disabled={isLoading}
              className="bg-blue-900 text-white hover:bg-blue-800 flex items-center gap-2"
            >
              {isLoading && <Loader2 className="w-4 h-4 animate-spin" />}
              Utwórz promocję
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};
