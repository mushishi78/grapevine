const React = require("react");
const copyToClipboard = require("copy-to-clipboard");
const { div, a, input, raw } = require("./react");
const { timeout } = require("./timeout");
const { not } = require("./boolean");

const editIcon = require("../eva-icons/fill/svg/edit.svg");
const copyIcon = require("../eva-icons/fill/svg/copy.svg");

module.exports = {
  Page,
};

function Page({ room, user, children }) {
  const [showNewRoomCode, setShowNewRoomCode] = React.useState(false);
  const [newRoomCode, setNewRoomCode] = React.useState("");
  const [copied, setCopied] = React.useState(false);

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
        div(`user-circle ${user.color}`, {},
          div(`user-icon`, {}, user.icon))),
      div('players', {},
        div('players-label', {}, 'Players'),
        div('players-row', {},
          room.users.map(player =>
            div(`player-circle ${player.color}`, { key: player.socketId },
              div('player-icon', {}, player.icon)))))
    ),
    children
  )
}
