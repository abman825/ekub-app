import React, { useState, useEffect, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import API from '../services/api';
import { AuthContext } from '../context/AuthContext';
import { 
  PlusCircle, Wallet, CheckCircle, XCircle, FileText, UserPlus, 
  Loader2, LayoutDashboard, CreditCard, LogOut, Menu, X, Globe, User, Settings as SettingsIcon 
} from 'lucide-react';
import EkubLedgerModal from '../components/EkubLedgerModal';
import SkeletonCard from '../components/SkeletonCard';
import { io } from 'socket.io-client';

const translations = {
  am: {
    appName: "እቁብ App",
    greeting: "እንኳን ደህና መጡ,",
    dashboard: "ዳሽቦርድ (Dashboard)",
    paymentVerifications: "የክፍያ ማረጋገጫዎች",
    settings: "ማስተካከያ (Settings)",
    logout: "ከሂሳብ ውጣ (Logout)",
    admin: "አስተዳዳሪ",
    member: "አባል",
    groupsTitle: "የእቁብ ቡድኖች",
    groupsSubtitle: "የእቁብ ማዕከሎቻችንን እና የሂሳብ ዝርዝሮቻችንን እዚህ ይከታተሉ።",
    createNewGroup: "አዲስ እቁብ ፈጥር",
    noGroups: "ምንም የእቁብ ቡድኖች አልተመዘገቡም።",
    contributionAmount: "የአንድ ዙር ክፍያ መጠን",
    targetGoal: "የሚሰባሰብ ግብ",
    drawTime: "የእጣ ማውጫ ጊዜ",
    membersCount: "አባላት",
    progress: "እድገት (Progress)",
    ledger: "የእቁብ ደፍተር",
    makePayment: "ክፍያ ፈጸም",
    addMemberPhone: "አባል በስልክ ቁጥር ጨምር",
    pendingTitle: "የባንክ ክፍያ ማረጋገጫዎች",
    pendingSubtitle: "የአባላትን የባንክ ደረሰኞች እና የክፍያ ጥያቄዎች እዚህ ይገመግሙ።",
    noPending: "ምንም የሚጠበቅ የክፍያ ጥያቄ የለም።",
    approve: "አጽድቅ",
    reject: "ውድቅ አድርግ",
    cancel: "ሰርዝ",
    create: "ፈጥር",
    save: "አስቀምጥ",
    phonePlaceholder: "09xxxxxxxx",
    selectPaymentMethod: "የክፍያ መንገድ ይምረጡ",
    chapaOnline: "በ Chapa ኦንላይን ክፈል",
    bankReceiptUpload: "በባንክ ደረሰኝ / ስክሪንሾት",
    selectReceipt: "የባንክ ደረሰኝ ስክሪንሾት ምረጥ",
    submitPayment: "ክፍያ ላክ",
    submitting: "በመላክ ላይ...",
    chapaSuccess: "🎉 የ Chapa ክፍያዎ በስኬት ተረጋግጦ ጸድቋል!",
    successUpload: "የባንክ ደረሰኝ በስኬት ተላክቷል!",
    successApprove: "ክፍያ ተጸድቋል",
    successReject: "ክፍያ ውድቅ ተደርጓል",
  },
  om: {
    appName: "Appii Equb",
    greeting: "Baga nagaan dhuftan,",
    dashboard: "Daashboordii (Dashboard)",
    paymentVerifications: "Mirkaneessa Kaffaltii",
    settings: "Sirreeffama (Settings)",
    logout: "Ba'i (Logout)",
    admin: "Bulchaa",
    member: "Miseensa",
    groupsTitle: "Garee Equb",
    groupsSubtitle: "Garee fi galii keessan kana keessatti hordofaa.",
    createNewGroup: "Equb Haaraa Uumi",
    noGroups: "Gareen Equb tokkoyyuu hin galmoofne.",
    contributionAmount: "Kaffaltii Marsaa Tokkoo",
    targetGoal: "Kaayyoo Galii",
    drawTime: "Yeroo Baafata Carraa",
    membersCount: "Miseensota",
    progress: "Guddina (Progress)",
    ledger: "Galmee Equb",
    makePayment: "Kaffalii",
    addMemberPhone: "Miseensa Lakkoofsa Bilbilaan Dabali",
    pendingTitle: "Mirkaneessa Kaffaltii Baankii",
    pendingSubtitle: "Ragaalee baankii miseensotaa asitti ilaalaa.",
    noPending: "Gaaffiin kaffaltii eegamu hin jiru.",
    approve: "Mirkaneessi",
    reject: "Didhiiri",
    cancel: "Haquu",
    create: "Uumi",
    save: "Olkaa'i",
    phonePlaceholder: "09xxxxxxxx",
    selectPaymentMethod: "Mala Kaffaltii Filadhu",
    chapaOnline: "Kaffaltii Chapa Online",
    bankReceiptUpload: "Nagahee Baankii / Suuraa",
    selectReceipt: "Suuraa Ragaa Baankii Filadhu",
    submitPayment: "Kaffaltii Ergi",
    submitting: "Ergaa jira...",
    chapaSuccess: "🎉 Kaffaltiin Chapa keessan mirkanaa'era!",
    successUpload: "Ragaan baankii milkaa'inaan ergameera!",
    successApprove: "Kaffaltiin mirkanaa'era",
    successReject: "Kaffaltiin dhowwameera",
  },
  en: {
    appName: "Equb App",
    greeting: "Welcome back,",
    dashboard: "Dashboard",
    paymentVerifications: "Payment Verifications",
    settings: "Settings",
    logout: "Logout",
    admin: "Admin",
    member: "Member",
    groupsTitle: "Equb Groups",
    groupsSubtitle: "Track your savings groups and ledger details here.",
    createNewGroup: "Create New Group",
    noGroups: "No Equb groups found.",
    contributionAmount: "Contribution Amount",
    targetGoal: "Target Goal",
    drawTime: "Draw Interval",
    membersCount: "Members",
    progress: "Progress",
    ledger: "Equb Ledger",
    makePayment: "Make Payment",
    addMemberPhone: "Add Member by Phone",
    pendingTitle: "Bank Payment Verifications",
    pendingSubtitle: "Review member bank receipts and pending payment requests.",
    noPending: "No pending payment requests.",
    approve: "Approve",
    reject: "Reject",
    cancel: "Cancel",
    create: "Create",
    save: "Save",
    phonePlaceholder: "09xxxxxxxx",
    selectPaymentMethod: "Select Payment Method",
    chapaOnline: "Pay Online via Chapa",
    bankReceiptUpload: "Upload Bank Receipt / Screenshot",
    selectReceipt: "Select Bank Receipt Image",
    submitPayment: "Submit Payment",
    submitting: "Submitting...",
    chapaSuccess: "🎉 Your Chapa payment was verified successfully!",
    successUpload: "Bank receipt uploaded successfully!",
    successApprove: "Payment approved",
    successReject: "Payment rejected",
  }
};

const SOCKET_URL = 'https://ekub-app.onrender.com';

const socket = io(SOCKET_URL, {
  transports: ['polling', 'websocket'],
  withCredentials: true,
  autoConnect: true
});

const Dashboard = () => {
  const { user, logout } = useContext(AuthContext);
  const navigate = useNavigate();

  const [lang, setLang] = useState('am');
  const t = translations[lang];

  const [groups, setGroups] = useState([]);
  const [loading, setLoading] = useState(true);
  const [pendingPayments, setPendingPayments] = useState([]);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showPayModal, setShowPayModal] = useState(false);
  const [showLedgerModal, setShowLedgerModal] = useState(false);
  const [selectedGroup, setSelectedGroup] = useState(null);

  const [showProfileModal, setShowProfileModal] = useState(false);

  const [activeTab, setActiveTab] = useState('dashboard');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const [showAddMemberModal, setShowAddMemberModal] = useState(false);
  const [memberPhone, setMemberPhone] = useState('');

  const [title, setTitle] = useState('');
  const [type, setType] = useState('target');
  const [contributionAmount, setContributionAmount] = useState('');
  const [targetGoal, setTargetGoal] = useState('');
  const [frequency, setFrequency] = useState('daily');
  const [drawIntervalDays, setDrawIntervalDays] = useState(3);
  const [drawDay, setDrawDay] = useState(1);

  const [paymentMethod, setPaymentMethod] = useState('receipt');
  const [receiptFile, setReceiptFile] = useState(null);
  const [txRef, setTxRef] = useState('');
  const [isSubmittingPayment, setIsSubmittingPayment] = useState(false);

  const [previewImage, setPreviewImage] = useState(null);

  const getDayName = (dayNumber) => {
    const days = {
      1: lang === 'am' ? 'ሰኞ' : lang === 'om' ? 'Wiixata' : 'Monday',
      2: lang === 'am' ? 'ማዕሰኞ' : lang === 'om' ? 'Kibxata' : 'Tuesday',
      3: lang === 'am' ? 'ረቡዕ' : lang === 'om' ? 'Roobii' : 'Wednesday',
      4: lang === 'am' ? 'ሐሙስ' : lang === 'om' ? 'Kamisa' : 'Thursday',
      5: lang === 'am' ? 'አርብ' : lang === 'om' ? 'Jimaata' : 'Friday',
      6: lang === 'am' ? 'ቅዳሜ' : lang === 'om' ? 'Sanbata' : 'Saturday',
      0: lang === 'am' ? 'እሁድ' : lang === 'om' ? 'Dilbata' : 'Sunday'
    };
    return days[dayNumber] !== undefined ? days[dayNumber] : (lang === 'am' ? 'ሰኞ' : 'Monday');
  };

  useEffect(() => {
    if (!user) return;

    groups.forEach(g => {
      socket.emit('join_group', g._id);
    });

    const handlePaymentUpdate = (data) => {
      fetchGroups();
      if (user?.role === 'admin') {
        fetchPendingPayments();
      }
    };

    const handleLotteryDrawn = (data) => {
      fetchGroups();
    };

    socket.on('payment_updated', handlePaymentUpdate);
    socket.on('lottery_drawn', handleLotteryDrawn);

    return () => {
      socket.off('payment_updated', handlePaymentUpdate);
      socket.off('lottery_drawn', handleLotteryDrawn);
    };
  }, [user, groups.length]);

  useEffect(() => {
    const searchString = window.location.search;
    const urlParams = new URLSearchParams(searchString);
    let txRefParam = urlParams.get('tx_ref') || urlParams.get('amp;tx_ref');

    if (!txRefParam && searchString.includes('tx_ref=')) {
      const match = searchString.match(/tx_ref=([^&]+)/);
      if (match) txRefParam = match[1];
    }

    if (txRefParam) {
      verifyPaymentAutomatically(txRefParam);
    }
  }, []);

  const verifyPaymentAutomatically = async (txRefVal) => {
    try {
      let endpoint = txRefVal ? `/payment/chapa-verify/${txRefVal}` : `/payment/chapa-verify/latest`;
      const { data } = await API.get(endpoint);
      
      alert(t.chapaSuccess);
      window.history.replaceState({}, document.title, window.location.pathname);
      fetchGroups();

      if (data.contribution && data.contribution.ekubGroup) {
        setSelectedGroup(data.contribution.ekubGroup);
        setShowLedgerModal(true);
      }
    } catch (err) {
      console.error('Verifying error', err);
    }
  };

  useEffect(() => {
    fetchGroups();
    if (user?.role === 'admin') {
      fetchPendingPayments();
    }
  }, [user]);

  const fetchGroups = async () => {
    try {
      setLoading(true);
      const { data } = await API.get('/ekub');
      setGroups(data);
      data.forEach(g => socket.emit('join_group', g._id));
    } catch (err) {
      console.error('Groups fetch error', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchPendingPayments = async () => {
    try {
      const { data } = await API.get('/payment/pending');
      setPendingPayments(data);
    } catch (err) {
      console.error('Pending payments fetch error', err);
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const handleApprove = async (contributionId, status) => {
    try {
      await API.put('/payment/approve-receipt', { contributionId, status });
      alert(status === 'approved' ? t.successApprove : t.successReject);
      fetchPendingPayments();
      fetchGroups();
    } catch (err) {
      alert(err.response?.data?.message || 'ክፍያውን ማስተካከል አልተቻለም');
    }
  };

  const handleCreateGroup = async (e) => {
    e.preventDefault();
    try {
      const { data } = await API.post('/ekub', {
        title,
        type,
        contributionAmount: Number(contributionAmount),
        targetGoal: Number(targetGoal),
        frequency,
        drawIntervalDays: type === 'lottery' ? Number(drawIntervalDays) : 1,
        drawDay: frequency === 'weekly' ? Number(drawDay) : 1
      });
      setShowCreateModal(false);
      setTitle('');
      setContributionAmount('');
      setTargetGoal('');
      setDrawIntervalDays(3);
      setFrequency('daily');
      setDrawDay(1);
      fetchGroups();
      if (data && data._id) {
        socket.emit('join_group', data._id);
      }
    } catch (err) {
      alert(err.response?.data?.message || 'እቁብ መፍጠር አልተቻለም');
    }
  };

  const handleAddMemberToGroup = async (e) => {
    e.preventDefault();
    try {
      await API.post(`/ekub/${selectedGroup._id}/add-member`, {
        phone: memberPhone
      });
      alert('አባል በስኬት ተጨምሯል!');
      setShowAddMemberModal(false);
      setMemberPhone('');
      fetchGroups();
    } catch (err) {
      alert(err.response?.data?.message || 'አባል መጨመር አልተቻለም');
    }
  };

  const handlePayment = async (e) => {
    e.preventDefault();

    const goalAmount = selectedGroup?.targetGoal || 10000;
    const adminId = selectedGroup?.admin?._id || selectedGroup?.admin;
    const actualMembersCount = selectedGroup?.members?.filter(m => (m._id || m).toString() !== adminId?.toString()).length || 1;
    
    const totalExpectedGoal = goalAmount * actualMembersCount;
    const estimatedCollected = selectedGroup?.totalCollected || 0;

    if (estimatedCollected >= totalExpectedGoal) {
      setIsSubmittingPayment(false);
      return alert('ይህ እቁብ ሙሉ በሙሉ ተሳክቷል!');
    }

    setIsSubmittingPayment(true);

    if (paymentMethod === 'chapa') {
      try {
        const { data } = await API.post('/payment/chapa-init', {
          ekubGroupId: selectedGroup._id,
          amount: selectedGroup.contributionAmount
        });
        
        const checkoutUrl = data?.data?.checkout_url || data?.checkout_url;

        if (checkoutUrl) {
          window.location.href = checkoutUrl;
        } else {
          alert('የክፍያ ሊንክ ማግኘት አልተቻለም!');
          setIsSubmittingPayment(false);
        }
      } catch (err) {
        const errorMsg = typeof err.response?.data === 'string' 
          ? err.response.data 
          : err.response?.data?.message || 'የ Chapa ክፍያ መጀመር አልተቻለም';
        alert(errorMsg);
        setIsSubmittingPayment(false);
      }
    } else {
      if (!receiptFile && !txRef) {
        setIsSubmittingPayment(false);
        return alert('እባክዎ የባንክ ደረሰኝ ፎቶ ወይም የትራንዛክሽን ቁጥር ያስገቡ!');
      }

      const formData = new FormData();
      if (receiptFile) formData.append('receipt', receiptFile);
      formData.append('ekubGroupId', selectedGroup._id);
      formData.append('amount', selectedGroup.contributionAmount);
      if (txRef) formData.append('transactionRef', txRef);

      try {
        await API.post('/payment/upload-receipt', formData, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
        alert(t.successUpload);
        setShowPayModal(false);
        setReceiptFile(null);
        setTxRef('');
        fetchGroups();
      } catch (err) {
        alert(err.response?.data?.message || 'ደረሰኝ መላክ አልተቻለም');
      } finally {
        setIsSubmittingPayment(false);
      }
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex">
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
              {pendingPayments.length > 0 && (
                <span className={`text-xs px-2 py-0.5 rounded-full font-bold ${activeTab === 'payments' ? 'bg-white text-blue-600' : 'bg-red-500 text-white'}`}>
                  {pendingPayments.length}
                </span>
              )}
            </button>
          )}

          {/* Settings Button added to Sidebar */}
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

      <div className="flex-1 md:ml-64 flex flex-col min-h-screen">
        <header className="h-16 bg-white border-b border-gray-200 px-6 flex justify-between items-center sticky top-0 z-30 shadow-sm">
          <button 
            onClick={() => setIsSidebarOpen(true)}
            className="md:hidden text-gray-600 hover:text-gray-900 p-2 rounded-lg hover:bg-gray-100"
          >
            <Menu size={22} />
          </button>

          <div className="hidden md:block">
            <h2 className="text-sm font-bold text-gray-800">
              {activeTab === 'dashboard' ? t.groupsTitle : t.paymentVerifications}
            </h2>
          </div>

          <div className="flex items-center gap-4">
            <div className="flex items-center gap-1.5 bg-gray-100 px-2.5 py-1.5 rounded-xl border border-gray-200 text-xs font-bold text-gray-700">
              <Globe className="text-blue-600" size={14} />
              <select 
                value={lang} 
                onChange={(e) => setLang(e.target.value)}
                className="bg-transparent outline-none cursor-pointer font-bold"
              >
                <option value="am">አማርኛ (Amh)</option>
                <option value="om">Afaan Oromoo (Oro)</option>
                <option value="en">English (Eng)</option>
              </select>
            </div>

            <div className="relative">
              <div 
                onClick={() => setShowProfileModal(!showProfileModal)}
                className="flex items-center gap-2 cursor-pointer bg-white px-3 py-1.5 rounded-xl border border-gray-200 shadow-sm hover:bg-gray-50 transition"
              >
                <span className="text-xs font-bold text-gray-700">{user?.name}</span>
                <div className="w-7 h-7 rounded-full bg-gradient-to-tr from-blue-600 to-indigo-600 text-white font-bold flex items-center justify-center text-xs shadow">
                  {user?.name?.charAt(0) || 'U'}
                </div>
                <span className="text-gray-400 text-[10px]">▼</span>
              </div>

              {showProfileModal && (
                <div className="absolute right-0 mt-2 w-64 bg-white rounded-2xl shadow-2xl border border-gray-100 p-4 z-50 space-y-3">
                  <div className="border-b pb-2 flex items-center gap-2.5">
                    <div className="w-9 h-9 rounded-full bg-blue-600 text-white font-bold flex items-center justify-center text-sm shadow">
                      {user?.name?.charAt(0) || 'U'}
                    </div>
                    <div>
                      <p className="text-[10px] text-gray-400 font-semibold uppercase">የተጠቃሚ መረጃ (Profile)</p>
                      <p className="font-extrabold text-sm text-gray-900">{user?.name}</p>
                    </div>
                  </div>
                  
                  <div className="space-y-1.5 text-xs text-gray-600">
                    <p className="flex justify-between">
                      <span className="text-gray-400">ስልክ ቁጥር:</span> 
                      <span className="font-bold text-gray-800">{user?.phone || 'N/A'}</span>
                    </p>
                    <p className="flex justify-between items-center">
                      <span className="text-gray-400">የመለያ ዓይነት:</span> 
                      <span className="font-bold uppercase bg-blue-50 text-blue-700 px-2 py-0.5 rounded-md text-[10px]">
                        {user?.role}
                      </span>
                    </p>
                    {user?.telegramChatId && (
                      <p className="flex justify-between">
                        <span className="text-gray-400">Telegram ID:</span> 
                        <span className="font-bold text-gray-800">{user.telegramChatId}</span>
                      </p>
                    )}
                  </div>

                  <button
                    onClick={() => setShowProfileModal(false)}
                    className="w-full bg-gray-100 hover:bg-gray-200 text-gray-700 py-2 rounded-xl font-bold text-xs transition"
                  >
                    ዝጋ (Close)
                  </button>
                </div>
              )}
            </div>

          </div>
        </header>

        <main className="flex-1 p-6 max-w-7xl mx-auto w-full">
          {activeTab === 'dashboard' && (
            <>
              <div className="flex justify-between items-center mb-6">
                <div>
                  <h2 className="text-2xl font-black text-gray-900 tracking-tight">{t.groupsTitle}</h2>
                  <p className="text-xs text-gray-500 mt-0.5">{t.groupsSubtitle}</p>
                </div>
                {user?.role === 'admin' && (
                  <button
                    onClick={() => setShowCreateModal(true)}
                    className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2.5 rounded-xl font-bold text-xs shadow-md shadow-blue-500/20 transition"
                  >
                    <PlusCircle size={16} /> {t.createNewGroup}
                  </button>
                )}
              </div>

              {loading ? (
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                  <SkeletonCard />
                  <SkeletonCard />
                  <SkeletonCard />
                </div>
              ) : groups.length === 0 ? (
                <div className="text-center py-16 bg-white rounded-2xl border border-dashed p-8 text-gray-400">
                  <p className="text-sm">{t.noGroups}</p>
                </div>
              ) : (
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {groups.map((group) => {
                    const isMember = group.members.some(m => m._id === user?._id);
                    const isAdmin = user?.role === 'admin';
                    const adminId = group.admin?._id || group.admin;
                    
                    const actualMembers = group.members.filter(m => (m._id || m).toString() !== adminId.toString());
                    const membersCount = actualMembers.length || 1;

                    const targetGoal = group.targetGoal || 10000;
                    const totalExpectedGoal = targetGoal * membersCount;
                    const estimatedCollected = group.totalCollected || 0;
                    const progressPercent = totalExpectedGoal > 0 ? Math.min(100, Math.round((estimatedCollected / totalExpectedGoal) * 100)) : 0;

                    return (
                      <div key={group._id} className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 flex flex-col justify-between hover:shadow-md transition">
                        <div>
                          <div className="flex justify-between items-start mb-3">
                            <h3 className="font-bold text-base text-gray-900">{group.title}</h3>
                            <span className={`text-[10px] px-2.5 py-1 rounded-full font-bold uppercase tracking-wide ${group.type === 'target' ? 'bg-purple-50 text-purple-700 border border-purple-100' : 'bg-emerald-50 text-emerald-700 border border-emerald-100'}`}>
                              {group.type === 'target' ? 'Target Goal' : 'Lottery'}
                            </span>
                          </div>
                          <p className="text-xs text-gray-400 mb-4">Admin: {group.admin?.name}</p>

                          <div className="space-y-2.5 text-xs text-gray-600 mb-5">
                            <div className="flex justify-between">
                              <span className="text-gray-400">{t.contributionAmount}</span>
                              <span className="font-bold text-gray-900">
                                {group.contributionAmount} ETB ({group.frequency === 'weekly' ? `Weekly - ${getDayName(group.drawDay)}` : 'Daily'})
                              </span>
                            </div>
                            
                            <div className="flex justify-between">
                              <span className="text-gray-400">{t.targetGoal}</span>
                              <span className="font-bold text-gray-900">{targetGoal} ETB</span>
                            </div>

                            {group.type === 'lottery' && (
                              <div className="flex justify-between text-blue-600 font-semibold bg-blue-50/70 px-2.5 py-1.5 rounded-lg border border-blue-100">
                                <span>{t.drawTime}</span>
                                <span>
                                  {group.frequency === 'weekly' 
                                    ? `Every 7 Days (${getDayName(group.drawDay)})` 
                                    : `Every ${group.drawIntervalDays || 1} Days`}
                                </span>
                              </div>
                            )}
                            
                            <div className="flex justify-between">
                              <span className="text-gray-400">{t.membersCount}</span>
                              <span className="font-bold text-gray-900">{actualMembers.length}</span>
                            </div>

                            <div className="mt-4 pt-2">
                              <div className="flex justify-between text-[11px] font-bold mb-1.5">
                                <span className="text-gray-500">{t.progress}</span>
                                <span className="text-blue-600">{progressPercent}%</span>
                              </div>
                              <div className="w-full bg-gray-100 rounded-full h-2 overflow-hidden">
                                <div 
                                  className="bg-blue-600 h-2 rounded-full transition-all duration-500" 
                                  style={{ width: `${progressPercent}%` }}
                                ></div>
                              </div>
                            </div>
                          </div>
                        </div>

                        <div className="flex flex-col gap-2 pt-2 border-t border-gray-50">
                          <div className="flex gap-2">
                            <button
                              onClick={() => { 
                                setSelectedGroup(group); 
                                setShowLedgerModal(true); 
                              }}
                              className={`${isAdmin ? 'w-full' : 'w-1/2'} border border-blue-600 text-blue-600 py-2 rounded-xl hover:bg-blue-50 font-bold text-xs flex items-center justify-center gap-1.5 transition`}
                            >
                              <FileText size={14} /> {t.ledger}
                            </button>
                            
                            {!isAdmin && isMember && (
                              <button
                                onClick={() => { setSelectedGroup(group); setShowPayModal(true); }}
                                className="w-1/2 bg-emerald-600 text-white py-2 rounded-xl hover:bg-emerald-700 font-bold text-xs flex items-center justify-center gap-1.5 shadow-sm transition"
                              >
                                <Wallet size={14} /> {t.makePayment}
                              </button>
                            )}
                          </div>

                          {isAdmin && (
                            <button
                              onClick={() => { setSelectedGroup(group); setShowAddMemberModal(true); }}
                              className="w-full bg-indigo-50 text-indigo-700 border border-indigo-100 py-2 rounded-xl hover:bg-indigo-100 font-bold text-xs flex items-center justify-center gap-1.5 transition"
                            >
                              <UserPlus size={14} /> {t.addMemberPhone}
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </>
          )}

          {activeTab === 'payments' && user?.role === 'admin' && (
            <div className="space-y-6">
              <div>
                <h2 className="text-2xl font-black text-gray-900 tracking-tight">{t.pendingTitle}</h2>
                <p className="text-xs text-gray-500 mt-0.5">{t.pendingSubtitle}</p>
              </div>

              {pendingPayments.length === 0 ? (
                <div className="text-center py-16 bg-white rounded-2xl border p-8 text-gray-400">
                  <p className="text-sm">{t.noPending}</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {pendingPayments.map((p) => (
                    <div key={p._id} className="flex flex-col sm:flex-row justify-between items-start sm:items-center p-5 border rounded-2xl bg-white shadow-sm gap-4">
                      <div className="flex items-center gap-4">
                        {p.receiptUrl ? (
                          <img 
                            src={p.receiptUrl} 
                            alt="Receipt" 
                            onClick={() => setPreviewImage(p.receiptUrl)}
                            className="w-16 h-16 object-cover rounded-xl border cursor-pointer hover:opacity-80 transition shadow-sm"
                          />
                        ) : (
                          <div className="w-16 h-16 bg-blue-50 text-blue-600 rounded-xl border flex items-center justify-center text-xs font-bold">
                            Chapa
                          </div>
                        )}
                        <div>
                          <p className="font-bold text-sm text-gray-900">{p.member?.name} <span className="text-xs text-gray-400 font-normal">({p.member?.phone})</span></p>
                          <p className="text-xs text-gray-600 mt-0.5">
                            Group: <span className="font-semibold text-blue-600">{p.ekubGroup?.title}</span>
                          </p>
                          <p className="text-xs text-green-600 font-extrabold mt-1">
                            Amount: {p.amount} ETB {p.transactionRef && `| Ref: ${p.transactionRef}`}
                          </p>
                        </div>
                      </div>

                      {p.paymentMethod === 'receipt' && (
                        <div className="flex gap-2 w-full sm:w-auto">
                          <button 
                            onClick={() => handleApprove(p._id, 'approved')} 
                            className="flex-1 sm:flex-none flex items-center justify-center gap-1.5 bg-green-600 text-white px-4 py-2 rounded-xl text-xs font-bold hover:bg-green-700 transition shadow-sm"
                          >
                            <CheckCircle size={15} /> {t.approve}
                          </button>
                          <button 
                            onClick={() => handleApprove(p._id, 'rejected')} 
                            className="flex-1 sm:flex-none flex items-center justify-center gap-1.5 bg-red-600 text-white px-4 py-2 rounded-xl text-xs font-bold hover:bg-red-700 transition shadow-sm"
                          >
                            <XCircle size={15} /> {t.reject}
                          </button>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </main>
      </div>

      {showCreateModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-3xl p-6 w-full max-w-md max-h-[90vh] overflow-y-auto shadow-2xl">
            <h3 className="text-lg font-black text-gray-900 mb-4">{t.createNewGroup}</h3>
            <form onSubmit={handleCreateGroup} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-700">Group Title</label>
                <input type="text" required className="w-full border border-gray-200 p-2.5 rounded-xl text-xs mt-1 bg-gray-50/50" value={title} onChange={e => setTitle(e.target.value)} placeholder="Family Equb" />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-700">Equb Type</label>
                <select className="w-full border border-gray-200 p-2.5 rounded-xl text-xs mt-1 bg-gray-50/50" value={type} onChange={e => setType(e.target.value)}>
                  <option value="target">Target Goal</option>
                  <option value="lottery">Lottery</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-700">{t.contributionAmount} (ETB)</label>
                <input type="number" required className="w-full border border-gray-200 p-2.5 rounded-xl text-xs mt-1 bg-gray-50/50" value={contributionAmount} onChange={e => setContributionAmount(e.target.value)} placeholder="1000" />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700">{t.targetGoal} (ETB)</label>
                <input type="number" required className="w-full border border-gray-200 p-2.5 rounded-xl text-xs mt-1 bg-gray-50/50" value={targetGoal} onChange={e => setTargetGoal(e.target.value)} placeholder="10000" />
              </div>

              {type === 'lottery' && (
                <div>
                  <label className="block text-xs font-bold text-blue-700">Draw Interval (Days)</label>
                  <select className="w-full border border-blue-200 p-2.5 rounded-xl text-xs mt-1 bg-blue-50/40 font-bold" value={drawIntervalDays} onChange={e => setDrawIntervalDays(e.target.value)}>
                    <option value={1}>1 Day (Daily)</option>
                    <option value={3}>3 Days</option>
                    <option value={5}>5 Days</option>
                    <option value={7}>7 Days (Weekly)</option>
                    <option value={15}>15 Days</option>
                    <option value={30}>30 Days (Monthly)</option>
                  </select>
                </div>
              )}

              <div>
                <label className="block text-xs font-bold text-gray-700">Frequency</label>
                <select className="w-full border border-gray-200 p-2.5 rounded-xl text-xs mt-1 bg-gray-50/50" value={frequency} onChange={e => setFrequency(e.target.value)}>
                  <option value="daily">Daily</option>
                  <option value="weekly">Weekly</option>
                </select>
              </div>

              {frequency === 'weekly' && (
                <div className="bg-blue-50/60 p-3.5 rounded-2xl border border-blue-100">
                  <label className="block text-xs font-bold text-blue-900 mb-1.5">Draw Day</label>
                  <select className="w-full border border-blue-200 p-2.5 rounded-xl bg-white text-xs font-semibold" value={drawDay} onChange={(e) => setDrawDay(Number(e.target.value))}>
                    <option value={1}>Monday</option>
                    <option value={2}>Tuesday</option>
                    <option value={3}>Wednesday</option>
                    <option value={4}>Thursday</option>
                    <option value={5}>Friday</option>
                    <option value={6}>Saturday</option>
                    <option value={0}>Sunday</option>
                  </select>
                </div>
              )}

              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setShowCreateModal(false)} className="w-1/2 border border-gray-200 py-2.5 rounded-xl font-bold text-xs text-gray-600 hover:bg-gray-50">{t.cancel}</button>
                <button type="submit" className="w-1/2 bg-blue-600 hover:bg-blue-700 text-white py-2.5 rounded-xl font-bold text-xs shadow-md">{t.create}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showAddMemberModal && selectedGroup && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-3xl p-6 w-full max-w-md shadow-2xl">
            <h3 className="text-lg font-black text-gray-900 mb-1">{t.addMemberPhone}</h3>
            <p className="text-xs text-gray-400 mb-4">{selectedGroup.title}</p>
            
            <form onSubmit={handleAddMemberToGroup} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-700">Phone Number</label>
                <input type="text" required className="w-full border border-gray-200 p-2.5 rounded-xl text-xs mt-1 bg-gray-50/50" value={memberPhone} onChange={e => setMemberPhone(e.target.value)} placeholder={t.phonePlaceholder} />
              </div>

              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setShowAddMemberModal(false)} className="w-1/2 border border-gray-200 py-2.5 rounded-xl font-bold text-xs text-gray-600 hover:bg-gray-50">{t.cancel}</button>
                <button type="submit" className="w-1/2 bg-indigo-600 hover:bg-indigo-700 text-white py-2.5 rounded-xl font-bold text-xs shadow-md">{t.save}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showAddMemberModal && selectedGroup && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-3xl p-6 w-full max-w-md shadow-2xl">
            <h3 className="text-lg font-black text-gray-900 mb-1">{t.addMemberPhone}</h3>
            <p className="text-xs text-gray-400 mb-4">{selectedGroup.title}</p>
            
            <form onSubmit={handleAddMemberToGroup} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-700">Phone Number</label>
                <input type="text" required className="w-full border border-gray-200 p-2.5 rounded-xl text-xs mt-1 bg-gray-50/50" value={memberPhone} onChange={e => setMemberPhone(e.target.value)} placeholder={t.phonePlaceholder} />
              </div>

              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setShowAddMemberModal(false)} className="w-1/2 border border-gray-200 py-2.5 rounded-xl font-bold text-xs text-gray-600 hover:bg-gray-50">{t.cancel}</button>
                <button type="submit" className="w-1/2 bg-indigo-600 hover:bg-indigo-700 text-white py-2.5 rounded-xl font-bold text-xs shadow-md">{t.save}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showPayModal && selectedGroup && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-3xl p-6 w-full max-w-md max-h-[90vh] overflow-y-auto shadow-2xl">
            <h3 className="text-lg font-black text-gray-900 mb-1">{t.makePayment}</h3>
            <p className="text-xs text-gray-400 mb-3">{selectedGroup.title} - መጠን: <span className="font-bold text-blue-600">{selectedGroup.contributionAmount} ETB</span></p>

            {/* የአድሚን የባንክ እና የቴሌብር መረጃ ማሳያ ካርድ */}
            {selectedGroup?.admin?.bankDetails && (
              <div className="bg-blue-50/80 p-3.5 rounded-2xl border border-blue-200 mb-4 text-xs space-y-2.5">
                <p className="font-bold text-blue-950 flex items-center gap-1">
                  🏦 ክፍያ የሚፈፀምባቸው የአድሚን ሂሳቦች:
                </p>

                <div className="grid grid-cols-1 gap-2">
                  {/* የባንክ አካውንት */}
                  <div className="bg-white p-2.5 rounded-xl border border-blue-100 shadow-sm">
                    <p className="font-bold text-blue-800 text-[11px] mb-0.5">🏛️ የባንክ ስም: {selectedGroup.admin.bankDetails.bankName || 'CBE'}</p>
                    <p className="text-gray-500 text-[10px]">ሂሳብ ቁጥር: <span className="font-extrabold text-blue-900 text-xs">{selectedGroup.admin.bankDetails.bankAccountNumber || 'N/A'}</span></p>
                    <p className="text-gray-500 text-[10px]">የስም ባለቤት: <span className="font-semibold text-gray-800">{selectedGroup.admin.bankDetails.bankAccountName || selectedGroup.admin.name}</span></p>
                  </div>

                  {/* የቴሌብር አካውንት */}
                  <div className="bg-white p-2.5 rounded-xl border border-blue-100 shadow-sm">
                    <p className="font-bold text-green-700 text-[11px] mb-0.5">📱 Telebirr (ቴሌብር)</p>
                    <p className="text-gray-500 text-[10px]">ስልክ ቁጥር: <span className="font-extrabold text-green-900 text-xs">{selectedGroup.admin.bankDetails.telebirrPhone || 'N/A'}</span></p>
                    <p className="text-gray-500 text-[10px]">የስም ባለቤት: <span className="font-semibold text-gray-800">{selectedGroup.admin.bankDetails.telebirrName || selectedGroup.admin.name}</span></p>
                  </div>
                </div>
              </div>
            )}

            <form onSubmit={handlePayment} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">{t.selectPaymentMethod}</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setPaymentMethod('chapa')}
                    className={`py-2.5 px-3 rounded-xl border text-xs font-bold transition flex items-center justify-center gap-1.5 ${
                      paymentMethod === 'chapa'
                        ? 'bg-blue-600 text-white border-blue-600 shadow-sm'
                        : 'bg-gray-50 text-gray-700 border-gray-200 hover:bg-gray-100'
                    }`}
                  >
                    💳 {t.chapaOnline}
                  </button>
                  <button
                    type="button"
                    onClick={() => setPaymentMethod('receipt')}
                    className={`py-2.5 px-3 rounded-xl border text-xs font-bold transition flex items-center justify-center gap-1.5 ${
                      paymentMethod === 'receipt'
                        ? 'bg-blue-600 text-white border-blue-600 shadow-sm'
                        : 'bg-gray-50 text-gray-700 border-gray-200 hover:bg-gray-100'
                    }`}
                  >
                    📄 {t.bankReceiptUpload}
                  </button>
                </div>
              </div>

              {paymentMethod === 'receipt' && (
                <>
                  <div>
                    <label className="block text-xs font-bold text-gray-700">Transaction Reference / Remark (Optional)</label>
                    <input type="text" className="w-full border border-gray-200 p-2.5 rounded-xl text-xs mt-1 bg-gray-50/50" value={txRef} onChange={e => setTxRef(e.target.value)} placeholder="FT23xxxxxxxx" />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-gray-700 mb-1">{t.selectReceipt}</label>
                    <input type="file" accept="image/*" onChange={e => setReceiptFile(e.target.files[0])} className="w-full border border-gray-200 p-2 rounded-xl text-xs bg-gray-50/50 file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100" />
                  </div>
                </>
              )}

              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setShowPayModal(false)} className="w-1/2 border border-gray-200 py-2.5 rounded-xl font-bold text-xs text-gray-600 hover:bg-gray-50">{t.cancel}</button>
                <button type="submit" disabled={isSubmittingPayment} className="w-1/2 bg-emerald-600 hover:bg-emerald-700 text-white py-2.5 rounded-xl font-bold text-xs shadow-md flex items-center justify-center gap-2">
                  {isSubmittingPayment ? <Loader2 className="animate-spin" size={16} /> : <Wallet size={16} />}
                  {isSubmittingPayment ? t.submitting : t.submitPayment}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showLedgerModal && selectedGroup && (
        <EkubLedgerModal 
          isOpen={showLedgerModal}
          group={selectedGroup} 
          userRole={user?.role} 
          currentLang={lang}
          onClose={() => { setShowLedgerModal(false); setSelectedGroup(null); }} 
        />
      )}

      {previewImage && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 z-50" onClick={() => setPreviewImage(null)}>
          <div className="relative max-w-4xl max-h-[90vh]">
            <img src={previewImage} alt="Receipt Preview" className="max-w-full max-h-[85vh] rounded-2xl object-contain shadow-2xl border border-white/10" />
            <button onClick={() => setPreviewImage(null)} className="absolute -top-4 -right-4 bg-white text-black p-2 rounded-full shadow-lg font-bold">
              <X size={20} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;