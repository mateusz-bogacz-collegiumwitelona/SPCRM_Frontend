import type { ReactNode } from 'react';
import { Navbar } from '~/components/layout/logged-navbar';
import { NavigationBar } from '~/components/layout/navigation-bar';

interface MainLayoutProps {
  readonly children: ReactNode;
  readonly wrapperClassName?: string;
  readonly contentClassName?: string;
  readonly navDesktopWidthClass?: string;
  readonly navDesktopClassName?: string;
}

export function MainLayout({
  children,
  wrapperClassName = 'min-h-screen bg-gray-50 pt-20 md:pl-52 pb-24 md:pb-0',
  contentClassName = 'mx-auto w-full max-w-400 p-4 lg:p-8',
  navDesktopWidthClass = 'w-52',
  navDesktopClassName = 'top-20 border-r border-brand/10 bg-brand',
}: MainLayoutProps) {
  return (
    <div className={wrapperClassName}>
      <Navbar />
      <NavigationBar
        desktopClassName={navDesktopClassName}
        desktopWidthClassName={navDesktopWidthClass}
      />
      <main className={contentClassName}>{children}</main>
    </div>
  );
}
