const axios = require('axios');

// Sækjum token úr .env í hvert skipti eða við köll
const getToken = () => process.env.TELEGRAM_TOKEN;

// 1. Búa til 6 stafa OTP kóða
const generateOTP = () => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

// 2. Senda skilaboð með Axios
const sendTelegramMessage = async (targetChatId, message) => {
  try {
    const token = getToken();
    if (!token || !targetChatId) return;
    
    const url = `https://api.telegram.org/bot${token}/sendMessage`;
    await axios.post(url, {
      chat_id: targetChatId,
      text: message,
      parse_mode: 'Markdown'
    });
  } catch (error) {
    console.error('Telegram Send Error:', error.response?.data?.description || error.message);
  }
};

// 3. Athuga með uppfærslur (/start) með Polling
const checkUpdates = async () => {
  let lastUpdateId = 0;
  
  setInterval(async () => {
    try {
      const token = getToken();
      if (!token) return;

      const response = await axios.get(`https://api.telegram.org/bot${token}/getUpdates`, {
        params: { offset: lastUpdateId + 1, timeout: 10 }
      });

      const updates = response.data.result;
      if (updates && updates.length > 0) {
        for (const update of updates) {
          lastUpdateId = update.update_id;
          if (update.message && update.message.text === '/start') {
            const chatId = update.message.chat.id;
            const welcomeMessage = `🎉 *እንኳን ወደ እቁብ ሲስተም ቴሌግራም ቦት በሰላም መጡ!* 🎉\n\n` +
              `👤 *የእርስዎ የቴሌግራም Chat ID ይህ ነው፦*\n` +
              `👉 \`${chatId}\`\n\n` +
              `📋 *ይህንን ቁጥር (Chat ID) ኮፒ በማድረግ በአፕሊኬሽኑ የምዝገባ ገጽ ላይ በማስገባት መለያዎን ማረጋገጥ ይችላሉ!*`;
            
            await sendTelegramMessage(chatId, welcomeMessage);
          }
        }
      }
    } catch (err) {
      // Ignora villur til að stöðva ekki þjóninn
    }
  }, 3000);
};

// Ræsa bot þjónustuna
setTimeout(() => {
  if (getToken()) {
    checkUpdates();
    console.log('🤖 Telegram Bot Service Started Successfully!');
  } else {
    console.log('⚠️ TELEGRAM_TOKEN finnst ekki í .env skránni!');
  }
}, 1000);

// 4. Senda OTP staðfestingarkóða
const sendVerificationCode = async (userChatId, code) => {
  const message = `🔑 *የእቁብ ሲስተም ማረጋገጫ ኮድ (OTP)*\n\n` +
    `የእርስዎ ማረጋገጫ ኮድ፦ *${code}*\n\n` +
    `እባክዎን ይህንን ኮድ በአፕሊኬሽኑ ላይ በማስገባት ምዝገባዎን ያጠናቅቁ!`;
  
  if (userChatId) {
    await sendTelegramMessage(userChatId, message);
  }
};

// 5. Tilkynning um happdrættisvinningshafa
const notifyLotteryWinner = async (groupTitle, winnerName, winnerPhone, roundNumber, winnerChatId) => {
  const message = `🎉 *የዕጣ አሸናፊ ማስታወቂያ!* 🎉\n\n` +
    `📌 *እቁብ፦* ${groupTitle}\n` +
    `🏆 *የዙር ${roundNumber} አሸናፊ፦* ${winnerName}\n` +
    `📞 *ስልክ፦* ${winnerPhone}\n\n` +
    `እንኳን ደስ አለዎት! 👏✨`;

  if (winnerChatId) {
    await sendTelegramMessage(winnerChatId, message);
  }
};

// 6. Tilkynning um samþykkta greiðslu
const notifyPaymentApproved = async (groupTitle, memberName, amount, memberChatId) => {
  const message = `✅ *የክፍያ ማረጋገጫ!*\n\n` +
    `👤 *አባል፦* ${memberName}\n` +
    `📌 *እቁብ፦* ${groupTitle}\n` +
    `💰 *የተከፈለ መጠን፦* ${amount} ብር\n\n` +
    `ክፍያዎ በስኬት ተረጋግጧል! አመሰግናለሁ።`;

  if (memberChatId) {
    await sendTelegramMessage(memberChatId, message);
  }
};

module.exports = {
  generateOTP,
  sendVerificationCode,
  notifyLotteryWinner,
  notifyPaymentApproved,
  sendTelegramMessage
};