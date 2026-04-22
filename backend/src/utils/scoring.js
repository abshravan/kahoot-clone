/**
 * Scoring rules:
 *   - Wrong or no answer: 0 points.
 *   - Correct answer: max(0, 1000 - timeTaken * 50), where timeTaken is in seconds.
 *   - timeTaken is clamped at [0, timeLimit].
 */
function calculateScore({ correct, timeTaken, timeLimit }) {
  if (!correct) return 0;
  const t = Math.max(0, Math.min(Number(timeTaken) || 0, Number(timeLimit) || 0));
  return Math.max(0, Math.round(1000 - t * 50));
}

function rankLeaderboard(scoresMap, players) {
  const playerById = new Map(players.map((p) => [p.id, p]));
  const rows = [];
  for (const [playerId, score] of scoresMap.entries()) {
    const p = playerById.get(playerId);
    if (!p) continue;
    rows.push({ playerId, name: p.name, score });
  }
  rows.sort((a, b) => b.score - a.score || a.name.localeCompare(b.name));
  return rows;
}

module.exports = { calculateScore, rankLeaderboard };
