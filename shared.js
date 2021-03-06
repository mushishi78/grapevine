module.exports = {
  getChainIndex,
  getPlayerIndex,
};

function getPlayerIndex(room, sessionId) {
  const player = room.players.find((p) => p.sessionId === sessionId);
  const playerIndex = room.players.indexOf(player);
  return playerIndex;
}

function getChainIndex(room, sessionId) {
  const playerIndex = getPlayerIndex(room, sessionId);
  return (playerIndex + room.round) % room.players.length;
}
