const http = require("http");
const SocketIO = require("socket.io");
const static = require("node-static");
const fs = require("fs");
const Shared = require("./shared");

const fileServer = new static.Server("./static", { cache: null });
const indexHTML = fs.readFileSync(__dirname + "/static/index.html", "utf8");

const httpServer = http.createServer((request, response) => {
  request
    .addListener("end", () =>
      fileServer.serve(request, response, (err) => {
        if (err && err.status === 404) {
          response.setHeader("Content-Type", "text/html");
          response.setHeader("Content-Length", Buffer.byteLength(indexHTML));
          response.statusCode = 200;
          response.end(indexHTML);
        }
      })
    )
    .resume();

  request.on("error", (err) => console.error(err.stack));
});

const rooms = new Map();
const intervals = new Map();

const io = SocketIO(httpServer);

io.on("connection", (socket) => {
  console.log("connected:", socket.id);

  socket.on("join", (roomCode, user) => {
    user = { ...user, socketId: socket.id };
    const emptyRoom = { roomCode, status: "loby", users: [] };

    // Add user to room map
    let room = rooms.get(roomCode) || emptyRoom;
    const users = room.users.concat(user);
    room = { ...room, users };
    rooms.set(roomCode, room);

    // Connect to socket room
    socket.join(roomCode);

    // Broadcast that user has joined
    io.to(roomCode).emit("joined", user, room);
  });

  socket.on("disconnecting", () => {
    for (const roomCode of socket.rooms) {
      // Ignore private room
      if (roomCode === socket.id) continue;

      // Get room that socket was part of
      let room = rooms.get(roomCode);
      if (room == null) continue;

      // If now empty, remove room
      if (room.users.length <= 1) {
        rooms.delete(roomCode);
        continue;
      }

      // Find the user
      const user = room.users.find((u) => u.socketId === socket.id);

      // Remove user from room
      const users = room.users.filter((u) => u.socketId !== socket.id);
      room = { ...room, users };

      // Update the room
      rooms.set(roomCode, room);

      // Broadcast to other users
      socket.broadcast.to(roomCode).emit("left", user, room);
    }
  });

  socket.on("start", async (roomCode) => {
    // Get the room
    let room = rooms.get(roomCode);
    if (room == null) return;

    // Find the user
    const user = room.users.find((u) => u.socketId === socket.id);

    // If not a user, ignore
    if (user == null) return;

    // If not in loby, ignore
    if (room.status !== "loby") return;

    // Update room status
    room = { ...room, status: "countdown" };
    rooms.set(roomCode, room);

    // Countdown from 10
    for (let i = 10; i > 0; i--) {
      // Refetch the room
      room = rooms.get(roomCode);
      if (room == null) return;
      if (room.status !== "countdown") return;

      // Update count
      room = { ...room, count: i };
      rooms.set(roomCode, room);
      io.to(roomCode).emit("countdown", room);

      // Wait 1 second
      await timeout(1000);
    }

    // Refetch the room
    room = rooms.get(roomCode);
    if (room == null) return;
    if (room.status !== "countdown") return;

    // Cache shuffled list of players as new users may enter waiting list
    const players = shuffleArray(room.users);

    // Update to playing status
    room = {
      ...room,
      status: "playing",
      players,
      chains: initializeMatrix(players.length, players.length),
      round: 0,
    };
    rooms.set(roomCode, room);
    io.to(roomCode).emit("started", room);
  });

  socket.on("cancel", async (roomCode) => {
    // Get the room
    let room = rooms.get(roomCode);
    if (room == null) return;

    // Find the user
    const user = room.users.find((u) => u.socketId === socket.id);

    // If not a user, ignore
    if (user == null) return;

    // If not in countdown, ignore
    if (room.status !== "countdown") return;

    // Update to loby status
    room = { ...room, status: "loby" };
    rooms.set(roomCode, room);
    io.to(roomCode).emit("cancelled", room);
  });

  socket.on("submit-answer", async (roomCode, answerValue) => {
    const log = logger("[submit-answer]");

    // Get the room
    let room = rooms.get(roomCode);
    if (room == null) return;

    // Find the user
    const user = room.users.find((u) => u.socketId === socket.id);
    const answer = { user, value: answerValue };

    // If not a user, ignore
    if (user == null) {
      log("user not in room", roomCode, socket.id);
      return;
    }

    // If not in playing, ignore
    if (room.status !== "playing") {
      log("room no longer in play", room.status);
      return;
    }

    // Set the answer in the matrix
    const chainIndex = Shared.getChainIndex(room, user.sessionId);
    const chains = setMatrixValue(room.chains, chainIndex, room.round, answer);

    // Update the room
    room = { ...room, chains };
    rooms.set(roomCode, room);
    socket.emit("answer-submitted", room, answer);
    log("emit answer-submitted");

    // If drawing round, will finish with timeout
    if (room.round % 2 === 1) return;

    // If some of the answers haven't been submitted yet, wait for now
    if (chains.some((chain) => chain[room.round] == null)) return;

    // Otherwise start next round
    const round = room.round + 1;

    // If the end of the game
    if (room.players.length === round) {
      room = { ...room, status: "marking" };
      rooms.set(roomCode, room);
      io.to(roomCode).emit("marking-started", room);
      log("emit marking-started");
      return;
    }

    // Otherwise start drawing round
    room = { ...room, round, ticks: 120 };
    rooms.set(roomCode, room);
    io.to(roomCode).emit("new-drawing-round", room);
    log("emit new-drawing-round");

    // Start count down
    const interval = setInterval(tick, 1000, roomCode);
    intervals.set(roomCode, interval);
  });
});

