import React from 'react';
import { X, Wallet, Loader2 } from 'lucide-react';
import EkubLedgerModal from './EkubLedgerModal';

export const CreateGroupModal = ({
  show,
  onClose,
  onSubmit,
  t,
  title,
  setTitle,
  type,
  setType,
  contributionAmount,
  setContributionAmount,
  targetGoal,
  setTargetGoal,
  drawIntervalDays,
  setDrawIntervalDays,
  frequency,
  setFrequency,
  drawDay,
  setDrawDay
}) => {
  if (!show) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-3xl p-6 w-full max-w-md max-h-[90vh] overflow-y-auto shadow-2xl">
        <h3 className="text-lg font-black text-gray-900 mb-4">{t.createNewGroup}</h3>
        <form onSubmit={onSubmit} className="space-y-4">
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
            <button type="button" onClick={onClose} className="w-1/2 border border-gray-200 py-2.5 rounded-xl font-bold text-xs text-gray-600 hover:bg-gray-50">{t.cancel}</button>
            <button type="submit" className="w-1/2 bg-blue-600 hover:bg-blue-700 text-white py-2.5 rounded-xl font-bold text-xs shadow-md">{t.create}</button>
          </div>
        </form>
      </div>
    </div>
  );
};

export const AddMemberModal = ({ show, selectedGroup, onClose, onSubmit, memberPhone, setMemberPhone, t }) => {
  if (!show || !selectedGroup) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-3xl p-6 w-full max-w-md shadow-2xl">
        <h3 className="text-lg font-black text-gray-900 mb-1">{t.addMemberPhone}</h3>
        <p className="text-xs text-gray-400 mb-4">{selectedGroup.title}</p>
        
        <form onSubmit={onSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-gray-700">Phone Number</label>
            <input type="text" required className="w-full border border-gray-200 p-2.5 rounded-xl text-xs mt-1 bg-gray-50/50" value={memberPhone} onChange={e => setMemberPhone(e.target.value)} placeholder={t.phonePlaceholder} />
          </div>

          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="w-1/2 border border-gray-200 py-2.5 rounded-xl font-bold text-xs text-gray-600 hover:bg-gray-50">{t.cancel}</button>
            <button type="submit" className="w-1/2 bg-indigo-600 hover:bg-indigo-700 text-white py-2.5 rounded-xl font-bold text-xs shadow-md">{t.save}</button>
          </div>
        </form>
      </div>
    </div>
  );
};

export const MakePaymentModal = ({
  show,
  selectedGroup,
  onClose,
  onSubmit,
  t,
  paymentMethod,
  setPaymentMethod,
  txRef,
  setTxRef,
  setReceiptFile,
  isSubmittingPayment
}) => {
  if (!show || !selectedGroup) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-3xl p-6 w-full max-w-md max-h-[90vh] overflow-y-auto shadow-2xl">
        <h3 className="text-lg font-black text-gray-900 mb-1">{t.makePayment}</h3>
        <p className="text-xs text-gray-400 mb-3">{selectedGroup.title} መጠን: 
          <span className="font-bold text-blue-600"> {selectedGroup.contributionAmount} ETB</span>
        </p>

        {selectedGroup?.admin?.bankDetails && (
          <div className="bg-blue-50/80 p-3.5 rounded-2xl border border-blue-200 mb-4 text-xs space-y-2.5">
            <p className="font-bold text-blue-950 flex items-center gap-1">
              🏦 ክፍያ የሚፈጸምባቸው የአድሚን ሂሳቦች:
            </p>

            <div className="grid grid-cols-1 gap-2">
              <div className="bg-white p-2.5 rounded-xl border border-blue-100 shadow-sm">
                <p className="font-bold text-blue-800 text-[11px] mb-0.5">🏛️ የባንክ ስም: {selectedGroup.admin.bankDetails.bankName || 'CBE'}</p>
                <p className="text-gray-500 text-[10px]">ሂሳብ ቁጥር: <span className="font-extrabold text-blue-900 text-xs">{selectedGroup.admin.bankDetails.bankAccountNumber || 'N/A'}</span></p>
                <p className="text-gray-500 text-[10px]">የስም ባለቤት: <span className="font-semibold text-gray-800">{selectedGroup.admin.bankDetails.bankAccountName || selectedGroup.admin.name}</span></p>
              </div>

              <div className="bg-white p-2.5 rounded-xl border border-blue-100 shadow-sm">
                <p className="font-bold text-green-700 text-[11px] mb-0.5">📱 Telebirr (ቴሌብር)</p>
                <p className="text-gray-500 text-[10px]">ስልክ ቁጥር: <span className="font-extrabold text-green-900 text-xs">{selectedGroup.admin.bankDetails.telebirrPhone || 'N/A'}</span></p>
                <p className="text-gray-500 text-[10px]">የስም ባለቤት: <span className="font-semibold text-gray-800">{selectedGroup.admin.bankDetails.telebirrName || selectedGroup.admin.name}</span></p>
              </div>
            </div>
          </div>
        )}

        <form onSubmit={onSubmit} className="space-y-4">
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
            <button type="button" onClick={onClose} className="w-1/2 border border-gray-200 py-2.5 rounded-xl font-bold text-xs text-gray-600 hover:bg-gray-50">{t.cancel}</button>
            <button type="submit" disabled={isSubmittingPayment} className="w-1/2 bg-emerald-600 hover:bg-emerald-700 text-white py-2.5 rounded-xl font-bold text-xs shadow-md flex items-center justify-center gap-2">
              {isSubmittingPayment ? <Loader2 className="animate-spin" size={16} /> : <Wallet size={16} />}
              {isSubmittingPayment ? t.submitting : t.submitPayment}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export const ImagePreviewModal = ({ previewImage, onClose }) => {
  if (!previewImage) return null;

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 z-50" onClick={onClose}>
      <div className="relative max-w-4xl max-h-[90vh]">
        <img src={previewImage} alt="Receipt Preview" className="max-w-full max-h-[85vh] rounded-2xl object-contain shadow-2xl border border-white/10" />
        <button onClick={onClose} className="absolute -top-4 -right-4 bg-white text-black p-2 rounded-full shadow-lg font-bold">
          <X size={20} />
        </button>
      </div>
    </div>
  );
};