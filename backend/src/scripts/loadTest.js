/* eslint-disable no-console */
/**
 * Load test: simulate N concurrent players in a live quiz session.
 *
 * Usage:
 *   node src/scripts/loadTest.js --pin 123456 --players 150
 *
 * Flow:
 *   1. Start backend + frontend as normal.
 *   2. Log in as host, launch a quiz, copy the 6-digit PIN.
 *   3. Run this script with that PIN. Bots connect and wait in the lobby.
 *   4. Host clicks "Start Game" on the host screen.
 *   5. Bots answer each question at a randomized delay.
 *   6. Script prints live stats and a final summary.
 */

const { io } = require('socket.io-client');

// -------- CLI args --------
function arg(name, fallback) {
  const idx = process.argv.indexOf(`--${name}`);
  if (idx === -1) return fallback;
  const v = process.argv[idx + 1];
  return v === undefined ? fallback : v;
}

const PIN = arg('pin');
const PLAYERS = parseInt(arg('players', '150'), 10);
const URL = arg('url', 'http://localhost:4000');
const STAGGER_MS = parseInt(arg('stagger-ms', '50'), 10);
const MIN_ANSWER_DELAY = parseInt(arg('min-delay', '1000'), 10);
const MAX_ANSWER_DELAY = parseInt(arg('max-delay', '8000'), 10);

if (!PIN) {
  console.error('Error: --pin is required.\n');
  console.error('Usage: node src/scripts/loadTest.js --pin 123456 [options]\n');
  console.error('Options:');
  console.error('  --players N       Number of simulated players (default 150)');
  console.error('  --url URL         Backend URL (default http://localhost:4000)');
  console.error('  --stagger-ms N    Gap between connections in ms (default 50)');
  console.error('  --min-delay N     Min answer delay ms (default 1000)');
  console.error('  --max-delay N     Max answer delay ms (default 8000)');
  process.exit(1);
}

// -------- Stats --------
const stats = {
  connected: 0,
  joined: 0,
  joinErrors: 0,
  questionsReceived: 0,
  answersSubmitted: 0,
  answersCorrect: 0,
  answersRejected: 0,
  disconnected: 0,
  gameStarted: false,
  gameEnded: false,
  startedAt: Date.now(),
  latencySamples: [],
};

function nowIso() {
  return new Date().toISOString().slice(11, 19);
}

function randomName(i) {
  const adjectives = ['Swift', 'Silent', 'Clever', 'Bold', 'Lucky', 'Fierce', 'Quiet', 'Sharp'];
  const nouns = ['Fox', 'Otter', 'Hawk', 'Lynx', 'Crab', 'Wolf', 'Moth', 'Eel'];
  const a = adjectives[Math.floor(Math.random() * adjectives.length)];
  const n = nouns[Math.floor(Math.random() * nouns.length)];
  return `${a}${n}${i}`;
}

