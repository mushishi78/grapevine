import React from "react";
import {
  getChainIndex,
  getMissingSessionIds,
  PlayingRoom,
  User,
} from "../shared";
import { Pad } from "./Pad";
import { ColorPicker } from "./ColorPicker";
import { component, div } from "./react";
import { MissingPlayers } from "./MissingPlayers";

interface Props {
  room: PlayingRoom;
  user: User;
  onNewPath: (path: unknown) => void;
  onNewGame: () => void;
}

export function DrawingRound({ room, user, onNewPath, onNewGame }: Props) {
  const [brushColor, setBrushColor] = React.useState("black");

  const chainIndex = getChainIndex(room, user.sessionId);
  const chain = room.chains[chainIndex];
  const previousAnswer = chain[room.round - 1];
  const currentAnswer = chain[room.round];
  const fabricObjects =
    currentAnswer != null && typeof currentAnswer.value !== "string"
      ? currentAnswer.value
      : null;

  const missingSessionIds = getMissingSessionIds(room);
  if (missingSessionIds.length > 0) {
    return component(MissingPlayers, { room, missingSessionIds, onNewGame });
  }

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
    div('row tools-row', {},
      component(ColorPicker, { brushColor, setBrushColor })))
}
