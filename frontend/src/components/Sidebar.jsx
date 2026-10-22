import React from 'react';
import { LayoutDashboard, Users, FileText, Gift, UserCog, LogOut } from 'lucide-react';

const Sidebar = ({ activeTab, setActiveTab, user, onLogout }) => {
  const menuItems = [
    { id: 'dashboard', label: 'ዋና ገጽ (Dashboard)', icon: LayoutDashboard },
    { id: 'groups', label: 'የእቁብ ቢሮዎች', icon: Users },
    { id: 'ledger', label: 'የክፍያ ደብተር', icon: FileText },
    { id: 'lottery', label: 'የዕጣ ማውጫ', icon: Gift },
    { id: 'profile', label: 'ፕሮፋይል & መቼቶች', icon: UserCog },
  ];

  return (
    <aside className="w-64 bg-white border-r min-h-screen flex flex-col justify-between hidden md:flex sticky top-0 flex-shrink-0">
      <div>
        {/* Logo Header */}
        <div className="p-6 border-b flex items-center gap-3">
          <div className="bg-blue-600 text-white font-extrabold px-3 py-1.5 rounded-xl text-xl shadow-md">
            እ
          </div>
          <div>
            <h1 className="font-bold text-gray-800 text-base">እቁብ መተግበሪያ</h1>
            <p className="text-xs text-gray-500 font-medium">{user?.name} ({user?.role})</p>
          </div>
        </div>

        {/* Navigation Menu */}
        <nav className="p-4 space-y-1.5">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-xs font-bold transition ${
                  isActive 
                    ? 'bg-blue-600 text-white shadow-md' 
                    : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                }`}
              >
                <Icon size={18} />
                {item.label}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Logout Footer */}
      <div className="p-4 border-t">
        <button
          onClick={onLogout}
          className="w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-xs font-bold text-red-600 bg-red-50 hover:bg-red-100 transition"
        >
          <LogOut size={18} />
          ውጣ (Logout)
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;