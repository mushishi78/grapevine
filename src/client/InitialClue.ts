import { InputClue } from "./InputClue";
import { MissingPlayers } from "./MissingPlayers";
import { component, div } from "./react";

import {
  AnswerValue,
  getChainIndex,
  getMissingSessionIds,
  PlayingRoom,
  User,
} from "../shared";

interface Props {
  room: PlayingRoom;
  user: User;
  submitAnswer: (answer: AnswerValue) => void;
  onNewGame: () => void;
}

export function InitialClue({ room, user, submitAnswer, onNewGame }: Props) {
  const chainIndex = getChainIndex(room, user.sessionId);
  const answerSubmitted = room.chains[chainIndex][room.round] != null;

  const missingSessionIds = getMissingSessionIds(room);
  if (missingSessionIds.length > 0) {
    return component(MissingPlayers, { room, missingSessionIds, onNewGame });
  }

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
