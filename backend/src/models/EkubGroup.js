const mongoose = require('mongoose');

const ekubGroupSchema = new mongoose.Schema({
  title: { type: String, required: true },
  type: { type: String, required: true }, // 'lottery' or 'target'
  contributionAmount: { type: Number, required: true },
  targetGoal: { type: Number, default: 0 },
  frequency: { type: String, enum: ['daily', 'weekly', 'monthly'], default: 'daily' },


 totalCollected: { type: Number, default: 0 },
 
  drawDay: { type: Number, default: 1 }, 
  
  drawIntervalDays: { type: Number, default: 1 },
  admin: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  members: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  latestWinner: {
    member: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    wonAt: { type: Date }
  },
  winnersHistory: [{
    member: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    wonAt: { type: Date }
  }]
}, { timestamps: true });

module.exports = mongoose.model('EkubGroup', ekubGroupSchema);