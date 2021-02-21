const io = require("socket.io-client");
const React = require("react");
const ReactDom = require("react-dom");

window.addEventListener("load", () => {
  ReactDom.render(
    React.createElement(App, {}),
    document.querySelector("#root")
  );
});

function App() {
  const [room, setRoom] = React.useState({ status: "connecting" });

  React.useEffect(() => {
    // Todo: Redirect if pathname is less than 4 characters

    const socket = io();

    socket.on("connect", () => {
      console.log("Connected:", socket.id);
      socket.emit("join", location.pathname);
    });

    socket.on("disconnect", () => {
      console.log("Disconnected");
      setRoom({ status: "connecting" });
    });

    socket.on("joined", (newPlayerId, room) => {
      console.log("New player: ", newPlayerId);
      setRoom(room);
    });

    socket.on("left", (oldPlayerId, room) => {
      console.log("Player left: ", oldPlayerId);
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
          div('player', { key: player.id }, player.id))))
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
