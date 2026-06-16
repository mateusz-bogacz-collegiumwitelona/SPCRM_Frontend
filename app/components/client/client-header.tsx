import React from 'react';

interface ClientHeaderProps {
  isLoading: boolean;
  isError: boolean;
  basicInfo?: {
    name: string;
    nip: string;
    isYour: boolean;
  };
}

export const ClientHeader: React.FC<ClientHeaderProps> = ({ isLoading, isError, basicInfo }) => {
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
    <div className="mb-6 lg:mb-8">
      <h1 className="text-3xl lg:text-4xl font-normal text-[#004a8f] mb-2">
        {basicInfo.name} <span className="text-xl text-gray-500 ml-2">(NIP: {basicInfo.nip})</span>
      </h1>
      <div
        className={`inline-block px-3 py-1 rounded-full ${basicInfo.isYour ? 'bg-[#d4edda] text-[#28a745]' : 'bg-gray-100 text-gray-600'}`}
      >
        <span className="font-medium text-sm">
          {basicInfo.isYour ? 'Twój klient' : 'Obcy klient'}
        </span>
      </div>
    </div>
  );
};