httpServer.listen(3000, () => {
  console.log("Listening on http://localhost:3000");
});

function tick(roomCode) {
  const log = logger("[tick]");
  const interval = intervals.get(roomCode);

  // Get the room
  let room = rooms.get(roomCode);
  if (room == null) {
    log("room closed", roomCode);
    clearInterval(interval);
    intervals.delete(roomCode);
    return;
  }

  // If not in playing, ignore
  if (room.status !== "playing") {
    log("room no longer in play", roomCode, room.status);
    clearInterval(interval);
    intervals.delete(roomCode);
    return;
  }

  // If no longer drawing round, stop ticking
  if (room.round % 2 === 0) {
    log("room not in drawing round", roomCode, room.round);
    clearInterval(interval);
    intervals.delete(roomCode);
    return;
  }

  // If still going, tick
  if (room.ticks > 1) {
    room = { ...room, ticks: room.ticks - 1 };
    rooms.set(roomCode, room);
    io.to(roomCode).emit("tick", room);
    log("emit tick", roomCode, room.ticks);
    return;
  }

  // Otherwise start next round
  const round = room.round + 1;

  // If the end of the game
  if (room.players.length === round) {
    clearInterval(interval);
    intervals.delete(roomCode);
    room = { ...room, round, status: "marking" };
    rooms.set(roomCode, room);
    io.to(roomCode).emit("marking-started", room);
    log("emit marking-started", roomCode);
    return;
  }

  // Otherwise finish round
  clearInterval(interval);
  intervals.delete(roomCode);
  room = { ...room, round, ticks: 0 };
  rooms.set(roomCode, room);
  io.to(roomCode).emit("new-guess-round", room);
  log("emit new-guess-round", roomCode);
}

//
// Helpers

function logger(prefix) {
  return (...messages) => {
    if (5 > 0) return;
    console.log(new Date(), prefix, ...messages);
  };
}

function timeout(ms) {
  return new Promise((resolve) => setInterval(resolve, ms));
}

function shuffleArray(array) {
  array = cloneArray(array);

  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }

  return array;
}

function cloneArray(array) {
  return array.slice(0);
}

function initializeMatrix(rows, columns) {
  return Array(rows)
    .fill(null)
    .map(() => Array(columns).fill(null));
}

function setMatrixValue(matrix, x, y, value) {
  matrix = cloneArray(matrix);
  matrix[x] = cloneArray(matrix[x]);
  matrix[x][y] = value;
  return matrix;
}
