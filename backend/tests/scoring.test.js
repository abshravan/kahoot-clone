const { calculateScore, rankLeaderboard } = require('../src/utils/scoring');

describe('calculateScore', () => {
  test('awards zero for a wrong answer regardless of speed', () => {
    expect(calculateScore({ correct: false, timeTaken: 0, timeLimit: 20 })).toBe(0);
    expect(calculateScore({ correct: false, timeTaken: 5, timeLimit: 20 })).toBe(0);
  });

  test('awards maximum for an instant correct answer', () => {
    expect(calculateScore({ correct: true, timeTaken: 0, timeLimit: 20 })).toBe(1000);
  });

  test('decreases linearly with time taken', () => {
    expect(calculateScore({ correct: true, timeTaken: 10, timeLimit: 20 })).toBe(500);
    expect(calculateScore({ correct: true, timeTaken: 5, timeLimit: 20 })).toBe(750);
  });

  test('clamps at zero (never negative)', () => {
    expect(calculateScore({ correct: true, timeTaken: 100, timeLimit: 120 })).toBe(0);
  });

  test('clamps timeTaken to timeLimit', () => {
    expect(calculateScore({ correct: true, timeTaken: 999, timeLimit: 5 })).toBe(750);
  });

  test('handles invalid input gracefully', () => {
    expect(calculateScore({ correct: true, timeTaken: NaN, timeLimit: 20 })).toBe(1000);
  });
});

describe('rankLeaderboard', () => {
  test('sorts by score desc, then name asc', () => {
    const scores = new Map([
      ['a', 300],
      ['b', 500],
      ['c', 500],
    ]);
    const players = [
      { id: 'a', name: 'Alice' },
      { id: 'b', name: 'Zoe' },
      { id: 'c', name: 'Bob' },
    ];
    const rows = rankLeaderboard(scores, players);
    expect(rows.map((r) => r.name)).toEqual(['Bob', 'Zoe', 'Alice']);
  });

  test('ignores scores for unknown players', () => {
    const scores = new Map([['ghost', 100]]);
    expect(rankLeaderboard(scores, [])).toEqual([]);
  });
});
