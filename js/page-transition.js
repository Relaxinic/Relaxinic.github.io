// Run before the first paint so the incoming page can select its animation.
(() => {
  const sourceKey = 'relaxinic-transition-source';
  const root = document.documentElement;
  const page = root.dataset.page;
  const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)');
  const isAbout = () => document.body?.dataset.section === 'about';

  function discAngle() {
    const disc = document.querySelector('[data-transition-disc]');
    return disc ? parseFloat(getComputedStyle(disc).getPropertyValue('--disc-angle')) || 0 : 0;
  }

  function discInView() {
    const disc = document.querySelector('[data-transition-disc]');
    if (!disc) return false;
    const rect = disc.getBoundingClientRect();
    return rect.left < innerWidth && rect.right > 0
      && rect.top < innerHeight && rect.bottom > (document.querySelector('.site-header')?.offsetHeight ?? 0);
  }

  window.addEventListener('pageswap', (event) => {
    if (!event.viewTransition) return;
    if (reducedMotion.matches) {
      event.viewTransition.skipTransition();
      return;
    }
    try {
      sessionStorage.setItem(sourceKey, JSON.stringify({
        page, angle: discAngle(), visible: discInView(), about: isAbout(),
      }));
    } catch {
      // Use the browser's navigation information when storage is unavailable.
    }
  });

  window.addEventListener('pagereveal', (event) => {
    let source;
    try {
      const state = sessionStorage.getItem(sourceKey);
      sessionStorage.removeItem(sourceKey);
      if (state) {
        const saved = JSON.parse(state);
        if (['home', 'section', 'post'].includes(saved?.page) && Number.isFinite(saved.angle)) source = saved;
      }
    } catch {
      // A private session may block storage.
    }

    const transition = event.viewTransition;
    if (!transition) return;
    if (reducedMotion.matches) {
      transition.skipTransition();
      return;
    }

    // History traversal can restore the root styles from an earlier transition.
    root.style.removeProperty('--record-flight');

    // The Navigation API is newer than cross-document transitions on Safari.
    // The outgoing page marker also covers history navigation on that browser.
    if (!source) {
      const previous = window.navigation?.activation?.from?.url || document.referrer;
      const path = previous ? new URL(previous, location.href).pathname : '';
      const fromPost = /\/\d{4}\/\d{2}\/\d{2}\/[^/]+/.test(path);
      const fromSection = /\/(?:research|course|music|about)(?:\/index\.html|\/)?$/.test(path);
      source = {
        page: fromPost ? 'post' : fromSection ? 'section' : 'home',
        angle: 0,
        about: /\/about(?:\/index\.html|\/)?$/.test(path),
      };
    }

    const arrivingOnAbout = isAbout() && !source.about;
    const postNavigation = page === 'post' || source.page === 'post';
    if (postNavigation) transition.types?.add('post-navigation');

    if (source.visible === false && page === 'home') {
      transition.types?.add('reveal-disc');
      return;
    }
    // Navigation from the end of an article may start below the title.
    if (source.visible === false && postNavigation && !arrivingOnAbout) {
      transition.types?.add('spin-disc');
      return;
    }

    // Both snapshots show the same orientation throughout the crossfade.
    const arrivalAngle = arrivingOnAbout ? -90 : 0;
    const angleDifference = discAngle() + arrivalAngle - source.angle;
    const clockwise = ((angleDifference % 360) + 360) % 360;
    const sweep = clockwise < 120 ? clockwise + 360 : clockwise;
    root.style.setProperty('--record-sweep', `${sweep}deg`);
    root.style.setProperty('--record-arrival-angle', `${arrivalAngle}deg`);
    if (postNavigation) {
      // Keep the angular speed proportional to the 300° homepage spin.
      root.style.setProperty('--record-flight', `calc(var(--record-turn) * ${sweep / 360})`);
    }
    transition.types?.add('travel-disc');
    if (arrivingOnAbout) transition.types?.add('favicon-arrival');
    if (page === 'home' && source.about) transition.types?.add('favicon-departure');
  });
})();
