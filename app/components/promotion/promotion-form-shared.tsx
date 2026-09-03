import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { api } from '~/api/api';
import { Button } from '~/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '~/components/ui/popover';
import { Calendar } from '~/components/ui/calendar';
import { Calendar as CalendarIcon, X } from 'lucide-react';
import { format } from 'date-fns';
import { pl } from 'date-fns/locale';
import { cn } from '~/utils/utils';

export interface CurrencyOption {
  currencyId: string;
  name: string;
  code: string;
  decimalPlace: number;
}

export interface ContactOption {
  contactId: string;
  contactFirstName: string;
  contactLastName: string;
  companyName: string;
}

export interface PromotionSharedFormData {
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

export interface PromotionPricingPayloadResult {
  discountPercentage: number | null;
  promotionalPrice: number | null;
  currencyId: string | null;
}

export interface EditPromotionInitialData {
  id: string;
  name: string;
  startDate?: string | null;
  endDate?: string | null;
  discountPercentage?: number | null;
  promotionalPrice?: number | null;
  currencyCode?: string | null;
  contactId?: string | null;
  contactFirstName?: string | null;
  contactLastName?: string | null;
  contactCompanyName?: string | null;
  minQuantity?: number | null;
  minWeight?: number | null;
}

export const defaultPromotionSharedState: PromotionSharedFormData = {
  discountType: 'percentage',
  discountPercentage: '',
  promotionalPrice: '',
  currencyId: '',
  contactId: '',
  startDate: undefined,
  endDate: undefined,
  minQuantity: '',
  minWeight: '',
};

export const mapInitialDataToSharedForm = (
  initialData?: EditPromotionInitialData | null,
): PromotionSharedFormData => {
  if (!initialData) return defaultPromotionSharedState;

  return {
    discountType: typeof initialData.promotionalPrice === 'number' ? 'fixed' : 'percentage',
    discountPercentage: initialData.discountPercentage?.toString() ?? '',
    promotionalPrice: initialData.promotionalPrice
      ? (initialData.promotionalPrice / 100).toString()
      : '',
    currencyId: '',
    contactId: initialData.contactId ?? '',
    startDate: initialData.startDate ? new Date(initialData.startDate) : undefined,
    endDate: initialData.endDate ? new Date(initialData.endDate) : undefined,
    minQuantity: initialData.minQuantity?.toString() ?? '',
    minWeight: initialData.minWeight ? (initialData.minWeight / 1000).toString() : '',
  };
};

export const resolvePromotionPricingPayload = (
  formData: PromotionSharedFormData,
): { pricing?: PromotionPricingPayloadResult; error?: string } => {
  if (formData.discountType === 'percentage') {
    const parsed = Number.parseFloat(formData.discountPercentage);
    if (Number.isNaN(parsed) || parsed <= 0 || parsed > 100) {
      return { error: 'Podaj poprawny rabat procentowy (1-100%).' };
    }
    return {
      pricing: {
        discountPercentage: parsed,
        promotionalPrice: null,
        currencyId: null,
      },
    };
  }

  const parsedPrice = Number.parseFloat(formData.promotionalPrice);
  if (Number.isNaN(parsedPrice) || parsedPrice <= 0) {
    return { error: 'Podaj poprawną cenę promocyjną.' };
  }
  if (!formData.currencyId) {
    return { error: 'Wybierz walutę dla ceny promocyjnej.' };
  }

  return {
    pricing: {
      promotionalPrice: Math.round(parsedPrice * 100),
      currencyId: formData.currencyId,
      discountPercentage: null,
    },
  };
};

export const buildBasePromotionPayload = (formData: PromotionSharedFormData) => ({
  startDate: formData.startDate?.toISOString() ?? null,
  endDate: formData.endDate?.toISOString() ?? null,
  contactId: formData.contactId || null,
  minQuantity: formData.minQuantity ? Number(formData.minQuantity) : null,
  minWeight: formData.minWeight ? Math.round(Number(formData.minWeight) * 1000) : null,
});

export function usePromotionDictionaries(isOpen: boolean) {
  const { data: currencies = [] } = useQuery<CurrencyOption[]>({
    queryKey: ['currencies-simple'],
    queryFn: async () => {
      const res = await api.get('/currency/simple');
      return (res.data?.value || res.data?.data || res.data || []) as CurrencyOption[];
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

  return { currencies, contacts };
}

interface DatePickerFieldProps {
  readonly id: string;
  readonly label: string;
  readonly date?: Date;
  readonly placeholder: string;
  readonly onSelect: (date?: Date) => void;
}

export const DatePickerField: React.FC<DatePickerFieldProps> = ({
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

interface PromotionSharedFieldsProps {
  readonly idPrefix: string;
  readonly formData: PromotionSharedFormData;
  readonly onChange: <K extends keyof PromotionSharedFormData>(
    field: K,
    value: PromotionSharedFormData[K],
  ) => void;
  readonly currencies: CurrencyOption[];
  readonly contacts: ContactOption[];
}

export const PromotionSharedFields: React.FC<PromotionSharedFieldsProps> = ({
  idPrefix,
  formData,
  onChange,
  currencies,
  contacts,
}) => (
  <>
    <div className="p-4 bg-gray-50 border border-gray-200 rounded-lg space-y-4">
      <div className="flex items-center gap-6 border-b border-gray-200 pb-3">
        <div className="flex items-center gap-2">
          <input
            id={`${idPrefix}-type-percentage`}
            type="radio"
            name={`${idPrefix}DiscountType`}
            checked={formData.discountType === 'percentage'}
            onChange={() => onChange('discountType', 'percentage')}
            className="text-blue-900 focus:ring-blue-900 cursor-pointer"
          />
          <label
            htmlFor={`${idPrefix}-type-percentage`}
            className="text-sm font-medium text-gray-800 cursor-pointer"
          >
            Rabat procentowy (%)
          </label>
        </div>

        <div className="flex items-center gap-2">
          <input
            id={`${idPrefix}-type-fixed`}
            type="radio"
            name={`${idPrefix}DiscountType`}
            checked={formData.discountType === 'fixed'}
            onChange={() => onChange('discountType', 'fixed')}
            className="text-blue-900 focus:ring-blue-900 cursor-pointer"
          />
          <label
            htmlFor={`${idPrefix}-type-fixed`}
            className="text-sm font-medium text-gray-800 cursor-pointer"
          >
            Sztywna cena jednostkowa
          </label>
        </div>
      </div>

      {formData.discountType === 'percentage' ? (
        <div className="space-y-1.5">
          <label
            htmlFor={`${idPrefix}-discount-percentage`}
            className="text-xs font-semibold text-gray-700"
          >
            Wysokość rabatu (%) *
          </label>
          <input
            id={`${idPrefix}-discount-percentage`}
            type="number"
            min="1"
            max="100"
            step="0.01"
            value={formData.discountPercentage}
            onChange={(e) => onChange('discountPercentage', e.target.value)}
            placeholder="np. 15"
            className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-blue-900 bg-white"
          />
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <label
              htmlFor={`${idPrefix}-fixed-price`}
              className="text-xs font-semibold text-gray-700"
            >
              Cena promocyjna *
            </label>
            <input
              id={`${idPrefix}-fixed-price`}
              type="number"
              min="0.01"
              step="0.01"
              value={formData.promotionalPrice}
              onChange={(e) => onChange('promotionalPrice', e.target.value)}
              placeholder="np. 125.50"
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-blue-900 bg-white"
            />
          </div>
          <div className="space-y-1.5">
            <label htmlFor={`${idPrefix}-currency`} className="text-xs font-semibold text-gray-700">
              Waluta *
            </label>
            <select
              id={`${idPrefix}-currency`}
              value={formData.currencyId}
              onChange={(e) => onChange('currencyId', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-blue-900 bg-white"
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
        id={`${idPrefix}-start-date`}
        label="Data rozpoczęcia"
        date={formData.startDate}
        placeholder="Od momentu utworzenia"
        onSelect={(date) => onChange('startDate', date)}
      />
      <DatePickerField
        id={`${idPrefix}-end-date`}
        label="Data zakończenia"
        date={formData.endDate}
        placeholder="Do odwołania"
        onSelect={(date) => onChange('endDate', date)}
      />
    </div>

    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
      <div className="space-y-1.5">
        <label htmlFor={`${idPrefix}-min-quantity`} className="text-xs font-semibold text-gray-700">
          Minimalny wolumen (szt.)
        </label>
        <input
          id={`${idPrefix}-min-quantity`}
          type="number"
          min="1"
          value={formData.minQuantity}
          onChange={(e) => onChange('minQuantity', e.target.value)}
          placeholder="Brak limitu"
          className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-blue-900"
        />
      </div>
      <div className="space-y-1.5">
        <label htmlFor={`${idPrefix}-min-weight`} className="text-xs font-semibold text-gray-700">
          Minimalna waga (kg)
        </label>
        <input
          id={`${idPrefix}-min-weight`}
          type="number"
          min="0.1"
          step="0.1"
          value={formData.minWeight}
          onChange={(e) => onChange('minWeight', e.target.value)}
          placeholder="Brak limitu"
          className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-blue-900"
        />
      </div>
    </div>

    <div className="space-y-1.5">
      <label htmlFor={`${idPrefix}-contact`} className="text-xs font-semibold text-gray-700">
        Dedykowany klient
      </label>
      <select
        id={`${idPrefix}-contact`}
        value={formData.contactId}
        onChange={(e) => onChange('contactId', e.target.value)}
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
  </>
);
