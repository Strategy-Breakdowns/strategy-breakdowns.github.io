// design/logo-lab/engine.js
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
      ${st.lensO?.[0] === 0 ? '' : `<path d="${rrD(L)}" fill="${lensFill[0]}" ${S} stroke-linecap="round" stroke-linejoin="round"/>`}
      ${lay.lensL ? `<g clip-path="url(#${id}cl)">${lay.lensL}</g>` : ''}
      ${st.lensO?.[1] === 0 ? '' : `<path d="${rrD(R)}" fill="${lensFill[1]}" ${S} stroke-linecap="round" stroke-linejoin="round"/>`}
      ${lay.lensR ? `<g clip-path="url(#${id}cr)">${lay.lensR}</g>` : ''}
      ${lay.specs || ''}</g>` : '';
    const defs = `<defs><clipPath id="${id}cl"><path d="${rrD({ ...L, x: L.x + SW / 2, y: L.y + SW / 2, w: Math.max(.01, L.w - SW), h: Math.max(.01, L.h - SW), rx: Math.max(0, L.rx - SW / 2), ry: Math.max(0, L.ry - SW / 2) })}"/></clipPath><clipPath id="${id}cr"><path d="${rrD({ ...R, x: R.x + SW / 2, y: R.y + SW / 2, w: Math.max(.01, R.w - SW), h: Math.max(.01, R.h - SW), rx: Math.max(0, R.rx - SW / 2), ry: Math.max(0, R.ry - SW / 2) })}"/></clipPath>${st.bandClip != null ? `<clipPath id="${id}bc"><rect x="40" y="0" width="${st.bandClip}" height="100"/></clipPath>` : ''}<clipPath id="${id}fc"><path d="${ptsD(P.fill)}"/></clipPath></defs>`;
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
  root.LogoEngine = { SW, CAP, COL, CH, frame, pose, lensRect, rrD, ptsD, QE, ePt, SPEC_SB, SPEC_QC, SB_TAB, DAILY_BAND, clamp, lerp };
})(typeof window !== 'undefined' ? window : globalThis);

// design/logo-lab/motions.js
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
  const closeAt = (t, at, d = .22) => { const k = (t - at) / d; return k < 0 || k > 1 ? 0 : (k < .4 ? E.in(k / .4) : 1 - E.out((k - .4) / .6)); };
  const spec = c => CH[c].spec;
  const shut = (c, amt, side = 'L') => ({ dh: -spec(c)[side].h * amt }); // close a lens by redrawing it shorter
  const lensBoth = (c, amt) => ({ lensL: shut(c, amt, 'L'), lensR: shut(c, amt, 'R') });
  const grow = (g) => ({ lensL: { dw: 22 * g, dh: 18 * g }, lensR: { dw: 20 * g, dh: 18 * g } });
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
    peek: c => t => { const y = kf(t, [[0, 0], [.4, 0], [.75, 20, 'out'], [2.2, 20], [2.35, -8, 'out'], [2.55, 0]]); const b = Math.max(closeAt(t, 1.15), closeAt(t, 1.45));
      return { a: c, specs: { y, r: kf(t, [[0, 0], [.4, 0], [.75, -3, 'out'], [2.2, -3], [2.4, 0]]) }, ...lensBoth(c, b * .96) }; },
    look: c => t => { const k = kf(t, [[0, 0], [.4, 0], [.65, 1, 'out'], [1.4, 1], [1.65, -1, 'io'], [2.3, -1], [2.6, 0]]);
      return { a: c, specs: { x: 22 * Math.max(k, 0) - 24 * Math.max(-k, 0) }, root: { r: -2 * k } }; },
    sideEye: c => t => { const k = kf(t, [[0, 0], [.4, 0], [.65, 1, 'out'], [2.0, 1], [2.35, 0]]); return { a: c, specs: { x: 24 * k, r: 2 * k }, ...lensBoth(c, .5 * k), root: { r: -2 * k } }; },
    doubleTake: c => t => { const x = kf(t, [[0, 0], [.3, 0], [.55, -22, 'out'], [1.0, -22], [1.1, 6, 'out'], [1.3, 0]]), w = kf(t, [[0, 0], [1.0, 0], [1.15, 1, 'back'], [1.9, 1], [2.15, 0]]);
      return { a: c, specs: { x, y: -16 * w }, ...grow(w) }; },
    eyeRoll: c => t => { const th = E.io(clamp((t - .5) / 1.0)) * Math.PI * 2; const sigh = bump(t, 1.5, .5);
      return { a: c, specs: { x: -16 * Math.sin(th), y: -18 * (1 - Math.cos(th)) + 6 * sigh }, ...lensBoth(c, kf(t, [[0, 0], [.4, 0], [.6, .2], [1.5, .2], [1.7, .35], [2.2, 0]])), root: { r: 1.5 * sigh } }; },
    wink: c => t => ({ a: c, lensR: shut(c, closeAt(t, .9, .55) * .97, 'R'), specs: { r: kf(t, [[0, 0], [.7, 0], [.95, -5, 'out'], [1.5, -5], [1.8, 0]]) }, root: { r: kf(t, [[0, 0], [.7, 0], [.95, 2.5, 'out'], [1.5, 2.5], [1.8, 0]]) } }),
    blink: c => t => ({ a: c, ...lensBoth(c, Math.max(closeAt(t, 1.0), closeAt(t, 1.32)) * .97) }),
    squint: c => t => { const k = kf(t, [[0, 0], [.4, 0], [.7, 1, 'out'], [1.7, 1], [1.9, -.15, 'out'], [2.1, 0]]); return { a: c, ...lensBoth(c, .55 * k), specs: { y: 5 * Math.max(k, 0) } }; },
    wide: (c, mark = true) => t => { const g = kf(t, [[0, 0], [.3, 0], [.5, 1, 'back'], [1.6, 1], [1.85, 0]]), e = kf(t, [[0, 0], [.45, 0], [.65, 1, 'back'], [1.5, 1], [1.65, 0, 'in']]);
      const [cx, cy] = anchor(c);
      return { a: c, ...grow(g), specs: { y: -14 * g }, layers: { front: mark && e > .05 ? `<g opacity="${e}"><path d="M${cx + 34} ${cy - 100 + 40 * (1 - e)}V${cy - 52}" stroke="${COL.orange}" stroke-width="${SW}" stroke-linecap="round"/>${dot(cx + 34, cy - 20, SW * 1.4, COL.orange)}</g>` : '' } }; },
    hop: c => t => { // the SB GIF launch: rock back, kick, specs fly up spinning, land low, spring up. No squash.
      const rr = kf(t, [[0, 0], [.2, 0], [.35, 3], [.45, 0], [.6, -7, 'out'], [.95, 0]]) + kf(t, [[0, 0], [1.6, 0], [1.68, -2.5, 'out'], [1.85, 0]]);
      const y = kf(t, [[0, 0], [.45, 6], [.95, -300, 'out'], [1.62, 12, 'in'], [1.76, -6, 'out'], [1.9, 0]]), x = kf(t, [[0, 0], [.45, 0], [.95, 40, 'out'], [1.62, 0, 'in']]);
      const r = (kf(t, [[0, 0], [.45, 0], [1.3, 200, 'lin'], [1.62, 372, 'out'], [1.75, 358], [1.9, 360]]) % 360);
      return { a: c, root: { r: rr }, specs: { x, y, r } }; },
    spin: c => t => { const y = kf(t, [[0, 0], [.3, 4], [.65, -120, 'out'], [1.45, -120], [1.75, 10, 'in'], [1.9, -4, 'out'], [2.05, 0]]);
      return { a: c, specs: { y, r: kf(t, [[0, 0], [.6, 0], [1.45, 360]]) % 360 } }; },
    nod: c => t => { const R = t => kf(t, [[0, 0], [.25, 0], [.4, -3], [.6, 7], [.78, -1], [.95, 6], [1.2, 0]]); const lag = R(t - .07) - R(t);
      return { a: c, root: { r: R(t) }, specs: { r: lag * 1.5, y: lag * 1.2 } }; },
    brow: c => t => { const k = kf(t, [[0, 0], [.4, 0], [.7, 1, 'back'], [2.0, 1], [2.3, 0]]); return { a: c, lensR: { dy: -18 * k }, lensL: shut(c, .22 * k, 'L'), specs: { r: 3 * k } }; },
    reading: c => t => { const line = Math.floor(clamp(t / .9, 0, 2.999)), p = (t % .9) / .9;
      let x = t < 2.7 ? (p < .8 ? -18 + 36 * E.io(p / .8) : 18 - 36 * E.io((p - .8) / .2)) : kf(t, [[2.7, -18], [3.0, 0]]);
      const y = t < 2.7 ? line * 7 : kf(t, [[2.7, 14], [3.0, 0]]);
      return { a: c, specs: { x, y }, ...lensBoth(c, closeAt(t, 3.25) * .97) }; },
    idle: c => t => { const x = kf(t, [[0, 0], [1.4, 0], [1.7, -14, 'out'], [2.9, -14], [3.2, 0], [5.4, 0], [5.7, 12, 'out'], [6.6, 12], [6.9, 0]]);
      const b = Math.max(closeAt(t, 4.2), closeAt(t, 7.2), closeAt(t, 7.45));
      return { a: c, root: { y: -4 * Math.sin(t / 4 * Math.PI * 2) }, specs: { x }, ...lensBoth(c, b * .97) }; },
    sleepy: c => t => { const d = kf(t, [[0, 0], [.3, 0], [1.0, .62], [2.6, .62], [2.68, 0, 'out']]), w = kf(t, [[0, 0], [2.6, 0], [2.72, 1, 'back'], [3.2, 1], [3.5, 0]]);
      const [cx, cy] = anchor(c);
      return { a: c, root: { r: t > .6 && t < 2.6 ? 1.5 * Math.sin((t - .6) * Math.PI) : 0 }, lensL: { dh: -spec(c).L.h * d + 18 * w, dw: 22 * w }, lensR: { dh: -spec(c).R.h * d + 18 * w, dw: 20 * w },
        specs: { y: 8 * d - 14 * w }, layers: { front: ring(cx, cy, t, 2.55, c) + badge(cx, cy, kf(t, [[0, 0], [2.5, 0], [2.65, 30, 'back'], [3.9, 30], [4.1, 0, 'in']]), '', c) } }; },
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
    thinking: c => t => { const k = kf(t, [[0, 0], [.3, 0], [.6, 1, 'out'], [2.9, 1], [3.2, 0]]); const [x, y] = anchor(c);
      const r = i => kf(t, [[0, 0], [.6 + i * .3, 0], [.85 + i * .3, [14, 22, 34][i], 'back'], [2.8, [14, 22, 34][i]], [3.0 + i * .05, 0, 'in']]);
      return { a: c, specs: { x: 8 * k, y: -10 * k, r: -5 * k }, layers: { top: '', front: cloud(x + 10, y - 26, r(0), c) + cloud(x + 40, y - 80, r(1), c) + cloud(x + 30, y - 150, r(2), c) } }; },
    laugh: c => t => { const on = t > .3 && t < 1.6 ? Math.sin(Math.PI * (t - .3) / 1.3) : 0;
      return { a: c, root: { r: 3.5 * on * Math.sin(t * 44), y: -4 * on * Math.abs(Math.sin(t * 22)) }, specs: { y: -10 * on * Math.abs(Math.sin(t * 22 + 1)) }, ...lensBoth(c, .45 * on) }; },
    wave: c => t => ({ a: c, armRot: kf(t, [[0, 0], [.3, 0], [.55, -30, 'out'], [.8, -8], [1.05, -30], [1.3, -8], [1.55, -24], [1.9, 0]]) }),
    badgeCount: c => t => { const n = t < 1.2 ? 1 : t < 2.0 ? 2 : 3, [x, y] = anchor(c);
      const r = kf(t, [[0, 0], [.2, 0], [.5, 40, 'back'], [3.1, 40], [3.35, 0, 'in']]) + 6 * (bump(t, 1.2, .25) + bump(t, 2.0, .25));
      const j = bump(t, .45, .3) + bump(t, 1.2, .3) + bump(t, 2.0, .3);
      return { a: c, root: { y: 4 * j }, layers: { front: badge(x, y, r, n, c) } }; },
    inboxZero: c => t => { const n = Math.max(0, 5 - Math.floor(clamp((t - .5) / .32, 0, 5))), [x, y] = anchor(c), tick = ((t - .5) % .32) / .32, live = t > .5 && t < 2.1;
      const r = kf(t, [[0, 0], [.1, 0], [.4, 40, 'back'], [2.2, 40], [2.32, 48, 'out'], [2.45, 0, 'in']]) + (live ? 5 * Math.sin(Math.PI * clamp(tick * 3)) : 0);
      const k = clamp((t - 2.35) / .5), burst = k > 0 && k < 1 ? [0, 45, 90, 135, 180, 225, 270, 315].map(a => { const q = a * Math.PI / 180, r1 = 50 + k * 30, r2 = r1 + 26; return `<path d="M${x + Math.cos(q) * r1} ${y + Math.sin(q) * r1}L${x + Math.cos(q) * r2} ${y + Math.sin(q) * r2}" stroke="${COL.orange}" stroke-width="${SW}" stroke-linecap="round" opacity="${1 - k}"/>`; }).join('') : '';
      const g = live ? Math.sin(Math.PI * clamp(tick * 2.5)) : 0, hop = bump(t, 2.4, .45);
      return { a: c, root: { y: -30 * hop }, specs: { x: 6 * g, y: -4 * g - 10 * hop }, ...lensBoth(c, kf(t, [[0, 0], [2.4, 0], [2.55, .5, 'out'], [3.4, .5], [3.6, 0]])), layers: { front: badge(x, y, r, n, c) + burst } }; },
    ping: c => t => { const [x, y] = anchor(c), lift = -8 * (bump(t, .3, .3) + bump(t, 1.1, .3));
      return { a: c, specs: { y: lift }, layers: { front: ring(x, y, t, .3, c) + ring(x, y, t, 1.1, c) + badge(x, y, kf(t, [[0, 0], [.1, 0], [.3, 22, 'back'], [2.5, 22], [2.7, 0, 'in']]), '', c) } }; },
    threePings: c => t => { const [x, y] = anchor(c), n = t < 1 ? 1 : t < 1.8 ? 2 : 3;
      const r = kf(t, [[0, 0], [.2, 0], [.45, 40, 'back'], [3.2, 40], [3.45, 0, 'in']]) + 6 * bump(t, 1.0, .2) + 8 * bump(t, 1.8, .2);
      const g = t < 1 ? kf(t, [[0, 0], [.4, 0], [.6, .3, 'back']]) : t < 1.8 ? kf(t, [[1.0, .3], [1.2, .65, 'back']]) : kf(t, [[1.8, .65], [2.0, 1, 'back'], [3.0, 1], [3.3, 0]]);
      const shake = t > 2.0 && t < 2.6 ? Math.sin((t - 2) * 60) * 3 * (1 - (t - 2) / .6) : 0;
      return { a: c, ...grow(g), root: { r: shake }, layers: { front: ring(x, y, t, .3, c) + ring(x, y, t, 1.0, c, 110) + ring(x, y, t, 1.8, c, 130) + badge(x, y, r, n, c) } }; },
    tap: (c, kind) => t => { const [x, y] = anchor(c), w = kf(t, [[0, 0], [.3, 0], [.55, 150, 'back'], [2.4, 150], [2.6, 0, 'in']]), h = Math.min(100, w * .66);
      const inner = kind === 'heart' ? heart(x + 4, y - 50, 24 + 4 * (bump(t, .9, .18) + bump(t, 1.2, .18))) : txt(x + 4, y - 50, kind, kind === '?' ? 56 : 46);
      const k = kf(t, [[0, 0], [.4, 0], [.7, 1, 'back'], [2.2, 1], [2.5, 0]]);
      const face = kind === '!!' ? { ...grow(k), specs: { y: -14 * k } } : kind === 'HA' ? { ...lensBoth(c, .45 * k), root: { r: 3 * k * Math.sin(t * 40) } } : kind === '?' ? { lensR: { dy: -12 * k }, specs: { r: 6 * k, x: -6 * k }, root: { r: -2 * k } } : { ...grow(.6 * bump(t, .9, .2) + .6 * bump(t, 1.2, .2)) };
      return { a: c, ...face, layers: { front: chip(x + 4, y - 50, w, h, inner, c) } }; },
    tapCycle: c => t => { const kinds = ['heart', '!!', 'HA', '?'], ph = Math.min(3, Math.floor(t / 1.5)), lt = t % 1.5; const sub = M.tap(c, kinds[ph]);
      const s = sub(lt * 1.6 + .25); return s; },
  };

  // =============== quicker.chat (32) ===============
  const q = 'qc';
  [['peek', 'Over the Specs', 3.0, 'Slides down to look over the specs, blinks twice, pushes them back up.', M.peek(q)],
   ['look', 'Look Around', 3.0, 'Glances right, then left, with a slight lean of the body.', M.look(q)],
   ['sideeye', 'Side-Eye', 3.0, 'The sarcastic glance. The lenses narrow by getting shorter, never thinner.', M.sideEye(q)],
   ['doubletake', 'Double Take', 2.6, 'Looks away, snaps back with the lenses opening wider. Same line weight throughout.', M.doubleTake(q)],
   ['eyeroll', 'Eye Roll', 2.8, 'A full loop up and round, then a sigh.', M.eyeRoll(q)],
   ['wink', 'Wink', 2.4, 'Only the right lens closes, down to a single line.', M.wink(q)],
   ['blink', 'Blink', 2.6, 'A double blink: each lens closes to a line the same thickness as the frame.', M.blink(q)],
   ['squint', 'Squint', 2.6, 'Lenses get shorter; tops, bottoms and sides keep their weight.', M.squint(q)],
   ['wide', 'Wide-Eyed', 2.6, 'Lenses open wider with an exclamation in the logo\'s own stroke.', M.wide(q)],
   ['hop', 'Hop Off', 3.4, 'The SB GIF move. The outline closes while the specs are off the face, and reopens exactly where they land.', M.hop(q)],
   ['spin', 'Spin', 2.6, 'Specs lift, spin flat, drop back. The gap follows the arm all the way.', M.spin(q)],
   ['nod', 'Nod', 2.4, 'Nods from the base with the specs a frame behind.', M.nod(q)],
   ['brow', 'Skeptical', 2.8, 'Right lens lifts like an eyebrow, the bridge tilts, the left narrows.', M.brow(q)],
   ['reading', 'Reading', 3.8, '3 lines, left to right, then a satisfied blink.', M.reading(q)],
   ['idle', 'Idle', 8, 'A slow float, a look left, a blink, a look right, a double blink.', M.idle(q)],
   ['sleepy', 'Sleepy', 4.4, 'Droops at a quiet inbox until a ping wakes it.', M.sleepy(q)],
   ['dots10', 'Dots to Specs · 1×', 4.0, 'Typing dots 1 line-weight wide, across the face, that become the glasses.', M.dotsToSpecs(q, 1)],
   ['dots15', 'Dots to Specs · 1.5×', 4.0, 'The same with dots 1.5 line-weights wide.', M.dotsToSpecs(q, 1.5)],
   ['dots20', 'Dots to Specs · 2×', 4.0, 'Dots 2 line-weights wide (radius = the stroke).', M.dotsToSpecs(q, 2)],
   ['dots25', 'Dots to Specs · 2.5×', 4.0, 'Dots 2.5 line-weights wide. The biggest that still reads as a dot.', M.dotsToSpecs(q, 2.5)],
   ['typing', 'Typing', 2.6, 'Dots 1.5 line-weights wide bounce under the specs.', M.typing(q, 1.5)],
   ['thinking', 'Thinking', 3.2, 'Thought bubbles rise, each outlined in the logo\'s stroke.', M.thinking(q)],
   ['tapheart', 'Tapback Heart', 2.8, 'A heart reaction lands in a chip drawn at the logo\'s line weight.', M.tap(q, 'heart')],
   ['tapbang', 'Tapback !!', 2.8, '"!!" lands and the lenses open wide.', M.tap(q, '!!')],
   ['tapha', 'Tapback HA', 2.8, '"HA" lands and it laughs.', M.tap(q, 'HA')],
   ['tapcycle', 'Tapback Cycle', 6, 'Heart, !!, HA and ? in turn, the face matching each.', M.tapCycle(q)],
   ['badge', 'Badge Count', 3.6, '1, 2, 3 messages. The badge grows by radius, its outline stays the logo\'s weight.', M.badgeCount(q)],
   ['zero', 'Inbox Zero', 4.2, 'Counts 5 to 0, bursts, hops. The quicker.chat promise.', M.inboxZero(q)],
   ['ping', 'Ping', 3.0, 'Rings in the logo\'s stroke weight ripple out of a dot.', M.ping(q)],
   ['threepings', '3 Pings', 3.8, 'Each ping louder; the lenses open a little more each time.', M.threePings(q)],
   ['wave', 'Hello Arm', 2.6, 'The arm waves; the gap slides along the oval with it.', M.wave(q)],
   ['laugh', 'Ha Ha', 2.4, 'Shaking, squinting, bouncing.', M.laugh(q)],
  ].forEach(([id, name, dur, desc, fn]) => add('qc', id, name, dur, desc, fn));

  // =============== the Daily (#81) (32) ===============
  const d = 'daily', dI = ink(d);
  const hdr = (fn) => fn; // marker for header-specific moves
  const dotsSeq = (t, base, pal) => [0, 1, 2].map(i => ({ fill: pal(i, t) }));
  [['peek', 'Over the Specs', 3.0, 'Slides down, blinks, pushes back up.', M.peek(d)],
   ['look', 'Look Around', 3.0, 'Right, then left.', M.look(d)],
   ['sideeye', 'Side-Eye', 3.0, 'Narrow glance to the right.', M.sideEye(d)],
   ['wide', 'Wide-Eyed', 2.6, 'Lenses open wider; an exclamation pops off the corner.', M.wide(d)],
   ['blink', 'Blink', 2.6, 'Double blink, lenses closing to a line.', M.blink(d)],
   ['wink', 'Wink', 2.4, 'Right lens only.', M.wink(d)],
   ['hop', 'Hop Off', 3.4, 'Specs fly off and land; the window edge closes and reopens with them.', M.hop(d)],
   ['spin', 'Spin', 2.6, 'Lift, spin, drop.', M.spin(d)],
   ['nod', 'Nod', 2.4, 'Got it.', M.nod(d)],
   ['reading', 'Reading', 3.8, 'Reads 3 lines of today\'s chart.', M.reading(d)],
   ['idle', 'Idle', 8, 'The always-on resting loop.', M.idle(d)],
   ['brow', 'Skeptical', 2.8, 'One lens raised at the numbers.', M.brow(d)],
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
  [['peek', 'Over the Specs', 3.0, 'Slides down, blinks, pushes back up.', M.peek(s)],
   ['look', 'Look Around', 3.0, 'Right, then left.', M.look(s)],
   ['sideeye', 'Side-Eye', 3.0, 'A narrow glance right.', M.sideEye(s)],
   ['wide', 'Wide-Eyed', 2.6, 'Lenses open wider; an exclamation pops off the corner.', M.wide(s)],
   ['blink', 'Blink', 2.6, 'Double blink, to a line the weight of the frame.', M.blink(s)],
   ['wink', 'Wink', 2.4, 'Right lens only.', M.wink(s)],
   ['squint', 'Squint', 2.6, 'Shorter lenses, same weight.', M.squint(s)],
   ['hop', 'Hop Off', 3.4, 'The GIF launch rebuilt without squash: rock, kick, fly, land low, spring.', M.hop(s)],
   ['spin', 'Spin', 2.6, 'Lift, spin, drop.', M.spin(s)],
   ['nod', 'Nod', 2.4, 'Got it.', M.nod(s)],
   ['brow', 'Skeptical', 2.8, 'One lens raised.', M.brow(s)],
   ['reading', 'Reading', 3.8, 'Reads 3 lines of a breakdown.', M.reading(s)],
   ['idle', 'Idle', 8, 'The always-on resting loop.', M.idle(s)],
   ['sleepy', 'Sleepy', 4.4, 'Dozes, then a ping wakes it.', M.sleepy(s)],
   ['doubletake', 'Double Take', 2.6, 'Away, then back wide-eyed.', M.doubleTake(s)],
   ['eyeroll', 'Eye Roll', 2.8, 'A loop and a sigh.', M.eyeRoll(s)],
   ['dots15', 'Dots to Specs · 1.5×', 4.0, 'Typing dots in the face become the glasses.', M.dotsToSpecs(s, 1.5)],
   ['dots20', 'Dots to Specs · 2×', 4.0, 'Dots 2 line-weights wide.', M.dotsToSpecs(s, 2)],
   ['thinking', 'Thinking', 3.2, 'Thought bubbles in the logo\'s stroke.', M.thinking(s)],
   ['laugh', 'Ha Ha', 2.4, 'Shake, squint, bounce.', M.laugh(s)],
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

// design/beehiiv-post-style/qc-mark-player.js
// Live, vector quicker.chat mark for the nav pill on strategybreakdowns.com.
// It draws the logo-lab engine's own Dots to Specs pose into an inline <svg> every frame, so the mark is
// as sharp as the text beside it at any zoom (the PNG sprite it replaces was a bitmap, soft next to text).
//   hover:   the glasses turn into 3 dots, which wave for as long as the pill is hovered
//   leave:   the dots finish the wave they are on, then pop back into the glasses
//   phones:  one short wave each time the menu opens
// Bundled after engine.js and motions.js by build-player.mjs. If it never loads, the sprite in
// site-style.css stays as the fallback.
(function () {
  var LE = window.LogoEngine, LM = window.LogoMotions;
  if (!LE || !LM || !LM.dotsPose || window.__qcMarkLive) return;
  window.__qcMarkLive = true;

  var SEL = 'a[screen][href*="quicker.chat"]', VB = '-28 -40 500 500';
  var D = 2, AMP = 14 + D * LE.SW * .35, F = 1.3, IN = .45, OUT = .9;
  var E = LM.E, clamp = function (v) { return Math.max(0, Math.min(1, v)); };
  var still = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  function draw(st) {
    var tau = st.tau, s = st.shrink;
    var wv = function (i) { return st.phase === 'wave' ? AMP * Math.max(0, Math.sin(2 * Math.PI * (F * tau - .17 * i))) : 0; };
    st.svg.innerHTML = LE.frame(LM.dotsPose('qc', D, s, st.arm, wv));
  }

  function step(st, now) {
    var dt = st.last ? Math.min(.05, (now - st.last) / 1000) : 0;
    st.last = now;
    if (st.phase === 'in') {
      st.u = Math.min(1, st.u + dt / IN);
      st.shrink = E.in(st.u);
      st.arm = 1 - E.in(clamp(st.u * 1.25));
      if (st.u >= 1) { st.phase = 'wave'; st.tau = 0; }
    } else if (st.phase === 'wave') {
      st.tau += dt;
      if (!st.hover && st.outAt != null && st.tau >= st.outAt) { st.phase = 'out'; st.u = 0; st.tau = 0; st.outAt = null; }
    } else if (st.phase === 'out') {
      st.u = Math.min(1, st.u + dt / OUT);
      st.shrink = 1 - E.back(clamp(st.u / .6)); // overshoots a little: the glasses pop back
      st.arm = E.out(clamp((st.u - .5) / .5));
      if (st.u >= 1) { st.phase = 'rest'; st.shrink = 0; st.arm = 1; }
    }
    draw(st);
    if (st.phase !== 'rest') st.raf = requestAnimationFrame(function (t) { step(st, t); });
    else { st.raf = 0; st.last = 0; }
  }

  function kick(st) { if (!st.raf && !still) { st.last = 0; st.raf = requestAnimationFrame(function (t) { step(st, t); }); } }

  function setHover(a, on) {
    var st = a.__qc; if (!st) return;
    st.hover = on;
    if (on) {
      st.outAt = null;
      if (st.phase === 'rest') { st.phase = 'in'; st.u = 0; }
      else if (st.phase === 'out') { st.phase = 'in'; st.u = Math.cbrt(clamp(st.shrink)); }
    } else if (st.phase === 'wave') {
      st.outAt = Math.ceil(st.tau * F - 1e-6) / F; // finish this wave: every dot is down at a whole number of waves
    } else if (st.phase === 'in') {
      st.outAt = 1 / F; // let the dots form, wave once, then go back
    }
    kick(st);
  }

  function attach(a) {
    if (a.__qc) { if (!a.contains(a.__qc.svg)) a.insertBefore(a.__qc.svg, a.firstChild); a.classList.add('qc-live'); return; }
    var svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svg.setAttribute('viewBox', VB);
    svg.setAttribute('class', 'qc-mark-live');
    svg.setAttribute('aria-hidden', 'true');
    a.insertBefore(svg, a.firstChild);
    a.classList.add('qc-live');
    a.__qc = { svg: svg, phase: 'rest', shrink: 0, arm: 1, tau: 0, u: 0, hover: false, raf: 0, last: 0, outAt: null };
    draw(a.__qc);
  }

  var queued = false;
  function scan() { queued = false; document.querySelectorAll(SEL).forEach(attach); }
  scan();
  new MutationObserver(function () { if (!queued) { queued = true; requestAnimationFrame(scan); } })
    .observe(document.body, { childList: true, subtree: true });

  var pill = function (e) { return e.target && e.target.closest ? e.target.closest(SEL) : null; };
  document.addEventListener('mouseover', function (e) { var a = pill(e); if (a) setHover(a, true); });
  document.addEventListener('mouseout', function (e) {
    var a = pill(e); if (!a || (e.relatedTarget && a.contains(e.relatedTarget))) return;
    setHover(a, false);
  });
  // phones have no hover: a short wave each time the menu opens
  document.addEventListener('click', function () {
    setTimeout(function () {
      var m = document.querySelector('a[screen="mobile"]' + SEL.slice(1));
      if (m && m.offsetParent && m.getBoundingClientRect().top < window.innerHeight && m.__qc && m.__qc.phase === 'rest') {
        setHover(m, true);
        setTimeout(function () { setHover(m, false); }, 1200);
      }
    }, 350);
  });
})();
