const express = require("express");
const http = require("http");
const { Server } = require("socket.io");

const app = express();
const server = http.createServer(app);
const io = new Server(server);

app.use(express.static("public")); // serve index.html, css, js

let rooms = {}; // store room states

io.on("connection", (socket) => {
  console.log("New user connected:", socket.id);

  socket.on("joinRoom", (room) => {
    socket.join(room);

    if (!rooms[room]) {
      rooms[room] = { players: [], board: Array(9).fill(null), turn: "X" };
    }

    if (rooms[room].players.length < 2) {
      rooms[room].players.push(socket.id);
    }

    io.to(room).emit("updateBoard", rooms[room]);

    if (rooms[room].players.length === 2) {
      io.to(room).emit("startGame", rooms[room].turn);
    }
  });

  socket.on("makeMove", ({ room, index }) => {
    let game = rooms[room];
    if (!game) return;

    if (game.board[index] === null) {
      game.board[index] = game.turn;
      game.turn = game.turn === "X" ? "O" : "X";
      io.to(room).emit("updateBoard", game);
    }
  });

  socket.on("disconnect", () => {
    console.log("User disconnected:", socket.id);
    for (let room in rooms) {
      rooms[room].players = rooms[room].players.filter((id) => id !== socket.id);
      if (rooms[room].players.length === 0) {
        delete rooms[room];
      }
    }
  });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
