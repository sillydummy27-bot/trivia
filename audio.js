export function initMusic(button) {
  const audio = new Audio(new URL('./assets/audio/Taylor Swift - willow (Official Instrumental).mp3', import.meta.url).href);
  audio.loop = true;
  audio.preload = 'none';
  audio.volume = 0.35;
  let enabled = false;
  let request = 0;

  function updateButton() {
    const playing = !audio.paused;
    button.classList.toggle('is-playing', playing);
    button.setAttribute('aria-pressed', String(enabled));
    const label = enabled ? 'Turn music off' : 'Turn music on';
    button.setAttribute('aria-label', label);
    button.title = label;
  }

  async function sync() {
    const id = ++request;
    if (!enabled) {
      audio.pause(); // Preserve currentTime when the user turns music off.
      updateButton();
      return;
    }
    try {
      await audio.play();
    } catch (error) {
      if (id !== request) return;
      enabled = false;
      console.warn('Music could not play:', error);
    }
    if (id === request) updateButton();
  }

  button.addEventListener('click', () => {
    enabled = !enabled;
    sync();
  });
  audio.addEventListener('play', updateButton);
  audio.addEventListener('pause', updateButton);
  audio.addEventListener('error', () => {
    enabled = false;
    audio.pause();
    updateButton();
    button.title = 'Music unavailable. Click to retry.';
  });
  updateButton();

  return {
    play() {
      enabled = true;
      return sync();
    },
  };
}
