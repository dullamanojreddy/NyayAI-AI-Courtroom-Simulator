require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { EventEmitter } = require('events');
const connectDB = require('./config/db');
const authMiddleware = require('./middleware/auth');
const { getUserSessions, getSessionById } = require('./controllers/courtroomController');

const app = express();
const appEvents = new EventEmitter();

app.use(cors({ origin: process.env.CLIENT_URL || 'http://localhost:3000' }));
app.use(express.json());

connectDB();

app.use((req, res, next) => {
  appEvents.emit('api:hit', { method: req.method, path: req.path });
  next();
});

appEvents.on('api:hit', (payload) => {
  if (!payload.path.startsWith('/api/health')) {
    console.log(`[EVENT] ${payload.method} ${payload.path}`);
  }
});

setInterval(() => {
  console.log(`[TIMER] API heartbeat ${new Date().toISOString()}`);
}, 60000);

app.get('/api/health', (req, res) => {
  res.json({
    ok: true,
    service: 'nyay-ai-court-node-api',
    protocol: 'HTTP',
    port: Number(process.env.PORT || 5000)
  });
});

app.use('/api/auth', require('./routes/auth'));
app.use('/api/classify', require('./routes/classify'));
app.use('/api/courtroom', require('./routes/courtroom'));
app.use('/api/schemes', require('./routes/schemes'));
app.use('/api/laws', require('./routes/laws'));

app.get('/api/sessions/:userId', authMiddleware, getUserSessions);
app.get('/api/session/:sessionId', authMiddleware, getSessionById);

app.use((req, res) => {
  res.status(404).json({ message: 'Route not found' });
});

app.use((err, req, res, next) => {
  console.error(err);
  res.status(err.status || 500).json({ message: err.message || 'Internal server error' });
});

const PORT = Number(process.env.PORT || 5000);
app.listen(PORT, () => {
  console.log(`NyayAI server running on port ${PORT}`);
});
