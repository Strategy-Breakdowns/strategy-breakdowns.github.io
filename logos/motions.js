// 128 logo animations: 32 quicker.chat, 32 Daily (#81), 32 Strategy Breakdowns, 32 transitions between them.
// Every motion is a pure function of time returning an engine state, so any frame can be rendered or exported.
// Rules (see engine.js): no scaling ever, one stroke weight (SW) for every line, gap tracks the arm.
(function (root) {
  const LE = root.LogoEngine, { SW, COL, CH, clamp, lerp } = LE;
  const E = {
    lin: t => t, in: t => t * t * t, out: t => 1 - Math.pow(1 - t, 3), io: t => t < .5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2,
    back: t => { const c = 1.7; return 1 + (c + 1) * Math.pow(t - 1, 3) + c * Math.pow(t - 1, 2); },
    backIn: t => { const c = 1.7; return (c + 1) * t * t * t - c * t * t; },
  };
  function kf(t, keys) {
    if (t <= keys[0][0]) return keys[0][1];
    for (let i = 1; i < keys.length; i++) { const [t1, v1, e] = keys[i], [t0, v0] = keys[i - 1]; if (t <= t1) { const p = (t - t0) / (t1 - t0 || 1); return v0 + (v1 - v0) * E[e || 'io'](p); } }
    return keys[keys.length - 1][1];
  }
  const bump = (t, t0, d, a = 1) => Math.max(0, Math.sin(Math.PI * clamp((t - t0) / d))) * a;
  // like bump, but exactly 0 outside its window (bump ends on sin(pi) = 1e-16, which prints a body offset as
  // "-0.00" and stops a loop landing on its first frame). Used for the body jolts and hops.
  const pop = (t, t0, d) => { const u = (t - t0) / d; return u <= 0 || u >= 1 ? 0 : Math.sin(Math.PI * u); };
  const closeAt = (t, at, d = .22) => { const k = (t - at) / d; return k < 0 || k > 1 ? 0 : (k < .4 ? E.in(k / .4) : 1 - E.out((k - .4) / .6)); };
  const spec = c => CH[c].spec;
  const shut = (c, amt, side = 'L') => ({ dh: -spec(c)[side].h * amt }); // close a lens by redrawing it shorter
  const lensBoth = (c, amt) => ({ lensL: shut(c, amt, 'L'), lensR: shut(c, amt, 'R') });
  // ---- brows (engine.js rule 4, Tom 18 Oct 2026): the lenses' top edges act as brows and lids, the bottom
  // edges as cheeks, so a face can be skeptical, cross, worried or happy instead of only bigger or smaller.
  // An expression is { lift, arch, tilt, smile, close } in px on a 130 x 100 lens (see lensD in engine.js).
  //
  // Pushed for small sizes (James, 18 Oct 2026: "even more animated and clear ... these can also become Slack
  // emojis"). As a Slack emoji the whole mark is 22 to 32 px and a lens is 6 to 9 px wide, so what survives is
  // the eye SHAPE (open, flat lids, closed "^ ^"), its SIZE, and the BODY's motion; a brow angle only reads at
  // 32 px and up, so the angled poses are steep and always paired with body acting. The moves below follow
  // the character-animation basics: a small anticipation before every big change, a fast move into the pose
  // with overshoot and settle, a hold long enough to read, and the whole body acting the emotion (bounce,
  // sink, jolt, lean), not just the face.
  const FACE = {
    raised: { lift: 20, arch: 16 },             // one brow way up: curious, "really?"
    up: { lift: 20, arch: 14, smile: -30 },     // eyes wide open both ways: surprised (with WIDE)
    happy: { smile: 34, arch: 14 },             // open, smiling eyes: pleased
    joy: { close: 1 },                          // squeezed shut into "^ ^": laughing, delighted
    lowered: { lift: -26, tilt: 16 },           // the down brow of a skeptical pair
    focused: { lift: -14, tilt: 18 },           // inner corners down: concentrating
    worried: { lift: -24, tilt: -26, arch: 4 }, // inner corners up over heavy lids: worried, exasperated
    lidded: { lift: -46 },                      // flat lids half down: unimpressed
    drowsy: { lift: -56, tilt: -8 },            // nearly shut, drooping at the outer corners
    asleep: { close: -1 },                      // shut and curved down, "u u"
  };
  const WIDE = k => ({ dw: 24 * k });          // with `up`, the lenses also open sideways
  const xs = (e, k) => { const o = {}; for (const key in e) o[key] = e[key] * k; return o; };   // an expression at strength k
  const xmix = (a, b, k) => { const o = {}; for (const key of new Set([...Object.keys(a), ...Object.keys(b)])) o[key] = (a[key] || 0) + ((b[key] || 0) - (a[key] || 0)) * k; return o; };
  // Headroom: how far a brow may rise before it meets the line above the lenses (measured 18 Oct 2026, stroke
  // edge to stroke edge at rest: quicker.chat's oval 25 px, the SB face 40, the Daily menu bar 50). Upward lift
  // and arch are scaled by it; lowering, tilt, smile and close are not, and a wide eye opens downward
  // (negative smile) where there is room. Moves that raise the brows no longer jump the specs upward either.
  const HEADROOM = { qc: .5, sb: .9, daily: 1 };
  const room = (c, e) => { const k = HEADROOM[c] ?? 1, o = { ...e }; if (o.lift > 0) o.lift *= k; if (o.arch > 0) o.arch *= k; return o; };
  const brows = (c, L, R = L, l = {}, r = {}) => ({ lensL: { ...l, ex: room(c, L) }, lensR: { ...r, ex: room(c, R) } }); // l, r: dw/dh/dy for each lens
  const ink = c => CH[c].ink;
  const anchor = c => c === 'daily' ? [418, 64] : CH[c].corner;
  const center = c => { const s = spec(c); return [(s.L.x + s.R.x + s.R.w) / 2, s.L.y + s.L.h / 2]; };
  const lensC = (c, side) => { const l = spec(c)[side]; return [l.x + l.w / 2, l.y + l.h / 2]; };
  // Typing dots sit 62.5% of the way from the glasses' centre to the body's centre, never on it (Tom, 17 Oct
  // 2026): the glasses are set right for the turned head, so dots on the lens centres crowded the right edge of
  // the face; half way was still too far right and three-quarters too far left. The glasses never move.
  const bodyCx = c => c === 'qc' ? LE.QE.cx : 235;
  const dotShift = (c, S = spec(c)) => ((S.L.x + S.L.w + S.R.x) / 2 - bodyCx(c)) * .625;

  // ---- extras: every line uses SW, every size change is geometry ----
  const badge = (x, y, r, label, c, o = 1) => r < SW * .55 ? '' :
    `<g opacity="${o}"><circle cx="${x}" cy="${y}" r="${r.toFixed(2)}" fill="${COL.orange}" stroke="${ink(c)}" stroke-width="${SW}"/>${label !== '' && r > 26 ? `<text x="${x}" y="${y + 13}" text-anchor="middle" font-family="'New Order',sans-serif" font-weight="600" font-size="38" fill="#fff">${label}</text>` : ''}</g>`;
  const ring = (x, y, t, t0, c, grow = 90, color = COL.orange) => { const k = clamp((t - t0) / .9); return k <= 0 || k >= 1 ? '' : `<circle cx="${x}" cy="${y}" r="${(30 + k * grow).toFixed(2)}" fill="none" stroke="${color}" stroke-width="${SW}" opacity="${(1 - k).toFixed(3)}"/>`; };
  const chip = (x, y, w, h, inner, c, o = 1) => w < SW * 1.2 ? '' :
    `<g opacity="${o}"><rect x="${x - w / 2}" y="${y - h / 2}" width="${w}" height="${h}" rx="${Math.min(h, w) / 2}" fill="#fff" stroke="${ink(c)}" stroke-width="${SW}"/><g opacity="${clamp((w - 70) / 50)}">${inner}</g></g>`;
  const heart = (x, y, s) => `<path d="M${x} ${y + s * .9}C${x - s * 1.6} ${y - s * .1} ${x - s * .9} ${y - s * 1.2} ${x} ${y - s * .45}C${x + s * .9} ${y - s * 1.2} ${x + s * 1.6} ${y - s * .1} ${x} ${y + s * .9}Z" fill="${COL.orange}"/>`;
  const txt = (x, y, s, size = 44, fill = COL.orange) => `<text x="${x}" y="${y + size * .36}" text-anchor="middle" font-family="'New Order',sans-serif" font-weight="600" font-size="${size}" fill="${fill}">${s}</text>`;
  const dot = (x, y, d, fill) => `<circle cx="${x.toFixed(2)}" cy="${y.toFixed(2)}" r="${(d / 2).toFixed(2)}" fill="${fill}"/>`;
  const cloud = (x, y, r, c) => r < SW * .6 ? '' : `<circle cx="${x}" cy="${y}" r="${r.toFixed(2)}" fill="${COL.cream}" stroke="${ink(c)}" stroke-width="${SW}"/>`;
  const wave = (t, i, f = 1.3, lag = .17) => Math.max(0, Math.sin(2 * Math.PI * (t * f - i * lag)));

  const B = { qc: [], daily: [], sb: [], mix: [] };
  const add = (batch, id, name, dur, desc, fn, extra = {}) => B[batch].push({ id: batch + '-' + id, name, dur, desc, fn, ...extra });

  // The Dots to Specs pose as plain inputs, so a player can drive it live (the quicker.chat nav pill on
  // strategybreakdowns.com does): shrink 0 = glasses, 1 = dots; armK = how much of the arm is drawn;
  // wv(i) = how high dot i is lifted. d = dot diameter in multiples of SW.
  function dotsPose(c, d, shrink, armK, wv = () => 0) {
    const D = d * SW, S = spec(c), [cxL0, cy] = lensC(c, 'L'), [cxR0] = lensC(c, 'R'), cxM0 = (S.L.x + S.L.w + S.R.x) / 2;
    const dx = -dotShift(c, S) * shrink, cxL = cxL0 + dx, cxM = cxM0 + dx, cxR = cxR0 + dx; // the row slides left as it forms
    const lensAt = (side, i) => { const l = S[side], tw = Math.max(.01, D - SW); return { dw: -(l.w - tw) * shrink, dh: -(l.h - tw) * shrink, dx, dy: -wv(i) }; };
    const asDots = shrink > .985;
    const bridgeK = 1 - clamp(shrink * 1.4), midD = shrink > .3 ? D * clamp((shrink - .3) / .5) : 0;
    const sp = asDots ? [dot(cxL, cy - wv(0), D, ink(c)), dot(cxM, cy - wv(1), D, ink(c)), dot(cxR, cy - wv(2), D, ink(c))].join('')
      : (midD > 1 ? dot(cxM, cy - wv(1), midD, ink(c)) : '') + (bridgeK > .02 ? `<path d="M${cxM - (S.R.x - S.L.x - S.L.w) / 2 * bridgeK} ${S.bY}H${cxM + (S.R.x - S.L.x - S.L.w) / 2 * bridgeK}" stroke="${ink(c)}" stroke-width="${SW}"/>` : '');
    return { a: c, lensL: lensAt('L', 0), lensR: lensAt('R', 2), lensO: asDots ? [0, 0] : [1, 1], bridgeO: 0, armReveal: armK, specs: {}, layers: { specs: sp } };
  }

  // =============== shared moves (any of the 3 characters) ===============
  const M = {
    // peering over the specs: a small lift first, then they slide down past the eyes with both brows high,
    // the head leaning in
    peek: c => t => { const y = kf(t, [[0, 0], [.3, -4, 'out'], [.7, 26, 'back'], [2.15, 26], [2.32, -10, 'out'], [2.55, 0]]); const b = Math.max(closeAt(t, 1.15), closeAt(t, 1.45)), k = clamp(y / 26);
      return { a: c, root: { r: 2.5 * k }, specs: { y, r: kf(t, [[0, 0], [.4, 0], [.75, -3, 'out'], [2.2, -3], [2.4, 0]]) }, ...brows(c, xs({ lift: 14, arch: 12 }, k), xs(FACE.raised, k), shut(c, b * .96, 'L'), shut(c, b * .96, 'R')) }; },
    // a small counter-move, then the look; the brow on that side shoots up and the other one settles low
    look: c => t => { const k = kf(t, [[0, 0], [.3, -.12, 'out'], [.6, 1.08, 'out'], [.75, 1], [1.4, 1], [1.65, -1.06, 'io'], [1.8, -1], [2.3, -1], [2.6, 0]]);
      const lead = { lift: 14, arch: 12 }, other = { lift: -8 }, kR = Math.max(k, 0), kL = Math.max(-k, 0);
      return { a: c, specs: { x: 22 * kR - 24 * kL }, root: { r: -2 * k }, ...brows(c, xmix(xs(lead, kL), other, kR), xmix(xs(lead, kR), other, kL)) }; },
    // the lids drop flat and heavy as it glances over, then the far brow flicks up once: "really?"
    sideEye: c => t => { const k = kf(t, [[0, 0], [.35, 0], [.6, 1.05, 'out'], [.72, 1], [2.0, 1], [2.35, 0]]), fl = kf(t, [[0, 0], [1.05, 0], [1.2, 1, 'back'], [1.55, 1], [1.8, 0]]);
      return { a: c, specs: { x: 26 * k, r: 2 * k }, root: { r: -3 * k }, ...brows(c, xs(FACE.lidded, k), xmix(xs(FACE.lidded, k), { lift: 4, arch: 14, tilt: -4 }, fl * clamp(k))) }; },
    // looks away, squints for a beat (the anticipation), then snaps back with the eyes popping wide and a jolt
    doubleTake: c => t => { const x = kf(t, [[0, 0], [.3, 0], [.55, -22, 'out'], [1.0, -22], [1.1, 6, 'out'], [1.3, 0]]), jolt = pop(t, 1.02, .3);
      const sq = kf(t, [[0, 0], [.8, 0], [.95, 1, 'out'], [1.02, 1], [1.08, 0]]), w = kf(t, [[0, 0], [1.02, 0], [1.15, 1, 'back'], [1.9, 1], [2.15, 0]]);
      const e = xmix(xs({ lift: -16 }, sq), FACE.up, w);
      return { a: c, root: { y: -12 * jolt }, specs: { x }, ...brows(c, e, e, WIDE(w), WIDE(w)) }; },
    // heavy lids through the roll, then a sigh: the inner corners lift and the whole mark sinks
    eyeRoll: c => t => { const th = E.io(clamp((t - .5) / 1.0)) * Math.PI * 2; const sigh = bump(t, 1.5, .55);
      const roll = kf(t, [[0, 0], [.4, 0], [.6, 1, 'out'], [1.5, 1], [1.7, 0, 'io']]), s = kf(t, [[0, 0], [1.4, 0], [1.7, 1, 'out'], [2.1, 1], [2.5, 0, 'io']]);
      const e = xmix(xs({ lift: -30, arch: 3 }, roll), FACE.worried, s);
      return { a: c, specs: { x: -16 * Math.sin(th), y: -18 * (1 - Math.cos(th)) + 8 * sigh }, ...brows(c, e), root: { r: 2.5 * sigh, y: 8 * sigh } }; },
    // a little counter-tilt, then the right eye squeezes shut into a happy "^" while the left brow shoots up
    wink: c => t => { const k = kf(t, [[0, 0], [.6, 0], [.72, -.15, 'out'], [.95, 1, 'back'], [1.5, 1], [1.85, 0]]), kc = clamp(k);
      return { a: c, ...brows(c, xs(FACE.raised, kc), { close: kc }), specs: { r: -6 * k }, root: { r: 4 * k } }; },
    blink: c => t => ({ a: c, ...lensBoth(c, Math.max(closeAt(t, 1.0), closeAt(t, 1.32)) * .97) }),
    // suspicious: the lids drop hard and the inner corners angle in, it leans in, and narrows once more
    squint: c => t => { const k = kf(t, [[0, 0], [.4, 0], [.62, 1.08, 'out'], [.75, 1], [1.7, 1], [1.9, -.15, 'out'], [2.1, 0]]), tw = bump(t, 1.15, .3);
      return { a: c, ...brows(c, { lift: -30 * k - 8 * tw, tilt: 20 * k }), specs: { y: 6 * Math.max(k, 0) }, root: { r: -2 * Math.max(k, 0) } }; },
    // a quick squash first, then the eyes pop wide both ways with a jump; an exclamation in the logo's stroke
    wide: (c, mark = true) => t => { const g = kf(t, [[0, 0], [.22, 0], [.3, -.25, 'out'], [.48, 1, 'back'], [1.6, 1], [1.85, 0]]), e = kf(t, [[0, 0], [.45, 0], [.65, 1, 'back'], [1.5, 1], [1.65, 0, 'in']]);
      const [cx, cy] = anchor(c), f = g < 0 ? { lift: 40 * g } : xs(FACE.up, g), gw = Math.max(g, 0);
      return { a: c, root: { y: -14 * pop(t, .3, .4) }, ...brows(c, f, f, WIDE(gw), WIDE(gw)), layers: { front: mark && e > .05 ? `<g opacity="${e}"><path d="M${cx + 34} ${cy - 100 + 40 * (1 - e)}V${cy - 52}" stroke="${COL.orange}" stroke-width="${SW}" stroke-linecap="round"/>${dot(cx + 34, cy - 20, SW * 1.4, COL.orange)}</g>` : '' } }; },
    hop: c => t => { // the SB GIF launch: rock back, kick, specs fly up spinning, land low, spring up. No squash.
      const rr = kf(t, [[0, 0], [.2, 0], [.35, 3], [.45, 0], [.6, -7, 'out'], [.95, 0]]) + kf(t, [[0, 0], [1.6, 0], [1.68, -2.5, 'out'], [1.85, 0]]);
      const y = kf(t, [[0, 0], [.45, 6], [.95, -300, 'out'], [1.62, 12, 'in'], [1.76, -6, 'out'], [1.9, 0]]), x = kf(t, [[0, 0], [.45, 0], [.95, 40, 'out'], [1.62, 0, 'in']]);
      const r = (kf(t, [[0, 0], [.45, 0], [1.3, 200, 'lin'], [1.62, 372, 'out'], [1.75, 358], [1.9, 360]]) % 360);
      return { a: c, root: { r: rr }, specs: { x, y, r } }; },
    spin: c => t => { const y = kf(t, [[0, 0], [.3, 4], [.65, -120, 'out'], [1.45, -120], [1.75, 10, 'in'], [1.9, -4, 'out'], [2.05, 0]]);
      return { a: c, specs: { y, r: kf(t, [[0, 0], [.6, 0], [1.45, 360]]) % 360 } }; },
    // got it, and pleased: the eyes smile through the nod (a held half-closed eye is a morph in-between, and
    // lumpy, so a pose that is held stays open)
    nod: c => t => { const R = t => kf(t, [[0, 0], [.25, 0], [.4, -3], [.6, 7], [.78, -1], [.95, 6], [1.2, 0]]); const lag = R(t - .07) - R(t);
      const k = kf(t, [[0, 0], [.3, 0], [.55, 1, 'out'], [1.0, 1], [1.4, 0]]);
      return { a: c, root: { r: R(t) }, specs: { r: lag * 1.5, y: lag * 1.2 }, ...brows(c, xs(FACE.happy, k)) }; },
    // a flicker down first, then one brow shoots up while the other drops and angles in; the head tips back
    // and the raised brow twitches mid-hold
    brow: c => t => { const k = kf(t, [[0, 0], [.35, 0], [.45, -.12, 'out'], [.7, 1, 'back'], [2.0, 1], [2.3, 0]]), tw = bump(t, 1.25, .35);
      const L = k < 0 ? { lift: 20 * k } : xs(FACE.lowered, k), R = k < 0 ? { lift: 20 * k } : { lift: 20 * k + 4 * tw, arch: 14 * k + 3 * tw };
      return { a: c, ...brows(c, L, R), specs: { r: 3 * k }, root: { r: -2 * Math.max(k, 0) } }; },
    // brows knitted hard in concentration while it reads, then the eyes close in a satisfied "^ ^"
    reading: c => t => { const line = Math.floor(clamp(t / .9, 0, 2.999)), p = (t % .9) / .9;
      let x = t < 2.7 ? (p < .8 ? -18 + 36 * E.io(p / .8) : 18 - 36 * E.io((p - .8) / .2)) : kf(t, [[2.7, -18], [3.0, 0]]);
      const y = t < 2.7 ? line * 7 : kf(t, [[2.7, 14], [3.0, 0]]);
      const e = xmix(xs(FACE.focused, kf(t, [[0, 0], [.25, 1, 'out'], [2.6, 1], [2.95, 0]])), FACE.joy, kf(t, [[0, 0], [2.6, 0], [2.95, 1, 'out'], [3.5, 1], [3.8, 0]]));
      return { a: c, specs: { x, y }, ...brows(c, e) }; },
    // the always-on loop stays calm: on each look, the brow on that side lifts
    idle: c => t => { const x = kf(t, [[0, 0], [1.4, 0], [1.7, -14, 'out'], [2.9, -14], [3.2, 0], [5.4, 0], [5.7, 12, 'out'], [6.6, 12], [6.9, 0]]);
      const b = Math.max(closeAt(t, 4.2), closeAt(t, 7.2), closeAt(t, 7.45)) * .97, lb = { lift: 9, arch: 10 };
      return { a: c, root: { y: -4 * Math.sin(t / 4 * Math.PI * 2) }, specs: { x }, ...brows(c, xs(lb, Math.max(-x, 0) / 14), xs(lb, Math.max(x, 0) / 12), shut(c, b, 'L'), shut(c, b, 'R')) }; },
    // the lids grow heavy, droop, and close into "u u" as it nods off and sinks; then a ping, and the eyes pop
    // wide with a jolt
    sleepy: c => t => { const d = kf(t, [[0, 0], [.3, 0], [1.0, 1], [2.6, 1], [2.62, 0, 'out']]), sl = kf(t, [[0, 0], [1.0, 0], [1.45, 1, 'io'], [2.6, 1], [2.62, 0, 'out']]);
      const w = kf(t, [[0, 0], [2.6, 0], [2.72, 1, 'back'], [3.2, 1], [3.5, 0]]), [cx, cy] = anchor(c), e = xmix(xmix(xs(FACE.drowsy, d), FACE.asleep, sl), FACE.up, w);
      return { a: c, root: { r: t > .6 && t < 2.6 ? 2.5 * Math.sin((t - .6) * Math.PI) * d : 0, y: 6 * sl - 14 * pop(t, 2.6, .35) }, ...brows(c, e, e, WIDE(w), WIDE(w)),
        specs: { y: 8 * d }, layers: { front: ring(cx, cy, t, 2.55, c) + badge(cx, cy, kf(t, [[0, 0], [2.5, 0], [2.65, 30, 'back'], [3.9, 30], [4.1, 0, 'in']]), '', c) } }; },
    // typing dots in a row across the face that become the glasses (and go back). d = dot diameter in multiples of SW
    dotsToSpecs: (c, d) => t => {
      const shrink = kf(t, [[0, 0], [.5, 0], [1.0, 1, 'in'], [2.6, 1], [3.2, 0, 'back']]); // 0 = glasses, 1 = dots
      const typing = t > 1.0 && t < 2.6, D = d * SW, wv = i => typing ? wave(t, i) * (14 + D * .35) : 0;
      const armK = kf(t, [[0, 1], [.4, 1], [.8, 0, 'in'], [3.1, 0], [3.6, 1, 'out']]);
      return dotsPose(c, d, shrink, armK, wv);
    },
    typing: (c, d) => t => { const D = d * SW, [cx] = center(c), y = CH[c].id === 'daily' ? 296 : 300, gap = D + 18;
      const on = kf(t, [[0, 0], [.2, 1, 'out'], [2.3, 1], [2.5, 0, 'in']]);
      const dots = [0, 1, 2].map(i => dot(cx - 8 + (i - 1) * gap, y - wave(t, i) * (12 + D * .3), D, ink(c))).join('');
      return { a: c, specs: { y: -4 * on }, layers: { inside: `<g opacity="${on}">${dots}</g>` } }; },
    // ponders hard, one brow down and one way up, then both pop up with a little hop when the idea lands
    thinking: c => t => { const k = kf(t, [[0, 0], [.3, 0], [.6, 1, 'out'], [2.9, 1], [3.2, 0]]); const [x, y] = anchor(c);
      const r = i => kf(t, [[0, 0], [.6 + i * .3, 0], [.85 + i * .3, [14, 22, 34][i], 'back'], [2.8, [14, 22, 34][i]], [3.0 + i * .05, 0, 'in']]);
      const p = kf(t, [[0, 0], [.3, 0], [.6, 1, 'out'], [2.35, 1], [2.55, 0, 'out']]), aha = kf(t, [[0, 0], [2.35, 0], [2.55, 1, 'back'], [2.9, 1], [3.2, 0]]), up = { lift: 14, arch: 14 };
      return { a: c, root: { y: -10 * pop(t, 2.35, .4) }, specs: { x: 8 * k, r: -4 * k }, ...brows(c, xmix(xs({ tilt: 18, lift: -16 }, p), up, aha), xmix(xs({ lift: 14, arch: 14, tilt: -4 }, p), up, aha)),
        layers: { top: '', front: cloud(x + 10, y - 26, r(0), c) + cloud(x + 40, y - 80, r(1), c) + cloud(x + 30, y - 150, r(2), c) } }; },
    // really laughing: the smile builds, the eyes squeeze shut into "^ ^", the head tips back, and it shakes
    // and bounces on every "ha", the specs a beat behind
    laugh: c => t => { const on = kf(t, [[0, 0], [.15, 0], [.35, 1, 'out'], [1.65, 1], [2.05, 0, 'io']]), cl = kf(t, [[0, 0], [.25, 0], [.42, 1, 'out'], [1.65, 1], [1.9, 0]]);
      const ha = Math.abs(Math.sin(Math.max(0, t - .3) * 14));
      return { a: c, root: { r: on * (-5 + 4 * Math.sin(t * 40)), y: -10 * on * ha }, specs: { y: -10 * on * Math.abs(Math.sin(Math.max(0, t - .3) * 14 - .6)) }, ...brows(c, xmix(xs(FACE.happy, on), FACE.joy, cl)) }; },
    wave: c => t => ({ a: c, armRot: kf(t, [[0, 0], [.3, 0], [.55, -30, 'out'], [.8, -8], [1.05, -30], [1.3, -8], [1.55, -24], [1.9, 0]]) }),
    badgeCount: c => t => { const n = t < 1.2 ? 1 : t < 2.0 ? 2 : 3, [x, y] = anchor(c);
      const r = kf(t, [[0, 0], [.2, 0], [.5, 40, 'back'], [3.1, 40], [3.35, 0, 'in']]) + 6 * (bump(t, 1.2, .25) + bump(t, 2.0, .25));
      const j = bump(t, .45, .3) + bump(t, 1.2, .3) + bump(t, 2.0, .3);
      return { a: c, root: { y: 4 * j }, layers: { front: badge(x, y, r, n, c) } }; },
    inboxZero: c => t => { const n = Math.max(0, 5 - Math.floor(clamp((t - .5) / .32, 0, 5))), [x, y] = anchor(c), tick = ((t - .5) % .32) / .32, live = t > .5 && t < 2.1;
      const r = kf(t, [[0, 0], [.1, 0], [.4, 40, 'back'], [2.2, 40], [2.32, 48, 'out'], [2.45, 0, 'in']]) + (live ? 5 * Math.sin(Math.PI * clamp(tick * 3)) : 0);
      const k = clamp((t - 2.35) / .5), burst = k > 0 && k < 1 ? [0, 45, 90, 135, 180, 225, 270, 315].map(a => { const q = a * Math.PI / 180, r1 = 50 + k * 30, r2 = r1 + 26; return `<path d="M${x + Math.cos(q) * r1} ${y + Math.sin(q) * r1}L${x + Math.cos(q) * r2} ${y + Math.sin(q) * r2}" stroke="${COL.orange}" stroke-width="${SW}" stroke-linecap="round" opacity="${1 - k}"/>`; }).join('') : '';
      const g = live ? Math.sin(Math.PI * clamp(tick * 2.5)) : 0, hop = bump(t, 2.4, .45);
      return { a: c, root: { y: -40 * hop }, specs: { x: 6 * g, y: -4 * g - 10 * hop }, ...brows(c, xs(FACE.joy, kf(t, [[0, 0], [2.3, 0], [2.45, 1, 'out'], [3.4, 1], [3.6, 0]]))), layers: { front: badge(x, y, r, n, c) + burst } }; },
    ping: c => t => { const [x, y] = anchor(c), pb = bump(t, .3, .3) + bump(t, 1.1, .3), lift = -8 * pb;
      return { a: c, root: { y: -4 * (pop(t, .3, .3) + pop(t, 1.1, .3)) }, specs: { y: lift }, ...brows(c, xs({ lift: 14, arch: 10 }, pb)), layers: { front: ring(x, y, t, .3, c) + ring(x, y, t, 1.1, c) + badge(x, y, kf(t, [[0, 0], [.1, 0], [.3, 22, 'back'], [2.5, 22], [2.7, 0, 'in']]), '', c) } }; },
    threePings: c => t => { const [x, y] = anchor(c), n = t < 1 ? 1 : t < 1.8 ? 2 : 3;
      const r = kf(t, [[0, 0], [.2, 0], [.45, 40, 'back'], [3.2, 40], [3.45, 0, 'in']]) + 6 * bump(t, 1.0, .2) + 8 * bump(t, 1.8, .2);
      const g = t < 1 ? kf(t, [[0, 0], [.4, 0], [.6, .3, 'back']]) : t < 1.8 ? kf(t, [[1.0, .3], [1.2, .65, 'back']]) : kf(t, [[1.8, .65], [2.0, 1, 'back'], [3.0, 1], [3.3, 0]]);
      const shake = t > 2.0 && t < 2.6 ? Math.sin((t - 2) * 60) * 5 * (1 - (t - 2) / .6) : 0;
      return { a: c, ...brows(c, xs(FACE.up, g), xs(FACE.up, g), WIDE(g), WIDE(g)), root: { r: shake, y: -6 * (pop(t, .45, .25) + pop(t, 1.05, .25) + pop(t, 1.85, .3)) }, layers: { front: ring(x, y, t, .3, c) + ring(x, y, t, 1.0, c, 110) + ring(x, y, t, 1.8, c, 130) + badge(x, y, r, n, c) } }; },
    tap: (c, kind) => t => { const [x, y] = anchor(c), w = kf(t, [[0, 0], [.3, 0], [.55, 150, 'back'], [2.4, 150], [2.6, 0, 'in']]), h = Math.min(100, w * .66);
      const inner = kind === 'heart' ? heart(x + 4, y - 50, 24 + 4 * (bump(t, .9, .18) + bump(t, 1.2, .18))) : txt(x + 4, y - 50, kind, kind === '?' ? 56 : 46);
      const k = kf(t, [[0, 0], [.4, 0], [.7, 1, 'back'], [2.2, 1], [2.5, 0]]), kp = clamp(k);
      // each reaction gets its face: !! a squash then the eyes pop wide with a jump, HA a squeezed-shut laugh,
      // ? one brow way up, a heart closed happy eyes that bob on each beat
      const g = kf(t, [[0, 0], [.32, 0], [.4, -.25, 'out'], [.6, 1, 'back'], [2.2, 1], [2.5, 0]]), f = g < 0 ? { lift: 40 * g } : xs(FACE.up, g), gw = Math.max(g, 0);
      const face = kind === '!!' ? { ...brows(c, f, f, WIDE(gw), WIDE(gw)), root: { y: -12 * pop(t, .4, .4) } }
        : kind === 'HA' ? { ...brows(c, xmix(xs(FACE.happy, kp), FACE.joy, kp)), root: { r: kp * (-4 + 4 * Math.sin(t * 40)), y: -8 * kp * Math.abs(Math.sin(t * 14)) } }
        : kind === '?' ? { ...brows(c, xs(FACE.lowered, k), xs(FACE.raised, k)), specs: { r: 6 * k, x: -6 * k }, root: { r: -3 * k } }
        : { ...brows(c, xs({ close: 1, arch: 6 * (bump(t, .9, .2) + bump(t, 1.2, .2)) }, kp)), root: { y: -5 * (pop(t, .9, .2) + pop(t, 1.2, .2)) } };
      return { a: c, ...face, layers: { front: chip(x + 4, y - 50, w, h, inner, c) } }; },
    tapCycle: c => t => { const kinds = ['heart', '!!', 'HA', '?'], ph = Math.min(3, Math.floor(t / 1.5)), lt = t % 1.5; const sub = M.tap(c, kinds[ph]);
      const s = sub(lt * 1.6 + .25); return s; },
  };

  // =============== quicker.chat (32) ===============
  const q = 'qc';
  [['peek', 'Over the Specs', 3.0, 'Slides down to look over the specs with the brows raised high, blinks twice, pushes them back up.', M.peek(q)],
   ['look', 'Look Around', 3.0, 'Glances right, then left, with a slight lean of the body; the brow on that side shoots up.', M.look(q)],
   ['sideeye', 'Side-Eye', 3.0, 'The sarcastic glance: heavy flat lids, then the far brow flicks up once.', M.sideEye(q)],
   ['doubletake', 'Double Take', 2.6, 'Looks away, squints for a beat, snaps back with the eyes popping wide. Same line weight throughout.', M.doubleTake(q)],
   ['eyeroll', 'Eye Roll', 2.8, 'Heavy lids for a full loop up and round, then a sigh: the inner corners lift and it sinks.', M.eyeRoll(q)],
   ['wink', 'Wink', 2.4, 'The right eye squeezes shut into a happy "^" while the left brow shoots up.', M.wink(q)],
   ['blink', 'Blink', 2.6, 'A double blink: each lens closes to a line the same thickness as the frame.', M.blink(q)],
   ['squint', 'Squint', 2.6, 'Suspicious: the lids drop hard into a V, it leans in and narrows again. Same line weight.', M.squint(q)],
   ['wide', 'Wide-Eyed', 2.6, 'A quick squash, then the eyes pop wide with a jump and an exclamation in the logo\'s own stroke.', M.wide(q)],
   ['hop', 'Hop Off', 3.4, 'The SB GIF move. The outline closes while the specs are off the face, and reopens exactly where they land.', M.hop(q)],
   ['spin', 'Spin', 2.6, 'Specs lift, spin flat, drop back. The gap follows the arm all the way.', M.spin(q)],
   ['nod', 'Nod', 2.4, 'Nods from the base with the specs a frame behind, smiling.', M.nod(q)],
   ['brow', 'Skeptical', 2.8, 'One brow shoots up, the other drops and angles in; the head tips back and the brow twitches.', M.brow(q)],
   ['reading', 'Reading', 3.8, '3 lines, left to right, brows knitted hard, then the eyes close in a satisfied "^ ^".', M.reading(q)],
   ['idle', 'Idle', 8, 'A slow float, a look left, a blink, a look right, a double blink. The brow lifts on each look.', M.idle(q)],
   ['sleepy', 'Sleepy', 4.4, 'The lids droop and close into "u u" at a quiet inbox; a ping and the eyes pop wide.', M.sleepy(q)],
   ['dots10', 'Dots to Specs · 1×', 4.0, 'Typing dots 1 line-weight wide, across the face, that become the glasses.', M.dotsToSpecs(q, 1)],
   ['dots15', 'Dots to Specs · 1.5×', 4.0, 'The same with dots 1.5 line-weights wide.', M.dotsToSpecs(q, 1.5)],
   ['dots20', 'Dots to Specs · 2×', 4.0, 'Dots 2 line-weights wide (radius = the stroke).', M.dotsToSpecs(q, 2)],
   ['dots25', 'Dots to Specs · 2.5×', 4.0, 'Dots 2.5 line-weights wide. The biggest that still reads as a dot.', M.dotsToSpecs(q, 2.5)],
   ['typing', 'Typing', 2.6, 'Dots 1.5 line-weights wide bounce under the specs.', M.typing(q, 1.5)],
   ['thinking', 'Thinking', 3.2, 'Ponders hard, one brow down and one way up, as bubbles rise in the logo\'s stroke; both pop up when the idea lands.', M.thinking(q)],
   ['tapheart', 'Tapback Heart', 2.8, 'A heart reaction lands in a chip drawn at the logo\'s line weight; the eyes close happy and bob.', M.tap(q, 'heart')],
   ['tapbang', 'Tapback !!', 2.8, '"!!" lands: a squash, then the eyes pop wide with a jump.', M.tap(q, '!!')],
   ['tapha', 'Tapback HA', 2.8, '"HA" lands and it really laughs, eyes squeezed shut.', M.tap(q, 'HA')],
   ['tapcycle', 'Tapback Cycle', 6, 'Heart, !!, HA and ? in turn, the face matching each.', M.tapCycle(q)],
   ['badge', 'Badge Count', 3.6, '1, 2, 3 messages. The badge grows by radius, its outline stays the logo\'s weight.', M.badgeCount(q)],
   ['zero', 'Inbox Zero', 4.2, 'Counts 5 to 0, bursts, and hops high with its eyes closed in joy. The quicker.chat promise.', M.inboxZero(q)],
   ['ping', 'Ping', 3.0, 'Rings in the logo\'s stroke weight ripple out of a dot; the brows pop up with each.', M.ping(q)],
   ['threepings', '3 Pings', 3.8, 'Each ping louder; the eyes open wider and it jumps a little more each time.', M.threePings(q)],
   ['wave', 'Hello Arm', 2.6, 'The arm waves; the gap slides along the oval with it.', M.wave(q)],
   ['laugh', 'Ha Ha', 2.4, 'Really laughing: eyes squeezed shut, head back, shaking and bouncing.', M.laugh(q)],
  ].forEach(([id, name, dur, desc, fn]) => add('qc', id, name, dur, desc, fn));

  // =============== the Daily (#81) (32) ===============
  const d = 'daily', dI = ink(d);
  const hdr = (fn) => fn; // marker for header-specific moves
  const dotsSeq = (t, base, pal) => [0, 1, 2].map(i => ({ fill: pal(i, t) }));
  [['peek', 'Over the Specs', 3.0, 'Slides down with the brows raised high, blinks, pushes back up.', M.peek(d)],
   ['look', 'Look Around', 3.0, 'Right, then left, the leading brow shooting up.', M.look(d)],
   ['sideeye', 'Side-Eye', 3.0, 'Heavy flat lids, a glance to the right, one brow flick.', M.sideEye(d)],
   ['wide', 'Wide-Eyed', 2.6, 'A squash, then the eyes pop wide with a jump; an exclamation pops off the corner.', M.wide(d)],
   ['blink', 'Blink', 2.6, 'Double blink, lenses closing to a line.', M.blink(d)],
   ['wink', 'Wink', 2.4, 'Right eye squeezes shut into a "^", left brow shoots up.', M.wink(d)],
   ['hop', 'Hop Off', 3.4, 'Specs fly off and land; the window edge closes and reopens with them.', M.hop(d)],
   ['spin', 'Spin', 2.6, 'Lift, spin, drop.', M.spin(d)],
   ['nod', 'Nod', 2.4, 'Got it, smiling.', M.nod(d)],
   ['reading', 'Reading', 3.8, 'Reads 3 lines of today\'s chart, brows knitted, then closes its eyes, pleased.', M.reading(d)],
   ['idle', 'Idle', 8, 'The always-on resting loop; a brow lifts on each look.', M.idle(d)],
   ['brow', 'Skeptical', 2.8, 'One brow way up, one down, at the numbers.', M.brow(d)],
  ].forEach(([id, name, dur, desc, fn]) => add('daily', id, name, dur, desc, fn));
  add('daily', 'dotsload', 'Loading Dots', 2.4, 'The header dots light orange one after another, like a page loading.', t => {
    const k = (t * 1.25) % 1; return { a: d, dotsSt: [0, 1, 2].map(i => ({ fill: Math.floor(k * 4) === i + 1 || (Math.floor(k * 4) > i && t % 2.4 < 1.8) ? COL.orange : dI })) }; });
  add('daily', 'dotstype', 'Header Typing', 2.4, 'The 3 header dots bounce in a wave: someone is writing today\'s issue.', t => ({ a: d, dotsSt: [0, 1, 2].map(i => ({ dy: -wave(t, i) * 9 })) }));
  add('daily', 'dotsdrop', 'Dots Become Specs', 4.4, 'The header dots fall out of the menu bar and grow into the glasses.', t => {
    const S = spec(d), [cxL, cy] = lensC(d, 'L'), [cxR] = lensC(d, 'R'), cxM = (S.L.x + S.L.w + S.R.x) / 2, D = 22;
    const fall = kf(t, [[0, 0], [.5, 0], [1.1, 1, 'in'], [1.25, .94, 'out'], [1.4, 1, 'in']]), grow_ = kf(t, [[0, 0], [1.5, 0], [2.0, 1, 'back'], [3.2, 1], [3.6, 0, 'in']]), back = kf(t, [[0, 0], [3.6, 0], [4.2, 1, 'out']]);
    const src = [[92, 45], [123, 45], [154, 45]], dst = [[cxL, cy], [cxM, cy], [cxR, cy]];
    const ds = src.map((p, i) => [lerp(p[0], dst[i][0], fall * (1 - back)), lerp(p[1], dst[i][1], fall * (1 - back))]);
    const asLens = grow_ > .01, tw = D - SW;
    const lens = side => { const l = S[side]; return { dw: -(l.w - tw) * (1 - grow_), dh: -(l.h - tw) * (1 - grow_) }; };
    const sp = (!asLens ? ds.map(p => dot(p[0], p[1], D, dI)).join('') : (grow_ < .4 ? dot(cxM, cy, D * (1 - grow_ / .4), dI) : '') + (grow_ > .2 ? `<path d="M${cxM - (S.R.x - S.L.x - S.L.w) / 2 * clamp((grow_ - .2) / .8)} ${S.bY}H${cxM + (S.R.x - S.L.x - S.L.w) / 2 * clamp((grow_ - .2) / .8)}" stroke="${dI}" stroke-width="${SW}"/>` : ''));
    return { a: d, dotsO: back > .98 ? 1 : (fall < .01 ? 1 : 0), lensO: asLens ? [1, 1] : [0, 0], lensL: lens('L'), lensR: lens('R'), bridgeO: 0, armReveal: kf(t, [[0, 0], [2.0, 0], [2.5, 1, 'out'], [3.2, 1], [3.5, 0, 'in']]), specs: {}, layers: { specs: sp } };
  });
  add('daily', 'dots15', 'Dots to Specs · 1.5×', 4.0, 'Typing dots 1.5 line-weights wide in the face become the glasses.', M.dotsToSpecs(d, 1.5));
  add('daily', 'dots20', 'Dots to Specs · 2×', 4.0, 'Dots 2 line-weights wide (radius = the stroke).', M.dotsToSpecs(d, 2));
  add('daily', 'dots25', 'Dots to Specs · 2.5×', 4.0, 'Dots 2.5 line-weights wide.', M.dotsToSpecs(d, 2.5));
  add('daily', 'progress', 'Loading Band', 2.8, 'The peach header fills left to right like a progress bar, then resets.', t => ({ a: d, bandClip: 380 * kf(t, [[0, 0], [.3, 0], [1.8, 1, 'io'], [2.4, 1], [2.45, 0, 'lin']]) + (t > 2.45 ? 0 : 0), bandO: 1 }));
  add('daily', 'minute', '1-Minute Read', 3.0, 'An orange bar travels the menu line in the logo\'s own weight: the 1-minute read, read.', t => {
    const k = kf(t, [[0, 0], [.3, 0], [2.3, 1, 'lin'], [2.6, 1], [2.75, 0, 'in']]); const x1 = 50 + 370 * k;
    return { a: d, layers: { bodyTop: k > .01 ? `<path d="M60 80H${Math.max(60, x1 - 10)}" stroke="${COL.orange}" stroke-width="${SW}"/>` : '' } }; });
  add('daily', 'menudraw', 'Menu Bar Draws', 2.8, 'The menu line draws across, then the dots pop in one by one.', t => {
    const m = kf(t, [[0, 0], [.2, 0], [.9, 1, 'out'], [2.3, 1], [2.6, 0, 'in']]);
    return { a: d, menuDash: m.toFixed(4), dotsSt: [0, 1, 2].map(i => ({ r: kf(t, [[0, 0], [.9 + i * .12, 0], [1.1 + i * .12, 11, 'back'], [2.2, 11], [2.4, 0, 'in']]) })) }; });
  add('daily', 'drawon', 'Draw On', 4.2, 'The window traces itself, the fills wash in, and the specs drop on.', t => {
    const o = kf(t, [[0, 0], [1.3, 1, 'io'], [3.6, 1], [4.0, 0, 'in']]), f = kf(t, [[0, 0], [1.0, 0], [1.5, 1, 'out'], [3.6, 1], [3.9, 0]]);
    const y = kf(t, [[0, -420], [1.4, -420], [1.85, 12, 'in'], [2.0, -6, 'out'], [2.15, 0], [3.5, 0], [3.8, -420, 'backIn']]);
    return { a: d, outlineReveal: o < .999 ? o : null, fillO: f, dotsO: f, menuO: f, bandO: f, specs: { y, r: kf(t, [[0, -14], [1.4, -14], [1.85, 4, 'in'], [2.1, 0, 'out'], [3.5, 0], [3.8, -14]]) } }; });
  add('daily', 'chart', 'Today\'s Chart', 3.6, 'A bar chart rises under the specs: 1 chart a day. Bars are solid shapes, no outlines to thicken.', t => {
    const hs = [.45, .7, .55, 1], g = kf(t, [[0, 0], [.4, 0], [1.4, 1, 'out'], [2.8, 1], [3.2, 0, 'in']]), base = 318;
    const bars = hs.map((h, i) => { const hh = 46 * h * clamp(g * 1.6 - i * .2); return hh > 1 ? `<rect x="${246 + i * 34}" y="${base - hh}" width="22" height="${hh}" rx="4" fill="${i === 3 ? COL.orange : dI}"/>` : ''; }).join('');
    return { a: d, specs: { y: -10 * g }, layers: { inside: bars } }; });
  add('daily', 'trend', 'Trend Line', 3.2, 'A line in the logo\'s stroke draws up and to the right under the specs.', t => {
    const g = kf(t, [[0, 0], [.4, 0], [1.6, 1, 'out'], [2.6, 1], [2.9, 0, 'in']]);
    return { a: d, specs: { y: -8 * g }, layers: { inside: g > .01 ? `<path d="M240 312L290 290L322 300L372 268" fill="none" stroke="${dI}" stroke-width="${SW}" stroke-linecap="round" stroke-linejoin="round" pathLength="1" stroke-dasharray="${g.toFixed(4)} 2"/>${g > .98 ? dot(372, 268, SW * 1.4, COL.orange) : ''}` : '' } }; });
  add('daily', 'tearoff', 'Tear-Off', 3.2, 'Today\'s header lifts off like a calendar page; tomorrow\'s is already underneath.', t => {
    const up = kf(t, [[0, 0], [.6, 0], [1.4, 1, 'in']]), r = -10 * up;
    const page = up > 0 && up < 1 ? `<g transform="translate(${(30 * up).toFixed(2)} ${(-120 * up).toFixed(2)}) rotate(${r.toFixed(2)} 420 80)" opacity="${(1 - up).toFixed(3)}"><path d="${LE.DAILY_BAND}" fill="${COL.peach}"/>${[92, 123, 154].map(x => `<circle cx="${x}" cy="45" r="11" fill="${dI}"/>`).join('')}<path d="M60 80H410" stroke="${dI}" stroke-width="${SW}"/></g>` : '';
    return { a: d, specs: { y: kf(t, [[0, 0], [.9, 0], [1.15, 8, 'out'], [1.8, 8], [2.0, 0]]) }, layers: { clipped: page } }; });
  add('daily', 'dotdrop', 'Dot Drop', 3.0, 'The orange first dot falls onto the bridge, bounces, and hops back up to the header.', t => {
    const S = spec(d), cxM = (S.L.x + S.L.w + S.R.x) / 2; const k = kf(t, [[0, 0], [.4, 0], [.9, 1, 'in']]), back = kf(t, [[0, 0], [1.8, 0], [2.4, 1, 'io']]);
    const y = t < .9 ? lerp(45, S.bY - 21, k) : t < 1.8 ? S.bY - 21 - 30 * bump(t, .95, .35) - 12 * bump(t, 1.32, .25) : lerp(S.bY - 21, 45, back) - 80 * Math.sin(Math.PI * back);
    const x = t < .9 ? lerp(92, cxM, k) : t < 1.8 ? cxM : lerp(cxM, 92, back);
    return { a: d, dotsSt: [{ o: 0 }, {}, {}], specs: { y: 5 * bump(t, .9, .25) }, layers: { front: dot(x, y, 22, COL.orange) } }; });
  add('daily', 'traffic', 'Traffic Lights', 2.4, 'The dots cycle orange, purple and ink.', t => { const pal = [COL.orange, COL.purple, dI], s = Math.floor(t / .6); return { a: d, dotsSt: [0, 1, 2].map(i => ({ fill: pal[(i + s) % 3] })) }; });
  add('daily', 'screenshot', 'Screenshot', 3.0, 'Crop corners close in around the window, a flash, and they spring back out.', t => {
    const k = kf(t, [[0, 0], [.3, 0], [.8, 1, 'out'], [1.6, 1], [2.0, 0, 'in']]), o = 40 - 22 * k, fl = bump(t, .85, .3, .7);
    const c = (x, y, sx, sy) => `<path d="M${x} ${y + 46 * sy}V${y + 12 * sy}A12 12 0 0 ${sx * sy > 0 ? 1 : 0} ${x + 12 * sx} ${y}H${x + 46 * sx}" fill="none" stroke="${dI}" stroke-width="${SW}" stroke-linecap="round"/>`;
    return { a: d, layers: { front: `<g opacity="${clamp(k * 2)}">${c(50 - o, 10 - o, 1, 1)}${c(420 + o, 10 - o, -1, 1)}${c(420 + o, 340 + o, -1, -1)}${c(50 - o, 340 + o, 1, -1)}</g><rect x="-60" y="-100" width="600" height="560" fill="#fff" opacity="${fl.toFixed(3)}"/>` } }; });
  add('daily', 'rise', 'Rise In', 3.0, 'The window rises from below and fades in, header first, like the SB GIF intro.', t => {
    const y = kf(t, [[0, 120], [.7, 0, 'out'], [2.3, 0], [2.8, 120, 'in']]), o = kf(t, [[0, 0], [.6, 1], [2.4, 1], [2.8, 0]]);
    return { a: d, root: { y, o }, specs: { y: kf(t, [[0, -60], [.5, -60], [.9, 6, 'in'], [1.05, 0, 'out']]), o: kf(t, [[0, 0], [.5, 0], [.7, 1]]) } }; });
  add('daily', 'badge', 'New Issue Badge', 3.6, 'A count badge on the window corner, drawn at the logo\'s line weight.', M.badgeCount(d));
  add('daily', 'blinksync', 'Blink in Sync', 2.6, 'The header dots wink out at the same moment the lenses blink.', t => { const b = Math.max(closeAt(t, 1.0), closeAt(t, 1.32)); return { a: d, ...lensBoth(d, b * .97), dotsSt: [0, 1, 2].map(() => ({ r: 11 * (1 - b) })) }; });
  add('daily', 'wave', 'Hello Arm', 2.6, 'The arm waves; the gap slides along the window edge with it.', M.wave(d));

  // =============== Strategy Breakdowns (32) ===============
  const s = 'sb', sI = ink(s);
  const openD = k => p => { // folder opening: the front panel leans forward. Geometry moves, the stroke does not.
    const f = (340 - p[1]) / 260; return [p[0] + k * 46 * f, p[1] + k * 22 * f]; };
  [['peek', 'Over the Specs', 3.0, 'Slides down with the brows raised high, blinks, pushes back up.', M.peek(s)],
   ['look', 'Look Around', 3.0, 'Right, then left, the leading brow shooting up.', M.look(s)],
   ['sideeye', 'Side-Eye', 3.0, 'Heavy flat lids, a glance right, one brow flick: "really?"', M.sideEye(s)],
   ['wide', 'Wide-Eyed', 2.6, 'A squash, then the eyes pop wide with a jump; an exclamation pops off the corner.', M.wide(s)],
   ['blink', 'Blink', 2.6, 'Double blink, to a line the weight of the frame.', M.blink(s)],
   ['wink', 'Wink', 2.4, 'Right eye squeezes shut into a "^", left brow shoots up.', M.wink(s)],
   ['squint', 'Squint', 2.6, 'Suspicious: lids down hard in a V, leaning in.', M.squint(s)],
   ['hop', 'Hop Off', 3.4, 'The GIF launch rebuilt without squash: rock, kick, fly, land low, spring.', M.hop(s)],
   ['spin', 'Spin', 2.6, 'Lift, spin, drop.', M.spin(s)],
   ['nod', 'Nod', 2.4, 'Got it, smiling.', M.nod(s)],
   ['brow', 'Skeptical', 2.8, 'One brow way up, one down, the head tipped back.', M.brow(s)],
   ['reading', 'Reading', 3.8, 'Reads 3 lines of a breakdown, brows knitted, then closes its eyes, pleased.', M.reading(s)],
   ['idle', 'Idle', 8, 'The always-on resting loop; a brow lifts on each look.', M.idle(s)],
   ['sleepy', 'Sleepy', 4.4, 'Nods off into "u u", then a ping and the eyes pop wide.', M.sleepy(s)],
   ['doubletake', 'Double Take', 2.6, 'Away, a squint, then back with the eyes popping wide.', M.doubleTake(s)],
   ['eyeroll', 'Eye Roll', 2.8, 'Heavy lids, a loop, then an exasperated sigh that sinks.', M.eyeRoll(s)],
   ['dots15', 'Dots to Specs · 1.5×', 4.0, 'Typing dots in the face become the glasses.', M.dotsToSpecs(s, 1.5)],
   ['dots20', 'Dots to Specs · 2×', 4.0, 'Dots 2 line-weights wide.', M.dotsToSpecs(s, 2)],
   ['thinking', 'Thinking', 3.2, 'Ponders hard, one brow down and one way up, until the idea lands.', M.thinking(s)],
   ['laugh', 'Ha Ha', 2.4, 'Really laughing: eyes squeezed shut, head back, shaking.', M.laugh(s)],
   ['wave', 'Hello Arm', 2.6, 'The arm waves; the gap slides with it.', M.wave(s)],
   ['badge', 'New Issue Badge', 3.6, 'A count badge on the folder corner.', M.badgeCount(s)],
  ].forEach(([id, name, dur, desc, fn]) => add('sb', id, name, dur, desc, fn));
  add('sb', 'dive', 'Dive In', 5.6, 'The full Gmail-avatar story: specs hop off, the folder opens, they dive in, then pop back out and land.', t => {
    const open = kf(t, [[0, 0], [.9, 0], [1.4, 1, 'out'], [2.6, 1], [3.0, 0, 'io'], [3.3, 0], [3.7, 1, 'out'], [4.3, 1], [4.7, 0]]);
    const y = kf(t, [[0, 0], [.3, 6], [.8, -300, 'out'], [1.6, -300], [2.3, 70, 'in'], [3.6, 70], [4.1, -300, 'out'], [4.75, 12, 'in'], [4.9, -6, 'out'], [5.05, 0]]);
    const r = (kf(t, [[0, 0], [.3, 0], [.8, 200], [1.6, 200], [2.3, 360]]) + kf(t, [[0, 0], [3.6, 0], [4.1, 160], [4.75, 360]])) % 360;
    const vis = t < 2.2 || t > 3.65 ? 1 : 0;
    return { a: s, deform: openD(open), tab: { r: -7 * open }, root: { r: kf(t, [[0, 0], [.15, 3], [.3, 0], [.45, -6, 'out'], [.8, 0]]) }, specs: { y, r, x: kf(t, [[0, 0], [.3, 0], [.8, 30], [1.6, 30], [2.3, 0]]), o: vis } }; });
  add('sb', 'open', 'Open Up', 3.0, 'The folder leans open and closes again. The front panel is redrawn as it leans, so its edge never thins.', t => ({ a: s, deform: openD(kf(t, [[0, 0], [.5, 0], [1.1, 1, 'out'], [2.0, 1], [2.5, 0, 'io']])), tab: { r: -7 * kf(t, [[0, 0], [.5, 0], [1.1, 1, 'out'], [2.0, 1], [2.5, 0]]) } }));
  add('sb', 'tabflap', 'Tab Flap', 2.4, 'The back tab flaps up and settles, like a folder being riffled.', t => ({ a: s, tab: { r: -6 * bump(t, .4, .35) - 3 * bump(t, .8, .3) - 1.5 * bump(t, 1.15, .25) } }));
  add('sb', 'papers', 'Papers Peek', 3.2, 'Pages rise from inside the folder, between tab and front, then sink back.', t => {
    const k = kf(t, [[0, 0], [.4, 0], [1.0, 1, 'back'], [2.3, 1], [2.8, 0, 'in']]);
    const page = (x, w, dy, r) => `<rect x="${x}" y="${96 - dy}" width="${w}" height="160" rx="14" fill="#fff" stroke="${sI}" stroke-width="${SW}" transform="rotate(${r} ${x + w / 2} 200)"/>`;
    return { a: s, layers: { mid: page(96, 170, 46 * k, -4 * k) + page(200, 160, 30 * k, 3 * k) } }; });
  add('sb', 'filedrop', 'File Drop', 3.0, 'A page drops into the folder from above and the specs nod at it.', t => {
    const y = kf(t, [[0, -260], [.3, -260], [1.0, 40, 'in'], [1.15, 18, 'out'], [1.3, 40, 'in'], [2.5, 40], [2.51, -260]]);
    const nod = bump(t, 1.0, .3);
    return { a: s, layers: { mid: y > -250 ? `<rect x="120" y="${y}" width="200" height="150" rx="14" fill="#fff" stroke="${sI}" stroke-width="${SW}"/>` : '' }, specs: { y: 6 * nod }, root: { r: 2 * nod } }; });
  add('sb', 'rise', 'Rise In', 3.4, 'The GIF intro: rises and fades in, then the specs drop on.', t => {
    const y = kf(t, [[0, 120], [.7, 0, 'out'], [2.7, 0], [3.2, 120, 'in']]), o = kf(t, [[0, 0], [.6, 1], [2.8, 1], [3.2, 0]]);
    return { a: s, root: { y, o }, tab: { o: kf(t, [[0, 0], [.5, 0], [.9, 1]]) }, specs: { y: kf(t, [[0, -300], [.7, -300], [1.15, 12, 'in'], [1.3, -6, 'out'], [1.45, 0]]), r: kf(t, [[0, -12], [.7, -12], [1.15, 4, 'in'], [1.4, 0]]) } }; });
  add('sb', 'drawon', 'Draw On', 4.2, 'Outline traces, fills wash in, specs drop on.', t => {
    const o = kf(t, [[0, 0], [1.3, 1, 'io'], [3.6, 1], [4.0, 0, 'in']]), f = kf(t, [[0, 0], [1.0, 0], [1.5, 1, 'out'], [3.6, 1], [3.9, 0]]);
    return { a: s, outlineReveal: o < .999 ? o : null, fillO: f, tab: { o: f }, specs: { y: kf(t, [[0, -420], [1.4, -420], [1.85, 12, 'in'], [2.0, -6, 'out'], [2.15, 0], [3.5, 0], [3.8, -420, 'backIn']]) } }; });
  add('sb', 'orangedot', 'Orange Dot', 2.6, 'The orange dot from the small SB icon bounces on the tab.', t => {
    const h = 60 * bump(t, .3, .5) + 26 * bump(t, .8, .3) + 8 * bump(t, 1.1, .2); const sq = 0;
    return { a: s, tab: { r: -2 * bump(t, .78, .12) }, layers: { mid: '', front: dot(330, 4 - h, 34, COL.orange) } }; });
  add('sb', 'stack', 'Stack', 3.2, 'A second folder slides out behind, back-left, then tucks away.', t => {
    const k = kf(t, [[0, 0], [.3, 0], [.8, 1, 'back'], [2.2, 1], [2.7, 0, 'in']]);
    return { a: s, layers: { back: `<g transform="translate(${-30 * k} ${-26 * k})" opacity="${clamp(k * 3)}"><path d="${LE.SB_TAB}" fill="${COL.peach}" stroke="${sI}" stroke-width="${SW}"/><path d="${LE.ptsD(CH.sb.out)}" fill="${COL.cream}" stroke="${sI}" stroke-width="${SW}" stroke-linejoin="round"/></g>` } }; });
  add('sb', 'wordmark', 'Email Header', 5.4, 'The email-header lockup: the mark lands, slides left, and the real Strategy Breakdowns wordmark is revealed letter by letter. The wordmark is the actual asset, never re-typeset.', t => {
    const k = kf(t, [[0, 0], [.5, 0], [1.0, 1, 'io'], [4.6, 1], [5.1, 0, 'io']]), rev = kf(t, [[0, 0], [1.1, 0], [3.1, 1, 'lin'], [4.5, 1], [4.6, 0]]);
    const W = root.SB_WORDMARK; // set by the page: {href, w, h, textX} in px of the source image
    let wm = '';
    if (W) { const sc = 350 / W.h, iw = W.w * sc, x0 = 0 - 420 * k, tx = W.textX * sc; wm = `<defs><clipPath id="wmc"><rect x="${x0 + tx}" y="-10" width="${(iw - tx) * rev}" height="380"/></clipPath></defs><image href="${W.href}" x="${x0}" y="0" width="${iw}" height="350" clip-path="url(#wmc)"/>`; }
    return { a: s, root: { x: -420 * k }, layers: { top: wm }, vb: '-460 -120 1500 600' }; }, { vb: '-460 -120 1500 600' });

  // =============== transitions (32) ===============
  // a transition style is a function (from, to, t in 0..1 of the change) -> state. Sequences hold, change, hold, change back.
  const styles = {
    morph: (a, b, u) => ({ a, b, k: E.io(u) }),
    hop: (a, b, u) => { const k = E.io(clamp((u - .25) / .5)); const y = -300 * Math.sin(Math.PI * clamp(u / .95)) + (u > .92 ? 10 * bump(u, .92, .08) : 0);
      return { a, b, k, specs: { y, r: 360 * E.io(clamp((u - .1) / .8)) % 360 } }; },
    spin: (a, b, u) => { // one turn about the mark's centre (the engine pivots the root at the base, so offset it back)
      const r = 360 * E.io(u), th = r * Math.PI / 180, C = [235, 200], Pv = [235, 345], dx = C[0] - Pv[0], dy = C[1] - Pv[1];
      const cx = Pv[0] + dx * Math.cos(th) - dy * Math.sin(th), cy = Pv[1] + dx * Math.sin(th) + dy * Math.cos(th);
      return { a, b, k: E.io(clamp((u - .3) / .4)), root: { r: r % 360, x: C[0] - cx, y: C[1] - cy - 30 * Math.sin(Math.PI * u) } }; },
    slide: (a, b, u) => { const e = E.io(u); const half = u < .5; return { a: half ? a : b, root: { x: half ? -520 * E.in(u * 2) : 520 * (1 - E.out((u - .5) * 2)) } }; },
    drop: (a, b, u) => { const half = u < .45; return { a: half ? a : b, root: { y: half ? 480 * E.in(u / .45) : -480 * (1 - E.out((u - .45) / .55)) + 14 * bump(u, .9, .1) } }; },
    blink: (a, b, u) => { const c = Math.sin(Math.PI * u); const P = LE.pose(a, b, E.io(u)); return { a, b, k: E.io(clamp((u - .3) / .4)), lensL: { dh: -P.spec.L.h * .97 * clamp(c * 1.6) }, lensR: { dh: -P.spec.R.h * .97 * clamp(c * 1.6) } }; },
    dots: (a, b, u) => { // specs collapse into dots, the body changes, dots grow back into the other character's specs
      const P = LE.pose(a, b, 0), sh = clamp(Math.sin(Math.PI * u) * 1.6), D = 30, k = E.io(clamp((u - .3) / .4)), Q = LE.pose(a, b, k), S = Q.spec;
      const dx = -lerp(dotShift(a, S), dotShift(b, S), k) * sh; // the dots sit left of the lens centres, as in Dots to Specs
      const tw = D - SW, asDots = sh > .985, [cxL, cy] = [S.L.x + S.L.w / 2 + dx, S.L.y + S.L.h / 2], cxR = S.R.x + S.R.w / 2 + dx, cxM = (S.L.x + S.L.w + S.R.x) / 2 + dx;
      const wv = i => asDots ? wave(u * 2.4, i) * 14 : 0, ik = Q.ink;
      return { a, b, k, lensO: asDots ? [0, 0] : [1, 1], lensL: { dw: -(S.L.w - tw) * sh, dh: -(S.L.h - tw) * sh, dx }, lensR: { dw: -(S.R.w - tw) * sh, dh: -(S.R.h - tw) * sh, dx }, bridgeO: sh > .5 ? 0 : 1, armReveal: 1 - sh,
        layers: { specs: asDots ? [dot(cxL, cy - wv(0), D, ik), dot(cxM, cy - wv(1), D, ik), dot(cxR, cy - wv(2), D, ik)].join('') : (sh > .5 ? dot(cxM, cy, D * clamp((sh - .5) * 2), ik) : '') } }; },
    peek: (a, b, u) => { const y = 22 * Math.sin(Math.PI * clamp(u * 1.1)); return { a, b, k: E.io(clamp((u - .3) / .4)), specs: { y }, lensL: { dh: -40 * bump(u, .35, .3) }, lensR: { dh: -40 * bump(u, .35, .3) } }; },
  };
  function sequence(chars, style, hold = .9, change = 1.1) { // loops through chars and back to the start
    const n = chars.length, dur = n * (hold + change);
    return { dur, fn: t => { const step = hold + change, i = Math.floor(t / step) % n, lt = t - i * step, a = chars[i], b = chars[(i + 1) % n];
      if (lt < hold) return { a };
      return styles[style](a, b, (lt - hold) / change); } };
  }
  const NM = { sb: 'SB', daily: 'Daily', qc: 'quicker.chat' };
  const STY = [['morph', 'Morph', 'The outline flows from one shape to the other; the specs ease between their 2 positions.'],
    ['hop', 'Hop Swap', 'Specs hop off, the body changes underneath, specs land on the new face.'],
    ['spin', 'Spin Swap', 'One full turn, the shape changing mid-spin.'],
    ['slide', 'Slide Swap', 'Out to the left, the next in from the right.'],
    ['drop', 'Drop Swap', 'Drops out the bottom, the next drops in from the top with a bounce.'],
    ['blink', 'Blink Swap', 'Changes while its eyes are closed.'],
    ['dots', 'Dots Swap', 'The specs collapse into typing dots, the body changes, the dots grow back into specs.'],
    ['peek', 'Peek Swap', 'Specs slide down, a blink, and it is someone else.']];
  for (const [pair, label] of [[['sb', 'daily'], 'SB ↔ Daily'], [['daily', 'qc'], 'Daily ↔ quicker.chat'], [['sb', 'qc'], 'SB ↔ quicker.chat'], [['sb', 'daily', 'qc'], 'SB → Daily → quicker.chat']]) {
    for (const [st, sname, sdesc] of STY) {
      const seq = sequence(pair, st);
      add('mix', pair.join('-') + '-' + st, `${label} · ${sname}`, seq.dur, sdesc, seq.fn, { group: label });
    }
  }

  root.LogoMotions = { B, M, kf, E, dotsPose, wave };
})(typeof window !== 'undefined' ? window : globalThis);
