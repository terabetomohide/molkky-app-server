const express = require('express');
const bodyParser = require('body-parser');
const http = require('http');
const cors = require('cors')
const cacheData = require('memory-cache');

const socketIo = require('socket.io');

const app = express();
const server = http.Server(app);

const defaultOrigin = "http://localhost:3000";

const PORT = process.env.PORT || 3000;

const ORIGIN = process.env.ORIGIN || defaultOrigin;

app.use(cors({ORIGIN}))
app.use(bodyParser.urlencoded({
  extended: true
}));
app.use(bodyParser.json());

app.get('/', (req, res) => {
  res.sendFile(__dirname + '/index.html');
});

server.listen(PORT, () => {
  console.log(`listening on port ${PORT}`);
});

app.get('/game/:gameId', (req, res) => {
  const param = req.query;
  const key = param.gameId;

  const data = cacheData.get(key);
  if (data) {
    res.status(200).json(data);
  } else {
    res.status(404);
    res.end();
  }
});

const io = socketIo(server,{
  cors: {
    origin: ORIGIN,
    methods: ["GET", "POST"],
    credentials: true
  }
});

io.on('connection', (socket) => {
  app.post('/game/:gameId', (req, res) => {
    const data = req.body;
    const params = req.params;
    const key = params.gameId;

    if (typeof key !== "string") {
      res.status(400)
      res.end()
    }

    cacheData.put(key, data, 1000 * 60 * 60 * 24);
    io.emit(key, data)
    res.status(201).json(data);
    res.end()
  });

  console.log('user connected');
  socket.emit('connection', 'user connected')
});