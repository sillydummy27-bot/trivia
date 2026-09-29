const HOLD_MS = 1500;
const TAP_GOAL = 3;

export function mount(container, context) {
  const hold = container.querySelector('.q5-hold');
  const alternative = container.querySelector('.q5-alternative');
  const count = container.querySelector('.q5-tap-count');
  const status = container.querySelector('.q5-status');
  const play = container.querySelector('.q5-play');
  let started = 0;
  let frame = 0;
  let finishTimer = 0;
  let taps = 0;
  let completed = false;
  let holding = false;

  const progress = amount => {
    const percent = `${Math.min(100, Math.round(amount * 100))}%`;
    play.style.setProperty('--q5-progress', percent);
  };
  const finish = method => {
    if (completed) return;
    completed = true;
    holding = false;
    cancelAnimationFrame(frame);
    progress(1);
    status.textContent = 'You did it. My heart is full. ♥';
    hold.disabled = true;
    alternative.disabled = true;
    finishTimer = window.setTimeout(() => context.complete({completed: true, method}), 650);
  };
  const tick = now => {
    if (!holding || completed) return;
    const elapsed = now - started;
    progress(elapsed / HOLD_MS);
    if (elapsed >= HOLD_MS) finish('hold');
    else frame = requestAnimationFrame(tick);
  };
  const begin = () => {
    if (holding || completed) return;
    holding = true;
    started = performance.now();
    status.textContent = 'Keep holding…';
    frame = requestAnimationFrame(tick);
  };
  const cancel = () => {
    if (!holding || completed) return;
    holding = false;
    cancelAnimationFrame(frame);
    progress(0);
    status.textContent = 'Almost! Try holding a little longer.';
  };
  const pointerDown = event => {
    if (event.button !== 0) return;
    hold.setPointerCapture?.(event.pointerId);
    begin();
  };
  const keyDown = event => {
    if (event.key !== ' ' && event.key !== 'Enter') return;
    event.preventDefault();
    begin();
  };
  const keyUp = event => {
    if (event.key !== ' ' && event.key !== 'Enter') return;
    event.preventDefault();
    cancel();
  };
  const tap = () => {
    if (completed) return;
    taps += 1;
    count.textContent = `(${taps} / ${TAP_GOAL})`;
    status.textContent = taps < TAP_GOAL ? `${TAP_GOAL - taps} more tap${TAP_GOAL - taps === 1 ? '' : 's'} to go.` : 'You did it!';
    if (taps >= TAP_GOAL) finish('tap');
  };
  hold.addEventListener('pointerdown', pointerDown);
  hold.addEventListener('pointerup', cancel);
  hold.addEventListener('pointercancel', cancel);
  hold.addEventListener('lostpointercapture', cancel);
  hold.addEventListener('keydown', keyDown);
  hold.addEventListener('keyup', keyUp);
  hold.addEventListener('blur', cancel);
  alternative.addEventListener('click', tap);
  return () => {
    cancelAnimationFrame(frame);
    window.clearTimeout(finishTimer);
    hold.removeEventListener('pointerdown', pointerDown);
    hold.removeEventListener('pointerup', cancel);
    hold.removeEventListener('pointercancel', cancel);
    hold.removeEventListener('lostpointercapture', cancel);
    hold.removeEventListener('keydown', keyDown);
    hold.removeEventListener('keyup', keyUp);
    hold.removeEventListener('blur', cancel);
    alternative.removeEventListener('click', tap);
  };
}
