import { Log, LoggableError } from "./logger";
import {
  Answer,
  ConnectedRoom,
  FinishedRoom,
  getChainIndex,
  getPlayerIndex,
  MarkingRoom,
  PlayingRoom,
  Room,
  RoomCode,
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

  public addUser(log: Log, roomCode: RoomCode, user: User) {
    let room: Room = this.rooms.get(roomCode);

    if (room == null) {
      log("creating new room", roomCode);
      room = { roomCode, status: "lobby", users: [] };
    }

    const users = room.users.concat(user);
    room = { ...room, users };
    this.rooms.set(roomCode, room);

    return room;
  }

  public demandRoom(roomCode: RoomCode) {
    const room = this.rooms.get(roomCode);
    if (room == null) throw new LoggableError("cannot find room", roomCode);
    return room;
  }

  public demandUser(room: ConnectedRoom, socketId: string) {
    const user = room.users.find((u) => u.socketId === socketId);
    if (user == null)
      throw new LoggableError("user not in room", room.roomCode, socketId);
    return user;
  }

  public removeUser(roomCode: RoomCode, socketId: string) {
    let room = this.demandRoom(roomCode);
    const user = this.demandUser(room, socketId);

    // If now empty, remove room
    if (room.users.length <= 1) {
      this.rooms.delete(roomCode);
      return;
    }

    // Remove user from room
    const users = room.users.filter((u) => u.socketId !== socketId);
    room = { ...room, users };

    // Update the room
    this.rooms.set(roomCode, room);

    return { room, user };
  }

  public startCountdown(roomCode: RoomCode, count: number) {
    let room = this.demandRoom(roomCode);

    if (room.status !== "lobby")
      throw new LoggableError("room must be in lobby", roomCode);

    room = { ...room, status: "countdown", count };
    this.rooms.set(roomCode, room);
  }

  public cancelCountdown(roomCode: RoomCode) {
    let room = this.demandRoom(roomCode);

    if (room.status !== "countdown")
      throw new LoggableError("room is no longer counting down", roomCode);

    room = { ...room, status: "lobby" };
    this.rooms.set(roomCode, room);

    return room;
  }

  public countdownTick(roomCode: RoomCode) {
    let room = this.demandRoom(roomCode);

    if (room.status !== "countdown")
      throw new LoggableError("room is no longer counting down", roomCode);

    room = { ...room, count: room.count - 1 };
    this.rooms.set(roomCode, room);

    return room;
  }

  public startPlaying(roomCode: RoomCode) {
    let room = this.demandRoom(roomCode);

    if (room.status !== "countdown")
      throw new LoggableError("room is no longer counting down", roomCode);

    const players = shuffleArray(room.users);
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
      throw new LoggableError("room is no longer playing", roomCode);

    return room;
  }

  public demandMarkingRoom(roomCode: RoomCode) {
    const room = this.demandRoom(roomCode);

    if (room.status !== "marking")
      throw new LoggableError("room is no longer marking", roomCode);

    return room;
  }

  public submitAnswer(roomCode: RoomCode, roomRound: number, answer: Answer) {
    let room = this.demandPlayingRoom(roomCode);

    if (room.round !== roomRound)
      throw new LoggableError("round has finished", roomCode, roomRound);

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
      throw new LoggableError("room not in drawing round", roomCode);

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
    const playerIndex = getPlayerIndex(room, sessionId);
    if (playerIndex == -1)
      throw new LoggableError("user not in game", room.roomCode, sessionId);

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
      throw new LoggableError("already finished", roomCode, user.sessionId);

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
    room = { roomCode, status: "lobby", users: room.users };
    this.rooms.set(roomCode, room);
    return room;
  }
}
