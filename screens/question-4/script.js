export function mount(container, context) {
  const next = container.querySelector('.q4-next');
  let submitted = false;
  const continueGame = () => {
    if (submitted) return;
    submitted = true;
    next.disabled = true;
    context.complete('coming-soon');
  };
  next.addEventListener('click', continueGame);
  return () => next.removeEventListener('click', continueGame);
}
