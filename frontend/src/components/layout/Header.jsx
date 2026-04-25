import { Menu, Bell } from 'lucide-react';
import { usePermission } from '../../hooks/usePermission';

export default function Header({ onMenuClick }) {
  const { user } = usePermission();

  return (
    <header className="bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between flex-shrink-0">
      <button
        onClick={onMenuClick}
        className="lg:hidden text-gray-500 hover:text-gray-700 p-1"
      >
        <Menu size={22} />
      </button>
      <div className="flex items-center gap-4 ml-auto">
        <div className="text-sm text-gray-500 hidden sm:block">
          Welcome, <span className="font-medium text-gray-800">{user?.name}</span>
        </div>
      </div>
    </header>
  );
}