import { Menu } from 'lucide-react';

export function Navbar() {
  return (
    <nav className="bg-[#004a8f] h-20 w-full rounded-b-lg shadow-md flex items-center justify-between px-4">
      <button className="text-white hover:opacity-80 transition-opacity ml-auto">
        <Menu size={40} className="text-white" />
      </button>
    </nav>
  );
}
