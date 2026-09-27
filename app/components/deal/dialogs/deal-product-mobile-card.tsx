import type { DealProductResponse } from '~/types/deal';
import { Pencil, Trash2 } from 'lucide-react';
import { formatCurrency } from '~/utils/data-formatters';

export const DealProductMobileCard = ({
  product,
  onEditClick,
  onDeleteClick,
}: {
  product: DealProductResponse;
  onEditClick: (product: DealProductResponse) => void;
  onDeleteClick: (product: DealProductResponse) => void;
}) => {
  const hasDiscount = product.baseUnitPrice > product.unitPrice;

  return (
    <div className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm relative">
      <div className="flex justify-between items-start mb-2 pr-16">
        <div>
          <p className="text-sm font-bold text-brand">{product.name}</p>
          <p className="text-xs text-gray-500 mt-0.5">Wymiary: {product.dimensions}</p>
        </div>
      </div>

      <div className="absolute top-3 right-3 flex items-center gap-1">
        <button
          type="button"
          onClick={() => onEditClick(product)}
          className="text-gray-400 hover:text-brand p-1 rounded"
          title="Edytuj pozycję"
        >
          <Pencil className="w-4 h-4" />
        </button>
        <button
          type="button"
          onClick={() => onDeleteClick(product)}
          className="text-gray-400 hover:text-red-600 p-1 rounded"
          title="Usuń pozycję"
        >
          <Trash2 className="w-4 h-4" />
        </button>
      </div>

      <div className="flex justify-between items-center text-sm border-t border-gray-100 pt-2 mt-2">
        <div className="text-gray-600">
          Ilość:{' '}
          <span className="font-semibold text-gray-900">
            {product.quantity} {product.unitSymbol}
          </span>
        </div>
        <div className="text-right">
          {hasDiscount && (
            <p className="text-[10px] text-gray-400 line-through">
              {formatCurrency(product.baseUnitPrice, product.currencyCode, product.decimalPlaces)}
            </p>
          )}
          <p className="font-bold text-gray-900">
            {formatCurrency(product.unitPrice, product.currencyCode, product.decimalPlaces)}{' '}
            {product.currencyCode}
          </p>
        </div>
      </div>
    </div>
  );
};
