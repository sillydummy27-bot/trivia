export function mount(container, context) {
  const button = container.querySelector('.intro-start');
  const start = () => context.start();
  button.addEventListener('click', start);
  return () => button.removeEventListener('click', start);
}
