import React, { useState } from 'react';
import API from '../services/api';

const ForgotPasswordModal = ({ isOpen, onClose }) => {
  const [step, setStep] = useState(1); // Step 1: Send OTP, Step 2: Reset Password
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  // Step 1: Send OTP
  const handleSendOTP = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await API.post('/auth/forgot-password', { phone });
      alert('Telegram-ge OTP kaluhisalaagide!');
      setStep(2);
    } catch (err) {
      alert(err.response?.data?.message || 'OTP kaluhisalu saadhyavaagilla');
    } finally {
      setLoading(false);
    }
  };

  // Step 2: Reset Password
  const handleResetPassword = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await API.post('/auth/reset-password', { phone, otp, newPassword });
      alert('Password badalaagide! Ega hosadhaagi Login maadi.');
      onClose();
      setStep(1);
      setPhone('');
      setOtp('');
      setNewPassword('');
    } catch (err) {
      alert(err.response?.data?.message || 'Password reset maadalu saadhyavaagilla');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-xl p-6 w-full max-w-md shadow-lg">
        <h3 className="text-xl font-bold mb-4 text-gray-800">Password Badalisi (Reset Password)</h3>

        {step === 1 ? (
          <form onSubmit={handleSendOTP} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">Phone Number</label>
              <input
                type="text"
                required
                className="w-full border p-2 rounded-lg mt-1"
                placeholder="09xxxxxxxx"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
              />
            </div>
            <div className="flex gap-3 pt-2">
              <button type="button" onClick={onClose} className="w-1/2 border py-2 rounded-lg">
                Cancel
              </button>
              <button type="submit" disabled={loading} className="w-1/2 bg-blue-600 text-white py-2 rounded-lg">
                {loading ? 'Sending...' : 'Send OTP Code'}
              </button>
            </div>
          </form>
        ) : (
          <form onSubmit={handleResetPassword} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">Telegram OTP Code</label>
              <input
                type="text"
                required
                className="w-full border p-2 rounded-lg mt-1"
                placeholder="6 Digit Code"
                value={otp}
                onChange={(e) => setOtp(e.target.value)}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">New Password</label>
              <input
                type="password"
                required
                className="w-full border p-2 rounded-lg mt-1"
                placeholder="Hosadhaada Password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
              />
            </div>
            <div className="flex gap-3 pt-2">
              <button type="button" onClick={() => setStep(1)} className="w-1/2 border py-2 rounded-lg">
                Back
              </button>
              <button type="submit" disabled={loading} className="w-1/2 bg-green-600 text-white py-2 rounded-lg">
                {loading ? 'Updating...' : 'Save New Password'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};

export default ForgotPasswordModal;