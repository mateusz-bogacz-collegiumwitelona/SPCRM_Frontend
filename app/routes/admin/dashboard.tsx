import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { api } from '~/api/api';
import { Link } from 'react-router';
import {
  ShieldCheck,
  Users,
  Coins,
  Ruler,
  Layers,
  ArrowRight,
  UserPlus,
  Loader2,
} from 'lucide-react';
import { Button } from '~/components/ui/button';

interface AdminMetricsResponse {
  totalUsers: number;
  totalSteelGrades: number;
  totalCurrencies: number;
  totalUnits: number;
}

interface SimpleUser {
  id: string;
  firstName?: string;
  lastName?: string;
  userName?: string;
  email: string;
  roles?: string[];
  isActive?: boolean;
}

export default function AdminDashboard() {
  const { data: metrics, isLoading: isMetricsLoading } = useQuery<AdminMetricsResponse>({
    queryKey: ['admin-system-metrics'],
    queryFn: async () => {
      const res = await api.get('/analytics/admin/metrics');
      return res.data?.value || res.data?.data || res.data;
    },
  });

  const { data: usersResponse, isLoading: isUsersLoading } = useQuery({
    queryKey: ['admin-recent-users'],
    queryFn: async () => {
      const res = await api.get('/user', {
        params: { PageNumber: 1, PageSize: 5 },
      });
      return res.data?.value || res.data?.data || res.data;
    },
  });

  const recentUsers: SimpleUser[] = React.useMemo(() => {
    if (!usersResponse) return [];
    if (Array.isArray(usersResponse)) return usersResponse.slice(0, 5);
    if (Array.isArray(usersResponse?.items)) return usersResponse.items.slice(0, 5);
    return [];
  }, [usersResponse]);

  return (
    <div className="space-y-6">
      <div className="bg-slate-900 p-6 text-white rounded-lg shadow-sm flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border border-slate-800">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-slate-800 rounded-lg border border-slate-700">
            <ShieldCheck className="w-7 h-7 text-emerald-400" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl lg:text-2xl font-bold">Panel Administracyjny IT</h1>
              <span className="bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[11px] font-semibold px-2 py-0.5 rounded-full flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                System aktywny
              </span>
            </div>
            <p className="text-slate-400 text-xs sm:text-sm mt-0.5">
              Zarządzanie dostępami, kontami użytkowników oraz słownikami systemowymi
            </p>
          </div>
        </div>

        <Button
          asChild
          className="bg-blue-600 text-white hover:bg-blue-500 font-medium text-xs sm:text-sm shadow-xs"
        >
          <Link to="/users" className="flex items-center gap-2">
            <UserPlus className="w-4 h-4" />
            <span>Zarządzaj kontami</span>
          </Link>
        </Button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-lg border border-gray-200 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-xs font-medium text-gray-500">Konta użytkowników</p>
            <p className="text-2xl font-bold text-gray-900 mt-1">
              {isMetricsLoading ? (
                <Loader2 className="w-5 h-5 animate-spin text-gray-400 mt-1" />
              ) : (
                (metrics?.totalUsers ?? 0)
              )}
            </p>
          </div>
          <div className="p-3 bg-blue-50 text-blue-900 rounded-lg">
            <Users className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white p-5 rounded-lg border border-gray-200 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-xs font-medium text-gray-500">Gatunki stali (Słownik)</p>
            <p className="text-2xl font-bold text-gray-900 mt-1">
              {isMetricsLoading ? (
                <Loader2 className="w-5 h-5 animate-spin text-gray-400 mt-1" />
              ) : (
                (metrics?.totalSteelGrades ?? 0)
              )}
            </p>
          </div>
          <div className="p-3 bg-slate-100 text-slate-800 rounded-lg">
            <Layers className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white p-5 rounded-lg border border-gray-200 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-xs font-medium text-gray-500">Aktywne waluty</p>
            <p className="text-2xl font-bold text-gray-900 mt-1">
              {isMetricsLoading ? (
                <Loader2 className="w-5 h-5 animate-spin text-gray-400 mt-1" />
              ) : (
                (metrics?.totalCurrencies ?? 0)
              )}
            </p>
          </div>
          <div className="p-3 bg-emerald-50 text-emerald-700 rounded-lg">
            <Coins className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white p-5 rounded-lg border border-gray-200 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-xs font-medium text-gray-500">Jednostki miary</p>
            <p className="text-2xl font-bold text-gray-900 mt-1">
              {isMetricsLoading ? (
                <Loader2 className="w-5 h-5 animate-spin text-gray-400 mt-1" />
              ) : (
                (metrics?.totalUnits ?? 0)
              )}
            </p>
          </div>
          <div className="p-3 bg-amber-50 text-amber-700 rounded-lg">
            <Ruler className="w-5 h-5" />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-6 flex flex-col justify-between">
          <div>
            <h2 className="text-base font-semibold text-gray-900 mb-1">Słowniki Konfiguracyjne</h2>
            <p className="text-xs text-gray-500 mb-5">
              Zarządzanie parametrami technicznymi wykorzystywanymi w systemie:
            </p>

            <div className="space-y-3">
              <Link
                to="/steel-grades"
                className="p-4 rounded-lg border border-gray-100 hover:border-blue-900/40 hover:bg-slate-50 transition-all flex items-center justify-between group"
              >
                <div className="flex items-center gap-3.5">
                  <div className="p-2.5 bg-slate-100 text-slate-700 rounded-md group-hover:bg-blue-900 group-hover:text-white transition-colors">
                    <Layers className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-sm font-semibold text-gray-900 group-hover:text-blue-900">
                      Gatunki stali
                    </h3>
                    <p className="text-xs text-gray-500">
                      Zarządzanie specyfikacją i stopami stali
                    </p>
                  </div>
                </div>
                <ArrowRight className="w-4 h-4 text-gray-400 group-hover:text-blue-900 group-hover:translate-x-1 transition-all" />
              </Link>

              <Link
                to="/currencies"
                className="p-4 rounded-lg border border-gray-100 hover:border-blue-900/40 hover:bg-slate-50 transition-all flex items-center justify-between group"
              >
                <div className="flex items-center gap-3.5">
                  <div className="p-2.5 bg-emerald-50 text-emerald-700 rounded-md group-hover:bg-emerald-600 group-hover:text-white transition-colors">
                    <Coins className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-sm font-semibold text-gray-900 group-hover:text-emerald-700">
                      Waluty systemowe
                    </h3>
                    <p className="text-xs text-gray-500">
                      Definiowanie walut i precyzji zaokrągleń
                    </p>
                  </div>
                </div>
                <ArrowRight className="w-4 h-4 text-gray-400 group-hover:text-emerald-700 group-hover:translate-x-1 transition-all" />
              </Link>

              <Link
                to="/units"
                className="p-4 rounded-lg border border-gray-100 hover:border-blue-900/40 hover:bg-slate-50 transition-all flex items-center justify-between group"
              >
                <div className="flex items-center gap-3.5">
                  <div className="p-2.5 bg-amber-50 text-amber-700 rounded-md group-hover:bg-amber-600 group-hover:text-white transition-colors">
                    <Ruler className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-sm font-semibold text-gray-900 group-hover:text-amber-700">
                      Jednostki miar
                    </h3>
                    <p className="text-xs text-gray-500">Tony, metry, kilogramy, sztuki</p>
                  </div>
                </div>
                <ArrowRight className="w-4 h-4 text-gray-400 group-hover:text-amber-700 group-hover:translate-x-1 transition-all" />
              </Link>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 shadow-sm flex flex-col justify-between">
          <div>
            <div className="p-4 border-b border-gray-100 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Users className="w-5 h-5 text-blue-900" />
                <h2 className="text-base font-semibold text-gray-900">Użytkownicy w systemie</h2>
              </div>
              <Link
                to="/users"
                className="text-xs font-medium text-blue-900 hover:text-blue-700 flex items-center gap-1"
              >
                Wszyscy użytkownicy <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            <div className="p-4">
              {isUsersLoading ? (
                <div className="py-8 flex justify-center items-center">
                  <Loader2 className="w-5 h-5 animate-spin text-blue-900" />
                </div>
              ) : recentUsers.length === 0 ? (
                <p className="text-center py-6 text-gray-400 text-sm">
                  Brak użytkowników do wyświetlenia.
                </p>
              ) : (
                <div className="space-y-2.5">
                  {recentUsers.map((u) => {
                    const displayName =
                      u.firstName && u.lastName
                        ? `${u.firstName} ${u.lastName}`
                        : u.userName || u.email;

                    return (
                      <div
                        key={u.id}
                        className="p-3 rounded-lg border border-gray-100 hover:border-gray-200 transition-all flex items-center justify-between gap-3"
                      >
                        <div className="truncate">
                          <Link
                            to={`/user/${u.id}`}
                            className="text-sm font-semibold text-blue-900 hover:underline truncate block"
                          >
                            {displayName}
                          </Link>
                          <p className="text-xs text-gray-500 truncate">{u.email}</p>
                        </div>

                        <div className="flex items-center gap-1.5 shrink-0">
                          {u.roles && u.roles.length > 0 ? (
                            u.roles.map((role) => (
                              <span
                                key={role}
                                className={`text-[11px] px-2 py-0.5 rounded-full font-medium ${
                                  role === 'Admin'
                                    ? 'bg-purple-50 text-purple-700 border border-purple-200'
                                    : role === 'Manager'
                                      ? 'bg-blue-50 text-blue-700 border border-blue-200'
                                      : 'bg-gray-100 text-gray-700'
                                }`}
                              >
                                {role}
                              </span>
                            ))
                          ) : (
                            <span className="text-[11px] px-2 py-0.5 rounded-full bg-gray-100 text-gray-500">
                              Użytkownik
                            </span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          <div className="p-4 border-t border-gray-100 bg-gray-50/50 rounded-b-lg">
            <Button
              asChild
              variant="outline"
              size="sm"
              className="w-full bg-white border-gray-300 text-gray-700 hover:bg-gray-50 text-xs"
            >
              <Link to="/users">Otwórz pełną listę użytkowników</Link>
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
