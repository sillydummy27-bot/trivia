export function mount(container, context) {
  const form = container.querySelector('.q2-form');
  const checks = [...form.querySelectorAll('input[type="checkbox"]')];
  const next = container.querySelector('.q2-next');
  const hint = container.querySelector('.q2-hint');
  let submitted = false;
  const selected = () => checks.filter(input => input.checked).map(input => input.value);
  const update = () => {
    const count = selected().length;
    next.disabled = count === 0;
    hint.textContent = count ? `${count} little thing${count === 1 ? '' : 's'} picked.` : 'Choose at least one.';
  };
  const submit = event => {
    event.preventDefault();
    const answer = selected();
    if (submitted || answer.length === 0) return;
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
