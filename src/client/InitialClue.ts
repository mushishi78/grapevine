import { AnswerValue, getChainIndex, PlayingRoom, User } from "../shared";
import { InputClue } from "./InputClue";
import { component, div } from "./react";

interface Props {
  room: PlayingRoom;
  user: User;
  submitAnswer: (answer: AnswerValue) => void;
}

export function InitialClue({ room, user, submitAnswer }: Props) {
  const chainIndex = getChainIndex(room, user.sessionId);
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
