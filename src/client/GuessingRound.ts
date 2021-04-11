import {
  AnswerValue,
  getChainIndex,
  getMissingSessionIds,
  PlayingRoom,
  User,
} from "../shared";
import { Pad } from "./Pad";
import { InputClue } from "./InputClue";
import { component, div } from "./react";
import { MissingPlayers } from "./MissingPlayers";

interface Props {
  room: PlayingRoom;
  user: User;
  submitAnswer: (answerValue: AnswerValue) => void;
  onNewGame: () => void;
}

export function GuessingRound({ room, user, submitAnswer, onNewGame }: Props) {
  const chainIndex = getChainIndex(room, user.sessionId);
  const chain = room.chains[chainIndex];
  const previousAnswer = chain[room.round - 1];
  const answerSubmitted = chain[room.round] != null;
  const fabricObjects =
    previousAnswer != null && typeof previousAnswer.value !== "string"
      ? previousAnswer.value
      : null;

  const missingSessionIds = getMissingSessionIds(room);
  if (missingSessionIds.length > 0) {
    return component(MissingPlayers, { room, missingSessionIds, onNewGame });
  }

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
