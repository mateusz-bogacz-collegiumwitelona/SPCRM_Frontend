import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { api } from '~/api/api';

export interface ProductFormData {
  name: string;
  steelGradeId: string;
  thickness: number;
  width: number;
  length: number;
  diameter: number | '';
  weight: number;
  unitId: string;
  currencyId: string;
  pricePerUnit: number;
  stockQuantity: number;
  category: string;
}

export interface SteelGradeOption {
  id: string;
  name: string;
}

export interface UnitOption {
  id: string;
  name: string;
  symbol: string;
}

export interface CurrencyOption {
  currencyId: string;
  name: string;
  code: string;
  decimalPlace: number;
}

export function useProductFormDictionaries(enabled: boolean) {
  const { data: categories = [] } = useQuery<string[]>({
    queryKey: ['product-categories'],
    queryFn: async () => {
      const res = await api.get('/products/categories');
      return (res.data?.value || res.data?.data || res.data || []) as string[];
    },
    enabled,
  });

  const { data: steelGrades = [] } = useQuery<SteelGradeOption[]>({
    queryKey: ['product-steel-grades'],
    queryFn: async () => {
      const res = await api.get('/products/steel-grades');
      return (res.data?.value || res.data?.data || res.data || []) as SteelGradeOption[];
    },
    enabled,
  });

  const { data: units = [] } = useQuery<UnitOption[]>({
    queryKey: ['units-of-measure-simple'],
    queryFn: async () => {
      const res = await api.get('/unit/simple');
      return (res.data?.value || res.data?.data || res.data || []) as UnitOption[];
    },
    enabled,
  });

  const { data: currencies = [] } = useQuery<CurrencyOption[]>({
    queryKey: ['currencies-simple'],
    queryFn: async () => {
      const res = await api.get('/currency/simple');
      return (res.data?.value || res.data?.data || res.data || []) as CurrencyOption[];
    },
    enabled,
  });

  return { categories, steelGrades, units, currencies };
}

interface ProductFormFieldsProps {
  readonly formData: ProductFormData;
  readonly onChange: <K extends keyof ProductFormData>(field: K, value: ProductFormData[K]) => void;
  readonly categories: string[];
  readonly steelGrades: SteelGradeOption[];
  readonly units: UnitOption[];
  readonly currencies: CurrencyOption[];
  readonly isDiameterRequired?: boolean;
}

