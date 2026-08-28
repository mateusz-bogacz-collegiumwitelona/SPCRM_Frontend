import React from 'react';

export interface SteelGradeFormData {
  name: string;
  standard: string;
  density: number | '';
}

interface SteelGradeFormFieldsProps {
  readonly formData: SteelGradeFormData;
  readonly onChange: <K extends keyof SteelGradeFormData>(
    field: K,
    value: SteelGradeFormData[K],
  ) => void;
  readonly idPrefix?: string;
}

export const SteelGradeFormFields: React.FC<SteelGradeFormFieldsProps> = ({
  formData,
  onChange,
  idPrefix = 'steel-grade',
}) => {
  return (
    <>
      <div className="space-y-1.5">
        <label htmlFor={`${idPrefix}-name`} className="text-sm font-medium text-gray-700">
          Nazwa gatunku *
        </label>
        <input
          id={`${idPrefix}-name`}
          type="text"
          value={formData.name}
          onChange={(e) => onChange('name', e.target.value)}
          placeholder="np. S355J2, 1.4301"
          className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-[#004a8f]"
          required
        />
      </div>

      <div className="space-y-1.5">
        <label htmlFor={`${idPrefix}-standard`} className="text-sm font-medium text-gray-700">
          Norma
        </label>
        <input
          id={`${idPrefix}-standard`}
          type="text"
          value={formData.standard}
          onChange={(e) => onChange('standard', e.target.value)}
          placeholder="np. EN 10025-2, DIN 17100"
          className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-[#004a8f]"
        />
      </div>

      <div className="space-y-1.5">
        <label htmlFor={`${idPrefix}-density`} className="text-sm font-medium text-gray-700">
          Gęstość (g/cm³)
        </label>
        <input
          id={`${idPrefix}-density`}
          type="number"
          step="0.01"
          min="0"
          value={formData.density}
          onChange={(e) => onChange('density', e.target.value === '' ? '' : Number(e.target.value))}
          placeholder="np. 7.85"
          className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-[#004a8f]"
        />
      </div>
    </>
  );
};
