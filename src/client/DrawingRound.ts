import React from "react";
import { Pad, SetFabricObjects, FabricObjects } from "./Pad";
import { ColorPicker } from "./ColorPicker";
import { button, component, div, raw } from "./react";
import { MissingPlayers } from "./MissingPlayers";

import {
  getChainIndex,
  getMissingSessionIds,
  PlayingRoom,
  User,
} from "../shared";

interface Props {
  room: PlayingRoom;
  user: User;
  saveFabricObjects: SetFabricObjects;
  onNewGame: () => void;
}

export function DrawingRound({
  room,
  user,
  saveFabricObjects,
  onNewGame,
}: Props) {
  const [brushColor, setBrushColor] = React.useState("black");

  const chainIndex = getChainIndex(room, user.sessionId);
  const chain = room.chains[chainIndex];
  const previousAnswer = chain[room.round - 1];
  const currentAnswer = chain[room.round];
  const initialFabricObjects =
    currentAnswer != null && typeof currentAnswer.value !== "string"
      ? currentAnswer.value
      : null;

  const [fabricObjects, setFabricObjects] = React.useState(
    initialFabricObjects
  );

  function setAndSaveFabricObjects(fabricObjects: FabricObjects) {
    setFabricObjects(fabricObjects);
    saveFabricObjects(fabricObjects);
  }

  function undo() {
    const newLength = fabricObjects.objects.length - 1;
    const objects = fabricObjects.objects.slice(0, newLength);
    setAndSaveFabricObjects({ objects });
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
    component(Pad, { setFabricObject: setAndSaveFabricObjects, fabricObjects, brushColor }),
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
