const io = require("socket.io-client");
const React = require("react");
const ReactDom = require("react-dom");
const uuid = require("uuid");
const copyToClipboard = require("copy-to-clipboard");

const plusIcon = require("/eva-icons/fill/svg/plus.svg");
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
  }, []);

  async function copy() {
    if (copied) return;
    copyToClipboard(location.href);
    setCopied(true);
    await timeout(1000);
    setCopied(false);
  }

  if (room.status === "connecting") {
    // prettier-ignore
    return div('full-page', {},
      div('full-page-box', {},
        div('full-page-message', {}, 'Connecting....')));
  }

  if (room.status === "loby") {
    // prettier-ignore
    return div('loby', {},
      div('row', {},
        div('room-code', {},
          div('room-label', {}, 'Room'),
          div('room-row', {},
            div('room-code-value', {}, room.roomCode),
            div('room-button new', {}, raw(plusIcon)))),
        div('room-link', {},
          div('room-label', {}, 'Link'),
          div('room-row', {},
            a('room-link-value', location.href, {}, location.href),
            div('room-button copy', { onClick: () => copy() }, raw(copyIcon)),
            div(`room-link-copied ${copied}`, {},
              'Copied!'))),
      ),
      div('row', {},
        div('user', {},
          div('user-label', {}, 'You'),
          div(`user-circle ${props.user.color}`, {},
            div(`user-icon`, {}, props.user.icon))),
        div('players', {},
          div('players-label', {}, 'Players'),
          div('players-row', {},
            room.players.map(player =>
              div(`player-circle ${player.color}`, { key: player.socketId },
                div('player-icon', {}, player.icon)))))
      )
    )
  }
}

//
// React helpers

function div(className, props, ...children) {
  return React.createElement("div", { className, ...props }, ...children);
}

function a(className, href, props, ...children) {
  return React.createElement("a", { className, href, ...props }, ...children);
}

function img(className, src, props, ...children) {
  return React.createElement("img", { className, src, ...props }, ...children);
}

function raw(html) {
  return React.createElement("div", {
    dangerouslySetInnerHTML: { __html: html },
  });
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
