const io = require("socket.io-client");
const React = require("react");
const ReactDom = require("react-dom");
const uuid = require("uuid");
const copyToClipboard = require("copy-to-clipboard");
const { fabric } = require("fabric");
const Shared = require("./shared");

const editIcon = require("/eva-icons/fill/svg/edit.svg");
const copyIcon = require("/eva-icons/fill/svg/copy.svg");
const checkmarkIcon = require("/eva-icons/fill/svg/checkmark.svg");

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
    props.socket.emit("submit-answer", props.roomCode, answerValue);
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
    if (room.status === "lobby") {
      const playerMin = 3;
      const canStart = room.users.length >= playerMin;

      // prettier-ignore
      return div('content lobby', {},
        div('game_title', {}, 'Grapevine'),
        div('game-explanation', {}, `
          A drawing guessing game where players must try to draw a clue, then
          the next player tries to guess the clue and the next player tries
          to draw their guess and so on. See how far away from the original
          clue the chain of guesses gets and hilarity ensues.
        `),
        canStart && (
          div('start-button', { onClick: start }, 'Start')),
        !canStart && (
          div('waiting', {}, 'Need at least ', bold(playerMin), ' players to Start')
        ))
    }

    if (room.status === "countdown") {
      // prettier-ignore
      return div('content countdown', {},
        div('countdown_explanation', {}, 'Game starting in'),
        div('countdown_count', {}, room.count),
        div('countdown_cancel', { onClick: cancel }, 'Cancel'))
    }

    if (room.status === "playing" && room.round === 0) {
      const chainIndex = Shared.getChainIndex(room, props.user.sessionId);
      const answerSubmitted = room.chains[chainIndex][room.round] != null;

      if (answerSubmitted) {
        // prettier-ignore
        return div('content initial-clue', {},
          div('initial-clue_title', {}, 'Initial Clue'),
          div('initial-clue_explanation', {}, `
            Clue submitted waiting for other players
          `))
      }

      // prettier-ignore
      return div('content initial-clue', {},
        div('initial-clue_title', {}, 'Initial Clue'),
        div('initial-clue_explanation', {}, `
          Please think of an initial clue to start the game.
          Your fellow team mate will be asked to draw it, so think hard!
        `),
        component(InputClue, { onConfirm: submitAnswer }))
    }

    if (room.status === "playing" && room.round % 2 === 1) {
      const chainIndex = Shared.getChainIndex(room, props.user.sessionId);
      const chain = room.chains[chainIndex];
      const previousAnswer = chain[room.round - 1];
      const currentAnswer = chain[room.round];
      const fabricObjects = currentAnswer != null ? currentAnswer.value : null;

      // prettier-ignore
      return div('content drawing', {},
        div('row clue_and_count', {},
          div('drawing_clue', {},
            div('drawing_clue_label', {}, "Clue"),
            div('drawing_clue_value', {}, previousAnswer.value)),
          div('drawing_count', {},
            div('drawing_count_label', {}, "Count"),
            div('drawing_count_value', {}, room.ticks))
        ),
        component(Pad, { onNewPath, fabricObjects }))
    }

    if (room.status === "playing" && room.round % 2 === 0) {
      const chainIndex = Shared.getChainIndex(room, props.user.sessionId);
      const chain = room.chains[chainIndex];
      const previousAnswer = chain[room.round - 1];
      const answerSubmitted = chain[room.round] != null;
      const fabricObjects =
        previousAnswer != null ? previousAnswer.value : null;

      if (answerSubmitted) {
        // prettier-ignore
        return div('content guess', {},
          div('guess_title', {}, 'Guess'),
          div('guess_explanation', {}, `
            Guess submitted waiting for other players
          `))
      }

      // prettier-ignore
      return div('content guess', {},
        component(Pad, { fabricObjects }),
        div('guess_title', {}, 'Guess'),
        component(InputClue, { onConfirm: submitAnswer }))
    }

    if (room.status === "marking") {
      const finished = room.finished.indexOf(props.user.sessionId) > -1;

      // prettier-ignore
      return div('content marking', {},
        div('marking_title', {}, 'Marking'),
        finished && div('marking_explanation', {}, 'Waiting for other players to finish marking'),
        !finished && div('marking_chains', {},
          room.chains.map((chain, chainIndex) =>
            div('marking_chain', { key: chainIndex },
              chain.map((answer, roundIndex) => {
                if (answer == null) return null;

                const playerIndex = Shared.getPlayerIndex(room, props.user.sessionId);
                const marking = room.markings[playerIndex][chainIndex][roundIndex];
                const marked = marking != null ? 'marked' : ''
                const downMarked = marking === -1 ? 'selected' : marking === 1 ? 'not-selected' : ''
                const upMarked = marking === 1 ? 'selected' : marking === -1 ? 'not-selected' : ''
                const onDown = () => submitMarking(chainIndex, roundIndex, -1)
                const onUp = () => submitMarking(chainIndex, roundIndex, 1)

                return div(`marking_answer ${answer.user.color} ${marked}`, { key: roundIndex },
                  div(`answer_user-circle ${answer.user.color}`, {},
                    div(`answer_user-icon`, {}, answer.user.icon)),
                  roundIndex % 2 == 0
                    ? div('answer_text', {}, answer.value)
                    : div('answer_drawing', {},
                      component(Pad, { fabricObjects: answer.value })),

                  answer.user.sessionId === props.user.sessionId ? null :
                    div('answer_buttons', {},
                      div(`answer_button down ${downMarked}`, { onClick: onDown }, '👎'),
                      div(`answer_button up ${upMarked}`, { onClick: onUp }, '👍'),
                    ))
              }),
              div('marking_spacer')
            ))
        ),
        !finished && div('marking_finished', { onClick: onFinished }, 'Finished')
      )
    }

    if (room.status === "finished") {
      const scores = {};

      // Calculate scores
      room.chains.forEach((chain, chainIndex) => {
        chain.forEach((answer, roundIndex) => {
          const { sessionId } = answer.user;
          let score = scores[sessionId] || 0;

          for (const marking of room.markings) {
            score += marking[chainIndex][roundIndex] || 0;
          }

          scores[sessionId] = score;
        });
      });

      // Sort players
      const players = room.players.slice(0);
      players.sort((a, b) => scores[b.sessionId] - scores[a.sessionId]);

      // prettier-ignore
      return div('content finished', {},
        div('finished_title', {}, 'Finished!'),
        div('podium', {},
          players.map(player =>
            div('finished_player', { key: player.sessionId },
              div(`finished_user-circle ${player.color}`, {},
                div(`finished_user-icon`, {}, player.icon)),
              div(`finished_score`, {}, scores[player.sessionId])))),
        div('finished_return', { onClick: onReturnToLobby }, 'Return to Lobby')
      )
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

function InputClue({ onConfirm }) {
  const [value, setValue] = React.useState("");

  React.useEffect(() => {
    document.querySelector(".InputClue_input").focus();
  }, []);

  function onKeyPress(event) {
    if (event.key === "Enter" && !event.shiftKey) {
      onConfirm(value);
    }
  }

  // prettier-ignore
  return div('InputClue', {},
    textarea('InputClue_input', { value, rows: 2, onChange: (event) => setValue(event.target.value), onKeyPress }),
    div('InputClue_confirm', { onClick: () => onConfirm(value) }, raw(checkmarkIcon)))
}

function Pad({ onNewPath, fabricObjects }) {
  const padRef = React.useRef();
  const canvasRef = React.useRef();

  React.useEffect(() => {
    const padElem = padRef.current;
    const canvasElem = padElem.querySelector(".Pad_canvas");
    canvasRef.current = new fabric.Canvas(canvasElem, {
      isDrawingMode: onNewPath != null,
      width: padElem.clientWidth,
      height: padElem.clientHeight,
    });

    canvasRef.current.freeDrawingBrush.width = 3;

    canvasRef.current.on("path:created", ({ path }) => {
      onNewPath(path.toObject(), canvasRef.current.toObject());
    });

    window.addEventListener("resize", onResize);

    if (fabricObjects != null) {
      fabricObjects.objects.forEach((o) => {
        o.selectable = false;
        o.hoverCursor = "auto";
      });
      canvasRef.current.loadFromJSON(fabricObjects);
      fitCanvasToObjects(canvasRef.current);
    }

    return () => {
      window.removeEventListener("resize", onResize);
    };
  }, []);

  function onResize() {
    const padElem = document.querySelector(".Pad");

    canvasRef.current.setDimensions({
      width: padElem.clientWidth,
      height: padElem.clientHeight,
    });
  }

  function fitCanvasToObjects(canvas) {
    const objects = canvas.getObjects();
    const objectsTop = getMin(objects.map((o) => o.top));
    const objectsLeft = getMin(objects.map((o) => o.left));
    const objectsRight = getMax(objects.map((o) => o.left + o.width));
    const objectsBottom = getMax(objects.map((o) => o.top + o.height));
    const scaleX = canvas.width / objectsRight;
    const scaleY = canvas.height / objectsBottom;
    const scale = Math.min(scaleX, scaleY);
    const zoom = canvas.getZoom() * scale;
    canvas.setViewportTransform([1, 0, 0, 1, objectsLeft, objectsTop]);
    canvas.setViewportTransform([zoom, 0, 0, zoom, 0, 0]);
  }

  // prettier-ignore
  return div("Pad", { ref: padRef },
    canvas("Pad_canvas"));
}

//
// React helpers

function component(component, ...children) {
  return React.createElement(component, ...children);
}

function div(className, props, ...children) {
  return React.createElement("div", { className, ...props }, ...children);
}

function a(className, href, props, ...children) {
  return React.createElement("a", { className, href, ...props }, ...children);
}

function img(className, src, props, ...children) {
  return React.createElement("img", { className, src, ...props }, ...children);
}

function input(className, type, props, ...children) {
  return React.createElement(
    "input",
    { className, type, ...props },
    ...children
  );
}

function textarea(className, props, ...children) {
  return React.createElement("textarea", { className, ...props }, ...children);
}

function raw(html) {
  return React.createElement("div", {
    dangerouslySetInnerHTML: { __html: html },
  });
}

function bold(...children) {
  return React.createElement("b", {}, ...children);
}

function canvas(className, props, ...children) {
  return React.createElement("canvas", { className, ...props }, ...children);
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

function getMin(values) {
  let min = values[0];

  for (const value of values) {
    if (value < min) min = value;
  }

  return min;
}

function getMax(values) {
  let max = values[0];

  for (const value of values) {
    if (value > max) max = value;
  }

  return max;
}
