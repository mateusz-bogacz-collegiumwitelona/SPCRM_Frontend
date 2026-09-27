import React from 'react';

interface UnitFormFieldsProps {
  readonly name: string;
  readonly symbol: string;
  readonly baseMultiplier: number;
  readonly onNameChange: (value: string) => void;
  readonly onSymbolChange: (value: string) => void;
  readonly onBaseMultiplierChange: (value: number) => void;
  readonly disabled?: boolean;
  readonly idPrefix?: string;
}

export function UnitFormFields({
  name,
  symbol,
  baseMultiplier,
  onNameChange,
  onSymbolChange,
  onBaseMultiplierChange,
  disabled = false,
  idPrefix = 'unit',
}: UnitFormFieldsProps) {
  return (
    <>
      <div>
        <label
          htmlFor={`${idPrefix}-symbol`}
          className="block text-xs font-medium text-gray-700 mb-1"
        >
          Symbol (np. Kg, M3, dkg) *
        </label>
        <input
          id={`${idPrefix}-symbol`}
          type="text"
          maxLength={3}
          value={symbol}
          onChange={(e) => onSymbolChange(e.target.value)}
          placeholder="Kg"
          disabled={disabled}
          className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-900 uppercase bg-white"
        />
      </div>

      <div>
        <label
          htmlFor={`${idPrefix}-name`}
          className="block text-xs font-medium text-gray-700 mb-1"
        >
          Pełna nazwa jednostki *
        </label>
        <input
          id={`${idPrefix}-name`}
          type="text"
          value={name}
          onChange={(e) => onNameChange(e.target.value)}
          placeholder="Kilogram"
          disabled={disabled}
          className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-900 bg-white"
        />
      </div>

      <div>
        <label
          htmlFor={`${idPrefix}-multiplier`}
          className="block text-xs font-medium text-gray-700 mb-1"
        >
          Mnożnik (np. 1 dla podstawowej jednostki, 0.001 dla miligrama) *
        </label>
        <input
          id={`${idPrefix}-multiplier`}
          type="number"
          min={0}
          max={4}
          step="any"
          value={baseMultiplier}
          onChange={(e) => onBaseMultiplierChange(Number(e.target.value))}
          disabled={disabled}
          className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-900 bg-white"
        />
      </div>
    </>
  );
}

export function validateUnitForm(name: string, symbol: string, baseMultiplier: number): string[] {
  const errors: string[] = [];
  if (!symbol.trim()) errors.push('Symbol jednostki jest wymagany.');
  if (!name.trim()) errors.push('Pełna nazwa jednostki jest wymagana.');
  if (Number(baseMultiplier) < 0) errors.push('Mnożnik nie może być ujemny.');
  return errors;
}
