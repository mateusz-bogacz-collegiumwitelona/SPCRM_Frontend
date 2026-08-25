import React, { useState } from 'react';
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
import { AlertCircle } from 'lucide-react';
import { getErrorMessage } from '~/utils/error-mapper';
import type ApiError from '~/interfaces/apiError';

export interface AddProductRequest {
  name: string;
  steelGradeId: string;
  thickness: number;
  width: number;
  length: number;
  diameter?: number | null;
  weight: number;
  unitId: string;
  currencyId: string;
  pricePerUnit: number;
  stockQuantity: number;
  category: string;
}

interface AddProductDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (productData: AddProductRequest) => Promise<void>;
  isLoading?: boolean;
}

interface SteelGradeResponse {
  id: string;
  name: string;
}

interface CurrencyResponse {
  currencyId: string;
  name: string;
  code: string;
  decimalPlace: number;
}

export const AddProductDialog: React.FC<AddProductDialogProps> = ({
  isOpen,
  onClose,
  onSave,
  isLoading = false,
}) => {
  const [name, setName] = useState('');
  const [steelGradeId, setSteelGradeId] = useState('');
  const [thickness, setThickness] = useState<number>(0);
  const [width, setWidth] = useState<number>(0);
  const [length, setLength] = useState<number>(0);
  const [diameter, setDiameter] = useState<number | ''>('');
  const [weight, setWeight] = useState<number>(0);
  const [unitId, setUnitId] = useState('');
  const [currencyId, setCurrencyId] = useState('');
  const [pricePerUnit, setPricePerUnit] = useState<number>(0);
  const [stockQuantity, setStockQuantity] = useState<number>(0);
  const [category, setCategory] = useState('');

  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const { data: categories = [] } = useQuery({
    queryKey: ['product-categories'],
    queryFn: async () => {
      const res = await api.get('/products/categories');
      return (res.data?.value || res.data?.data || res.data || []) as string[];
    },
    enabled: isOpen,
  });

  const { data: steelGrades = [] } = useQuery<SteelGradeResponse[]>({
    queryKey: ['product-steel-grades'],
    queryFn: async () => {
      const res = await api.get('/products/steel-grades');
      return (res.data?.value || res.data?.data || res.data || []) as SteelGradeResponse[];
    },
    enabled: isOpen,
  });

  const { data: units = [] } = useQuery({
    queryKey: ['units-of-measure-simple'],
    queryFn: async () => {
      try {
        const res = await api.get('/unit/simple');
        return (res.data?.value || res.data?.data || res.data || []) as Array<{
          id: string;
          name: string;
          symbol: string;
        }>;
      } catch {
        return [];
      }
    },
    enabled: isOpen,
  });

  const { data: currencies = [] } = useQuery<CurrencyResponse[]>({
    queryKey: ['currencies-simple'],
    queryFn: async () => {
      try {
        const res = await api.get('/currency/simple');
        return (res.data?.value || res.data?.data || res.data || []) as CurrencyResponse[];
      } catch {
        return [];
      }
    },
    enabled: isOpen,
  });

  const resetForm = () => {
    setName('');
    setSteelGradeId('');
    setThickness(0);
    setWidth(0);
    setLength(0);
    setDiameter('');
    setWeight(0);
    setUnitId('');
    setCurrencyId('');
    setPricePerUnit(0);
    setStockQuantity(0);
    setCategory('');
    setErrorMessage(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!name.trim() || !steelGradeId || !category || !unitId || !currencyId) {
      setErrorMessage('Proszę wypełnić wszystkie wymagane pola.');
      return;
    }

    const payload: AddProductRequest = {
      name: name.trim(),
      steelGradeId,
      thickness: Number(thickness),
      width: Number(width),
      length: Number(length),
      diameter: diameter === '' ? null : Number(diameter),
      weight: Number(weight),
      unitId,
      currencyId,
      pricePerUnit: Number(pricePerUnit),
      stockQuantity: Number(stockQuantity),
      category,
    };

    try {
      await onSave(payload);
      resetForm();
      onClose();
    } catch (err: unknown) {
      const apiError = err as ApiError;
      const code = apiError.response?.data?.errorCode;
      const fallback = (err as Error)?.message || 'Nie udało się dodać produktu.';
      setErrorMessage(getErrorMessage(code, fallback));
    }
  };

  return (
    <Dialog
      open={isOpen}
      onOpenChange={(open) => {
        if (!open) {
          resetForm();
          onClose();
        }
      }}
    >
      <DialogContent className="sm:max-w-200 max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl font-normal text-[#004a8f]">
            Dodaj nowy produkt
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6 py-4">
          {errorMessage && (
            <div className="flex items-center gap-2 p-3 text-red-700 bg-red-50 border border-red-200 rounded-lg text-sm">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <p>{errorMessage}</p>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-gray-700">Nazwa produktu *</label>
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-[#004a8f]"
                required
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-sm font-medium text-gray-700">Gatunek stali *</label>
              <select
                value={steelGradeId}
                onChange={(e) => setSteelGradeId(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm bg-white focus:outline-none focus:ring-1 focus:ring-[#004a8f]"
                required
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
              <label className="text-sm font-medium text-gray-700">Kategoria *</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm bg-white focus:outline-none focus:ring-1 focus:ring-[#004a8f]"
                required
              >
                <option value="" disabled>
                  Wybierz kategorię...
                </option>
                {categories.map((cat: string) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="text-sm font-medium text-gray-700">Jednostka miary *</label>
              <select
                value={unitId}
                onChange={(e) => setUnitId(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm bg-white focus:outline-none focus:ring-1 focus:ring-[#004a8f]"
                required
              >
                <option value="" disabled>
                  Wybierz jednostkę...
                </option>
                {units.map((u: { id: string; symbol: string }) => (
                  <option key={u.id} value={u.id}>
                    {u.symbol}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="text-sm font-medium text-gray-700">Grubość (mm)</label>
              <input
                type="number"
                step="any"
                value={thickness}
                onChange={(e) => setThickness(Number(e.target.value))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-[#004a8f]"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-sm font-medium text-gray-700">Szerokość (mm)</label>
              <input
                type="number"
                step="any"
                value={width}
                onChange={(e) => setWidth(Number(e.target.value))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-[#004a8f]"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-sm font-medium text-gray-700">Długość (mm)</label>
              <input
                type="number"
                step="any"
                value={length}
                onChange={(e) => setLength(Number(e.target.value))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-[#004a8f]"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-sm font-medium text-gray-700">
                Średnica (mm) - opcjonalnie
              </label>
              <input
                type="number"
                step="any"
                value={diameter}
                onChange={(e) => setDiameter(e.target.value === '' ? '' : Number(e.target.value))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-[#004a8f]"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-sm font-medium text-gray-700">Waga (kg)</label>
              <input
                type="number"
                step="0.01"
                value={weight}
                onChange={(e) => setWeight(Number(e.target.value))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-[#004a8f]"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-sm font-medium text-gray-700">Cena i Waluta *</label>
              <div className="flex gap-2">
                <input
                  type="number"
                  step="0.01"
                  value={pricePerUnit}
                  onChange={(e) => setPricePerUnit(Number(e.target.value))}
                  placeholder="0.00"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-[#004a8f]"
                  required
                />
                <select
                  value={currencyId}
                  onChange={(e) => setCurrencyId(e.target.value)}
                  className="w-28 shrink-0 px-3 py-2 border border-gray-300 rounded-md text-sm bg-white focus:outline-none focus:ring-1 focus:ring-[#004a8f]"
                  required
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
              <label className="text-sm font-medium text-gray-700">Ilość na stanie</label>
              <input
                type="number"
                step="any"
                value={stockQuantity}
                onChange={(e) => setStockQuantity(Number(e.target.value))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-[#004a8f]"
              />
            </div>
          </div>

          <DialogFooter className="pt-4 border-t mt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                resetForm();
                onClose();
              }}
              disabled={isLoading}
            >
              Anuluj
            </Button>
            <Button
              type="submit"
              disabled={isLoading}
              className="bg-[#004a8f] text-white hover:bg-blue-800"
            >
              {isLoading ? 'Zapisywanie...' : 'Dodaj produkt'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};
