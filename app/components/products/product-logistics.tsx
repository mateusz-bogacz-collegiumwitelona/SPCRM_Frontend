import type { ProductDetailResponse } from '~/interfaces/product';
import { Box } from 'lucide-react';
import React from 'react';

export const ProductLogisticsInfo = ({ product }: { product: ProductDetailResponse }) => {
  const availableQuantity = product.stockQuantity - product.reservedQuantity;

  return (
    <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm h-full">
      <h2 className="text-lg font-medium text-gray-900 mb-6 flex items-center gap-2">
        <Box className="w-5 h-5 text-gray-500" /> Stany magazynowe
      </h2>

      <div className="space-y-6">
        <div>
          <p className="text-sm text-gray-500 mb-1">Dostępne do sprzedaży</p>
          <p className="text-3xl font-bold text-green-600">
            {availableQuantity}{' '}
            <span className="text-lg font-medium text-gray-500">{product.unitSymbol}</span>
          </p>
        </div>

        <div className="grid grid-cols-2 gap-4 pt-4 border-t border-gray-100">
          <div>
            <p className="text-xs text-gray-500 mb-1">Stan fizyczny (Magazyn)</p>
            <p className="text-lg font-semibold text-gray-900">
              {product.stockQuantity} {product.unitSymbol}
            </p>
          </div>
          <div>
            <p className="text-xs text-gray-500 mb-1">Zarezerwowane (Deals)</p>
            <p className="text-lg font-semibold text-orange-600">
              {product.reservedQuantity} {product.unitSymbol}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
