import React, { useState } from 'react';
import { Calendar, MapPinned, CirclePlus, Handshake, Building2 } from 'lucide-react';
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
    label: 'Calendar',
    icon: Calendar,
    href: '#',
    ariaLabel: 'Calendar',
  },
  {
    id: 'map',
    label: 'Locations',
    icon: MapPinned,
    href: '#',
    ariaLabel: 'Locations',
  },
  {
    id: 'add',
    label: 'Add',
    icon: CirclePlus,
    href: '#',
    ariaLabel: 'Add new item',
  },
  {
    id: 'handshake',
    label: 'Partners',
    icon: Handshake,
    href: '#',
    ariaLabel: 'Partners',
  },
  {
    id: 'building',
    label: 'Buildings',
    icon: Building2,
    href: '#',
    ariaLabel: 'Buildings',
  },
];

interface NavigationBarProps {
  items?: NavItem[];
}

export function NavigationBar({ items = defaultNavItems }: NavigationBarProps) {
  const [hoveredItem, setHoveredItem] = useState<string | null>(null);

  return (
    <>
      <nav
        className="fixed bottom-0 left-0 right-0 z-40 bg-[#004a8f] border-t border-white/10 md:hidden"
        role="navigation"
        aria-label="Mobile navigation"
      >
        <div className="flex items-center justify-around h-[77px] px-2">
          {items.map((item) => {
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
        </div>
      </nav>

      <aside
        className="hidden md:flex fixed left-0 top-0 bottom-0 w-auto bg-[#004a8f] border-r border-white/10 flex-col items-center justify-start pt-6 px-2.5 gap-2 z-40"
        role="navigation"
        aria-label="Desktop navigation"
      >
        {items.map((item) => {
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
                <Icon className="w-6 h-6 flex-shrink-0" />
                {isHovered && (
                  <span className="text-white text-sm font-medium whitespace-nowrap opacity-100 transition-opacity duration-150">
                    {item.label}
                  </span>
                )}
              </div>
            </Link>
          );
        })}
      </aside>

      <div className="hidden md:block md:w-[80px] flex-shrink-0" />
    </>
  );
}
