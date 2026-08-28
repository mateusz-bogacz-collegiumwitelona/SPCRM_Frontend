import React, { useState } from 'react';
import { Building2, Calendar, CirclePlus, Handshake, MapPinned, Package } from 'lucide-react';
import { Link } from 'react-router';

export type NavItem = {
  id: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  href: string;
  ariaLabel?: string;
};

export const defaultNavItems: NavItem[] = [
  {
    id: 'calendar',
    label: 'Kalendarz',
    icon: Calendar,
    href: '/calendar',
    ariaLabel: 'Kalendarz',
  },
  {
    id: 'map',
    label: 'Mapa',
    icon: MapPinned,
    href: '/map',
    ariaLabel: 'Mapa',
  },
  {
    id: 'add',
    label: 'Dodaj',
    icon: CirclePlus,
    href: '#',
    ariaLabel: 'Dodaj nowy element',
  },
  {
    id: 'handshake',
    label: 'Kontakty',
    icon: Handshake,
    href: '/contacts',
    ariaLabel: 'Kontakty',
  },
  {
    id: 'building',
    label: 'Firmy',
    icon: Building2,
    href: '/companies',
    ariaLabel: 'Firmy',
  },
  {
    id: 'products',
    label: 'Produkty',
    icon: Package,
    href: '/products',
    ariaLabel: 'Produkty',
  },
];

interface NavigationBarProps {
  desktopClassName?: string;
  spacerClassName?: string;
  desktopWidthClassName?: string;
  spacerWidthClassName?: string;
}

export function NavigationBar({
  desktopClassName = '',
  spacerClassName = '',
  desktopWidthClassName = 'w-20',
  spacerWidthClassName = 'md:w-20',
}: Readonly<NavigationBarProps>) {
  const [hoveredItem, setHoveredItem] = useState<string | null>(null);

  return (
    <>
      <nav className="fixed bottom-0 left-0 right-0 md:hidden flex items-center justify-around h-19.25 px-2 bg-[#004a8f] z-40">
        {defaultNavItems.map((item) => {
          const Icon = item.icon;
          return (
            <Link
              key={item.id}
              to={item.href}
              className="relative flex items-center justify-center text-white transition-all duration-200 rounded-lg p-2.5 hover:bg-white/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/50 focus-visible:ring-offset-2 focus-visible:ring-offset-[#004a8f]"
              aria-label={item.ariaLabel || item.label}
              title={item.label}
              onMouseEnter={() => setHoveredItem(item.id)}
              onMouseLeave={() => setHoveredItem(null)}
            >
              <Icon className="w-6 h-6" />
            </Link>
          );
        })}
      </nav>

      <nav
        className={`hidden md:flex fixed left-0 top-0 bottom-0 ${desktopWidthClassName} bg-[#004a8f] flex-col items-center justify-start pt-6 px-2.5 gap-2 z-40 ${desktopClassName}`}
        aria-label="Desktop navigation"
      >
        {defaultNavItems.map((item) => {
          const Icon = item.icon;
          const isHovered = hoveredItem === item.id;

          return (
            <Link
              key={item.id}
              to={item.href}
              className="relative flex items-center text-white transition-all duration-200 rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/50 focus-visible:ring-offset-2 focus-visible:ring-offset-[#004a8f]"
              aria-label={item.ariaLabel || item.label}
              title={item.label}
              onMouseEnter={() => setHoveredItem(item.id)}
              onMouseLeave={() => setHoveredItem(null)}
            >
              <div
                className={`flex items-center gap-2 rounded-lg transition-all duration-200 ${
                  isHovered ? 'bg-white/10 px-3 py-2.5 w-auto shadow-md' : 'p-2.5 w-auto'
                }`}
              >
                <Icon className="w-6 h-6 shrink-0" />
                {isHovered && (
                  <span className="text-white text-sm font-medium whitespace-nowrap opacity-100 transition-opacity duration-150">
                    {item.label}
                  </span>
                )}
              </div>
            </Link>
          );
        })}
      </nav>

      <div className={`hidden md:block ${spacerWidthClassName} shrink-0 ${spacerClassName}`} />
    </>
  );
}
