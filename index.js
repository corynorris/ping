const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const escapeHtml = require('escape-html');
const helmet = require('helmet');
const cors = require('cors');
const rateLimit = require('express-rate-limit');

const app = express();
const server = http.createServer(app);
const io = socketIo(server);

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
});

const crypto = require('crypto');


app.use(helmet());
app.use(express.json()); // Parse JSON request body
app.use(express.urlencoded({ extended: true })); // Parse URL-encoded request body
app.use(cors());
app.use('/ping', limiter);
app.use((req, res, next) => {
  const nonce = crypto.randomBytes(16).toString('base64'); 
    res.setHeader(
    'Content-Security-Policy',
    `default-src 'self'; script-src 'self' 'nonce-${nonce}'; style-src 'self' 'nonce-${nonce}';`
    );
  res.locals.nonce = nonce; // Make nonce available to your templates
  return next();
});

app.set('view engine', 'ejs');


const MAX_MESSAGES = 50;
let messages = [];

app.get('/', (req, res) => {
  res.render('index.ejs');
});

app.all('/ping', (req, res) => {
  let message;

  if (req.method === 'POST') {
    message = req.body.message;
  } else if (req.method === 'GET') {
    message = req.query.message;
  }

  if (message) {
    // Limit message to 100 characters
    message = message.substring(0, 100);

    // Escape malicious content
    const escapedMessage = escapeHtml(message);

    // Add message to the list with timestamp and IP address
    const timestamp = new Date();
    const ip = req.ip;
    messages.push({ message: escapedMessage, timestamp, ip });

    // Keep only the last 50 messages
    if (messages.length > MAX_MESSAGES) {
      messages = messages.slice(messages.length - MAX_MESSAGES);
    }

    io.emit('ping', { message: escapedMessage, timestamp, ip });

    res.sendStatus(200);
  } else {
    res.sendStatus(400); // Bad request if no message provided
  }
});

io.on('connection', (socket) => {
  console.log('A user connected');

  // Send the last 50 messages to the client on connection
  socket.emit('init', messages);

  // Send IP address and timestamp to the client on connection
  const ip = socket.handshake.address;
  const timestamp = new Date();
  socket.emit('connectionInfo', { ip, timestamp });

  socket.on('disconnect', () => {
    console.log('User disconnected');
  });

  socket.on('ping', (message) => {
    const escapedMessage = escapeHtml(message);

    // Add message to the list with timestamp and IP address
    const timestamp = new Date();
    const ip = socket.handshake.address;
    messages.push({ message: escapedMessage, timestamp, ip });

    // Keep only the last 50 messages
    if (messages.length > MAX_MESSAGES) {
      messages = messages.slice(messages.length - MAX_MESSAGES);
    }

    io.emit('ping', { message: escapedMessage, timestamp, ip });
  });
});

const port = process.env.PORT || 3000;

server.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});