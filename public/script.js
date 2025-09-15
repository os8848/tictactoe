const socket = io();

const nameInput = document.getElementById("nameInput");
const roomInput = document.getElementById("roomInput");
const createJoinBtn = document.getElementById("createJoinBtn");
const roomListEl = document.getElementById("roomList");

const lobbyEl = document.getElementById("lobby");
const gameEl = document.getElementById("game");
const boardEl = document.getElementById("board");
const statusEl = document.getElementById("status");
const leaveBtn = document.getElementById("leaveBtn");
const restartBtn = document.getElementById("restartBtn");
const scoreboardEl = document.getElementById("scoreboard");

let mySymbol = null;
let myTurn = false;
let currentRoom = null;

// Setup board
for (let i = 0; i < 9; i++) {
  let cell = document.createElement("div");
  cell.classList.add("cell");
  cell.dataset.index = i;
  boardEl.appendChild(cell);
}

// Join room
createJoinBtn.addEventListener("click", () => {
  const room = roomInput.value.trim();
  const name = nameInput.value.trim();
  if (!room || !name) {
    alert("Enter your name and a room name");
    return;
  }

  socket.emit("joinRoom", { room, name });
  currentRoom = room;
  lobbyEl.style.display = "none";
  gameEl.style.display = "block";
});

// Leave room
leaveBtn.addEventListener("click", () => {
  location.reload(); // simple reset
});

// Board click
boardEl.addEventListener("click", (e) => {
  if (!myTurn) return;
  if (!e.target.classList.contains("cell")) return;

  let index = e.target.dataset.index;
  socket.emit("makeMove", { room: currentRoom, index });
});

// Restart game
restartBtn.addEventListener("click", () => {
  socket.emit("restartGame", currentRoom);
  restartBtn.style.display = "none";
});

// --- Socket Events ---
socket.on("roomList", (rooms) => {
  roomListEl.innerHTML = "";
  for (let room in rooms) {
    let li = document.createElement("li");
    li.innerText = `${room} (${rooms[room].join(", ")})`;
    li.onclick = () => {
      roomInput.value = room;
    };
    roomListEl.appendChild(li);
  }
});

socket.on("roomUpdate", (game) => {
  let player = game.players.find((p) => p.id === socket.id);
  mySymbol = player ? player.symbol : null;
  updateScoreboard(game.players);
});

socket.on("startGame", (turn) => {
  statusEl.innerText = `Game started! You are ${mySymbol}`;
  myTurn = (mySymbol === turn);
  updateTurnMessage(turn);
});

socket.on("updateBoard", (game) => {
  let cells = document.querySelectorAll(".cell");
  game.board.forEach((val, i) => {
    cells[i].innerText = val ? val : "";
  });

  myTurn = (game.turn === mySymbol);
  updateTurnMessage(game.turn);
  updateScoreboard(game.players);
});

socket.on("gameOver", ({ winner, board }) => {
  let cells = document.querySelectorAll(".cell");
  board.forEach((val, i) => {
    cells[i].innerText = val ? val : "";
  });

  if (winner) {
    statusEl.innerText = `${winner.name} (${winner.symbol}) wins!`;
  } else {
    statusEl.innerText = "It's a draw!";
  }

  restartBtn.style.display = "block";
});

socket.on("roomFull", () => {
  alert("Room is full. Try another room.");
  location.reload();
});

// Helpers
function updateTurnMessage(turn) {
  if (myTurn) {
    statusEl.innerText = "Your turn!";
  } else {
    statusEl.innerText = "Opponent's turn...";
  }
}

function updateScoreboard(players) {
  scoreboardEl.innerHTML = players
    .map((p) => `${p.name} (${p.symbol}): ${p.score}`)
    .join(" | ");
}
