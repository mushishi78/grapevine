import { Log, LoggableError } from "./logger";
import {
  Answer,
  ConnectedRoom,
  FinishedRoom,
  getChainIndex,
  LobbyRoom,
  MarkingRoom,
  PlayingRoom,
  Room,
  RoomCode,
  SessionId,
  User,
} from "../shared";
import {
  initialize2DMatrix,
  initialize3DMatrix,
  set2DMatrixValue,
  set3DMatrixValue,
  shuffleArray,
} from "../shared/array";

const drawingTicks = 60;

export class State {
  public rooms = new Map<RoomCode, ConnectedRoom>();
  public intervals = new Map<RoomCode, NodeJS.Timeout>();

  public createNewRoom(roomCode: RoomCode) {
    const room: Room = {
      roomCode,
      status: "lobby",
      users: [],
      connections: [],
    };
    this.rooms.set(roomCode, room);
    return room;
  }

  public addConnection(
    roomCode: RoomCode,
    socketId: string,
    sessionId: string
  ) {
    let room: Room = this.rooms.get(roomCode);
    const connections = room.connections.concat({ socketId, sessionId });
    room = { ...room, connections };
    this.rooms.set(roomCode, room);
    return room;
  }

  public addUser(roomCode: RoomCode, user: User) {
    let room: Room = this.rooms.get(roomCode);
    const users = room.users.concat(user);
    room = { ...room, users };
    this.rooms.set(roomCode, room);
    return room;
  }

  public demandRoom(roomCode: RoomCode) {
    const room = this.rooms.get(roomCode);
    if (room == null) throw new LoggableError("cannot find room");
    return room;
  }

  public findUser(room: ConnectedRoom, socketId: string) {
    const connection = room.connections.find((c) => c.socketId === socketId);
    return room.users.find((u) => u.sessionId === connection.sessionId);
  }

  public demandUser(room: ConnectedRoom, socketId: string) {
    const user = this.findUser(room, socketId);
    if (user == null) throw new LoggableError("user not in room", socketId);
    return user;
  }

  public removeConnection(roomCode: RoomCode, socketId: string) {
    let room = this.demandRoom(roomCode);

    // If now empty, remove room
    if (room.connections.length <= 1) {
      this.rooms.delete(roomCode);
      return;
    }

    // Remove connection from room
    const connections = room.connections.filter((u) => u.socketId !== socketId);
    room = { ...room, connections };

    // Update the room
    this.rooms.set(roomCode, room);

    return room;
  }

  public startCountdown(roomCode: RoomCode, count: number) {
    let room = this.demandRoom(roomCode);

    if (room.status !== "lobby")
      throw new LoggableError("room must be in lobby");

    room = { ...room, status: "countdown", count };
    this.rooms.set(roomCode, room);
  }

  public cancelCountdown(roomCode: RoomCode) {
    let room = this.demandRoom(roomCode);

    if (room.status !== "countdown")
      throw new LoggableError("room is no longer counting down");

    room = { ...room, status: "lobby" };
    this.rooms.set(roomCode, room);

    return room;
  }

  public countdownTick(roomCode: RoomCode) {
    let room = this.demandRoom(roomCode);

    if (room.status !== "countdown")
      throw new LoggableError("room is no longer counting down");

    room = { ...room, count: room.count - 1 };
    this.rooms.set(roomCode, room);

    return room;
  }

  public startPlaying(roomCode: RoomCode) {
    let room = this.demandRoom(roomCode);

    if (room.status !== "countdown")
      throw new LoggableError("room is no longer counting down");

    const players = shuffleArray(room.connections).map((u) => u.sessionId);
    room = {
      ...room,
      status: "playing",
      players,
      chains: initialize2DMatrix(players.length, players.length),
      round: 0,
    };

    this.rooms.set(roomCode, room);
    return room;
  }

  public demandPlayingRoom(roomCode: RoomCode) {
    const room = this.demandRoom(roomCode);

    if (room.status !== "playing")
      throw new LoggableError("room is no longer playing");

    return room;
  }

  public demandMarkingRoom(roomCode: RoomCode) {
    const room = this.demandRoom(roomCode);

    if (room.status !== "marking")
      throw new LoggableError("room is no longer marking");

    return room;
  }

