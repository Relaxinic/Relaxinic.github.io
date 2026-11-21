import { sections } from './content.js?v=4';

export function sectionUrl(section, base = './') {
  return `${base}${section.id}/`;
}

export function renderNavigation(base = './', currentSection) {
  const nav = document.querySelector('[data-nav]');
  for (const section of sections) {
    const link = document.createElement('a');
    link.href = sectionUrl(section, base);
    link.textContent = section.title;
    if (section === currentSection) link.setAttribute('aria-current', 'page');
    nav.append(link);
  }
}

export function renderFooter(base = './', isHome = false) {
  const footer = document.querySelector('[data-footer]');
  const mode = document.documentElement.dataset.themeMode || 'system';
  const mottoWords = ['Relax, ', 'nothing ', 'is ', 'in ', 'control.'];
  const motto = mottoWords.map((word) =>
    `<span class="footer-motto-initial">${word[0]}</span><span class="footer-motto-tail"><span>${word.slice(1)}</span></span>`
  ).join('');
  footer.innerHTML = `
    <div class="footer-motto-slot">
      <span class="footer-motto-size" aria-hidden="true">${mottoWords.join('')}</span>
      <a class="footer-motto" href="${isHome ? '#top' : base}" aria-label="Rinic's blog">
        <span class="footer-motto-label" aria-hidden="true"><span>Rinic</span><span class="footer-motto-blog">'s blog</span></span>
        <span class="footer-motto-line" aria-hidden="true">${motto}</span>
      </a>
    </div>
    <div class="theme-picker" role="group" aria-labelledby="theme-label">
      <span class="theme-label" id="theme-label">Theme</span>
      ${['System', 'Light', 'Dark'].map((label) => {
        const value = label.toLowerCase();
        return `
          <label class="theme-option">
            <input type="radio" name="theme" data-theme-choice value="${value}" ${mode === value ? 'checked' : ''}>
            <span>${label}</span>
          </label>
        `;
      }).join('')}
    </div>
  `;

  // The n and first i trade places between the name and the sentence.
  const [, n, i] = footer.querySelectorAll('.footer-motto-initial');
  function alignMottoInitials() {
    const nWidth = n.getBoundingClientRect().width;
    const iWidth = i.getBoundingClientRect().width;
    n.style.setProperty('--initial-offset', `${iWidth}px`);
    i.style.setProperty('--initial-offset', `${-nWidth}px`);
  }
  alignMottoInitials();
  const initialSizes = new ResizeObserver(alignMottoInitials);
  initialSizes.observe(n);
  initialSizes.observe(i);
}
