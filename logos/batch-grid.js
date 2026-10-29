// Batch grid for review pages: each batch is a titled section with its cards in a responsive grid, and a
// jump bar at the top links to each batch. Plain page scrolling, no pan or zoom.
// Usage: const g = makeGrid(hostEl, {cardW}); g.render([{id, nav, title, sub, total, cards:[{id, el | html}]}]);
function makeGrid(host, opt = {}) {
  const o = Object.assign({ cardW: 250 }, opt);
  host.classList.add('bg-host');
  host.style.setProperty('--bg-card-w', o.cardW + 'px');
  const nav = document.createElement('nav'), body = document.createElement('div');
  nav.className = 'bg-nav'; nav.setAttribute('aria-label', 'Jump to batch'); body.className = 'bg-body';
  host.prepend(nav, body);
  let batches = [];
  function render(spec) {
    batches = spec;
    nav.innerHTML = batches.map(b => `<button type="button" data-goto="${b.id}">${b.nav || b.title}<span>${b.cards.length}</span></button>`).join('');
    body.replaceChildren(...batches.map(b => {
      const sec = document.createElement('section'); sec.className = 'bg-batch'; sec.dataset.batch = b.id;
      const head = document.createElement('div'); head.className = 'bg-head';
      head.innerHTML = '<h3 class="bg-ft"></h3><span class="bg-fs"></span>';
      head.querySelector('.bg-ft').textContent = b.title; head.querySelector('.bg-fs').textContent = b.sub || '';
      const grid = document.createElement('div'); grid.className = 'bg-grid';
      b.cards.forEach(c => {
        let el = c.el;
        if (!el) { const t = document.createElement('template'); t.innerHTML = c.html.trim(); el = t.content.firstElementChild; }
        if (el) { el.classList.add('bg-cell'); grid.appendChild(el); }
      });
      sec.append(head, grid); return sec;
    }));
  }
  function goTo(id) { body.querySelector(`[data-batch="${id}"]`)?.scrollIntoView({ behavior: 'smooth', block: 'start' }); }
  nav.addEventListener('click', e => { const b = e.target.closest('[data-goto]'); if (b) goTo(b.dataset.goto); });
  return { render, goTo };
}
