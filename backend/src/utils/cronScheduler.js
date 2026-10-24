const cron = require('node-cron');
const EkubGroup = require('../models/EkubGroup');
const { sendTelegramMessage } = require('./telegramBot');

const startCronJobs = () => {
  // 1. Tabuh 4:00 Énjing (04:00 AM) - Cron: '0 4 * * *'
  // 2. Tabuh 4:00 Sonten (04:00 PM / 16:00) - Cron: '0 16 * * *'
  
  const cronTimes = ['50 4 * * *', '50 16 * * *'];

  cronTimes.forEach((cronTime) => {
    cron.schedule(cronTime, async () => {
      console.log(`⏰ Panginget énjing/sonten keur dikirimkeun... (${cronTime})`);

      try {
        const activeGroups = await EkubGroup.find({}).populate('members', 'name telegramChatId');
        const today = new Date().getDay(); // 0 = Minggu, 1 = Senén, jsb.

        for (const group of activeGroups) {
          if (!group.members || group.members.length === 0) continue;

          // 1. Pikeun Ékub Poéan (Daily)
          if (group.frequency === 'daily') {
            const message = `🔔 *Panginget Mayar Ékub!* 🔔\n\n` +
              `📌 *Ékub:* ${group.title}\n` +
              `💰 *Jumlah Pisan Poé Ieu:* ${group.contributionAmount} Birr\n\n` +
              `Mangga laksanakeun pamayaran ékub dinten ieu sareng kirimkeun resi anjeun! Nuhun!`;

            for (const member of group.members) {
              if (member.telegramChatId) {
                await sendTelegramMessage(member.telegramChatId, message);
              }
            }
          }

          // 2. Pikeun Ékub Mingguan (Weekly) - Dina poé anu ditangtukeun (drawDay == today)
          if (group.frequency === 'weekly' && group.drawDay === today) {
            const message = `📅 *Panginget Mayar Ékub Mingguan!* 📅\n\n` +
              `📌 *Ékub:* ${group.title}\n` +
              `💰 *Jumlah Pisan Mingguan:* ${group.contributionAmount} Birr\n\n` +
              `Mangga laksanakeun pamayaran ékub mingguan dina waktosna! Nuhun!`;

            for (const member of group.members) {
              if (member.telegramChatId) {
                await sendTelegramMessage(member.telegramChatId, message);
              }
            }
          }
        }
        console.log(`✅ Panginget tabuh ${cronTime} parantos suksés dikirimkeun!`);
      } catch (error) {
        console.error('Cron Job Error:', error.message);
      }
    }, {
      scheduled: true,
      timezone: "Africa/Addis_Ababa" // Zona waktu Étiopia
    });
  });

  console.log('⏰ Jadwal Panginget Sapopoé (Énjing & Sonten) Parantos Dimimitian!');
};

module.exports = startCronJobs;