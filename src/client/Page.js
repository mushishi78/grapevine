const React = require("react");
const copyToClipboard = require("copy-to-clipboard");
const { div, button, raw } = require("./react");
const { timeout } = require("./timeout");
const { not } = require("./boolean");

const editIcon = require("../../eva-icons/fill/svg/edit.svg");
const copyIcon = require("../../eva-icons/fill/svg/copy.svg");
const menuIcon = require("../../eva-icons/fill/svg/menu.svg");

module.exports = {
  Page,
};

function Page({ room, user, children }) {
  const [copied, setCopied] = React.useState(false);
  const [showMenu, setShowMenu] = React.useState(false);

  async function copy() {
    if (copied) return;
    copyToClipboard(location.href);
    setCopied(true);
    await timeout(1000);
    setCopied(false);
  }

  // prettier-ignore
  return div('page', {},
    div('row menu-row', {},
      div(`user-circle ${user.color}`, {},
        div(`user-icon`, {}, user.icon)),
      div('game_title', {}, 'Grapevine'),
      button('menu-button', () => setShowMenu(not), {},
        raw(menuIcon))
    ),
    div('players-row', {},
      room.users.map(player =>
        div(`player-circle ${player.color}`, { key: player.socketId },
          div('player-icon', {}, player.icon)))),

    children
  )
}