export const ProductFormFields: React.FC<ProductFormFieldsProps> = ({
  formData,
  onChange,
  categories,
  steelGrades,
  units,
  currencies,
  isDiameterRequired = false,
}) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <div className="space-y-1.5">
        <label htmlFor="product-name" className="text-sm font-medium text-gray-700">
          Nazwa produktu *
        </label>
        <input
          id="product-name"
          value={formData.name}
          onChange={(e) => onChange('name', e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-[#004a8f]"
        />
      </div>

      <div className="space-y-1.5">
        <label htmlFor="product-steel-grade" className="text-sm font-medium text-gray-700">
          Gatunek stali *
        </label>
        <select
          id="product-steel-grade"
          value={formData.steelGradeId}
          onChange={(e) => onChange('steelGradeId', e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm bg-white focus:outline-none focus:ring-1 focus:ring-[#004a8f]"
        >
          <option value="" disabled>
            Wybierz gatunek...
          </option>
          {steelGrades.map((grade) => (
            <option key={grade.id} value={grade.id}>
              {grade.name}
            </option>
          ))}
        </select>
      </div>

      <div className="space-y-1.5">
        <label htmlFor="product-category" className="text-sm font-medium text-gray-700">
          Kategoria *
        </label>
        <select
          id="product-category"
          value={formData.category}
          onChange={(e) => onChange('category', e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm bg-white focus:outline-none focus:ring-1 focus:ring-[#004a8f]"
        >
          <option value="" disabled>
            Wybierz kategorię...
          </option>
          {categories.map((cat) => (
            <option key={cat} value={cat}>
              {cat}
            </option>
          ))}
        </select>
      </div>

      <div className="space-y-1.5">
        <label htmlFor="product-unit" className="text-sm font-medium text-gray-700">
          Jednostka miary *
        </label>
        <select
          id="product-unit"
          value={formData.unitId}
          onChange={(e) => onChange('unitId', e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm bg-white focus:outline-none focus:ring-1 focus:ring-[#004a8f]"
        >
          <option value="" disabled>
            Wybierz jednostkę...
          </option>
          {units.map((u) => (
            <option key={u.id} value={u.id}>
              {u.symbol}
            </option>
          ))}
        </select>
      </div>

      <div className="space-y-1.5">
        <label htmlFor="product-thickness" className="text-sm font-medium text-gray-700">
          Grubość (mm)
        </label>
        <input
          id="product-thickness"
          type="number"
          step="any"
          value={formData.thickness}
          onChange={(e) => onChange('thickness', Number(e.target.value))}
          className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-[#004a8f]"
        />
      </div>

      <div className="space-y-1.5">
        <label htmlFor="product-width" className="text-sm font-medium text-gray-700">
          Szerokość (mm)
        </label>
        <input
          id="product-width"
          type="number"
          step="any"
          value={formData.width}
          onChange={(e) => onChange('width', Number(e.target.value))}
          className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-[#004a8f]"
        />
      </div>

      <div className="space-y-1.5">
        <label htmlFor="product-length" className="text-sm font-medium text-gray-700">
          Długość (mm)
        </label>
        <input
          id="product-length"
          type="number"
          step="any"
          value={formData.length}
          onChange={(e) => onChange('length', Number(e.target.value))}
          className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-[#004a8f]"
        />
      </div>

      <div className="space-y-1.5">
        <label htmlFor="product-diameter" className="text-sm font-medium text-gray-700">
          Średnica (mm) {isDiameterRequired && <span className="text-red-500">*</span>}
        </label>
        <input
          id="product-diameter"
          type="number"
          step="any"
          value={formData.diameter}
          onChange={(e) =>
            onChange('diameter', e.target.value === '' ? '' : Number(e.target.value))
          }
          required={isDiameterRequired}
          placeholder={isDiameterRequired ? 'Wymagane dla tej kategorii' : 'Opcjonalnie'}
          className={`w-full px-3 py-2 border rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-[#004a8f] ${
            isDiameterRequired && formData.diameter === ''
              ? 'border-amber-400 bg-amber-50/20'
              : 'border-gray-300'
          }`}
        />
      </div>

      <div className="space-y-1.5">
        <label htmlFor="product-weight" className="text-sm font-medium text-gray-700">
          Waga (kg)
        </label>
        <input
          id="product-weight"
          type="number"
          step="0.01"
          value={formData.weight}
          onChange={(e) => onChange('weight', Number(e.target.value))}
          className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-[#004a8f]"
        />
      </div>

      <div className="space-y-1.5">
        <label htmlFor="product-price" className="text-sm font-medium text-gray-700">
          Cena i Waluta *
        </label>
        <div className="flex gap-2">
          <input
            id="product-price"
            type="number"
            step="any"
            value={formData.pricePerUnit}
            onChange={(e) => onChange('pricePerUnit', Number(e.target.value))}
            placeholder="0.00"
            className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-[#004a8f]"
          />
          <select
            id="product-currency"
            value={formData.currencyId}
            onChange={(e) => onChange('currencyId', e.target.value)}
            className="w-28 shrink-0 px-3 py-2 border border-gray-300 rounded-md text-sm bg-white focus:outline-none focus:ring-1 focus:ring-[#004a8f]"
          >
            <option value="" disabled>
              Waluta
            </option>
            {currencies.map((c) => (
              <option key={c.currencyId} value={c.currencyId}>
                {c.code}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="space-y-1.5 md:col-span-2">
        <label htmlFor="product-stock" className="text-sm font-medium text-gray-700">
          Ilość na stanie
        </label>
        <input
          id="product-stock"
          type="number"
          step="any"
          value={formData.stockQuantity}
          onChange={(e) => onChange('stockQuantity', Number(e.target.value))}
          className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-[#004a8f]"
        />
      </div>
    </div>
  );
};
