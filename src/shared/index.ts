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
  connections: Connection[];
};

export type CountdownRoom = Omit<LobbyRoom, "status"> & {
  status: "countdown";
  count?: number;
};

export type PlayingRoom = Omit<CountdownRoom, "status"> & {
  status: "playing";
  players: SessionId[];
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
  sessionId: SessionId;
  color: string;
  icon: string;
}

export interface Connection {
  socketId: SocketId;
  sessionId: SessionId;
}

export type SocketId = string;
export type SessionId = string;
export type RoomCode = string;

export type Answer = { user: User; value: AnswerValue };
export type AnswerValue = GuessAnswerValue | DrawingAnswerValue;

export type GuessAnswerValue = string;
export type DrawingAnswerValue = { objects: fabric.Object[] };

export function getChainIndex(
  room: PlayingRoom | MarkingRoom,
  sessionId: SessionId
) {
  const playerIndex = room.players.indexOf(sessionId);
  return (playerIndex + room.round) % room.players.length;
}
