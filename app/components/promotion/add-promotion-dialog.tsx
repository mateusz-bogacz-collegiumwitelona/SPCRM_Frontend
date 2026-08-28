import React, { useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { api } from '~/api/api';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '~/components/ui/dialog';
import { Button } from '~/components/ui/button';
import { AlertCircle, Calendar as CalendarIcon, Loader2, X } from 'lucide-react';
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
  dimension: string;
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
  readonly isOpen: boolean;
  readonly onClose: () => void;
  readonly onSave: (payload: AddPromotionRequestPayload) => Promise<void>;
  readonly isLoading: boolean;
}

interface PromotionFormState {
  name: string;
  productId: string;
  discountType: 'percentage' | 'fixed';
  discountPercentage: string;
  promotionalPrice: string;
  currencyId: string;
  contactId: string;
  startDate?: Date;
  endDate?: Date;
  minQuantity: string;
  minWeight: string;
}

const buildPromotionPayload = (
  state: PromotionFormState,
): { payload?: AddPromotionRequestPayload; error?: string } => {
  if (!state.name.trim()) {
    return { error: 'Nazwa promocji jest wymagana.' };
  }

  if (!state.productId) {
    return { error: 'Wybierz produkt objęty promocją.' };
  }

  if (state.startDate && state.endDate && state.endDate < state.startDate) {
    return { error: 'Data zakończenia nie może być wcześniejsza niż data rozpoczęcia.' };
  }

  const payload: AddPromotionRequestPayload = {
    name: state.name.trim(),
    productId: state.productId,
    startDate: state.startDate?.toISOString() ?? null,
    endDate: state.endDate?.toISOString() ?? null,
    contactId: state.contactId || null,
    minQuantity: state.minQuantity ? Number(state.minQuantity) : null,
    minWeight: state.minWeight ? Math.round(Number(state.minWeight) * 1000) : null,
  };

  if (state.discountType === 'percentage') {
    const parsed = Number.parseFloat(state.discountPercentage);
    if (Number.isNaN(parsed) || parsed <= 0 || parsed > 100) {
      return { error: 'Podaj poprawny rabat procentowy (1-100%).' };
    }
    payload.discountPercentage = parsed;
    payload.promotionalPrice = null;
    payload.currencyId = null;
  } else {
    const parsedPrice = Number.parseFloat(state.promotionalPrice);
    if (Number.isNaN(parsedPrice) || parsedPrice <= 0) {
      return { error: 'Podaj poprawną cenę promocyjną.' };
    }
    if (!state.currencyId) {
      return { error: 'Wybierz walutę dla ceny promocyjnej.' };
    }
    payload.promotionalPrice = Math.round(parsedPrice * 100);
    payload.currencyId = state.currencyId;
    payload.discountPercentage = null;
  }

  return { payload };
};

interface DatePickerFieldProps {
  readonly id: string;
  readonly label: string;
  readonly date?: Date;
  readonly placeholder: string;
  readonly onSelect: (date?: Date) => void;
}

