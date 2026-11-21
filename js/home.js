import { homeSections } from './content.js?v=4';
import { renderFooter, renderNavigation } from './site.js?v=5';

const chapterList = document.querySelector('[data-chapters]');
renderNavigation();
renderFooter('./', true);
const chapters = homeSections.map(renderChapter);

function element(tag, className, text) {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (text) node.textContent = text;
  return node;
}

function renderChapter(section) {
  const chapter = element('section', 'chapter');
  chapter.id = section.id;
  chapter.setAttribute('aria-labelledby', `${section.id}-title`);

  const content = element('div', 'chapter-content');
  const title = element('h2', 'chapter-title', section.title);
  title.id = `${section.id}-title`;
  content.append(title, element('p', 'chapter-description', section.description));

  chapter.append(content);
  chapterList.append(chapter);
  return chapter;
}

const experience = document.querySelector('[data-experience]');
const stage = document.querySelector('[data-stage]');
const heroDiscOpacity = Number(getComputedStyle(stage).getPropertyValue('--hero-disc-opacity'));
const disc = stage.querySelector('.disc');
const quote = document.querySelector('[data-quote]');
const scrollCue = document.querySelector('[data-scroll-cue]');
const motionPreference = matchMedia('(prefers-reduced-motion: reduce)');
const narrowScreen = matchMedia('(max-width: 720px)');

let playGlitch = () => {};
// Audio is optional. Load it independently so a failure cannot block scrolling.
import('./sound.js?v=2').then(({ createGlitchSound }) => {
  playGlitch = createGlitchSound(new URL('../media/glitch.mp3', import.meta.url));
}).catch((error) => {
  console.warn('Could not initialize the scroll sound.', error);
});

const PAGE_DURATION = 700;
const SPIN_DURATION = 1280;
const DEGREES_PER_SECTION = 300;
const WHEEL_GESTURE_GAP = 180;
const STOP_MARGIN = 4;

const clamp = (value) => Math.max(0, Math.min(1, value));
const mix = (from, to, t) => from + (to - from) * t;
const ramp = (start, end, value) => clamp((value - start) / (end - start));
const smooth = (t) => t * t * (3 - 2 * t);
const easeOut = (t) => 1 - (1 - t) ** 3;

let layout;
let frame = 0;
let needsMeasure = true;
let angle = 0;
let pageTurn = null;
let spin = null;
let sceneIndex;
let lastWheelAt = -Infinity;
let capturedWheel = false;

function measure() {
  const box = stage.getBoundingClientRect();
  // offsetWidth is measured before the CSS scale, so repeated resizing is stable.
  stage.style.setProperty('--quote-fit', quote.parentElement.clientWidth / quote.offsetWidth);

  const mobile = narrowScreen.matches;
  const sectionScale = mobile ? 1.2 : 1.52;
  const currentScale = Number(stage.style.getPropertyValue('--disc-scale')) || 1;
  const rim = disc.getBoundingClientRect().width * sectionScale / (2 * currentScale);
  const edgeGap = Math.min(44, box.width * 0.032);
  const sectionX = mobile
    ? box.width * 0.16
    : Math.min(box.width * 0.11, box.width * 0.43 - rim) - edgeGap;
  const sectionY = mobile ? Math.min(box.height * 0.2, box.height * 0.45 - rim) : box.height * 0.53;

  if (!mobile) {
    const textLeft = chapterList.querySelector('.chapter-title').getBoundingClientRect().left - box.left;
    experience.style.setProperty('--chapter-end-space', `${textLeft - sectionX - rim}px`);
  }

  const pageY = window.scrollY;
  const start = experience.getBoundingClientRect().top + pageY;
  const maxY = document.documentElement.scrollHeight - window.innerHeight;
  const chapterBounds = chapters.map((chapter) => {
    const rect = chapter.firstElementChild.getBoundingClientRect();
    return { top: rect.top + pageY, bottom: rect.bottom + pageY };
  });

  layout = {
    start,
    width: box.width,
    height: box.height,
    sectionDisc: { x: sectionX, y: sectionY, scale: sectionScale },
    stops: [start, ...chapters.map((chapter) =>
      Math.min(chapter.getBoundingClientRect().top + pageY, maxY))],
    chapterBounds,
  };
  needsMeasure = false;
}

function startSpin(index, now) {
  sceneIndex = index;
  const destination = index * DEGREES_PER_SECTION;
  if (motionPreference.matches || angle === destination) {
    spin = null;
    angle = destination;
    return;
  }

  spin = { from: angle, to: destination, startedAt: now };
  playGlitch();
}

