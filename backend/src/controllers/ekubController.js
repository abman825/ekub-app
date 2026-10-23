const EkubGroup = require('../models/EkubGroup');
const User = require('../models/User');
const Contribution = require('../models/Contribution');
const { notifyLotteryWinner } = require('../utils/telegramBot');

// 1. አዲስ የእቁብ ቡድን መመስረት (Admin Only)
const createEkubGroup = async (req, res) => {
  try {
    const { title, type, contributionAmount, targetGoal, frequency, drawIntervalDays, drawDay } = req.body;

    const ekubGroup = await EkubGroup.create({
      title,
      type,
      contributionAmount,
      targetGoal: Number(targetGoal || 0),
      frequency: frequency || 'daily',
      drawDay: frequency === 'weekly' ? Number(drawDay || 1) : 1,
      drawIntervalDays: type === 'lottery' ? Number(drawIntervalDays || 1) : 1,
      admin: req.user._id,
      members: []
    });

    res.status(201).json(ekubGroup);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// 2. የእቁብ ቡድኖችን ማግኘት
const getEkubGroups = async (req, res) => {
  try {
    let groups;

    if (req.user.role === 'admin') {
      groups = await EkubGroup.find({ admin: req.user._id })
        .populate('admin', 'name phone bankDetails chapaSecretKey')
        .populate('members', 'name phone telegramChatId');
    } else {
      groups = await EkubGroup.find({ members: req.user._id })
        .populate('admin', 'name phone bankDetails chapaSecretKey')
        .populate('members', 'name phone telegramChatId');
    }

    res.json(groups);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// 3. አንድ የእቁብ ቡድን ዝርዝር ማግኘት
const getEkubGroupById = async (req, res) => {
  try {
    const group = await EkubGroup.findById(req.params.id)
      .populate('admin', 'name phone bankDetails chapaSecretKey')
      .populate('members', 'name phone telegramChatId')
      .populate('latestWinner.member', 'name phone telegramChatId')
      .populate('winnersHistory.member', 'name phone telegramChatId');

    if (!group) {
      return res.status(404).json({ message: 'የተፈለገው እቁብ አልተገኘም!' });
    }

    const contributions = await Contribution.find({
      ekubGroup: group._id,
      status: 'approved'
    });

    const memberPaidCounts = {};
    group.members.forEach(m => {
      const memberContribs = contributions.filter(c => c.member?.toString() === m._id.toString());
      memberPaidCounts[m._id.toString()] = memberContribs.length;
    });

    const currentMaxRound = Math.max(0, ...Object.values(memberPaidCounts));

    res.json({
      ...group.toObject(),
      memberPaidCounts,
      currentMaxRound
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// 4. አዲስ አባል በስልክ ቁጥር መጨመር
const addMemberToGroup = async (req, res) => {
  try {
    const { groupId } = req.params;
    const { phone } = req.body;

    const group = await EkubGroup.findById(groupId);
    if (!group) {
      return res.status(404).json({ message: 'እቁብ አልተገኘም!' });
    }

    let member = await User.findOne({ phone });
    if (!member) {
      return res.status(404).json({ message: 'ይህ ስልክ ቁጥር ያለው አባል ሰርቨር ላይ አልተመዘገበም!' });
    }

    if (group.members.includes(member._id)) {
      return res.status(400).json({ message: 'ይህ አባል ቀድሞ በዚህ እቁብ ውስጥ አለ!' });
    }

    group.members.push(member._id);
    await group.save();

    res.json({ message: 'አባል በስኬት ወደ እቁብ ተጨምሯል!', group });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// 5. እጣ ማውጣት (Admin Only) + Socket + Telegram
const drawLotteryWinner = async (req, res) => {
  try {
    const { groupId } = req.body;

    const group = await EkubGroup.findById(groupId).populate('members', 'name phone telegramChatId');
    if (!group) {
      return res.status(404).json({ message: 'እቁብ አልተገኘም!' });
    }

    if (group.latestWinner && group.latestWinner.wonAt) {
      const lastWonDate = new Date(group.latestWinner.wonAt);
      const today = new Date();
      
      const diffInTime = today.getTime() - lastWonDate.getTime();
      const diffInDays = Math.floor(diffInTime / (1000 * 3600 * 24));

      const requiredInterval = group.type === 'lottery' ? (group.drawIntervalDays || 1) : 1;

      if (diffInDays < requiredInterval) {
        const remainingDays = requiredInterval - diffInDays;
        return res.status(400).json({ 
          message: `የዚህ ዙር እጣ ተወጥቷል! የሚቀጥለው እጣ ከ ${remainingDays} ቀን በኋላ ማውጣት ይቻላል።` 
        });
      }
    }

    if (!group.members || group.members.length === 0) {
      return res.status(400).json({ message: 'እቁብ ውስጥ አባላት የሉም!' });
    }

    const adminId = group.admin?.toString();
    const activeMembers = group.members.filter(m => m._id.toString() !== adminId);

    if (activeMembers.length === 0) {
      return res.status(400).json({ message: 'ከአስተዳዳሪ ውጭ ሌላ አባል የለም!' });
    }

    if (group.latestWinner && group.latestWinner.member) {
      const alreadyInHistory = group.winnersHistory.some(
        w => w.member?.toString() === group.latestWinner.member?.toString() &&
             new Date(w.wonAt).getTime() === new Date(group.latestWinner.wonAt).getTime()
      );
      if (!alreadyInHistory) {
        group.winnersHistory.push(group.latestWinner);
      }
    }

    const previousWinnerIds = group.winnersHistory.map(w => w.member?._id?.toString() || w.member?.toString());
    if (group.latestWinner?.member) {
      previousWinnerIds.push(group.latestWinner.member._id?.toString() || group.latestWinner.member?.toString());
    }
    
    let eligibleMembers = activeMembers.filter(m => !previousWinnerIds.includes(m._id.toString()));
    
    if (eligibleMembers.length === 0) {
      group.winnersHistory = [];
      eligibleMembers = activeMembers;
    }

    const randomIndex = Math.floor(Math.random() * eligibleMembers.length);
    const selectedWinner = eligibleMembers[randomIndex];

    group.latestWinner = {
      member: selectedWinner._id,
      wonAt: new Date()
    };

    await group.save();

    const currentRound = (group.winnersHistory ? group.winnersHistory.length : 0) + 1;

    notifyLotteryWinner(
      group.title,
      selectedWinner.name || 'አባል',
      selectedWinner.phone || 'N/A',
      currentRound,
      selectedWinner.telegramChatId
    );

    const updatedGroup = await EkubGroup.findById(groupId)
      .populate('admin', 'name phone bankDetails chapaSecretKey')
      .populate('members', 'name phone telegramChatId')
      .populate('latestWinner.member', 'name phone telegramChatId')
      .populate('winnersHistory.member', 'name phone telegramChatId');

    // ⚡ Real-time Socket Event: ለእቁቡ Room እና ለሁሉም አሳውቅ
    if (req.io) {
      req.io.to(groupId.toString()).emit('lottery_drawn', {
        groupId: group._id,
        winner: selectedWinner
      });
      req.io.emit('lottery_drawn', {
        groupId: group._id,
        winner: selectedWinner
      });
    }

    res.json({ message: 'የእጣ አሸናፊው በስኬት ተመዝግቧል!', group: updatedGroup });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// 6. የእቁብ ደፍተር ማግኘት
const getMemberLedger = async (req, res) => {
  try {
    const { ekubId } = req.params;
    const contributions = await Contribution.find({
      ekubGroup: ekubId,
      member: req.user._id,
      status: 'approved'
    }).sort({ createdAt: -1 });

    res.json(contributions);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  createEkubGroup,
  getEkubGroups,
  getEkubGroupById,
  addMemberToGroup,
  drawLotteryWinner,
  getMemberLedger
};