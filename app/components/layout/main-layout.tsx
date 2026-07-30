import type { ReactNode } from 'react';
import { Navbar } from '~/components/layout/logged-navbar';
import { NavigationBar } from '~/components/layout/navigation-bar';

interface MainLayoutProps {
  children: ReactNode;
  wrapperClassName?: string;
  contentClassName?: string;
  navDesktopWidthClass?: string;
  navDesktopClassName?: string;
}

export function MainLayout({
  children,
  wrapperClassName = 'min-h-screen bg-gray-50 pt-20 md:pl-32 pb-24 md:pb-0',
  contentClassName = 'mx-auto w-full max-w-400 p-4 lg:p-8',
  navDesktopWidthClass = 'w-32',
  navDesktopClassName = 'top-20 border-r border-[#004a8f]/10 bg-[#004a8f]',
}: MainLayoutProps) {
  return (
    <div className={wrapperClassName}>
      <Navbar />
      <NavigationBar
        desktopClassName={navDesktopClassName}
        spacerClassName="hidden"
        desktopWidthClassName={navDesktopWidthClass}
        spacerWidthClassName={`md:${navDesktopWidthClass}`}
      />
      <main className={contentClassName}>{children}</main>
    </div>
  );
}
