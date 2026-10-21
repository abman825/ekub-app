import React, { useState } from 'react';
import API from '../services/api';

const PaymentModal = ({ isOpen, onClose, selectedGroup, onPaySuccess }) => {
  const [paymentMethod, setPaymentMethod] = useState('receipt');
  const [receiptFile, setReceiptFile] = useState(null);
  const [txRef, setTxRef] = useState('');
  const [loading, setLoading] = useState(false);

  if (!isOpen || !selectedGroup) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (paymentMethod === 'chapa') {
      try {
        const { data } = await API.post('/payment/chapa-init', {
          ekubGroupId: selectedGroup._id,
          amount: selectedGroup.contributionAmount
        });
        window.location.href = data.checkout_url;
      } catch (err) {
        alert(err.response?.data?.message || 'የ Chapa ክፍያ መስመር አልተቻለም');
      }
    } else {
      if (!receiptFile) {
        return alert('እባክዎን የደረሰኝ ምስል (Screenshot) ይምረጡ!');
      }

      setLoading(true);

      // Memasukkan file gambar ke FormData
      const formData = new FormData();
      formData.append('receipt', receiptFile); // Kunci 'receipt' harus sama persis dengan backend
      formData.append('ekubGroupId', selectedGroup._id);
      formData.append('amount', selectedGroup.contributionAmount);
      if (txRef) formData.append('transactionRef', txRef);

      try {
        await API.post('/payment/upload-receipt', formData, {
          headers: {
            'Content-Type': 'multipart/form-data'
          }
        });

        alert('የባንክ ደረሰኝ በስኬት ተልኳል!');
        setReceiptFile(null);
        setTxRef('');
        onClose();
        if (onPaySuccess) onPaySuccess();
      } catch (err) {
        alert(err.response?.data?.message || 'ደረሰኝ መላክ አልተቻለም');
      } finally {
        setLoading(false);
      }
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-xl p-6 w-full max-w-md shadow-xl">
        <h3 className="text-xl font-bold mb-2">ክፍያ መፈጸሚያ - {selectedGroup.title}</h3>
        <p className="text-sm text-gray-600 mb-4">
          የክፍያ መጠን፦ <span className="font-bold text-green-600">{selectedGroup.contributionAmount} ብር</span>
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">የክፍያ መንገድ ይምረጡ</label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setPaymentMethod('receipt')}
                className={`p-2.5 border rounded-lg text-sm font-medium transition ${
                  paymentMethod === 'receipt'
                    ? 'border-blue-600 bg-blue-50 text-blue-700'
                    : 'border-gray-200 hover:bg-gray-50'
                }`}
              >
                የባንክ ደረሰኝ (Screenshot)
              </button>
              <button
                type="button"
                onClick={() => setPaymentMethod('chapa')}
                className={`p-2.5 border rounded-lg text-sm font-medium transition ${
                  paymentMethod === 'chapa'
                    ? 'border-blue-600 bg-blue-50 text-blue-700'
                    : 'border-gray-200 hover:bg-gray-50'
                }`}
              >
                Chapa Online
              </button>
            </div>
          </div>

          {paymentMethod === 'receipt' ? (
            <div className="space-y-3 bg-gray-50 p-3 rounded-lg border">
              <p className="text-xs text-gray-600">
                የአስተዳዳሪው የባንክ መረጃ፦ <br />
                <span className="font-semibold">{selectedGroup.admin?.bankDetails?.bankName || 'CBE'}</span>: {selectedGroup.admin?.bankDetails?.accountNumber || '1000xxxxxxxx'}
              </p>
              <div>
                <label className="block text-xs font-medium text-gray-700">የደረሰኝ ምስል (Screenshot) ይምረጡ</label>
                <input
                  type="file"
                  accept="image/*"
                  required
                  onChange={(e) => setReceiptFile(e.target.files[0])}
                  className="mt-1 text-xs w-full bg-white p-1 border rounded"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700">የግብይት ቁጥር (Ref Number - አማራጭ)</label>
                <input
                  type="text"
                  className="w-full border p-1.5 rounded text-xs bg-white mt-1"
                  value={txRef}
                  onChange={(e) => setTxRef(e.target.value)}
                  placeholder="FT24xxx"
                />
              </div>
            </div>
          ) : (
            <p className="text-xs text-gray-500 bg-blue-50 p-3 rounded border border-blue-200">
              'ክፍያ ፈጽም' የሚለውን ሲጫኑ በቀጥታ ወደ Chapa ደህንነቱ የተጠበቀ የክፍያ ገጽ ይወሰዳሉ።
            </p>
          )}

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="w-1/2 border py-2 rounded-lg text-sm font-medium hover:bg-gray-50"
            >
              ሰርዝ
            </button>
            <button
              type="submit"
              disabled={loading}
              className="w-1/2 bg-emerald-600 text-white py-2 rounded-lg text-sm font-medium hover:bg-emerald-700 disabled:opacity-50"
            >
              {loading ? 'በመላክ ላይ...' : 'ክፍያ ፈጽም'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default PaymentModal;