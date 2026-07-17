const body = document.body;
const openingScene = document.getElementById('openingScene');
const openLetter = document.getElementById('openLetter');
const letterPage = document.getElementById('letterPage');
const letterHeading = document.getElementById('letterHeading');
const music = document.getElementById('bgMusic');
const musicButton = document.getElementById('musicButton');
const musicTip = document.getElementById('musicTip');
const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

let isOpening = false;
let tipTimer;

function showTip(message) {
  musicTip.textContent = message;
  musicTip.classList.add('show');
  clearTimeout(tipTimer);
  tipTimer = window.setTimeout(() => musicTip.classList.remove('show'), 2600);
}

function setMusicState(isPlaying) {
  musicButton.classList.toggle('playing', isPlaying);
  musicButton.setAttribute('aria-label', isPlaying ? '暂停背景音乐' : '播放背景音乐');
  musicButton.title = isPlaying ? '暂停背景音乐' : '播放背景音乐';
}

async function playMusic({ announce = false } = {}) {
  try {
    music.volume = 0.36;
    await music.play();
    setMusicState(true);
    if (announce) showTip('原创轻音乐《春日来信》正在播放');
    return true;
  } catch (error) {
    setMusicState(false);
    showTip('轻触右下角音符即可播放音乐');
    return false;
  }
}

function finishOpening() {
  body.classList.add('is-open');
  body.classList.remove('is-locked');
  letterPage.setAttribute('aria-hidden', 'false');
  musicButton.hidden = false;
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

  // 音乐播放与拆信动画同时启动，不阻塞动画流程。
  void playMusic({ announce: true });
  window.setTimeout(finishOpening, reducedMotion ? 80 : 2050);
});

musicButton.addEventListener('click', () => {
  if (music.paused) {
    void playMusic({ announce: true });
  } else {
    music.pause();
    setMusicState(false);
    showTip('音乐已暂停');
  }
});

music.addEventListener('pause', () => setMusicState(false));
music.addEventListener('play', () => setMusicState(true));
