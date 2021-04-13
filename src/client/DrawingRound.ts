import React from "react";
import {
  getChainIndex,
  getMissingSessionIds,
  PlayingRoom,
  User,
} from "../shared";
import { Pad, SetFabricObjects } from "./Pad";
import { ColorPicker } from "./ColorPicker";
import { button, component, div, raw } from "./react";
import { MissingPlayers } from "./MissingPlayers";

interface Props {
  room: PlayingRoom;
  user: User;
  setFabricObject: SetFabricObjects;
  onNewGame: () => void;
}

export function DrawingRound({
  room,
  user,
  setFabricObject,
  onNewGame,
}: Props) {
  const [brushColor, setBrushColor] = React.useState("black");

  const chainIndex = getChainIndex(room, user.sessionId);
  const chain = room.chains[chainIndex];
  const previousAnswer = chain[room.round - 1];
  const currentAnswer = chain[room.round];
  const fabricObjects =
    currentAnswer != null && typeof currentAnswer.value !== "string"
      ? currentAnswer.value
      : null;

  function undo() {
    setFabricObject({
      objects: fabricObjects.objects.slice(0, fabricObjects.objects.length - 1),
    });
  }

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
    component(Pad, { setFabricObject, fabricObjects, brushColor }),
    div('row tools-row', {},
      component(ColorPicker, { brushColor, setBrushColor }),
      button('undo', undo, {}, raw(undoIcon))))
}

const undoIcon = `
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">
    <rect width="24" height="24" transform="rotate(-90 12 12)" opacity="0"/>
    <path d="M20.22 21a1 1 0 0 1-1-.76 8.91 8.91 0 0 0-7.8-6.69v1.12a1.78 1.78 0 0 1-1.09 1.64A2 2 0 0 1 8.18 16l-5.06-4.41a1.76 1.76 0 0 1 0-2.68l5.06-4.42a2 2 0 0 1 2.18-.3 1.78 1.78 0 0 1 1.09 1.64V7A10.89 10.89 0 0 1 21.5 17.75a10.29 10.29 0 0 1-.31 2.49 1 1 0 0 1-1 .76z"/>
  </svg>
`;
