// One passive pointer listener for all mounted decorative scenes; no React renders on movement.
const hosts = new Map();
let observer;
let preferenceObserver;
let motionQuery;
let pointerQuery;
let frame = 0;
let pending;

function reduced(host) {
  return motionQuery?.matches || !pointerQuery?.matches || document.hidden ||
    document.documentElement.dataset.appReducedMotion === 'true' ||
    document.documentElement.dataset.appOrnaments === 'false' ||
    !!host.closest('[data-teacher-motion="reduced"], [data-teacher-pattern="none"], [data-sq-motion="off"]');
}

function reset(host) {
  for (const node of hosts.get(host) || []) {
    node.style.removeProperty('--sq-drift-x');
    node.style.removeProperty('--sq-drift-y');
    node.removeAttribute('data-sq-active');
  }
}

function move(event) {
  const host = event.target instanceof Element ? event.target.closest('[data-sq-host]') : null;
  if (pending?.host && pending.host !== host) reset(pending.host);
  if (!host || !hosts.has(host) || reduced(host)) {
    pending = undefined;
    return;
  }
  pending = { host, x: event.clientX, y: event.clientY };
  if (frame) return;
  frame = requestAnimationFrame(() => {
    frame = 0;
    if (!pending || !hosts.has(pending.host) || reduced(pending.host)) return;
    const { host: active, x, y } = pending;
    const box = active.getBoundingClientRect();
    if (!box.width || !box.height) return;
    const dx = Math.max(-1, Math.min(1, (x - box.left) / box.width * 2 - 1)) * 10;
    const dy = Math.max(-1, Math.min(1, (y - box.top) / box.height * 2 - 1)) * 8;
    for (const node of hosts.get(active)) {
      if (node.dataset.sqVisible === 'false' || node.dataset.sqInteractive === 'false') continue;
      node.style.setProperty('--sq-drift-x', `${dx.toFixed(2)}px`);
      node.style.setProperty('--sq-drift-y', `${dy.toFixed(2)}px`);
      node.dataset.sqActive = 'true';
    }
  });
}

function leave(event) {
  const host = event.target instanceof Element ? event.target.closest('[data-sq-host]') : null;
  if (host && !(event.relatedTarget instanceof Node && host.contains(event.relatedTarget))) {
    reset(host);
    if (pending?.host === host) pending = undefined;
  }
}

function syncPreferences() {
  for (const [host, nodes] of hosts) {
    reset(host);
    for (const node of nodes) node.dataset.sqPaused = String(document.hidden);
  }
}

function start() {
  motionQuery = matchMedia('(prefers-reduced-motion: reduce)');
  pointerQuery = matchMedia('(hover: hover) and (pointer: fine)');
  document.addEventListener('pointermove', move, { passive: true });
  document.addEventListener('pointerout', leave, { passive: true });
  document.addEventListener('visibilitychange', syncPreferences);
  motionQuery.addEventListener('change', syncPreferences);
  pointerQuery.addEventListener('change', syncPreferences);
  if ('IntersectionObserver' in window) {
    observer = new IntersectionObserver(entries => {
      for (const entry of entries) entry.target.dataset.sqVisible = String(entry.isIntersecting);
    }, { rootMargin: '60px' });
  }
  preferenceObserver = new MutationObserver(syncPreferences);
  preferenceObserver.observe(document.documentElement, {
    attributes: true, attributeFilter: ['data-app-reduced-motion', 'data-app-ornaments'],
  });
}

function stop() {
  document.removeEventListener('pointermove', move);
  document.removeEventListener('pointerout', leave);
  document.removeEventListener('visibilitychange', syncPreferences);
  motionQuery?.removeEventListener('change', syncPreferences);
  pointerQuery?.removeEventListener('change', syncPreferences);
  observer?.disconnect();
  preferenceObserver?.disconnect();
  if (frame) cancelAnimationFrame(frame);
  frame = 0;
  pending = undefined;
}

export function registerOrnamentScene(node) {
  const host = node.parentElement;
  if (!host) return () => {};
  if (!hosts.size) start();
  if (!hosts.has(host)) hosts.set(host, new Set());
  hosts.get(host).add(node);
  host.setAttribute('data-sq-host', '');
  node.dataset.sqPaused = String(document.hidden);
  observer?.observe(node);
  return () => {
    observer?.unobserve(node);
    const nodes = hosts.get(host);
    nodes?.delete(node);
    if (!nodes?.size) {
      host.removeAttribute('data-sq-host');
      hosts.delete(host);
    }
    if (!hosts.size) stop();
  };
}
