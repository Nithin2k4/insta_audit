import { Menu, Bell } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function Navbar({ onMenuClick }) {
  const { user } = useAuth();

  return (
    <header className="bg-dark-400 border-b border-white/10 px-4 lg:px-6 h-16 flex items-center justify-between sticky top-0 z-30">
      <button
        onClick={onMenuClick}
        className="lg:hidden p-2 rounded-lg hover:bg-white/10 transition-colors"
        aria-label="Open menu"
      >
        <Menu size={20} className="text-white" />
      </button>

      <div className="flex-1 lg:flex-none" />

      <div className="flex items-center gap-3">
        <button className="p-2 rounded-lg hover:bg-white/10 transition-colors relative">
          <Bell size={20} className="text-white/60" />
        </button>
        <div className="w-8 h-8 rounded-full bg-primary-500 flex items-center justify-center text-white text-sm font-bold">
          {user?.name?.[0]?.toUpperCase() || 'U'}
        </div>
      </div>
    </header>
  );
}
