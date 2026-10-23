const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');
const { 
  register, 
  verifyOTP, 
  login, 
  getMe, 
  forgotPassword, 
  resetPassword,
  updateUserProfile // እዚህ ጋር ተጨምሯል
} = require('../controllers/authController');
const { protect } = require('../middleware/authMiddleware');
const { authLimiter } = require('../middleware/rateLimiter');

// Error filter middleware
const validate = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ message: errors.array()[0].msg });
  }
  next();
};

// Phone Regex: 10 digit (09... woyim 07...) bicha
const phoneRegex = /^(09|07)\d{8}$/;

// 1. Register Validation
router.post(
  '/register',
  [
    body('name').notEmpty().withMessage('Ebakwon simwon yasgebom'),
    body('phone')
      .matches(phoneRegex)
      .withMessage('Ebakwon tikkikilagnya 10 digit yesilk kuter yasgebom (mesal: 0911223344)'),
    body('password').isLength({ min: 6 }).withMessage('Yepassword kuter biyans 6 mdehon alebet'),
    validate
  ],
  register
);

// 2. Login Validation
router.post(
  '/login',
  authLimiter,
  [
    body('phone')
      .matches(phoneRegex)
      .withMessage('Ebakwon tikkikilagnya 10 digit yesilk kuter yasgebom'),
    body('password').notEmpty().withMessage('Password yasfeligal'),
    validate
  ],
  login
);

// 3. Forgot Password Validation
router.post(
  '/forgot-password',
  authLimiter,
  [
    body('phone')
      .matches(phoneRegex)
      .withMessage('Ebakwon tikkikilagnya 10 digit yesilk kuter yasgebom'),
    validate
  ],
  forgotPassword
);

// 4. Reset Password Validation
router.post(
  '/reset-password',
  [
    body('phone')
      .matches(phoneRegex)
      .withMessage('Ebakwon tikkikilagnya 10 digit yesilk kuter yasgebom'),
    body('otp').notEmpty().withMessage('OTP code yasfeligal'),
    body('newPassword').isLength({ min: 6 }).withMessage('Addisu password biyans 6 mdehon alebet'),
    validate
  ],
  resetPassword
);

router.put('/profile', protect, updateUserProfile);
router.post('/verify-otp', verifyOTP);
router.get('/me', protect, getMe);

module.exports = router;