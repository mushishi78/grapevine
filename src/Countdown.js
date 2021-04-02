const { div, button } = require("./react");

module.exports = {
  Countdown,
};

function Countdown({ room, cancel }) {
  // prettier-ignore
  return div('content countdown', {},
    div('countdown_explanation', {}, 'Game starting in'),
    div('countdown_count', {}, room.count),
    button('countdown_cancel', cancel, { }, 'Cancel'))
}
