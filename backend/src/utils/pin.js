const GameSession = require('../models/GameSession');

function generatePinCandidate() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

async function generateUniquePin() {
  for (let i = 0; i < 10; i++) {
    const pin = generatePinCandidate();
    const exists = await GameSession.exists({ pin, status: { $ne: 'ended' } });
    if (!exists) return pin;
  }
  throw new Error('Unable to allocate a unique PIN, try again');
}

module.exports = { generatePinCandidate, generateUniquePin };
