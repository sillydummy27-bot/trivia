import { applyTheme, revealTheme } from '../../theme.js';

export function mount(container, context) {
  const radios = [...container.querySelectorAll('input[name="theme"]')];
  const toggle = container.querySelector('.q1-custom-toggle');
  const custom = container.querySelector('.q1-custom');
  const picker = container.querySelector('#q1-picker');
  const value = container.querySelector('.q1-picker-value');
  const apply = container.querySelector('.q1-apply');
  const next = container.querySelector('.q1-next');
  const hint = container.querySelector('.q1-hint');
  let answer = null;
  let stopReveal = () => {};
  let submitted = false;

  const choose = choice => {
    if (submitted) return;
    const color = applyTheme(choice);
    if (!color) return;
    answer = choice;
    next.disabled = false;
    hint.textContent = `${choice.startsWith('#') ? choice : choice[0].toUpperCase() + choice.slice(1)} applied. You can change it or keep going.`;
    stopReveal();
    stopReveal = revealTheme(color);
  };
  const choosePreset = event => choose(event.currentTarget.value);
  const openCustom = () => {
    custom.hidden = !custom.hidden;
    toggle.setAttribute('aria-expanded', String(!custom.hidden));
    if (!custom.hidden) picker.focus();
  };
  const updatePicker = () => { value.textContent = picker.value.toUpperCase(); };
  const chooseCustom = () => {
    radios.forEach(radio => { radio.checked = false; });
    choose(picker.value.toUpperCase());
  };
  const submit = () => {
    if (!answer || submitted) return;
    submitted = true;
    next.disabled = true;
    context.complete(answer);
  };

  radios.forEach(radio => radio.addEventListener('change', choosePreset));
  toggle.addEventListener('click', openCustom);
  picker.addEventListener('input', updatePicker);
  apply.addEventListener('click', chooseCustom);
  next.addEventListener('click', submit);
  return () => {
    radios.forEach(radio => radio.removeEventListener('change', choosePreset));
    toggle.removeEventListener('click', openCustom);
    picker.removeEventListener('input', updatePicker);
    apply.removeEventListener('click', chooseCustom);
    next.removeEventListener('click', submit);
    stopReveal();
  };
}
