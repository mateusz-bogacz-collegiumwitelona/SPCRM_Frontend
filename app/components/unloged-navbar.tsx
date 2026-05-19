import { Menu } from 'lucide-react';

export function Navbar() {
  return (
    <nav className="fixed top-0 left-0 right-0 bg-[#004a8f] h-20 flex items-center justify-between px-4 z-50">
      <button className="text-white hover:opacity-80 transition-opacity ml-auto">
        <Menu size={40} className="text-white" />
      </button>
    </nav>
  );
}
