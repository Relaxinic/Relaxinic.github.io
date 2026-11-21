export function createGlitchSound(url) {
  const AudioEngine = window.AudioContext || window.webkitAudioContext;
  if (!AudioEngine) return () => {};

  let context;
  let pendingBuffer;
  let resuming = false;
  let voice;
  let requestedAt = -Infinity;
  let lastPlayed = -Infinity;

  function loadBuffer() {
    pendingBuffer ??= fetch(url).then(async (response) => {
      if (!response.ok) throw new Error('Could not load the glitch sound');
      return context.decodeAudioData(await response.arrayBuffer());
    }).catch((error) => {
      pendingBuffer = null;
      throw error;
    });
    return pendingBuffer;
  }

  async function playCue() {
    const buffer = await loadBuffer();
    // A deferred browser resume should not replay an earlier scroll gesture.
    if (context.state !== 'running' || performance.now() - requestedAt > 380) return;
    if (context.currentTime - lastPlayed < 0.32) return;
    const source = context.createBufferSource();
    const gain = context.createGain();
    gain.gain.value = 0.16;
    source.buffer = buffer;
    source.connect(gain).connect(context.destination);
    source.onended = () => {
      source.disconnect();
      gain.disconnect();
      if (voice === source) voice = null;
    };
    voice?.stop();
    voice = source;
    source.start();
    requestedAt = -Infinity;
    lastPlayed = context.currentTime;
  }

  async function resume(event) {
    if (event && !event.isTrusted) return;
    if (context?.state === 'running' || (!event && resuming)) return;
    try {
      context ??= new AudioEngine();
      resuming = true;
      await Promise.all([context.resume(), loadBuffer()]);
      await playCue();
    } catch {
      // The scroll interaction still works when audio is unavailable.
    } finally {
      resuming = false;
    }
  }

  // A wheel event alone cannot unlock audio in browsers that require a gesture.
  for (const type of ['pointerdown', 'pointerup', 'touchend', 'keydown']) {
    window.addEventListener(type, resume, { capture: true, passive: true });
  }

  return () => {
    requestedAt = performance.now();
    if (context?.state === 'running') playCue().catch(() => {});
    else resume();
  };
}
