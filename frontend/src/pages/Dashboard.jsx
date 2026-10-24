import React, { useState, useEffect, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import API from '../services/api';
import { AuthContext } from '../context/AuthContext';
import { 
  PlusCircle, Wallet, CheckCircle, XCircle, FileText, UserPlus, 
  LayoutDashboard, CreditCard, LogOut, Menu, X, Globe, Settings as SettingsIcon 
} from 'lucide-react';
import EkubLedgerModal from '../components/EkubLedgerModal';
import SkeletonCard from '../components/SkeletonCard';

import { translations } from '../translations';
import { socket } from '../services/socket';
import { 
  CreateGroupModal, 
  AddMemberModal, 
  MakePaymentModal, 
  ImagePreviewModal 
} from '../components/DashboardModals';

const Dashboard = () => {
  const { user, logout } = useContext(AuthContext);
  const navigate = useNavigate();

  // LocalStorage theke active language read korbe, jate nije theke amharic-e reset na hoy
  const [lang, setLang] = useState(localStorage.getItem('app_lang') || 'am');
  const t = translations[lang] || translations.am;

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
      2: lang === 'am' ? 'ማክሰኞ' : lang === 'om' ? 'Kibxata' : 'Tuesday',
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

    const handlePaymentUpdate = () => {
      fetchGroups();
      if (user?.role === 'admin') fetchPendingPayments();
    };

    const handleLotteryDrawn = () => fetchGroups();

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

    if (txRefParam) verifyPaymentAutomatically(txRefParam);
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
    if (user?.role === 'admin') fetchPendingPayments();
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
      if (data?._id) socket.emit('join_group', data._id);
    } catch (err) {
      alert(err.response?.data?.message || 'እቁብ መፍጠር አልተቻለም');
    }
  };

  const handleAddMemberToGroup = async (e) => {
    e.preventDefault();
    try {
      await API.post(`/ekub/${selectedGroup._id}/add-member`, { phone: memberPhone });
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
        alert(err.response?.data?.message || 'የ Chapa ክፍያ መጀመር አልተቻለም');
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
      {/* SIDEBAR */}
      <aside className={`fixed inset-y-0 left-0 z-50 w-64 bg-white border-r border-gray-200 transform transition-transform duration-300 ease-in-out md:translate-x-0 ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="h-16 flex items-center justify-between px-6 border-b border-gray-100">
          <div className="flex items-center gap-2">
            <div className="bg-blue-600 text-white font-extrabold w-9 h-9 rounded-xl flex items-center justify-center shadow-md">E</div>
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
              activeTab === 'dashboard' ? 'bg-blue-600 text-white shadow-md shadow-blue-500/20' : 'text-gray-600 hover:bg-gray-100'
            }`}
          >
            <LayoutDashboard size={18} /> {t.dashboard}
          </button>

          {user?.role === 'admin' && (
            <button
              onClick={() => { setActiveTab('payments'); setIsSidebarOpen(false); }}
              className={`w-full flex items-center justify-between px-4 py-3 rounded-xl font-semibold text-sm transition ${
                activeTab === 'payments' ? 'bg-blue-600 text-white shadow-md shadow-blue-500/20' : 'text-gray-600 hover:bg-gray-100'
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

      {/* MAIN CONTENT AREA */}
      <div className="flex-1 md:ml-64 flex flex-col min-h-screen">
        <header className="h-16 bg-white border-b border-gray-200 px-6 flex justify-between items-center sticky top-0 z-30 shadow-sm">
          <button onClick={() => setIsSidebarOpen(true)} className="md:hidden text-gray-600 hover:text-gray-900 p-2 rounded-lg hover:bg-gray-100">
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
                onChange={(e) => {
                  const selectedLang = e.target.value;
                  setLang(selectedLang);
                  localStorage.setItem('app_lang', selectedLang); // LocalStorage-e save hobe
                }}
                className="bg-transparent outline-none cursor-pointer font-bold"
              >
                <option value="am">አማርኛ (Amh)</option>
                <option value="om">Afaan Oromoo (Oro)</option>
                <option value="en">English (Eng)</option>
              </select>
            </div>

            <div className="relative">
              <div onClick={() => setShowProfileModal(!showProfileModal)} className="flex items-center gap-2 cursor-pointer bg-white px-3 py-1.5 rounded-xl border border-gray-200 shadow-sm hover:bg-gray-50 transition">
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
                    <p className="flex justify-between"><span className="text-gray-400">ስልክ ቁጥር:</span> <span className="font-bold text-gray-800">{user?.phone || 'N/A'}</span></p>
                    <p className="flex justify-between items-center"><span className="text-gray-400">የመለያ ዓይነት:</span> <span className="font-bold uppercase bg-blue-50 text-blue-700 px-2 py-0.5 rounded-md text-[10px]">{user?.role}</span></p>
                  </div>
                  <button onClick={() => setShowProfileModal(false)} className="w-full bg-gray-100 hover:bg-gray-200 text-gray-700 py-2 rounded-xl font-bold text-xs transition">ዝጋ (Close)</button>
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
                  <button onClick={() => setShowCreateModal(true)} className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2.5 rounded-xl font-bold text-xs shadow-md shadow-blue-500/20 transition">
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
                    const targetGoal = group.targetGoal || 10000;
                    const totalExpectedGoal = targetGoal * (actualMembers.length || 1);
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
                              <span className="font-bold text-gray-900">{group.contributionAmount} ETB ({group.frequency === 'weekly' ? `Weekly - ${getDayName(group.drawDay)}` : 'Daily'})</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-gray-400">{t.targetGoal}</span>
                              <span className="font-bold text-gray-900">{targetGoal} ETB</span>
                            </div>
                            {group.type === 'lottery' && (
                              <div className="flex justify-between text-blue-600 font-semibold bg-blue-50/70 px-2.5 py-1.5 rounded-lg border border-blue-100">
                                <span>{t.drawTime}</span>
                                <span>{group.frequency === 'weekly' ? `Every 7 Days (${getDayName(group.drawDay)})` : `Every ${group.drawIntervalDays || 1} Days`}</span>
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
                                <div className="bg-blue-600 h-2 rounded-full transition-all duration-500" style={{ width: `${progressPercent}%` }}></div>
                              </div>
                            </div>
                          </div>
                        </div>

                        <div className="flex flex-col gap-2 pt-2 border-t border-gray-50">
                          <div className="flex gap-2">
                            <button onClick={() => { setSelectedGroup(group); setShowLedgerModal(true); }} className={`${isAdmin ? 'w-full' : 'w-1/2'} border border-blue-600 text-blue-600 py-2 rounded-xl hover:bg-blue-50 font-bold text-xs flex items-center justify-center gap-1.5 transition`}>
                              <FileText size={14} /> {t.ledger}
                            </button>
                            {!isAdmin && isMember && (
                              <button onClick={() => { setSelectedGroup(group); setShowPayModal(true); }} className="w-1/2 bg-emerald-600 text-white py-2 rounded-xl hover:bg-emerald-700 font-bold text-xs flex items-center justify-center gap-1.5 shadow-sm transition">
                                <Wallet size={14} /> {t.makePayment}
                              </button>
                            )}
                          </div>
                          {isAdmin && (
                            <button onClick={() => { setSelectedGroup(group); setShowAddMemberModal(true); }} className="w-full bg-indigo-50 text-indigo-700 border border-indigo-100 py-2 rounded-xl hover:bg-indigo-100 font-bold text-xs flex items-center justify-center gap-1.5 transition">
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
                          <img src={p.receiptUrl} alt="Receipt" onClick={() => setPreviewImage(p.receiptUrl)} className="w-16 h-16 object-cover rounded-xl border cursor-pointer hover:opacity-80 transition shadow-sm" />
                        ) : (
                          <div className="w-16 h-16 bg-blue-50 text-blue-600 rounded-xl border flex items-center justify-center text-xs font-bold">Chapa</div>
                        )}
                        <div>
                          <p className="font-bold text-sm text-gray-900">{p.member?.name || p.user?.name || 'አባል'} <span className="text-xs text-gray-400 font-normal">({p.member?.phone || p.user?.phone})</span></p>
                          <p className="text-xs text-gray-600 mt-0.5">Group: <span className="font-semibold text-blue-600">{p.ekubGroup?.title}</span></p>
                          <p className="text-xs text-green-600 font-extrabold mt-1">Amount: {p.amount} ETB {p.transactionRef && `| Ref: ${p.transactionRef}`}</p>
                        </div>
                      </div>

                      {p.paymentMethod === 'receipt' && (
                        <div className="flex gap-2 w-full sm:w-auto">
                          <button onClick={() => handleApprove(p._id, 'approved')} className="flex-1 sm:flex-none flex items-center justify-center gap-1.5 bg-green-600 text-white px-4 py-2 rounded-xl text-xs font-bold hover:bg-green-700 transition shadow-sm">
                            <CheckCircle size={15} /> {t.approve}
                          </button>
                          <button onClick={() => handleApprove(p._id, 'rejected')} className="flex-1 sm:flex-none flex items-center justify-center gap-1.5 bg-red-600 text-white px-4 py-2 rounded-xl text-xs font-bold hover:bg-red-700 transition shadow-sm">
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

      <CreateGroupModal
        show={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onSubmit={handleCreateGroup}
        t={t}
        title={title} setTitle={setTitle}
        type={type} setType={setType}
        contributionAmount={contributionAmount} setContributionAmount={setContributionAmount}
        targetGoal={targetGoal} setTargetGoal={setTargetGoal}
        drawIntervalDays={drawIntervalDays} setDrawIntervalDays={setDrawIntervalDays}
        frequency={frequency} setFrequency={setFrequency}
        drawDay={drawDay} setDrawDay={setDrawDay}
      />

      <AddMemberModal
        show={showAddMemberModal}
        selectedGroup={selectedGroup}
        onClose={() => setShowAddMemberModal(false)}
        onSubmit={handleAddMemberToGroup}
        memberPhone={memberPhone} setMemberPhone={setMemberPhone}
        t={t}
      />

      <MakePaymentModal
        show={showPayModal}
        selectedGroup={selectedGroup}
        onClose={() => setShowPayModal(false)}
        onSubmit={handlePayment}
        t={t}
        paymentMethod={paymentMethod} setPaymentMethod={setPaymentMethod}
        txRef={txRef} setTxRef={setTxRef}
        setReceiptFile={setReceiptFile}
        isSubmittingPayment={isSubmittingPayment}
      />

      {showLedgerModal && selectedGroup && (
        <EkubLedgerModal 
          isOpen={showLedgerModal}
          group={selectedGroup} 
          userRole={user?.role} 
          currentLang={lang}
          onClose={() => { setShowLedgerModal(false); setSelectedGroup(null); }} 
        />
      )}

      <ImagePreviewModal
        previewImage={previewImage}
        onClose={() => setPreviewImage(null)}
      />
    </div>
  );
};

export default Dashboard;