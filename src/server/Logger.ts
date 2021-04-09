import { RoomCode } from "../shared";

const verbose = true;

export type Log = (...messages: any[]) => void;

export class LoggableError extends Error {
  public messages: any[];
  constructor(...messages: any[]) {
    super(messages[0]);
    this.messages = messages;
  }
}

export function logError(log: Log, error: Error | string) {
  if (error instanceof LoggableError) {
    log(...error.messages);
    return;
  }

  if (typeof error === "string") {
    error = new Error(error);
  }

  console.error(error);
}

export function withLog(
  prefix: string,
  roomCode: RoomCode,
  fn: (log: Log) => void
) {
  const log: Log = (...messages) => {
    if (!verbose) return;
    console.log(new Date(), prefix, roomCode, ...messages);
  };

  try {
    fn(log);
  } catch (error) {
    logError(log, error);
  }
}
