const express = require('express');
const router = express.Router();
const { protect, adminOnly } = require('../middleware/authMiddleware');
const { 
  createEkubGroup, 
  getEkubGroups, 
  getEkubGroupById, 
  addMemberToGroup, 
  getMemberLedger, 
  drawLotteryWinner // <--- እዚህ ጋር መካተት አለበት
} = require('../controllers/ekubController');

router.get('/', protect, getEkubGroups);
router.get('/:id', protect, getEkubGroupById);
router.get('/:ekubId/ledger', protect, getMemberLedger);

// Admin ብቻ 
router.post('/', protect, adminOnly, createEkubGroup);
router.post('/:groupId/add-member', protect, adminOnly, addMemberToGroup);
router.post('/draw-lottery', protect, adminOnly, drawLotteryWinner);

module.exports = router;