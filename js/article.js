import { sections } from './content.js?v=4';
import { loadPosts } from './posts.js';
import { renderFooter, renderNavigation } from './site.js?v=5';

const { base, section } = document.body.dataset;
renderNavigation(base, sections.find((item) => item.id === section));
renderFooter(base);

const lyricReferences = document.querySelector('#lyric-references');
if (lyricReferences) {
  import('./lyric-tooltips.js?v=3').then(({ bindLyricTooltips }) => {
    bindLyricTooltips(JSON.parse(lyricReferences.textContent));
  });
}

const chapterToc = document.querySelector('.chapter-toc');
if (chapterToc) trackChapterSections(chapterToc);

const chapterAnchors = document.querySelector('#chapter-anchors');
if (chapterAnchors) {
  const chapters = JSON.parse(chapterAnchors.textContent);
  function openChapterForHash() {
    let id;
    try {
      id = decodeURIComponent(location.hash.slice(1));
    } catch {
      return;
    }
    if (Object.hasOwn(chapters, id)) location.replace(`${chapters[id]}${location.hash}`);
  }
  addEventListener('hashchange', openChapterForHash);
  openChapterForHash();
}

if ('legacyPost' in document.body.dataset) {
  const title = document.querySelector('.article-title');
  const slug = new URLSearchParams(location.search).get('post');

  loadPosts(base).then((posts) => {
    const post = posts.find((entry) => entry.slug === slug);
    const path = slug === 'about-me' ? 'about/' : post?.path;
    if (path) location.replace(`${base}${path}${location.hash}`);
    else title.textContent = 'Post not found';
  }).catch(() => {
    title.textContent = 'Could not load the article';
  });
}

function trackChapterSections(toc) {
  const sections = Array.from(toc.querySelectorAll(':scope > ul > li > a'), (link) => ({
    link,
    heading: document.getElementById(decodeURIComponent(link.hash.slice(1))),
    subsections: link.nextElementSibling,
  }));
  const scroller = document.scrollingElement;
  let current;
  let frame;

  function update() {
    frame = undefined;
    const line = parseFloat(getComputedStyle(sections[0].heading).scrollMarginTop) + 2;
    const atEnd = scroller.scrollTop > 0 && scroller.scrollHeight - scroller.clientHeight - scroller.scrollTop <= 2;
    const next = atEnd ? sections.at(-1) : sections.findLast(({ heading }) =>
      heading.getBoundingClientRect().top <= line) ?? sections[0];
    if (next === current) return;

    current?.link.removeAttribute('aria-current');
    if (current?.subsections) current.subsections.hidden = true;
    next.link.setAttribute('aria-current', 'location');
    if (next.subsections) next.subsections.hidden = false;
    current = next;

    const bounds = toc.getBoundingClientRect();
    const leading = next.link.getBoundingClientRect().top - bounds.top;
    const firstItem = next.subsections?.firstElementChild ?? next.link;
    const trailing = firstItem.getBoundingClientRect().bottom - bounds.bottom;
    if (leading < 0) toc.scrollTop += leading;
    else if (trailing > 0) toc.scrollTop += Math.min(trailing, leading);
  }

  function scheduleUpdate() {
    frame ??= requestAnimationFrame(update);
  }

  for (const { subsections } of sections) {
    if (subsections) subsections.hidden = true;
  }
  update();
  addEventListener('scroll', scheduleUpdate, { passive: true });
  addEventListener('resize', scheduleUpdate);
  new ResizeObserver(scheduleUpdate).observe(document.querySelector('.post-body'));
}
