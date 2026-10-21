const User = require('../models/User');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { generateOTP, sendVerificationCode } = require('../utils/telegramBot');

// 1. ምዝገባ (Register) - OTP በቴሌግራም ይላካል
const register = async (req, res) => {
  try {
    const { name, phone, password, role, chapaSecretKey, bankDetails, telegramChatId } = req.body;

    // Silk kuter length check (Exactly 10 digits)
    const cleanPhone = phone ? phone.trim() : '';
    if (!/^(09|07)\d{8}$/.test(cleanPhone)) {
      return res.status(400).json({ message: 'Ebakwon tikkikilagnya 10 digit yesilk kuter yasgebom (mesal: 0911223344)!' });
    }

    const existingUser = await User.findOne({ phone: cleanPhone });
    if (existingUser) {
      return res.status(400).json({ message: 'Eyi silk kuter kedmo temezgibual!' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const otpCode = generateOTP();

    const userData = {
      name,
      phone,
      password: hashedPassword,
      role: role || 'member',
      telegramChatId: telegramChatId || '',
      verificationCode: otpCode,
      isVerified: false
    };

    if (role === 'admin') {
      userData.chapaSecretKey = chapaSecretKey || null;
      userData.bankDetails = {
        bankName: bankDetails?.bankName || '',
        accountNumber: bankDetails?.accountNumber || '',
        accountHolderName: bankDetails?.accountHolderName || name
      };
      userData.isVerified = true; // አድሚን በቅጽበት ይጸድቃል
    }

    const user = await User.create(userData);

    // ለአባል በቴሌግራም OTP መላክ
    if (role !== 'admin' && telegramChatId) {
      await sendVerificationCode(telegramChatId, otpCode);
    }

    const token = jwt.sign(
      { id: user._id, role: user.role },
      process.env.JWT_SECRET || 'fallback_secret_key_123',
      { expiresIn: '30d' }
    );

    res.status(201).json({
      message: 'ምዝገባው ተጠናቀዋል! እባክዎን በቴሌግራም የተላኩልትን ማረጋገጫ ኮድ አስገብተው ይለዩዋቸው።',
      token,
      user: {
        _id: user._id,
        name: user.name,
        phone: user.phone,
        role: user.role,
        isVerified: user.isVerified,
        bankDetails: user.bankDetails
      }
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// 2. የ OTP ማረጋገጫ (Verify OTP)
const verifyOTP = async (req, res) => {
  try {
    const { phone, code } = req.body;

    const user = await User.findOne({ phone });
    if (!user) {
      return res.status(404).json({ message: 'ተጠቃሚው አልተገኘም!' });
    }

    if (user.verificationCode !== code) {
      return res.status(400).json({ message: 'የስህተት ኮድ ነው! እባክዎን እንደገና ይሞክሩ።' });
    }

    user.isVerified = true;
    user.verificationCode = null;
    await user.save();

    res.json({
      message: 'መለያዎ በስኬት ተረጋግጧል!',
      isVerified: true
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// 3. መግቢያ (Login) - OTP ያልረጋገጠ አባል መግባት አይችልም
const login = async (req, res) => {
  try {
    const { phone, password } = req.body;

    const user = await User.findOne({ phone });
    if (!user) {
      return res.status(400).json({ message: 'ስልክ ቁጥር ወይም የይለፍ ቃል ስህተት ነው!' });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: 'ስልክ ቁጥር ወይም የይለፍ ቃል ስህተት ነው!' });
    }

    // 🛑 እዚህ ጋር OTP ያልረጋገጠ አባል መሆኑን እንፈትሻለን (አድሚን ካልሆነ በስተቀር)
    if (user.role !== 'admin' && !user.isVerified) {
      return res.status(403).json({ 
        message: 'አካውንትዎ አልተረጋገጠም! እባክዎን በቴሌግራም የተላከላቸውን የ OTP ማረጋገጫ ኮድ ያስገቡ።',
        requiresVerification: true,
        phone: user.phone
      });
    }

    const token = jwt.sign(
      { id: user._id, role: user.role },
      process.env.JWT_SECRET || 'fallback_secret_key_123',
      { expiresIn: '30d' }
    );

    res.json({
      token,
      user: {
        _id: user._id,
        name: user.name,
        phone: user.phone,
        role: user.role,
        isVerified: user.isVerified,
        bankDetails: user.bankDetails
      }
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// 4. Get Current User Profile
const getMe = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('-password');
    res.json(user);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// 5. 🔑 Forgot Password - OTP በቴሌግራም መላክ
const forgotPassword = async (req, res) => {
  try {
    const { phone } = req.body;
    const user = await User.findOne({ phone });
    if (!user) {
      return res.status(404).json({ message: 'ይህ ስልክ ቁጥር አልተመዘገበም!' });
    }

    if (!user.telegramChatId) {
      return res.status(400).json({ message: 'የተጠቃሚው ቴሌግራም ቻት መለያ አልተገናኘም!' });
    }

    const otpCode = generateOTP();
    user.verificationCode = otpCode;
    await user.save();

    await sendVerificationCode(user.telegramChatId, otpCode);
    res.json({ message: 'የይለፍ ቃል ማረጋገጫ OTP ኮድ በቴሌግራም ተልኳል!' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// 6. 🔑 Reset Password - OTP አረጋግጦ አዲስ ፓስወርድ መቀየር
const resetPassword = async (req, res) => {
  try {
    const { phone, otp, newPassword } = req.body;
    const user = await User.findOne({ phone });
    if (!user) {
      return res.status(404).json({ message: 'ተጠቃሚው አልተገኘም!' });
    }

    if (user.verificationCode !== otp) {
      return res.status(400).json({ message: 'የተሳሳተ ወይም ጊዜው ያለፈበት OTP ኮድ ነው!' });
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);
    user.password = hashedPassword;
    user.verificationCode = null; // ኮዱን ባዶ እናደርገዋለን
    await user.save();

    res.json({ message: 'የይለፍ ቃልዎ በስኬት ተቀይሯል! አሁን መግባት ይችላሉ።' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  register,
  verifyOTP,
  login,
  getMe,
  forgotPassword,
  resetPassword
};