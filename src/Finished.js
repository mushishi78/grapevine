const { div } = require("./react");

module.exports = {
  FinishedRound,
};

function FinishedRound({ room, onReturnToLobby }) {
  const scores = {};

  // Calculate scores
  room.chains.forEach((chain, chainIndex) => {
    chain.forEach((answer, roundIndex) => {
      const { sessionId } = answer.user;
      let score = scores[sessionId] || 0;

      for (const marking of room.markings) {
        score += marking[chainIndex][roundIndex] || 0;
      }

      scores[sessionId] = score;
    });
  });

  // Sort players
  const players = room.players.slice(0);
  players.sort((a, b) => scores[b.sessionId] - scores[a.sessionId]);

  // prettier-ignore
  return div('content finished', {},
    div('finished_title', {}, 'Finished!'),
    div('podium', {},
      players.map(player =>
        div('finished_player', { key: player.sessionId },
          div(`finished_user-circle ${player.color}`, {},
            div(`finished_user-icon`, {}, player.icon)),
          div(`finished_score`, {}, scores[player.sessionId])))),
    div('finished_return', { onClick: onReturnToLobby }, 'Return to Lobby')
  )
}
