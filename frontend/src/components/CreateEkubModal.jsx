import React, { useState } from 'react';

const CreateEkubModal = ({ isOpen, onClose, onCreate }) => {
  const [title, setTitle] = useState('');
  const [type, setType] = useState('target');
  const [contributionAmount, setContributionAmount] = useState('');
  const [targetGoal, setTargetGoal] = useState('');
  const [drawIntervalDays, setDrawIntervalDays] = useState(1);
  const [frequency, setFrequency] = useState('daily');
  const [drawDay, setDrawDay] = useState(1); // 1 = ሰኞ (Monday)

  if (!isOpen) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    onCreate({
      title,
      type,
      contributionAmount: Number(contributionAmount),
      targetGoal: Number(targetGoal), // ለሁለቱም የእቁብ ዓይነቶች targetGoal ይላካል
      drawIntervalDays: type === 'lottery' ? Number(drawIntervalDays) : 1,
      frequency,
      drawDay: frequency === 'weekly' ? Number(drawDay) : 1
    });

    setTitle('');
    setContributionAmount('');
    setTargetGoal('');
    setDrawIntervalDays(1);
    setFrequency('daily');
    setDrawDay(1);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-xl p-6 w-full max-w-md shadow-lg max-h-[90vh] overflow-y-auto">
        <h3 className="text-xl font-bold mb-4 text-gray-800">አዲስ የእቁብ ቡድን ማቋቋሚያ</h3>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* የእቁብ ስም */}
          <div>
            <label className="block text-sm font-medium text-gray-700">የእቁብ ስም</label>
            <input
              type="text"
              required
              className="w-full border border-gray-300 p-2 rounded-lg mt-1 focus:ring-blue-500 focus:border-blue-500"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="የ 10,000 ብር እቁብ"
            />
          </div>

          {/* የእቁብ ዓይነት */}
          <div>
            <label className="block text-sm font-medium text-gray-700">የእቁብ ዓይነት</label>
            <select
              className="w-full border border-gray-300 p-2 rounded-lg mt-1"
              value={type}
              onChange={(e) => setType(e.target.value)}
            >
              <option value="target">በተቀመጠ ግብ (Target Goal)</option>
              <option value="lottery">በዕጣ የሚወጣ (Lottery)</option>
            </select>
          </div>

          {/* የአንድ ዙር ክፍያ መጠን */}
          <div>
            <label className="block text-sm font-medium text-gray-700">የአንድ ዙር ክፍያ መጠን (ብር)</label>
            <input
              type="number"
              required
              className="w-full border border-gray-300 p-2 rounded-lg mt-1"
              value={contributionAmount}
              onChange={(e) => setContributionAmount(e.target.value)}
              placeholder="200"
            />
          </div>

          {/* ጠቅላላ የገንዘብ ግብ / የዕጣ መጠን (ለሁለቱም ይታያል) */}
          <div>
            <label className="block text-sm font-medium text-gray-700">
              {type === 'target' ? 'የመጨረሻ ግብ (Target Goal Amount)' : 'ጠቅላላ የዕጣ መጠን (Total Lottery Amount)'}
            </label>
            <input
              type="number"
              required
              className="w-full border border-gray-300 p-2 rounded-lg mt-1"
              value={targetGoal}
              onChange={(e) => setTargetGoal(e.target.value)}
              placeholder="10000"
            />
          </div>

          {/* በዕጣ ከሆነ የዕጣ መውጫ ቀን interval */}
          {type === 'lottery' && (
            <div>
              <label className="block text-sm font-medium text-blue-700">ዕጣው በስንት ቀን ይውጣ? (የቀን ብዛት)</label>
              <select
                className="w-full border border-gray-300 p-2 rounded-lg mt-1 bg-blue-50 font-semibold"
                value={drawIntervalDays}
                onChange={(e) => setDrawIntervalDays(Number(e.target.value))}
              >
                <option value={1}>በየ 1 ቀኑ (በቀን)</option>
                <option value={3}>በየ 3 ቀኑ</option>
                <option value={7}>በየ 7 ቀኑ (ሳምንታዊ)</option>
                <option value={15}>በየ 15 ቀኑ</option>
                <option value={30}>በየ 30 ቀኑ (ወርሃዊ)</option>
              </select>
            </div>
          )}

          {/* የክፍያ ድግግሞሽ */}
          <div>
            <label className="block text-sm font-medium text-gray-700">የክፍያ ድግግሞሽ</label>
            <select
              className="w-full border border-gray-300 p-2 rounded-lg mt-1"
              value={frequency}
              onChange={(e) => setFrequency(e.target.value)}
            >
              <option value="daily">በቀን (Daily)</option>
              <option value="weekly">በየሳምንቱ (Weekly)</option>
            </select>
          </div>

          {/* በየሳምንቱ ከሆነ የሚሰበሰብበትን ቀን መምረጫ */}
          {frequency === 'weekly' && (
            <div className="bg-blue-50 p-3 rounded-lg border border-blue-200">
              <label className="block text-sm font-medium text-blue-900 mb-1">
                ክፍያው የሚሰበሰብበትን ቀን ይምረጡ፦
              </label>
              <select
                className="w-full border border-blue-300 p-2 rounded-lg bg-white focus:ring-blue-500"
                value={drawDay}
                onChange={(e) => setDrawDay(Number(e.target.value))}
              >
                <option value={1}>ሰኞ (Monday)</option>
                <option value={2}>ማክሰኞ (Tuesday)</option>
                <option value={3}>ረቡዕ (Wednesday)</option>
                <option value={4}>ሐሙስ (Thursday)</option>
                <option value={5}>አርብ (Friday)</option>
                <option value={6}>ቅዳሜ (Saturday)</option>
                <option value={0}>እሁድ (Sunday)</option>
              </select>
            </div>
          )}

          {/* Buttons */}
          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="w-1/2 border border-gray-300 py-2 rounded-lg text-gray-700 hover:bg-gray-50"
            >
              ሰርዝ
            </button>
            <button
              type="submit"
              className="w-1/2 bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 font-medium"
            >
              ፍጥር
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreateEkubModal;