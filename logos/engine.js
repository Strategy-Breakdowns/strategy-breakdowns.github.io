// Logo motion engine for Strategy Breakdowns, the Daily (#81) and quicker.chat.
//
// The rules this engine exists to enforce (Tom, 16 Oct 2026):
//  1. Line weight never changes. Nothing is ever scaled: lenses squint or widen by regenerating their
//     geometry at the same stroke; badges, chips and rings grow by radius or size, not by transform scale;
//     the mark itself only ever translates and rotates. Every stroke in every extra is the logo's own SW.
//  2. The outline gap behind the temple arm is computed every frame from where the arm actually crosses
//     the outline. It is the same size above and below the arm (SW each side), closes when the arm leaves
//     the face, and its ends get the SB logo's slightly rounded corners (radius SW/4).
//  3. quicker.chat: the cream face is a true oval all the way round; the peach tail sits behind it, so the
//     cream/peach edge follows the inside of the oval.
//  4. The lenses are Filo's eyes AND brows (Tom, 18 Oct 2026: more expression than grow, shrink and squint).
//     The top edge of each lens moves like a brow and lid, the bottom edge like a cheek; see lensD(). The
//     shape is regenerated and stroked at SW (rule 1), mid-height never moves (the bridge and arm stay on),
//     and a lens with no expression is drawn exactly as before.
// Coordinates: the SB logo's own 450 x 350 space. quicker.chat is mapped in by matching its left lens to SB's.
(function (root) {
  const SW = 20, CAP = SW / 4;
  const COL = { ink: '#0D0B22', qink: '#000000', cream: '#FFFAF3', peach: '#FFE7C6', lens: '#FFFFFF', orange: '#FC6932', purple: '#B19EF8', white: '#FFFFFF' };
  const N = 360; // outline resolution

  // ---------- geometry helpers ----------
  const lerp = (a, b, k) => a + (b - a) * k;
  const clamp = (v, a = 0, b = 1) => Math.max(a, Math.min(b, v));
  function arcPts(cx, cy, rx, ry, a0, a1, n) { const p = []; for (let i = 0; i <= n; i++) { const a = a0 + (a1 - a0) * i / n; p.push([cx + rx * Math.cos(a), cy + ry * Math.sin(a)]); } return p; }
  // rounded rect, clockwise from top-left corner end; corners {rx, ry}
  function rrPts(x0, y0, x1, y1, tl, tr, br, bl) {
    const d = Math.PI / 180, P = [];
    P.push(...arcPts(x1 - tr.rx, y0 + tr.ry, tr.rx, tr.ry, -90 * d, 0, 24));
    P.push(...arcPts(x1 - br.rx, y1 - br.ry, br.rx, br.ry, 0, 90 * d, 24));
    P.push(...arcPts(x0 + bl.rx, y1 - bl.ry, bl.rx, bl.ry, 90 * d, 180 * d, 24));
    P.push(...arcPts(x0 + tl.rx, y0 + tl.ry, tl.rx, tl.ry, 180 * d, 270 * d, 24));
    return P;
  }
  function plen(P) { let L = 0; for (let i = 0; i < P.length; i++) { const a = P[i], b = P[(i + 1) % P.length]; L += Math.hypot(b[0] - a[0], b[1] - a[1]); } return L; }
  // resample a closed polyline to n points by arc length, starting at the point nearest straight up from the centroid
  function resample(P, n) {
    const cx = P.reduce((s, p) => s + p[0], 0) / P.length, cy = P.reduce((s, p) => s + p[1], 0) / P.length;
    let s0 = 0, best = 1e9;
    P.forEach((p, i) => { if (p[1] < cy) { const d = Math.abs(p[0] - cx); if (d < best) { best = d; s0 = i; } } });
    const Q = P.slice(s0).concat(P.slice(0, s0));
    const seg = []; let L = 0;
    for (let i = 0; i < Q.length; i++) { const a = Q[i], b = Q[(i + 1) % Q.length]; const l = Math.hypot(b[0] - a[0], b[1] - a[1]); seg.push([a, b, L, l]); L += l; }
    const out = []; let j = 0;
    for (let k = 0; k < n; k++) { const s = L * k / n; while (j < seg.length - 1 && seg[j][2] + seg[j][3] < s) j++; const [a, b, s0_, l] = seg[j]; const u = l ? (s - s0_) / l : 0; out.push([a[0] + (b[0] - a[0]) * u, a[1] + (b[1] - a[1]) * u]); }
    return out;
  }
  const lerpPts = (A, B, k) => A.map((p, i) => [lerp(p[0], B[i][0], k), lerp(p[1], B[i][1], k)]);
  const ptsD = (P, close = true) => 'M' + P.map(p => p[0].toFixed(2) + ' ' + p[1].toFixed(2)).join('L') + (close ? 'Z' : '');
  function lerpCol(a, b, k) { const h = c => [1, 3, 5].map(i => parseInt(c.slice(i, i + 2), 16)); const A = h(a), B = h(b); return '#' + A.map((v, i) => Math.round(lerp(v, B[i], k)).toString(16).padStart(2, '0')).join(''); }

  // ---------- the 3 characters ----------
  const SPEC_SB = { L: { x: 150, y: 150, w: 130, h: 100, rx: 40.998, ry: 36.88 }, R: { x: 320, y: 150, w: 120, h: 100, rx: 37.845, ry: 36.88 }, bY: 200, aY: 200, hookX: 10, hookR: 25, hookEnd: 238 };
  // quicker.chat master (512 px, fitted earlier) mapped into SB space: scale so the left lens matches SB's
  const QS = 130 / 124.94, QTX = 150 - 186.94 * QS, QTY = 150 - 198.66 * QS, qp = (x, y) => [x * QS + QTX, y * QS + QTY];
  const SPEC_QC = { L: { x: 150, y: 150, w: 130, h: 95.53 * QS, rx: 38.97 * QS, ry: 35.89 * QS },
    R: { x: qp(348.63, 0)[0], y: 150, w: 111.84 * QS, h: 95.53 * QS, rx: 34.88 * QS, ry: 35.89 * QS },
    bY: qp(0, 246.5)[1], aY: qp(0, 246.06)[1], hookX: qp(51.28, 0)[0], hookR: 20.75 * QS, hookEnd: qp(0, 285.38)[1] };
  const QE = { cx: qp(260.875, 0)[0], cy: qp(0, 253.9)[1], rx: 181.6188 * QS, ry: 152.45 * QS };
  const ePt = t => [QE.cx + QE.rx * Math.cos(t), QE.cy + QE.ry * Math.sin(t)];
  const QT = qp(71.3625, 412.225), QK1 = qp(101.5, 324.25), tK2 = 122.525 * Math.PI / 180;
  // J1: where the tail's left edge (tip -> K1) meets the oval
  const tJ1 = (() => { const [x0, y0] = QT, dx = QK1[0] - x0, dy = QK1[1] - y0; let lo = 0, hi = 3;
    const inside = u => { const x = x0 + dx * u, y = y0 + dy * u; return ((x - QE.cx) / QE.rx) ** 2 + ((y - QE.cy) / QE.ry) ** 2 < 1; };
    for (let i = 0; i < 60; i++) { const m = (lo + hi) / 2; if (inside(m)) hi = m; else lo = m; }
    const x = x0 + dx * hi, y = y0 + dy * hi; let t = Math.atan2((y - QE.cy) / QE.ry, (x - QE.cx) / QE.rx); if (t < 0) t += 2 * Math.PI; return t; })();
  function qcOutline(k = 1) { // oval plus tail; k = tail size (0 = pure oval)
    const tm = (tJ1 + tK2) / 2, t1 = lerp(tm, tJ1, k), t2 = lerp(tm, tK2, k), tip = [lerp(ePt(tm)[0], QT[0], k), lerp(ePt(tm)[1], QT[1], k)];
    const P = [ePt(t2), tip, ePt(t1)];
    P.push(...arcPts(QE.cx, QE.cy, QE.rx, QE.ry, t1, t2 + 2 * Math.PI, 300).slice(1, -1));
    return P;
  }
  const ovalInset = () => arcPts(QE.cx, QE.cy, QE.rx - SW / 2, QE.ry - SW / 2, 0, 2 * Math.PI, 300).slice(0, -1);
  const c37 = { rx: 37, ry: 37.143 }, c27 = { rx: 27, ry: 27.143 }, c38 = { rx: 38.4616, ry: 38.4615 }, c28 = { rx: 28.4616, ry: 28.4615 };
  const SB_TAB = 'M50 48.4615C50 27.2198 67.2198 10 88.4616 10H194.136C201.866 10 209.416 12.3291 215.803 16.6836L240.197 33.3164C246.584 37.6709 254.134 40 261.864 40H323.538C344.78 40 362 57.2198 362 78.4615V121.538C362 142.78 344.78 160 323.538 160H88.4616C67.2198 160 50 142.78 50 121.538L50 48.4615Z';
  const CH = {};
  CH.sb = { id: 'sb', ink: COL.ink, out: resample(rrPts(50, 80, 420, 340, c37, c37, c37, c37), N), fill: resample(rrPts(60, 90, 410, 330, c27, c27, c27, c27), N), spec: SPEC_SB, tab: 1, band: 0, dots: 0, menu: 0, tail: 0, corner: [414, 86] };
  CH.daily = { id: 'daily', ink: COL.ink, out: resample(rrPts(50, 10, 420, 340, c38, c38, c37, c37), N), fill: resample(rrPts(60, 20, 410, 330, c28, c28, c27, c27), N), spec: SPEC_SB, tab: 0, band: 1, dots: 1, menu: 1, tail: 0, corner: [414, 16] };
  CH.qc = { id: 'qc', ink: COL.qink, out: resample(qcOutline(1), N), fill: resample(ovalInset(), N), spec: SPEC_QC, tab: 0, band: 0, dots: 0, menu: 0, tail: 1, corner: ePt(-0.72) };
  // the tail's index range on the resampled outline (points outside the oval)
  (() => { const P = CH.qc.out, out = P.map(p => ((p[0] - QE.cx) / (QE.rx + 1)) ** 2 + ((p[1] - QE.cy) / (QE.ry + 1)) ** 2 > 1);
    let a = out.indexOf(true), b = out.lastIndexOf(true); CH.tailIdx = [Math.max(0, a - 2), Math.min(N - 1, b + 2)]; })();

  // ---------- pose: everything that can be interpolated ----------
  function lerpSpec(A, B, k) { const o = {}; for (const key in A) o[key] = typeof A[key] === 'object' ? lerpSpec(A[key], B[key], k) : lerp(A[key], B[key], k); return o; }
  function pose(a, b = a, k = 0) {
    const A = CH[a], B = CH[b];
    return { ink: lerpCol(A.ink, B.ink, k), out: lerpPts(A.out, B.out, k), fill: lerpPts(A.fill, B.fill, k), spec: lerpSpec(A.spec, B.spec, k),
      tab: lerp(A.tab, B.tab, k), band: lerp(A.band, B.band, k), dots: lerp(A.dots, B.dots, k), menu: lerp(A.menu, B.menu, k), tail: lerp(A.tail, B.tail, k),
      corner: [lerp(A.corner[0], B.corner[0], k), lerp(A.corner[1], B.corner[1], k)] };
  }

  // ---------- 2D transforms (translate + rotate only, never scale) ----------
  const rot = (p, c, deg) => { const r = deg * Math.PI / 180, s = Math.sin(r), co = Math.cos(r), x = p[0] - c[0], y = p[1] - c[1]; return [c[0] + x * co - y * s, c[1] + x * s + y * co]; };
  const SPIV = [295, 200], RPIV = [235, 345];
  const tfStr = (o, piv) => `translate(${(o.x || 0).toFixed(2)} ${(o.y || 0).toFixed(2)}) rotate(${(o.r || 0).toFixed(3)} ${piv[0]} ${piv[1]})`;
  const applyT = (p, o, piv) => { const q = rot(p, piv, o.r || 0); return [q[0] + (o.x || 0), q[1] + (o.y || 0)]; };

  // ---------- lens + specs ----------
  function lensRect(base, d = {}) { // d: dx, dy, dw, dh (size change about the centre)
    const w = Math.max(.01, base.w + (d.dw || 0)), h = Math.max(.01, base.h + (d.dh || 0));
    const x = base.x - (d.dw || 0) / 2 + (d.dx || 0), y = base.y - (d.dh || 0) / 2 + (d.dy || 0);
    return { x, y, w, h, rx: Math.min(base.rx, w / 2), ry: Math.min(base.ry, h / 2) };
  }
  function rrD({ x, y, w, h, rx, ry }) {
    return `M${x + rx} ${y}H${x + w - rx}A${rx} ${ry} 0 0 1 ${x + w} ${y + ry}V${y + h - ry}A${rx} ${ry} 0 0 1 ${x + w - rx} ${y + h}H${x + rx}A${rx} ${ry} 0 0 1 ${x} ${y + h - ry}V${y + ry}A${rx} ${ry} 0 0 1 ${x + rx} ${y}Z`;
  }
  // ---------- brows (rule 4) ----------
  // A lens with an expression, ex = { lift, arch, tilt, smile }, in px on the SB lens (130 x 100):
  //   lift  - the top edge rises (+) or lowers (-) while the bottom stays put: a raised brow, or a heavy lid
  //   arch  - the brow curves up; the top corners widen toward the middle until they meet in one smooth dome
  //           (bowing only the short flat run made a pointed, roof-like top)
  //   tilt  - the INNER top corner drops and the outer rises: + is cross or focused, - is worried
  //   smile - the whole lower lid rises flat, so with an arched top the lens reads as a smiling eye (a bowed
  //           lower lid made an S-wave at the corners). Negative drops it: an eye opening wide downward,
  //           where there is room, instead of up into the outline.
  //   close - 0 to 1 folds the lens into a curved closed eye, a single arc at the line weight: + is the happy
  //           "^ ^" eye of a laugh or a grin, - the drooping "u u" of sleep. Its ends stay at mid-height, on
  //           the bridge and arm. The strongest cue there is at Slack-emoji size, where a lens is 6 px wide
  //           (James, 18 Oct 2026: "they need to really communicate when they are very small").
  // Corners are cubic quarter-ellipses whose top ends follow the brow's slope, so the outline stays smooth at
  // any tilt. The expression fades out as a lens closes (a blink stays a line). side: 'L' or 'R' (which corner
  // is inner). inset: the same shape shrunk by that much, for the lens clip.
  const insetR = (R, k) => ({ x: R.x + k, y: R.y + k, w: Math.max(.01, R.w - 2 * k), h: Math.max(.01, R.h - 2 * k), rx: Math.max(0, R.rx - k), ry: Math.max(0, R.ry - k) });
  // points along a chain of segments ([x,y] start, then ['L', p] / ['Q', c, p] / ['C', c1, c2, p]),
  // resampled to n points evenly by length, for the close morph
  function chainPts(start, segs, n) {
    const dense = [start]; let cur = start;
    for (const s of segs) {
      const p0 = cur, k = s[0] === 'L' ? 2 : 24;
      for (let i = 1; i <= k; i++) { const t = i / k, u = 1 - t;
        dense.push(s[0] === 'L' ? [lerp(p0[0], s[1][0], t), lerp(p0[1], s[1][1], t)]
          : s[0] === 'Q' ? [u * u * p0[0] + 2 * u * t * s[1][0] + t * t * s[2][0], u * u * p0[1] + 2 * u * t * s[1][1] + t * t * s[2][1]]
          : [u * u * u * p0[0] + 3 * u * u * t * s[1][0] + 3 * u * t * t * s[2][0] + t * t * t * s[3][0], u * u * u * p0[1] + 3 * u * u * t * s[1][1] + 3 * u * t * t * s[2][1] + t * t * t * s[3][1]]); }
      cur = s[s.length - 1];
    }
    const cum = [0]; for (let i = 1; i < dense.length; i++) cum.push(cum[i - 1] + Math.hypot(dense[i][0] - dense[i - 1][0], dense[i][1] - dense[i - 1][1]));
    const L = cum[cum.length - 1] || 1, out = []; let j = 0;
    for (let i = 0; i < n; i++) { const s = L * i / (n - 1); while (j < dense.length - 2 && cum[j + 1] < s) j++;
      const l = cum[j + 1] - cum[j] || 1, t = (s - cum[j]) / l; out.push([lerp(dense[j][0], dense[j + 1][0], t), lerp(dense[j][1], dense[j + 1][1], t)]); }
    return out;
  }
  function lensD(R0, ex, side, inset = 0) {
    const Rr = inset ? insetR(R0, inset) : R0;
    // below 0.01 px counts as none (a bump() ends on sin(pi) = 1e-16), so a resting face is the exact original
    const on = v => Math.abs(v || 0) > .01;
    if (!ex || !(on(ex.lift) || on(ex.arch) || on(ex.tilt) || on(ex.smile) || on(ex.close))) return rrD(Rr);
    const amp = clamp((R0.h - 24) / 50), K = .5523, f2 = v => v.toFixed(2), P = q => `${f2(q[0])} ${f2(q[1])}`;
    const lift = (ex.lift || 0) * amp, arch = (ex.arch || 0) * amp, tilt = (ex.tilt || 0) * amp, smile = (ex.smile || 0) * amp;
    const { x, y, w, rx, ry } = Rr, x1 = x + w, y1 = y + Rr.h;
    const unit = (a, b) => { const dx = b[0] - a[0], dy = b[1] - a[1], l = Math.hypot(dx, dy) || 1; return [dx / l, dy / l]; };
    // the brow line through the 2 top corners
    const yl = y - lift + (side === 'L' ? -tilt : tilt), yr = y - lift + (side === 'L' ? tilt : -tilt);
    const line = X => yl + (yr - yl) * (X - x) / w;
    const rxT = rx + (w / 2 - rx) * clamp(Math.max(0, arch) / 16);
    const A = [x + rxT, line(x + rxT) - arch], B = [x1 - rxT, line(x1 - rxT) - arch], Qt = [(A[0] + B[0]) / 2, (A[1] + B[1]) / 2];
    const yb = y1 - smile, Ab = [x + rx, yb], Bb = [x1 - rx, yb];
    // the corner radii share whatever height is left on each side
    const fit = top => { const room = Math.max(4, yb - top); return room >= 2 * ry ? [ry, ry] : [room / 2, room / 2]; };
    const [ryL, ryBL] = fit(line(x)), [ryR, ryBR] = fit(line(x1)), ryB = Math.min(ryBL, ryBR), bStart = yb - ryB;
    const dT = Math.hypot(B[0] - A[0], B[1] - A[1]) > 1 ? unit(A, B) : unit([x, yl], [x1, yr]);
    const S0 = [x, line(x) + ryL], SR = [x1, line(x1) + ryR];
    const top = [['C', [x, line(x) + ryL - (ryL + arch) * K], [A[0] - dT[0] * rxT * K, A[1] - dT[1] * rxT * K], A], ['Q', Qt, B],
      ['C', [B[0] + dT[0] * rxT * K, B[1] + dT[1] * rxT * K], [x1, line(x1) + ryR - (ryR + arch) * K], SR]];
    const bottom = [['C', [x1, yb - ryB * (1 - K)], [Bb[0] + rx * K, yb], Bb], ['L', Ab], ['C', [Ab[0] - rx * K, yb], [x, yb - ryB * (1 - K)], [x, bStart]]];
    const c = Math.max(-1, Math.min(1, ex.close || 0));
    if (!on(c)) {
      const seg = s => s[0] + s.slice(1).map(P).join(' ');
      return `M${P(S0)}${top.map(seg).join('')}L${P([x1, bStart])}${bottom.map(seg).join('')}Z`;
    }
    // closing: the top chain (left mid-height, over the top, right mid-height) and the bottom chain (back
    // under) are both pulled onto 1 arc, so the lens folds into a single curved line at the stroke weight
    const ym = Rr.y + Rr.h / 2, yL = Math.min(Math.max(ym, S0[1]), bStart), yR = Math.min(Math.max(ym, SR[1]), bStart), n = 60;
    const T = chainPts([x, yL], [['L', S0], ...top, ['L', [x1, yR]]], n);
    const Bm = chainPts([x1, yR], [['L', [x1, bStart]], ...bottom, ['L', [x, yL]]], n);
    // The arc rises well above the bridge line and its 2 feet dip below it, so the bridge and the arm meet each
    // closed eye on its flank and the pair reads "^-^" (ends AT the bridge line merged eyes, bridge and arm
    // into 1 wavy line). The feet reach just past the lens edge by e, solved so the flank crosses the bridge
    // line exactly at x and x + w. "u u" is the mirror: ends above, the belly below.
    // the feet only grow in as the eye shuts (cubed), so a half-closed eye squeezes cleanly rather than its
    // bottom corners being dragged down into lumps
    const k = Math.abs(c), kf3 = k * k * k;
    const pw = .75, rise = c > 0 ? .42 : -.30, foot = (c > 0 ? .20 : -.14) * kf3, yEnd = ym + foot * R0.h, span = (rise + foot) * R0.h;
    const t1 = Math.asin(Math.pow(foot / (rise + foot), 1 / pw)) / Math.PI, e = t1 * w / (1 - 2 * t1);
    const arc = chainPts([x - e, yEnd], Array.from({ length: 48 }, (_, i) => { const t = (i + 1) / 48;
      return ['L', [x - e + (w + 2 * e) * t, yEnd - span * Math.pow(Math.sin(Math.PI * t), pw)]]; }), n);
    return ptsD([...T.map((p, i) => [lerp(p[0], arc[i][0], k), lerp(p[1], arc[i][1], k)]), ...Bm.map((p, i) => [lerp(p[0], arc[n - 1 - i][0], k), lerp(p[1], arc[n - 1 - i][1], k)])]);
  }
  // the arm as segments in specs-local space; reveal = how much of it is drawn (0..1), for draw-on moves
  function armGeom(spec, L, st) {
    const y = spec.aY + (st.lensL?.dy || 0), x0 = L.x, hx = spec.hookX, hr = spec.hookR;
    const u = clamp(st.armU || 0), r = hr * (1 - u), drop = (spec.hookEnd - spec.aY - hr) * (1 - u);
    const straightEnd = u >= .999 ? hx - 24 : hx + r;
    const d = u >= .999 ? `M${x0} ${y}H${straightEnd}` : `M${x0} ${y}H${hx + r}A${r} ${r} 0 0 0 ${hx} ${y + r}V${y + r + drop}`;
    let segs = [[[x0, y], [straightEnd, y]]];
    if (u < .999) segs.push([[hx, y + r], [hx, y + r + drop]]);
    if (st.armRot) segs = segs.map(sg => sg.map(p => rot(p, [x0, y], st.armRot)));
    const len = (x0 - straightEnd) + (u < .999 ? Math.PI * r / 2 + drop : 0);
    return { d, segs, len, straight: x0 - straightEnd, hinge: [x0, y] };
  }

  // ---------- the outline with tracked gaps ----------
  function segX(p1, p2, p3, p4) { // segment intersection -> u along p1p2, v along p3p4
    const d = (p2[0] - p1[0]) * (p4[1] - p3[1]) - (p2[1] - p1[1]) * (p4[0] - p3[0]); if (Math.abs(d) < 1e-9) return null;
    const u = ((p3[0] - p1[0]) * (p4[1] - p3[1]) - (p3[1] - p1[1]) * (p4[0] - p3[0])) / d, v = ((p3[0] - p1[0]) * (p2[1] - p1[1]) - (p3[1] - p1[1]) * (p2[0] - p1[0])) / d;
    return u >= 0 && u <= 1 && v >= 0 && v <= 1 ? [u, v] : null;
  }
  // crossings: [{ s (arc position on the outline), C (crossing point), n (unit normal of the arm) }]
  // The gap is the band within G of the arm's centreline, measured across the arm, so each cut edge runs
  // parallel to the arm (Tom, 16 Oct 2026). Where that cut meets the outline at an angle other than 90°,
  // the 2 corners are still rounded by CAP, like the SB logo's gap ends.
  const G = SW;
  function outlineSVG(P, crossings, ink, extra = '') {
    const n = P.length, cum = [0]; for (let i = 0; i < n; i++) { const a = P[i], b = P[(i + 1) % n]; cum.push(cum[i] + Math.hypot(b[0] - a[0], b[1] - a[1])); }
    const L = cum[n];
    const at = s => { s = ((s % L) + L) % L; let i = 0; while (i < n - 1 && cum[i + 1] < s) i++; const a = P[i], b = P[(i + 1) % n], l = cum[i + 1] - cum[i], u = l ? (s - cum[i]) / l : 0; return [a[0] + (b[0] - a[0]) * u, a[1] + (b[1] - a[1]) * u]; };
    const S = `fill="none" stroke="${ink}" stroke-width="${SW}" stroke-linejoin="round"${extra}`;
    if (!crossings.length) return `<path d="${ptsD(P)}" ${S}/>`;
    const dist = (p, c) => (p[0] - c.C[0]) * c.n[0] + (p[1] - c.C[1]) * c.n[1];
    // gap interval along the outline: where the centreline is inside the band |dist| < G
    const gaps = crossings.map(c => { let lo = c.s, hi = c.s;
      for (let k = 0; k < 400 && Math.abs(dist(at(lo), c)) < G; k++) lo -= .5;
      for (let k = 0; k < 400 && Math.abs(dist(at(hi), c)) < G; k++) hi += .5;
      return { lo, hi, c, slo: Math.sign(dist(at(lo), c)) || -1, shi: Math.sign(dist(at(hi), c)) || 1 }; }).sort((x, y) => x.lo - y.lo);
    const M = [];
    for (const g of gaps) { const last = M[M.length - 1]; if (last && g.lo <= last.hi) { if (g.hi > last.hi) { last.hi = g.hi; last.chi = g.c; last.shi = g.shi; } } else M.push({ lo: g.lo, hi: g.hi, clo: g.c, chi: g.c, slo: g.slo, shi: g.shi }); }
    if (M.length > 1 && M[M.length - 1].hi - L >= M[0].lo) { const z = M.pop(); M[0].lo = z.lo - L; M[0].clo = z.clo; M[0].slo = z.slo; }
    const E = 1.5 * SW;
    const vis = []; for (let i = 0; i < M.length; i++) { const nx = i + 1 < M.length ? M[i + 1] : { ...M[0], lo: M[0].lo + L }; const a = M[i].hi, b = nx.lo; if (b - a > 2 * E + 4) vis.push({ a, b, ca: M[i].chi, sa: M[i].shi, cb: nx.clo, sb: nx.slo }); }
    const f2 = v => v.toFixed(2);
    // one end of a visible run: the stroke as a filled shape, from inside the run out to the cut line
    function endPiece(sVis, sGap, c, sign) {
      const step = sGap > sVis ? 1 : -1, outer = [], inner = [];
      for (let s = sVis; step > 0 ? s <= sGap : s >= sGap; s += step) {
        const p = at(s), t1 = at(s - .5), t2 = at(s + .5), tl = Math.hypot(t2[0] - t1[0], t2[1] - t1[1]) || 1, nx = -(t2[1] - t1[1]) / tl, ny = (t2[0] - t1[0]) / tl;
        outer.push([p[0] + nx * SW / 2, p[1] + ny * SW / 2]); inner.push([p[0] - nx * SW / 2, p[1] - ny * SW / 2]);
      }
      const side = q => sign * dist(q, c) - G; // >= 0 outside the band on this run's side
      const cut = poly => { for (let i = 0; i < poly.length - 1; i++) { const fa = side(poly[i]), fb = side(poly[i + 1]); if (fa >= 0 && fb < 0) { const u = fa / (fa - fb); return [i, [poly[i][0] + (poly[i + 1][0] - poly[i][0]) * u, poly[i][1] + (poly[i + 1][1] - poly[i][1]) * u]]; } } return null; };
      const co = cut(outer), ci = cut(inner); if (!co || !ci) return '';
      const O = co[1], I = ci[1], os = outer.slice(0, co[0] + 1), is = inner.slice(0, ci[0] + 1);
      const trim = (arr, Q) => { while (arr.length > 2 && Math.hypot(arr[arr.length - 1][0] - Q[0], arr[arr.length - 1][1] - Q[1]) < CAP * 1.2) arr.pop(); };
      trim(os, O); trim(is, I);
      const fil = (P0, A, B) => { const da = Math.hypot(A[0] - P0[0], A[1] - P0[1]) || 1, db = Math.hypot(B[0] - P0[0], B[1] - P0[1]) || 1, r = Math.min(CAP, da, db / 2);
        return [[P0[0] + (A[0] - P0[0]) / da * r, P0[1] + (A[1] - P0[1]) / da * r], [P0[0] + (B[0] - P0[0]) / db * r, P0[1] + (B[1] - P0[1]) / db * r]]; };
      const [o1, o2] = fil(O, os[os.length - 1], I), [i1, i2] = fil(I, O, is[is.length - 1]);
      let d = `M${f2(os[0][0])} ${f2(os[0][1])}` + os.slice(1).map(q => `L${f2(q[0])} ${f2(q[1])}`).join('');
      d += `L${f2(o1[0])} ${f2(o1[1])}Q${f2(O[0])} ${f2(O[1])} ${f2(o2[0])} ${f2(o2[1])}L${f2(i1[0])} ${f2(i1[1])}Q${f2(I[0])} ${f2(I[1])} ${f2(i2[0])} ${f2(i2[1])}`;
      d += is.slice().reverse().map(q => `L${f2(q[0])} ${f2(q[1])}`).join('') + 'Z';
      return `<path d="${d}" fill="${ink}"${extra}/>`;
    }
    let out = '';
    for (const v of vis) {
      const pts = [at(v.a + E)]; for (let i = 0; i < n * 3; i++) { const s = cum[i % n] + Math.floor(i / n) * L; if (s > v.a + E && s < v.b - E) pts.push(P[i % n]); } pts.push(at(v.b - E));
      out += `<path d="${ptsD(pts, false)}" ${S}/>`;
      out += endPiece(v.a + E + 1, v.a - SW, v.ca, v.sa) + endPiece(v.b - E - 1, v.b + SW, v.cb, v.sb);
    }
    return out;
  }

  // ---------- render one frame ----------
  // st: { a, b, k (shape morph), root:{x,y,r,o}, body:{x,y}, specs:{x,y,r,o}, lensL/lensR:{dx,dy,dw,dh}, armU, armReveal,
  //       tab:{x,y,r,o}, band/dots/menu/tail overrides, dotsSt:[{dx,dy,r,fill}], outlineReveal, fillO, layers:{back,inside,front,lensL,lensR,top} }
  let UID = 0;
  function frame(st = {}) {
    const id = 'lm' + (++UID % 1e6);
    const P = pose(st.a || 'sb', st.b || st.a || 'sb', clamp(st.k || 0)), ink = st.ink || P.ink, S = `stroke="${ink}" stroke-width="${SW}"`;
    if (st.deform) { P.out = P.out.map(st.deform); P.fill = P.fill.map(st.deform); }
    const lay = st.layers || {}, sp = st.specs || {}, body = st.body || {}, rt = st.root || {};
    const spec = P.spec, L = lensRect(spec.L, st.lensL), R = lensRect(spec.R, st.lensR);
    const arm = armGeom(spec, L, st);
    const reveal = st.armReveal ?? 1;
    // gap: where the drawn part of the arm crosses the outline, in body space
    const gaps = [];
    if ((sp.o ?? 1) > .01 && (st.gapOn ?? 1)) {
      let budget = arm.len * reveal;
      for (const [p1, p2] of arm.segs) {
        const l = Math.hypot(p2[0] - p1[0], p2[1] - p1[1]); if (budget <= 0) break;
        const q2 = budget >= l ? p2 : [p1[0] + (p2[0] - p1[0]) * budget / l, p1[1] + (p2[1] - p1[1]) * budget / l]; budget -= l;
        const w1 = applyT(p1, sp, SPIV), w2 = applyT(q2, sp, SPIV), b1 = [w1[0] - (body.x || 0), w1[1] - (body.y || 0)], b2 = [w2[0] - (body.x || 0), w2[1] - (body.y || 0)];
        const O = P.out, n = O.length; let cum = 0;
        const dl = Math.hypot(b2[0] - b1[0], b2[1] - b1[1]) || 1, nrm = [-(b2[1] - b1[1]) / dl, (b2[0] - b1[0]) / dl];
        for (let i = 0; i < n; i++) { const a = O[i], b = O[(i + 1) % n], el = Math.hypot(b[0] - a[0], b[1] - a[1]); const hit = segX(b1, b2, a, b); if (hit) gaps.push({ s: cum + hit[1] * el, C: [b1[0] + (b2[0] - b1[0]) * hit[0], b1[1] + (b2[1] - b1[1]) * hit[0]], n: nrm }); cum += el; }
      }
    }
    // body
    const tailFan = P.tail > .001 ? (() => { const [i0, i1] = CH.tailIdx, c = [P.fill.reduce((s, p) => s + p[0], 0) / N, P.fill.reduce((s, p) => s + p[1], 0) / N]; return `<path d="${ptsD([c, ...P.out.slice(i0, i1 + 1)])}" fill="${COL.peach}" opacity="${P.tail.toFixed(3)}"/>`; })() : '';
    const bandY = 80;
    const bandPts = P.fill.map(p => [p[0], Math.min(p[1], bandY)]);
    const bandO = st.bandO ?? P.band, dotsO = st.dotsO ?? P.dots, menuO = st.menuO ?? P.menu;
    const dotsBase = [[92, 45], [123, 45], [154, 45]];
    const dots = dotsO > .001 ? dotsBase.map(([x, y], i) => { const d = (st.dotsSt || [])[i] || {}; return `<circle cx="${x + (d.dx || 0)}" cy="${y + (d.dy || 0)}" r="${d.r ?? 11}" fill="${d.fill || ink}" opacity="${(dotsO * (d.o ?? 1)).toFixed(3)}"/>`; }).join('') : '';
    const menu = menuO > .001 ? `<path d="M50 ${bandY}H420" fill="none" ${S} opacity="${menuO.toFixed(3)}"${st.menuDash != null ? ` pathLength="1" stroke-dasharray="${st.menuDash} 2"` : ''}/>` : '';
    const outExtra = st.outlineReveal != null ? ` opacity="1"` : '';
    let outline = outlineSVG(P.out, gaps, ink, outExtra);
    if (st.outlineReveal != null) outline = `<path d="${ptsD(P.out)}" fill="none" ${S} stroke-linejoin="round" pathLength="1" stroke-dasharray="${clamp(st.outlineReveal)} 2"/>`;
    const fillO = st.fillO ?? 1;
    const bandClip = st.bandClip != null ? ` clip-path="url(#${id}bc)"` : '';
    const tab = P.tab > .001 ? `<g opacity="${(P.tab * (st.tab?.o ?? 1)).toFixed(3)}" transform="${tfStr(st.tab || {}, [50, 160])}"><path d="${SB_TAB}" fill="${COL.peach}" ${S}/></g>` : '';
    // specs
    const lensFill = st.lensFill || [COL.lens, COL.lens];
    const specs = (sp.o ?? 1) > .001 ? `<g transform="${tfStr(sp, SPIV)}" opacity="${(sp.o ?? 1).toFixed(3)}">
      ${reveal <= .002 ? '' : `<path d="${arm.d}" transform="rotate(${st.armRot || 0} ${arm.hinge[0]} ${arm.hinge[1]})" fill="none" ${S} stroke-linecap="round" stroke-linejoin="round"${reveal < 1 ? ` pathLength="1" stroke-dasharray="${reveal.toFixed(4)} 2"` : ''}/>`}
      ${st.bridgeO === 0 ? '' : `<path d="M${L.x + L.w} ${spec.bY + (st.lensL?.dy || 0)}L${R.x} ${spec.bY + (st.lensR?.dy || 0)}" fill="none" ${S}${st.bridgeLen != null ? ` pathLength="1" stroke-dasharray="${st.bridgeLen} 2"` : ''}/>`}
      ${st.lensO?.[0] === 0 ? '' : `<path d="${lensD(L, st.lensL?.ex, 'L')}" fill="${lensFill[0]}" ${S} stroke-linecap="round" stroke-linejoin="round"/>`}
      ${lay.lensL ? `<g clip-path="url(#${id}cl)">${lay.lensL}</g>` : ''}
      ${st.lensO?.[1] === 0 ? '' : `<path d="${lensD(R, st.lensR?.ex, 'R')}" fill="${lensFill[1]}" ${S} stroke-linecap="round" stroke-linejoin="round"/>`}
      ${lay.lensR ? `<g clip-path="url(#${id}cr)">${lay.lensR}</g>` : ''}
      ${lay.specs || ''}</g>` : '';
    const defs = `<defs><clipPath id="${id}cl"><path d="${lensD(L, st.lensL?.ex, 'L', SW / 2)}"/></clipPath><clipPath id="${id}cr"><path d="${lensD(R, st.lensR?.ex, 'R', SW / 2)}"/></clipPath>${st.bandClip != null ? `<clipPath id="${id}bc"><rect x="40" y="0" width="${st.bandClip}" height="100"/></clipPath>` : ''}<clipPath id="${id}fc"><path d="${ptsD(P.fill)}"/></clipPath></defs>`;
    return `${defs}<g transform="${tfStr(rt, RPIV)}" opacity="${(rt.o ?? 1).toFixed(3)}">
      ${lay.back || ''}${tab}${lay.mid || ''}
      <g transform="translate(${(body.x || 0).toFixed(2)} ${(body.y || 0).toFixed(2)})" opacity="${(body.o ?? 1).toFixed(3)}">
        <g opacity="${fillO}">${tailFan}<path d="${ptsD(P.fill)}" fill="${COL.cream}"/>
        ${bandO > .001 ? `<path d="${ptsD(bandPts)}" fill="${st.bandFill || COL.peach}" opacity="${bandO.toFixed(3)}"${bandClip}/>` : ''}</g>
        ${lay.clipped ? `<g clip-path="url(#${id}fc)">${lay.clipped}</g>` : ''}
        ${dots}${lay.inside || ''}${menu}${outline}${lay.bodyTop || ''}
      </g>
      ${specs}
      ${lay.front || ''}
    </g>${lay.top || ''}`;
  }

  const DAILY_BAND = ptsD(CH.daily.fill.map(p => [p[0], Math.min(p[1], 80)]));
  root.LogoEngine = { SW, CAP, COL, CH, frame, pose, lensRect, rrD, lensD, ptsD, QE, ePt, SPEC_SB, SPEC_QC, SB_TAB, DAILY_BAND, clamp, lerp };
})(typeof window !== 'undefined' ? window : globalThis);