function rand(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

// -------- Bot --------
function spawnBot(index) {
  const name = randomName(index);
  const socket = io(URL, {
    transports: ['websocket'],
    reconnection: false,
    timeout: 10_000,
  });

  socket.on('connect', () => {
    stats.connected += 1;
    const sentAt = Date.now();
    socket.emit('join_game', { pin: PIN, playerName: name }, (res) => {
      stats.latencySamples.push(Date.now() - sentAt);
      if (res?.ok) {
        stats.joined += 1;
      } else {
        stats.joinErrors += 1;
        if (stats.joinErrors <= 3) {
          console.log(`[${nowIso()}] join failed for ${name}: ${res?.error}`);
        }
        socket.disconnect();
      }
    });
  });

  socket.on('connect_error', (err) => {
    stats.joinErrors += 1;
    if (stats.joinErrors <= 3) {
      console.log(`[${nowIso()}] connect_error: ${err.message}`);
    }
  });

  socket.on('game_started', () => {
    stats.gameStarted = true;
  });

  socket.on('next_question', (payload) => {
    stats.questionsReceived += 1;
    const options = payload?.question?.options?.length || 4;
    const delay = rand(MIN_ANSWER_DELAY, Math.min(MAX_ANSWER_DELAY, payload.question.timeLimit * 1000 - 500));
    setTimeout(() => {
      const sentAt = Date.now();
      socket.emit(
        'submit_answer',
        {
          pin: PIN,
          questionId: payload.question.id,
          answer: rand(0, options - 1),
          timeTaken: (Date.now() - payload.startedAt) / 1000,
        },
        (res) => {
          stats.latencySamples.push(Date.now() - sentAt);
          if (res?.ok) {
            stats.answersSubmitted += 1;
            if (res.correct) stats.answersCorrect += 1;
          } else {
            stats.answersRejected += 1;
          }
        }
      );
    }, delay);
  });

  socket.on('game_ended', () => {
    stats.gameEnded = true;
    socket.disconnect();
  });

  socket.on('disconnect', () => {
    stats.disconnected += 1;
  });
}

// -------- Run --------
console.log(`\nKnowledge Stack load test`);
console.log(`  URL     : ${URL}`);
console.log(`  PIN     : ${PIN}`);
console.log(`  Players : ${PLAYERS}`);
console.log(`  Stagger : ${STAGGER_MS}ms between connections`);
console.log('');
console.log('Spawning bots… (host: click "Start Game" when ready)\n');

let spawned = 0;
const spawnTimer = setInterval(() => {
  if (spawned >= PLAYERS) {
    clearInterval(spawnTimer);
    return;
  }
  spawnBot(spawned);
  spawned += 1;
}, STAGGER_MS);

// Live stats
const statsTimer = setInterval(() => {
  const latencies = stats.latencySamples.slice(-500).sort((a, b) => a - b);
  const p50 = latencies[Math.floor(latencies.length * 0.5)] || 0;
  const p95 = latencies[Math.floor(latencies.length * 0.95)] || 0;
  const elapsed = ((Date.now() - stats.startedAt) / 1000).toFixed(0);
  console.log(
    `[${nowIso()}] +${elapsed}s | ` +
      `connected ${stats.connected}/${PLAYERS} | ` +
      `joined ${stats.joined} | ` +
      `Q received ${stats.questionsReceived} | ` +
      `answered ${stats.answersSubmitted} (✓ ${stats.answersCorrect}) | ` +
      `rejected ${stats.answersRejected} | ` +
      `errors ${stats.joinErrors} | ` +
      `p50 ${p50}ms p95 ${p95}ms`
  );
  if (stats.gameEnded && stats.disconnected >= stats.joined) {
    shutdown(0);
  }
}, 2000);

function shutdown(code = 0) {
  clearInterval(spawnTimer);
  clearInterval(statsTimer);

  const totalSec = ((Date.now() - stats.startedAt) / 1000).toFixed(1);
  const latencies = stats.latencySamples.sort((a, b) => a - b);
  const p50 = latencies[Math.floor(latencies.length * 0.5)] || 0;
  const p95 = latencies[Math.floor(latencies.length * 0.95)] || 0;
  const p99 = latencies[Math.floor(latencies.length * 0.99)] || 0;
  const max = latencies[latencies.length - 1] || 0;
  const correctRate = stats.answersSubmitted
    ? ((stats.answersCorrect / stats.answersSubmitted) * 100).toFixed(1)
    : '0.0';

  console.log('\n' + '─'.repeat(60));
  console.log('SUMMARY');
  console.log('─'.repeat(60));
  console.log(`Duration          : ${totalSec}s`);
  console.log(`Players spawned   : ${spawned}`);
  console.log(`Connected         : ${stats.connected}`);
  console.log(`Joined game       : ${stats.joined}`);
  console.log(`Join errors       : ${stats.joinErrors}`);
  console.log(`Questions seen    : ${stats.questionsReceived}`);
  console.log(`Answers submitted : ${stats.answersSubmitted}`);
  console.log(`Answers correct   : ${stats.answersCorrect} (${correctRate}%)`);
  console.log(`Answers rejected  : ${stats.answersRejected}`);
  console.log(`Disconnected      : ${stats.disconnected}`);
  console.log(`Game started      : ${stats.gameStarted}`);
  console.log(`Game ended        : ${stats.gameEnded}`);
  console.log(`Ack latency       : p50 ${p50}ms · p95 ${p95}ms · p99 ${p99}ms · max ${max}ms`);
  console.log('─'.repeat(60) + '\n');

  process.exit(code);
}

process.on('SIGINT', () => {
  console.log('\nShutting down…');
  shutdown(0);
});
