
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
    <aside 
      className={`fixed lg:static inset-y-0 left-0 z-50 flex flex-col h-full bg-[#004d73] text-white shadow-2xl lg:shadow-none transition-all duration-300 ease-in-out border-r border-white/10 ${
        isOpen ? 'w-64 translate-x-0' : 'w-20 -translate-x-full lg:translate-x-0'
      }`}
    >
      <div className={`p-6 flex items-center gap-3 overflow-hidden ${!isOpen ? 'justify-center' : ''}`}>
        <div className="w-8 h-8 flex-shrink-0 rounded-lg bg-[#009688] flex items-center justify-center font-bold shadow-lg">M</div>
        <h1 className={`text-xl font-bold tracking-tight whitespace-nowrap transition-opacity duration-300 ${isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}>
          MedSearch AI
        </h1>
      </div>

      <nav className="flex-1 px-3 py-4 space-y-2 overflow-y-auto custom-scrollbar">
        {navItems.map((item, idx) => (
          <button
            key={idx}
            className={`w-full flex items-center rounded-xl transition-all duration-200 group relative ${
              isOpen ? 'px-4 py-3 gap-4' : 'p-3 justify-center'
            } ${
              item.active 
              ? 'bg-white/10 text-white shadow-lg shadow-black/5' 
              : 'hover:bg-white/5 text-blue-100 hover:text-white'
            }`}
            title={!isOpen ? item.label : ''}
          >
            <item.icon />
            <span className={`font-medium whitespace-nowrap transition-all duration-300 overflow-hidden ${isOpen ? 'opacity-100 w-auto' : 'opacity-0 w-0'}`}>
              {item.label}
            </span>
            {item.active && (
              <div className={`rounded-full bg-[#009688] transition-all ${
                isOpen ? 'ml-auto w-1.5 h-1.5' : 'absolute bottom-1 right-1 w-1 h-1'
              }`} />
            )}
          </button>
        ))}
      </nav>

      <div className={`p-4 mt-auto border-t border-white/5 transition-all duration-300 ${!isOpen ? 'items-center' : ''}`}>
        {isOpen && (
          <div className="bg-white/5 rounded-2xl p-4 border border-white/10 mb-4 animate-in fade-in duration-500">
            <p className="text-[10px] text-blue-200 mb-2 uppercase font-bold tracking-widest">Storage Usage</p>
            <div className="h-1.5 bg-white/10 rounded-full mb-2">
              <div className="h-full bg-[#009688] w-[45%] rounded-full shadow-[0_0_8px_rgba(0,150,136,0.5)]" />
            </div>
            <p className="text-[10px] text-blue-100 font-mono">450 / 1000 searches</p>
          </div>
        )}
        
        <button className={`w-full flex items-center transition-all border border-white/20 rounded-xl hover:bg-white/10 ${isOpen ? 'py-2 px-4 gap-3 text-sm' : 'p-3 justify-center'}`}>
          <div className="w-5 h-5 flex items-center justify-center">
             <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.1a2 2 0 0 1-1-1.72v-.51a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z"/><circle cx="12" cy="12" r="3"/></svg>
          </div>
          <span className={`font-medium whitespace-nowrap transition-all duration-300 overflow-hidden ${isOpen ? 'opacity-100 w-auto' : 'opacity-0 w-0'}`}>Settings</span>
        </button>

        <button 
          onClick={onToggle}
          className="mt-4 w-full flex items-center justify-center p-2 text-blue-200 hover:text-white transition-colors"
        >
          <div className={`transition-transform duration-300 ${isOpen ? 'rotate-180' : 'rotate-0'}`}>
            <Icons.ChevronRight />
          </div>
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;