function draw(now) {
  frame = 0;
  if (needsMeasure) measure();

  // Page travel and spin run on separate clocks. The disc is still easing
  // after the page has reached the next stop.
  const turningPage = pageTurn !== null;
  if (pageTurn) {
    const progress = ramp(0, PAGE_DURATION, now - pageTurn.startedAt);
    const destination = layout.stops[pageTurn.index];
    window.scrollTo({ top: mix(pageTurn.from, destination, easeOut(progress)), behavior: 'instant' });
    if (progress === 1) pageTurn = null;
  }

  const y = window.scrollY;
  const height = layout.height;
  const mobile = narrowScreen.matches;
  const readingLine = y + height * (mobile ? 0.66 : 0.56);
  const active = layout.chapterBounds.findLastIndex(({ top }) => top <= readingLine);

  if (sceneIndex === undefined) {
    sceneIndex = active + 1;
    angle = sceneIndex * DEGREES_PER_SECTION;
  } else if (!turningPage && !spin && sceneIndex !== active + 1) {
    // Scrollbar dragging and native scroll can also enter a section.
    startSpin(active + 1, now);
  }

  if (spin) {
    const progress = ramp(0, SPIN_DURATION, now - spin.startedAt);
    angle = mix(spin.from, spin.to, easeOut(progress));
    if (progress === 1) spin = null;
  }

  const local = Math.max(0, y - layout.start);
  const position = smooth(ramp(height * 0.12, height * 0.93, local));
  const fade = smooth(ramp(height * 0.12, height * 0.64, local));
  const reduced = motionPreference.matches;
  const travel = reduced ? Number(local >= height * 0.49) : position;
  stage.style.setProperty('--disc-x', `${mix(layout.width / 2, layout.sectionDisc.x, travel)}px`);
  stage.style.setProperty('--disc-y', `${mix(height / 2, layout.sectionDisc.y, travel)}px`);
  stage.style.setProperty('--disc-scale', mix(1, layout.sectionDisc.scale, travel));
  stage.style.setProperty('--disc-angle', `${reduced ? 0 : angle}deg`);
  stage.style.setProperty('--disc-opacity', mix(heroDiscOpacity, 1, fade));
  stage.style.setProperty('--quote-alpha', reduced ? Number(local < height * 0.49) : 1 - fade);
  scrollCue.toggleAttribute('hidden', local > height * 0.35);

  if (pageTurn || spin) schedule();
}

function schedule() {
  if (!frame) frame = requestAnimationFrame(draw);
}

function remeasure() {
  needsMeasure = true;
  schedule();
}

function goToStop(index) {
  if (needsMeasure) measure();
  const y = window.scrollY;
  const destination = layout.stops[index];
  const now = performance.now();

  if (motionPreference.matches || Math.abs(y - destination) <= STOP_MARGIN) {
    pageTurn = null;
    window.scrollTo({ top: destination, behavior: 'instant' });
  } else {
    pageTurn = { index, from: y, startedAt: now };
  }
  startSpin(index, now);
  schedule();
}

function step(direction) {
  if (pageTurn || spin) return true;
  if (needsMeasure) measure();
  const y = window.scrollY;
  const { stops, chapterBounds } = layout;
  const next = direction > 0
    ? stops.findIndex((stop) => stop > y + STOP_MARGIN)
    : stops.findLastIndex((stop) => stop < y - STOP_MARGIN);
  if (next < 0) return false;

  // Keep long content readable when the browser is short or zoomed in.
  const current = stops.findLastIndex((stop) => stop <= y + STOP_MARGIN) - 1;
  const bottom = chapterBounds[current]?.bottom;
  if (direction > 0 && bottom > y + window.innerHeight - 16) return false;

  goToStop(next);
  return true;
}

function onWheel(event) {
  if (event.defaultPrevented || event.ctrlKey || event.metaKey || event.shiftKey) return;
  if (event.deltaY === 0 || Math.abs(event.deltaX) > Math.abs(event.deltaY)) return;
  if (!event.cancelable) return;

  const now = performance.now();
  if (now - lastWheelAt > WHEEL_GESTURE_GAP) capturedWheel = false;
  lastWheelAt = now;
  if (capturedWheel || step(Math.sign(event.deltaY))) {
    event.preventDefault();
    capturedWheel = true;
  }
}

function onKeyDown(event) {
  if (event.defaultPrevented || event.metaKey || event.ctrlKey || event.altKey) return;
  if (event.target.closest?.('a, button, input, textarea, select, [contenteditable]')) return;
  const directions = { ArrowDown: 1, PageDown: 1, ArrowUp: -1, PageUp: -1 };
  const direction = event.key === ' ' ? (event.shiftKey ? -1 : 1) : directions[event.key];
  if (direction && step(direction)) event.preventDefault();
}

function stopForHash(hash) {
  if (hash === '#top') return 0;
  if (hash === '#archive') return chapters.length ? 1 : 0;
  const index = chapters.findIndex((chapter) => `#${chapter.id}` === hash);
  return index === -1 ? undefined : index + 1;
}

for (const link of [scrollCue, ...document.querySelectorAll('a[href="#top"]')]) {
  link.addEventListener('click', (event) => {
    if (event.button || event.metaKey || event.ctrlKey || event.altKey || event.shiftKey) return;
    const index = stopForHash(link.hash);
    if (index === undefined) return;
    event.preventDefault();
    if (link.hash !== location.hash) history.pushState(null, '', link.hash);
    goToStop(index);
  });
}

window.addEventListener('wheel', onWheel, { passive: false });
window.addEventListener('keydown', onKeyDown);
window.addEventListener('scroll', schedule, { passive: true });
window.addEventListener('resize', remeasure);
window.addEventListener('pageshow', remeasure);
window.addEventListener('pagereveal', (event) => {
  if (!event.viewTransition) return;
  // Resolve the restored scroll position before the transition captures this page.
  if (frame) cancelAnimationFrame(frame);
  pageTurn = null;
  spin = null;
  sceneIndex = undefined;
  needsMeasure = true;
  draw(performance.now());
}, { capture: true });
window.addEventListener('hashchange', () => {
  pageTurn = null;
  spin = null;
  sceneIndex = undefined;
  schedule();
});
narrowScreen.addEventListener('change', remeasure);
motionPreference.addEventListener('change', () => {
  if (motionPreference.matches && sceneIndex !== undefined) goToStop(sceneIndex);
  else schedule();
});
new ResizeObserver(remeasure).observe(quote);
document.fonts.ready.then(remeasure);

measure();
// Chapter anchors are added by this module. Restore links from article pages.
const initialStop = stopForHash(location.hash);
if (initialStop !== undefined) {
  window.scrollTo({ top: layout.stops[initialStop], behavior: 'instant' });
}
draw(performance.now());
