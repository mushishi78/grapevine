import http from "http";
import { Server } from "socket.io";
import nodeStatic from "node-static";
import fs from "fs";
import path from "path";
import { hasField } from "../shared/object";
import { State } from "./State";
import { withLog } from "./Logger";
import { timeout } from "../shared/timeout";
import {
  RoomCode,
  User,
  AnswerValue,
  ConnectedRoom,
  getMissingSessionIds,
  SessionId,
} from "../shared";

const root = path.resolve(__dirname + "/../..");
const fileServer = new nodeStatic.Server(root + "/static", { cache: null });
const indexHTML = fs.readFileSync(root + "/static/index.html", "utf8");

const coundownTicks = 5;

const httpServer = http.createServer((request, response) => {
  request
    .addListener("end", () =>
      fileServer.serve(request, response, (err: Error) => {
        if (err && hasField(err, "status") && err.status === 404) {
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

const state = new State();

const io = new Server(httpServer);

io.on("connection", (socket) => {
  console.log(new Date(), "[connection]", socket.id);

  socket.on("join", (roomCode: RoomCode, user: User) =>
    withLog("[join]", roomCode, (log) => {
      let room = state.rooms.get(roomCode);

      if (room == null) {
        log("creating new room");
        room = state.createNewRoom(roomCode);
      }

      log("adding connection", socket.id);
      room = state.addConnection(roomCode, socket.id, user.sessionId);

      if (state.findUser(room, socket.id) == null) {
        log("adding user", user.sessionId);
        room = state.addUser(roomCode, user);
      }

      socket.join(roomCode);
      io.to(roomCode).emit("joined", user, room);
      log("emit joined", socket.id);
    })
  );

  socket.on("disconnecting", () => {
    for (const roomCode of socket.rooms as RoomCode[]) {
      if (roomCode === socket.id) continue;

      withLog("[disconnecting]", roomCode, (log) => {
        let room = state.demandRoom(roomCode);

        const user = state.findUser(room, socket.id);
        if (user == null) return;

        room = state.removeConnection(roomCode, socket.id);
        socket.broadcast.to(roomCode).emit("left", user, room);
        log("emit left", socket.id);
      });
    }
  });

  socket.on("start", (roomCode: RoomCode) =>
    withLog("[start]", roomCode, async (log) => {
      let room = state.demandRoom(roomCode);
      state.demandUser(room, socket.id);

      state.startCountdown(roomCode, coundownTicks);
      log("counting down");

      for (let i = coundownTicks; i > 0; i--) {
        room = state.countdownTick(roomCode);
        io.to(roomCode).emit("countdown", room);
        await timeout(1000);
      }

      room = state.startPlaying(roomCode);
      io.to(roomCode).emit("started", room);
      log("emit started");
    })
  );

  socket.on("cancel", (roomCode: RoomCode) =>
    withLog("[cancel]", roomCode, async (log) => {
      let room = state.demandRoom(roomCode);
      state.demandUser(room, socket.id);
      state.cancelCountdown(roomCode);
      io.to(roomCode).emit("cancelled", room);
      log("emit cancelled");
    })
  );

  socket.on("end-game", (roomCode: RoomCode) =>
    withLog("[end-game]", roomCode, async (log) => {
      let room = state.demandRoom(roomCode);
      state.demandUser(room, socket.id);
      room = state.startMarkingRound(roomCode);
      io.to(roomCode).emit("marking-started", room);
      log("emit marking-started");
    })
  );

  socket.on("new-game", (roomCode: RoomCode) =>
    withLog("[new-game]", roomCode, async (log) => {
      let room = state.demandRoom(roomCode);
      state.demandUser(room, socket.id);
      room = state.returnToLoby(roomCode);
      io.to(roomCode).emit("returned-to-lobby", room);
      log("emit returned-to-lobby");
    })
  );

  socket.on(
    "submit-answer",
    (roomCode: RoomCode, roomRound: number, answerValue: AnswerValue) =>
      withLog("[submit-answer]", roomCode, async (log) => {
        let room = state.demandRoom(roomCode);
        const user = state.demandUser(room, socket.id);
        const answer = { user, value: answerValue };

        // Submit answer
        room = state.submitAnswer(roomCode, roomRound, answer);
        socket.emit("answer-submitted", room, answer);
        log("emit answer-submitted");

        // If drawing round, will finish with timeout
        if (roomRound % 2 === 1) return;

        // If some of the answers haven't been submitted yet, wait for now
        if (room.chains.some((chain) => chain[roomRound] == null)) return;

        // Otherwise start next round
        roomRound += 1;

        // If the end of the game
        if (room.players.length === roomRound) {
          room = state.startMarkingRound(roomCode);
          io.to(roomCode).emit("marking-started", room);
          log("emit marking-started");
          return;
        }

        // Otherwise start drawing round
        room = state.startDrawingRound(roomCode, tick);
        io.to(roomCode).emit("new-drawing-round", room);
        log("emit new-drawing-round");
      })
  );

  socket.on(
    "submit-marking",
    async (
      roomCode: RoomCode,
      chainIndex: number,
      roundIndex: number,
      value: number
    ) => {
      withLog("[submit-marking]", roomCode, async (log) => {
        let room = state.submitMarking(
          roomCode,
          socket.id,
          chainIndex,
          roundIndex,
          value
        );

        socket.emit("marking-submitted", room);
        log("emit marking-submitted");
      });
    }
  );

  socket.on("submit-finished", async (roomCode: RoomCode) =>
    withLog("[submit-finished]", roomCode, async (log) => {
      const markingRoom = state.submitFinished(roomCode, socket.id);
      socket.emit("finished-submitted", markingRoom);
      log("emit finished-submitted");

      // If game finished
      if (markingRoom.finished.length === markingRoom.players.length) {
        const finishedRoom = state.finishGame(roomCode);
        io.to(roomCode).emit("game-finished", finishedRoom);
        log("emit game-finished");
      }
    })
  );

  socket.on("return-to-lobby", async (roomCode: RoomCode) =>
    withLog("[return-to-lobby]", roomCode, async (log) => {
      let room = state.demandRoom(roomCode);
      state.demandUser(room, socket.id);
      room = state.returnToLoby(roomCode);
      io.to(roomCode).emit("returned-to-lobby", room);
      log("emit returned-to-lobby");
    })
  );

  socket.on("take-place", async (roomCode: RoomCode, sessionId: SessionId) =>
    withLog("[take-place]", roomCode, async (log) => {
      let room = state.demandRoom(roomCode);
      const user = state.demandUser(room, socket.id);
      room = state.takePlace(roomCode, user.sessionId, sessionId);
      io.to(roomCode).emit("place-taken", room);
      log("emit place-taken");
    })
  );
});

httpServer.listen(3000, () => {
  console.log("Listening on http://localhost:3000");
});

function tick(roomCode: RoomCode) {
  withLog("[tick]", roomCode, (log) => {
    try {
      let room: ConnectedRoom = state.demandDrawingRound(roomCode);

      // If missing players, do not tick
      const missingSessionIds = getMissingSessionIds(room);
      if (missingSessionIds.length > 0) {
        log("no tick whilst missing players", roomCode, missingSessionIds);
        return;
      }

      // If still going, tick
      if (room.ticks > 1) {
        room = state.tick(roomCode);
        io.to(roomCode).emit("tick", room);
        log("emit tick", roomCode, room.ticks);
        return;
      }

      // Otherwise stop ticking
      state.clearInterval(roomCode);

      // And start next round
      const round = room.round + 1;

      // If the end of the game
      if (room.players.length === round) {
        room = state.startMarkingRound(roomCode);
        io.to(roomCode).emit("marking-started", room);
        log("emit marking-started", roomCode);
        return;
      }

      // Otherwise finish round
      room = state.startGuessingRound(roomCode);
      io.to(roomCode).emit("new-guess-round", room);
      log("emit new-guess-round", roomCode);
    } catch (error) {
      state.clearInterval(roomCode);
      throw error;
    }
  });
}
