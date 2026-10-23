import React, { useState, useEffect } from 'react';
import API from '../services/api';
import { CheckCircle, Clock, XCircle, FileText, User, Gift, Trophy, FileSpreadsheet, Printer, Search, Filter } from 'lucide-react';
import * as XLSX from 'xlsx';
import confetti from 'canvas-confetti';
import { io } from 'socket.io-client';

// 🛠️ መስመር 136 ን በዚህ አስተካክለው:
const SOCKET_URL = (import.meta.env && import.meta.env.VITE_API_URL) ? import.meta.env.VITE_API_URL : 'https://ekub-app.onrender.com';

const socket = io(SOCKET_URL, {
  transports: ['polling', 'websocket'], // 👈 Render ላይ 404 እንዳያመጣ መጀመሪያ Polling ይጠቀማል
  withCredentials: true,
  autoConnect: true
});

const ledgerTranslations = {
  am: {
    title: "የእቁብ ደፍተር",
    excel: "ኤክሴል",
    print: "ፕሪንት / PDF",
    winnersHistory: "ባለፈ እጣ አሸናፊዎች",
    showDetails: "ዝርዝር አሳይ",
    close: "ዝጋ",
    latestWinner: "የቅርብ ጊዜ እጣ አሸናፊ አባል!",
    lotterySystem: "የእጣ ማውጫ ስርዓት",
    intervalText: "ማወጣሻ ጊዜ፦ በ",
    daysText: "ቀናት | አባላት፦",
    drawButton: "አዲስ እጣ አውጣ",
    drawing: "እጣ እየወጣ ነው...",
    memberStatusTitle: "የአባላት የክፍያ ሁኔታ (የከፈሉ/ያልከፈሉ)",
    allStatus: "ሁሉንም ሁኔታ",
    approved: "ጸድቋል (Approved)",
    pending: "በመጠበቅ ላይ (Pending)",
    rejected: "ውድቅ የተደረገ (Rejected)",
    all: "ሁሉ",
    paid: "የከፈሉ",
    unpaid: "ያልከፈሉ",
    searchPlaceholder: "አባል በስም ወይም በስልክ ቁጥር ፈልግ...",
    noMembers: "ምንም የተገኘ አባል የለም።",
    memberLabel: "አባል / Member",
    guest: "እርስዎ",
    paidLabel: "የተከፈለ (Paid)",
    remainingRoundsLabel: "የቀረ ዙር (Remaining)",
    remainingAmountLabel: "የቀረ ገንዘብ (Remaining Amount)",
    selectPrompt: "👈 እባክዎ የእቁብን አባል ደፍተር ለማየት ከላይ ካሉት አባላት አንዱን ይምረጡ።",
    roundHeader: "ዙር",
    dateHeader: "የተከፈለበት ቀን",
    amountHeader: "መጠን",
    methodHeader: "የክፍያ መንገድ",
    statusHeader: "ሁኔታ",
    receiptHeader: "ስክሪንሾት / Ref",
    noPayments: "ምንም የተመዘገበ የክፍያ መረጃ የለም።",
    screenshotLink: "ስክሪንሾት",
    roundsUnit: "ዙር",
    fromLabel: "ከ"
  },
  om: {
    title: "Galmee Equb",
    excel: "Excel",
    print: "Maxxansi / PDF",
    winnersHistory: "Miseensota Carraan Bahe Duraanii",
    showDetails: "Bal'ina Agarsiisi",
    close: "Cufi",
    latestWinner: "Miseensa Carraan Yeroo Dhihoo Bahe!",
    lotterySystem: "Sirna Baafata Carraa",
    intervalText: "Yeroo Baafata፦ Guyyaa",
    daysText: "Keessatti | Miseensota:",
    drawButton: "Carraa Haaraa Baasi",
    drawing: "Carraan bahaa jira...",
    memberStatusTitle: "Haala Kaffaltii Miseensotaa (Kan Kaffalan/Hin Kaffalle)",
    allStatus: "Haala Hundumaa",
    approved: "Mirkanaa'era",
    pending: "Eeggacha Jira",
    rejected: "Dhowwameera",
    all: "Hunda",
    paid: "Kan Kaffalan",
    unpaid: "Kan Hin Kaffalle",
    searchPlaceholder: "Miseensa Maqaan ykn Lakkoofsaan barbaadi...",
    noMembers: "Miseensi argame hin jiru.",
    memberLabel: "Miseensa",
    guest: "Isin",
    paidLabel: "Kan Kaffalame",
    remainingRoundsLabel: "Marsaa Hafte",
    remainingAmountLabel: "Maallaqa Hafe",
    selectPrompt: "👈 Mee galmee miseensaa ilaaluuf miseensota olii keessaa tokko filadhaa.",
    roundHeader: "Marsaa",
    dateHeader: "Guyyaa Kaffalame",
    amountHeader: "Hanga",
    methodHeader: "Mala Kaffaltii",
    statusHeader: "Haala",
    receiptHeader: "Suuraa / Ref",
    noPayments: "Oduun kaffaltii galmaa'e hin jiru.",
    screenshotLink: "Suuraa",
    roundsUnit: "marsaa",
    fromLabel: "keessaa"
  },
  en: {
    title: "Equb Ledger",
    excel: "Excel",
    print: "Print / PDF",
    winnersHistory: "Previous Winners History",
    showDetails: "Show Details",
    close: "Close",
    latestWinner: "Latest Lottery Winner Member!",
    lotterySystem: "Lottery Draw System",
    intervalText: "Draw Interval: Every",
    daysText: "Days | Members:",
    drawButton: "Draw New Lottery",
    drawing: "Drawing Lottery...",
    memberStatusTitle: "Member Payment Status (Paid/Unpaid)",
    allStatus: "All Status",
    approved: "Approved",
    pending: "Pending",
    rejected: "Rejected",
    all: "All",
    paid: "Paid",
    unpaid: "Unpaid",
    searchPlaceholder: "Search member by name or phone...",
    noMembers: "No members found.",
    memberLabel: "Member",
    guest: "You",
    paidLabel: "Paid",
    remainingRoundsLabel: "Remaining Rounds",
    remainingAmountLabel: "Remaining Amount",
    selectPrompt: "👈 Please select a member from above to view their ledger.",
    roundHeader: "Round",
    dateHeader: "Date Paid",
    amountHeader: "Amount",
    methodHeader: "Method",
    statusHeader: "Status",
    receiptHeader: "Receipt / Ref",
    noPayments: "No payment records found.",
    screenshotLink: "Receipt",
    roundsUnit: "rounds",
    fromLabel: "out of"
  }
};

