import { FinishedRoom } from "../shared";
import { div, button } from "./react";

interface Props {
  room: FinishedRoom;
  onReturnToLobby: () => void;
}

export function Finished({ room, onReturnToLobby }: Props) {
  const scores: { [sessionId: string]: number } = {};

  // Calculate scores
  room.chains.forEach((chain, chainIndex) => {
    chain.filter(Boolean).forEach((answer, roundIndex) => {
      const { sessionId } = answer.user;
      let score = scores[sessionId] || 0;

      for (const marking of room.markings) {
        score += marking[chainIndex][roundIndex] || 0;
      }

      scores[sessionId] = score;
    });
  });

  // Sort users
  const users = room.users.filter((u) => room.players.includes(u.sessionId));
  users.sort((a, b) => scores[b.sessionId] - scores[a.sessionId]);

  // prettier-ignore
  return div('content finished', {},
    div('finished_title', {}, 'Finished!'),
    div('podium', {},
      users.map(player =>
        div('finished_player', { key: player.sessionId },
          div(`finished_user-circle ${player.color}`, {},
            div(`finished_user-icon`, {}, player.icon)),
          div(`finished_score`, {}, scores[player.sessionId])))),
    button('finished_return', onReturnToLobby, {}, 'Return to Lobby')
  )
}
