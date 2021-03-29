const Shared = require("../shared");
const { InputClue } = require("./InputClue");
const { component, div } = require("./react");

module.exports = {
  InitialClue,
};

function InitialClue({ room, user, submitAnswer }) {
  const chainIndex = Shared.getChainIndex(room, user.sessionId);
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
