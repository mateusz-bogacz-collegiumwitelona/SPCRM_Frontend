import type { ProductResponse } from '~/types/product';
import { HasRole } from '~/components/guards/has-role';
import { MANAGEMENT_ROLES } from '~/constants/roles';
import { Pencil } from 'lucide-react';
import { Link } from 'react-router';

export const ProductMobileCard = ({
  product,
  onEdit,
}: {
  readonly product: ProductResponse;
  readonly onEdit: (id: string) => void;
}) => (
  <div className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
    <div className="mb-2">
      <p className="text-sm font-bold text-blue-900">{product.name}</p>
      <p className="text-xs text-gray-500 mt-1">Wymiary: {product.dimensions}</p>
    </div>
    <div className="flex justify-between items-center text-sm border-t border-gray-100 pt-2 mt-2">
      <div className="text-gray-600">
        Ilość: {product.stockQuantity} {product.unitSymbol}
      </div>
      <div className="flex items-center gap-3">
        <HasRole allowedRoles={MANAGEMENT_ROLES}>
          <button
            type="button"
            onClick={() => onEdit(product.id)}
            className="text-xs font-medium text-gray-600 hover:text-blue-900 flex items-center gap-1"
          >
            <Pencil className="w-3 h-3" /> Edytuj
          </button>
        </HasRole>
        <Link
          to={`/products/${product.id}`}
          className="text-xs font-medium text-blue-900 hover:underline"
        >
          Detale
        </Link>
      </div>
    </div>
  </div>
);
