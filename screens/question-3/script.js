export function mount(container, context) {
  const form = container.querySelector('.q3-form');
  const textarea = container.querySelector('#q3-note');
  const next = container.querySelector('.q3-next');
  const counter = container.querySelector('.q3-counter');
  let submitted = false;
  const update = () => {
    counter.textContent = `${textarea.value.length} / 500`;
    next.disabled = textarea.value.trim().length === 0;
  };
  const submit = event => {
    event.preventDefault();
    const answer = textarea.value.trim();
    if (submitted || !answer) return;
    submitted = true;
    next.disabled = true;
    context.complete(answer);
  };
  textarea.addEventListener('input', update);
  form.addEventListener('submit', submit);
  return () => {
    textarea.removeEventListener('input', update);
    form.removeEventListener('submit', submit);
  };
}
