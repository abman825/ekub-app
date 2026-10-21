import React, { useState, useEffect, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import API from '../services/api';
import { AuthContext } from '../context/AuthContext';
import { PlusCircle, Wallet, CheckCircle, XCircle, FileText, UserPlus, Loader2 } from 'lucide-react';
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
      
      alert('🎉 የ Chapa ክፍያዎ በስኬት ተረጋግጧ!');
      
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
      console.error('እቁቦችን ማጥመድ አዳልተቻለም', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchPendingPayments = async () => {
    try {
      const { data } = await API.get('/payment/pending');
      setPendingPayments(data);
    } catch (err) {
      console.error('የሚጠበቁ ክፍያዎችን ማግኘት አልተቻለም', err);
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
      alert(err.response?.data?.message || 'እቁብ መፍጠር አልተቻለም');
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
    setIsSubmittingPayment(true);

    if (paymentMethod === 'chapa') {
      try {
        const { data } = await API.post('/payment/chapa-init', {
          ekubGroupId: selectedGroup._id,
          amount: selectedGroup.contributionAmount
        });
        
        // 🛠️ FIX: Chapa checkout URL በትክክል እንዲነበብ ተደረገ
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
        return alert('እባክዎን የባንክ ደረሰኝ ምስል ወይም የትራንዛክሽን ቁጥር ያስገቡ!');
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
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <nav className="bg-white border-b px-6 py-4 flex justify-between items-center shadow-sm">
        <h1 className="text-xl font-bold text-blue-600">እቁብ</h1>
        <div className="flex items-center gap-4">
          <span className="text-sm font-medium text-gray-700"> {user?.name} ({user?.role})</span>
          <button 
            onClick={handleLogout} 
            className="text-sm bg-red-50 text-red-600 px-3 py-1.5 rounded-lg border border-red-200 hover:bg-red-100 font-medium transition"
          >
            ውጣ
          </button>
        </div>
      </nav>

      {/* Main Content */}
      <div className="max-w-6xl mx-auto p-6">

        {/* Admin Pending Receipts Approvals Section */}
        {user?.role === 'admin' && pendingPayments.length > 0 && (
          <div className="bg-white p-6 rounded-xl shadow-sm border border-yellow-300 mb-8 bg-yellow-50/20">
            <h2 className="text-lg font-bold text-gray-800 mb-4">የሚጠበቁ የክፍያ ደረሰኞች ({pendingPayments.length})</h2>
            <div className="space-y-4">
              {pendingPayments.map((p) => (
                <div key={p._id} className="flex justify-between items-center p-4 border rounded-lg bg-white shadow-sm gap-4">
                  
                  <div className="flex items-center gap-4">
                    {p.receiptUrl ? (
                      <div 
                        onClick={() => setPreviewImage(p.receiptUrl)}
                        className="cursor-pointer group relative"
                        title="በግልጽ ለማየት ክሊክ"
                      >
                        <img 
                          src={p.receiptUrl} 
                          alt="የባንክ ደረሰኝ" 
                          className="w-20 h-20 object-cover rounded-lg border group-hover:opacity-90 shadow-sm transition"
                        />
                        <span className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 rounded-lg flex items-center justify-center text-white text-xs font-bold transition">
                          🔍 ማግኘት
                        </span>
                      </div>
                    ) : (
                      <div className="w-20 h-20 bg-gray-100 rounded-lg border flex items-center justify-center text-xs text-gray-400 text-center p-1">
                        ምስል የለውም
                      </div>
                    )}

                    <div>
                      <p className="font-bold text-gray-800">{p.member?.name} ({p.member?.phone})</p>
                      <p className="text-sm text-gray-600">
                        እቁብ፡ <span className="font-semibold">{p.ekubGroup?.title}</span> | መጠን፡ <span className="font-semibold text-green-600">{p.amount} ብር</span>
                      </p>
                      
                      {p.receiptUrl && (
                        <button 
                          onClick={() => setPreviewImage(p.receiptUrl)}
                          className="text-xs text-blue-600 font-semibold underline mt-1 hover:text-blue-800 block text-left"
                        >
                          🔍 ምስሉን አስፋ እዚህ ክሊክ
                        </button>
                      )}
                      
                      {p.transactionRef && (
                        <p className="text-xs text-gray-600 font-semibold mt-1">Ref No: {p.transactionRef}</p>
                      )}
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <button 
                      onClick={() => handleApprove(p._id, 'approved')} 
                      className="flex items-center gap-1 bg-green-600 text-white px-3 py-1.5 rounded-lg text-sm hover:bg-green-700 font-medium transition"
                    >
                      <CheckCircle size={16} /> አጽድቅ
                    </button>
                    <button 
                      onClick={() => handleApprove(p._id, 'rejected')} 
                      className="flex items-center gap-1 bg-red-600 text-white px-3 py-1.5 rounded-lg text-sm hover:bg-red-700 font-medium transition"
                    >
                      <XCircle size={16} /> ውድቅ አድርግ
                    </button>
                  </div>

                </div>
              ))}
            </div>
          </div>
        )}

        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-gray-800">የእቁብ ቢሮዎች</h2>
          {user?.role === 'admin' && (
            <button
              onClick={() => setShowCreateModal(true)}
              className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition"
            >
              <PlusCircle size={18} /> አዲስ እቁብ ፈጠር
            </button>
          )}
        </div>

        {/* Groups Cards Grid with Skeleton Loader */}
        {loading ? (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            <SkeletonCard />
            <SkeletonCard />
            <SkeletonCard />
          </div>
        ) : groups.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-xl border p-8 text-gray-500">
            ምንም የእቁብ ቢሮዎች የሉም።
          </div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {groups.map((group) => {
              const isMember = group.members.some(m => m._id === user?._id);
              const isAdmin = user?.role === 'admin';
              const adminId = group.admin?._id || group.admin;
              const actualMembersCount = group.members.filter(m => (m._id || m).toString() !== adminId.toString()).length;

              const targetGoal = group.targetGoal || 10000;
              const estimatedCollected = group.totalCollected || 0;
              const progressPercent = Math.min(100, Math.round((estimatedCollected / targetGoal) * 100));

              return (
                <div key={group._id} className="bg-white rounded-xl shadow-sm border p-5 flex flex-col justify-between">
                  <div>
                    <div className="flex justify-between items-start mb-3">
                      <h3 className="font-bold text-lg text-gray-800">{group.title}</h3>
                      <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${group.type === 'target' ? 'bg-purple-100 text-purple-700' : 'bg-green-100 text-green-700'}`}>
                        {group.type === 'target' ? 'በተቀመጠ ዓማ (Target)' : 'በዕጣ እቁብ'}
                      </span>
                    </div>
                    <p className="text-sm text-gray-500 mb-4">አስተዳዳሪ፡ {group.admin?.name}</p>

                    <div className="space-y-2 text-sm text-gray-600 mb-4">
                      <div className="flex justify-between">
                        <span>የክፍያ መጠን</span>
                        <span className="font-bold text-gray-800">
                          {group.contributionAmount} ብር ({group.frequency === 'weekly' ? `በሳምንት - ${getDayName(group.drawDay)}` : 'በቀን'})
                        </span>
                      </div>
                      
                      <div className="flex justify-between">
                        <span>{group.type === 'target' ? 'የሚሰበሰብ ዓማ፡' : 'የዕጣው ጠቅላላ መጠን'}</span>
                        <span className="font-bold text-gray-800">{targetGoal} ብር</span>
                      </div>

                      {group.type === 'lottery' && (
                        <div className="flex justify-between text-blue-600 font-semibold bg-blue-50 px-2 py-1 rounded">
                          <span>የዕጣ ማውጫ ጊዜ፡</span>
                          <span>
                            {group.frequency === 'weekly' 
                              ? `በ 7 ቀን (${getDayName(group.drawDay)})` 
                              : `በ ${group.drawIntervalDays || 1} ቀን`}
                          </span>
                        </div>
                      )}
                      
                      <div className="flex justify-between">
                        <span>አባላት፡</span>
                        <span className="font-bold text-gray-800">{actualMembersCount} አባላት</span>
                      </div>

                      {/* Progress Bar */}
                      <div className="mt-3">
                        <div className="flex justify-between text-xs font-semibold mb-1">
                          <span className="text-gray-600">እድገት (Progress)</span>
                          <span className="text-blue-600">{progressPercent}% ተሳክቷል</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2.5 overflow-hidden">
                          <div 
                            className="bg-blue-600 h-2.5 rounded-full transition-all duration-500" 
                            style={{ width: `${progressPercent}%` }}
                          ></div>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-col gap-2 mt-4">
                    <div className="flex gap-2">
                      <button
                        onClick={() => { setSelectedGroup(group); setShowLedgerModal(true); }}
                        className={`${isAdmin ? 'w-full' : 'w-1/2'} border border-blue-600 text-blue-600 py-2 rounded-lg hover:bg-blue-50 font-medium text-sm flex items-center justify-center gap-1`}
                      >
                        📋 የእቁብ ደፍተር
                      </button>
                      
                      {!isAdmin && isMember && (
                        <button
                          onClick={() => { setSelectedGroup(group); setShowPayModal(true); }}
                          className="w-1/2 bg-emerald-600 text-white py-2 rounded-lg hover:bg-emerald-700 font-medium text-sm flex items-center justify-center gap-1"
                        >
                          <Wallet size={16} /> ክፍያ ፈጸም
                        </button>
                      )}
                    </div>

                    {isAdmin && (
                      <button
                        onClick={() => { setSelectedGroup(group); setShowAddMemberModal(true); }}
                        className="w-full bg-indigo-50 text-indigo-700 border border-indigo-200 py-2 rounded-lg hover:bg-indigo-100 font-medium text-sm flex items-center justify-center gap-1 transition"
                      >
                        <UserPlus size={16} /> አባል በስልክ ቁጥር ጨምር
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Modal - Create Ekub */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-md max-h-[90vh] overflow-y-auto">
            <h3 className="text-xl font-bold mb-4">አዲስ የእቁብ ቢሮ መመስረቻ</h3>
            <form onSubmit={handleCreateGroup} className="space-y-4">
              <div>
                <label className="block text-sm font-medium">የእቁብ ስም</label>
                <input type="text" required className="w-full border p-2 rounded-lg mt-1" value={title} onChange={e => setTitle(e.target.value)} placeholder="የ 10,000 ብር እቁብ" />
              </div>
              <div>
                <label className="block text-sm font-medium">የእቁብ ዓይነት</label>
                <select className="w-full border p-2 rounded-lg mt-1" value={type} onChange={e => setType(e.target.value)}>
                  <option value="target">በተቀመጠ ዓማ (Target Goal)</option>
                  <option value="lottery">በዕጣ የሚወጣ (Lottery)</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium">የአንድ ዙር ክፍያ መጠን (ብር)</label>
                <input type="number" required className="w-full border p-2 rounded-lg mt-1" value={contributionAmount} onChange={e => setContributionAmount(e.target.value)} placeholder="200" />
              </div>

              <div>
                <label className="block text-sm font-medium">
                  {type === 'target' ? 'የመጀመሪያ ዓማ (Target Goal Amount)' : 'ጠቅላላ የዕጣ መጠን (Total Lottery Amount)'}
                </label>
                <input 
                  type="number" 
                  required 
                  className="w-full border p-2 rounded-lg mt-1" 
                  value={targetGoal} 
                  onChange={e => setTargetGoal(e.target.value)} 
                  placeholder="10000" 
                />
              </div>

              {type === 'lottery' && (
                <div>
                  <label className="block text-sm font-medium text-blue-700">ዕጣው በስንት ቀን ይወጣል? (የቀን ብዛት)</label>
                  <select 
                    className="w-full border p-2 rounded-lg mt-1 bg-blue-50/50 border-blue-200 font-semibold"
                    value={drawIntervalDays} 
                    onChange={e => setDrawIntervalDays(e.target.value)}
                  >
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
                <label className="block text-sm font-medium">የክፍያ ድግግሞሽ</label>
                <select className="w-full border p-2 rounded-lg mt-1" value={frequency} onChange={e => setFrequency(e.target.value)}>
                  <option value="daily">በቀን (Daily)</option>
                  <option value="weekly">በሳምንት (Weekly)</option>
                </select>
              </div>

              {frequency === 'weekly' && (
                <div className="bg-blue-50 p-3 rounded-lg border border-blue-200">
                  <label className="block text-sm font-medium text-blue-900 mb-1">
                    ክፍያው የሚሰበሰብበት ቀን ይመርጡ
                  </label>
                  <select
                    className="w-full border border-blue-300 p-2 rounded-lg bg-white"
                    value={drawDay}
                    onChange={(e) => setDrawDay(Number(e.target.value))}
                  >
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
                <button type="button" onClick={() => setShowCreateModal(false)} className="w-1/2 border py-2 rounded-lg">ሰርዝ</button>
                <button type="submit" className="w-1/2 bg-blue-600 text-white py-2 rounded-lg">ፍጠር</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal - Add Member by Admin */}
      {showAddMemberModal && selectedGroup && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-md">
            <h3 className="text-xl font-bold mb-2">አባል መመዝገቢያ - {selectedGroup.title}</h3>
            
            <form onSubmit={handleAddMemberToGroup} className="space-y-4">
              <div>
                <label className="block text-sm font-medium">አባል ስልክ ቁጥር</label>
                <input type="text" required className="w-full border p-2 rounded-lg mt-1" value={memberPhone} onChange={e => setMemberPhone(e.target.value)} placeholder="09xxxxxxxx" />
              </div>

              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setShowAddMemberModal(false)} className="w-1/2 border py-2 rounded-lg">ሰርዝ</button>
                <button type="submit" className="w-1/2 bg-indigo-600 text-white py-2 rounded-lg hover:bg-indigo-700">አክል</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal - Payment */}
      {showPayModal && selectedGroup && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-md">
            <h3 className="text-xl font-bold mb-2">ክፍያ ማሰሪያ - {selectedGroup.title}</h3>
            <p className="text-sm text-gray-600 mb-4">መጠን፡ <span className="font-bold">{selectedGroup.contributionAmount} ብር</span></p>

            <form onSubmit={handlePayment} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">የክፍያ መሠረቻ ይምረጡ</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setPaymentMethod('receipt')}
                    className={`p-2.5 border rounded-lg text-sm font-medium ${paymentMethod === 'receipt' ? 'border-blue-600 bg-blue-50 text-blue-700' : ''}`}
                  >
                    የባንክ ደረሰኝ (Screenshot)
                  </button>
                  <button
                    type="button"
                    onClick={() => setPaymentMethod('chapa')}
                    className={`p-2.5 border rounded-lg text-sm font-medium ${paymentMethod === 'chapa' ? 'border-blue-600 bg-blue-50 text-blue-700' : ''}`}
                  >
                    Chapa Online
                  </button>
                </div>
              </div>

              {paymentMethod === 'receipt' ? (
                <div className="space-y-3 bg-gray-50 p-3 rounded-lg border">
                  <p className="text-xs text-gray-600">
                    የአስተዳዳሪው የባንክ መረጃ <br />
                    <span className="font-semibold">{selectedGroup.admin?.bankDetails?.bankName || 'CBE'}</span>: 
                    <span className="font-bold text-gray-800 ml-1">{selectedGroup.admin?.bankDetails?.accountNumber || '1000123456789'}</span>
                  </p>
                  <div>
                    <label className="block text-xs font-medium text-gray-700">የደረሰኝ ምስል (Screenshot) - አማራጭ</label>
                    <input 
                      type="file" 
                      accept="image/*" 
                      onChange={e => setReceiptFile(e.target.files[0])} 
                      className="mt-1 text-xs w-full" 
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-700">የግብይት ቁጥር (Ref Number) - አማራጭ</label>
                    <input 
                      type="text" 
                      className="w-full border p-1.5 rounded text-xs bg-white mt-1" 
                      value={txRef} 
                      onChange={e => setTxRef(e.target.value)} 
                      placeholder="FT24xxx" 
                    />
                  </div>
                </div>
              ) : (
                <p className="text-xs text-gray-500 bg-blue-50 p-3 rounded border border-blue-200">
                  'ክፍያ ፈጸም' የሚለውን ሲጫኑ በቀጥታ ወደ Chapa ደህንነቱ የተጠበቀ የክፍያ ገጽ ይወስድዎታል።
                </p>
              )}

              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setShowPayModal(false)} className="w-1/2 border py-2 rounded-lg">ሰርዝ</button>
                <button 
                  type="submit" 
                  disabled={isSubmittingPayment}
                  className="w-1/2 bg-emerald-600 text-white py-2 rounded-lg flex items-center justify-center gap-2 font-medium hover:bg-emerald-700 transition disabled:opacity-50"
                >
                  {isSubmittingPayment ? (
                    <>
                      <Loader2 size={18} className="animate-spin" />
                      <span>እየተከናወነ...</span>
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

      {/* Modal - Ekub Ledger */}
      <EkubLedgerModal
        isOpen={showLedgerModal}
        onClose={() => setShowLedgerModal(false)}
        group={selectedGroup}
        userRole={user?.role}
      />

      {/* Fullscreen Image Zoom Modal */}
      {previewImage && (
        <div 
          onClick={() => setPreviewImage(null)}
          className="fixed inset-0 bg-black/80 flex items-center justify-center p-4 z-50 cursor-pointer"
        >
          <div className="relative max-w-4xl max-h-[90vh]" onClick={(e) => e.stopPropagation()}>
            <button 
              onClick={() => setPreviewImage(null)}
              className="absolute -top-10 right-0 text-white bg-red-600 hover:bg-red-700 px-3 py-1 rounded-full text-sm font-bold shadow-lg"
            >
              ✕ ዝጋ (Close)
            </button>
            <img 
              src={previewImage} 
              alt="የባንክ ደረሰኝ" 
              className="max-w-full max-h-[85vh] object-contain rounded-lg shadow-2xl border-2 border-white"
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;