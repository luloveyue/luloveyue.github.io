const body = document.body;
const openingScene = document.getElementById('openingScene');
const openLetter = document.getElementById('openLetter');
const letterPage = document.getElementById('letterPage');
const letterHeading = document.getElementById('letterHeading');
const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

let isOpening = false;

function finishOpening() {
  body.classList.add('is-open');
  body.classList.remove('is-locked');
  letterPage.setAttribute('aria-hidden', 'false');
  window.scrollTo(0, 0);

  window.setTimeout(() => {
    openingScene.hidden = true;
    try {
      letterHeading.focus({ preventScroll: true });
    } catch (error) {
      letterHeading.focus();
    }
  }, reducedMotion ? 20 : 850);
}

openLetter.addEventListener('click', () => {
  if (isOpening) return;

  isOpening = true;
  openLetter.disabled = true;
  body.classList.add('is-opening');

  window.setTimeout(finishOpening, reducedMotion ? 80 : 2050);
});
