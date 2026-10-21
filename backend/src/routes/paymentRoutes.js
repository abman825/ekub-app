const express = require('express');
const router = express.Router();
const { protect, adminOnly } = require('../middleware/authMiddleware');
const upload = require('../middleware/uploadMiddleware');
const {
  submitReceiptPayment,
  initializeChapaPayment,
  verifyChapaPayment,
  approveReceiptPayment,
  getPendingPayments,
  getMemberLedger,
  getGroupLedgerForAdmin
} = require('../controllers/paymentController');

// 1. የክፍያ ደብተሮች ማየቻ
router.get('/ledger/member/:ekubGroupId', protect, getMemberLedger);
router.get('/ledger/admin/:ekubGroupId', protect, adminOnly, getGroupLedgerForAdmin);

// 2. Pending ክፍያዎች (ለአድሚን)
router.get('/pending', protect, adminOnly, getPendingPayments);

// 3. ክፍያ መፈጸሚያ (ስክሪንሾት ወይም ሪፈረንስ upload)
router.post('/submit', protect, upload.single('receipt'), submitReceiptPayment);
router.post('/upload-receipt', protect, upload.single('receipt'), submitReceiptPayment);

// 4. Chapa Online Payment ራውቶች
router.post('/chapa-init', protect, initializeChapaPayment);
router.get('/chapa-verify/:tx_ref', protect, verifyChapaPayment);     // tx_ref ተብሎ እንዲቀየር
router.get('/chapa-verify/latest', protect, verifyChapaPayment);

// 5. ክፍያ ማጽደቂያ እና ውድቅ ማድረጊያ (Admin Only)
router.put('/approve-receipt', protect, adminOnly, approveReceiptPayment);
router.put('/approve/:paymentId', protect, adminOnly, approveReceiptPayment);
router.put('/reject/:paymentId', protect, adminOnly, (req, res) => {
  req.body.status = 'rejected';
  return approveReceiptPayment(req, res);
});

module.exports = router;