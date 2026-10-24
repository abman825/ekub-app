const cron = require('node-cron');
const EkubGroup = require('../models/EkubGroup');
const { sendTelegramMessage } = require('./telegramBot');

const startCronJobs = () => {
  // 🇪🇹 በየቀኑ ጠዋት 10:15 AM (በኢትዮጵያ ሰዓት አቆጣጠር) ላይ እንዲሠራ timezone ተጨምሯል
  cron.schedule('58 16 * * *', async () => {
    console.log('⏰ የዕለታዊ እና ሳምንታዊ እቁብ ማስታወሻዎች እየተላኩ ነው...');

    try {
      const activeGroups = await EkubGroup.find({}).populate('members', 'name telegramChatId');
      const today = new Date().getDay(); // 0 = እሁድ, 1 = ሰኞ, ..., 6 = ቅዳሜ

      for (const group of activeGroups) {
        if (!group.members || group.members.length === 0) continue;

        // 1. በዕለቱ ለሚሰበሰብ እቁብ (Daily)
        if (group.frequency === 'daily') {
          const message = `🔔 *የእቁብ ክፍያ ማስታወሻ!* 🔔\n\n` +
            `📌 *እቁብ፦* ${group.title}\n` +
            `💰 *የዕለቱ ክፍያ መጠን፦* ${group.contributionAmount} ብር\n\n` +
            `እባክዎ የዕለቱን የእቁብ ክፍያ በጊዜ በመፈጸም ደረሰኝዎን ይላኩ! እናመሰግናለን!`;

          for (const member of group.members) {
            if (member.telegramChatId) {
              await sendTelegramMessage(member.telegramChatId, message);
            }
          }
        }

        // 2. በሳምንቱ ለሚሰበሰብ እቁብ (Weekly) - አዲስ በመረጠው የሳምንቱ ቀን ብቻ (ማለትም drawDay == today)
        if (group.frequency === 'weekly' && group.drawDay === today) {
          const message = `📅 *የሳምንቱ እቁብ ክፍያ ማስታወሻ!* 📅\n\n` +
            `📌 *እቁብ፦* ${group.title}\n` +
            `💰 *የሳምንቱ ክፍያ መጠን፦* ${group.contributionAmount} ብር\n\n` +
            `እባክዎ ሳምንታዊውን የእቁብ ክፍያ በጊዜ ይክፈሉ! እናመሰግናለን!`;

          for (const member of group.members) {
            if (member.telegramChatId) {
              await sendTelegramMessage(member.telegramChatId, message);
            }
          }
        }
      }
      console.log('✅ ማስታወሻዎች በስኬት ተልለዋል!');
    } catch (error) {
      console.error('Cron Job Error:', error.message);
    }
  }, {
    scheduled: true,
    timezone: "Africa/Addis_Ababa" // 👈 የኢትዮጵያ ሰዓት አቆጣጠርን በትክክል እንዲይዝ ያደርገዋል
  });

  console.log('⏰ Automated Reminders Scheduler Started Successfully!');
};

module.exports = startCronJobs;