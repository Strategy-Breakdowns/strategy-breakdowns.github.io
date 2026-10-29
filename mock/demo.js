// SB Dash demo: everything the real dashboard gets from the outside world, made safe.
//  - sponsor logos point at the drawn logos for the fictional companies
//  - Daily graphics load from /mock/img instead of the server
//  - links out to Notion, the CRM, Slack and beehiiv are switched off
//  - money is scrambled and blurred on the revenue tabs ("spoiler mode"): the digits on
//    the page are not the digits in the data, so inspecting the page shows nothing either
(function () {
  'use strict';

  // ---------------------------------------------------------------- images
  const demoLogo = domain => {
    const d = String(domain || '').toLowerCase().replace(/^www\./, '');
    return /\.demo$/.test(d) ? `/logos/co/${d.replace(/\.demo$/, '')}.svg` : null;
  };
  function fixImg(img) {
    const src = img.getAttribute('src') || '';
    // Lead Stream shows a generic face rather than a team member's photo (Tom, 28 Oct 2026).
    if (/^\/team\//.test(src) && img.closest && img.closest('#panel-orbit')) { img.setAttribute('src', '/mock/avatar.svg'); return; }
    let m;
    if ((m = src.match(/img\.logo\.dev\/([^?/]+)/)) || (m = src.match(/[?&](?:d|domain)=([^&]+)/))) {
      const l = demoLogo(decodeURIComponent(m[1]));
      if (l) { img.setAttribute('src', l); img.removeAttribute('crossorigin'); }
      // Real tools (beehiiv, Notion, Slack) keep their public icon, from a free favicon service.
      else if (/img\.logo\.dev/.test(src)) { img.setAttribute('src', `https://www.google.com/s2/favicons?domain=${encodeURIComponent(decodeURIComponent(m[1]))}&sz=64`); img.removeAttribute('crossorigin'); }
    } else if ((m = src.match(/^\/api\/dailies\/([^/]+)\/image/))) img.setAttribute('src', `/mock/img/${m[1]}.svg`);
  }
  function fixFrame(f) {
    const src = f.getAttribute('src') || '';
    const m = src.match(/^\/api\/dailies\/([^/]+)\/graphic-html/);
    if (m) { f.removeAttribute('src'); f.srcdoc = `<!doctype html><body style="margin:0"><img src="/mock/img/${m[1]}.svg" style="display:block;width:100%">`; }
  }

  // ---------------------------------------------------------------- spoiler mode
  // The tabs where money shows. Inside them every money figure is scrambled and blurred.
  const MONEY_ROOTS = ['#panel-home', '#panel-pipeline', '#panel-bookings', '#panel-revmodel', '#panel-funnel',
    '#panel-ladder', '#panel-nextmoves', '#panel-orbit', '#panel-stories .cs-money'];
  const MONEY = /([$€£]\s?\d[\d,.]*\s?[kKmMbB]?)|(\b\d[\d,.]*\s?[kKmM]\b(?!\w))|(\b\d{1,3}(,\d{3})+(\.\d+)?\b)|(\b\d+(\.\d+)?%)/;
  const scramble = s => s.replace(/\d/g, () => String(Math.floor(Math.random() * 10)));
  const inMoneyRoot = el => el && MONEY_ROOTS.some(sel => el.closest?.(sel));
  const isTip = el => el && el.closest?.('.rev-tip, .chart-tip, [class*="tooltip"], [class*="-tip"]');
  function spoil(node) {
    if (node.nodeType === 3) {
      const p = node.parentElement;
      if (!p || p.closest('.demo-blur, script, style, textarea, input')) return;
      if (!MONEY.test(node.nodeValue)) return;
      if (!inMoneyRoot(p) && !(isTip(p) && /[$€£]/.test(node.nodeValue))) return;
      if (p.namespaceURI === 'http://www.w3.org/2000/svg') {
        // Mark it first: changing the text fires the observer again, and a 2nd pass must stop here.
        if (p.getAttribute('data-demo-blur') === node.nodeValue) return;
        const v = scramble(node.nodeValue);
        p.setAttribute('data-demo-blur', v);
        p.setAttribute('filter', 'url(#demoBlur)');
        node.nodeValue = v;
        return;
      }
      const span = document.createElement('span');
      span.className = 'demo-blur';
      span.textContent = scramble(node.nodeValue);
      span.title = 'Numbers are blurred in the demo';
      node.replaceWith(span);
      // Big numbers need a bigger blur to stay unreadable.
      const fs = parseFloat(getComputedStyle(span).fontSize) || 14;
      span.style.filter = `blur(${Math.max(5, Math.round(fs * 0.32))}px)`;
      return;
    }
    if (node.nodeType !== 1) return;
    if (node.tagName === 'IMG') fixImg(node);
    if (node.tagName === 'IFRAME') fixFrame(node);
    node.querySelectorAll?.('img').forEach(fixImg);
    node.querySelectorAll?.('iframe').forEach(fixFrame);
    const w = document.createTreeWalker(node, NodeFilter.SHOW_TEXT);
    const list = []; while (w.nextNode()) list.push(w.currentNode);
    list.forEach(spoil);
  }
  const mo = new MutationObserver(muts => {
    for (const m of muts) {
      if (m.type === 'characterData') spoil(m.target);
      else if (m.type === 'attributes') { if (m.target.tagName === 'IMG') fixImg(m.target); else if (m.target.tagName === 'IFRAME') fixFrame(m.target); }
      else m.addedNodes.forEach(spoil);
    }
  });
  function start() {
    const defs = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    defs.setAttribute('width', '0'); defs.setAttribute('height', '0'); defs.style.position = 'absolute';
    defs.innerHTML = '<filter id="demoBlur"><feGaussianBlur stdDeviation="3.2"/></filter>';
    document.body.appendChild(defs);
    spoil(document.body);
    mo.observe(document.body, { childList: true, subtree: true, characterData: true, attributes: true, attributeFilter: ['src'] });

    const pill = document.createElement('a');
    pill.className = 'demo-pill';
    pill.href = 'https://strategybreakdowns.com';
    pill.target = '_blank';
    pill.rel = 'noopener';
    pill.innerHTML = '<b>Demo</b> Every company, person and number is made up';
    document.body.appendChild(pill);
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start); else start();

  // ---------------------------------------------------------------- links out
  function toast(msg) {
    let t = document.getElementById('demoToast');
    if (!t) { t = document.createElement('div'); t.id = 'demoToast'; t.className = 'demo-toast'; document.body.appendChild(t); }
    t.textContent = msg; t.classList.add('on');
    clearTimeout(toast.t); toast.t = setTimeout(() => t.classList.remove('on'), 2600);
  }
  window.demoToast = toast;

  // Nothing in the demo can touch the real newsletter, and these buttons say so.
  document.addEventListener('click', e => {
    const t = e.target.closest && e.target.closest('button, a');
    if (!t) return;
    if (t.matches('button.db-bh, [data-migrate]') || /^\s*Migrate\b/.test(t.textContent || '')) {
      e.preventDefault(); e.stopPropagation();
      toast('Migrating to beehiiv is switched off in the demo. Nothing here touches the real newsletter.');
    }
  }, true);
  // Skills: the names are on show, the instructions are not.
  document.addEventListener('click', e => {
    if (e.target.closest && e.target.closest('#panel-skills .sk-row, .related-skill-item, #panel-skills [data-skill]')) {
      e.preventDefault(); e.stopPropagation();
      toast('Skill details are left out of the demo.');
    }
  }, true);
  // Tabs that only show their shape: everything under the heading is blurred.
  const BLURRED = { newsletter: 'Newsletter Performance', audience: 'Audience Growth', sharefunnel: 'Share Funnel', social: 'Social Performance', scribbles: 'SB Scribbles' };
  function noteBlurred() {
    for (const id of Object.keys(BLURRED)) {
      const p = document.getElementById('panel-' + id);
      if (!p || p.querySelector('.demo-blur-note')) continue;
      const n = document.createElement('div');
      n.className = 'demo-blur-note';
      n.textContent = 'Blurred in the demo: this tab runs on our real numbers and writing, so you only get its shape.';
      p.prepend(n);
    }
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', noteBlurred); else noteBlurred();
  document.addEventListener('click', e => {
    const a = e.target.closest && e.target.closest('a[href]');
    if (!a) return;
    const href = a.getAttribute('href') || '';
    if (/^(https?:)?\/\/(demo\.invalid|app\.notion\.com|www\.notion\.so|app\.attio\.com|[\w.-]*slack\.com|app\.beehiiv\.com|mail\.google\.com|[\w-]+\.notion\.site)/.test(href) || /^https:\/\/demo\.invalid/.test(href)) {
      e.preventDefault(); e.stopPropagation();
      toast('Links to Notion, the CRM, Slack and beehiiv are switched off in the demo.');
    }
  }, true);
  const realOpen = window.open;
  window.open = function (url, ...rest) {
    if (/demo\.invalid|notion|attio|slack\.com|beehiiv\.com\/(posts|automations)|mail\.google/.test(String(url))) { toast('Links to Notion, the CRM, Slack and beehiiv are switched off in the demo.'); return null; }
    return realOpen.call(window, url, ...rest);
  };
})();
