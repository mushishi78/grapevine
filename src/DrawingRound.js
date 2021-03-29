const React = require("react");
const Shared = require("../shared");
const { Pad } = require("./Pad");
const { ColorPicker } = require("./ColorPicker");
const { component, div } = require("./react");

module.exports = {
  DrawingRound,
};

function DrawingRound({ room, user, onNewPath }) {
  const [brushColor, setBrushColor] = React.useState("black");

  const chainIndex = Shared.getChainIndex(room, user.sessionId);
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
    component(Pad, { onNewPath, fabricObjects, brushColor }),
    div('row', {},
      component(ColorPicker, { brushColor, setBrushColor })))
}
