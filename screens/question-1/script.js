export function mount(container, context) {
  const form = container.querySelector('.q1-form');
  const next = container.querySelector('.q1-next');
  let submitted = false;
  const update = () => { next.disabled = !form.elements.date.value; };
  const submit = event => {
    event.preventDefault();
    if (submitted || !form.elements.date.value) return;
    submitted = true;
    next.disabled = true;
    context.complete(form.elements.date.value);
  };
  form.addEventListener('change', update);
  form.addEventListener('submit', submit);
  update();
  return () => {
    form.removeEventListener('change', update);
    form.removeEventListener('submit', submit);
  };
}
