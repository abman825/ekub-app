const Contribution = require('../models/Contribution');
const EkubGroup = require('../models/EkubGroup');
const User = require('../models/User');
const axios = require('axios');
const { notifyPaymentApproved } = require('../utils/telegramBot');

// Helper funkce pro kontrolu limitu plateb uživatele
const checkUserLimit = async (userId, ekubGroupId) => {
  const group = await EkubGroup.findById(ekubGroupId);
  if (!group) return false;

  const userContributions = await Contribution.find({
    ekubGroup: ekubGroupId,
    member: userId,
    status: { $in: ['approved', 'pending'] }
  });

  const totalPaid = userContributions.reduce((sum, c) => sum + c.amount, 0);
  const userTargetGoal = group.targetGoal || 10000;

  return totalPaid >= userTargetGoal;
};

// 1. Odeslání potvrzení o platbě (Manual Screenshot Upload)
const submitReceiptPayment = async (req, res) => {
  try {
    const { ekubGroupId, amount, transactionRef } = req.body;
    const receiptUrl = req.file ? (req.file.path || req.file.secure_url) : null;

    if (!receiptUrl && !transactionRef) {
      return res.status(400).json({ message: 'እባክዎን የባንክ ደረሰኝ ወይም የትራንዛክሽን ቁጥር ያስገቡ!' });
    }

    const isFinished = await checkUserLimit(req.user._id, ekubGroupId);
    if (isFinished) {
      return res.status(400).json({ 
        message: 'እርስዎ የዚህን እቁብ ክፍያ ሙሉ በሙሉ አጠናቀዋል። ተጨማሪ ክፍያ መክፈል አይችሉም!' 
      });
    }

    const contribution = await Contribution.create({
      ekubGroup: ekubGroupId,
      member: req.user._id,
      amount: Number(amount),
      paymentMethod: 'receipt',
      receiptUrl: receiptUrl || '',
      transactionRef: transactionRef || '',
      status: 'pending'
    });

    return res.status(201).json({ message: 'የክፍያ ደረሰኙ በስኬት ተልኳል!', contribution }); 
  } catch (error) {
    console.error("UPLOAD ERROR:", error);
    res.status(500).json({ message: error.message });
  }
};

// 2. Získání čekajících plateb pro admina (správné Načtení/Populate jména člena)
const getPendingPayments = async (req, res) => {
  try {
    const contributions = await Contribution.find({ status: 'pending', paymentMethod: 'receipt' })
      .populate('member', 'name phone telegramChatId')
      .populate({
        path: 'ekubGroup',
        select: 'title admin',
        populate: { path: 'admin', select: '_id name' }
      });

    const adminContributions = contributions.filter((c) => {
      if (!c.ekubGroup) return false;
      const adminId = c.ekubGroup.admin?._id || c.ekubGroup.admin;
      return adminId?.toString() === req.user._id.toString();
    });

    res.json(adminContributions);
  } catch (error) {
    console.error("PENDING PAYMENTS ERROR:", error);
    res.status(500).json({ message: error.message });
  }
};

// 3. Inicializace platby přes Chapa Online (የተስተካከለና የጸዳ)
const initializeChapaPayment = async (req, res) => {
  try {
    const { ekubGroupId, amount } = req.body;
    const group = await EkubGroup.findById(ekubGroupId).populate('admin');

    if (!group) {
      return res.status(404).json({ message: 'የተፈለገው እቁብ አልተገኘም!' });
    }

    const isFinished = await checkUserLimit(req.user._id, ekubGroupId);
    if (isFinished) {
      return res.status(400).json({ 
        message: 'እርስዎ የዚህን እቁብ ክፍያ ሙሉ በሙሉ አጠናቀዋል። ተጨማሪ ክፍያ መክፈል አይችሉም!' 
      });
    }

    const chapaKey = group.admin?.chapaSecretKey || process.env.CHAPA_SECRET_KEY;
    if (!chapaKey) {
      return res.status(400).json({ message: 'የዚህ እቁብ አድሚን የ Chapa Secret Key አልሞላም!' });
    }

    const tx_ref = `tx-ekub-${Date.now()}`;
    const userEmail = req.user.email && req.user.email.includes('@') 
      ? req.user.email 
      : `user_${req.user.phone}@gmail.com`;

    // 🔴 በጣም አስፈላጊ: ቻፓ ሊንክ ከመፈጠሩ በፊት ትራንዛክሽኑን በ pending መመዝገብ
    await Contribution.create({
      ekubGroup: ekubGroupId,
      member: req.user._id,
      amount: Number(amount),
      paymentMethod: 'chapa',
      transactionRef: tx_ref,
      status: 'pending'
    });

    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
    const backendUrl = process.env.BACKEND_URL || 'https://ekub-app.onrender.com';

    const response = await axios.post(
      'https://api.chapa.co/v1/transaction/initialize',
      {
        amount: Number(amount).toString(),
        currency: 'ETB',
        email: userEmail,
        first_name: req.user.name || 'Member',
        last_name: 'Ekub',
        tx_ref: tx_ref,
        callback_url: `${backendUrl}/api/payment/chapa-webhook`,
        return_url: `${frontendUrl}/dashboard?tx_ref=${tx_ref}`
      },
      {
        headers: { 
          Authorization: `Bearer ${chapaKey.trim()}`,
          'Content-Type': 'application/json'
        }
      }
    );

    res.status(200).json(response.data);
  } catch (error) {
    console.error("CHAPA INIT ERROR:", error.response?.data || error.message);
    res.status(500).json({ 
      message: 'የ Chapa ክፍያ ማስጨረስ አልተቻለም!', 
      error: error.response?.data || error.message 
    });
  }
};

