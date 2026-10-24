import React from 'react';
import { LayoutDashboard, CreditCard, Settings as SettingsIcon, LogOut, X } from 'lucide-react';

const Sidebar = ({ user, t, activeTab, setActiveTab, isSidebarOpen, setIsSidebarOpen, handleLogout, pendingCount, navigate }) => {
  return (
    <aside className={`fixed inset-y-0 left-0 z-50 w-64 bg-white border-r border-gray-200 transform transition-transform duration-300 ease-in-out md:translate-x-0 ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
      <div className="h-16 flex items-center justify-between px-6 border-b border-gray-100">
        <div className="flex items-center gap-2">
          <div className="bg-blue-600 text-white font-extrabold w-9 h-9 rounded-xl flex items-center justify-center shadow-md">
            E
          </div>
          <h1 className="text-xl font-extrabold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
            {t.appName}
          </h1>
        </div>
        <button onClick={() => setIsSidebarOpen(false)} className="md:hidden text-gray-400 hover:text-gray-600">
          <X size={20} />
        </button>
      </div>

      <div className="p-4 mx-4 my-4 bg-blue-50/60 rounded-2xl border border-blue-100/60">
        <p className="text-xs text-gray-500 font-medium">{t.greeting}</p>
        <p className="text-sm font-bold text-gray-800 truncate">{user?.name}</p>
        <span className="inline-block mt-1 px-2 py-0.5 bg-blue-600 text-white text-[10px] font-bold rounded-md uppercase tracking-wider">
          {user?.role === 'admin' ? t.admin : t.member}
        </span>
      </div>

      <nav className="p-4 space-y-1.5">
        <button
          onClick={() => { setActiveTab('dashboard'); setIsSidebarOpen(false); }}
          className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-semibold text-sm transition ${
            activeTab === 'dashboard' 
              ? 'bg-blue-600 text-white shadow-md shadow-blue-500/20' 
              : 'text-gray-600 hover:bg-gray-100'
          }`}
        >
          <LayoutDashboard size={18} /> {t.dashboard}
        </button>

        {user?.role === 'admin' && (
          <button
            onClick={() => { setActiveTab('payments'); setIsSidebarOpen(false); }}
            className={`w-full flex items-center justify-between px-4 py-3 rounded-xl font-semibold text-sm transition ${
              activeTab === 'payments' 
                ? 'bg-blue-600 text-white shadow-md shadow-blue-500/20' 
                : 'text-gray-600 hover:bg-gray-100'
            }`}
          >
            <div className="flex items-center gap-3">
              <CreditCard size={18} /> {t.paymentVerifications}
            </div>
            {pendingCount > 0 && (
              <span className={`text-xs px-2 py-0.5 rounded-full font-bold ${activeTab === 'payments' ? 'bg-white text-blue-600' : 'bg-red-500 text-white'}`}>
                {pendingCount}
              </span>
            )}
          </button>
        )}

        <button
          onClick={() => { navigate('/settings'); setIsSidebarOpen(false); }}
          className="w-full flex items-center gap-3 px-4 py-3 rounded-xl font-semibold text-sm text-gray-600 hover:bg-gray-100 transition"
        >
          <SettingsIcon size={18} /> {t.settings}
        </button>
      </nav>

      <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-gray-100 bg-white">
        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-3 px-4 py-2.5 rounded-xl font-semibold text-sm text-red-600 bg-red-50 hover:bg-red-100 transition border border-red-100"
        >
          <LogOut size={18} /> {t.logout}
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;