module.exports = {
  getChainIndex,
};

function getChainIndex(room, sessionId) {
  const player = room.players.find((p) => p.sessionId === sessionId);
  const playerIndex = room.players.indexOf(player);
  return (playerIndex + room.round) % room.players.length;
}
