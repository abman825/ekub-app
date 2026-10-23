const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const dotenv = require('dotenv');
const cors = require('cors');

// Database, Bot, Cron & Error Middleware
const connectDB = require('./src/config/db');
require('./src/utils/telegramBot');
const startCronJobs = require('./src/utils/cronScheduler');
const errorHandler = require('./src/middleware/errorHandler');

dotenv.config();
connectDB();

const app = express();
const server = http.createServer(app);

// CORS የሚፈቀድላቸው ኦሪጂኖች (Allowed Origins)
const allowedOrigins = [
  "https://ekub-app-beta.vercel.app", 
  "http://localhost:5173",
  "http://localhost:3000"
];

// Express CORS Setup
app.use(cors({
  origin: allowedOrigins,
  methods: ["GET", "POST", "PUT", "DELETE"],
  credentials: true
}));

// Socket.io Setup
const io = new Server(server, {
  cors: {
    origin: allowedOrigins,
    methods: ["GET", "POST", "PUT", "DELETE"],
    credentials: true
  },
  transports: ['polling', 'websocket'],
  allowEIO3: true
});

app.use(express.json());

// req.io ለሁሉም ሩቶች እንዲደርስ ማድረግ
app.use((req, res, next) => {
  req.io = io;
  next();
});

// Socket.io ኢቨንቶች (Events)
io.on('connection', (socket) => {
  console.log('⚡ Client connected via Socket:', socket.id);

  // ተጠቃሚው ወደ ተወሰነ የእቁብ ሩም (Room) እንዲቀላቀል ማድረግ
  socket.on('join_group', (groupId) => {
    if (groupId) {
      socket.join(groupId.toString());
      console.log(`👤 Socket ${socket.id} joined group: ${groupId}`);
    }
  });

  socket.on('disconnect', () => {
    console.log('❌ Client disconnected:', socket.id);
  });
});

// ሩቶች (Routes)
app.use('/api/auth', require('./src/routes/authRoutes'));
app.use('/api/ekub', require('./src/routes/ekubRoutes'));
app.use('/api/payment', require('./src/routes/paymentRoutes'));

app.get('/', (req, res) => {
  res.send('Ekub Backend API is running with Socket.io...');
});

// የኤረር ሚድልዌር
app.use(errorHandler);

// Cron Jobs ማስጀመር
startCronJobs();

// ሰርቨሩን ማስነሳት
const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`🚀 Server running with Socket.io on port ${PORT}`);
});