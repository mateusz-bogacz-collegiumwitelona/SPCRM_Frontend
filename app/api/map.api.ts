import { client } from '~/lib/client';
import type { CompanyMapData } from '~/types/map';

interface MapApiResponse {
  success: boolean;
  message: string;
  data: CompanyMapData[];
  errorCode?: string;
  errors?: string[];
}

export const mapApi = {
  getCompanies: async (searchTerm?: string): Promise<CompanyMapData[]> => {
    const endpoint = searchTerm
      ? `/company/map?searchTerm=${encodeURIComponent(searchTerm)}`
      : `/company/map`;

    const response = await client.get<MapApiResponse>(endpoint);
    return response.data?.data || [];
  },
};
