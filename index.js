const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const helmet = require('helmet');
const cors = require('cors');
const rateLimit = require('express-rate-limit');
const crypto = require('crypto');
const cron = require('node-cron');

const app = express();
const server = http.createServer(app);
const io = socketIo(server);

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
});

let messages = [];
const MAX_MESSAGE_LENGTH = 2048;
const MAX_MESSAGES = 10;
const MAX_MESSAGE_AGE = 1000 * 60 * 60 * 4; // 4 hours
const port = process.env.PORT || 3000;


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
  res.locals.nonce = nonce; 
  res.locals.MAX_MESSAGE_LENGTH = MAX_MESSAGE_LENGTH;
  res.locals.MAX_MESSAGES = MAX_MESSAGES;
  
  return next();
});

app.set('view engine', 'ejs');

function addMessage( method, message, ip, debug = {}) {
  const timestamp = new Date();
  const escapedMessage = message.substring(0, MAX_MESSAGE_LENGTH);

  const newMessage = {timestamp, method, message: escapedMessage,  ip, debug };

  messages.unshift(newMessage);

  while (messages.length > MAX_MESSAGES) {
    messages.pop()
  }

  io.emit('ping',  newMessage);

}

app.post('/ping', (req, res) => {
  const message = JSON.stringify(req.body, null, 2);

  if (message) {
    // Check if CF-Connecting-IP header is present
    const ip = req.headers['cf-connecting-ip'] || req.ip;

    addMessage('POST', message, ip);

    res.sendStatus(200);
  } else {
    res.sendStatus(400); 
  }
});

app.get('/ping', (req, res) => {
  const message = new URLSearchParams(req.query).toString()
  
  if (message) {
    // Check if CF-Connecting-IP header is present
    const ip = req.headers['cf-connecting-ip'] || req.ip;

    addMessage('GET', message, ip);

    res.sendStatus(200);
  } else {
    res.sendStatus(400); 
  }
});

cron.schedule('0 0 */4 * * *', () => {
  const now = new Date();

  messages = messages.filter((message) => {
    return (now - message.timestamp) < MAX_MESSAGE_AGE;
  });
});

io.on('connection', (socket) => {
  console.log('A user connected');

  socket.emit('init', messages);

  socket.on('disconnect', () => {
    console.log('User disconnected');
  });

  socket.on('ping', (message) => {

    const ip = socket.handshake.headers['cf-connecting-ip'] || socket.handshake.address;
  
    addMessage('SOCKET', message, ip);
  });
});

app.use(express.static('public'))

app.get('/', (req, res) => {
  res.render('index.ejs');
});


server.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});