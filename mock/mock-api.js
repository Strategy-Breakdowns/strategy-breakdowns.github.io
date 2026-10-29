// SB Dash demo: a browser-side stand-in for the dashboard's server. Every /api/* call the
// real front-end makes is answered from the synthetic files in /mock/data. Nothing leaves
// the browser, and a reload resets anything you changed.
(function () {
  'use strict';
  const realFetch = window.fetch.bind(window);
  const sleep = ms => new Promise(r => setTimeout(r, ms));
  const cache = new Map();

  const json = (body, status = 200) => new Response(typeof body === 'string' ? body : JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } });
  const html = body => new Response(body, { status: 200, headers: { 'Content-Type': 'text/html' } });

  async function file(name) {
    if (!cache.has(name)) cache.set(name, realFetch(`/mock/data/${name}.json`).then(r => (r.ok ? r.text() : null)));
    const t = await cache.get(name);
    return t == null ? json({ error: `${name} is not part of the demo.` }, 404) : json(t);
  }

  const ME = { person: { name: 'Tom', email: 'tom@demo.invalid', picture: '/team/tom.jpg', onboarded: true }, via: 'demo', people: ['Tom', 'James', 'Karen', 'Bryan'], dev: false, liveUrl: null };

  async function route(method, path, query, init) {
    await sleep(40 + Math.random() * 140);
    if (method !== 'GET') {
      // Writes succeed in the browser only: drag a Daily, tick a box, nothing is saved.
      if (/\/api\/dailies\/[^/]+\/comments$/.test(path)) {
        let text = ''; try { text = JSON.parse(init.body || '{}').text || ''; } catch {}
        return json({ ok: true, comment: { id: 'demo-' + Date.now(), created: new Date().toISOString(), author: 'Tom', text } });
      }
      return json({ ok: true, demo: true });
    }
    switch (path) {
      case '/api/me': return json(ME);
      case '/api/config': return json({ teamMode: true, logoToken: 'demo' });
      case '/api/nav/shared': return json({ tabs: [], groups: [], can: false, why: 'Sharing tabs is switched off in the demo.' });
      case '/api/feedback-jobs': return json({ jobs: [] });
      case '/api/newsletter-replies': return json({ connected: false, reason: 'Replies are switched off in the demo.', replies: [], counts: {} });
      case '/api/favicon': return new Response('', { status: 404 });
      // Tabs left out of the demo still get asked at start-up: answer with empty shapes.
      case '/api/context': return json([]);
      case '/api/suggestions': return json({ content: '', upgrades: '', bryan: '', ideas: { at: null, items: [] } });
      case '/api/content-kitchen': return json({ registry: { kinds: [], owners: [], formats: [], ingredients: [] } });
    }
    let m;
    if ((m = path.match(/^\/api\/dailies\/([^/]+)\/(comments|changelog|read-time|compare)$/))) return file(`daily/${m[1]}.${m[2]}`);
    if ((m = path.match(/^\/api\/dailies\/([^/]+)\/compare\/result$/))) return file(`daily/${m[1]}.compare`);
    if ((m = path.match(/^\/api\/dailies\/([^/]+)\/graphic-html$/)))
      return html(`<!doctype html><html><body style="margin:0;background:#fff"><img src="/mock/img/${m[1]}.svg" style="display:block;width:100%;height:auto"></body></html>`);
    if ((m = path.match(/^\/api\/dailies\/([^/]+)\/image$/))) return realFetch(`/mock/img/${m[1]}.svg`);
    if ((m = path.match(/^\/api\/campaign-story\/([^/]+)$/))) return file(`story/${m[1]}`);
    if ((m = path.match(/^\/api\/scribbles\/([^/]+)$/))) return file(`scribble/${m[1]}`);
    if ((m = path.match(/^\/api\/skills\/([^/]+)$/))) {
      const list = await (await file('skills')).json();
      const s = (Array.isArray(list) ? list : []).find(x => x.id === m[1]) || { id: m[1], name: m[1] };
      return json({ ...s, content: `# ${s.name || s.id}\n\n${s.description || ''}\n\n_The full instructions for this skill aren't part of the demo._`, relatedSkills: [] });
    }
    if ((m = path.match(/^\/api\/funnel\/automation\/([^/]+)\/emails$/))) return json({ emails: [] });
    if (path === '/api/funnel/strategyhub') return file('funnel_strategyhub');
    // /api/dailies/board -> dailies_board.json, /api/radar/archive -> radar_archive.json ...
    return file(path.replace(/^\/api\//, '').replace(/\//g, '_'));
  }

  window.fetch = async function (input, init = {}) {
    const url = new URL(typeof input === 'string' ? input : input.url, location.href);
    const method = (init.method || (typeof input === 'object' && input.method) || 'GET').toUpperCase();
    if (url.origin === location.origin) {
      if (/^\/api\//.test(url.pathname)) return route(method, url.pathname, url.searchParams, init);
      if (url.pathname === '/pulse/data.json') return file('pulse');
      if (url.pathname === '/social/data.json') return file('social');
    }
    return realFetch(input, init);
  };

  if (navigator.sendBeacon) {
    const realBeacon = navigator.sendBeacon.bind(navigator);
    navigator.sendBeacon = (url, data) => (/\/api\//.test(String(url)) ? true : realBeacon(url, data));
  }

  // Live updates: a quiet stand-in so nothing retries in a loop.
  const RealES = window.EventSource;
  window.EventSource = function (url, opts) {
    if (!/\/events$/.test(new URL(url, location.href).pathname)) return new RealES(url, opts);
    const es = { readyState: 1, url: String(url), onopen: null, onmessage: null, onerror: null, close() { this.readyState = 2; }, addEventListener() {}, removeEventListener() {} };
    setTimeout(() => { if (typeof es.onopen === 'function') es.onopen({ type: 'open' }); }, 80);
    return es;
  };
})();
