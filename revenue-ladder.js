(function(){const s={data:null,loading:!1,open:{}},l=n=>document.getElementById(n),e=n=>String(n??"").replace(/[&<>"]/g,a=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"})[a]),i=n=>n?"$"+(n>=1e3?(Math.round(n/100)/10).toLocaleString("en-GB")+"k":Math.round(n)):"",r=8;async function p(){!s.data&&!s.loading&&await d(!1)}async function d(n){s.loading=!0,s.data||(l("rlRoot").innerHTML="<sb-loading>Loading the pipeline, renewals and inbound&hellip;</sb-loading>");try{const a=await(await fetch("/api/revenue-ladder"+(n?"?refresh=1":""))).json();if(a.error)throw new Error(a.error);s.data=a,c()}catch(a){l("rlRoot").innerHTML=`<p class="section-hint" style="color:var(--stale)">Could not load /api/revenue-ladder: ${e(a.message)}</p>`}finally{s.loading=!1}}function u(n,a){const t=typeof LOGOS<"u"?LOGOS.token:null;return n.domain&&t&&window.__monogram?`<img class="logo-img" src="https://img.logo.dev/${encodeURIComponent(n.domain)}?token=${encodeURIComponent(t)}&size=${a*3}&format=png" alt="" width="${a}" height="${a}" loading="lazy" crossorigin="anonymous" onload="window.__logoFit&&window.__logoFit(this)" onerror="this.outerHTML=window.__monogram(${e(JSON.stringify(n.company||n.name))},${a})">`:typeof sponsorLogo=="function"?sponsorLogo(n.company||n.name,a):""}function c(){const n=s.data,a=n.rungs.filter(o=>o.id!=="cold"),t=Math.max(1,...a.map(o=>o.value));l("rlRoot").innerHTML=`
      <div class="panel-header nl-head">
        <div>
          <h2>Revenue Ladder</h2>
          <p class="section-hint">Easiest money first: work it top to bottom. Each company sits on its highest rung only. From Attio, Notion and the media kit, updated ${new Date(n.fetched_at).toLocaleTimeString("en-GB",{hour:"2-digit",minute:"2-digit"})}. <button class="nl-link" id="rlRefresh">Refresh</button></p>
        </div>
      </div>
      ${n.errors?.length?`<p class="section-hint" style="color:var(--stale)">${n.errors.map(e).join("<br>")}</p>`:""}
      <div class="rl-ladder">${n.rungs.map(o=>`<a class="rl-step" href="#rl-${o.id}" data-id="${o.id}">
        <span class="rl-n">${o.n}</span>
        <span class="rl-step-name"><b>${e(o.name)}</b><span class="nl-dim">${e(o.action)}</span></span>
        <span class="rl-step-bar">${o.id==="cold"?"":`<span style="width:${100*o.value/t}%"></span>`}</span>
        <span class="rl-step-v">${o.value?i(o.value):""}</span>
        <span class="rl-step-c"><b>${o.count}</b>${o.ourMove&&o.id!=="cold"?`<span class="rl-our">${o.ourMove} our move</span>`:""}</span>
      </a>`).join("")}</div>
      ${n.rungs.map(h).join("")}`,l("rlRefresh").onclick=()=>d(!0),document.querySelectorAll("#rlRoot [data-more]").forEach(o=>o.onclick=()=>{s.open[o.dataset.more]=!s.open[o.dataset.more],c()}),document.querySelectorAll("#rlRoot .rl-step").forEach(o=>o.onclick=$=>{$.preventDefault(),l("rl-"+o.dataset.id)?.scrollIntoView({behavior:"smooth",block:"start"})})}function h(n){if(n.id==="cold")return`<div class="sub-block rl-sec" id="rl-cold"><h3 class="sub-h"><span class="rl-n">${n.n}</span>${e(n.name)} <span class="nl-dim">${n.count} deals</span></h3><p class="sub-note">${e(n.rule)} The hardest money, so it comes last.</p></div>`;const a=s.open[n.id]?n.rows:n.rows.slice(0,r);return`<div class="sub-block rl-sec" id="rl-${n.id}">
      <h3 class="sub-h"><span class="rl-n">${n.n}</span>${e(n.name)} <span class="nl-dim">${n.count}${n.value?" \xB7 "+i(n.value):""}</span></h3>
      <p class="sub-note">${e(n.rule)} <b>${e(n.action)}.</b></p>
      ${n.rows.length?`<div class="rl-rows">${a.map(m).join("")}</div>`:'<p class="sub-note">Nothing here right now.</p>'}
      ${n.rows.length>r?`<button class="nl-link" data-more="${n.id}">${s.open[n.id]?"Show fewer":`Show all ${n.rows.length}`}</button>`:""}
    </div>`}function m(n){const a=n.idle==null?"no activity logged":n.idle<=0?"active today":`${n.idle} day${n.idle===1?"":"s"} quiet`;return`<div class="rl-row">
      ${u(n,28)}
      <div class="rl-row-id"><b>${e(n.name)}</b><span class="nl-dim">${e([n.stage,a].filter(Boolean).join(" \xB7 "))}</span></div>
      <div class="rl-row-note">${n.ourMove?'<span class="rl-our">Our move</span> ':""}${e(n.note||"")}</div>
      <div class="rl-row-v">${i(n.value)}</div>
      <div class="lf-links">${n.slack?`<a class="lf-btn" href="${e(n.slack)}" target="_blank" rel="noopener">Slack</a>`:""}${n.url?`<a class="lf-btn lf-btn-main" href="${e(n.url)}" target="_blank" rel="noopener">Attio</a>`:""}</div>
    </div>`}window.RevenueLadder={show:p}})();