const DatePickerField: React.FC<DatePickerFieldProps> = ({
  id,
  label,
  date,
  placeholder,
  onSelect,
}) => (
  <div className="space-y-1.5">
    <div className="flex justify-between items-center">
      <label htmlFor={id} className="text-xs font-semibold text-gray-700">
        {label}
      </label>
      {date && (
        <button
          type="button"
          onClick={() => onSelect(undefined)}
          className="text-[10px] text-gray-500 hover:text-red-600 flex items-center gap-0.5"
        >
          <X className="w-3 h-3" /> Wyczyść
        </button>
      )}
    </div>
    <Popover>
      <PopoverTrigger asChild>
        <Button
          id={id}
          type="button"
          variant="outline"
          className={cn(
            'w-full justify-start text-left font-normal border-gray-300 text-sm py-2 h-auto',
            !date && 'text-gray-500',
          )}
        >
          <CalendarIcon className="mr-2 h-4 w-4 shrink-0" />
          {date ? format(date, 'dd MMMM yyyy', { locale: pl }) : <span>{placeholder}</span>}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0 z-100" align="start">
        <Calendar mode="single" selected={date} onSelect={onSelect} locale={pl} />
      </PopoverContent>
    </Popover>
  </div>
);

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
    if (!isOpen) return;
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
  }, [isOpen]);

  useEffect(() => {
    if (currencies.length > 0 && !currencyId) {
      setCurrencyId(currencies[0].currencyId);
    }
  }, [currencies, currencyId]);

  const handleSubmit = async (e: React.SyntheticEvent<HTMLFormElement>) => {
    e.preventDefault();
    setErrorMessage(null);

    const { payload, error } = buildPromotionPayload({
      name,
      productId,
      discountType,
      discountPercentage,
      promotionalPrice,
      currencyId,
      contactId,
      startDate,
      endDate,
      minQuantity,
      minWeight,
    });

    if (error || !payload) {
      setErrorMessage(error ?? 'Wystąpił nieoczekiwany błąd.');
      return;
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
            <label htmlFor="promo-name" className="text-xs font-semibold text-gray-700">
              Nazwa promocji *
            </label>
            <input
              id="promo-name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="np. Wiosenna Zniżka na Rury Precyzyjne"
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-blue-900"
              required
            />
          </div>

          <div className="space-y-1.5">
            <label htmlFor="promo-product" className="text-xs font-semibold text-gray-700">
              Produkt *
            </label>
            <select
              id="promo-product"
              value={productId}
              onChange={(e) => setProductId(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-blue-900 bg-white"
              required
            >
              <option value="">-- Wybierz produkt --</option>
              {products.map((p) => (
                <option key={p.productId} value={p.productId}>
                  {p.name} ({p.dimension})
                </option>
              ))}
            </select>
          </div>

          <div className="p-4 bg-gray-50 border border-gray-200 rounded-lg space-y-4">
            <div className="flex items-center gap-6 border-b border-gray-200 pb-3">
              <div className="flex items-center gap-2">
                <input
                  id="promo-type-percentage"
                  type="radio"
                  name="addDiscountType"
                  checked={discountType === 'percentage'}
                  onChange={() => setDiscountType('percentage')}
                  className="text-blue-900 focus:ring-blue-900 cursor-pointer"
                />
                <label
                  htmlFor="promo-type-percentage"
                  className="text-sm font-medium text-gray-800 cursor-pointer"
                >
                  Rabat procentowy (%)
                </label>
              </div>

              <div className="flex items-center gap-2">
                <input
                  id="promo-type-fixed"
                  type="radio"
                  name="addDiscountType"
                  checked={discountType === 'fixed'}
                  onChange={() => setDiscountType('fixed')}
                  className="text-blue-900 focus:ring-blue-900 cursor-pointer"
                />
                <label
                  htmlFor="promo-type-fixed"
                  className="text-sm font-medium text-gray-800 cursor-pointer"
                >
                  Sztywna cena jednostkowa
                </label>
              </div>
            </div>

            {discountType === 'percentage' ? (
              <div className="space-y-1.5">
                <label
                  htmlFor="promo-discount-percentage"
                  className="text-xs font-semibold text-gray-700"
                >
                  Wysokość rabatu (%) *
                </label>
                <input
                  id="promo-discount-percentage"
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
                  <label
                    htmlFor="promo-fixed-price"
                    className="text-xs font-semibold text-gray-700"
                  >
                    Cena promocyjna *
                  </label>
                  <input
                    id="promo-fixed-price"
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
                  <label htmlFor="promo-currency" className="text-xs font-semibold text-gray-700">
                    Waluta *
                  </label>
                  <select
                    id="promo-currency"
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
            <DatePickerField
              id="promo-start-date"
              label="Data rozpoczęcia"
              date={startDate}
              placeholder="Od teraz"
              onSelect={setStartDate}
            />
            <DatePickerField
              id="promo-end-date"
              label="Data zakończenia"
              date={endDate}
              placeholder="Do odwołania"
              onSelect={setEndDate}
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label htmlFor="promo-min-quantity" className="text-xs font-semibold text-gray-700">
                Minimalny wolumen (szt.)
              </label>
              <input
                id="promo-min-quantity"
                type="number"
                min="1"
                value={minQuantity}
                onChange={(e) => setMinQuantity(e.target.value)}
                placeholder="Brak limitu"
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-blue-900"
              />
            </div>
            <div className="space-y-1.5">
              <label htmlFor="promo-min-weight" className="text-xs font-semibold text-gray-700">
                Minimalna waga (kg)
              </label>
              <input
                id="promo-min-weight"
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
            <label htmlFor="promo-contact" className="text-xs font-semibold text-gray-700">
              Dedykowany klient
            </label>
            <select
              id="promo-contact"
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
