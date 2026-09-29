import { submitCompletedGame, retryPendingSubmissions } from './submission.js';

const screenIds = ['intro', 'question-1', 'question-2', 'question-3', 'question-4', 'question-5', 'done'];
const game = document.querySelector('#game');
const progress = document.querySelector('#progress');
let currentIndex = 0;
let cleanup = () => {};
let answers = {};
let playId = newPlayId();
let navigationId = 0;
let activeStyle;

function newPlayId() {
  return crypto.randomUUID?.() ?? 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, c => {
    const n = crypto.getRandomValues(new Uint8Array(1))[0] % 16;
    return (c === 'x' ? n : (n & 3) | 8).toString(16);
  });
}

function updateProgress(index) {
  progress.replaceChildren();
  if (index === 0) return;
  for (let n = 1; n <= 5; n += 1) {
    const dot = document.createElement('span');
    dot.className = `progress-step ${n < index ? 'is-complete' : n === index ? 'is-current' : ''}`;
    dot.textContent = n < index ? '✓' : String(n).padStart(2, '0');
    if (n === index) dot.setAttribute('aria-current', 'step');
    progress.append(dot);
  }
  progress.setAttribute('aria-label', index === 6 ? 'All five questions complete' : `Question ${index} of 5`);
}

async function showScreen(index) {
  const requestId = ++navigationId;
  cleanup();
  cleanup = () => {};
  game.setAttribute('aria-busy', 'true');
  const id = screenIds[index];
  const folder = new URL(`./screens/${id}/`, import.meta.url);
  const style = document.createElement('link');
  style.rel = 'stylesheet';
  style.href = new URL('style.css', folder).href;
  const styleReady = new Promise((resolve, reject) => {
    style.onload = resolve;
    style.onerror = () => reject(new Error(`Could not load styles for ${id}`));
  });
  document.head.append(style);
  try {
    const [response, module] = await Promise.all([
      fetch(new URL('index.html', folder)),
      import(new URL('script.js', folder).href),
      styleReady,
    ]);
    if (!response.ok) throw new Error(`Could not load ${id}: ${response.status}`);
    const html = await response.text();
    if (requestId !== navigationId) { style.remove(); return; }
    activeStyle?.remove();
    activeStyle = style;
    currentIndex = index;
    game.innerHTML = html;
    updateProgress(index);
    let completed = false;
    cleanup = module.mount(game, {
      answers: structuredClone(answers),
      start: () => { if (!completed) { completed = true; showScreen(1); } },
      complete: answer => {
        if (completed || currentIndex !== index || index < 1 || index > 5) return;
        completed = true;
        answers[id] = answer;
        if (index === 5) {
          submitCompletedGame({ version: 1, playId, completedAt: new Date().toISOString(), answers: structuredClone(answers) });
        }
        showScreen(index + 1);
      },
      replay: () => {
        if (completed) return;
        completed = true;
        answers = {};
        playId = newPlayId();
        showScreen(0);
      },
    }) || (() => {});
    game.classList.remove('screen-enter');
    void game.offsetWidth;
    game.classList.add('screen-enter');
    document.title = index === 0 ? 'A little chemistry — a game for two' : index === 6 ? 'A little chemistry — you made it' : `Question ${index} — A little chemistry`;
    if (index > 0) game.focus({ preventScroll: true });
    window.scrollTo({ top: 0, behavior: 'instant' });
  } catch (error) {
    style.remove();
    console.error(error);
    game.replaceChildren();
    const panel = document.createElement('div');
    panel.className = 'load-error';
    const title = document.createElement('h1');
    title.textContent = 'A tiny pause.';
    const copy = document.createElement('p');
    copy.textContent = 'This page couldn’t load. Let’s give it another try.';
    const retry = document.createElement('button');
    retry.className = 'button button-primary';
    retry.textContent = 'Try again ↗';
    retry.addEventListener('click', () => showScreen(index), { once: true });
    panel.append(title, copy, retry);
    game.append(panel);
  } finally {
    if (requestId === navigationId) game.removeAttribute('aria-busy');
  }
}

retryPendingSubmissions();
showScreen(0);
