const express = require('express');
const dotenv = require('dotenv');
const cors = require('cors');
const connectDB = require('./src/config/db');
require('./src/utils/telegramBot');
const startCronJobs = require('./src/utils/cronScheduler');
const errorHandler = require('./src/middleware/errorHandler');

dotenv.config();
connectDB();

const app = express();

app.use(cors());
app.use(express.json());

// Routes
app.use('/api/auth', require('./src/routes/authRoutes'));
app.use('/api/ekub', require('./src/routes/ekubRoutes'));
app.use('/api/payment', require('./src/routes/paymentRoutes'));

app.get('/', (req, res) => {
  res.send('Ekub Backend API is running...');
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);

startCronJobs();
app.use(errorHandler);

});