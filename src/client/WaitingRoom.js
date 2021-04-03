const { div } = require("./react");

module.exports = {
  WaitingRoom,
};

function WaitingRoom({}) {
  // prettier-ignore
  return div('content waiting-room', {},
    div('waiting-room_title', {}, 'Game in progress'),
    div('waiting-room_explanation', {}, `
      There's currently a game in progress. Please wait until the game has finished
      so that you can join the next one.
    `))
}
