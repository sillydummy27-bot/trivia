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
  let approaches = 0;
  let ready = false;
  let completed = false;
  let revealTimer = 0;

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
    context.complete('completed');
  };

  firstNo.addEventListener('click', showVideo);
  yes.addEventListener('pointerenter', onEnter);
  yes.addEventListener('click', onYes);
  return () => {
    window.clearTimeout(revealTimer);
    firstNo.removeEventListener('click', showVideo);
    yes.removeEventListener('pointerenter', onEnter);
    yes.removeEventListener('click', onYes);
    video.removeAttribute('src');
  };
}
