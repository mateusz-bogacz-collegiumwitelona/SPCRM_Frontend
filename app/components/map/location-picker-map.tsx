import React, { lazy, Suspense } from 'react';
import { MapPinned } from 'lucide-react';
import type { OSMMapClientProps } from './osm-map-client';

const OSMMapClient = lazy(() => import('~/components/map/osm-map-client'));

export function LocationPickerMap(props: OSMMapClientProps) {
  return (
    <Suspense
      fallback={
        <div className="flex h-full w-full items-center justify-center text-gray-500 text-sm gap-2">
          <MapPinned className="animate-bounce text-brand" /> Ładowanie mapy...
        </div>
      }
    >
      <OSMMapClient {...props} />
    </Suspense>
  );
}
