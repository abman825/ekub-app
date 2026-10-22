import React, { useState, useEffect, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import API from '../services/api';
import { AuthContext } from '../context/AuthContext';
import { 
  PlusCircle, Wallet, CheckCircle, XCircle, FileText, UserPlus, 
  Loader2, LayoutDashboard, Users, CreditCard, LogOut, Menu, X 
} from 'lucide-react';
import EkubLedgerModal from '../components/EkubLedgerModal';
import SkeletonCard from '../components/SkeletonCard';

const Dashboard = () => {
  const { user, logout } = useContext(AuthContext);
  const navigate = useNavigate();

  const [groups, setGroups] = useState([]);
  const [loading, setLoading] = useState(true);
  const [pendingPayments, setPendingPayments] = useState([]);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showPayModal, setShowPayModal] = useState(false);
  const [showLedgerModal, setShowLedgerModal] = useState(false);
  const [selectedGroup, setSelectedGroup] = useState(null);

  // Navigation / Sidebar Active Tab State ('dashboard', 'payments')
  const [activeTab, setActiveTab] = useState('dashboard');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  // Add Member Modal State
  const [showAddMemberModal, setShowAddMemberModal] = useState(false);
  const [memberPhone, setMemberPhone] = useState('');

  // New Group Form State
  const [title, setTitle] = useState('');
  const [type, setType] = useState('target');
  const [contributionAmount, setContributionAmount] = useState('');
  const [targetGoal, setTargetGoal] = useState('');
  const [frequency, setFrequency] = useState('daily');
  const [drawIntervalDays, setDrawIntervalDays] = useState(3);
  const [drawDay, setDrawDay] = useState(1);

  // Payment Form State
  const [paymentMethod, setPaymentMethod] = useState('receipt');
  const [receiptFile, setReceiptFile] = useState(null);
  const [txRef, setTxRef] = useState('');
  const [isSubmittingPayment, setIsSubmittingPayment] = useState(false);

  // Image Preview Zoom State
  const [previewImage, setPreviewImage] = useState(null);

  const getDayName = (dayNumber) => {
    const days = {
      1: 'ሰኞ',
      2: 'ማክሰኞ',
      3: 'ረቡዕ',
      4: 'ሐሙስ',
      5: 'አርብ',
      6: 'ቅዳሜ',
      0: 'እሁድ'
    };
    return days[dayNumber] !== undefined ? days[dayNumber] : 'ሰኞ';
  };

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
      
      alert('🎉 የ Chapa ክፍያዎ በስኬት ተረጋግጦ ጸድቋል!');
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
    } catch (err) {
      console.error('እቁቦችን ማግኘት አልተቻለም', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchPendingPayments = async () => {
    try {
      const { data } = await API.get('/payment/pending');
      setPendingPayments(data);
    } catch (err) {
      console.error('የሚጠብቁ ክፍያዎችን ማግኘት አልተቻለም', err);
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const handleApprove = async (contributionId, status) => {
    try {
      await API.put('/payment/approve-receipt', { contributionId, status });
      alert(`ክፍያው ${status === 'approved' ? 'ጸድቋል' : 'ውድቅ ተደርጓል'}`);
      fetchPendingPayments();
      fetchGroups();
    } catch (err) {
      alert(err.response?.data?.message || 'ክፍያውን ማጽደቅ አልተቻለም');
    }
  };

  const handleCreateGroup = async (e) => {
    e.preventDefault();
    try {
      await API.post('/ekub', {
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
    } catch (err) {
      alert(err.response?.data?.message || 'እቁብ መፈጠር አልተቻለም');
    }
  };

  const handleAddMemberToGroup = async (e) => {
    e.preventDefault();
    try {
      await API.post(`/ekub/${selectedGroup._id}/add-member`, {
        phone: memberPhone
      });
      alert('አባል በስኬት ወደ እቁብ ተጨምሯል!');
      setShowAddMemberModal(false);
      setMemberPhone('');
      fetchGroups();
    } catch (err) {
      alert(err.response?.data?.message || 'አባል መመዝገብ አልተቻለም');
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
      return alert('ይህ እቁብ ሙሉ በሙሉ ተሳክቷል! ከዚህ በላይ ክፍያ መፈጸም አይቻልም።');
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
        return alert('እባክዎን የባንክ ደረሰኝ ፎቶ ወይም የትራንዛክሽን ቁጥር ያስገቡ!');
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
        alert('የባንክ ደረሰኝ በስኬት ተላክቷል!');
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
      
      {/* 📱 SIDEBAR NAVIGATION */}
      <aside className={`fixed inset-y-0 left-0 z-50 w-64 bg-white border-r border-gray-200 transform transition-transform duration-300 ease-in-out md:translate-x-0 ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="h-16 flex items-center justify-between px-6 border-b border-gray-100">
          <div className="flex items-center gap-2">
            <div className="bg-blue-600 text-white font-extrabold w-9 h-9 rounded-xl flex items-center justify-center shadow-md">
              እ
            </div>
            <h1 className="text-xl font-extrabold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
              እቁብ App
            </h1>
          </div>
          <button onClick={() => setIsSidebarOpen(false)} className="md:hidden text-gray-400 hover:text-gray-600">
            <X size={20} />
          </button>
        </div>

        {/* User Profile */}
        <div className="p-4 mx-4 my-4 bg-blue-50/60 rounded-2xl border border-blue-100/60">
          <p className="text-xs text-gray-500 font-medium">እንኳን ደህና መጡ,</p>
          <p className="text-sm font-bold text-gray-800 truncate">{user?.name}</p>
          <span className="inline-block mt-1 px-2 py-0.5 bg-blue-600 text-white text-[10px] font-bold rounded-md uppercase tracking-wider">
            {user?.role}
          </span>
        </div>

        {/* Sidebar Links */}
        <nav className="p-4 space-y-1.5">
          <button
            onClick={() => { setActiveTab('dashboard'); setIsSidebarOpen(false); }}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-semibold text-sm transition ${
              activeTab === 'dashboard' 
                ? 'bg-blue-600 text-white shadow-md shadow-blue-500/20' 
                : 'text-gray-600 hover:bg-gray-100'
            }`}
          >
            <LayoutDashboard size={18} /> ዳሽቦርድ (Dashboard)
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
                <CreditCard size={18} /> የክፍያ ማረጋገጫዎች
              </div>
              {pendingPayments.length > 0 && (
                <span className={`text-xs px-2 py-0.5 rounded-full font-bold ${activeTab === 'payments' ? 'bg-white text-blue-600' : 'bg-red-500 text-white'}`}>
                  {pendingPayments.length}
                </span>
              )}
            </button>
          )}
        </nav>

        {/* Sidebar Footer Logout */}
        <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-gray-100 bg-white">
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-4 py-2.5 rounded-xl font-semibold text-sm text-red-600 bg-red-50 hover:bg-red-100 transition border border-red-100"
          >
            <LogOut size={18} /> ከሂሳብ ውጣ (Logout)
          </button>
        </div>
      </aside>

      {/* MAIN CONTENT CONTAINER */}
      <div className="flex-1 md:ml-64 flex flex-col min-h-screen">
        
        {/* Top Navbar */}
        <header className="h-16 bg-white border-b border-gray-200 px-6 flex justify-between items-center sticky top-0 z-30 shadow-sm">
          <button 
            onClick={() => setIsSidebarOpen(true)}
            className="md:hidden text-gray-600 hover:text-gray-900 p-2 rounded-lg hover:bg-gray-100"
          >
            <Menu size={22} />
          </button>

          <div className="hidden md:block">
            <h2 className="text-sm font-bold text-gray-800">
              {activeTab === 'dashboard' ? '📊 የእቁብ ቡድኖች ማጠቃለያ' : '💳 የባንክ ክፍያ ማረጋገጫ ክፍሎች'}
            </h2>
          </div>

          <div className="flex items-center gap-3">
            <span className="text-xs font-semibold text-gray-500 hidden sm:inline">አስተዳዳሪ፡ {user?.name}</span>
            <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-blue-600 to-indigo-600 text-white font-bold flex items-center justify-center text-xs shadow">
              {user?.name?.charAt(0) || 'U'}
            </div>
          </div>
        </header>

        {/* Page Body Content */}
        <main className="flex-1 p-6 max-w-7xl mx-auto w-full">
          
          {/* TAB 1: DASHBOARD & GROUPS VIEW */}
          {activeTab === 'dashboard' && (
            <>
              {/* GROUPS HEADER & CREATE BUTTON */}
              <div className="flex justify-between items-center mb-6">
                <div>
                  <h2 className="text-2xl font-black text-gray-900 tracking-tight">የእቁብ ቡድኖች</h2>
                  <p className="text-xs text-gray-500 mt-0.5">የእቁብ መዋጮዎችን እና የዕጣ ዝርዝሮችን እዚህ ይከታተሉ።</p>
                </div>
                {user?.role === 'admin' && (
                  <button
                    onClick={() => setShowCreateModal(true)}
                    className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2.5 rounded-xl font-bold text-xs shadow-md shadow-blue-500/20 transition"
                  >
                    <PlusCircle size={16} /> አዲስ እቁብ ፍጠር
                  </button>
                )}
              </div>

              {/* GROUPS GRID */}
              {loading ? (
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                  <SkeletonCard />
                  <SkeletonCard />
                  <SkeletonCard />
                </div>
              ) : groups.length === 0 ? (
                <div className="text-center py-16 bg-white rounded-2xl border border-dashed p-8 text-gray-400">
                  <p className="text-sm">ምንም የእቁብ ቡድኖች አልተገኙም።</p>
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
                          <p className="text-xs text-gray-400 mb-4">አስተዳዳሪ፡ {group.admin?.name}</p>

                          <div className="space-y-2.5 text-xs text-gray-600 mb-5">
                            <div className="flex justify-between">
                              <span className="text-gray-400">የክፍያ መጠን</span>
                              <span className="font-bold text-gray-900">
                                {group.contributionAmount} ብር ({group.frequency === 'weekly' ? `በሳምንት - ${getDayName(group.drawDay)}` : 'ቀን'} )
                              </span>
                            </div>
                            
                            <div className="flex justify-between">
                              <span className="text-gray-400">{group.type === 'target' ? 'የሚሰበሰብ ዒላማ' : 'ጠቅላላ የዕጣ መጠን'}</span>
                              <span className="font-bold text-gray-900">{targetGoal} ብር</span>
                            </div>

                            {group.type === 'lottery' && (
                              <div className="flex justify-between text-blue-600 font-semibold bg-blue-50/70 px-2.5 py-1.5 rounded-lg border border-blue-100">
                                <span>የዕጣ ማውጫ ጊዜ</span>
                                <span>
                                  {group.frequency === 'weekly' 
                                    ? `በ 7 ቀን (${getDayName(group.drawDay)})` 
                                    : `በ ${group.drawIntervalDays || 1} ቀን`}
                                </span>
                              </div>
                            )}
                            
                            <div className="flex justify-between">
                              <span className="text-gray-400">አባላት</span>
                              <span className="font-bold text-gray-900">{actualMembers.length} አባላት</span>
                            </div>

                            <div className="mt-4 pt-2">
                              <div className="flex justify-between text-[11px] font-bold mb-1.5">
                                <span className="text-gray-500">እድገት (Progress)</span>
                                <span className="text-blue-600">{progressPercent}% ተሳክቷል</span>
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
                              onClick={() => { setSelectedGroup(group); setShowLedgerModal(true); }}
                              className={`${isAdmin ? 'w-full' : 'w-1/2'} border border-blue-600 text-blue-600 py-2 rounded-xl hover:bg-blue-50 font-bold text-xs flex items-center justify-center gap-1.5 transition`}
                            >
                              📋 የእቁብ ደፍተር
                            </button>
                            
                            {!isAdmin && isMember && (
                              <button
                                onClick={() => { setSelectedGroup(group); setShowPayModal(true); }}
                                className="w-1/2 bg-emerald-600 text-white py-2 rounded-xl hover:bg-emerald-700 font-bold text-xs flex items-center justify-center gap-1.5 shadow-sm transition"
                              >
                                <Wallet size={14} /> ክፍያ ፈጸም
                              </button>
                            )}
                          </div>

                          {isAdmin && (
                            <button
                              onClick={() => { setSelectedGroup(group); setShowAddMemberModal(true); }}
                              className="w-full bg-indigo-50 text-indigo-700 border border-indigo-100 py-2 rounded-xl hover:bg-indigo-100 font-bold text-xs flex items-center justify-center gap-1.5 transition"
                            >
                              <UserPlus size={14} /> አባል በስልክ ቁጥር ጨምር
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

          {/* TAB 2: PENDING PAYMENTS MANAGEMENT */}
          {activeTab === 'payments' && user?.role === 'admin' && (
            <div className="space-y-6">
              <div>
                <h2 className="text-2xl font-black text-gray-900 tracking-tight">የባንክ ክፍያ ማረጋገጫዎች</h2>
                <p className="text-xs text-gray-500 mt-0.5">የአባላትን የባንክ ደረሰኞች እና የኦንላይን ክፍያ ጥያቄዎች እዚህ ይገመግሙ።</p>
              </div>

              {pendingPayments.length === 0 ? (
                <div className="text-center py-16 bg-white rounded-2xl border p-8 text-gray-400">
                  <p className="text-sm">ምንም የሚጠብቅ የክፍያ ጥያቄ የለም።</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {pendingPayments.map((p) => (
                    <div key={p._id} className="flex flex-col sm:flex-row justify-between items-start sm:items-center p-5 border rounded-2xl bg-white shadow-sm gap-4">
                      <div className="flex items-center gap-4">
                        {p.receiptUrl ? (
                          <img 
                            src={p.receiptUrl} 
                            alt="ደረሰኝ" 
                            onClick={() => setPreviewImage(p.receiptUrl)}
                            className="w-16 h-16 object-cover rounded-xl border cursor-pointer hover:opacity-80 transition shadow-sm"
                          />
                        ) : (
                          <div className="w-16 h-16 bg-gray-100 rounded-xl border flex items-center justify-center text-xs text-gray-400 font-bold">
                            Chapa
                          </div>
                        )}
                        <div>
                          <p className="font-bold text-sm text-gray-900">{p.member?.name} <span className="text-xs text-gray-400 font-normal">({p.member?.phone})</span></p>
                          <p className="text-xs text-gray-600 mt-0.5">
                            እቁብ፡ <span className="font-semibold text-blue-600">{p.ekubGroup?.title}</span>
                          </p>
                          <p className="text-xs text-green-600 font-extrabold mt-1">
                            መጠን፡ {p.amount} ብር {p.transactionRef && `| Ref: ${p.transactionRef}`}
                          </p>
                        </div>
                      </div>

                      {p.paymentMethod === 'receipt' && (
                        <div className="flex gap-2 w-full sm:w-auto">
                          <button 
                            onClick={() => handleApprove(p._id, 'approved')} 
                            className="flex-1 sm:flex-none flex items-center justify-center gap-1.5 bg-green-600 text-white px-4 py-2 rounded-xl text-xs font-bold hover:bg-green-700 transition shadow-sm"
                          >
                            <CheckCircle size={15} /> አጽድቅ
                          </button>
                          <button 
                            onClick={() => handleApprove(p._id, 'rejected')} 
                            className="flex-1 sm:flex-none flex items-center justify-center gap-1.5 bg-red-600 text-white px-4 py-2 rounded-xl text-xs font-bold hover:bg-red-700 transition shadow-sm"
                          >
                            <XCircle size={15} /> ውድቅ አድርግ
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

      {/* CREATE GROUP MODAL */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-3xl p-6 w-full max-w-md max-h-[90vh] overflow-y-auto shadow-2xl">
            <h3 className="text-lg font-black text-gray-900 mb-4">አዲስ የእቁብ ቢሮ መመስረቻ</h3>
            <form onSubmit={handleCreateGroup} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-700">የእቁብ ስም</label>
                <input type="text" required className="w-full border border-gray-200 p-2.5 rounded-xl text-xs mt-1 bg-gray-50/50" value={title} onChange={e => setTitle(e.target.value)} placeholder="የ 10,000 ብር እቁብ" />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-700">የእቁብ ዓይነት</label>
                <select className="w-full border border-gray-200 p-2.5 rounded-xl text-xs mt-1 bg-gray-50/50" value={type} onChange={e => setType(e.target.value)}>
                  <option value="target">በተቀመጠ ዓማ (Target Goal)</option>
                  <option value="lottery">በዕጣ የሚወጣ (Lottery)</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-700">የአንድ ዙር ክፍያ መጠን (ብር)</label>
                <input type="number" required className="w-full border border-gray-200 p-2.5 rounded-xl text-xs mt-1 bg-gray-50/50" value={contributionAmount} onChange={e => setContributionAmount(e.target.value)} placeholder="1000" />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700">
                  {type === 'target' ? 'የዒላማ (Target Goal Amount)' : 'ጠቅላላ የዕጣ መጠን'}
                </label>
                <input type="number" required className="w-full border border-gray-200 p-2.5 rounded-xl text-xs mt-1 bg-gray-50/50" value={targetGoal} onChange={e => setTargetGoal(e.target.value)} placeholder="10000" />
              </div>

              {type === 'lottery' && (
                <div>
                  <label className="block text-xs font-bold text-blue-700">ዕጣው በስንት ቀን ይወጣል? (የቀን ብዛት)</label>
                  <select className="w-full border border-blue-200 p-2.5 rounded-xl text-xs mt-1 bg-blue-50/40 font-bold" value={drawIntervalDays} onChange={e => setDrawIntervalDays(e.target.value)}>
                    <option value={1}>በ 1 ቀን (በቀን)</option>
                    <option value={3}>በ 3 ቀን</option>
                    <option value={5}>በ 5 ቀን</option>
                    <option value={7}>በ 7 ቀን (ሳምንታዊ)</option>
                    <option value={15}>በ 15 ቀን</option>
                    <option value={30}>በ 30 ቀን (ወርሃዊ)</option>
                  </select>
                </div>
              )}

              <div>
                <label className="block text-xs font-bold text-gray-700">የክፍያ ድግግሞሽ</label>
                <select className="w-full border border-gray-200 p-2.5 rounded-xl text-xs mt-1 bg-gray-50/50" value={frequency} onChange={e => setFrequency(e.target.value)}>
                  <option value="daily">በቀን (Daily)</option>
                  <option value="weekly">በሳምንት (Weekly)</option>
                </select>
              </div>

              {frequency === 'weekly' && (
                <div className="bg-blue-50/60 p-3.5 rounded-2xl border border-blue-100">
                  <label className="block text-xs font-bold text-blue-900 mb-1.5">ክፍያው የሚሰበሰብበት ቀን ይምረጡ</label>
                  <select className="w-full border border-blue-200 p-2.5 rounded-xl bg-white text-xs font-semibold" value={drawDay} onChange={(e) => setDrawDay(Number(e.target.value))}>
                    <option value={1}>ሰኞ (Monday)</option>
                    <option value={2}>ማክሰኞ (Tuesday)</option>
                    <option value={3}>ረቡዕ (Wednesday)</option>
                    <option value={4}>ሐሙስ (Thursday)</option>
                    <option value={5}>አርብ (Friday)</option>
                    <option value={6}>ቅዳሜ (Saturday)</option>
                    <option value={0}>እሁድ (Sunday)</option>
                  </select>
                </div>
              )}

              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setShowCreateModal(false)} className="w-1/2 border border-gray-200 py-2.5 rounded-xl font-bold text-xs text-gray-600 hover:bg-gray-50">ሰርዝ</button>
                <button type="submit" className="w-1/2 bg-blue-600 hover:bg-blue-700 text-white py-2.5 rounded-xl font-bold text-xs shadow-md">ፍጠር</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ADD MEMBER MODAL */}
      {showAddMemberModal && selectedGroup && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-3xl p-6 w-full max-w-md shadow-2xl">
            <h3 className="text-lg font-black text-gray-900 mb-1">አባል መመዝገቢያ</h3>
            <p className="text-xs text-gray-400 mb-4">{selectedGroup.title}</p>
            
            <form onSubmit={handleAddMemberToGroup} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-700">የአባል ስልክ ቁጥር</label>
                <input type="text" required className="w-full border border-gray-200 p-2.5 rounded-xl text-xs mt-1 bg-gray-50/50" value={memberPhone} onChange={e => setMemberPhone(e.target.value)} placeholder="09xxxxxxxx" />
              </div>

              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setShowAddMemberModal(false)} className="w-1/2 border border-gray-200 py-2.5 rounded-xl font-bold text-xs text-gray-600 hover:bg-gray-50">ሰርዝ</button>
                <button type="submit" className="w-1/2 bg-indigo-600 hover:bg-indigo-700 text-white py-2.5 rounded-xl font-bold text-xs shadow-md">አካት</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* PAYMENT MODAL */}
      {showPayModal && selectedGroup && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-3xl p-6 w-full max-w-md shadow-2xl">
            <h3 className="text-lg font-black text-gray-900 mb-1">ክፍያ ማሰሪያ</h3>
            <p className="text-xs text-gray-500 mb-4">{selectedGroup.title} | መጠን፡ <span className="font-extrabold text-green-600">{selectedGroup.contributionAmount} ብር</span></p>

            <form onSubmit={handlePayment} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1.5">የክፍያ ማድረሻ ይምረጡ</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setPaymentMethod('receipt')}
                    className={`p-2.5 border rounded-xl text-xs font-bold transition ${paymentMethod === 'receipt' ? 'border-blue-600 bg-blue-50 text-blue-700 shadow-sm' : 'border-gray-200 text-gray-600'}`}
                  >
                    የባንክ ደረሰኝ (Screenshot)
                  </button>
                  <button
                    type="button"
                    onClick={() => setPaymentMethod('chapa')}
                    className={`p-2.5 border rounded-xl text-xs font-bold transition ${paymentMethod === 'chapa' ? 'border-blue-600 bg-blue-50 text-blue-700 shadow-sm' : 'border-gray-200 text-gray-600'}`}
                  >
                    Chapa Online
                  </button>
                </div>
              </div>

              {paymentMethod === 'receipt' ? (
                <div className="space-y-3 bg-gray-50/70 p-4 rounded-2xl border border-gray-100">
                  <p className="text-xs text-gray-600 font-medium">
                    የአስተዳዳሪው የባንክ መረጃ <br />
                    <span className="font-bold text-gray-900">{selectedGroup.admin?.bankDetails?.bankName || 'CBE'}</span>: 
                    <span className="font-extrabold text-blue-600 ml-1">{selectedGroup.admin?.bankDetails?.accountNumber || '1000123456789'}</span>
                  </p>
                  <div>
                    <label className="block text-[11px] font-bold text-gray-700">የደረሰኝ ፎቶ (Screenshot)</label>
                    <input type="file" accept="image/*" onChange={e => setReceiptFile(e.target.files[0])} className="mt-1 text-xs w-full text-gray-500 file:mr-4 file:py-1.5 file:px-3 file:rounded-xl file:border-0 file:text-xs file:font-bold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100" />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-gray-700">የግብይት ቁጥር (Ref Number)</label>
                    <input type="text" className="w-full border border-gray-200 p-2 rounded-xl text-xs bg-white mt-1" value={txRef} onChange={e => setTxRef(e.target.value)} placeholder="FT24xxx" />
                  </div>
                </div>
              ) : (
                <p className="text-xs text-blue-600 bg-blue-50 p-4 rounded-2xl border border-blue-100 leading-relaxed font-medium">
                  'ክፍያ ፈጸም' የሚለውን ሲጫኑ በቀጥታ ወደ Chapa ደህንነቱ የተጠበቀ የክፍያ ገጽ ይመራሉ።
                </p>
              )}

              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setShowPayModal(false)} className="w-1/2 border border-gray-200 py-2.5 rounded-xl font-bold text-xs text-gray-600 hover:bg-gray-50">ሰርዝ</button>
                <button 
                  type="submit" 
                  disabled={isSubmittingPayment}
                  className="w-1/2 bg-emerald-600 hover:bg-emerald-700 text-white py-2.5 rounded-xl flex items-center justify-center gap-2 font-bold text-xs shadow-md transition disabled:opacity-50"
                >
                  {isSubmittingPayment ? (
                    <>
                      <Loader2 size={16} className="animate-spin" />
                      <span>እየተላከ ነው...</span>
                    </>
                  ) : (
                    <span>ክፍያ ፈጸም</span>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* LEDGER MODAL */}
      <EkubLedgerModal
        isOpen={showLedgerModal}
        onClose={() => setShowLedgerModal(false)}
        group={selectedGroup}
        userRole={user?.role}
      />

      {/* IMAGE PREVIEW LIGHTBOX */}
      {previewImage && (
        <div 
          onClick={() => setPreviewImage(null)}
          className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 z-50 cursor-pointer"
        >
          <div className="relative max-w-4xl max-h-[90vh]" onClick={(e) => e.stopPropagation()}>
            <button 
              onClick={() => setPreviewImage(null)}
              className="absolute -top-12 right-0 text-white bg-red-600 hover:bg-red-700 px-3.5 py-1.5 rounded-xl text-xs font-bold shadow-lg"
            >
              ✕ ዝጋ (Close)
            </button>
            <img 
              src={previewImage} 
              alt="የባንክ ደረሰኝ" 
              className="max-w-full max-h-[85vh] object-contain rounded-2xl shadow-2xl border-2 border-white/20"
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;