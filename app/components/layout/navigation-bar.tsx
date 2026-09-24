import React, { useState } from 'react';
import {
  Building2,
  Calendar,
  CirclePlus,
  Briefcase,
  Users,
  LayoutDashboard,
  Layers,
  Coins,
  Ruler,
  Grid,
  FileSpreadsheet,
  FileText,
  Package,
  BadgePercent,
  MapPinned,
  Mail,
  Contact,
  X,
  ArrowRight,
  Plus,
} from 'lucide-react';
import { Link, useLocation } from 'react-router';
import { useAuth } from '~/context/auth-context';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '~/api/api';

// Twoje gotowe modale:
import { AddCompanyDialog } from '~/components/companies/dialogs/add-company-dialog';
import { AddDealDialog } from '~/components/deal/dialogs/add-deal-dialog';
import { AddTaskDialog } from '~/components/task/dialogs/add-task-dialog';
import type { AddCompanyRequest } from '~/interfaces/company';
import type { AddTaskRequestPayload } from '~/interfaces/task';

export type NavItem = {
  id: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  href: string;
  category?: 'crm' | 'finance' | 'inventory' | 'admin';
};

interface NavigationBarProps {
  readonly desktopClassName?: string;
  readonly desktopWidthClassName?: string;
}

export function NavigationBar({
  desktopClassName = '',
  desktopWidthClassName = 'w-52',
}: NavigationBarProps) {
  const { user } = useAuth();
  const location = useLocation();
  const queryClient = useQueryClient();

  const [isMoreOpen, setIsMoreOpen] = useState(false);
  const [isAddMenuOpen, setIsAddMenuOpen] = useState(false);
  const [hoveredItem, setHoveredItem] = useState<string | null>(null);

  const [isAddCompanyOpen, setIsAddCompanyOpen] = useState(false);
  const [isAddDealOpen, setIsAddDealOpen] = useState(false);
  const [isAddTaskOpen, setIsAddTaskOpen] = useState(false);

  const roles = user?.roles || [];
  const isAdmin = roles.includes('Admin');
  const isManager = roles.includes('Manager');

  const addCompanyMutation = useMutation({
    mutationFn: async (payload: AddCompanyRequest) => {
      const response = await api.post('/company', payload);
      return response.data;
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['companies'] });
      setIsAddCompanyOpen(false);
    },
  });

  const addTaskMutation = useMutation({
    mutationFn: async (payload: AddTaskRequestPayload) => {
      await api.post('/tasks', payload);
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['calendar-tasks'] });
      await queryClient.invalidateQueries({ queryKey: ['my-upcoming-tasks'] });
      setIsAddTaskOpen(false);
    },
  });

  const getDesktopItems = (): NavItem[] => {
    if (isAdmin) {
      return [
        { id: 'dashboard', label: 'Pulpit IT', icon: LayoutDashboard, href: '/dashboard' },
        { id: 'users', label: 'Użytkownicy', icon: Users, href: '/users' },
        { id: 'products', label: 'Produkty', icon: Package, href: '/products' },
        { id: 'offers', label: 'Oferty', icon: FileText, href: '/offers' },
        { id: 'steel', label: 'Gatunki stali', icon: Layers, href: '/steel-grades' },
        { id: 'currencies', label: 'Waluty', icon: Coins, href: '/currencies' },
        { id: 'units', label: 'Jednostki miar', icon: Ruler, href: '/units' },
      ];
    }

    const items: NavItem[] = [
      { id: 'dashboard', label: 'Pulpit', icon: LayoutDashboard, href: '/dashboard' },
      { id: 'calendar', label: 'Kalendarz', icon: Calendar, href: '/calendar' },
      { id: 'sales', label: 'Sprzedaż', icon: Briefcase, href: '/sales' },
      { id: 'offers', label: 'Oferty handlowe', icon: FileText, href: '/offers' },
      { id: 'invoices', label: 'Faktury i płatności', icon: FileSpreadsheet, href: '/invoices' },
      { id: 'companies', label: 'Baza firm', icon: Building2, href: '/companies' },
      { id: 'contacts', label: 'Kontakty', icon: Contact, href: '/contacts' },
      { id: 'map', label: 'Mapa klientów', icon: MapPinned, href: '/map' },
      { id: 'products', label: 'Katalog produktów', icon: Package, href: '/products' },
      { id: 'promotions', label: 'Promocje i rabaty', icon: BadgePercent, href: '/promotions' },
    ];

    if (isManager) {
      items.push({ id: 'users', label: 'Pracownicy / Zespół', icon: Users, href: '/users' });
    }

    return items;
  };

  const moreMobileModules: NavItem[] = [
    {
      id: 'offers',
      label: 'Oferty handlowe',
      icon: FileText,
      href: '/offers',
      category: 'finance',
    },
    {
      id: 'invoices',
      label: 'Faktury i płatności',
      icon: FileSpreadsheet,
      href: '/invoices',
      category: 'finance',
    },
    {
      id: 'promotions',
      label: 'Promocje i rabaty',
      icon: BadgePercent,
      href: '/promotions',
      category: 'finance',
    },
    { id: 'contacts', label: 'Baza kontaktów', icon: Contact, href: '/contacts', category: 'crm' },
    { id: 'map', label: 'Mapa klientów', icon: MapPinned, href: '/map', category: 'crm' },
    {
      id: 'products',
      label: 'Katalog produktów',
      icon: Package,
      href: '/products',
      category: 'inventory',
    },
    ...(isManager
      ? [
          {
            id: 'users',
            label: 'Pracownicy / Zespół',
            icon: Users,
            href: '/users',
            category: 'crm' as const,
          },
        ]
      : []),
  ];

  return (
    <>
      <nav className="fixed bottom-0 left-0 right-0 md:hidden flex items-center justify-around h-16 px-1 bg-[#004a8f] z-40 shadow-lg border-t border-blue-900/30">
        {isAdmin ? (
          getDesktopItems()
            .slice(0, 5)
            .map((item) => {
              const Icon = item.icon;
              const isActive = location.pathname === item.href;
              return (
                <Link
                  key={item.id}
                  to={item.href}
                  className={`flex flex-col items-center justify-center p-2 rounded-lg ${
                    isActive ? 'text-white font-bold bg-white/20' : 'text-blue-200'
                  }`}
                >
                  <Icon className="w-5 h-5" />
                  <span className="text-[10px] mt-0.5">{item.label}</span>
                </Link>
              );
            })
        ) : (
          <>
            <Link
              to="/dashboard"
              className={`flex flex-col items-center justify-center p-2 rounded-lg ${
                location.pathname === '/dashboard'
                  ? 'text-white font-bold bg-white/20'
                  : 'text-blue-200'
              }`}
            >
              <LayoutDashboard className="w-5 h-5" />
              <span className="text-[10px] mt-0.5">Pulpit</span>
            </Link>

            <Link
              to="/calendar"
              className={`flex flex-col items-center justify-center p-2 rounded-lg ${
                location.pathname === '/calendar'
                  ? 'text-white font-bold bg-white/20'
                  : 'text-blue-200'
              }`}
            >
              <Calendar className="w-5 h-5" />
              <span className="text-[10px] mt-0.5">Kalendarz</span>
            </Link>

            <button
              type="button"
              onClick={() => setIsAddMenuOpen(true)}
              className="flex flex-col items-center justify-center text-white"
            >
              <div className="bg-white text-[#004a8f] p-2.5 rounded-full shadow-lg -mt-5 border-2 border-[#004a8f] active:scale-95 transition-transform">
                <CirclePlus className="w-6 h-6" />
              </div>
              <span className="text-[10px] mt-0.5 font-medium">Dodaj</span>
            </button>

            <Link
              to="/sales"
              className={`flex flex-col items-center justify-center p-2 rounded-lg ${
                location.pathname === '/sales'
                  ? 'text-white font-bold bg-white/20'
                  : 'text-blue-200'
              }`}
            >
              <Briefcase className="w-5 h-5" />
              <span className="text-[10px] mt-0.5">Sprzedaż</span>
            </Link>

            <button
              type="button"
              onClick={() => setIsMoreOpen(true)}
              className={`flex flex-col items-center justify-center p-2 rounded-lg ${
                isMoreOpen ? 'text-white bg-white/20' : 'text-blue-200'
              }`}
            >
              <Grid className="w-5 h-5" />
              <span className="text-[10px] mt-0.5">Więcej</span>
            </button>
          </>
        )}
      </nav>

      <nav
        className={`hidden md:flex fixed left-0 top-20 bottom-0 ${desktopWidthClassName} bg-[#004a8f] flex-col items-center justify-start pt-5 px-3 gap-1.5 z-40 overflow-y-auto border-r border-[#004a8f]/20 ${desktopClassName}`}
        aria-label="Desktop navigation"
      >
        {!isAdmin && (
          <button
            type="button"
            onClick={() => setIsAddMenuOpen(true)}
            className="w-full mb-3 px-3.5 py-2.5 bg-white text-[#004a8f] hover:bg-blue-50 rounded-lg text-sm font-bold flex items-center justify-center gap-2.5 shadow-md transition-all active:scale-[0.98] cursor-pointer"
          >
            <Plus className="w-5 h-5 stroke-[2.5]" />
            <span>Utwórz nowy</span>
          </button>
        )}

        {getDesktopItems().map((item) => {
          const Icon = item.icon;
          const isHovered = hoveredItem === item.id;
          const isActive = location.pathname === item.href;

          return (
            <Link
              key={item.id}
              to={item.href}
              className="relative flex items-center text-white transition-all duration-150 rounded-lg w-full"
              onMouseEnter={() => setHoveredItem(item.id)}
              onMouseLeave={() => setHoveredItem(null)}
            >
              <div
                className={`flex items-center gap-3 rounded-lg w-full px-3 py-2.5 text-sm font-medium transition-all ${
                  isActive
                    ? 'bg-white/25 text-white font-bold shadow-xs'
                    : isHovered
                      ? 'bg-white/10 text-white'
                      : 'text-blue-100 hover:text-white'
                }`}
              >
                <Icon className="w-5 h-5 shrink-0" />
                <span className="truncate">{item.label}</span>
              </div>
            </Link>
          );
        })}
      </nav>

      {isAddMenuOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 flex flex-col justify-end md:justify-center md:items-center animate-in fade-in p-0 md:p-4">
          <div className="bg-white rounded-t-2xl md:rounded-2xl p-6 shadow-2xl w-full md:max-w-md space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-gray-100">
              <h3 className="font-bold text-gray-900 text-base flex items-center gap-2">
                <CirclePlus className="w-5 h-5 text-blue-900" />
                Co chcesz utworzyć?
              </h3>
              <button
                type="button"
                onClick={() => setIsAddMenuOpen(false)}
                className="p-1.5 rounded-full text-gray-400 hover:text-gray-600 bg-gray-100 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-2.5">
              <Link
                to="/mailing"
                onClick={() => setIsAddMenuOpen(false)}
                className="flex items-center justify-between p-3.5 bg-blue-50/70 border border-blue-200/80 rounded-xl hover:bg-blue-100/60 transition-colors group cursor-pointer"
              >
                <div className="flex items-center gap-3.5">
                  <div className="p-2.5 bg-blue-900 text-white rounded-lg group-hover:scale-105 transition-transform">
                    <Mail className="w-5 h-5" />
                  </div>
                  <div>
                    <span className="text-sm font-bold text-blue-950 block">
                      Nowa oferta (Kreator Mailingu)
                    </span>
                    <span className="text-xs text-blue-700">
                      Przygotuj i wyślij ofertę do kontrahentów
                    </span>
                  </div>
                </div>
                <ArrowRight className="w-4 h-4 text-blue-900 group-hover:translate-x-0.5 transition-transform" />
              </Link>

              <button
                type="button"
                onClick={() => {
                  setIsAddMenuOpen(false);
                  setIsAddDealOpen(true);
                }}
                className="w-full text-left flex items-center justify-between p-3 border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors group cursor-pointer"
              >
                <div className="flex items-center gap-3.5">
                  <div className="p-2 bg-emerald-50 text-emerald-700 rounded-lg group-hover:scale-105 transition-transform">
                    <Briefcase className="w-5 h-5" />
                  </div>
                  <div>
                    <span className="text-sm font-semibold text-gray-900 block">
                      Nowa transakcja
                    </span>
                    <span className="text-xs text-gray-500">
                      Zarejestruj szansę w lejku sprzedaży
                    </span>
                  </div>
                </div>
                <ArrowRight className="w-4 h-4 text-gray-400 group-hover:translate-x-0.5 transition-transform" />
              </button>

              <button
                type="button"
                onClick={() => {
                  setIsAddMenuOpen(false);
                  setIsAddCompanyOpen(true);
                }}
                className="w-full text-left flex items-center justify-between p-3 border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors group cursor-pointer"
              >
                <div className="flex items-center gap-3.5">
                  <div className="p-2 bg-purple-50 text-purple-700 rounded-lg group-hover:scale-105 transition-transform">
                    <Building2 className="w-5 h-5" />
                  </div>
                  <div>
                    <span className="text-sm font-semibold text-gray-900 block">Dodaj firmę</span>
                    <span className="text-xs text-gray-500">Wprowadź nowego klienta do bazy</span>
                  </div>
                </div>
                <ArrowRight className="w-4 h-4 text-gray-400 group-hover:translate-x-0.5 transition-transform" />
              </button>

              <button
                type="button"
                onClick={() => {
                  setIsAddMenuOpen(false);
                  setIsAddTaskOpen(true);
                }}
                className="w-full text-left flex items-center justify-between p-3 border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors group cursor-pointer"
              >
                <div className="flex items-center gap-3.5">
                  <div className="p-2 bg-amber-50 text-amber-700 rounded-lg group-hover:scale-105 transition-transform">
                    <Calendar className="w-5 h-5" />
                  </div>
                  <div>
                    <span className="text-sm font-semibold text-gray-900 block">
                      Zaplanuj zadanie
                    </span>
                    <span className="text-xs text-gray-500">
                      Dodaj telefon, spotkanie lub przypomnienie
                    </span>
                  </div>
                </div>
                <ArrowRight className="w-4 h-4 text-gray-400 group-hover:translate-x-0.5 transition-transform" />
              </button>
            </div>
          </div>
        </div>
      )}

      {isMoreOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 md:hidden flex flex-col justify-end animate-in fade-in">
          <div className="bg-white rounded-t-2xl p-5 max-h-[85vh] overflow-y-auto shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-gray-100">
              <h3 className="font-bold text-gray-900 text-base flex items-center gap-2">
                <Grid className="w-5 h-5 text-blue-900" />
                Pozostałe moduły
              </h3>
              <button
                type="button"
                onClick={() => setIsMoreOpen(false)}
                className="p-1 rounded-full text-gray-400 hover:text-gray-600 bg-gray-100 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="grid grid-cols-2 gap-2.5 pt-4 pb-4">
              {moreMobileModules.map((mod) => {
                const Icon = mod.icon;
                return (
                  <Link
                    key={mod.id}
                    to={mod.href}
                    onClick={() => setIsMoreOpen(false)}
                    className="p-3 border border-gray-200 rounded-xl hover:bg-blue-50/50 flex flex-col gap-2 transition-all bg-white shadow-2xs"
                  >
                    <div className="p-2 bg-blue-50 text-blue-900 rounded-lg w-fit">
                      <Icon className="w-5 h-5" />
                    </div>
                    <div>
                      <span className="text-xs font-semibold text-gray-900 block leading-tight">
                        {mod.label}
                      </span>
                    </div>
                  </Link>
                );
              })}
            </div>
          </div>
        </div>
      )}

      <AddDealDialog
        isOpen={isAddDealOpen}
        onClose={() => setIsAddDealOpen(false)}
        onSuccess={() => {
          queryClient.invalidateQueries({ queryKey: ['sales'] });
          queryClient.invalidateQueries({ queryKey: ['my-recent-sales'] });
        }}
      />

      <AddCompanyDialog
        isOpen={isAddCompanyOpen}
        onClose={() => setIsAddCompanyOpen(false)}
        onSave={async (data) => {
          await addCompanyMutation.mutateAsync(data);
        }}
        isLoading={addCompanyMutation.isPending}
      />

      <AddTaskDialog
        isOpen={isAddTaskOpen}
        onClose={() => setIsAddTaskOpen(false)}
        onSave={async (payload) => {
          await addTaskMutation.mutateAsync(payload);
        }}
        isLoading={addTaskMutation.isPending}
        dialogTitle="Dodaj nowe zadanie"
      />
    </>
  );
}
