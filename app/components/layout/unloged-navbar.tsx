import { useState } from 'react';
import { LifeBuoy, Menu } from 'lucide-react';
import { Link } from 'react-router';

export function Navbar() {
  const [isOpen, setIsOpen] = useState(false);

  const closeMenu = () => setIsOpen(false);

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 flex h-20 items-center border-b border-black/5 bg-[#004a8f] px-4 shadow-[0_4px_12px_rgba(0,0,0,0.2)]">
      <div className="relative ml-auto">
        <button
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          className="flex items-center justify-center rounded-md p-2 text-white transition-opacity hover:opacity-80 focus:outline-none"
          aria-label="Menu"
          aria-expanded={isOpen}
        >
          <Menu size={32} className="text-white" />
        </button>

        {isOpen && (
          <>
            <button className="fixed inset-0 z-40" onClick={closeMenu} />

            <div className="absolute right-0 top-full mt-2 w-56 rounded-md bg-white py-1 shadow-lg ring-1 ring-black/5 z-50">
              <Link
                to="/help"
                onClick={closeMenu}
                className="flex items-center gap-3 px-4 py-3 text-sm text-[#1f1f1f] transition-colors hover:bg-blue-50 hover:text-[#004a8f]"
              >
                <LifeBuoy size={18} />
                <span className="font-medium">Pomoc techniczna</span>
              </Link>
            </div>
          </>
        )}
      </div>
    </nav>
  );
}
