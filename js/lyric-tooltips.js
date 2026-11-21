export function bindLyricTooltips(references) {
  const tooltip = document.createElement('div');
  tooltip.id = 'lyric-tooltip';
  tooltip.className = 'lyric-tooltip';
  tooltip.lang = 'en';
  tooltip.setAttribute('role', 'tooltip');
  tooltip.hidden = true;
  tooltip.innerHTML = '<strong></strong><q></q>';
  const track = tooltip.querySelector('strong');
  const quote = tooltip.querySelector('q');
  document.body.append(tooltip);

  const header = document.querySelector('.site-header');
  const margin = 12;
  let active;
  let anchorLine;
  let dismissTimer;

  function position() {
    if (!active) return;
    const viewport = document.documentElement;
    const lines = active.getClientRects();
    const firstLine = lines[0];
    const lastLine = lines[lines.length - 1];
    const anchor = lines[anchorLine] ?? firstLine;
    const topLimit = (header?.getBoundingClientRect().bottom ?? 0) + margin;
    if (lastLine.bottom < topLimit - margin || firstLine.top > viewport.clientHeight) {
      dismiss();
      return;
    }
    const { offsetWidth, offsetHeight } = tooltip;
    const centered = anchor.left + (anchor.width - offsetWidth) / 2;
    const above = firstLine.top - offsetHeight - margin;
    const top = above >= topLimit ? above : lastLine.bottom + margin;
    tooltip.style.left = `${Math.max(margin, Math.min(centered, viewport.clientWidth - offsetWidth - margin))}px`;
    tooltip.style.top = `${Math.max(topLimit, Math.min(top, viewport.clientHeight - offsetHeight - margin))}px`;
  }

  function setQuote(text, highlights) {
    const fragments = [];
    let offset = 0;
    for (const phrase of highlights) {
      const start = text.indexOf(phrase, offset);
      if (start === -1) continue;
      const mark = document.createElement('mark');
      mark.textContent = phrase;
      fragments.push(text.slice(offset, start), mark);
      offset = start + phrase.length;
    }
    quote.replaceChildren(...fragments, text.slice(offset));
  }

  function reveal(trigger, reference, pointerY) {
    clearTimeout(dismissTimer);
    active?.removeAttribute('aria-describedby');
    active = trigger;
    anchorLine = Array.from(trigger.getClientRects()).findIndex(({ top, bottom }) =>
      pointerY >= top && pointerY <= bottom);
    track.textContent = reference.track;
    setQuote(reference.quote, reference.highlights);
    tooltip.hidden = false;
    trigger.setAttribute('aria-describedby', tooltip.id);
    position();
  }

  function dismiss() {
    active?.removeAttribute('aria-describedby');
    active = undefined;
    tooltip.hidden = true;
  }

  function scheduleDismiss() {
    clearTimeout(dismissTimer);
    dismissTimer = setTimeout(() => {
      if (!active?.matches(':hover, :focus-visible') && !tooltip.matches(':hover')) dismiss();
    }, 180);
  }

  function leaveReference(event) {
    if (active !== event.currentTarget || event.pointerType === 'touch' || active.matches(':focus-visible')) return;
    const { left, right, top, bottom } = tooltip.getBoundingClientRect();
    const { clientX, clientY } = event;
    const nearTooltip = clientX >= left - margin && clientX <= right + margin &&
      clientY >= top - margin && clientY <= bottom + margin;
    if (nearTooltip) scheduleDismiss();
    else dismiss();
  }

  for (const trigger of document.querySelectorAll('[data-lyric-reference]')) {
    const reference = references[trigger.dataset.lyricReference];
    if (!reference) continue;
    trigger.addEventListener('pointerenter', (event) => {
      if (event.pointerType !== 'touch') reveal(trigger, reference, event.clientY);
    });
    trigger.addEventListener('pointerleave', leaveReference);
    trigger.addEventListener('focus', () => {
      if (trigger.matches(':focus-visible')) reveal(trigger, reference);
    });
    trigger.addEventListener('blur', scheduleDismiss);
    trigger.addEventListener('click', (event) => {
      if (active !== trigger) reveal(trigger, reference, event.clientY);
    });
  }

  tooltip.addEventListener('pointerenter', () => clearTimeout(dismissTimer));
  tooltip.addEventListener('pointerleave', scheduleDismiss);
  addEventListener('pointerdown', (event) => {
    if (active && !active.contains(event.target) && !tooltip.contains(event.target)) dismiss();
  });
  addEventListener('keydown', (event) => {
    if (event.key === 'Escape') dismiss();
  });
  addEventListener('scroll', position, { passive: true });
  addEventListener('resize', position);
}
