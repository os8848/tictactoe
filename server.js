const express = require("express");
const http = require("http");
const { Server } = require("socket.io");

const app = express();
const server = http.createServer(app);
const io = new Server(server);

app.use(express.static("public"));

let rooms = {}; // roomName -> { players: [{id,name,symbol,score}], board, turn, gameOver }

io.on("connection", (socket) => {
  console.log("Connected:", socket.id);

  socket.emit("roomList", getRoomList());

  // Create / Join Room
  socket.on("joinRoom", ({ room, name }) => {
    if (!rooms[room]) {
      rooms[room] = {
        players: [],
        board: Array(9).fill(null),
        turn: "X",
        gameOver: false,
      };
    }

    let game = rooms[room];
    if (game.players.length >= 2) {
      socket.emit("roomFull");
      return;
    }

    let symbol = game.players.length === 0 ? "X" : "O";
    game.players.push({ id: socket.id, name, symbol, score: 0 });

    socket.join(room);

    io.emit("roomList", getRoomList());
    io.to(room).emit("roomUpdate", game);

    if (game.players.length === 2) {
      io.to(room).emit("startGame", game.turn);
    }
  });

  // Handle Move
  socket.on("makeMove", ({ room, index }) => {
    let game = rooms[room];
    if (!game || game.gameOver) return;

    let player = game.players.find((p) => p.id === socket.id);
    if (!player || game.turn !== player.symbol) return;

    if (game.board[index] === null) {
      game.board[index] = player.symbol;

      // Check winner
      let winner = checkWinner(game.board);
      if (winner) {
        game.gameOver = true;
        let winPlayer = game.players.find((p) => p.symbol === winner);
        if (winPlayer) winPlayer.score++;
        io.to(room).emit("gameOver", { winner: winPlayer, board: game.board });
        return;
      }

      // Check draw
      if (!game.board.includes(null)) {
        game.gameOver = true;
        io.to(room).emit("gameOver", { winner: null, board: game.board });
        return;
      }

      // Next turn
      game.turn = game.turn === "X" ? "O" : "X";
      io.to(room).emit("updateBoard", game);
    }
  });

  // Restart Game
  socket.on("restartGame", (room) => {
    let game = rooms[room];
    if (!game) return;
    game.board = Array(9).fill(null);
    game.turn = "X";
    game.gameOver = false;
    io.to(room).emit("updateBoard", game);
  });

  // Disconnect
  socket.on("disconnect", () => {
    for (let room in rooms) {
      let game = rooms[room];
      game.players = game.players.filter((p) => p.id !== socket.id);
      if (game.players.length === 0) {
        delete rooms[room];
      } else {
        io.to(room).emit("roomUpdate", game);
      }
    }
    io.emit("roomList", getRoomList());
  });
});

function getRoomList() {
  let list = {};
  for (let room in rooms) {
    list[room] = rooms[room].players.map((p) => p.name);
  }
  return list;
}

function checkWinner(board) {
  const wins = [
    [0, 1, 2],
    [3, 4, 5],
    [6, 7, 8],
    [0, 3, 6],
    [1, 4, 7],
    [2, 5, 8],
    [0, 4, 8],
    [2, 4, 6],
  ];
  for (let [a, b, c] of wins) {
    if (board[a] && board[a] === board[b] && board[a] === board[c]) {
      return board[a];
    }
  }
  return null;
}

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => console.log(`Server running on ${PORT}`));
