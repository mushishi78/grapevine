const io = require("socket.io-client");
const React = require("react");
const ReactDom = require("react-dom");
const uuid = require("uuid");
const { Lobby } = require("./src/Lobby");
const { Countdown } = require("./src/Countdown");
const { WaitingRoom } = require("./src/WaitingRoom");
const { InitialClue } = require("./src/InitialClue");
const { DrawingRound } = require("./src/DrawingRound");
const { GuessingRound } = require("./src/GuessingRound");
const { MarkingRound } = require("./src/MarkingRound");
const { Finished } = require("./src/Finished");
const { Page } = require("./src/Page");
const { component, div } = require("./src/react");

window.addEventListener("load", () => {
  const roomCode = getRoomCode();
  const socket = io();
  const user = {
    sessionId: getSessionId(),
    icon: getUserIcon(),
    color: getUserColor(),
  };

  ReactDom.render(
    React.createElement(App, {
      roomCode,
      socket,
      user,
    }),
    document.querySelector("#root")
  );
});

function App(props) {
  const [room, setRoom] = React.useState({ status: "connecting" });

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

    socket.on("joined", (player, room) => {
      console.log("New player: ", player);
      setRoom(room);
    });

    socket.on("left", (player, room) => {
      console.log("Player left: ", player);
      setRoom(room);
    });

    socket.on("countdown", (room) => {
      console.log("Countdown :", room.count);
      setRoom(room);
    });

    socket.on("started", (room) => {
      console.log("Game started: ", room);
      setRoom(room);
    });

    socket.on("cancelled", (room) => {
      console.log("Cancelled: ", room);
      setRoom(room);
    });

    socket.on("answer-submitted", (room, answer) => {
      console.log("Answer submitted: ", answer);
      setRoom(room);
    });

    socket.on("new-drawing-round", (room) => {
      console.log("New drawing round");
      setRoom(room);
    });

    socket.on("tick", (room) => {
      console.log("Tick :", room.ticks);
      setRoom(room);
    });

    socket.on("new-guess-round", (room) => {
      console.log("New guessing round");
      setRoom(room);
    });

    socket.on("marking-started", (room) => {
      console.log("Marking started");
      setRoom(room);
    });

    socket.on("marking-submitted", (room) => {
      console.log("Marking submitted");
      setRoom(room);
    });

    socket.on("finished-submitted", (room) => {
      console.log("Finish submitted");
      setRoom(room);
    });

    socket.on("game-finished", (room) => {
      console.log("Game finished");
      setRoom(room);
    });

    socket.on("returned-to-lobby", (room) => {
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

  function submitAnswer(answerValue) {
    if (answerValue == null) return;
    props.socket.emit("submit-answer", props.roomCode, room.round, answerValue);
  }

  function onNewPath(newPath, canvasObject) {
    submitAnswer(canvasObject);
  }

  function submitMarking(chainIndex, roundIndex, value) {
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
    if (room.status === "lobby") return component(Lobby, { room, start });

    if (room.status === "countdown") {
      return component(Countdown, { room, cancel });
    }

    if (
      room.players.every((player) => player.sessionId !== props.user.sessionId)
    ) {
      return component(WaitingRoom, {});
    }

    if (room.status === "playing" && room.round === 0) {
      return component(InitialClue, { room, user: props.user, submitAnswer });
    }

    if (room.status === "playing" && room.round % 2 === 1) {
      return component(DrawingRound, { room, user: props.user, onNewPath });
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

  return component(Page, { room, user: props.user }, content());
}

//
// Domain helpers

function getRoomCode() {
  if (location.pathname.length > 5) return location.pathname.slice(1);
  const roomCode = makeRoomCode();
  history.pushState({}, null, `/${roomCode}`);
  return roomCode;
}

function makeRoomCode() {
  return buildArray(6, () =>
    getRandomMember("ABCDEFGHIJKLMNOPQRSTUVWXYZ")
  ).join("");
}

function getSessionId() {
  return readFromSessionWithDefault("sessionId", () => uuid.v1());
}

function getUserIcon() {
  return readFromSessionWithDefault("userIcon", () =>
    getRandomMember([
      "🐱",
      "🐭",
      "🐹",
      "🐰",
      "🦊",
      "🐻",
      "🐼",
      "🐨",
      "🐯",
      "🦁",
      "🐮",
      "🐷",
      "🐸",
      "🐵",
    ])
  );
}

function getUserColor() {
  return readFromSessionWithDefault("userColor", () =>
    getRandomMember(["red", "blue", "green", "magenta", "cyan", "yellow"])
  );
}

function readFromSessionWithDefault(key, createDefault) {
  let value = sessionStorage.getItem(key);

  if (value == null) {
    value = createDefault();
    sessionStorage.setItem(key, value);
  }

  return value;
}

function getRandomMember(array) {
  return array[Math.floor(Math.random() * array.length)];
}

function buildArray(length, fn) {
  return Array(length)
    .fill(null)
    .map((_, index) => fn(index));
}
