const Shared = require("../shared");
const { Pad } = require("./Pad");
const { component, div } = require("./react");

module.exports = {
  MarkingRound,
};

function MarkingRound({ room, user, submitMarking, onFinished }) {
  const finished = room.finished.indexOf(user.sessionId) > -1;

  // prettier-ignore
  return div('content marking', {},
    div('marking_title', {}, 'Marking'),
    finished && div('marking_explanation', {}, 'Waiting for other players to finish marking'),
    !finished && div('marking_chains', {},
      room.chains.map((chain, chainIndex) =>
        div('marking_chain', { key: chainIndex },
          chain.map((answer, roundIndex) => {
            if (answer == null) return null;

            const playerIndex = Shared.getPlayerIndex(room, user.sessionId);
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

              answer.user.sessionId === user.sessionId ? null :
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