  public submitAnswer(roomCode: RoomCode, roomRound: number, answer: Answer) {
    let room = this.demandPlayingRoom(roomCode);

    if (room.round !== roomRound)
      throw new LoggableError("round has finished", roomRound);

    // Set the answer in the matrix
    const chainIndex = getChainIndex(room, answer.user.sessionId);
    const chains = set2DMatrixValue(
      room.chains,
      chainIndex,
      room.round,
      answer
    );

    // Update the room
    room = { ...room, chains };
    this.rooms.set(roomCode, room);

    return room;
  }

  public startMarkingRound(roomCode: RoomCode) {
    const playingRoom = this.demandPlayingRoom(roomCode);

    const markingRoom: MarkingRoom = {
      ...playingRoom,
      round: null,
      status: "marking",
      markings: initialize3DMatrix(
        playingRoom.players.length,
        playingRoom.players.length,
        playingRoom.players.length
      ),
      finished: [],
    };

    this.rooms.set(roomCode, markingRoom);

    return markingRoom;
  }

  public startDrawingRound(
    roomCode: RoomCode,
    tick: (roomCode: RoomCode) => void
  ) {
    let room = this.demandPlayingRoom(roomCode);

    room = { ...room, round: room.round + 1, ticks: drawingTicks };
    this.rooms.set(roomCode, room);

    const interval = setInterval(tick, 1000, roomCode);
    this.intervals.set(roomCode, interval);

    return room;
  }

  public clearInterval(roomCode: RoomCode) {
    const interval = this.intervals.get(roomCode);
    if (interval == null) return;
    clearInterval(interval);
    this.intervals.delete(roomCode);
  }

  public demandDrawingRound(roomCode: RoomCode) {
    const room = this.demandPlayingRoom(roomCode);

    if (room.round % 2 === 0)
      throw new LoggableError("room not in drawing round");

    return room;
  }

  public tick(roomCode: RoomCode) {
    let room = this.demandDrawingRound(roomCode);
    room = { ...room, ticks: room.ticks - 1 };
    this.rooms.set(roomCode, room);
    return room;
  }

  public startGuessingRound(roomCode: RoomCode) {
    let room = this.demandDrawingRound(roomCode);

    room = { ...room, round: room.round + 1, ticks: null };
    this.rooms.set(roomCode, room);

    return room;
  }

  public demandPlayerIndex(room: PlayingRoom | MarkingRoom, sessionId: string) {
    const playerIndex = room.players.indexOf(sessionId);
    if (playerIndex == -1)
      throw new LoggableError("user not in game", sessionId);

    return playerIndex;
  }

  public submitMarking(
    roomCode: RoomCode,
    socketId: string,
    chainIndex: number,
    roundIndex: number,
    value: number
  ) {
    let room = this.demandMarkingRoom(roomCode);
    const user = this.demandUser(room, socketId);
    const playerIndex = this.demandPlayerIndex(room, user.sessionId);

    const markings = set3DMatrixValue(
      room.markings,
      playerIndex,
      chainIndex,
      roundIndex,
      value
    );

    room = { ...room, markings };
    this.rooms.set(roomCode, room);

    return room;
  }

  public submitFinished(roomCode: RoomCode, socketId: string) {
    let room = this.demandMarkingRoom(roomCode);
    const user = this.demandUser(room, socketId);
    this.demandPlayerIndex(room, user.sessionId);

    if (room.finished.indexOf(user.sessionId) > -1)
      throw new LoggableError("already finished", user.sessionId);

    const finished = room.finished.concat(user.sessionId);
    room = { ...room, finished };
    this.rooms.set(roomCode, room);

    return room;
  }

  public finishGame(roomCode: RoomCode) {
    const markingRoom = this.demandMarkingRoom(roomCode);
    const finishedRoom: FinishedRoom = { ...markingRoom, status: "finished" };
    this.rooms.set(roomCode, finishedRoom);
    return finishedRoom;
  }

  public returnToLoby(roomCode: RoomCode) {
    let room = this.demandRoom(roomCode);
    room = {
      roomCode,
      status: "lobby",
      users: room.users,
      connections: room.connections,
    };
    this.rooms.set(roomCode, room);
    return room;
  }

  public takePlace(
    roomCode: RoomCode,
    newSessionId: SessionId,
    oldSessionId: SessionId
  ) {
    let room = this.demandPlayingRoom(roomCode);
    const players = room.players.map((player) =>
      player === oldSessionId ? newSessionId : player
    );
    room = { ...room, players };
    this.rooms.set(roomCode, room);
    return room;
  }
}
