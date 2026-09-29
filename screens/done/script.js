const dateLabels = {
  coffee: 'Coffee & conversations',
  'sunset-walk': 'a sunset walk',
  bookstore: 'a bookstore adventure',
  'spontaneous-trip': 'a spontaneous trip'
};

export function mount(container, context) {
  const replay = container.querySelector('.done-replay');
  const personal = container.querySelector('.done-personal');
  const firstChoice = context.answers?.['question-1'];
  if (dateLabels[firstChoice]) personal.textContent = `P.S. ${dateLabels[firstChoice]} sounds like a very good start.`;
  const restart = () => context.replay();
  replay.addEventListener('click', restart);
  return () => replay.removeEventListener('click', restart);
}
