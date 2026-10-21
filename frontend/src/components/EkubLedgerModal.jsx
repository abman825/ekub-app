import React, { useState, useEffect } from 'react';
import API from '../services/api';
import { CheckCircle, Clock, XCircle, FileText, User, Gift, Trophy, FileSpreadsheet, Printer, Search, Filter } from 'lucide-react';
import * as XLSX from 'xlsx';
import confetti from 'canvas-confetti';

const EkubLedgerModal = ({ isOpen, onClose, group, userRole }) => {
  const [ledger, setLedger] = useState([]);
  const [selectedMember, setSelectedMember] = useState(null);
  const [loading, setLoading] = useState(true);
  const [currentGroup, setCurrentGroup] = useState(group);
  const [isDrawing, setIsDrawing] = useState(false);
  const [showWinnersHistory, setShowWinnersHistory] = useState(false);

  // 🔍 የፍለጋ እና የማጣሪያ ስንቶች (Search & Filter States)
  const [statusFilter, setStatusFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    if (isOpen && group) {
      fetchLatestGroupData();
      setSelectedMember(null);
      fetchLedger();
    }
  }, [isOpen, group]);

  const fetchLatestGroupData = async () => {
    try {
      const { data } = await API.get(`/ekub/${group._id}`);
      setCurrentGroup(data);
    } catch (err) {
      console.error('የእቁብ መረጃን ማጥመድ አልተቻለም', err);
      setCurrentGroup(group);
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
      console.error('የእቁብ ደፍተርን ማጥመድ አልተቻለም', err);
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

  // አዲስ ሰራሽ አባላትን በስም ማጣሪያ (Filtered Member Buttons for Admin)
  const filteredMembersList = membersList.filter(m => {
    const nameMatches = m.name?.toLowerCase().includes(searchTerm.toLowerCase());
    const phoneMatches = m.phone?.includes(searchTerm);
    return nameMatches || phoneMatches;
  });

  const formatPhoneNumber = (phone) => {
    if (!phone) return '0911****90';
    if (userRole === 'admin') {
      return phone;
    }
    if (phone.length < 8) return phone;
    const start = phone.slice(0, 4);
    const end = phone.slice(-2);
    return `${start}****${end}`;
  };

  const handleDrawLottery = async () => {
    if (membersList.length === 0) {
      return alert('እቁብ ውስጥ አባላት የሉም!');
    }

    setIsDrawing(true);

    setTimeout(async () => {
      try {
        const { data } = await API.post('/ekub/draw-lottery', {
          groupId: currentGroup._id
        });
        if (data.group) {
          setCurrentGroup(data.group);
          
          confetti({
            particleCount: 120,
            spread: 80,
            origin: { y: 0.6 }
          });
        }
      } catch (err) {
        console.error('አሸናፊውን መመዝገብ አልተቻለም', err);
        alert(err.response?.data?.message || 'ዕጣ ማውጣት አልተቻለም');
      } finally {
        setIsDrawing(false);
      }
    }, 1500);
  };

  const handleExportExcel = () => {
    const excelData = filteredPayments.map((item, index) => ({
      'ተረ ቁጥር': index + 1,
      'የአባል ስም': item.member?.name || 'N/A',
      'ስልክ ቁጥር': item.member?.phone || 'N/A',
      'የክፍያ መጠን (ብር)': item.amount,
      'የክፍያ መንገድ': item.paymentMethod,
      'ሁኔታ': item.status === 'approved' ? 'የጸደቀ' : item.status === 'pending' ? 'በመጠባበቅ ላይ' : 'ውድቅ የተደረገ',
      'ቀን': new Date(item.createdAt).toLocaleDateString('et-ET')
    }));

    const worksheet = XLSX.utils.json_to_sheet(excelData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "የክፍያ ደፍተር");
    
    XLSX.writeFile(workbook, `${currentGroup.title}_Ledger_Report.xlsx`);
  };

  const handlePrintReceipt = () => {
    window.print();
  };

  const rawMemberPayments = userRole === 'admin'
    ? (selectedMember ? ledger.filter(item => item.member?._id === selectedMember._id) : [])
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

  // 🔍 ክፍያዎችን በ Status የማጣሪያ ሎጂክ
  const filteredPayments = displayPayments.filter((item) => {
    return statusFilter === 'all' || item.status === statusFilter;
  });

  const totalPaid = rawMemberPayments
    .filter(p => p.status === 'approved')
    .reduce((sum, p) => sum + p.amount, 0);

  const totalPaidRounds = approvedCount;

  const goalAmount = currentGroup.targetGoal && currentGroup.targetGoal > 0 ? currentGroup.targetGoal : 10000;
  const contribution = currentGroup.contributionAmount > 0 ? currentGroup.contributionAmount : 1000;

  const totalRequiredRounds = Math.ceil(goalAmount / contribution);
  const remainingRounds = Math.max(0, totalRequiredRounds - totalPaidRounds);
  const remainingAmount = Math.max(0, goalAmount - totalPaid);

  const winnerObj = currentGroup.latestWinner?.member;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-xl p-6 w-full max-w-3xl max-h-[85vh] overflow-y-auto shadow-2xl">
        
        {/* Header */}
        <div className="flex justify-between items-center border-b pb-4 mb-4 no-print">
          <div>
            <h3 className="text-xl font-bold text-gray-800">የእቁብ ደፍተር - {currentGroup.title}</h3>
            <p className="text-sm text-gray-500">
              {currentGroup.type === 'lottery' ? `🎲 በዕጣ የሚወጣ (በ ር ${currentGroup.drawIntervalDays || 1} ቀናት)` : '🎯 በተቀመጠ ዓማ (Target)'}
            </p>
          </div>
          
          <div className="flex items-center gap-2">
            {userRole === 'admin' && (
              <button
                onClick={handleExportExcel}
                className="flex items-center gap-1 bg-green-600 text-white px-3 py-1.5 rounded-lg text-xs font-semibold hover:bg-green-700 transition"
                title="በኤክሴል ፋይል አውርድ"
              >
                <FileSpreadsheet size={16} /> ኤክሴል
              </button>
            )}
            <button
              onClick={handlePrintReceipt}
              className="flex items-center gap-1 bg-blue-600 text-white px-3 py-1.5 rounded-lg text-xs font-semibold hover:bg-blue-700 transition"
              title="ደረሰኝ አትም / PDF አውርድ"
            >
              <Printer size={16} /> ደረሰኝ / PDF
            </button>
            <button onClick={() => { setSelectedMember(null); onClose(); }} className="text-gray-400 hover:text-gray-600 font-bold text-lg ml-2">✕</button>
          </div>
        </div>

        {/* 🏆 ያለፉ ዕጣ አሸናፊዎች (Collapsible Accordion) */}
{currentGroup?.type === 'lottery' && currentGroup?.winnersHistory && currentGroup.winnersHistory.length > 0 && (
  <div className="mb-4 bg-green-50/60 border border-green-200 rounded-xl overflow-hidden shadow-sm">
    <button
      onClick={() => setShowWinnersHistory(!showWinnersHistory)}
      className="w-full p-3.5 flex justify-between items-center text-left hover:bg-green-100/50 transition font-bold text-green-900 text-sm"
    >
      <span className="flex items-center gap-2">
        🏆 ያለፉ ዕጣ አሸናፊዎች (በቅደም ተከተል) 
        <span className="bg-green-600 text-white text-xs px-2 py-0.5 rounded-full font-normal">
          {currentGroup.winnersHistory.length}
        </span>
      </span>
      <span className="text-gray-500 text-xs">
        {showWinnersHistory ? '▲ Cufi' : '▼ Tarree Banuu'}
      </span>
    </button>

    {showWinnersHistory && (
      <div className="p-4 border-t border-green-200 space-y-2 bg-white max-h-48 overflow-y-auto">
        {currentGroup.winnersHistory.map((winner, index) => {
          const memberInfo = winner.member && typeof winner.member === 'object' ? winner.member : winner;
          const nameToShow = memberInfo.name || memberInfo.phone || 'አባል';
          const phoneToShow = memberInfo.phone ? formatPhoneNumber(memberInfo.phone) : '';

          return (
            <div 
              key={index} 
              className="flex justify-between items-center bg-green-50/30 p-2.5 rounded-lg border border-green-100 text-xs"
            >
              <div className="flex items-center gap-2">
                <span className="bg-green-600 text-white font-bold rounded-full w-5 h-5 flex items-center justify-center text-[10px]">
                  {index + 1}
                </span>
                <span className="font-bold text-gray-800">
                  {nameToShow} {phoneToShow && `(${phoneToShow})`}
                </span>
              </div>
              <span className="text-gray-500 font-medium">
                {winner.wonAt ? new Date(winner.wonAt).toLocaleDateString() : `ዙር ${index + 1}`}
              </span>
            </div>
          );
        })}
      </div>
    )}
  </div>
)}

        <div className="print-area space-y-4">
          {/* Latest Winner Banner */}
          {currentGroup.type === 'lottery' && winnerObj && (
            <div className="mb-4 bg-gradient-to-r from-green-50 to-emerald-100 border-2 border-green-400 p-3 rounded-xl text-center shadow-sm">
              <h3 className="text-sm font-bold text-green-800 flex items-center justify-center gap-2">
                🎉 የቅርብ ጊዜ ዕጣ አሸናፊ አባል! 🎉
              </h3>
              <p className="text-lg font-extrabold text-green-950 mt-1">
                {winnerObj.name || 'አባል'} ({formatPhoneNumber(winnerObj.phone)})
              </p>
            </div>
          )}

          {/* Admin Lottery System Button */}
          {userRole === 'admin' && currentGroup.type === 'lottery' && (
            <div className="mb-4 bg-gradient-to-r from-purple-50 to-indigo-50 p-3 rounded-xl border border-purple-200 flex flex-col sm:flex-row justify-between items-center gap-3 no-print">
              <div>
                <h4 className="font-bold text-purple-900 flex items-center gap-2 text-sm">
                  <Gift size={16} /> የዕጣ ማውጫ ስርዓት
                </h4>
                <p className="text-xs text-purple-700">መደጋገሚያ ጊዜ፡ በ {currentGroup.drawIntervalDays || 1} ቀናት | አባላት፡ {membersList.length}</p>
              </div>

              <button
                onClick={handleDrawLottery}
                disabled={isDrawing}
                className="bg-purple-600 hover:bg-purple-700 text-white font-bold px-4 py-1.5 rounded-lg text-xs shadow transition flex items-center gap-2 disabled:opacity-50"
              >
                {isDrawing ? '🎲 ዕጣ እየወጣ ነው...' : '🎁 አዲስ ዕጣ አውጣ'}
              </button>
            </div>
          )}

          {loading ? (
            <p className="text-center py-8 text-gray-500">መረጃ በመጫን ላይ ነው...</p>
          ) : (
            <div>
              {/* 🔑 ለአድሚን ብቻ የሚታይ የአባል ፍለጋ እና መምረጫ ክፍል */}
              {userRole === 'admin' && (
                <div className="mb-5 bg-gray-50 p-3 rounded-xl border no-print space-y-3">
                  <div className="flex justify-between items-center">
                    <h4 className="text-xs font-bold text-gray-700">የአባል ደፍተር ለማየት አባል ይምረጡ</h4>
                    
                    {/* Status Filter Dropdown */}
                    <div className="flex items-center gap-1.5">
                      <Filter size={13} className="text-gray-500" />
                      <select
                        value={statusFilter}
                        onChange={(e) => setStatusFilter(e.target.value)}
                        className="text-[11px] border border-gray-300 rounded-lg px-2 py-1 bg-white focus:outline-none focus:ring-1 focus:ring-blue-500 font-medium"
                      >
                        <option value="all">ሁሉንም ክፍያዎች</option>
                        <option value="approved">የጸደቀ (Approved)</option>
                        <option value="pending">በመጠባበቅ ላይ (Pending)</option>
                        <option value="rejected">ውድቅ የተደረገ (Rejected)</option>
                      </select>
                    </div>
                  </div>

                  {/* ለአድሚን የአባል ማሻሻያ ሳጥን (Search Input) */}
                  <div className="relative">
                    <Search size={14} className="absolute left-2.5 top-2.5 text-gray-400" />
                    <input
                      type="text"
                      placeholder="አባል በስም ወይም በስልክ ቁጥር ፍለጋ..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="w-full pl-8 pr-3 py-1.5 text-xs border border-gray-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500 bg-white"
                    />
                  </div>

                  {/* በፍለጋው መሰረት የሚወጣ የአባል ቅርንጫፎች */}
                  <div className="flex flex-wrap gap-2 max-h-32 overflow-y-auto">
                    {filteredMembersList.length === 0 ? (
                      <p className="text-xs text-gray-400 italic">ምንም የተፈለገ ዓይነት አባል አልተገኘም።</p>
                    ) : (
                      filteredMembersList.map((m) => (
                        <button
                          key={m._id}
                          onClick={() => setSelectedMember(selectedMember?._id === m._id ? null : m)}
                          className={`flex items-center gap-1 px-2.5 py-1 rounded-lg border text-xs font-medium transition ${
                            selectedMember?._id === m._id 
                              ? 'bg-blue-600 text-white border-blue-600 shadow-sm' 
                              : 'bg-white text-gray-700 border-gray-200 hover:bg-gray-100'
                          }`}
                        >
                          <User size={12} />
                          {m.name}
                        </button>
                      ))
                    )}
                  </div>
                </div>
              )}

              {/* Summary Cards */}
              {(selectedMember || userRole === 'member') && (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4 bg-blue-50/50 p-3 rounded-xl border border-blue-100">
                  <div>
                    <p className="text-[11px] text-gray-500">አባል / Member</p>
                    <p className="font-bold text-gray-800 text-xs">{selectedMember ? selectedMember.name : 'እርስዎ'}</p>
                  </div>
                  <div>
                    <p className="text-[11px] text-gray-500">የተከፈለ (Paid)</p>
                    <p className="font-bold text-green-600 text-xs">{totalPaid} ብር ({totalPaidRounds} ዙር)</p>
                  </div>
                  <div>
                    <p className="text-[11px] text-gray-500">የቀረ ዙር (Remaining)</p>
                    <p className="font-bold text-orange-600 text-xs">{remainingRounds} ዙር (ከ {totalRequiredRounds})</p>
                  </div>
                  <div>
                    <p className="text-[11px] text-gray-500">የቀረ ገንዘብ (Remaining Amount)</p>
                    <p className="font-bold text-red-600 text-xs">{remainingAmount} ብር</p>
                  </div>
                </div>
              )}

              {/* Table */}
              {userRole === 'admin' && !selectedMember ? (
                <div className="text-center py-8 bg-gray-50 rounded-lg border border-dashed text-gray-500 text-xs no-print">
                  👈 እባክዎን የእቁብን አባል ደፍተር ለማየት ከላይ ካሉት አባላት አንዱን ይምረጡ።
                </div>
              ) : (
                <div className="overflow-x-auto border rounded-lg">
                  <table className="w-full text-left text-sm border-collapse">
                    <thead>
                      <tr className="bg-gray-100 border-b text-gray-700 text-xs">
                        <th className="p-2.5">ዙር</th>
                        {userRole === 'admin' && <th className="p-2.5">ተከፋይ አባል</th>}
                        <th className="p-2.5">የተከፈለበት ቀን</th>
                        <th className="p-2.5">መጠን</th>
                        <th className="p-2.5">የክፍያ መንገድ</th>
                        <th className="p-2.5">ሁኔታ</th>
                        <th className="p-2.5 no-print">ደረሰኝ / Ref</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredPayments.length === 0 ? (
                        <tr>
                          <td colSpan={userRole === 'admin' ? 7 : 6} className="text-center py-6 text-gray-500 text-xs">
                            ምንም የተመዘገበ የክፍያ መረጃ የለም።
                          </td>
                        </tr>
                      ) : (
                        filteredPayments.map((item) => (
                          <tr key={item._id} className="border-b hover:bg-gray-50 text-xs">
                            <td className="p-2.5 font-bold text-blue-600">
                              {item.roundNumber ? `ዙር ${item.roundNumber}` : '-'}
                            </td>
                            {userRole === 'admin' && (
                              <td className="p-2.5 font-medium text-gray-800">
                                {item.member?.name} <br />
                                <span className="text-[10px] text-gray-500">{formatPhoneNumber(item.member?.phone)}</span>
                              </td>
                            )}
                            <td className="p-2.5 text-gray-600">
                              {new Date(item.createdAt).toLocaleDateString('et-ET')}
                            </td>
                            <td className="p-2.5 font-bold text-green-600">{item.amount} ብር</td>
                            <td className="p-2.5 uppercase text-[10px] font-semibold text-gray-500">
                              {item.paymentMethod}
                            </td>
                            <td className="p-2.5">
                              {item.status === 'approved' && (
                                <span className="flex items-center gap-1 text-green-600 font-medium text-[11px] bg-green-50 px-2 py-0.5 rounded-full w-fit">
                                  <CheckCircle size={12} /> ተረጋግጧል
                                </span>
                              )}
                              {item.status === 'pending' && (
                                <span className="flex items-center gap-1 text-yellow-600 font-medium text-[11px] bg-yellow-50 px-2 py-0.5 rounded-full w-fit">
                                  <Clock size={12} /> በመጠባበቅ ላይ
                                </span>
                              )}
                              {item.status === 'rejected' && (
                                <span className="flex items-center gap-1 text-red-600 font-medium text-[11px] bg-red-50 px-2 py-0.5 rounded-full w-fit">
                                  <XCircle size={12} /> ውድቅ የተደረገ
                                </span>
                              )}
                            </td>
                            <td className="p-2.5 no-print">
                              {item.receiptUrl ? (
                                <a
                                  href={item.receiptUrl}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="flex items-center gap-1 text-blue-600 hover:underline text-[11px] font-medium"
                                >
                                  <FileText size={12} /> ስክሪንሾት
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