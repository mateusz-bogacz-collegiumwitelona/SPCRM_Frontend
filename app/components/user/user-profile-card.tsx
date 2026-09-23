import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { format } from 'date-fns';
import { pl } from 'date-fns/locale';
import {
  AlertTriangle,
  Ban,
  Briefcase,
  Building2,
  Calendar,
  CheckCircle2,
  CheckSquare,
  Clock,
  Mail,
  Users,
} from 'lucide-react';
import { api } from '~/api/api';
import { TableEmptyState, TableLoadingState } from '~/components/table/table-state-views';
import { HasRole } from '~/lib/has-role';

export interface UserDetailResponse {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  pendingEmail?: string | null;
  isEmailVerified: boolean;
  isLocked: boolean;
  lockoutEndDate?: string | null;
  companyOwnerCount?: number | null;
  contactOwnerCount?: number | null;
  activeDealCount?: number | null;
  activeTaskCount?: number | null;
  createdAt: string;
  updatedAt?: string | null;
}

const formatDate = (dateString?: string | null) => {
  if (!dateString) return '-';
  return format(new Date(dateString), 'dd.MM.yyyy HH:mm', { locale: pl });
};

export const UserProfileCard: React.FC<{ readonly userId: string }> = ({ userId }) => {
  const {
    data: user,
    isLoading,
    isError,
  } = useQuery<UserDetailResponse>({
    queryKey: ['user-detail', userId],
    queryFn: async () => {
      const response = await api.get(`/user/${userId}`);
      return response.data?.value || response.data?.data || response.data;
    },
    enabled: Boolean(userId),
  });

  if (isLoading) {
    return <TableLoadingState message="Ładowanie profilu użytkownika..." />;
  }

  if (isError || !user) {
    return <TableEmptyState message="Nie udało się załadować danych użytkownika." />;
  }

  return (
    <div className="space-y-6">
      <div className="bg-blue-900 p-4 lg:p-6 text-white rounded-lg shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl lg:text-2xl font-bold tracking-tight">
            {user.firstName} {user.lastName}
          </h1>
          <p className="text-xs lg:text-sm text-blue-200 mt-0.5">{user.email}</p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {user.isLocked ? (
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-red-500/20 text-red-200 border border-red-400/30">
              <Ban className="w-3.5 h-3.5 text-red-300" />
              Zablokowany
            </span>
          ) : (
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-green-500/20 text-green-200 border border-green-400/30">
              <CheckCircle2 className="w-3.5 h-3.5 text-green-300" />
              Aktywny
            </span>
          )}

          <HasRole allowedRoles={['Admin']}>
            {user.isEmailVerified ? (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-blue-500/20 text-blue-200 border border-blue-400/30">
                <CheckCircle2 className="w-3.5 h-3.5 text-blue-300" />
                Email zweryfikowany
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-amber-500/20 text-amber-200 border border-amber-400/30">
                <AlertTriangle className="w-3.5 h-3.5 text-amber-300" />
                Wymaga weryfikacji
              </span>
            )}
          </HasRole>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-xs flex items-center gap-4">
          <div className="p-3 rounded-lg border text-blue-600 bg-blue-50 border-blue-100">
            <Building2 className="w-5 h-5" />
          </div>
          <div>
            <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">Firmy</p>
            <p className="text-xl font-bold text-gray-900 mt-0.5">{user.companyOwnerCount ?? 0}</p>
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-xs flex items-center gap-4">
          <div className="p-3 rounded-lg border text-emerald-600 bg-emerald-50 border-emerald-100">
            <Users className="w-5 h-5" />
          </div>
          <div>
            <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">Kontakty</p>
            <p className="text-xl font-bold text-gray-900 mt-0.5">{user.contactOwnerCount ?? 0}</p>
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-xs flex items-center gap-4">
          <div className="p-3 rounded-lg border text-amber-600 bg-amber-50 border-amber-100">
            <Briefcase className="w-5 h-5" />
          </div>
          <div>
            <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">Sprzedaże</p>
            <p className="text-xl font-bold text-gray-900 mt-0.5">{user.activeDealCount ?? 0}</p>
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-xs flex items-center gap-4">
          <div className="p-3 rounded-lg border text-purple-600 bg-purple-50 border-purple-100">
            <CheckSquare className="w-5 h-5" />
          </div>
          <div>
            <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">Zadania</p>
            <p className="text-xl font-bold text-gray-900 mt-0.5">{user.activeTaskCount ?? 0}</p>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-xs">
        <h2 className="text-base font-semibold text-gray-900 border-b border-gray-100 pb-3 mb-4">
          Informacje o koncie
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-y-4 gap-x-6 text-sm">
          <div>
            <span className="text-gray-500 block text-xs mb-1">Adres e-mail</span>
            <div className="flex items-center gap-2 text-gray-900 font-medium">
              <Mail className="w-4 h-4 text-gray-400" />
              <span>{user.email}</span>
            </div>
          </div>

          <HasRole allowedRoles={['Admin']}>
            {user.pendingEmail && (
              <div>
                <span className="text-gray-500 block text-xs mb-1">Oczekujący nowy e-mail</span>
                <div className="flex items-center gap-2 text-amber-700 font-medium">
                  <Mail className="w-4 h-4 text-amber-500" />
                  <span>{user.pendingEmail}</span>
                </div>
              </div>
            )}
          </HasRole>

          <div>
            <span className="text-gray-500 block text-xs mb-1">Data utworzenia</span>
            <div className="flex items-center gap-2 text-gray-700">
              <Calendar className="w-4 h-4 text-gray-400" />
              <span>{formatDate(user.createdAt)}</span>
            </div>
          </div>

          <div>
            <span className="text-gray-500 block text-xs mb-1">Ostatnia edycja</span>
            <div className="flex items-center gap-2 text-gray-700">
              <Clock className="w-4 h-4 text-gray-400" />
              <span>{formatDate(user.updatedAt)}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
