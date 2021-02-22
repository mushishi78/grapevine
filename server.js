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
    const player = { ...user, socketId: socket.id };
    const emptyRoom = { roomCode, status: "loby", players: [] };

    // Add player to room map
    const room = rooms.get(roomCode) || emptyRoom;
    room.players = room.players.concat(player);
    rooms.set(roomCode, room);

    // Connect to socket room
    socket.join(roomCode);

    // Broadcast that player has joined
    io.to(roomCode).emit("joined", player, room);
  });

  socket.on("disconnecting", () => {
    for (const roomCode of socket.rooms) {
      // Ignore private room
      if (roomCode === socket.id) continue;

      // Get room that socket was part of
      const room = rooms.get(roomCode);
      if (room == null) continue;

      // Find the session id
      const player = room.players.find((p) => p.socketId === socket.id);

      // Remove player from room
      room.players = room.players.filter((p) => p.socketId !== socket.id);
      rooms.set(roomCode, room);

      // Broadcast to other players
      socket.broadcast.to(roomCode).emit("left", player, room);
    }
  });
});

httpServer.listen(3000, () => {
  console.log("Listening on http://localhost:3000");
});
