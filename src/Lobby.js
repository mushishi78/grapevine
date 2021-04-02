const { div, bold } = require("./react");

module.exports = {
  Lobby,
};

function Lobby({ room, start }) {
  const playerMin = 3;
  const canStart = room.users.length >= playerMin;

  // prettier-ignore
  return div('content lobby', {},
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
