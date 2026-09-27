import type { UnitListResponse } from '~/types/unit';
import { Edit2 } from 'lucide-react';

export const UnitMobileCard = ({
  unit,
  onEdit,
}: {
  readonly unit: UnitListResponse;
  readonly onEdit: (unit: UnitListResponse) => void;
}) => (
  <div className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
    <div className="flex justify-between items-start mb-2">
      <div className="flex items-center gap-2">
        <span className="font-bold text-blue-900 bg-blue-50 px-2 py-0.5 rounded text-xs">
          {unit.symbol}
        </span>
        <p className="text-sm font-semibold text-gray-900">{unit.name}</p>
      </div>
      <button
        type="button"
        onClick={() => onEdit(unit)}
        className="text-xs font-medium text-blue-900 hover:underline flex items-center gap-1"
      >
        <Edit2 className="w-3.5 h-3.5" /> Edytuj
      </button>
    </div>
    <div className="text-xs text-gray-500 border-t border-gray-100 pt-2 mt-2">
      Mnożnik: <span className="font-medium text-gray-700">{unit.baseMultiplier}</span>
    </div>
  </div>
);
