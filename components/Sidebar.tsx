
import React from 'react';
import { Icons, COLORS } from '../constants';

interface SidebarProps {
  isOpen: boolean;
  onToggle: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({ isOpen, onToggle }) => {
  const navItems = [
    { icon: Icons.Search, label: 'Search', active: true },
    { icon: Icons.History, label: 'Recent Research', active: false },
    { icon: Icons.Bookmark, label: 'Saved Projects', active: false },
    { icon: Icons.Alert, label: 'Alerts', active: false },
    { icon: Icons.TrendingUp, label: 'Insights', active: false },
  ];

  return (
    <aside className={`fixed lg:static inset-y-0 left-0 z-50 transform ${isOpen ? 'translate-x-0' : '-translate-x-full'} lg:translate-x-0 transition-transform duration-300 ease-in-out w-64 bg-[#004d73] text-white flex flex-col h-full shadow-2xl lg:shadow-none`}>
      <div className="p-6 flex items-center gap-3">
        <div className="w-8 h-8 rounded-lg bg-[#009688] flex items-center justify-center font-bold">M</div>
        <h1 className="text-xl font-bold tracking-tight">MedSearch AI</h1>
      </div>

      <nav className="flex-1 px-4 py-4 space-y-1">
        {navItems.map((item, idx) => (
          <button
            key={idx}
            className={`w-full flex items-center gap-4 px-4 py-3 rounded-xl transition-all duration-200 group ${
              item.active 
              ? 'bg-white/10 text-white shadow-lg shadow-black/5' 
              : 'hover:bg-white/5 text-blue-100 hover:text-white'
            }`}
          >
            <item.icon />
            <span className="font-medium">{item.label}</span>
            {item.active && <div className="ml-auto w-1.5 h-1.5 rounded-full bg-[#009688]" />}
          </button>
        ))}
      </nav>

      <div className="p-6 mt-auto">
        <div className="bg-white/5 rounded-2xl p-4 border border-white/10">
          <p className="text-xs text-blue-200 mb-2 uppercase font-semibold tracking-wider">Storage Usage</p>
          <div className="h-1.5 bg-white/10 rounded-full mb-2">
            <div className="h-full bg-[#009688] w-[45%] rounded-full" />
          </div>
          <p className="text-xs text-blue-100">450 of 1000 searches</p>
        </div>
        <button className="w-full mt-4 py-2 px-4 rounded-xl border border-white/20 text-sm font-medium hover:bg-white/10 transition-colors">
          Settings
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;
