const cron = require('node-cron');
const EkubGroup = require('../models/EkubGroup');
const { sendTelegramMessage } = require('./telegramBot');

const startCronJobs = () => {
  // በየዕለቱ ጠዋት 2:00 ሰዓት (8:00 AM) ላይ ይሰራል
  cron.schedule('* * * * *', async () => {
    console.log('⏰ የዕለታዊ እና ሳምንታዊ እቁብ ማስታወሻዎች እየተላኩ ነው...');

    try {
      const activeGroups = await EkubGroup.find({}).populate('members', 'name telegramChatId');
      const today = new Date().getDay(); // 0 = እሁድ, 1 = ሰኞ, ..., 6 = ቅዳሜ

      for (const group of activeGroups) {
        if (!group.members || group.members.length === 0) continue;

        // 1. በየዕለቱ ለሚሰበሰብ እቁብ (Daily)
        if (group.frequency === 'daily') {
          const message = `🔔 *የእቁብ ክፍያ ማስታወሻ!* 🔔\n\n` +
            `📌 *እቁብ፦* ${group.title}\n` +
            `💰 *የዕለት ክፍያ መጠን፦* ${group.contributionAmount} ብር\n\n` +
            `እባክዎን የዕለቱን የእቁብ ክፍያ በጊዜ በመፈጸም ደረሰኝዎን ይላኩ! እናመሰግናለን።`;

          for (const member of group.members) {
            if (member.telegramChatId) {
              await sendTelegramMessage(member.telegramChatId, message);
            }
          }
        }

        // 2. በሳምንቱ ለሚሰበሰብ እቁብ (Weekly) - አድሚኑ በመረጠበት የሳምንት ቀን ብቻ (ማለትም drawDay == today)
        if (group.frequency === 'weekly' && group.drawDay === today) {
          const message = `📅 *የሳምንታዊ እቁብ ክፍያ ማስታወሻ!* 📅\n\n` +
            `📌 *እቁብ፦* ${group.title}\n` +
            `💰 *የሳምንቱ ክፍያ መጠን፦* ${group.contributionAmount} ብር\n\n` +
            `እባክዎን የሳምንቱን የእቁብ ክፍያ በጊዜ ይላኩ! እናመሰግናለን።`;

          for (const member of group.members) {
            if (member.telegramChatId) {
              await sendTelegramMessage(member.telegramChatId, message);
            }
          }
        }
      }
      console.log('✅ ማስታወሻዎች በተሳካ ሁኔታ ተልከዋል!');
    } catch (error) {
      console.error('Cron Job Error:', error.message);
    }
  });

  console.log('⏰ Automated Reminders Scheduler Started Successfully!');
};

module.exports = startCronJobs;