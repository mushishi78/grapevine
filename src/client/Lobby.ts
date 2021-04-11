import { LobbyRoom } from "../shared";
import { div, bold, button } from "./react";

interface Props {
  room: LobbyRoom;
  start: () => void;
}

export function Lobby({ room, start }: Props) {
  const playerMin = 3;
  const canStart = room.connections.length >= playerMin;

  // prettier-ignore
  return div('content lobby', {},
    div('game-explanation', {}, `
      A drawing guessing game where players must try to draw a clue, then
      the next player tries to guess the clue and the next player tries
      to draw their guess and so on. See how far away from the original
      clue the chain of guesses gets and hilarity ensues.
    `),
    canStart && (
      button('start-button', start, {}, 'Start')),
    !canStart && (
      div('waiting', {}, 'Need at least ', bold(playerMin), ' players to start')
    ))
}
