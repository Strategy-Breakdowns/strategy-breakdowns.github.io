// The Editor's Desk (demo): where a Daily gets written.
//
// The research desk (Claude) files the clippings: the brief, the charts, angles, stats, quotes,
// sources, subject lines, preview texts, poll ideas, why it's timely. This is phase 1 of the desk
// (Tom, 29 Oct 2026): "the desk fills with clippings (charts, angles, sources, stats). We move
// them around, and pin what matters (so the briefings get better each time)". Pins are what the
// research desk learns from. Phases 2-4 (James pass, Tom pass, Ready to slot) happen in the
// Notion edition (Tom, 29 Oct 2026): here that is a mock Notion page inside the demo, holding
// everything filed under Use it and Maybe. It never links to the real Notion. Clippings flow in
// from 3 feeds, the call transcript, Slack and the research desk, all made up.
// The desk runs along a "This <-> Not this" line (Tom's moodboard, 28 Oct 2026): clippings
// come in on the left, get dealt 1 click at a time, and wherever you drop one files it under
// Use it, Maybe or Cut. Everything in "Use it" shows up on the page as plain text to copy,
// and the piece itself is written there, by a person.
//
// It takes over the "Daily Editor" tab: open / openAt / close / preview come here.
(function () {
  'use strict';
  const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const store = {
    get: k => { try { return JSON.parse(localStorage.getItem(k) || 'null'); } catch { return null; } },
    set: (k, v) => { try { localStorage.setItem(k, JSON.stringify(v)); } catch {} },
  };
  const rnd = seed => { let s = 0; for (const ch of String(seed)) s = (s * 31 + ch.charCodeAt(0)) >>> 0; return () => ((s = (s * 1103515245 + 12345) >>> 0) / 4294967296); };

  const ZONES = [
    { id: 'new', label: 'New in', hint: 'Filed by the research desk' },
    { id: 'use', label: 'Use it', hint: 'This' },
    { id: 'maybe', label: 'Maybe', hint: '' },
    { id: 'cut', label: 'Cut', hint: 'Not this' },
  ];
  const S = { el: null, cards: [], idx: 0, open: false, z: 10, comments: {}, phase: 1 };
  const NOTION_LOGO = '<svg class="nb-logo" viewBox="0 0 24 24" aria-hidden="true"><rect x="2.5" y="2.5" width="19" height="19" rx="3.5" fill="#fff" stroke="#111" stroke-width="1.6"/><path d="M8 17V7.5l7.6 9.5V7" fill="none" stroke="#111" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"/></svg>';


  async function load() {
    if (S.cards.length) return;
    const d = await (await fetch('/api/dailies')).json();
    // 3 desks' worth, all made-up stories (Tom, 28 Oct 2026).
    S.pool = (d.cards || []).filter(c => c.image);
    S.cards = (d.cards || []).filter(c => c.angle && c.versions?.angles?.length).slice(0, 3);
  }
  async function commentsFor(id) {
    if (!S.comments[id]) { try { S.comments[id] = (await (await fetch(`/api/dailies/${id}/comments`)).json()).comments || []; } catch { S.comments[id] = []; } }
    return S.comments[id];
  }

  // ---------------------------------------------------------------- clippings
  const bigNumber = t => (String(t).match(/[$€£]?\d[\d.,:]*\s?(?:B|M|bn|%|x|h|\/day|\/ly)?/) || [])[0];
  // Every number, quote and source below is made up, like the companies (the demo pill says so).
  function clippingsFor(c, notes) {
    const v = c.versions || {}, rr = rnd('clips' + c.id), pick = xs => xs[Math.floor(rr() * xs.length)];
    const pub = (String(c.angle).match(/and (.+?) is not a real publication/) || [])[1] || 'The Daily Wire Service';
    const subjects = (v.subjects?.[0] || []).slice(0, 4);
    const previews = [`1 chart, 1 big idea: ${String(c.name).split(/[,.]/)[0].toLowerCase()}.`, `The story behind ${c.company}'s strangest number.`, 'Fictional company, very real lesson.'];
    const polls = [`Would you buy ${c.company} stock?`, 'Is this number a lot or a little?', 'Has your company done this too?'];
    const n = bigNumber(c.name) || bigNumber(c.angle);
    const stats = [
      [`${(1.5 + rr() * 3).toFixed(1)}x`, 'vs this time last year'],
      [`${10 + Math.floor(rr() * 60)}%`, `of ${c.company}'s revenue rides on it`],
      [`$${(0.2 + rr() * 4).toFixed(1)}B`, 'spent getting here'],
      [`${2 + Math.floor(rr() * 9)} yrs`, 'since anyone asked'],
    ];
    const quotes = [
      [`We didn't set out to do this. It just kept working.`, `a ${c.company} exec, Q3 call`],
      [`Everyone is looking at the headline number. Look at the 2nd chart.`, `an analyst at ${pub}`],
      [`If this holds, the whole category reprices.`, `a former ${c.company} board member`],
      [`Nobody in the building thought this was the story.`, `a ${c.company} employee, anonymously`],
    ];
    const related = (S.pool || []).filter(o => o.id !== c.id && o.image).slice((c.name.length % 5), (c.name.length % 5) + 2);
    const clip = {
      wire: { id: 'wire', kind: 'wire', w: 250, text: `${c.name}\n\n${c.angle}`, html: `<div class="ed-kicker">From the research desk</div><h3>${esc(c.name)}</h3><p>${esc(c.angle)}</p><div class="ed-dateline">${esc(c.company || '')} · source: ${esc(pub)}</div>` },
      chart: { id: 'chart', kind: 'photo', w: 200, text: `Chart: ${c.name}`, html: `<span class="ed-tape"></span><span class="ed-tape r"></span><img src="${esc(c.image || '')}" alt="" draggable="false"><div class="ed-caption">Chart filed with the brief</div>` },
    };
    const out = [clip.wire, clip.chart];
    const push = x => x && out.push(x);
    const transcript = { id: 'call0', kind: 'transcript', w: 240, from: 'call', text: `James (Monday call): "${n || 'The number'} is the hook. Lead with it, the rest is context."`, html: `<div class="ed-tr-h">Monday call · 00:14:32</div><div class="ed-tr"><b>James:</b> ${esc(n || 'The number')} is the hook. Lead with it, the rest is context.</div><div class="ed-tr"><b>Tom:</b> Agreed. And find out who else noticed.</div>` };
    const slack = { id: 'slack0', kind: 'slackmsg', w: 240, from: 'slack', text: `#sb-daily-ideas, Tom: "${c.company} keeps coming up. Daily?"`, html: `<div class="ed-sl-h"># sb-daily-ideas</div><div class="ed-sl"><b>Tom</b> ${esc(c.company)} keeps coming up in my feed. Daily?</div><div class="ed-sl"><b>James</b> On it 👀</div>` };
    const angle = i => { const a = (v.angles || [])[i]; return a && { id: 'angle' + i, kind: 'cut cut' + i, w: 220, text: `Angle ${i + 1} (${a.name}): ${a.hook}`, html: `<div class="ed-cut-label">Angle ${i + 1}: ${esc(a.name)}</div><div class="ed-cut-text">${esc(a.hook)}</div>` }; };
    const stat = (i, big, label) => ({ id: 'stat' + i, kind: 'stat' + (i ? ' alt' + (i % 3) : ''), w: 150, text: `Stat: ${big} ${label}`, html: `<div class="ed-stat">${esc(big)}</div><div class="ed-stat-l">${esc(label)}</div>` });
    const quote = i => ({ id: 'quote' + i, kind: 'quote q' + i, w: 230, text: `"${quotes[i][0]}" (${quotes[i][1]})`, html: `<div class="ed-q-mark">“</div><div class="ed-q">${esc(quotes[i][0])}</div><div class="ed-q-by">- ${esc(quotes[i][1])}</div>` });
    const rel = (o, i) => ({ id: 'related' + i, kind: 'photo sm', w: 170, text: `Related chart: ${o.name}`, html: `<span class="ed-tape"></span><img src="${esc(o.image)}" alt="" draggable="false"><div class="ed-caption">Related: ${esc(o.company || o.name)}</div>` });
    if (n) push(stat(0, n, 'the number that stops you'));
    push(transcript);
    push(angle(0));
    push(quote(0));
    if (related[0]) push(rel(related[0], 0));
    push(stat(1, ...stats[0]));
    push(angle(1));
    if (subjects.length) push({ id: 'subjects', kind: 'index', w: 230, text: 'Subject lines:\n' + subjects.map(s => '- ' + s).join('\n'), html: `<div class="ed-index-h">Subject lines</div>${subjects.map(s => `<div class="ed-index-li">${esc(s)}</div>`).join('')}` });
    push(slack);
    push(quote(1));
    push(stat(2, ...stats[1]));
    push(angle(2));
    push({ id: 'sources', kind: 'index src', w: 230, text: `Sources:\n- ${pub}\n- ${c.company} Q3 shareholder letter\n- ${c.company} careers page, archived`, html: `<div class="ed-index-h">Sources (all made up)</div><div class="ed-index-li">${esc(pub)}</div><div class="ed-index-li">${esc(c.company)} Q3 shareholder letter</div><div class="ed-index-li">${esc(c.company)} careers page, archived</div>` });
    if (related[1]) push(rel(related[1], 1));
    push(quote(2));
    push(stat(3, ...stats[2]));
    push({ id: 'preview', kind: 'stub', w: 230, text: 'Preview text:\n' + previews.map(s => '- ' + s).join('\n'), html: `<div class="ed-stub-h">Preview text</div>${previews.map(s => `<div class="ed-stub-li">${esc(s)}</div>`).join('')}` });
    push({ id: 'polls', kind: 'sticky blue', w: 200, text: 'Poll ideas:\n' + polls.map(s => '- ' + s).join('\n'), html: `<div class="ed-hand-h">Poll ideas</div>${polls.map(s => `<div class="ed-hand sm">${esc(s)}</div>`).join('')}` });
    push(quote(3));
    push(stat(4, ...stats[3]));
    if (c.timelyWhy) push({ id: 'why', kind: 'sticky', w: 180, text: `Why now: ${c.timelyWhy}`, html: `<div class="ed-hand-h">Why now?</div><div class="ed-hand">${esc(c.timelyWhy)}</div>` });
    if (v.share?.[0]) { const who = String(v.share[0]).replace(/^Send to someone who \[?|\]$/g, ''); push({ id: 'share', kind: 'sticky pink', w: 180, text: `Who'd forward it: ${who}`, html: `<div class="ed-hand-h">Who'd forward it?</div><div class="ed-hand">${esc(who)}</div>` }); }
    notes.slice(0, 2).forEach((m, i) => push({ id: 'note' + i, kind: 'margin ' + (m.author === 'Tom' ? 'tom' : 'james'), w: 200, text: `${m.author}: ${m.text}`, html: `<div class="ed-hand">${esc(m.text)}</div><div class="ed-sig">- ${esc(m.author)}</div>` }));
    // Where each clipping came in from: the call, Slack or the research desk.
    const FROM = { angle0: 'call', angle1: 'call', angle2: 'call', why: 'slack', share: 'slack', note0: 'slack', note1: 'slack', polls: 'slack' };
    for (const o of out) { o.from ||= FROM[o.id] || 'research'; o.html += `<span class="ed-from ed-from-${o.from}">${FEED[o.from].stamp}</span>`; }
    return out;
  }
  const FEED = {
    call: { label: 'Call transcript', sub: 'Monday topics call', stamp: 'from the call', icon: '📞' },
    slack: { label: 'Slack', sub: '#sb-daily-ideas', stamp: 'from Slack', icon: '💬' },
    research: { label: 'Research desk', sub: 'charts, stats, sources', stamp: 'from research', icon: '🔎' },
  };

  // ---------------------------------------------------------------- geometry
  function zoneRects(desk) {
    const W = desk.clientWidth, H = desk.clientHeight, top = 64;
    const widths = [0.37, 0.21, 0.21, 0.21];        // New in is wide: phase 1 starts with a full desk
    let x = 0;
    return ZONES.map((z, i) => { const w = W * widths[i]; const r = { ...z, x, w, y: top, h: H - top }; x += w; return r; });
  }
  const zoneAt = (desk, cx) => { const rs = zoneRects(desk); return (rs.find(r => cx >= r.x && cx < r.x + r.w) || rs[0]).id; };
  // New clippings cascade down the lane like a filed stack, each header showing, and stop above the pile.
  // A wide lane takes 2 staggered stacks, so a full desk still shows every clipping's header.
  function spot(desk, zone, k, cl, seed, n) {
    const r = zoneRects(desk).find(z => z.id === zone), rr = rnd(seed);
    const cols = r.w >= 2 * 250 + 24 ? 2 : 1, colW = r.w / cols, c = k % cols, row = Math.floor(k / cols);
    const rows = Math.max(1, Math.ceil((n || 9) / cols) - 1);
    const step = Math.max(34, Math.min(130, (r.h - 70 - (zone === 'new' ? 376 : 220)) / rows));
    const x0 = r.x + c * colW;
    return { x: x0 + Math.max(8, Math.min(colW - cl.w - 8, 10 + rr() * Math.max(10, colW - cl.w - 20))), y: r.y + (zone === 'new' ? 96 : 50) + row * step + c * step / 2 + rr() * 8, rot: (rr() - 0.5) * 6 };
  }

  // ---------------------------------------------------------------- render
  async function render() {
    const c = S.cards[S.idx];
    const desk = S.el.querySelector('.ed-desk');
    if (!c) { desk.innerHTML = '<p class="ed-empty">No briefs on the desk yet.</p>'; return; }
    const clips = clippingsFor(c, await commentsFor(c.id));
    S.clips = clips;
    const key = 'edDesk4:' + c.id;
    let st = store.get(key);
    if (!st || !st.pos) st = { pos: {}, zone: {}, dealt: 6, pin: {}, draft: { head: '', body: '' }, read: {} };
    st.pin ||= {};
    S.st = st; S.key = key;
    clips.slice(0, st.dealt).forEach((cl, k) => { if (!st.pos[cl.id]) { st.pos[cl.id] = spot(desk, 'new', k, cl, c.id + cl.id, st.dealt); st.zone[cl.id] = 'new'; } });

    S.el.querySelector('.ed-which').innerHTML = S.cards.map((x, i) => `<option value="${i}"${i === S.idx ? ' selected' : ''}>Desk ${i + 1}: ${esc(x.name.slice(0, 64))}</option>`).join('');

    const rs = zoneRects(desk);
    const left = clips.length - st.dealt;
    const lanes = rs.map(r => `<div class="ed-lane ed-lane-${r.id}" style="left:${r.x}px;width:${r.w}px;top:${r.y}px;bottom:0">
        <div class="ed-lane-h"><b>${r.label}</b> <span>${clips.slice(0, st.dealt).filter(cl => st.zone[cl.id] === r.id).length}</span></div>
        ${r.id === 'new' ? `<div class="ed-feeds">${Object.entries(FEED).map(([k, f]) => `<span class="ed-feed ed-feed-${k}" data-feed="${k}"><i>${f.icon}</i><b>${f.label}</b><small>${f.sub}</small></span>`).join('')}</div>` : ''}
        ${r.id === 'new' ? `<div class="ed-pile${left ? '' : ' empty'}"><div class="ed-pile-n">${left ? `${left} more filed` : 'All dealt'}</div>
          <button class="ed-deal" ${left ? '' : 'disabled'}>Deal the next clipping</button><button class="ed-deal-all" ${left ? '' : 'disabled'}>Deal them all</button></div>` : ''}
      </div>`).join('');
    const axis = `<div class="ed-axis"><span class="ed-axis-this">This</span><span class="ed-axis-line"></span><span class="ed-axis-not">Not this</span></div>`;
    desk.innerHTML = axis + lanes + clips.slice(0, st.dealt).map(cl => {
      const p = st.pos[cl.id];
      return `<div class="ed-clip ${esc(cl.kind)}${st.pin[cl.id] ? ' is-pin' : ''}" data-id="${esc(cl.id)}" data-zone="${st.zone[cl.id]}" style="left:${p.x}px;top:${p.y}px;width:${cl.w}px;--rot:${p.rot}deg;z-index:${p.z || 1}">${cl.html}<button class="ed-pinbtn" title="${st.pin[cl.id] ? 'Unpin' : 'Pin it: the research desk learns from every pin'}" aria-label="Pin"></button></div>`;
    }).join('');
    renderPage();
    words();
    pins();
    renderNotion();
    (S.justDealt || []).forEach(id => {
      const el = desk.querySelector(`.ed-clip[data-id="${id}"]`), cl = S.clips.find(x => x.id === id);
      const src = cl && desk.querySelector(`.ed-feed[data-feed="${cl.from}"]`);
      if (!el || !src || !el.animate) return;
      const a = src.getBoundingClientRect(), b = el.getBoundingClientRect();
      el.animate([{ translate: `${a.left + a.width / 2 - (b.left + b.width / 2)}px ${a.top - b.top}px`, scale: '0.25', opacity: 0 }, { translate: '0px 0px', scale: '1', opacity: 1 }], { duration: 650, easing: 'cubic-bezier(.2,.8,.2,1)' });
    });
    S.justDealt = [];
  }
  // Phase 1 is sorting only, so the page stays folded away and the desk gets the full width.
  function setPhase(n) {
    S.phase = n;
    applyPhase();
    render();
    S.el.querySelector('.ed-notion')?.scrollTo({ top: 0 });
  }
  function applyPhase() {
    const main = S.el.querySelector('.ed-main');
    main.classList.toggle('phase1', S.phase === 1);
    main.classList.toggle('in-notion', S.phase > 1);
    S.el.querySelectorAll('.ed-phases i').forEach(i => i.classList.toggle('on', +i.dataset.phase === S.phase));
    S.el.querySelector('.ed-tonotion').hidden = S.phase !== 1;
    S.el.querySelector('.ed-padbtn').hidden = S.phase !== 1;
    S.el.querySelector('.ed-tidy').hidden = S.phase !== 1;
  }

  // The Notion edition, mocked inside the demo: nothing here reaches the real Notion.
  const STAGE = { 2: { status: 'James pass', who: 'James', tag: 'purple', next: 'Hand to Tom', nextPhase: 3, banner: 'James writes the first pass from the clippings below.' },
    3: { status: 'Tom pass', who: 'Tom', tag: 'orange', next: 'Mark ready to slot', nextPhase: 4, banner: 'Tom edits James\'s pass: tighter headline, sharper first line.' },
    4: { status: 'Ready to slot', who: 'Tom', tag: 'green', next: 'See it on Publishing', nextPhase: 0, banner: 'Done. It waits on the Publishing tab for a send day.' } };
  function block(cl) {
    const pin = S.st.pin[cl.id] ? '<span class="nb-pin" title="Pinned on the desk">📌</span>' : '';
    if (/^(chart|related)/.test(cl.id)) { const src = (cl.html.match(/<img src="([^"]+)"/) || [])[1]; return `<figure class="nb-img">${pin}<img src="${src}" alt=""><figcaption>${esc(cl.text)}</figcaption></figure>`; }
    if (/^stat/.test(cl.id)) return `<div class="nb-callout">${pin}<span>📊</span><div>${esc(cl.text.replace(/^Stat: /, ''))}</div></div>`;
    if (/^quote/.test(cl.id)) return `<blockquote class="nb-quote">${pin}${esc(cl.text)}</blockquote>`;
    return `<div class="nb-p">${pin}${esc(cl.text).replace(/\n/g, '<br>')}</div>`;
  }
  function renderNotion() {
    const box = S.el.querySelector('.ed-notion'); if (!box || S.phase === 1) return;
    const c = S.cards[S.idx], st = S.st, g = STAGE[S.phase], dealt = S.clips.slice(0, st.dealt);
    const use = dealt.filter(cl => st.zone[cl.id] === 'use'), maybe = dealt.filter(cl => st.zone[cl.id] === 'maybe');
    st.notion ||= {};
    const draft = st.notion.draft || '';
    box.innerHTML = `
      <div class="nb-bar">${NOTION_LOGO}<span class="nb-crumb">Strategy Breakdowns / Filo's Factory / ${esc(c.name.slice(0, 48))}</span><span class="nb-demo">Demo copy: nothing here touches our real Notion</span></div>
      <div class="nb-page">
        <div class="nb-icon">📊</div>
        <h1 class="nb-title">${esc(c.name)}</h1>
        <div class="nb-props">
          <div><span>Status</span><b class="nb-tag nb-${g.tag}">${g.status}</b></div>
          <div><span>Owner</span><b>${g.who}</b></div>
          <div><span>Company</span><b>${esc(c.company || '')}</b></div>
          <div><span>Publish by</span><b>${esc(c.publishBy || 'Evergreen')}</b></div>
          <div><span>From the desk</span><b>${use.length} use it · ${maybe.length} maybe · ${dealt.filter(cl => st.pin[cl.id]).length} pinned</b></div>
        </div>
        <div class="nb-banner">${g.banner}</div>
        <h2>Draft</h2>
        <div class="nb-draft" contenteditable="${S.phase === 4 ? 'false' : 'true'}" data-ph="${S.phase === 2 ? 'James writes the first pass here. Every word is human.' : 'Tom edits here.'}">${esc(draft)}</div>
        <h2>From the Editor's Desk <small>filed under Use it, in here automatically</small></h2>
        ${use.length ? use.map(block).join('') : '<div class="nb-empty">Nothing filed under Use it yet. Go back to the desk and drag a few clippings across.</div>'}
        <details class="nb-toggle"${maybe.length ? '' : ' hidden'}><summary>Maybe <span>${maybe.length}</span></summary>${maybe.map(block).join('')}</details>
        <div class="nb-actions"><button class="nb-back">← Back to the desk</button><button class="nb-next">${g.next} →</button></div>
      </div>`;
    box.querySelector('.nb-draft').addEventListener('input', e => { st.notion.draft = e.target.innerText; save(); });
    box.querySelector('.nb-back').addEventListener('click', () => setPhase(1));
    box.querySelector('.nb-next').addEventListener('click', () => {
      if (g.nextPhase) { setPhase(g.nextPhase); window.demoToast?.(g.nextPhase === 3 ? 'Handed to Tom.' : 'Ready to slot.'); return; }
      close(); window.dispatchEvent(new Event('dailydeck:closed')); window.navTo?.('dailypublishing');
    });
  }
  function pins() {
    const n = S.clips.slice(0, S.st.dealt).filter(cl => S.st.pin[cl.id]).length;
    S.el.querySelector('.ed-pincount').innerHTML = n
      ? `<em>${n} pinned</em> · tomorrow's briefing learns from these`
      : 'Pin what matters: the research desk learns from every pin';
  }
  function renderPage() {
    const st = S.st, use = S.clips.slice(0, st.dealt).filter(cl => st.zone[cl.id] === 'use');
    S.el.querySelector('.ed-usepile').innerHTML = use.length
      ? use.map(cl => `<div class="ed-use"><pre>${esc(cl.text)}</pre><button class="ed-copy" data-copy="${esc(cl.id)}">Copy</button></div>`).join('')
      : '<p class="ed-use-empty">Drag clippings into "Use it" and their text lands here, ready to copy.</p>';
    S.el.querySelector('.ed-copyall').hidden = !use.length;
    const body = S.el.querySelector('.ed-body');
    if (document.activeElement !== body) body.innerText = st.draft.body || '';
  }
  function save() { store.set(S.key, S.st); }
  function words() {
    const n = S.el.querySelector('.ed-body').innerText.trim().split(/\s+/).filter(Boolean).length;
    S.el.querySelector('.ed-words').textContent = n ? `${n} words, all yours` : 'Nothing written yet';
  }
  function copy(text) {
    navigator.clipboard?.writeText(text).then(() => window.demoToast?.('Copied. Now make it yours.'), () => window.demoToast?.('Select the text and copy it by hand.'));
  }
  function deal(all) {
    const desk = S.el.querySelector('.ed-desk'), st = S.st, c = S.cards[S.idx];
    const upto = all ? S.clips.length : Math.min(S.clips.length, st.dealt + 1);
    S.justDealt = S.clips.slice(st.dealt, upto).map(cl => cl.id);
    for (let k = st.dealt; k < upto; k++) { const cl = S.clips[k]; st.pos[cl.id] = { ...spot(desk, 'new', k, cl, c.id + cl.id, S.clips.length), z: ++S.z }; st.zone[cl.id] = 'new'; }
    st.dealt = upto; save(); render();
  }

  // ---------------------------------------------------------------- drag, edit, file
  function bind() {
    const desk = S.el.querySelector('.ed-desk');
    let drag = null;
    desk.addEventListener('pointerdown', e => {
      const clip = e.target.closest('.ed-clip');
      if (!clip || e.target.isContentEditable || e.target.closest('.ed-pinbtn')) return;
      e.preventDefault();
      const id = clip.dataset.id, p = S.st.pos[id];
      p.z = ++S.z; clip.style.zIndex = p.z;
      clip.classList.add('is-lifted');
      drag = { clip, id, dx: e.clientX - p.x, dy: e.clientY - p.y };
      clip.setPointerCapture(e.pointerId);
    });
    desk.addEventListener('pointermove', e => {
      if (!drag) return;
      const p = S.st.pos[drag.id];
      p.x = e.clientX - drag.dx; p.y = e.clientY - drag.dy;
      drag.clip.style.left = p.x + 'px'; drag.clip.style.top = p.y + 'px';
      const z = zoneAt(desk, p.x + drag.clip.offsetWidth / 2);
      desk.querySelectorAll('.ed-lane').forEach(l => l.classList.toggle('is-target', l.classList.contains('ed-lane-' + z)));
    });
    const end = () => {
      if (!drag) return;
      const p = S.st.pos[drag.id], dr = desk.getBoundingClientRect();
      p.x = Math.max(4, Math.min(p.x, dr.width - drag.clip.offsetWidth - 4));
      p.y = Math.max(60, Math.min(p.y, dr.height - 60));
      const was = S.st.zone[drag.id], now = zoneAt(desk, p.x + drag.clip.offsetWidth / 2);
      S.st.zone[drag.id] = now;
      drag.clip.classList.remove('is-lifted');
      desk.querySelectorAll('.ed-lane').forEach(l => l.classList.remove('is-target'));
      drag = null; save();
      if (was !== now) { render(); if (now === 'use') window.demoToast?.('Filed under Use it. It goes into the Notion edition for James\'s pass.'); }
    };
    desk.addEventListener('pointerup', end);
    desk.addEventListener('pointercancel', end);
    desk.addEventListener('click', e => {
      const pin = e.target.closest('.ed-pinbtn');
      if (pin) {
        const id = pin.closest('.ed-clip').dataset.id;
        S.st.pin[id] = !S.st.pin[id]; save(); render();
        if (S.st.pin[id]) window.demoToast?.('Pinned. The research desk files more like this next time.');
        return;
      }
      if (e.target.closest('.ed-deal')) deal(false);
      if (e.target.closest('.ed-deal-all')) deal(true);
    });
    desk.addEventListener('dblclick', e => {
      const t = e.target.closest('.ed-hand, .ed-cut-text, .ed-clip p, .ed-clip h3, .ed-stat, .ed-index-li, .ed-stub-li');
      if (!t) return;
      t.contentEditable = 'true'; t.focus();
      t.addEventListener('blur', () => { t.contentEditable = 'false'; }, { once: true });
    });
    S.el.querySelector('.ed-usepile').addEventListener('click', e => {
      const b = e.target.closest('[data-copy]'); if (!b) return;
      copy(S.clips.find(cl => cl.id === b.dataset.copy)?.text || '');
    });
    S.el.querySelector('.ed-copyall').addEventListener('click', () => copy(S.clips.slice(0, S.st.dealt).filter(cl => S.st.zone[cl.id] === 'use').map(cl => cl.text).join('\n\n')));
    S.el.querySelector('.ed-body').addEventListener('input', e => { S.st.draft.body = e.target.innerText; save(); words(); });
    S.el.querySelector('.ed-tonotion').addEventListener('click', () => setPhase(2));
    S.el.querySelector('.ed-padbtn').addEventListener('click', () => S.el.querySelector('.ed-main').classList.toggle('show-pad'));
    S.el.querySelectorAll('.ed-phases i').forEach(i => i.addEventListener('click', () => setPhase(+i.dataset.phase)));
    S.el.querySelector('.ed-which').addEventListener('change', e => { S.idx = +e.target.value; render(); });
    S.el.querySelector('.ed-prev').addEventListener('click', () => { S.idx = (S.idx - 1 + S.cards.length) % S.cards.length; render(); });
    S.el.querySelector('.ed-next').addEventListener('click', () => { S.idx = (S.idx + 1) % S.cards.length; render(); });
    S.el.querySelector('.ed-tidy').addEventListener('click', () => {
      const desk = S.el.querySelector('.ed-desk'), st = S.st, c = S.cards[S.idx], seen = {}, count = {};
      const dealt = S.clips.slice(0, st.dealt);
      dealt.forEach(cl => { const z = st.zone[cl.id] || 'new'; count[z] = (count[z] || 0) + 1; });
      for (const cl of dealt) { const z = st.zone[cl.id] || 'new'; seen[z] = (seen[z] || 0) + 1; st.pos[cl.id] = spot(desk, z, seen[z] - 1, cl, c.id + cl.id + 't', count[z]); }
      save(); render();
    });
    S.el.querySelector('.ed-reset').addEventListener('click', () => { store.set(S.key, null); render(); });
    S.el.querySelector('.ed-close').addEventListener('click', () => { close(); window.dispatchEvent(new Event('dailydeck:closed')); });
    document.addEventListener('keydown', e => { if (S.open && e.key === 'Escape' && !document.activeElement?.isContentEditable) S.el.querySelector('.ed-close').click(); });
    window.addEventListener('resize', () => { if (S.open) render(); });
  }

  function build() {
    S.el = document.createElement('div');
    S.el.className = 'ed-overlay';
    S.el.innerHTML = `
      <header class="ed-top">
        <div class="ed-title"><b>The Editor's Desk</b><span class="ed-phases"><i data-phase="1">1 Sort the clippings</i><i data-phase="2" class="ed-ph-notion">${NOTION_LOGO}2 James pass</i><i data-phase="3">3 Tom pass</i><i data-phase="4">4 Ready to slot</i></span><span class="ed-pincount"></span></div>
        <div class="ed-nav">
          <button class="ed-prev" title="Previous desk">‹</button>
          <select class="ed-which" aria-label="Desk"></select>
          <button class="ed-next" title="Next desk">›</button>
        </div>
        <div class="ed-tools">
          <button class="ed-tonotion" title="Open the Notion edition for James's pass">${NOTION_LOGO}<span>Open in Notion: James pass</span></button>
          <button class="ed-padbtn" title="Notes to self">Scratchpad</button>
          <button class="ed-tidy" title="Stack each column neatly">Tidy</button>
          <button class="ed-reset" title="Put every clipping back in the pile">Start over</button>
          <button class="ed-close" title="Close (Esc)">Close</button>
        </div>
      </header>
      <div class="ed-main">
        <div class="ed-desk" aria-label="Clippings"></div>
        <aside class="ed-page">
          <div class="ed-page-top"><span>Scratchpad</span><span class="ed-words"></span></div>
          <div class="ed-use-h"><span>From the "Use it" pile</span><button class="ed-copyall" hidden>Copy all</button></div>
          <div class="ed-usepile"></div>
          <div class="ed-pad-h">Scratchpad</div>
          <div class="ed-body" contenteditable="true"></div>
        </aside>
        <section class="ed-notion" aria-label="Notion edition (demo copy)"></section>
      </div>`;
    document.body.appendChild(S.el);
    bind();
  }

  async function open(id) {
    if (!S.el) build();
    S.open = true;
    S.el.classList.add('on');
    applyPhase();
    document.documentElement.classList.add('ed-lock');
    await load();
    if (id) { const i = S.cards.findIndex(c => c.id.replace(/-/g, '') === String(id).replace(/-/g, '')); if (i >= 0) S.idx = i; }
    render();
  }
  function close() {
    if (!S.el) return;
    S.open = false;
    S.el.classList.remove('on');
    document.documentElement.classList.remove('ed-lock');
  }

  const install = () => {
    const prev = window.DailyDeck || {};
    window.DailyDeck = {
      ...prev, open: () => open(), openAt: id => open(id), close, isOpen: () => S.open,
      announce: () => {}, prefetch: () => {},
      preview: async id => { window.navTo?.('dailyeditor'); await open(id); return true; },
    };
  };
  install();
  window.addEventListener('load', install);
})();
