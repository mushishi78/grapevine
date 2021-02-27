const http = require("http");
const SocketIO = require("socket.io");
const static = require("node-static");
const fs = require("fs");

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

const io = SocketIO(httpServer);

io.on("connection", (socket) => {
  console.log("connected:", socket.id);

  socket.on("join", (roomCode, user) => {
    user = { ...user, socketId: socket.id };
    const emptyRoom = { roomCode, status: "loby", users: [] };

    // Add user to room map
    const room = rooms.get(roomCode) || emptyRoom;
    room.users = room.users.concat(user);
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
      const room = rooms.get(roomCode);
      if (room == null) continue;

      // If now empty, remove room
      if (room.users.length <= 1) {
        rooms.delete(roomCode);
        continue;
      }

      // Find the user
      const user = room.users.find((u) => u.socketId === socket.id);

      // Remove user from room
      room.users = room.users.filter((u) => u.socketId !== socket.id);

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

    // Update to playing status
    room = {
      ...room,
      status: "playing",
      players: room.users.map((u) => u.sessionId),
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
});

httpServer.listen(3000, () => {
  console.log("Listening on http://localhost:3000");
});

//
// Helpers

function timeout(ms) {
  return new Promise((resolve) => setInterval(resolve, ms));
}
