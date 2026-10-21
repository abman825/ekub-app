const mongoose = require('mongoose');

const contributionSchema = new mongoose.Schema({
  ekubGroup: { type: mongoose.Schema.Types.ObjectId, ref: 'EkubGroup', required: true },
  member: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  amount: { type: Number, required: true },

  paymentMethod: { type: String, enum: ['chapa', 'receipt'], required: true },

  chapaTxRef: { type: String, default: null },
  receiptUrl: { type: String, default: null }, // <--- Ekhane receiptUrl koredin
  transactionRef: { type: String, default: null },

  status: { type: String, enum: ['pending', 'approved', 'rejected'], default: 'pending' }
}, { timestamps: true });

module.exports = mongoose.model('Contribution', contributionSchema);