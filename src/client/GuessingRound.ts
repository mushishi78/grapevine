import {
  AnswerValue,
  DrawingAnswerValue,
  getChainIndex,
  PlayingRoom,
  User,
} from "../shared";
import { Pad } from "./Pad";
import { InputClue } from "./InputClue";
import { component, div } from "./react";

interface Props {
  room: PlayingRoom;
  user: User;
  submitAnswer: (answerValue: AnswerValue) => void;
}

export function GuessingRound({ room, user, submitAnswer }: Props) {
  const chainIndex = getChainIndex(room, user.sessionId);
  const chain = room.chains[chainIndex];
  const previousAnswer = chain[room.round - 1];
  const answerSubmitted = chain[room.round] != null;
  const fabricObjects =
    previousAnswer != null && typeof previousAnswer.value !== "string"
      ? previousAnswer.value
      : null;

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
