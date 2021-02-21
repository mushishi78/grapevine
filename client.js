const io = require("socket.io-client");
const React = require("react");
const ReactDom = require("react-dom");
const uuid = require("uuid");

window.addEventListener("load", () => {
  ReactDom.render(
    React.createElement(App, {}),
    document.querySelector("#root")
  );
});

function App() {
  const [room, setRoom] = React.useState({ status: "connecting" });

  React.useEffect(() => {
    const sessionId = getSessionId();
    const roomCode = getRoomCode();
    const socket = io();

    socket.on("connect", () => {
      console.log("Connected:", socket.id);
      socket.emit("join", roomCode, sessionId);
    });

    socket.on("disconnect", () => {
      console.log("Disconnected");
      setRoom({ status: "connecting" });
    });

    socket.on("joined", (sessionId, room) => {
      console.log("New player: ", sessionId);
      setRoom(room);
    });

    socket.on("left", (sessionId, room) => {
      console.log("Player left: ", sessionId);
      setRoom(room);
    });
  }, []);

  if (room.status === "connecting") {
    // prettier-ignore
    return div('full-page', {},
      div('full-page-box', {},
        div('full-page-message', {}, 'Connecting....')));
  }

  if (room.status === "loby") {
    // prettier-ignore
    return div('loby', {},
      div('players', {},
        room.players.map(player =>
          div('player', { key: player.sessionId }, player.sessionId))))
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

//
// Domain helpers

function getRoomCode() {
  if (location.pathname.length > 5) return location.pathname.slice(1);
  const roomCode = makeRoomCode(6);
  history.pushState({}, null, `/${roomCode}`);
  return roomCode;
}

function makeRoomCode(length) {
  var result = "";
  const characters = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
  for (var i = 0; i < length; i++) {
    result += characters.charAt(Math.floor(Math.random() * characters.length));
  }
  return result;
}

function getSessionId() {
  let sessionId = sessionStorage.getItem("sessionId");

  if (sessionId == null) {
    sessionId = uuid.v1();
    sessionStorage.setItem("sessionId", sessionId);
  }

  return sessionId;
}
