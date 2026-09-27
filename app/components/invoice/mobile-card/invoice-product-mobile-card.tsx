import React from 'react';
import { formatCurrency } from '~/utils/data-formatters';
import type { InvoiceProductsListResponse } from '~/types/invoice';

interface InvoiceProductMobileCardProps {
  readonly product: InvoiceProductsListResponse;
  readonly currencyCode: string;
  readonly decimalPlaces: number;
}

export const InvoiceProductMobileCard = ({
  product,
  currencyCode,
  decimalPlaces,
}: InvoiceProductMobileCardProps) => (
  <div className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm relative">
    <div className="flex justify-between items-start mb-2">
      <div>
        <p className="text-sm font-bold text-blue-900">{product.productName}</p>
        {product.steelGrade && (
          <span className="inline-block mt-1 bg-gray-100 text-gray-700 px-2 py-0.5 rounded text-[11px] font-semibold">
            {product.steelGrade}
          </span>
        )}
      </div>
    </div>

    <div className="flex justify-between items-center text-sm border-t border-gray-100 pt-2 mt-2">
      <div className="text-gray-600">
        Ilość:{' '}
        <span className="font-semibold text-gray-900">
          {product.quantity} {product.unitSymbol}
        </span>
      </div>
      <div className="text-right">
        <p className="text-xs text-gray-500">
          {formatCurrency(product.unitPrice, currencyCode, decimalPlaces)} / {product.unitSymbol}
        </p>
        <p className="font-bold text-gray-900">
          {formatCurrency(product.totalPrice, currencyCode, decimalPlaces)}
        </p>
      </div>
    </div>
  </div>
);
