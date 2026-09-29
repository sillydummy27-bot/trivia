const correctAboutMe = {
  neverHadGirlfriend: 'T',
  neverMet: 'L',
  stayingHome: 'T',
};

export function mount(container, context) {
  const form = container.querySelector('.q3-form');
  const rounds = {
    aboutHer: form.querySelector('[data-round="aboutHer"]'),
    aboutMe: form.querySelector('[data-round="aboutMe"]'),
  };
  const submit = form.querySelector('.q3-submit');
  const next = form.querySelector('.q3-continue');
  const hint = form.querySelector('.q3-hint');
  let activeRound = 'aboutHer';
  let finished = false;
  const answers = {};

  const selections = round => Object.fromEntries(
    [...round.querySelectorAll('.q3-statement')].map(statement => [
      statement.dataset.key,
      statement.querySelector('input:checked')?.value,
    ]),
  );
  const update = () => {
    const values = Object.values(selections(rounds[activeRound]));
    const complete = values.every(Boolean);
    submit.disabled = !complete;
    hint.textContent = complete
      ? 'All three choices made.'
      : 'Choose T or L for all three statements. (' + values.filter(Boolean).length + ' / 3)';
  };
  const reveal = () => {
    rounds.aboutMe.querySelectorAll('.q3-statement').forEach(statement => {
      const key = statement.dataset.key;
      const actual = correctAboutMe[key];
      const guessed = answers.aboutMe[key];
      const result = statement.querySelector('.q3-result');
      result.textContent = 'Your guess: ' + (guessed === 'T' ? 'Truth' : 'Lie') + ' · Actual: ' + (actual === 'T' ? 'Truth' : 'Lie');
      result.classList.toggle('is-correct', guessed === actual);
      statement.querySelector('.q3-feedback').hidden = false;
      statement.querySelectorAll('input').forEach(input => { input.disabled = true; });
    });
    submit.hidden = true;
    next.hidden = false;
    hint.textContent = 'The answers are revealed above.';
    const heading = rounds.aboutMe.querySelector('.q3-reveal-heading');
    heading.hidden = false;
    heading.focus({ preventScroll: true });
    heading.scrollIntoView({ block: 'start', behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'instant' : 'smooth' });
  };
  const onSubmit = event => {
    event.preventDefault();
    if (finished) return;
    const choice = selections(rounds[activeRound]);
    if (Object.values(choice).some(value => !value)) return;
    answers[activeRound] = choice;
    if (activeRound === 'aboutHer') {
      rounds.aboutHer.hidden = true;
      rounds.aboutMe.hidden = false;
      activeRound = 'aboutMe';
      submit.innerHTML = 'Reveal the answers <span aria-hidden="true">→</span>';
      update();
      const heading = rounds.aboutMe.querySelector('h2');
      heading.setAttribute('tabindex', '-1');
      heading.focus({ preventScroll: true });
      rounds.aboutMe.scrollIntoView({ block: 'start', behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'instant' : 'smooth' });
    } else {
      finished = true;
      reveal();
    }
  };
  const onContinue = () => {
    if (finished) context.complete(answers);
  };

  form.addEventListener('change', update);
  form.addEventListener('submit', onSubmit);
  next.addEventListener('click', onContinue);
  update();
  return () => {
    form.removeEventListener('change', update);
    form.removeEventListener('submit', onSubmit);
    next.removeEventListener('click', onContinue);
  };
}