// 4. Ověření Chapa platby
const verifyChapaPayment = async (req, res) => {
  try {
    const { tx_ref } = req.params;
    let contribution;

    if (tx_ref === 'latest') {
      contribution = await Contribution.findOne({ 
        member: req.user._id, 
        paymentMethod: 'chapa', 
        status: 'pending' 
      }).sort({ createdAt: -1 }).populate('ekubGroup');
    } else {
      contribution = await Contribution.findOne({ transactionRef: tx_ref }).populate('ekubGroup');
    }

    if (!contribution) {
      return res.status(404).json({ message: 'ትራንዛክሽኑ አልተገኘም!' });
    }

    if (contribution.status !== 'approved') {
      contribution.status = 'approved';
      await contribution.save();

      await EkubGroup.findByIdAndUpdate(contribution.ekubGroup._id || contribution.ekubGroup, {
        $inc: { totalCollected: contribution.amount }
      });
    }

    return res.json({ message: 'ክፍያው በአውቶማቲክ ተረጋግጦ ጸድቋል!', contribution });
  } catch (error) {
    console.error('Verify Error:', error);
    res.status(500).json({ message: 'ክፍያውን ማረጋገጥ አልተቻለም' });
  }
};

// 5. Schválení / zamítnutí platby adminem + Telegram notifikace
const approveReceiptPayment = async (req, res) => {
  try {
    const { contributionId, status } = req.body;
    const contribution = await Contribution.findById(contributionId);
    if (!contribution) {
      return res.status(404).json({ message: 'የክፍያ መረጃው አልተገኘም!' });
    }

    if (contribution.status === 'approved') {
      return res.status(400).json({ message: 'ይህ ክፍያ ቀድሞ ጸድቋል!' });
    }

    contribution.status = status;
    await contribution.save();

    if (status === 'approved') {
      await EkubGroup.findByIdAndUpdate(contribution.ekubGroup, {
        $inc: { totalCollected: contribution.amount }
      });

      await contribution.populate('member', 'name phone telegramChatId');
      await contribution.populate('ekubGroup', 'title');

      notifyPaymentApproved(
        contribution.ekubGroup?.title || 'እቁብ',
        contribution.member?.name || 'አባል',
        contribution.amount,
        contribution.member?.telegramChatId
      );
    }

    res.json({ message: `የክፍያ ሁኔታው ወደ ${status} የተቀየረ ሲሆን አባሉም በቴሌግራም ተገልጾለታል!`, contribution });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// 6. Získání historie plateb pro konkrétního člena
const getMemberLedger = async (req, res) => {
  try {
    const { ekubGroupId } = req.params;
    const history = await Contribution.find({
      ekubGroup: ekubGroupId,
      member: req.user._id
    }).sort({ createdAt: -1 });

    res.json(history);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// 7. Získání přehledu plateb skupiny pro admina
const getGroupLedgerForAdmin = async (req, res) => {
  try {
    const { ekubGroupId } = req.params;
    const contributions = await Contribution.find({ ekubGroup: ekubGroupId })
      .populate('member', 'name phone telegramChatId')
      .sort({ createdAt: -1 });

    res.json(contributions);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  submitReceiptPayment,
  initializeChapaPayment,
  verifyChapaPayment,
  approveReceiptPayment,
  getPendingPayments,
  getMemberLedger,
  getGroupLedgerForAdmin
};