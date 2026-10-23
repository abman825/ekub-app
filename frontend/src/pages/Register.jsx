import React, { useState, useContext } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import API from '../services/api';
import { AuthContext } from '../context/AuthContext';
import { Send, CheckCircle, ExternalLink } from 'lucide-react';

const Register = () => {
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('member');
  const [telegramChatId, setTelegramChatId] = useState('');
  
  // Admin Payment States
  const [chapaKey, setChapaKey] = useState('');
  const [bankName, setBankName] = useState('');
  const [bankAccountNumber, setBankAccountNumber] = useState('');
  const [bankAccountName, setBankAccountName] = useState('');
  const [telebirrPhone, setTelebirrPhone] = useState('');
  const [telebirrName, setTelebirrName] = useState('');
  
  // OTP Verification State
  const [isOtpSent, setIsOtpSent] = useState(false);
  const [otpCode, setOtpCode] = useState('');
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  
  const { login } = useContext(AuthContext);
  const navigate = useNavigate();

  // 1. የምዝገባ ፎርም ማስተላለፊያ
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    try {
      const payload = {
        name,
        phone,
        password,
        role,
        telegramChatId,
        chapaSecretKey: role === 'admin' ? chapaKey : null,
        bankDetails: role === 'admin' ? { 
          bankName: bankName || 'CBE', 
          bankAccountNumber, 
          bankAccountName: bankAccountName || name,
          telebirrPhone,
          telebirrName: telebirrName || name
        } : {}
      };
      
      const { data } = await API.post('/auth/register', payload);
      
      if (role === 'admin') {
        login(data);
        navigate('/dashboard');
      } else {
        setIsOtpSent(true);
        setSuccessMsg(data.message || 'የማረጋገጫ ኮድ በቴሌግራም ተልጓል!');
      }
    } catch (err) {
      setError(err.response?.data?.message || 'ምዝገባው አዳልካሳም');
    }
  };

  // 2. የ OTP ማረጋገጫ ማስተላለፊያ
  const handleVerifyOTP = async (e) => {
    e.preventDefault();
    setError('');
    try {
      const { data } = await API.post('/auth/verify-otp', {
        phone,
        code: otpCode
      });

      alert('🎉 መለያው በስኬት ተረጋግጧል! አሁን መግባት ይችላሉ።');
      navigate('/login');
    } catch (err) {
      setError(err.response?.data?.message || 'የስህተት ማረጋገጫ ኮድ ነው!');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 p-4">
      <div className="bg-white p-8 rounded-xl shadow-md w-full max-w-lg">
        
        {!isOtpSent ? (
          <>
            <h2 className="text-2xl font-bold text-center mb-6 text-gray-800">አዲስ መለያ ይክፈቱ</h2>
            {error && <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-2 rounded mb-4 text-sm">{error}</div>}
            
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">ሙሉ ስም</label>
                <input 
                  type="text" 
                  required 
                  className="mt-1 block w-full p-2.5 border rounded-lg" 
                  value={name} 
                  onChange={(e) => setName(e.target.value)} 
                  placeholder="አበበ በቀለ"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">ስልክ ቁጥር</label>
                <input 
                  type="text" 
                  required 
                  className="mt-1 block w-full p-2.5 border rounded-lg" 
                  value={phone} 
                  onChange={(e) => setPhone(e.target.value)} 
                  placeholder="0911223344"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">የይለፍ ቃል</label>
                <input 
                  type="password" 
                  required 
                  className="mt-1 block w-full p-2.5 border rounded-lg" 
                  value={password} 
                  onChange={(e) => setPassword(e.target.value)} 
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">የመለያ ዓይነት</label>
                <select 
                  className="mt-1 block w-full p-2.5 border rounded-lg bg-white" 
                  value={role} 
                  onChange={(e) => setRole(e.target.value)}
                >
                  <option value="member">የእቁብ አባል (Member)</option>
                  <option value="admin">የእቁብ አስተዳዳሪ (Admin)</option>
                </select>
              </div>

              {/* Telegram Info and Bot Link for Member Verification */}
              {role === 'member' && (
                <div className="p-4 bg-blue-50 rounded-lg border border-blue-200 space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="block text-xs font-semibold text-blue-900">
                      የቴሌግራም Chat ID (ለ OTP ማረጋገጫ)
                    </label>
                    <a 
                      href="https://t.me/lilmoo_bot" 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-xs text-blue-600 hover:text-blue-800 font-medium flex items-center gap-1 underline"
                    >
                      ቦቱን ክፈት (@lilmoo_bot) <ExternalLink size={12} />
                    </a>
                  </div>

                  <input 
                    type="text" 
                    required
                    placeholder="ለማሳያ 2068983666" 
                    className="w-full p-2.5 border rounded-lg text-sm bg-white" 
                    value={telegramChatId} 
                    onChange={(e) => setTelegramChatId(e.target.value)} 
                  />
                  <p className="text-[11px] text-blue-700">
                    💡 በመጀመሪያ <b>@lilmoo_bot</b> ን በመክፈት <b>/start</b> ይበሉ። ከዚያ የሚሰጣችሁን የChat ID እዚህ ይስቀሉ።
                  </p>
                </div>
              )}

              {/* Admin Payment Accounts Form */}
              {role === 'admin' && (
                <div className="space-y-3 bg-purple-50 p-4 rounded-2xl border border-purple-200 my-3">
                  <h4 className="text-xs font-bold text-purple-900">የክፍያ መቀበያ መረጃዎች (Admin Payment Accounts)</h4>
                  
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">Chapa Secret Key (ለኦንላይን ክፍያ)</label>
                    <input 
                      type="text" 
                      placeholder="CHASECK_TEST-xxxx" 
                      className="w-full p-2 border rounded text-sm bg-white" 
                      value={chapaKey} 
                      onChange={(e) => setChapaKey(e.target.value)} 
                    />
                  </div>

                  {/* የባንክ መረጃ */}
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-1">የባንክ ስም</label>
                      <input
                        type="text"
                        placeholder="CBE"
                        value={bankName}
                        onChange={(e) => setBankName(e.target.value)}
                        className="w-full border p-2 rounded-xl text-xs bg-white"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-1">የሂሳብ ቁጥር</label>
                      <input
                        type="text"
                        placeholder="1000xxxx"
                        value={bankAccountNumber}
                        onChange={(e) => setBankAccountNumber(e.target.value)}
                        className="w-full border p-2 rounded-xl text-xs bg-white"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">የባንክ ሂሳብ ስም (Account Name)</label>
                    <input
                      type="text"
                      placeholder="የባንክ ባለቤት ስም"
                      value={bankAccountName}
                      onChange={(e) => setBankAccountName(e.target.value)}
                      className="w-full border p-2 rounded-xl text-xs bg-white"
                    />
                  </div>

                  {/* የቴሌብር መረጃ */}
                  <div className="grid grid-cols-2 gap-2 pt-2 border-t border-purple-200">
                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-1">የቴሌብር ስልክ ቁጥር</label>
                      <input
                        type="text"
                        placeholder="09..."
                        value={telebirrPhone}
                        onChange={(e) => setTelebirrPhone(e.target.value)}
                        className="w-full border p-2 rounded-xl text-xs bg-white"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-1">የቴሌብር ስም</label>
                      <input
                        type="text"
                        placeholder="Telebirr Name"
                        value={telebirrName}
                        onChange={(e) => setTelebirrName(e.target.value)}
                        className="w-full border p-2 rounded-xl text-xs bg-white"
                      />
                    </div>
                  </div>
                </div>
              )}

              <button 
                type="submit" 
                className="w-full bg-green-600 text-white p-2.5 rounded-lg font-medium hover:bg-green-700 transition"
              >
                ተመዝገብ
              </button>
            </form>

            <p className="mt-4 text-center text-sm text-gray-600">
              አካውንት አለዎት? <Link to="/login" className="text-blue-600 font-semibold hover:underline">ግባ</Link>
            </p>
          </>
        ) : (
          /* OTP Verification Card */
          <div className="text-center py-4 space-y-4">
            <div className="w-12 h-12 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center mx-auto text-xl font-bold">
              🔐
            </div>
            <h2 className="text-xl font-bold text-gray-800">የቴሌግራም ማረጋገጫ (OTP)</h2>
            <p className="text-xs text-gray-600 bg-green-50 p-2.5 rounded border border-green-200">
              {successMsg}
            </p>

            {error && <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-2 rounded text-sm">{error}</div>}

            <form onSubmit={handleVerifyOTP} className="space-y-4 pt-2">
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">
                  በቴሌግራም (@lilmoo_bot) የተላከውን የ 6 አሃዝ ኮድ ያስገቡ
                </label>
                <input 
                  type="text" 
                  required 
                  maxLength={6}
                  className="w-full p-3 border rounded-lg text-center text-2xl font-mono tracking-widest bg-gray-50 border-blue-400 focus:bg-white" 
                  value={otpCode} 
                  onChange={(e) => setOtpCode(e.target.value)} 
                  placeholder="123456"
                />
              </div>

              <button 
                type="submit" 
                className="w-full bg-blue-600 text-white p-2.5 rounded-lg font-medium hover:bg-blue-700 transition flex items-center justify-center gap-2"
              >
                <CheckCircle size={18} /> መለያውን አረጋግጥ
              </button>
            </form>
          </div>
        )}

      </div>
    </div>
  );
};

export default Register;