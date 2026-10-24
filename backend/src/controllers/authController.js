const User = require('../models/User');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { generateOTP, sendVerificationCode } = require('../utils/telegramBot');

// 1. ምዝገባ (Register) - ከነ ያልተረጋገጠ አካውንት ማስተካከያ (Unverified Re-OTP Handling) ጋር
const register = async (req, res) => {
  try {
    const { 
      name, phone, password, role, chapaSecretKey, 
      bankDetails, telebirrPhone, telebirrName, telegramChatId 
    } = req.body;

    // የስልክ ቁጥር ጥራት ማረጋገጫ (10 ዲጂት - 09 ወይም 07)
    const cleanPhone = phone ? phone.trim() : '';
    if (!/^(09|07)\d{8}$/.test(cleanPhone)) {
      return res.status(400).json({ 
        message: 'እባክዎን ትክክለኛ 10 ዲጂት የስልክ ቁጥር ያስገቡ (ምሳሌ፡ 0911223344)!' 
      });
    }

    const existingUser = await User.findOne({ phone: cleanPhone });

    // 🔴 1.1. ቁጥሩ ከዚህ ቀደም አለ AND ተረጋግጧል (isVerified: true) -> ስህተት አሳይ
    if (existingUser && existingUser.isVerified) {
      return res.status(400).json({ message: 'ይህ የስልክ ቁጥር ቀድሞ ተመዝግቧል! እባክዎ በ Login ገፅ ይግቡ።' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const otpCode = generateOTP();

    // 🟡 1.2. ቁጥሩ አለ KINTU አልተረጋገጠም (ቀደም ብሎ OTP ሳይገባ ወጥቷል) -> መረጃውን አድስና አዲስ OTP ላክ
    if (existingUser && !existingUser.isVerified) {
      existingUser.name = name;
      existingUser.password = hashedPassword;
      existingUser.role = role || 'member';
      existingUser.telegramChatId = telegramChatId || existingUser.telegramChatId;
      existingUser.verificationCode = otpCode; // አዲስ OTP ማዘጋጀት

      await existingUser.save();

      // አዲስ OTP ወደ ቴሌግራም መላክ
      if (existingUser.role !== 'admin' && existingUser.telegramChatId) {
        await sendVerificationCode(existingUser.telegramChatId, otpCode);
      }

      return res.status(200).json({
        message: 'ቀደም ሲል የተመዘገበ ግን ያልተረጋገጠ አካውንት! አዲስ OTP ወደ ቴሌግራም ተልኳል።',
        requiresVerification: true,
        phone: existingUser.phone
      });
    }

    // 🟢 1.3. ሙሉ በሙሉ አዲስ ዩዘር ከሆነ -> በዳታቤዝ ውስጥ መመዝገብ
    const userData = {
      name,
      phone: cleanPhone,
      password: hashedPassword,
      role: role || 'member',
      telegramChatId: telegramChatId || '',
      verificationCode: otpCode,
      isVerified: false
    };

    // አድሚን ከሆነ የባንክ፣ የቴሌብር እና የ Chapa መረጃዎችን መያዝ
    if (role === 'admin') {
      userData.chapaSecretKey = chapaSecretKey || null;
      userData.bankDetails = {
        bankName: bankDetails?.bankName || 'CBE',
        bankAccountNumber: bankDetails?.bankAccountNumber || bankDetails?.accountNumber || '',
        bankAccountName: bankDetails?.bankAccountName || bankDetails?.accountHolderName || name,
        telebirrPhone: telebirrPhone || bankDetails?.telebirrPhone || '',
        telebirrName: telebirrName || bankDetails?.telebirrName || name
      };
      userData.isVerified = true; // አድሚን በቀጥታ ይፀድቃል
    }

    const user = await User.create(userData);

    // ለአባል በቴሌግራም OTP መላክ
    if (role !== 'admin' && telegramChatId) {
      await sendVerificationCode(telegramChatId, otpCode);
    }

    // JWT Token ማዘጋጀት
    const token = jwt.sign(
      { id: user._id, role: user.role },
      process.env.JWT_SECRET || 'fallback_secret_key_123',
      { expiresIn: '30d' }
    );

    res.status(201).json({
      message: 'ምዝገባው ተጠናቋል!',
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
      message: 'መለያው በስኬት ተረጋግጧል!',
      isVerified: true
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// 3. መግቢያ (Login) - OTP ሳያረጋግጥ አባል መግባት አይችልም
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

    // 🛑 OTP ሳያረጋግጥ አባል ማለፍ አይችልም (አድሚን ካልሆነ በቀር)
    if (user.role !== 'admin' && !user.isVerified) {
      return res.status(403).json({ 
        message: 'አካውንቱ አልተረጋገጠም! እባክዎን በቴሌግራም የተላከውን የ OTP ማረጋገጫ ኮድ ያስገቡ።',
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
      return res.status(400).json({ message: 'የተጠቃሚው ቴሌግራም ቻት አዲ አልተገኘም!' });
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

// 6. 🔑 Reset Password - OTP አረጋግጦ አዲስ ፓስወርድ ማስተካከል
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

// 7. Update User Profile (የተጠቃሚ መረጃ ማስተካከያ)
const updateUserProfile = async (req, res) => {
  try {
    const userId = req.user.id; // ከ Token የሚገኘው የባለቤቱ ID
    const { 
      name, phone, oldPassword, password, 
      bankName, bankAccountNumber, bankAccountName, 
      telebirrPhone, telebirrName, chapaSecretKey 
    } = req.body;

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: 'ተጠቃሚው አልተገኘም!' });
    }

    if (name) user.name = name;
    if (phone) user.phone = phone;

    // አዲስ የይለፍ ቃል (Password) ሲቀየር የድሮውን ማረጋገጥ
    if (password && password.trim() !== '') {
      if (!oldPassword) {
        return res.status(400).json({ message: 'እባክዎ የአሁኑን የይለፍ ቃል ያስገቡ!' });
      }
      const isMatch = await bcrypt.compare(oldPassword, user.password);
      if (!isMatch) {
        return res.status(400).json({ message: 'የተሳሳተ የድሮ የይለፍ ቃል አስገብተዋል!' });
      }
      const salt = await bcrypt.genSalt(10);
      user.password = await bcrypt.hash(password, salt);
    }

    // አድሚን ከሆነ የባንክ እና የቴሌብር መረጃዎችን ማስተካከል
    if (user.role === 'admin') {
      if (chapaSecretKey !== undefined) user.chapaSecretKey = chapaSecretKey;
      
      user.bankDetails = {
        bankName: bankName || user.bankDetails?.bankName,
        bankAccountNumber: bankAccountNumber || user.bankDetails?.bankAccountNumber,
        bankAccountName: bankAccountName || user.bankDetails?.bankAccountName,
        telebirrPhone: telebirrPhone || user.bankDetails?.telebirrPhone,
        telebirrName: telebirrName || user.bankDetails?.telebirrName
      };
    }

    const updatedUser = await user.save();

    res.status(200).json({
      message: 'ፕሮፋይልዎ በስኬት ተስተካክሏል!',
      user: {
        _id: updatedUser._id,
        name: updatedUser.name,
        phone: updatedUser.phone,
        role: updatedUser.role,
        bankDetails: updatedUser.bankDetails,
        telegramChatId: updatedUser.telegramChatId,
        chapaSecretKey: updatedUser.chapaSecretKey
      }
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// EXPORT ALL FUNCTIONS
module.exports = {
  register,
  verifyOTP,
  login,
  getMe,
  forgotPassword,
  resetPassword,
  updateUserProfile
};