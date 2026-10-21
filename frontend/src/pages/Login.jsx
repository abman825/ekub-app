import React, { useState, useContext } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import API from '../services/api';
import { AuthContext } from '../context/AuthContext';
import ForgotPasswordModal from '../components/ForgotPasswordModal';

const Login = () => {
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [showForgotModal, setShowForgotModal] = useState(false); 

  const { login } = useContext(AuthContext);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    try {
      const { data } = await API.post('/auth/login', { phone, password });
      login(data);
      navigate('/dashboard');
    } catch (err) {
      setError(err.response?.data?.message || 'መግባት አልተቻለም፤ እባክዎን መረጃዎን ያረጋግጡ');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 p-4">
      <div className="bg-white p-8 rounded-xl shadow-md w-full max-w-md">
        <h2 className="text-2xl font-bold text-center mb-6 text-gray-800">ወደ እቁብ ሲስተም ይግቡ</h2>
        
        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-2 rounded mb-4 text-sm">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* የስልክ ቁጥር ግብዓት */}
          <div>
            <label className="block text-sm font-medium text-gray-700">ስልክ ቁጥር</label>
            <input
              type="text"
              required
              className="mt-1 block w-full p-2.5 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="0911223344"
            />
          </div>

          {/* የይለፍ ቃል ግብዓት */}
          <div>
            <div className="flex justify-between items-center mb-1">
              <label className="block text-sm font-medium text-gray-700">የይለፍ ቃል</label>
              
              {/* የይለፍ ቃል ረስተዋል? የሚለው ሊንክ */}
              <button
                type="button"
                onClick={() => setShowForgotModal(true)}
                className="text-xs text-blue-600 hover:underline font-semibold"
              >
                የይለፍ ቃል ረስተዋል?
              </button>
            </div>

            <input
              type="password"
              required
              className="block w-full p-2.5 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>

          <button
            type="submit"
            className="w-full bg-blue-600 text-white p-2.5 rounded-lg font-medium hover:bg-blue-700 transition"
          >
            ይግቡ
          </button>
        </form>

        <p className="mt-4 text-center text-sm text-gray-600">
          መለያ የለዎትም?{' '}
          <Link to="/register" className="text-blue-600 font-semibold hover:underline">
            እዚህ ይመዝገቡ
          </Link>
        </p>
      </div>

      {/* Forgot Password Modal */}
      <ForgotPasswordModal
        isOpen={showForgotModal}
        onClose={() => setShowForgotModal(false)}
      />
    </div>
  );
};

export default Login;