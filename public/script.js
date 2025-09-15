const socket = io();

const boardEl = document.getElementById("board");
const statusEl = document.getElementById("status");
const joinBtn = document.getElementById("joinBtn");
const roomInput = document.getElementById("roomInput");

let currentRoom = null;
let mySymbol = null;
let myTurn = false;

for (let i = 0; i < 9; i++) {
  let cell = document.createElement("div");
  cell.classList.add("cell");
  cell.dataset.index = i;
  boardEl.appendChild(cell);
}

joinBtn.addEventListener("click", () => {
  const room = roomInput.value.trim();
  if (room) {
    currentRoom = room;
    socket.emit("joinRoom", room);
    statusEl.innerText = `Joined room: ${room}. Waiting for another player...`;
  }
});

boardEl.addEventListener("click", (e) => {
  if (!myTurn) return;
  if (!e.target.classList.contains("cell")) return;

  let index = e.target.dataset.index;
  socket.emit("makeMove", { room: currentRoom, index });
});

socket.on("startGame", (turn) => {
  mySymbol = turn; // first player gets X, second gets O
  myTurn = mySymbol === "X";
  statusEl.innerText = `Game started! You are ${mySymbol}`;
});

socket.on("updateBoard", (game) => {
  let cells = document.querySelectorAll(".cell");
  game.board.forEach((val, i) => {
    cells[i].innerText = val ? val : "";
  });

  myTurn = (game.turn === mySymbol);
  statusEl.innerText = myTurn ? "Your turn!" : "Opponent's turn...";
});
