export interface GeocodeResult {
  lat: number;
  lng: number;
  displayName: string;
  street?: string;
  city?: string;
  zipCode?: string;
}

interface NominatimAddress {
  road?: string;
  house_number?: string;
  city?: string;
  town?: string;
  village?: string;
  postcode?: string;
}

interface NominatimResponseItem {
  lat: string;
  lon: string;
  display_name: string;
  address?: NominatimAddress;
}

export async function forwardGeocode(query: string): Promise<GeocodeResult | null> {
  if (!query || query.trim().length < 3) return null;

  try {
    const url = new URL('https://nominatim.openstreetmap.org/search');
    url.searchParams.set('format', 'json');
    url.searchParams.set('q', query);
    url.searchParams.set('countrycodes', 'pl');
    url.searchParams.set('limit', '1');
    url.searchParams.set('addressdetails', '1');

    const response = await fetch(url.toString(), {
      method: 'GET',
      headers: {
        'Accept-Language': 'pl',
      },
    });

    if (!response.ok) return null;

    const items: NominatimResponseItem[] = await response.json();
    if (!items || items.length === 0) return null;

    const item = items[0];
    const addr = item.address || {};

    return {
      lat: Number.parseFloat(item.lat),
      lng: Number.parseFloat(item.lon),
      displayName: item.display_name,
      street: [addr.road, addr.house_number].filter(Boolean).join(' '),
      city: addr.city || addr.town || addr.village || '',
      zipCode: addr.postcode || '',
    };
  } catch {
    return null;
  }
}

export async function reverseGeocode(
  lat: number,
  lng: number,
): Promise<Partial<GeocodeResult> | null> {
  try {
    const url = new URL('https://nominatim.openstreetmap.org/reverse');
    url.searchParams.set('format', 'json');
    url.searchParams.set('lat', lat.toString());
    url.searchParams.set('lon', lng.toString());
    url.searchParams.set('addressdetails', '1');

    const response = await fetch(url.toString(), {
      method: 'GET',
      headers: {
        'Accept-Language': 'pl',
      },
    });

    if (!response.ok) return null;

    const item: NominatimResponseItem = await response.json();
    if (!item) return null;

    const addr = item.address || {};

    return {
      lat,
      lng,
      street: [addr.road, addr.house_number].filter(Boolean).join(' '),
      city: addr.city || addr.town || addr.village || '',
      zipCode: addr.postcode || '',
      displayName: item.display_name,
    };
  } catch {
    return null;
  }
}
