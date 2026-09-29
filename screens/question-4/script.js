const TEXT_CHOICE = 'actually i do have an answer';

export function mount(container, context) {
  const form = container.querySelector('.q4-form');
  const choices = [...form.querySelectorAll('input[name="writing-answer"]')];
  const textField = form.querySelector('.q4-answer');
  const textInput = form.querySelector('#q4-text');
  const count = form.querySelector('.q4-count');
  const hint = form.querySelector('.q4-hint');
  const next = form.querySelector('.q4-next');
  let submitted = false;

  const selected = () => choices.find(input => input.checked)?.value;
  const update = () => {
    const choice = selected();
    const needsText = choice === TEXT_CHOICE;
    textField.hidden = !needsText;
    textInput.disabled = !needsText;
    count.textContent = `${textInput.value.length} / 50 characters`;
    next.disabled = !choice || (needsText && !textInput.value.trim());
    hint.textContent = !choice ? 'Choose one answer.'
      : needsText && !textInput.value.trim() ? 'Write your answer to continue.'
      : 'Answer ready.';
  };
  const onChoice = () => {
    update();
    if (selected() === TEXT_CHOICE) textInput.focus();
  };
  const onSubmit = event => {
    event.preventDefault();
    const choice = selected();
    const text = choice === TEXT_CHOICE ? textInput.value.trim() : null;
    if (submitted || !choice || (choice === TEXT_CHOICE && !text)) return;
    submitted = true;
    next.disabled = true;
    context.complete({ choice, text });
  };

  choices.forEach(input => input.addEventListener('change', onChoice));
  textInput.addEventListener('input', update);
  form.addEventListener('submit', onSubmit);
  update();
  return () => {
    choices.forEach(input => input.removeEventListener('change', onChoice));
    textInput.removeEventListener('input', update);
    form.removeEventListener('submit', onSubmit);
  };
}
