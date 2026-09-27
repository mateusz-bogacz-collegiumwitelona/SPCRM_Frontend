import type { SteelGradeListResponse } from '~/types/steel-grade';
import { Edit2, Trash2 } from 'lucide-react';

export const SteelGradeMobileCard = ({
  item,
  onEdit,
  onDelete,
}: {
  readonly item: SteelGradeListResponse;
  readonly onEdit: (grade: SteelGradeListResponse) => void;
  readonly onDelete: (grade: { id: string; name: string }) => void;
}) => (
  <div className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
    <div className="flex justify-between items-start mb-2">
      <p className="text-sm font-bold text-blue-900">{item.name}</p>
      {item.standard && (
        <span className="bg-gray-100 text-gray-700 px-2 py-0.5 rounded text-[11px] font-semibold">
          {item.standard}
        </span>
      )}
    </div>
    <div className="flex justify-between items-center text-sm border-t border-gray-100 pt-2 mt-2 text-gray-600">
      <span>Gęstość:</span>
      <span className="font-semibold text-gray-900">{item.density} g/cm³</span>
    </div>
    <div className="flex justify-end items-center gap-3 pt-2 mt-2 border-t border-gray-50">
      <button
        type="button"
        onClick={() => onEdit(item)}
        className="text-xs font-medium text-blue-900 hover:underline flex items-center gap-1 cursor-pointer"
      >
        <Edit2 className="w-3.5 h-3.5" /> Edytuj
      </button>

      <button
        type="button"
        onClick={() => onDelete({ id: item.id, name: item.name })}
        className="text-xs font-medium text-red-600 hover:text-red-800 flex items-center gap-1 cursor-pointer"
      >
        <Trash2 className="w-3.5 h-3.5" /> Usuń
      </button>
    </div>
  </div>
);
