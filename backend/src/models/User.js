const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  phone: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  role: { type: String, enum: ['admin', 'member'], default: 'member' },
  
  // Chapa ላላቸው Adminዎች
  chapaSecretKey: { type: String, default: null }, 
  
  telegramChatId: { type: String, default: '' },
  isVerified: { type: Boolean, default: false },
  verificationCode: { type: String, default: null },
  // Chapa ለሌላቸው Adminዎች (የባንክ ሂሳብ መረጃ)
  bankDetails: {
    bankName: { type: String, default: '' },
    accountNumber: { type: String, default: '' },
    accountHolderName: { type: String, default: '' }
  }
}, { timestamps: true });

module.exports = mongoose.model('User', userSchema);