const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const dotenv = require('dotenv');
const cors = require('cors');
const connectDB = require('./src/config/db');
require('./src/utils/telegramBot');
const startCronJobs = require('./src/utils/cronScheduler');
const errorHandler = require('./src/middleware/errorHandler');

dotenv.config();
connectDB();

const app = express();
const server = http.createServer(app);

// Agordo de Socket.io
const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST", "PUT", "DELETE"],
    credentials: true
  },
  transports: ['websocket', 'polling']
});

// Middleware
app.use(cors());
app.use(express.json());

// Transdoni req.io al ĉiuj itineroj
app.use((req, res, next) => {
  req.io = io;
  next();
});

// Okazaĵoj de Socket.io
io.on('connection', (socket) => {
  console.log('⚡ Uzanto konektita per Socket:', socket.id);

  // Permesi al uzanto aliĝi al specifa grupo (Room)
  socket.on('join_group', (groupId) => {
    if (groupId) {
      socket.join(groupId.toString());
      console.log(`👤 Socket ${socket.id} aliĝis al la grupo: ${groupId}`);
    }
  });

  socket.on('disconnect', () => {
    console.log('❌ Uzanto malkonektita');
  });
});

// Itineroj (Routes)
app.use('/api/auth', require('./src/routes/authRoutes'));
app.use('/api/ekub', require('./src/routes/ekubRoutes'));
app.use('/api/payment', require('./src/routes/paymentRoutes'));

app.get('/', (req, res) => {
  res.send('Ekub Backend API funkcias kun Socket.io...');
});

// Middleware por eraroj
app.use(errorHandler);

// Komenci Cron Jobs
startCronJobs();

// Lansigi la servilon
const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`Servilo funkcias kun Socket.io sur la pordo ${PORT}`);
});