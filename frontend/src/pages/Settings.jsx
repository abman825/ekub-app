import React, { useState, useContext, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import API from '../services/api';
import { AuthContext } from '../context/AuthContext';
import { User, Lock, Phone, Save, ArrowLeft, Shield } from 'lucide-react';

const Settings = () => {
  const { user, login } = useContext(AuthContext);
  const navigate = useNavigate();

  const [name, setName] = useState(user?.name || '');
  const [phone, setPhone] = useState(user?.phone || '');
  const [password, setPassword] = useState('');
  
  // Admin Payment Details
  const [bankName, setBankName] = useState(user?.bankDetails?.bankName || '');
  const [bankAccountNumber, setBankAccountNumber] = useState(user?.bankDetails?.bankAccountNumber || '');
  const [bankAccountName, setBankAccountName] = useState(user?.bankDetails?.bankAccountName || '');
  const [telebirrPhone, setTelebirrPhone] = useState(user?.bankDetails?.telebirrPhone || '');
  const [telebirrName, setTelebirrName] = useState(user?.bankDetails?.telebirrName || '');
  const [chapaSecretKey, setChapaSecretKey] = useState(user?.chapaSecretKey || '');

  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    if (user) {
      setName(user.name || '');
      setPhone(user.phone || '');
      setBankName(user.bankDetails?.bankName || '');
      setBankAccountNumber(user.bankDetails?.bankAccountNumber || '');
      setBankAccountName(user.bankDetails?.bankAccountName || '');
      setTelebirrPhone(user.bankDetails?.telebirrPhone || '');
      setTelebirrName(user.bankDetails?.telebirrName || '');
      setChapaSecretKey(user.chapaSecretKey || '');
    }
  }, [user]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setMessage('');
    setLoading(true);

    try {
      const payload = {
        name,
        phone,
        password: password ? password : undefined,
      };

      if (user?.role === 'admin') {
        payload.bankName = bankName;
        payload.bankAccountNumber = bankAccountNumber;
        payload.bankAccountName = bankAccountName;
        payload.telebirrPhone = telebirrPhone;
        payload.telebirrName = telebirrName;
        payload.chapaSecretKey = chapaSecretKey;
      }

      const { data } = await API.put('/auth/profile', payload);
      setMessage(data.message || 'ፕሮፋይሉ በስኬት ተስተካክሏል!');
      
      // Update local storage / Auth context if needed
      if (data.user) {
        // እንደ አጠቃቀሙ AuthContext ውስጥ ዩዘርን ማደስ ይቻላል
      }
    } catch (err) {
      setError(err.response?.data?.message || 'መረጃውን ማስተካከል አልተቻለም');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6 flex justify-center items-center">
      <div className="bg-white rounded-3xl shadow-lg border border-gray-100 max-w-xl w-full p-8">
        
        {/* Header */}
        <div className="flex items-center justify-between mb-6 border-b pb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-blue-600 text-white font-bold flex items-center justify-center shadow-md">
              <User size={20} />
            </div>
            <div>
              <h2 className="text-xl font-black text-gray-900">የመለያ ማስተካከያ (Settings)</h2>
              <p className="text-xs text-gray-400">የፕሮፋይል እና የክፍያ መረጃዎችዎን ይቀይሩ</p>
            </div>
          </div>
          <button 
            onClick={() => navigate('/dashboard')}
            className="flex items-center gap-1 text-xs font-bold text-blue-600 bg-blue-50 px-3 py-2 rounded-xl hover:bg-blue-100 transition"
          >
            <ArrowLeft size={16} /> ወደ ዳሽቦርድ
          </button>
        </div>

        {error && <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-2xl text-xs mb-4">{error}</div>}
        {message && <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-2xl text-xs mb-4">{message}</div>}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-gray-700 mb-1">ሙሉ ስም (Name)</label>
            <input 
              type="text" 
              required 
              className="w-full border border-gray-200 p-3 rounded-xl text-xs bg-gray-50 focus:bg-white transition"
              value={name} 
              onChange={(e) => setName(e.target.value)} 
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-700 mb-1">ስልክ ቁጥር (Phone)</label>
            <input 
              type="text" 
              required 
              className="w-full border border-gray-200 p-3 rounded-xl text-xs bg-gray-50 focus:bg-white transition"
              value={phone} 
              onChange={(e) => setPhone(e.target.value)} 
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-700 mb-1">አዲስ የይለፍ ቃል (New Password - ባዶ መተው ይቻላል)</label>
            <input 
              type="password" 
              placeholder="••••••"
              className="w-full border border-gray-200 p-3 rounded-xl text-xs bg-gray-50 focus:bg-white transition"
              value={password} 
              onChange={(e) => setPassword(e.target.value)} 
            />
          </div>

          {/* Admin Specific Payment & Bank Settings */}
          {user?.role === 'admin' && (
            <div className="space-y-3 bg-purple-50/60 p-4 rounded-2xl border border-purple-100 mt-4">
              <h4 className="text-xs font-bold text-purple-900 flex items-center gap-1.5">
                <Shield size={14} /> የአስተዳዳሪ የክፍያ መቀበያ መረጃዎች (Admin Payment Details)
              </h4>

              <div>
                <label className="block text-[11px] font-bold text-gray-600 mb-1">Chapa Secret Key</label>
                <input 
                  type="text" 
                  className="w-full border p-2.5 rounded-xl text-xs bg-white"
                  value={chapaSecretKey} 
                  onChange={(e) => setChapaSecretKey(e.target.value)} 
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[11px] font-bold text-gray-600 mb-1">የባንክ ስም</label>
                  <input 
                    type="text" 
                    className="w-full border p-2.5 rounded-xl text-xs bg-white"
                    value={bankName} 
                    onChange={(e) => setBankName(e.target.value)} 
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-gray-600 mb-1">የባንክ ሂሳብ ቁጥር</label>
                  <input 
                    type="text" 
                    className="w-full border p-2.5 rounded-xl text-xs bg-white"
                    value={bankAccountNumber} 
                    onChange={(e) => setBankAccountNumber(e.target.value)} 
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-gray-600 mb-1">የባንክ ሂሳብ ስም (Account Name)</label>
                <input 
                  type="text" 
                  className="w-full border p-2.5 rounded-xl text-xs bg-white"
                  value={bankAccountName} 
                  onChange={(e) => setBankAccountName(e.target.value)} 
                />
              </div>

              <div className="grid grid-cols-2 gap-2 pt-2 border-t border-purple-200">
                <div>
                  <label className="block text-[11px] font-bold text-gray-600 mb-1">የቴሌብር ስልክ ቁጥር</label>
                  <input 
                    type="text" 
                    className="w-full border p-2.5 rounded-xl text-xs bg-white"
                    value={telebirrPhone} 
                    onChange={(e) => setTelebirrPhone(e.target.value)} 
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-gray-600 mb-1">የቴሌብር ስም</label>
                  <input 
                    type="text" 
                    className="w-full border p-2.5 rounded-xl text-xs bg-white"
                    value={telebirrName} 
                    onChange={(e) => setTelebirrName(e.target.value)} 
                  />
                </div>
              </div>
            </div>
          )}

          <button 
            type="submit" 
            disabled={loading}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white p-3 rounded-xl font-bold text-xs shadow-md transition flex items-center justify-center gap-2 mt-6"
          >
            <Save size={16} /> {loading ? 'በማስተካከል ላይ...' : 'ለውጦችን አስቀምጥ (Save Changes)'}
          </button>
        </form>

      </div>
    </div>
  );
};

export default Settings;