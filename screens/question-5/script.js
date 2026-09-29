const HOLD_MS = 1500;
const TAP_GOAL = 3;

export function mount(container, context) {
  const screen = container.querySelector('.q5');
  const first = container.querySelector('.q5-first');
  const second = container.querySelector('.q5-second');
  const firstNo = container.querySelector('.q5-first-no');
  const yes = container.querySelector('.q5-final-yes');
  const video = container.querySelector('.q5-video');
  const videoIntro = container.querySelector('.q5-video-intro');
  const status = container.querySelector('.q5-status');
  const copy = container.querySelector('.q5-copy-text');
  const heartReveal = container.querySelector('.q5-heart-reveal');
  const heartCard = container.querySelector('.q5-heart-card');
  const hold = container.querySelector('.q5-hold');
  const alternative = container.querySelector('.q5-alternative');
  const tapCount = container.querySelector('.q5-tap-count');
  const heartStatus = container.querySelector('.q5-heart-status');
  let approaches = 0;
  let ready = false;
  let completed = false;
  let heartFinished = false;
  let holding = false;
  let started = 0;
  let frame = 0;
  let taps = 0;
  let revealTimer = 0;
  let finishTimer = 0;

  const showVideo = () => {
    if (!second.hidden) return;
    first.hidden = true;
    second.hidden = false;
    screen.classList.add('q5-is-replay');
    copy.textContent = 'Fair enough. Watch it once more, then choose again.';
    video.src = video.dataset.src;
    videoIntro.focus({ preventScroll: true });
  };

  const dodge = () => {
    if (completed || ready || approaches >= 2 || second.hidden) return;
    approaches += 1;
    yes.dataset.position = String(approaches);
    if (approaches === 1) {
      status.textContent = 'Oops, it moved. Try again.';
    } else {
      status.textContent = 'One more try…';
      revealTimer = window.setTimeout(() => {
        ready = true;
        yes.dataset.position = 'final';
        status.textContent = 'There it is. Yes is all yours.';
      }, 550);
    }
  };

  const onEnter = event => {
    if (event.pointerType === 'mouse') dodge();
  };
  const onYes = () => {
    if (completed || second.hidden) return;
    if (!ready) { dodge(); return; }
    completed = true;
    yes.disabled = true;
    video.removeAttribute('src');
    heartReveal.hidden = false;
    document.body.append(heartReveal);
    container.inert = true;
    hold.focus({ preventScroll: true });
  };

  const progress = amount => {
    heartCard.style.setProperty('--q5-progress', `${Math.min(100, Math.round(amount * 100))}%`);
  };
  const finishHeart = () => {
    if (heartFinished) return;
    heartFinished = true;
    holding = false;
    cancelAnimationFrame(frame);
    progress(1);
    heartStatus.textContent = 'You did it. My heart is full. ♥';
    hold.disabled = true;
    alternative.disabled = true;
    finishTimer = window.setTimeout(() => context.complete('completed'), 650);
  };
  const tick = now => {
    if (!holding || heartFinished) return;
    const elapsed = now - started;
    progress(elapsed / HOLD_MS);
    if (elapsed >= HOLD_MS) finishHeart();
    else frame = requestAnimationFrame(tick);
  };
  const begin = () => {
    if (holding || heartFinished || heartReveal.hidden) return;
    holding = true;
    started = performance.now();
    heartStatus.textContent = 'Keep holding…';
    frame = requestAnimationFrame(tick);
  };
  const cancel = () => {
    if (!holding || heartFinished) return;
    holding = false;
    cancelAnimationFrame(frame);
    progress(0);
    heartStatus.textContent = 'Almost! Try holding a little longer.';
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
    if (heartFinished || heartReveal.hidden) return;
    taps += 1;
    tapCount.textContent = `(${taps} / ${TAP_GOAL})`;
    heartStatus.textContent = taps < TAP_GOAL ? `${TAP_GOAL - taps} more tap${TAP_GOAL - taps === 1 ? '' : 's'} to go.` : 'You did it!';
    if (taps >= TAP_GOAL) finishHeart();
  };

  firstNo.addEventListener('click', showVideo);
  yes.addEventListener('pointerenter', onEnter);
  yes.addEventListener('click', onYes);
  hold.addEventListener('pointerdown', pointerDown);
  hold.addEventListener('pointerup', cancel);
  hold.addEventListener('pointercancel', cancel);
  hold.addEventListener('lostpointercapture', cancel);
  hold.addEventListener('keydown', keyDown);
  hold.addEventListener('keyup', keyUp);
  hold.addEventListener('blur', cancel);
  alternative.addEventListener('click', tap);
  return () => {
    window.clearTimeout(revealTimer);
    window.clearTimeout(finishTimer);
    cancelAnimationFrame(frame);
    firstNo.removeEventListener('click', showVideo);
    yes.removeEventListener('pointerenter', onEnter);
    yes.removeEventListener('click', onYes);
    hold.removeEventListener('pointerdown', pointerDown);
    hold.removeEventListener('pointerup', cancel);
    hold.removeEventListener('pointercancel', cancel);
    hold.removeEventListener('lostpointercapture', cancel);
    hold.removeEventListener('keydown', keyDown);
    hold.removeEventListener('keyup', keyUp);
    hold.removeEventListener('blur', cancel);
    alternative.removeEventListener('click', tap);
    container.inert = false;
    heartReveal.remove();
    video.removeAttribute('src');
  };
}
