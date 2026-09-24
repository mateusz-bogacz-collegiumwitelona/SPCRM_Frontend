import React from 'react';
import { format } from 'date-fns';
import { pl } from 'date-fns/locale';
import { Clock } from 'lucide-react';
import { UserDashboardContent } from '~/components/user/user-dashboard-content';

export default function UserDashboard() {
  const today = new Date();

  return (
    <div className="space-y-6">
      <div className="bg-blue-900 p-6 text-white rounded-lg shadow-sm flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-xl lg:text-2xl font-bold">Mój Pulpit Handlowy</h1>
          <p className="text-blue-200 text-sm mt-1">
            Zestawienie Twoich wyników, zadań i aktywnych szans sprzedaży.
          </p>
        </div>
        <div className="text-xs bg-blue-800/60 border border-blue-700 px-3 py-1.5 rounded-md text-blue-100 flex items-center gap-2">
          <Clock className="w-3.5 h-3.5" />
          <span>{format(today, 'EEEE, d MMMM yyyy', { locale: pl })}</span>
        </div>
      </div>

      <UserDashboardContent />
    </div>
  );
}