const EkubLedgerModal = ({ isOpen, onClose, group, userRole, currentLang = 'am' }) => {
  const [ledger, setLedger] = useState([]);
  const [selectedMember, setSelectedMember] = useState(null);
  const [loading, setLoading] = useState(true);
  const [currentGroup, setCurrentGroup] = useState(group);
  const [isDrawing, setIsDrawing] = useState(false);
  const [showWinnersHistory, setShowWinnersHistory] = useState(false);

  const [statusFilter, setStatusFilter] = useState('all'); 
  const [searchTerm, setSearchTerm] = useState('');
  const [todayFilter, setTodayFilter] = useState('all'); 

  const t = ledgerTranslations[currentLang] || ledgerTranslations.am;

  useEffect(() => {
    if (isOpen && group) {
      setCurrentGroup(group);
      setSelectedMember(null);
      fetchLatestGroupData();
      fetchLedger();
    }
  }, [isOpen, group]);

  // ⚡ Socket Listener
  useEffect(() => {
    if (!isOpen || !group) return;

    // Join room
    socket.emit('join_group', group._id);

    const handlePaymentUpdate = () => {
      fetchLatestGroupData();
      fetchLedger();
    };

    const handleLotteryDrawn = () => {
      fetchLatestGroupData();
      fetchLedger();
    };

    socket.on('payment_updated', handlePaymentUpdate);
    socket.on('lottery_drawn', handleLotteryDrawn);

    return () => {
      socket.off('payment_updated', handlePaymentUpdate);
      socket.off('lottery_drawn', handleLotteryDrawn);
    };
  }, [isOpen, group]);

  const fetchLatestGroupData = async () => {
    try {
      const { data } = await API.get(`/ekub/${group._id}`);
      setCurrentGroup(data);
    } catch (err) {
      console.error('Error fetching group', err);
    }
  };

  const fetchLedger = async () => {
    setLoading(true);
    try {
      const endpoint = userRole === 'admin' 
        ? `/payment/ledger/admin/${group._id}`
        : `/payment/ledger/member/${group._id}`;
      
      const { data } = await API.get(endpoint);
      setLedger(data);
    } catch (err) {
      console.error('Error fetching ledger', err);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen || !currentGroup) return null;

  const membersList = (currentGroup.members || []).filter(m => {
    if (!m) return false;
    const adminId = currentGroup.admin?._id || currentGroup.admin;
    return m._id ? m._id.toString() !== adminId?.toString() : false;
  });

  const getMemberRoundStatus = (memberId) => {
    const memberApprovedPayments = ledger.filter(
      p => (p.member?._id || p.member)?.toString() === memberId.toString() && p.status === 'approved'
    );
    const paidRoundsCount = memberApprovedPayments.length;

    const allMemberCounts = membersList.map(m => {
      return ledger.filter(p => (p.member?._id || p.member)?.toString() === m._id.toString() && p.status === 'approved').length;
    });
    
    const groupMaxRound = allMemberCounts.length > 0 ? Math.max(...allMemberCounts) : 0;
    const isPaidUpToDate = groupMaxRound === 0 ? paidRoundsCount > 0 : paidRoundsCount >= groupMaxRound;

    return { paidRoundsCount, isPaidUpToDate };
  };

  const filteredMembersList = membersList.filter(m => {
    const nameMatches = m.name?.toLowerCase().includes(searchTerm.toLowerCase());
    const phoneMatches = m.phone?.includes(searchTerm);
    const { isPaidUpToDate } = getMemberRoundStatus(m._id);

    if (todayFilter === 'paidToday') return (nameMatches || phoneMatches) && isPaidUpToDate;
    if (todayFilter === 'unpaidToday') return (nameMatches || phoneMatches) && !isPaidUpToDate;

    return nameMatches || phoneMatches;
  });

  const formatPhoneNumber = (phone) => {
    if (!phone) return '0911****90';
    if (userRole === 'admin') return phone;
    if (phone.length < 8) return phone;
    return `${phone.slice(0, 4)}****${phone.slice(-2)}`;
  };

  const handleDrawLottery = async () => {
    if (membersList.length === 0) {
      return alert('አባላት አልተገኙም!');
    }

    setIsDrawing(true);

    setTimeout(async () => {
      try {
        const { data } = await API.post('/ekub/draw-lottery', {
          groupId: currentGroup._id
        });
        if (data.group) {
          setCurrentGroup(data.group);
          confetti({ particleCount: 120, spread: 80, origin: { y: 0.6 } });
        }
      } catch (err) {
        console.error('Error drawing lottery', err);
        alert(err.response?.data?.message || 'እጣ ማውጣት አልተቻለም');
      } finally {
        setIsDrawing(false);
      }
    }, 1500);
  };

  const handleExportExcel = () => {
    const excelData = filteredPayments.map((item, index) => ({
      'No': index + 1,
      'Member Name': item.member?.name || 'N/A',
      'Phone': item.member?.phone || 'N/A',
      'Amount': item.amount,
      'Method': item.paymentMethod,
      'Status': item.status,
      'Date': new Date(item.createdAt).toLocaleDateString()
    }));

    const worksheet = XLSX.utils.json_to_sheet(excelData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Ledger");
    XLSX.writeFile(workbook, `${currentGroup.title}_Ledger_Report.xlsx`);
  };

  const handlePrintReceipt = () => {
    window.print();
  };

  const rawMemberPayments = userRole === 'admin'
    ? (selectedMember ? ledger.filter(item => (item.member?._id || item.member) === selectedMember._id) : [])
    : ledger;

  const sortedPayments = [...rawMemberPayments].sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));

  let approvedCount = 0;
  const processedPayments = sortedPayments.map((item) => {
    if (item.status === 'approved') {
      approvedCount += 1;
      return { ...item, roundNumber: approvedCount };
    } else {
      return { ...item, roundNumber: null };
    }
  });

  const displayPayments = processedPayments.reverse();

  const filteredPayments = displayPayments.filter((item) => {
    return statusFilter === 'all' || item.status === statusFilter;
  });

  const totalPaid = rawMemberPayments
    .filter(p => p.status === 'approved')
    .reduce((sum, p) => sum + p.amount, 0);

  const totalPaidRounds = approvedCount;
  const goalAmount = currentGroup.targetGoal || 10000;
  const contribution = currentGroup.contributionAmount || 1000;

  const totalRequiredRounds = Math.ceil(goalAmount / contribution);
  const remainingRounds = Math.max(0, totalRequiredRounds - totalPaidRounds);
  const remainingAmount = Math.max(0, goalAmount - totalPaid);

  const winnerObj = currentGroup.latestWinner?.member;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-3xl p-6 w-full max-w-3xl max-h-[85vh] overflow-y-auto shadow-2xl">
        <div className="flex justify-between items-center border-b pb-4 mb-4">
          <div>
            <h3 className="text-xl font-bold text-gray-800">{t.title} - {currentGroup.title}</h3>
            <p className="text-sm text-gray-500">
              {currentGroup.type === 'lottery' ? `🎲 Lottery (Every ${currentGroup.drawIntervalDays || 1} days)` : '🎯 Target Goal'}
            </p>
          </div>
          
          <div className="flex items-center gap-2">
            {userRole === 'admin' && (
              <button
                onClick={handleExportExcel}
                className="flex items-center gap-1 bg-green-600 text-white px-3 py-1.5 rounded-xl text-xs font-semibold hover:bg-green-700 transition shadow-sm"
              >
                <FileSpreadsheet size={16} /> {t.excel}
              </button>
            )}
            <button
              onClick={handlePrintReceipt}
              className="flex items-center gap-1 bg-blue-600 text-white px-3 py-1.5 rounded-xl text-xs font-semibold hover:bg-blue-700 transition shadow-sm"
            >
              <Printer size={16} /> {t.print}
            </button>
            <button onClick={() => { setSelectedMember(null); onClose(); }} className="text-gray-400 hover:text-gray-600 font-bold text-lg ml-2">✕</button>
          </div>
        </div>

        <div className="space-y-4">
          {currentGroup?.type === 'lottery' && currentGroup?.winnersHistory && currentGroup.winnersHistory.length > 0 && (
            <div className="bg-green-50/60 border border-green-200 rounded-2xl overflow-hidden shadow-sm">
              <button
                onClick={() => setShowWinnersHistory(!showWinnersHistory)}
                className="w-full p-3.5 flex justify-between items-center text-left hover:bg-green-100/50 transition font-bold text-green-900 text-sm"
              >
                <span className="flex items-center gap-2">
                  🏆 {t.winnersHistory} 
                  <span className="bg-green-600 text-white text-xs px-2 py-0.5 rounded-full font-normal">
                    {currentGroup.winnersHistory.length}
                  </span>
                </span>
                <span className="text-gray-500 text-xs">
                  {showWinnersHistory ? '▲' : '▼ ' + t.showDetails}
                </span>
              </button>

              {showWinnersHistory && (
                <div className="p-4 border-t border-green-200 space-y-2 bg-white max-h-48 overflow-y-auto">
                  {currentGroup.winnersHistory.map((winner, index) => {
                    const memberInfo = winner.member && typeof winner.member === 'object' ? winner.member : winner;
                    const nameToShow = memberInfo.name || memberInfo.phone || 'Member';
                    const phoneToShow = memberInfo.phone ? formatPhoneNumber(memberInfo.phone) : '';

                    return (
                      <div key={index} className="flex justify-between items-center bg-green-50/30 p-2.5 rounded-xl border border-green-100 text-xs">
                        <div className="flex items-center gap-2">
                          <span className="bg-green-600 text-white font-bold rounded-full w-5 h-5 flex items-center justify-center text-[10px]">{index + 1}</span>
                          <span className="font-bold text-gray-800">{nameToShow} {phoneToShow && `(${phoneToShow})`}</span>
                        </div>
                        <span className="text-gray-500 font-medium">
                          {winner.wonAt ? new Date(winner.wonAt).toLocaleDateString() : `Round ${index + 1}`}
                        </span>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {currentGroup.type === 'lottery' && winnerObj && (
            <div className="bg-gradient-to-r from-green-50 to-emerald-100 border-2 border-green-400 p-3.5 rounded-2xl text-center shadow-sm">
              <h3 className="text-sm font-bold text-green-800 flex items-center justify-center gap-2">
                🎉 {t.latestWinner} 🎉
              </h3>
              <p className="text-base font-extrabold text-green-950 mt-1">
                {winnerObj.name || 'Member'} ({formatPhoneNumber(winnerObj.phone)})
              </p>
            </div>
          )}

          {userRole === 'admin' && currentGroup.type === 'lottery' && (
            <div className="bg-gradient-to-r from-purple-50 to-indigo-50 p-4 rounded-2xl border border-purple-200 flex flex-col sm:flex-row justify-between items-center gap-3">
              <div>
                <h4 className="font-bold text-purple-900 flex items-center gap-2 text-sm">
                  <Gift size={16} /> {t.lotterySystem}
                </h4>
                <p className="text-xs text-purple-700">{t.intervalText} {currentGroup.drawIntervalDays || 1} {t.daysText} {membersList.length}</p>
              </div>

              <button
                onClick={handleDrawLottery}
                disabled={isDrawing}
                className="bg-purple-600 hover:bg-purple-700 text-white font-bold px-4 py-2 rounded-xl text-xs shadow transition flex items-center gap-2 disabled:opacity-50"
              >
                {isDrawing ? `🎲 ${t.drawing}` : `🎁 ${t.drawButton}`}
              </button>
            </div>
          )}

          {loading ? (
            <p className="text-center py-8 text-gray-500">በመጫን ላይ...</p>
          ) : (
            <div>
              {userRole === 'admin' && (
                <div className="mb-5 bg-gray-50/70 p-4 rounded-2xl border space-y-3">
                  <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
                    <h4 className="text-xs font-bold text-gray-700">{t.memberStatusTitle}</h4>
                    
                    <div className="flex items-center gap-2">
                      <div className="flex items-center gap-1">
                        <Filter size={12} className="text-gray-500" />
                        <select
                          value={statusFilter}
                          onChange={(e) => setStatusFilter(e.target.value)}
                          className="text-[11px] border border-gray-300 rounded-xl px-2 py-1.5 bg-white focus:outline-none font-medium"
                        >
                          <option value="all">{t.allStatus}</option>
                          <option value="approved">{t.approved}</option>
                          <option value="pending">{t.pending}</option>
                          <option value="rejected">{t.rejected}</option>
                        </select>
                      </div>

                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => setTodayFilter('all')}
                          className={`px-2.5 py-1.5 rounded-xl text-[10px] font-bold border transition ${todayFilter === 'all' ? 'bg-gray-800 text-white' : 'bg-white text-gray-700'}`}
                        >
                          {t.all}
                        </button>
                        <button
                          onClick={() => setTodayFilter('paidToday')}
                          className={`px-2.5 py-1.5 rounded-xl text-[10px] font-bold border transition ${todayFilter === 'paidToday' ? 'bg-green-600 text-white' : 'bg-green-50 text-green-700 border-green-200'}`}
                        >
                          {t.paid}
                        </button>
                        <button
                          onClick={() => setTodayFilter('unpaidToday')}
                          className={`px-2.5 py-1.5 rounded-xl text-[10px] font-bold border transition ${todayFilter === 'unpaidToday' ? 'bg-red-600 text-white' : 'bg-red-50 text-red-700 border-red-200'}`}
                        >
                          {t.unpaid}
                        </button>
                      </div>
                    </div>
                  </div>

                  <div className="relative">
                    <Search size={14} className="absolute left-3 top-3 text-gray-400" />
                    <input
                      type="text"
                      placeholder={t.searchPlaceholder}
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="w-full pl-9 pr-3 py-2 text-xs border border-gray-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-blue-500 bg-white"
                    />
                  </div>

                  <div className="flex flex-wrap gap-2 max-h-36 overflow-y-auto pt-1">
                    {filteredMembersList.length === 0 ? (
                      <p className="text-xs text-gray-400 italic">{t.noMembers}</p>
                    ) : (
                      filteredMembersList.map((m) => {
                        const { isPaidUpToDate, paidRoundsCount } = getMemberRoundStatus(m._id);
                        const isSelected = selectedMember?._id === m._id;

                        return (
                          <button
                            key={m._id}
                            onClick={() => setSelectedMember(isSelected ? null : m)}
                            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-bold transition shadow-sm ${
                              isSelected ? 'ring-2 ring-blue-600 shadow-md' : ''
                            } ${
                              isPaidUpToDate
                                ? 'bg-green-100 text-green-800 border-green-300 hover:bg-green-200'
                                : 'bg-red-100 text-red-800 border-red-300 hover:bg-red-200'
                            }`}
                          >
                            <span className={`w-2 h-2 rounded-full ${isPaidUpToDate ? 'bg-green-600' : 'bg-red-600'}`}></span>
                            {m.name} ({paidRoundsCount} {t.roundsUnit})
                          </button>
                        );
                      })
                    )}
                  </div>
                </div>
              )}

              {(selectedMember || userRole === 'member') && (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4 bg-blue-50/50 p-3.5 rounded-2xl border border-blue-100">
                  <div>
                    <p className="text-[11px] text-gray-500">{t.memberLabel}</p>
                    <p className="font-bold text-gray-800 text-xs">{selectedMember ? selectedMember.name : t.guest}</p>
                  </div>
                  <div>
                    <p className="text-[11px] text-gray-500">{t.paidLabel}</p>
                    <p className="font-bold text-green-600 text-xs">{totalPaid} ETB ({totalPaidRounds} {t.roundsUnit})</p>
                  </div>
                  <div>
                    <p className="text-[11px] text-gray-500">{t.remainingRoundsLabel}</p>
                    <p className="font-bold text-orange-600 text-xs">{remainingRounds} {t.roundsUnit} ({t.fromLabel} {totalRequiredRounds})</p>
                  </div>
                  <div>
                    <p className="text-[11px] text-gray-500">{t.remainingAmountLabel}</p>
                    <p className="font-bold text-red-600 text-xs">{remainingAmount} ETB</p>
                  </div>
                </div>
              )}

              {userRole === 'admin' && !selectedMember ? (
                <div className="text-center py-10 bg-gray-50 rounded-2xl border border-dashed text-gray-500 text-xs">
                  {t.selectPrompt}
                </div>
              ) : (
                <div className="overflow-x-auto border rounded-2xl">
                  <table className="w-full text-left text-sm border-collapse">
                    <thead>
                      <tr className="bg-gray-50 border-b text-gray-700 text-xs">
                        <th className="p-3">{t.roundHeader}</th>
                        <th className="p-3">{t.dateHeader}</th>
                        <th className="p-3">{t.amountHeader}</th>
                        <th className="p-3">{t.methodHeader}</th>
                        <th className="p-3">{t.statusHeader}</th>
                        <th className="p-3">{t.receiptHeader}</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredPayments.length === 0 ? (
                        <tr>
                          <td colSpan={6} className="text-center py-8 text-gray-500 text-xs">
                            {t.noPayments}
                          </td>
                        </tr>
                      ) : (
                        filteredPayments.map((item) => (
                          <tr key={item._id} className="border-b hover:bg-gray-50 text-xs">
                            <td className="p-3 font-bold text-blue-600">
                              {item.roundNumber ? `${t.roundsUnit} ${item.roundNumber}` : '-'}
                            </td>
                            <td className="p-3 text-gray-600">
                              {new Date(item.createdAt).toLocaleDateString()}
                            </td>
                            <td className="p-3 font-bold text-green-600">{item.amount} ETB</td>
                            <td className="p-3 uppercase text-[10px] font-semibold text-gray-500">
                              {item.paymentMethod}
                            </td>
                            <td className="p-3">
                              {item.status === 'approved' && (
                                <span className="flex items-center gap-1 text-green-600 font-medium text-[11px] bg-green-50 px-2 py-0.5 rounded-full w-fit">
                                  <CheckCircle size={12} /> {t.approved}
                                </span>
                              )}
                              {item.status === 'pending' && (
                                <span className="flex items-center gap-1 text-yellow-600 font-medium text-[11px] bg-yellow-50 px-2 py-0.5 rounded-full w-fit">
                                  <Clock size={12} /> {t.pending}
                                </span>
                              )}
                              {item.status === 'rejected' && (
                                <span className="flex items-center gap-1 text-red-600 font-medium text-[11px] bg-red-50 px-2 py-0.5 rounded-full w-fit">
                                  <XCircle size={12} /> {t.rejected}
                                </span>
                              )}
                            </td>
                            <td className="p-3">
                              {item.receiptUrl ? (
                                <a href={item.receiptUrl} target="_blank" rel="noopener noreferrer" className="text-blue-600 underline text-[11px] font-bold">
                                  {t.screenshotLink}
                                </a>
                              ) : (
                                <span className="text-[10px] text-gray-400">Ref: {item.transactionRef || 'N/A'}</span>
                              )}
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default EkubLedgerModal;