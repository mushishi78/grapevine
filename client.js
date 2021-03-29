const io = require("socket.io-client");
const React = require("react");
const ReactDom = require("react-dom");
const uuid = require("uuid");
const copyToClipboard = require("copy-to-clipboard");
const { Lobby } = require("./src/Lobby");
const { Countdown } = require("./src/Countdown");
const { WaitingRoom } = require("./src/WaitingRoom");
const { InitialClue } = require("./src/InitialClue");
const { DrawingRound } = require("./src/DrawingRound");
const { GuessingRound } = require("./src/GuessingRound");
const { MarkingRound } = require("./src/MarkingRound");
const { component, div, a, input, raw } = require("./src/react");

const editIcon = require("/eva-icons/fill/svg/edit.svg");
const copyIcon = require("/eva-icons/fill/svg/copy.svg");

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
  const [copied, setCopied] = React.useState(false);
  const [newRoomCode, setNewRoomCode] = React.useState("");
  const [showNewRoomCode, setShowNewRoomCode] = React.useState(false);

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

  React.useEffect(() => {
    if (!showNewRoomCode) return;
    document.querySelector(".edit-room-input").focus();
  }, [showNewRoomCode]);

  async function copy() {
    if (copied) return;
    copyToClipboard(location.href);
    setCopied(true);
    await timeout(1000);
    setCopied(false);
  }

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
      return component(FinishedRound, { room, onReturnToLobby });
    }
  }

  if (room.status === "connecting") {
    // prettier-ignore
    return div('full-page', {},
      div('full-page-message', {}, 'Connecting....'));
  }

  // prettier-ignore
  return div('page', {},
    div('row', {},
      div('room-code', {},
        div('room-label', {}, 'Room'),
        div('room-row', {},
          div('room-code-value', {}, room.roomCode),
          div('room-button edit', { onClick: () => setShowNewRoomCode(not) }, raw(editIcon)))),
      div('room-link', {},
        div('room-label', {}, 'Link'),
        div('room-row', {},
          a('room-link-value', location.href, {}, location.href),
          div('room-button copy', { onClick: () => copy() }, raw(copyIcon)),
          div(`room-link-copied ${copied}`, {},
            'Copied!'))),
    ),
    div(`edit-room-row ${showNewRoomCode}`, {},
      div('edit-room-title', {}, 'Enter Room'),
      input('edit-room-input', 'text', { value: newRoomCode, onChange: event => setNewRoomCode(event.target.value) }),
      div('edit-room-buttons', {},
        div('edit-room-button secondary', { onClick: () => setShowNewRoomCode(false) }, 'Cancel'),
        a('edit-room-button primary', `${location.origin}/${newRoomCode}`, {}, 'Go'))
    ),
    div('row', {},
      div('user', {},
        div('user-label', {}, 'You'),
        div(`user-circle ${props.user.color}`, {},
          div(`user-icon`, {}, props.user.icon))),
      div('players', {},
        div('players-label', {}, 'Players'),
        div('players-row', {},
          room.users.map(player =>
            div(`player-circle ${player.color}`, { key: player.socketId },
              div('player-icon', {}, player.icon)))))
    ),
    content()
  )
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

function timeout(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function not(b) {
  return !b;
}
