import React from 'react';
import { LayoutDashboard, Users, FileText, Gift, UserCog, LogOut } from 'lucide-react';

const Sidebar = ({ activeTab, setActiveTab, user, onLogout }) => {
  const menuItems = [
    { id: 'dashboard', label: 'ዋና ገጽ (Dashboard)', icon: LayoutDashboard },
    { id: 'groups', label: 'የእቁብ ቢሮዎች', icon: Users },
    { id: 'ledger', label: 'የክፍያ ደብተር (Ledger)', icon: FileText },
    { id: 'lottery', label: 'የዕጣ ማውጫ & አሸናፊዎች', icon: Gift },
    { id: 'profile', label: 'პроፋይል & መቼቶች', icon: UserCog },
  ];

  return (
    <aside className="w-64 bg-white border-r min-h-screen flex flex-col justify-between hidden md:flex sticky top-0">
      <div>
        {/* Logo / Brand */}
        <div className="p-6 border-b flex items-center gap-2">
          <div className="bg-blue-600 text-white font-bold p-2 rounded-xl text-lg">እ</div>
          <div>
            <h1 className="font-bold text-gray-800 text-lg">እቁብ መተግበሪያ</h1>
            <p className="text-xs text-gray-500">{user?.name} ({user?.role})</p>
          </div>
        </div>

        {/* Menu Links */}
        <nav className="p-4 space-y-1.5">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold transition ${
                  isActive 
                    ? 'bg-blue-50 text-blue-600 shadow-sm' 
                    : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                }`}
              >
                <Icon size={18} />
                {item.label}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Logout Button */}
      <div className="p-4 border-t">
        <button
          onClick={onLogout}
          className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold text-red-600 bg-red-50 hover:bg-red-100 transition"
        >
          <LogOut size={18} />
          ውጣ (Logout)
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;