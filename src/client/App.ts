import React from "react";
import { Lobby } from "./Lobby";
import { Countdown } from "./Countdown";
import { WaitingRoom } from "./WaitingRoom";
import { InitialClue } from "./InitialClue";
import { DrawingRound } from "./DrawingRound";
import { GuessingRound } from "./GuessingRound";
import { MarkingRound } from "./MarkingRound";
import { Finished } from "./Finished";
import { Page, PageProps } from "./Page";
import { component, div } from "./react";
import { Socket } from "socket.io-client";

import {
  Answer,
  AnswerValue,
  CountdownRoom,
  Player,
  PlayingRoom,
  Room,
  RoomCode,
  User,
} from "../shared";

interface Props {
  socket: Socket;
  roomCode: RoomCode;
  user: User;
}

export function App(props: Props) {
  const [room, setRoom] = React.useState<Room>({ status: "connecting" });

  React.useEffect(() => {
    const { socket } = props;

    socket.on("connect", () => {
      console.log("Connected:", socket.id);
      socket.emit("join", props.roomCode, props.user);
    });

    socket.on("disconnect", () => {
      console.log("Disconnected");
      setRoom({ status: "connecting" });
    });

    socket.on("joined", (player: Player, room: Room) => {
      console.log("New player: ", player);
      setRoom(room);
    });

    socket.on("left", (player: Player, room: Room) => {
      console.log("Player left: ", player);
      setRoom(room);
    });

    socket.on("countdown", (room: CountdownRoom) => {
      console.log("Countdown :", room.count);
      setRoom(room);
    });

    socket.on("started", (room: Room) => {
      console.log("Game started: ", room);
      setRoom(room);
    });

    socket.on("cancelled", (room: Room) => {
      console.log("Cancelled: ", room);
      setRoom(room);
    });

    socket.on("answer-submitted", (room: Room, answer: Answer) => {
      console.log("Answer submitted: ", answer);
      setRoom(room);
    });

    socket.on("new-drawing-round", (room: Room) => {
      console.log("New drawing round");
      setRoom(room);
    });

    socket.on("tick", (room: PlayingRoom) => {
      console.log("Tick :", room.ticks);
      setRoom(room);
    });

    socket.on("new-guess-round", (room: Room) => {
      console.log("New guessing round");
      setRoom(room);
    });

    socket.on("marking-started", (room: Room) => {
      console.log("Marking started");
      setRoom(room);
    });

    socket.on("marking-submitted", (room: Room) => {
      console.log("Marking submitted");
      setRoom(room);
    });

    socket.on("finished-submitted", (room: Room) => {
      console.log("Finish submitted");
      setRoom(room);
    });

    socket.on("game-finished", (room: Room) => {
      console.log("Game finished");
      setRoom(room);
    });

    socket.on("returned-to-lobby", (room: Room) => {
      console.log("Returned to Loby");
      setRoom(room);
    });
  }, []);

  function start() {
    props.socket.emit("start", props.roomCode);
  }

  function cancel() {
    props.socket.emit("cancel", props.roomCode);
  }

  function submitAnswer(answerValue: AnswerValue) {
    if (room.status !== "playing") return;
    props.socket.emit("submit-answer", props.roomCode, room.round, answerValue);
  }

  function onNewPath(
    _newPath: fabric.Object,
    canvasObject: { objects: fabric.Object[] }
  ) {
    submitAnswer(canvasObject);
  }

  function submitMarking(
    chainIndex: number,
    roundIndex: number,
    value: number
  ) {
    props.socket.emit(
      "submit-marking",
      props.roomCode,
      chainIndex,
      roundIndex,
      value
    );
  }

  function onFinished() {
    props.socket.emit("submit-finished", props.roomCode);
  }

  function onReturnToLobby() {
    props.socket.emit("return-to-lobby", props.roomCode);
  }

  function content() {
    if (room.status === "connecting") return null;

    if (room.status === "lobby") return component(Lobby, { room, start });

    if (room.status === "countdown") {
      return component(Countdown, { room, cancel });
    }

    if (
      room.players.every(
        (player: Player) => player.sessionId !== props.user.sessionId
      )
    ) {
      return component(WaitingRoom, {});
    }

    if (room.status === "playing" && room.round === 0) {
      return component(InitialClue, { room, user: props.user, submitAnswer });
    }

    if (room.status === "playing" && room.round % 2 === 1) {
      return component(DrawingRound, {
        room,
        user: props.user,
        onNewPath,
      });
    }

    if (room.status === "playing" && room.round % 2 === 0) {
      return component(GuessingRound, { room, user: props.user, submitAnswer });
    }

    if (room.status === "marking") {
      return component(MarkingRound, {
        room,
        user: props.user,
        submitMarking,
        onFinished,
      });
    }

    if (room.status === "finished") {
      return component(Finished, { room, onReturnToLobby });
    }
  }

  if (room.status === "connecting") {
    // prettier-ignore
    return div('full-page', {},
      div('full-page-message', {}, 'Connecting....'));
  }

  return component<Omit<PageProps, "children">>(
    Page,
    { room, user: props.user },
    content()
  );
}
