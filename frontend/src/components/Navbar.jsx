import React, { useContext } from 'react';
import { AuthContext } from '../context/AuthContext';

const Navbar = () => {
  const { user, logout } = useContext(AuthContext);

  return (
    <nav className="bg-white border-b px-6 py-4 flex justify-between items-center shadow-sm">
      <h1 className="text-xl font-bold text-blue-600">ዲጂታል እቁብ</h1>
      <div className="flex items-center gap-4">
        <span className="text-sm font-medium text-gray-700">
          ሰላም, {user?.name} ({user?.role})
        </span>
        <button
          onClick={logout}
          className="text-sm bg-red-50 text-red-600 px-3 py-1.5 rounded-lg border border-red-200 hover:bg-red-100 font-medium transition"
        >
          ውጣ
        </button>
      </div>
    </nav>
  );
};

export default Navbar;