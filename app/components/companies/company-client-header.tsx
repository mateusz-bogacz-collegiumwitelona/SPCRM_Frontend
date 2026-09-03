import React from 'react';
import { Pencil } from 'lucide-react';
import { Button } from '~/components/ui/button';

interface ClientHeaderProps {
  isLoading: boolean;
  isError: boolean;
  basicInfo?: {
    name: string;
    nip: string;
    isYour: boolean;
  };
  onEditClick?: () => void;
}

export const CompanyClientHeader: React.FC<ClientHeaderProps> = ({
  isLoading,
  isError,
  basicInfo,
  onEditClick,
}) => {
  if (isLoading) {
    return (
      <div className="mb-6 lg:mb-8 animate-pulse">
        <div className="h-10 bg-gray-200 rounded w-1/3 mb-2"></div>
        <div className="h-6 bg-gray-200 rounded w-24"></div>
      </div>
    );
  }

  if (isError || !basicInfo) {
    return (
      <div className="text-red-500 font-medium mb-6 lg:mb-8">
        Nie udało się pobrać danych firmy.
      </div>
    );
  }

  return (
    <div className="mb-6 lg:mb-8 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
      <div>
        <h1 className="text-3xl lg:text-4xl font-normal text-[#004a8f] mb-2">
          {basicInfo.name}{' '}
          <span className="text-xl text-gray-500 ml-2">(NIP: {basicInfo.nip})</span>
        </h1>
        <div
          className={`inline-block px-3 py-1 rounded-full ${
            basicInfo.isYour ? 'bg-[#d4edda] text-[#28a745]' : 'bg-gray-100 text-gray-600'
          }`}
        >
          <span className="font-medium text-sm">
            {basicInfo.isYour ? 'Twój klient' : 'Obcy klient'}
          </span>
        </div>
      </div>

      {onEditClick && (
        <Button
          type="button"
          variant="outline"
          onClick={onEditClick}
          className="self-start sm:self-auto flex items-center gap-2 border-gray-300 text-gray-700 hover:bg-gray-50 hover:text-blue-900"
        >
          <Pencil className="w-4 h-4" />
          <span>Edytuj firmę</span>
        </Button>
      )}
    </div>
  );
};
