// Change the initial hue or preset buttons in this screen only.
function hslToHex(hue, saturation, lightness) {
  const l = lightness / 100;
  const a = (saturation / 100) * Math.min(l, 1 - l);
  const channel = offset => {
    const k = (offset + hue / 30) % 12;
    return Math.round(255 * (l - a * Math.max(-1, Math.min(k - 3, 9 - k, 1))));
  };
  return `#${[channel(0), channel(8), channel(4)].map(value => value.toString(16).padStart(2, '0')).join('')}`.toUpperCase();
}

export function mount(container, context) {
  const slider = container.querySelector('.q4-slider');
  const presets = [...container.querySelectorAll('.q4-preset')];
  const preview = container.querySelector('.q4-preview');
  const next = container.querySelector('.q4-next');
  let current;
  let submitted = false;

  const update = () => {
    const hue = Number(slider.value);
    const complementHue = (hue + 180) % 360;
    current = {
      hue,
      complementHue,
      base: hslToHex(hue, 75, 63),
      accent: hslToHex(complementHue, 75, 63),
      secondary: hslToHex(complementHue, 75, 86)
    };
    preview.style.setProperty('--q4-base', current.base);
    preview.style.setProperty('--q4-accent', current.accent);
    preview.style.setProperty('--q4-secondary', current.secondary);
    container.querySelector('.q4-hue-value').textContent = `${hue}°`;
    container.querySelector('.q4-formula-base').textContent = `${hue}°`;
    container.querySelector('.q4-formula-accent').textContent = `${complementHue}°`;
    container.querySelector('.q4-hex-base').textContent = current.base;
    container.querySelector('.q4-hex-accent').textContent = current.accent;
    container.querySelector('.q4-hex-secondary').textContent = current.secondary;
    presets.forEach(button => button.setAttribute('aria-pressed', String(Number(button.dataset.hue) === hue)));
  };
  const choosePreset = event => {
    slider.value = event.currentTarget.dataset.hue;
    update();
  };
  const submit = () => {
    if (submitted) return;
    submitted = true;
    next.disabled = true;
    context.complete({...current});
  };
  slider.addEventListener('input', update);
  presets.forEach(button => button.addEventListener('click', choosePreset));
  next.addEventListener('click', submit);
  update();
  return () => {
    slider.removeEventListener('input', update);
    presets.forEach(button => button.removeEventListener('click', choosePreset));
    next.removeEventListener('click', submit);
  };
}
