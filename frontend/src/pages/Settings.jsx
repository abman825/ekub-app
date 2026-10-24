import React, { useState, useContext, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import API from '../services/api';
import { AuthContext } from '../context/AuthContext';
import { User, Lock, Phone, Save, ArrowLeft, Shield, Eye, EyeOff, Loader2 } from 'lucide-react';

const translations = {
  am: {
    title: "የመለያ ማስተካከያ (Settings)",
    subtitle: "የፕሮፋይል እና የክፍያ መረጃዎችዎን እዚህ ያዘምኑ",
    backToDashboard: "ወደ ዳሽቦርድ",
    nameLabel: "ሙሉ ስም (Name)",
    phoneLabel: "ስልክ ቁጥር (Phone)",
    oldPasswordLabel: "የአሁኑ የይለፍ ቃል (Current Password)",
    oldPasswordPlaceholder: "የአሁኑን የይለፍ ቃል ያስገቡ",
    newPasswordLabel: "አዲስ የይለፍ ቃል (New Password)",
    newPasswordPlaceholder: "አዲስ የይለፍ ቃል ያስገቡ",
    oldPasswordRequired: "እባክዎ የአሁኑን የይለፍ ቃል ያስገቡ!",
    newPasswordRequired: "እባክዎ አዲስ የይለፍ ቃል ያስገቡ!",
    adminPaymentTitle: "የአስተዳዳሪ የክፍያ መቀበያ መረጃዎች (Admin Payment Details)",
    chapaSecretKeyLabel: "Chapa Secret Key",
    bankNameLabel: "የባንክ ስም",
    bankAccountNumberLabel: "የባንክ ሂሳብ ቁጥር",
    bankAccountNameLabel: "የባንክ ሂሳብ ስም (Account Holder Name)",
    telebirrPhoneLabel: "የቴሌብር ስልክ ቁጥር",
    telebirrNameLabel: "የቴሌብር ስም",
    saving: "በማስቀመጥ ላይ...",
    saveProfile: "ስም እና ስልክ ቀይር (Save Profile)",
    updatePassword: "የይለፍ ቃል ቀይር (Update Password)",
    savePaymentInfo: "የክፍያ መረጃዎችን አስቀምጥ (Save Payment Info)",
    successProfile: "ፕሮፋይልዎ በስኬት ተስተካክሏል!",
    successPass: "የይለፍ ቃል በስኬት ተቀይሯል!",
    successAdmin: "የክፍያ መረጃዎች በስኬት ተስተካክለዋል!",
    errorProfile: "መረጃውን ማስተካከል አልተቻለም",
    errorPass: "የይለፍ ቃል መቀየር አልተቻለም",
    errorAdmin: "የክፍያ መረጃ ማስተካከል አልተቻለም"
  },
  om: {
    title: "Sirreeffama Akkaawuntii (Settings)",
    subtitle: "Ragaalee profaayilii fi kaffaltii keessan asitti haaromsaa",
    backToDashboard: "Gara Daashboordii",
    nameLabel: "Maqaa Guutuu",
    phoneLabel: "Lakkoofsa Bilbilaa",
    oldPasswordLabel: "Jecha Darbiiti Ammaa (Current Password)",
    oldPasswordPlaceholder: "Jecha darbii ammaa galchaa",
    newPasswordLabel: "Jecha Darbii Haaraa (New Password)",
    newPasswordPlaceholder: "Jecha darbii haaraa galchaa",
    oldPasswordRequired: "Jecha darbii ammaa galchuun dirqama!",
    newPasswordRequired: "Jecha darbii haaraa galchuun dirqama!",
    adminPaymentTitle: "Ragaalee Kaffaltii Bulchaa (Admin Payment Details)",
    chapaSecretKeyLabel: "Chapa Secret Key",
    bankNameLabel: "Maqaa Baankii",
    bankAccountNumberLabel: "Lakkoofsa Akkaawuntii Baankii",
    bankAccountNameLabel: "Maqaa Abbaa Akkaawuntii",
    telebirrPhoneLabel: "Lakkoofsa Bilbila Telebirr",
    telebirrNameLabel: "Maqaa Abbaa Telebirr",
    saving: "Olkaa'aa jira...",
    saveProfile: "Maqaa fi Bilbila Jijjiiri",
    updatePassword: "Jecha Darbii Jijjiiri",
    savePaymentInfo: "Ragaa Kaffaltii Olkaa'i",
    successProfile: "Profaayiliin keessan milkaa'inaan sirreeffameera!",
    successPass: "Jecha darbii milkaa'inaan jijjiirameera!",
    successAdmin: "Ragaan kaffaltii milkaa'inaan sirreeffameera!",
    errorProfile: "Ragaa sirreessuun hin danda'amne",
    errorPass: "Jecha darbii jijjiiruun hin danda'amne",
    errorAdmin: "Ragaa kaffaltii sirreessuun hin danda'amne"
  },
  en: {
    title: "Account Settings",
    subtitle: "Update your profile information and payment settings",
    backToDashboard: "Back to Dashboard",
    nameLabel: "Full Name",
    phoneLabel: "Phone Number",
    oldPasswordLabel: "Current Password",
    oldPasswordPlaceholder: "Enter your current password",
    newPasswordLabel: "New Password",
    newPasswordPlaceholder: "Enter new password",
    oldPasswordRequired: "Please enter your current password!",
    newPasswordRequired: "Please enter your new password!",
    adminPaymentTitle: "Admin Payment Gateway Settings",
    chapaSecretKeyLabel: "Chapa Secret Key",
    bankNameLabel: "Bank Name",
    bankAccountNumberLabel: "Bank Account Number",
    bankAccountNameLabel: "Account Holder Name",
    telebirrPhoneLabel: "Telebirr Phone Number",
    telebirrNameLabel: "Telebirr Account Name",
    saving: "Saving...",
    saveProfile: "Save Profile",
    updatePassword: "Update Password",
    savePaymentInfo: "Save Payment Info",
    successProfile: "Profile updated successfully!",
    successPass: "Password updated successfully!",
    successAdmin: "Payment details updated successfully!",
    errorProfile: "Failed to update profile",
    errorPass: "Failed to update password",
    errorAdmin: "Failed to update payment details"
  }
};

const Settings = () => {
  const { user, login } = useContext(AuthContext);
  const navigate = useNavigate();

  // LocalStorage theke active language read korbe (jodi na thake tahole 'am' hobe)
  const [lang, setLang] = useState(localStorage.getItem('app_lang') );
  const t = translations[lang] || translations.am;

  // Profile States
  const [name, setName] = useState(user?.name || '');
  const [phone, setPhone] = useState(user?.phone || '');
  const [loadingProfile, setLoadingProfile] = useState(false);
  const [msgProfile, setMsgProfile] = useState('');
  const [errProfile, setErrProfile] = useState('');

  // Password States
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [showOldPassword, setShowOldPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [loadingPass, setLoadingPass] = useState(false);
  const [msgPass, setMsgPass] = useState('');
  const [errPass, setErrPass] = useState('');

  // Admin Payment Details States
  const [bankName, setBankName] = useState(user?.bankDetails?.bankName || '');
  const [bankAccountNumber, setBankAccountNumber] = useState(user?.bankDetails?.bankAccountNumber || '');
  const [bankAccountName, setBankAccountName] = useState(user?.bankDetails?.bankAccountName || '');
  const [telebirrPhone, setTelebirrPhone] = useState(user?.bankDetails?.telebirrPhone || '');
  const [telebirrName, setTelebirrName] = useState(user?.bankDetails?.telebirrName || '');
  const [chapaSecretKey, setChapaSecretKey] = useState(user?.chapaSecretKey || '');
  const [loadingAdmin, setLoadingAdmin] = useState(false);
  const [msgAdmin, setMsgAdmin] = useState('');
  const [errAdmin, setErrAdmin] = useState('');

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

  // 1. Name & Phone Update
  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    setErrProfile('');
    setMsgProfile('');
    setLoadingProfile(true);

    try {
      const { data } = await API.put('/auth/profile', { name, phone });
      setMsgProfile(data.message || t.successProfile);
      if (data.user && login) login(data.user);
    } catch (err) {
      setErrProfile(err.response?.data?.message || t.errorProfile);
    } finally {
      setLoadingProfile(false);
    }
  };

  // 2. Password Update
  const handleUpdatePassword = async (e) => {
    e.preventDefault();
    setErrPass('');
    setMsgPass('');

    if (!oldPassword) return setErrPass(t.oldPasswordRequired);
    if (!newPassword) return setErrPass(t.newPasswordRequired);

    setLoadingPass(true);

    try {
      const { data } = await API.put('/auth/profile', {
        oldPassword,
        password: newPassword
      });
      setMsgPass(data.message || t.successPass);
      setOldPassword('');
      setNewPassword('');
    } catch (err) {
      setErrPass(err.response?.data?.message || t.errorPass);
    } finally {
      setLoadingPass(false);
    }
  };

  // 3. Admin Payment Details Update
  const handleUpdateAdminPayment = async (e) => {
    e.preventDefault();
    setErrAdmin('');
    setMsgAdmin('');
    setLoadingAdmin(true);

    try {
      const payload = {
        bankName,
        bankAccountNumber,
        bankAccountName,
        telebirrPhone,
        telebirrName,
        chapaSecretKey
      };

      const { data } = await API.put('/auth/profile', payload);
      setMsgAdmin(data.message || t.successAdmin);
      if (data.user && login) login(data.user);
    } catch (err) {
      setErrAdmin(err.response?.data?.message || t.errorAdmin);
    } finally {
      setLoadingAdmin(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-4 sm:p-6 flex justify-center items-center">
      <div className="bg-white rounded-3xl shadow-xl border border-gray-100 max-w-xl w-full p-6 sm:p-8">
        
        {/* Header */}
        <div className="flex items-center justify-between gap-4 mb-6 border-b pb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-blue-600 text-white font-bold flex items-center justify-center shadow-md shadow-blue-500/20">
              <User size={20} />
            </div>
            <div>
              <h2 className="text-lg sm:text-xl font-black text-gray-900">{t.title}</h2>
              <p className="text-xs text-gray-400">{t.subtitle}</p>
            </div>
          </div>

          <button 
            onClick={() => navigate('/dashboard')}
            className="flex items-center gap-1 text-xs font-bold text-blue-600 bg-blue-50 px-3 py-2 rounded-xl hover:bg-blue-100 transition"
          >
            <ArrowLeft size={16} /> {t.backToDashboard}
          </button>
        </div>

        {/* SECTION 1: Name and Phone Form */}
        <form onSubmit={handleUpdateProfile} className="space-y-4 mb-6 pb-6 border-b border-gray-100">
          {errProfile && <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-2.5 rounded-2xl text-xs font-semibold">{errProfile}</div>}
          {msgProfile && <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-2.5 rounded-2xl text-xs font-semibold">{msgProfile}</div>}

          <div>
            <label className="block text-xs font-bold text-gray-700 mb-1">{t.nameLabel}</label>
            <div className="relative">
              <input 
                type="text" 
                required 
                className="w-full border border-gray-200 p-3 pl-10 rounded-xl text-xs bg-gray-50 focus:bg-white focus:border-blue-500 outline-none transition"
                value={name} 
                onChange={(e) => setName(e.target.value)} 
              />
              <User size={16} className="absolute left-3 top-3.5 text-gray-400" />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-700 mb-1">{t.phoneLabel}</label>
            <div className="relative">
              <input 
                type="text" 
                required 
                className="w-full border border-gray-200 p-3 pl-10 rounded-xl text-xs bg-gray-50 focus:bg-white focus:border-blue-500 outline-none transition"
                value={phone} 
                onChange={(e) => setPhone(e.target.value)} 
              />
              <Phone size={16} className="absolute left-3 top-3.5 text-gray-400" />
            </div>
          </div>

          <button 
            type="submit" 
            disabled={loadingProfile}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white p-2.5 rounded-xl font-bold text-xs shadow-md shadow-blue-500/20 transition flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {loadingProfile ? <Loader2 className="animate-spin" size={16} /> : <Save size={16} />}
            {loadingProfile ? t.saving : t.saveProfile}
          </button>
        </form>

        {/* SECTION 2: Change Password Form */}
        <form onSubmit={handleUpdatePassword} className="space-y-4 mb-6 pb-6 border-b border-gray-100">
          {errPass && <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-2.5 rounded-2xl text-xs font-semibold">{errPass}</div>}
          {msgPass && <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-2.5 rounded-2xl text-xs font-semibold">{msgPass}</div>}

          <div>
            <label className="block text-xs font-bold text-gray-700 mb-1">{t.oldPasswordLabel}</label>
            <div className="relative">
              <input 
                type={showOldPassword ? 'text' : 'password'} 
                placeholder={t.oldPasswordPlaceholder}
                className="w-full border border-gray-200 p-3 pl-10 pr-10 rounded-xl text-xs bg-gray-50 focus:bg-white focus:border-blue-500 outline-none transition"
                value={oldPassword} 
                onChange={(e) => setOldPassword(e.target.value)} 
              />
              <Lock size={16} className="absolute left-3 top-3.5 text-gray-400" />
              <button 
                type="button" 
                onClick={() => setShowOldPassword(!showOldPassword)}
                className="absolute right-3 top-3.5 text-gray-400 hover:text-gray-600"
              >
                {showOldPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-700 mb-1">{t.newPasswordLabel}</label>
            <div className="relative">
              <input 
                type={showNewPassword ? 'text' : 'password'} 
                placeholder={t.newPasswordPlaceholder}
                className="w-full border border-gray-200 p-3 pl-10 pr-10 rounded-xl text-xs bg-gray-50 focus:bg-white focus:border-blue-500 outline-none transition"
                value={newPassword} 
                onChange={(e) => setNewPassword(e.target.value)} 
              />
              <Lock size={16} className="absolute left-3 top-3.5 text-gray-400" />
              <button 
                type="button" 
                onClick={() => setShowNewPassword(!showNewPassword)}
                className="absolute right-3 top-3.5 text-gray-400 hover:text-gray-600"
              >
                {showNewPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          <button 
            type="submit" 
            disabled={loadingPass}
            className="w-full bg-slate-800 hover:bg-slate-900 text-white p-2.5 rounded-xl font-bold text-xs shadow-md transition flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {loadingPass ? <Loader2 className="animate-spin" size={16} /> : <Lock size={16} />}
            {loadingPass ? t.saving : t.updatePassword}
          </button>
        </form>

        {/* SECTION 3: Admin Payment Details Form */}
        {user?.role === 'admin' && (
          <form onSubmit={handleUpdateAdminPayment} className="space-y-3 bg-purple-50/70 p-4 rounded-2xl border border-purple-100">
            <h4 className="text-xs font-bold text-purple-900 flex items-center gap-1.5 border-b border-purple-200 pb-2">
              <Shield size={16} className="text-purple-700" /> {t.adminPaymentTitle}
            </h4>

            {errAdmin && <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-2 rounded-xl text-xs font-semibold">{errAdmin}</div>}
            {msgAdmin && <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-2 rounded-xl text-xs font-semibold">{msgAdmin}</div>}

            <div>
              <label className="block text-[11px] font-bold text-gray-600 mb-1">{t.chapaSecretKeyLabel}</label>
              <input 
                type="text" 
                placeholder="CHASECK_TEST-xxxxxxxx"
                className="w-full border border-purple-200 p-2.5 rounded-xl text-xs bg-white focus:border-purple-500 outline-none"
                value={chapaSecretKey} 
                onChange={(e) => setChapaSecretKey(e.target.value)} 
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <div>
                <label className="block text-[11px] font-bold text-gray-600 mb-1">{t.bankNameLabel}</label>
                <input 
                  type="text" 
                  placeholder="e.g. Commercial Bank of Ethiopia"
                  className="w-full border border-purple-200 p-2.5 rounded-xl text-xs bg-white focus:border-purple-500 outline-none"
                  value={bankName} 
                  onChange={(e) => setBankName(e.target.value)} 
                />
              </div>
              <div>
                <label className="block text-[11px] font-bold text-gray-600 mb-1">{t.bankAccountNumberLabel}</label>
                <input 
                  type="text" 
                  placeholder="1000xxxxxxxx"
                  className="w-full border border-purple-200 p-2.5 rounded-xl text-xs bg-white focus:border-purple-500 outline-none"
                  value={bankAccountNumber} 
                  onChange={(e) => setBankAccountNumber(e.target.value)} 
                />
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-bold text-gray-600 mb-1">{t.bankAccountNameLabel}</label>
              <input 
                type="text" 
                placeholder="Account Name"
                className="w-full border border-purple-200 p-2.5 rounded-xl text-xs bg-white focus:border-purple-500 outline-none"
                value={bankAccountName} 
                onChange={(e) => setBankAccountName(e.target.value)} 
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-2 border-t border-purple-200">
              <div>
                <label className="block text-[11px] font-bold text-gray-600 mb-1">{t.telebirrPhoneLabel}</label>
                <input 
                  type="text" 
                  placeholder="09xxxxxxxx"
                  className="w-full border border-purple-200 p-2.5 rounded-xl text-xs bg-white focus:border-purple-500 outline-none"
                  value={telebirrPhone} 
                  onChange={(e) => setTelebirrPhone(e.target.value)} 
                />
              </div>
              <div>
                <label className="block text-[11px] font-bold text-gray-600 mb-1">{t.telebirrNameLabel}</label>
                <input 
                  type="text" 
                  placeholder="Telebirr Name"
                  className="w-full border border-purple-200 p-2.5 rounded-xl text-xs bg-white focus:border-purple-500 outline-none"
                  value={telebirrName} 
                  onChange={(e) => setTelebirrName(e.target.value)} 
                />
              </div>
            </div>

            <button 
              type="submit" 
              disabled={loadingAdmin}
              className="w-full bg-purple-700 hover:bg-purple-800 text-white p-2.5 rounded-xl font-bold text-xs shadow-md transition flex items-center justify-center gap-2 mt-2 disabled:opacity-50"
            >
              {loadingAdmin ? <Loader2 className="animate-spin" size={16} /> : <Shield size={16} />}
              {loadingAdmin ? t.saving : t.savePaymentInfo}
            </button>
          </form>
        )}

      </div>
    </div>
  );
};

export default Settings;