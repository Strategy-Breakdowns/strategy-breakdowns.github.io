(function(){const n=a=>String(a??"").replace(/[&<>"]/g,e=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"})[e]),d=()=>document.getElementById("radarRoot"),v={"Tech Breakdown":"tech",Framework:"framework","News Recap":"news",Listicle:"listicle","One-liner":"oneliner","Internet Gem":"gem"};let i=!1,l=!1,o=!1,u=null,c=[],p=null;const h=a=>a>=1e4?`${Math.round(a/1e3)}k`:a>=1e3?`${(a/1e3).toFixed(1).replace(/\.0$/,"")}k`:String(a||0);function k(a){return a==null?"":a<=0?"today":`${a}d ago`}const S=()=>new Date().toISOString().slice(0,10);function y(a,e){const r=Date.parse(a+"T12:00:00Z");if(Number.isNaN(r))return a;const t=Math.round((Date.parse(S()+"T12:00:00Z")-r)/864e5);return t===0?"Today":t===1?"Yesterday":new Date(r).toLocaleDateString("en-GB",e?{weekday:"long",day:"numeric",month:"long"}:{weekday:"short",day:"numeric",month:"short"})}const T=a=>a?`https://www.google.com/s2/favicons?domain=${encodeURIComponent(a)}&sz=64`:"",L=a=>{try{return new URL(a).hostname.replace(/^www\./,"")}catch{return""}};function M(a){const e=a.post_type||"Internet Gem",r=v[e]||"gem",t=a.domain||L(a.url),s=T(t),b=`<span class="radar-ph">${s?`<img src="${n(s)}" alt="" loading="lazy">`:""}<b>${n(t||a.source_label||"")}</b></span>`,N=a.image?`<span class="radar-media"><img src="${n(a.image)}" alt="" loading="lazy" referrerpolicy="no-referrer" onerror="this.parentNode.classList.add('no-img');this.remove()">${b}</span>`:`<span class="radar-media no-img">${b}</span>`,w=a.url?"a":"div",_=a.url?` href="${n(a.url)}" target="_blank" rel="noopener noreferrer"`:"";return`
      <${w} class="radar-card"${_} title="Open on ${n(t||a.source_label||"the source")}">
        ${N}
        <span class="radar-body">
          <span class="radar-by">${s?`<img src="${n(s)}" alt="" loading="lazy">`:""}<span>${n(t||a.source_label||"")}</span><span class="radar-dot">\xB7</span><span>${n(a.source_label||"")} ${n(k(a.age_days))}</span></span>
          <span class="radar-title">${n(a.title)}</span>
          <span class="radar-foot">
            <span class="radar-signal"><span title="Upvotes">\u25B2 ${h(a.upvotes)}</span><span title="Comments">\u{1F4AC} ${h(a.comments)}</span></span>
            <span class="radar-badge radar-badge-${r}">${n(e)}</span>
          </span>
        </span>
      </${w}>`}function R(a){const e=a.items||[],r=e.length?`<div class="radar-grid">${e.map(M).join("")}</div>`:'<p class="radar-dim radar-day-empty">Nothing cleared the filter that day.</p>';return`<section class="radar-day" data-day="${n(a.date)}">
      <h3 class="radar-day-h"><span>${n(y(a.date,!0))}</span><small>${e.length} ${e.length===1?"idea":"ideas"}</small></h3>
      ${r}
    </section>`}function f(){const a=c.map(e=>`<button type="button" class="radar-chip" data-jump="${n(e)}">${n(y(e))}</button>`).join("");return`
      <header class="radar-top">
        <div>
          <h2 class="radar-h">Radar of the Day</h2>
          <p class="radar-sub">What business and startup land is engaging with right now, ranked by real upvotes and comments. Pick one, then spin it up with <code>/hook</code> + <code>/social</code>.</p>
        </div>
        <div class="radar-when"><span>Rebuilt every morning</span><span class="radar-cost">zero tokens \xB7 Reddit + HN</span></div>
      </header>
      ${c.length>1?`<nav class="radar-days" aria-label="Jump to a day">${a}</nav>`:""}`}async function m(a,e){const r=new URLSearchParams({limit:String(e||2)});a&&r.set("before",a);const t=await fetch("/api/radar/archive?"+r),s=await t.json().catch(()=>({}));if(!t.ok)throw new Error(s.error||`HTTP ${t.status}`);return s}function g(a){const e=d()?.querySelector(".radar-feed");if(!e)return;e.insertAdjacentHTML("beforeend",a.map(R).join("")),a.length&&(u=a[a.length-1].date);const r=d().querySelector(".radar-end");r&&(r.innerHTML=o?"<sb-loading compact>Loading the day before\u2026</sb-loading>":`<span class="radar-dim">That's every day kept (${c.length}). The radar keeps 30 days.</span>`)}async function $(){if(!(l||!o)){l=!0;try{const a=await m(u,2);o=!!a.more,g(a.days||[])}catch(a){o=!1;const e=d()?.querySelector(".radar-end");e&&(e.innerHTML=`<span class="radar-dim">Couldn't load earlier days: ${n(a.message)}</span>`)}finally{l=!1}}}async function q(a){let e=d().querySelector(`.radar-day[data-day="${CSS.escape(a)}"]`);for(;!e&&o;)await $(),e=d().querySelector(`.radar-day[data-day="${CSS.escape(a)}"]`);e?.scrollIntoView({behavior:matchMedia("(prefers-reduced-motion: reduce)").matches?"auto":"smooth",block:"start"})}function H(a){const e=d();e&&(e.innerHTML=`
      <header class="radar-top"><div><h2 class="radar-h">Radar of the Day</h2></div></header>
      <div class="radar-empty">
        <p>Couldn't load the radar.</p>
        <p class="radar-dim">${n(a)}</p>
        <p class="radar-dim">It is built daily by the pipeline-data-refresh Action (<code>scripts/radar/build_radar_daily.py</code>).</p>
      </div>`)}async function I(a){const e=d();if(e&&!(i&&!a)){e.innerHTML="<sb-loading>Loading the radar: Reddit and Hacker News, ranked this morning\u2026</sb-loading>";try{const r=await m(null,2);if(c=r.dates||[],o=!!r.more,!(r.days||[]).length){e.innerHTML=f()+`
          <div class="radar-empty">
            <p>No days in the radar yet.</p>
            <p class="radar-dim">The queue rebuilds daily from the pipeline-data-refresh Action. Check back tomorrow, or run <code>/radar</code> live for a fresh sweep.</p>
          </div>`,i=!0;return}e.innerHTML=f()+'<div class="radar-feed"></div><div class="radar-end"></div>',g(r.days),e.querySelectorAll("[data-jump]").forEach(t=>t.addEventListener("click",()=>q(t.dataset.jump))),p?.disconnect(),p=new IntersectionObserver(t=>{t.some(s=>s.isIntersecting)&&$()},{rootMargin:"600px 0px"}),p.observe(e.querySelector(".radar-end")),i=!0}catch(r){H(r.message||String(r))}}}window.Radar={show:I}})();
