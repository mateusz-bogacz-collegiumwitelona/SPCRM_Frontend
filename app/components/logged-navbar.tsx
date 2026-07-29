import { useState } from 'react';
import { LifeBuoy, LogOut, User } from 'lucide-react';
import { Link, useNavigate } from 'react-router';
import { useAuth } from '~/context/auth-context';

export function Navbar() {
  const [isOpen, setIsOpen] = useState(false);

  const { logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    setIsOpen(false);
    await logout();
    navigate('/', { replace: true });
  };

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 flex h-20 items-center justify-between border-b border-black/5 bg-[#004a8f] px-4 shadow-[0_4px_12px_rgba(0,0,0,0.2)]">
      <div className="text-white font-bold text-xl">{/* LOGO */}</div>

      <div className="relative">
        <button
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          className="flex items-center justify-center rounded-md p-2 text-white transition-opacity hover:opacity-80 focus:outline-none"
          aria-label="Menu użytkownika"
          aria-expanded={isOpen}
        >
          <User size={28} />
        </button>

        {isOpen && (
          <>
            <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)} />

            <div className="absolute right-0 top-full mt-2 w-56 rounded-md bg-white py-1 shadow-lg ring-1 ring-black/5 z-50">
              <Link
                to="/help"
                onClick={() => setIsOpen(false)}
                className="flex items-center gap-3 px-4 py-3 text-sm text-gray-700 transition-colors hover:bg-blue-50 hover:text-[#004a8f]"
              >
                <LifeBuoy size={18} />
                <span className="font-medium">Pomoc techniczna</span>
              </Link>

              <div className="my-1 border-t border-gray-100"></div>

              <button
                onClick={handleLogout}
                className="flex w-full items-center gap-3 px-4 py-3 text-left text-sm text-red-600 transition-colors hover:bg-red-50 hover:text-red-700"
              >
                <LogOut size={18} />
                <span className="font-medium">Wyloguj się</span>
              </button>
            </div>
          </>
        )}
      </div>
    </nav>
  );
}
