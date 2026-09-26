import { useQuery } from '@tanstack/react-query';
import { mapApi } from '~/api/map.api';

export const mapKeys = {
  all: ['map'] as const,
  companies: (searchTerm: string) => [...mapKeys.all, 'companies', searchTerm] as const,
};

export function useMapCompanies(searchTerm: string, enabled = true) {
  return useQuery({
    queryKey: mapKeys.companies(searchTerm),
    queryFn: () => mapApi.getCompanies(searchTerm),
    enabled,
  });
}
