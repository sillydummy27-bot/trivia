const colorLabels = { pink: 'pink', red: 'red', blue: 'blue' };

export function mount(container, context) {
  const replay = container.querySelector('.done-replay');
  const personal = container.querySelector('.done-personal');
  const firstChoice = context.answers?.['question-1'];
  if (colorLabels[firstChoice]) {
    personal.textContent = `P.S. ${colorLabels[firstChoice]} looks lovely on this story.`;
  } else if (/^#[0-9a-f]{6}$/i.test(firstChoice || '')) {
    personal.textContent = `P.S. Your own shade (${firstChoice.toUpperCase()}) made this story yours.`;
  }
  const restart = () => context.replay();
  replay.addEventListener('click', restart);
  return () => replay.removeEventListener('click', restart);
}
