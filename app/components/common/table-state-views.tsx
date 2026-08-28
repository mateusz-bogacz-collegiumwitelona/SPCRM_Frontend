import React from 'react';
import { Button } from '~/components/ui/button';
import { Loader2 } from 'lucide-react';

export const TableLoadingState: React.FC<{ readonly message?: string }> = ({
  message = 'Wczytywanie danych...',
}) => (
  <div className="flex flex-col items-center justify-center py-20">
    <Loader2 className="h-10 w-10 animate-spin text-blue-900 mb-4" />
    <p className="text-gray-500 font-medium">{message}</p>
  </div>
);

export const TableEmptyState: React.FC<{ readonly message?: string }> = ({
  message = 'Brak danych do wyświetlenia.',
}) => (
  <div className="text-center py-16 bg-white rounded-lg border border-gray-200 shadow-sm">
    <p className="text-gray-500 font-medium">{message}</p>
  </div>
);

export const MobileLoadMoreButton: React.FC<{
  readonly isFetching: boolean;
  readonly onClick: () => void;
  readonly label?: string;
}> = ({ isFetching, onClick, label = 'Pokaż więcej wyników' }) => (
  <div className="mt-6 flex justify-center pt-2">
    <Button
      type="button"
      onClick={onClick}
      disabled={isFetching}
      className="w-full bg-blue-900 text-white hover:bg-blue-800 transition-all flex items-center justify-center gap-2 h-11"
    >
      {isFetching ? (
        <>
          <Loader2 className="h-4 w-4 animate-spin" /> Wczytywanie...
        </>
      ) : (
        label
      )}
    </Button>
  </div>
);
