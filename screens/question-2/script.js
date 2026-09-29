export function mount(container, context) {
  const form = container.querySelector('.q2-form');
  const choices = [...form.querySelectorAll('input[type="radio"]')];
  const next = container.querySelector('.q2-next');
  const hint = container.querySelector('.q2-hint');
  let submitted = false;
  const selected = () => choices.find(input => input.checked)?.value;
  const update = () => {
    next.disabled = !selected();
    hint.textContent = selected() ? 'One activity chosen.' : 'Choose one activity.';
  };
  const submit = event => {
    event.preventDefault();
    const answer = selected();
    if (submitted || !answer) return;
    submitted = true;
    next.disabled = true;
    context.complete(answer);
  };
  form.addEventListener('change', update);
  form.addEventListener('submit', submit);
  return () => {
    form.removeEventListener('change', update);
    form.removeEventListener('submit', submit);
  };
}
