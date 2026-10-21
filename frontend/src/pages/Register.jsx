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
  
  const [chapaKey, setChapaKey] = useState('');
  const [bankName, setBankName] = useState('');
  const [accNumber, setAccNumber] = useState('');
  
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
          bankName, 
          accountNumber: accNumber, 
          accountHolderName: name 
        } : {}
      };
      
      const { data } = await API.post('/auth/register', payload);
      
      if (role === 'admin') {
        login(data);
        navigate('/dashboard');
      } else {
        setIsOtpSent(true);
        setSuccessMsg(data.message || 'የማረጋገጫ ኮድ በቴሌግራም ተልኮልዎታል!');
      }
    } catch (err) {
      setError(err.response?.data?.message || 'ምዝገባው አልተሳካም');
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

      alert('🎉 መለያዎ በስኬት ተረጋግጧል! አሁን መግባት ይችላሉ።');
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
                  <option value="admin">የእቁብ ሰብሳቢ (Admin)</option>
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
                    placeholder="ለምሳሌ፦ 2068983666" 
                    className="w-full p-2.5 border rounded-lg text-sm bg-white" 
                    value={telegramChatId} 
                    onChange={(e) => setTelegramChatId(e.target.value)} 
                  />
                  <p className="text-[11px] text-blue-700">
                    💡 በመጀመሪያ <b>@lilmoo_bot</b> ን በመጫን <b>/start</b> ይበሉ፤ ከዚያ የሚሰጠዎትን የChat ID እዚህ ያስገቡ።
                  </p>
                </div>
              )}

              {role === 'admin' && (
                <div className="p-4 bg-purple-50 rounded-lg space-y-3 border border-purple-200">
                  <h3 className="font-semibold text-purple-900 text-sm">የአስተዳዳሪ ክፍያ ማቋቋሚያ</h3>
                  <div>
                    <label className="block text-xs font-medium text-gray-600">Chapa Secret Key (ቁልፎች)</label>
                    <input 
                      type="text" 
                      placeholder="CHASECK_TEST-xxxx" 
                      className="mt-1 block w-full p-2 border rounded text-sm bg-white" 
                      value={chapaKey} 
                      onChange={(e) => setChapaKey(e.target.value)} 
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-xs font-medium text-gray-600">የባንክ ስም</label>
                      <input 
                        type="text" 
                        placeholder="CBE / Telebirr" 
                        className="mt-1 block w-full p-2 border rounded text-sm bg-white" 
                        value={bankName} 
                        onChange={(e) => setBankName(e.target.value)} 
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-600">የሂሳብ ቁጥር</label>
                      <input 
                        type="text" 
                        placeholder="1000xxxx" 
                        className="mt-1 block w-full p-2 border rounded text-sm bg-white" 
                        value={accNumber} 
                        onChange={(e) => setAccNumber(e.target.value)} 
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
              አካውንት አለዎት? <Link to="/login" className="text-blue-600 font-semibold hover:underline">ይግቡ</Link>
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