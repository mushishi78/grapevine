export type Room = { status: "connecting" } | ConnectedRoom;

export type ConnectedRoom =
  | LobbyRoom
  | CountdownRoom
  | PlayingRoom
  | MarkingRoom
  | FinishedRoom;

export type LobbyRoom = {
  roomCode: RoomCode;
  users: User[];
  status: "lobby";
};

export type CountdownRoom = Omit<LobbyRoom, "status"> & {
  status: "countdown";
  count?: number;
};

export type PlayingRoom = Omit<CountdownRoom, "status"> & {
  status: "playing";
  players: Player[];
  chains: Answer[][];
  round: number;
  ticks?: number;
};

export type MarkingRoom = Omit<PlayingRoom, "status"> & {
  status: "marking";
  markings: number[][][];
  finished: SessionId[];
};

export type FinishedRoom = Omit<MarkingRoom, "status"> & {
  status: "finished";
};

export interface User {
  socketId: SocketId;
  sessionId: SessionId;
  color: string;
  icon: string;
}

export interface Player extends User {}

export type SocketId = string;
export type SessionId = string;
export type RoomCode = string;

export type Answer = { user: User; value: AnswerValue };
export type AnswerValue = GuessAnswerValue | DrawingAnswerValue;

export type GuessAnswerValue = string;
export type DrawingAnswerValue = { objects: fabric.Object[] };

export function getPlayerIndex(
  room: PlayingRoom | MarkingRoom,
  sessionId: SessionId
) {
  const player = room.players.find((p) => p.sessionId === sessionId);
  const playerIndex = room.players.indexOf(player);
  return playerIndex;
}

export function getChainIndex(
  room: PlayingRoom | MarkingRoom,
  sessionId: SessionId
) {
  const playerIndex = getPlayerIndex(room, sessionId);
  return (playerIndex + room.round) % room.players.length;
}
