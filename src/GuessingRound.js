const Shared = require("../shared");
const { Pad } = require("./Pad");
const { component, div } = require("./react");

module.exports = {
  GuessingRound,
};

function GuessingRound({ room, user, submitAnswer }) {
  const chainIndex = Shared.getChainIndex(room, user.sessionId);
  const chain = room.chains[chainIndex];
  const previousAnswer = chain[room.round - 1];
  const answerSubmitted = chain[room.round] != null;
  const fabricObjects = previousAnswer != null ? previousAnswer.value : null;

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
