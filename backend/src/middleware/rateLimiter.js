const rateLimit = require('express-rate-limit');

// ለ Login እና Forgot Password የተዘጋጀ ገደብ (በ 15 ደቂቃ ውስጥ ቢበዛ 5 ጊዜ ብቻ መሞከር ይቻላል)
const authLimiter = rateLimit({
  windowMs: 5 * 60 * 1000, // 15 ደቂቃ
  max: 10,
  message: {
    message: 'እጅግ በጣም ብዙ ሙከራ አድርገዋል! እባክዎን ከ5 ደቂቃ በኋላ እንደገና ይሞክሩ።'
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// ለአጠቃላይ API ጥሪዎች የተዘጋጀ ገደብ (በ 15 ደቂቃ ውስጥ 100 ጥሪዎች)
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: {
    message: 'የጥሪ መጠን ገደብ አልፏል፣ እባክዎን ትንሽ ቆይተው ይሞክሩ።'
  }
});

module.exports = { authLimiter, apiLimiter };