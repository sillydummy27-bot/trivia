import { config } from './config.js';

const STORAGE_KEY = 'little-chemistry-submissions-v1';
let memoryQueue = [];
let sending = false;
let storageUnavailable = false;

function readQueue() {
  if (storageUnavailable) return memoryQueue;
  try { const value = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]'); return Array.isArray(value) ? value : []; }
  catch { storageUnavailable = true; return memoryQueue; }
}
function writeQueue(queue) {
  memoryQueue = queue;
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(queue)); } catch { storageUnavailable = true; }
}

export function submitCompletedGame(payload) {
  const queue = readQueue();
  if (!queue.some(entry => entry.payload?.playId === payload.playId)) {
    queue.push({ payload, attempts: 0, queuedAt: Date.now(), status: 'pending' });
    writeQueue(queue);
  }
  retryPendingSubmissions();
}

export async function retryPendingSubmissions() {
  if (sending) return;
  const cutoff = Date.now() - config.submissionRetentionDays * 86400000;
  writeQueue(readQueue().filter(entry => entry.queuedAt > cutoff && entry.payload?.playId));
  if (!config.submissionUrl) {
    console.info('Response collection is inactive. Set submissionUrl in config.js to your Apps Script /exec URL.');
    return;
  }
  let endpoint;
  try {
    endpoint = new URL(config.submissionUrl);
    if (endpoint.protocol !== 'https:' || endpoint.hostname !== 'script.google.com' || !endpoint.pathname.endsWith('/exec')) throw new Error();
  } catch { console.error('Use a deployed https://script.google.com/.../exec submission URL.'); return; }
  if (!navigator.onLine) return;
  sending = true;
  try {
    // One attempt per queued item per call; later page visits may retry unconfirmed sends.
    const candidates = readQueue().filter(entry => entry.attempts < config.maxSubmissionAttempts);
    for (const candidate of candidates) {
      const queue = readQueue();
      const entry = queue.find(item => item.payload.playId === candidate.payload.playId);
      if (!entry) continue;
      entry.attempts += 1;
      entry.status = 'unconfirmed';
      writeQueue(queue);
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 12000);
      try {
        await fetch(endpoint.href, {
          method: 'POST', mode: 'no-cors', credentials: 'omit',
          headers: { 'Content-Type': 'text/plain;charset=UTF-8' },
          body: JSON.stringify(entry.payload), keepalive: true, signal: controller.signal,
        });
        // An opaque response cannot prove a successful Sheets write. Keep for bounded retries.
      } catch (error) { console.warn('Response submission could not be confirmed; it may retry on a later visit.', error); }
      finally { clearTimeout(timeout); }
    }
  } finally { sending = false; }
}
