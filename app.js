//appp.js//
const express = require('express');
const path = require('path');
const http = require('http');
const socketio = require('socket.io');
const { Chess } = require('chess.js');

const app = express();
const server = http.createServer(app);
const io = socketio(server);

const chess = new Chess();
let players = {};

app.set("view engine", "ejs");
app.use(express.static(path.join(__dirname, 'public')));

app.get('/', (req, res) => {
  res.render("index", { title: "CHESS GAME" });
});

io.on("connection", (socket) => {
  console.log("New user connected:", socket.id);

  // Assign player roles
  if (!players.white) {
    players.white = socket.id;
    socket.emit("playerRole", "w");
  } else if (!players.black) {
    players.black = socket.id;
    socket.emit("playerRole", "b");
  } else {
    socket.emit("spectatorRole");
  }

  // Send current board to the new connection
  socket.emit("boardState", chess.fen());

  // Handle disconnection
  socket.on("disconnect", () => {
    if (socket.id === players.white) {
      delete players.white;
    } else if (socket.id === players.black) {
      delete players.black;
    }
  });

  // Handle move from a player
  socket.on("move", (move) => {
    try {
      const playerColor = chess.turn();

      if (playerColor === 'w' && socket.id !== players.white) return;
      if (playerColor === 'b' && socket.id !== players.black) return;

      const result = chess.move(move);

      if (result) {
        io.emit("move", move);
        io.emit("boardState", chess.fen());
      } else {
        console.log("Invalid move attempted:", move);
        socket.emit("invalidMove", move);
      }
    } catch (err) {
      console.error("Error handling move:", err);
      socket.emit("invalidMove", move);
    }
  });
});

server.listen(2900, () => {
  console.log("Server is running");
});
