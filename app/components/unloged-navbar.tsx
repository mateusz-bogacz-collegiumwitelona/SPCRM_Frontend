import { Menu } from 'lucide-react';

export function Navbar() {
  return (
    <nav className="fixed top-0 left-0 right-0 z-50 flex h-20 items-center justify-between border-b border-black/5 bg-[#004a8f] px-4 shadow-[0_4px_12px_rgba(0,0,0,0.2)]">
      <button
        type="button"
        className="ml-auto inline-flex items-center justify-center rounded-md text-white transition-opacity hover:opacity-80"
        aria-label="Menu"
      >
        <Menu size={40} className="text-white" />
      </button>
    </nav>
  );
}
