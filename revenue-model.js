(function(){const S=4.333333333333333,U=["Mon","Tue","Wed","Thu","Fri","Sat","Sun"],f=[2,6],O=[0,1,3,4,5,6];let d=null,u=null,t=null,m=[],A=!1;const n=e=>document.getElementById(e),L=e=>String(e).replace(/[&<>"]/g,s=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"})[s]),h=e=>(e<0?"-$":"$")+Math.round(Math.abs(e)).toLocaleString("en-US"),v=e=>"$"+(Math.abs(e)>=1e6?(e/1e6).toFixed(2)+"m":(e/1e3).toFixed(e>=1e5?0:1)+"k"),T=e=>new Date(e+"-15T12:00:00Z").toLocaleString("en-GB",{month:"short",timeZone:"UTC"}),E=(e,s)=>Math.abs(e-s)<.01,w={core:"var(--gb-2)",sb:"var(--gb-1)",li:"var(--gb-5)",daily:"var(--gb-3)",add:"var(--gb-4)"},H={core:"Weekly ads",sb:"Breakdowns",li:"LinkedIn",daily:"Daily",add:"Add-ons"},D=e=>`<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${e}</svg>`,W={core:D('<rect x="2" y="4" width="20" height="16" rx="2"/><path d="m22 7-8.97 5.7a2 2 0 0 1-2.06 0L2 7"/>'),sb:D('<path d="M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7z"/><path d="M14 2v4a2 2 0 0 0 2 2h4M10 9H8M16 13H8M16 17H8"/>'),li:D('<path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-4 0v7h-4v-7a6 6 0 0 1 6-6z"/><rect x="2" y="9" width="4" height="12"/><circle cx="4" cy="4" r="2"/>'),daily:D('<circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M6.3 17.7l-1.4 1.4M19.1 4.9l-1.4 1.4"/>'),add:D('<path d="M12 5v14M5 12h14"/>')},q=[[0,"None"],[1,"Monthly"],[1.444,"Every 3 wks"],[2.167,"Every 2 wks"]],j=[[0,"None"],[1,"Monthly"],[2.167,"Every 2 wks"],[4.333,"Weekly"]],z=[[0,"No Daily"],[1,"1 sponsor"],[2,"2 sponsors"]],I=e=>e.adSingle*(1-e.bundle/100)+e.adBundle*(e.bundle/100);function R(e){const s=I(e)*(1-e.dAd/100),a=f.length*2*S*(e.coreFill/100)*s,o=e.sbN*e.sbPrice*(1-e.dSb/100),l=e.liN*e.liPrice*(1-e.dLi/100),i=(e.founding?d.card.dailyFounding:e.dPrice)*(1-e.dDaily/100),p=e.dSponsors*S*(e.dFill/100)*i,c=e.addOn;return{parts:{core:a,sb:o,li:l,daily:p,add:c},total:a+o+l+p+c,perDailyWeek:i,perAd:s,perSb:e.sbPrice*(1-e.dSb/100)}}const B=(e,s)=>`<div class="rc-seg" data-seg="${e}">${s.map(([a,o])=>`<button type="button" data-v="${a}">${o}</button>`).join("")}</div>`,F=(e,s,a)=>`
    <section class="rc-card" id="rcCard-${e}" style="--c:${w[e]}">
      <header><span class="rc-ic">${W[e]}</span><b>${s}</b><span class="rc-amt" id="rcAmt-${e}"></span></header>
      ${a}
    </section>`;function Z(){return`
    <div class="rc">
      <div class="rc-scen">
        <span class="rc-scen-l">Scenario</span>
        <div class="rc-scen-btns" id="rcPresets"></div>
        <span class="rc-custom" id="rcCustom"></span>
        <button type="button" class="rc-ghost" id="rcReset">Reset</button>
      </div>

      <div class="rc-hero">
        <div class="rc-answer">
          <div class="rc-big"><span id="rcTotal">$0</span><small>a month</small></div>
          <p class="rc-sentence" id="rcSentence"></p>
          <p class="rc-gap" id="rcGap"></p>
        </div>
        <div class="rc-facts">
          <div><b id="rcAnnual"></b><span>a year at this rate</span></div>
          <div><b id="rcVsBase"></b><span id="rcVsBaseL"></span></div>
        </div>
        <div class="rc-mix">
          <div class="rc-bar" id="rcBar"></div>
          <div class="rc-scale" id="rcScale"></div>
        </div>
      </div>

      <div class="rc-main">
        <section class="rc-week">
          <header><b>What a week looks like</b><span>x 4.33 weeks = 1 month</span></header>
          <div class="rc-strip" id="rcStrip"></div>
          <div class="rc-key">
            <span><i class="rc-k-sq"></i>Weekly ad slot</span>
            <span><i class="rc-k-dot"></i>Daily sponsor slot</span>
            <span><i class="rc-k-fill"></i>Coloured part = how often it sells</span>
          </div>
          <p class="rc-weeksum" id="rcWeekSum"></p>
        </section>

        <div class="rc-cards">
          ${F("core","Weekly ads",`
            <label class="rc-lbl" for="rcFill">Slots sold <output id="rcFillO"></output></label>
            <input type="range" id="rcFill" min="0" max="100" step="1" data-k="coreFill">
            <label class="rc-lbl" for="rcBundle">Sold in 4-packs <output id="rcBundleO"></output></label>
            <input type="range" id="rcBundle" min="0" max="100" step="5" data-k="bundle">
            <p class="rc-sub" id="rcCoreSub"></p>`)}
          ${F("sb","Sponsored Breakdowns",`
            <span class="rc-lbl">How often</span>${B("sbN",q)}
            <p class="rc-sub" id="rcSbSub"></p>`)}
          ${F("li","LinkedIn posts",`
            <span class="rc-lbl">How often</span>${B("liN",j)}
            <p class="rc-sub" id="rcLiSub"></p>`)}
          ${F("daily","The Daily",`
            <span class="rc-lbl">Sponsors in every Daily</span>${B("dSponsors",z)}
            <div class="rc-dailyfill" id="rcDailyFill">
              <label class="rc-lbl" for="rcDFill">Weeks sold <output id="rcDFillO"></output></label>
              <input type="range" id="rcDFill" min="0" max="100" step="1" data-k="dFill">
              <label class="rc-check" id="rcFoundingL"><input type="checkbox" id="rcFounding"> Founding rate</label>
            </div>
            <p class="rc-sub" id="rcDailySub"></p>`)}
        </div>
      </div>

      <div class="rc-foot">
        <div class="rc-addon" style="--c:${w.add}">
          <span class="rc-ic">${W.add}</span><b>Add-ons</b>
          <button type="button" class="rc-step" data-step="-1000" aria-label="Less">-</button>
          <output id="rcAddO"></output>
          <button type="button" class="rc-step" data-step="1000" aria-label="More">+</button>
          <span class="rc-dim">retargeting, X posts, reruns a month</span>
        </div>
        <div class="rc-pops">
          <button type="button" class="rc-ghost" data-pop="rcAdv">Prices, discount and target</button>
          <button type="button" class="rc-ghost" data-pop="rcHow">How this is worked out</button>
        </div>
        <div class="rc-pop" id="rcAdv" hidden>
          <div class="rc-pop-h"><b>Prices, discount and target</b><button type="button" class="rc-x" data-close>\xD7</button></div>
          <div class="rc-cardsw"><span>Rate card</span><div class="rc-seg" id="rcCardSw"><button type="button" data-card="old">Before 1 Oct</button><button type="button" data-card="new">Current</button></div></div>
          <div class="rc-prices">
            <label>Weekly ad, single<input type="number" step="100" data-k="adSingle"></label>
            <label>Weekly ad, in a 4-pack<input type="number" step="100" data-k="adBundle"></label>
            <label>Breakdown<input type="number" step="500" data-k="sbPrice"></label>
            <label>LinkedIn post<input type="number" step="100" data-k="liPrice"></label>
            <label>Daily, a week<input type="number" step="250" data-k="dPrice"></label>
          </div>
          <label class="rc-lbl" for="rcDisc">Discount off card, everything <output id="rcDiscO"></output></label>
          <input type="range" id="rcDisc" min="0" max="40" step="1">
          <p class="rc-sub" id="rcDiscSub"></p>
          <label class="rc-targetin">Monthly target<input type="number" step="5000" data-k="target"></label>
        </div>
        <div class="rc-pop" id="rcHow" hidden>
          <div class="rc-pop-h"><b>How this is worked out</b><button type="button" class="rc-x" data-close>\xD7</button></div>
          <ul class="rc-how" id="rcHowList"></ul>
        </div>
      </div>
    </div>`}function K(e){d=e;const s=d.baseline,a=d.card,o=c=>Math.round((c||0)*100),l=o(s.fill.rate);u={target:1e5,card:"new",coreFill:l,adSingle:a.adSingle,adBundle:a.adBundle,bundle:0,dAd:o(s.discount.ad),sbN:+s.perMonth.breakdowns.toFixed(3),sbPrice:a.breakdown,dSb:o(s.discount.breakdown),liN:+s.perMonth.linkedin.toFixed(3),liPrice:a.linkedin,dLi:o(s.discount.linkedin),addOn:Math.round(s.perMonth.addons/1e3)*1e3,dSponsors:0,dFill:l,dPrice:a.dailyWeek,dDaily:o(s.discount.stack),founding:!1},d.span=`${T(s.months[0])}-${T(s.months[2])}`;const i={bundle:100,dAd:u.dAd,dSb:u.dSb,dLi:u.dLi,dDaily:u.dDaily},p={bundle:0,dAd:0,dSb:0,dLi:0,dDaily:0};m=[{name:`${d.span} pace`,sub:"what we sold, at the prices we got",o:{...i,coreFill:l,sbN:u.sbN,liN:u.liN,dSponsors:0}},{name:"Weekly sold out",sub:"every ad at full price, Breakdown monthly",o:{...p,coreFill:100,sbN:1,liN:2.167,dSponsors:0}},{name:"Sold out + 1 Daily sponsor",sub:`Daily sells ${l}% of weeks, full price`,o:{...p,coreFill:100,sbN:1,liN:2.167,dSponsors:1,dFill:l}},{name:"Everything sold",sub:"2 Daily sponsors every week, full price",o:{...p,coreFill:100,sbN:2.167,liN:2.167,dSponsors:2,dFill:100}}],t={...u,...m[0].o},n("rmRoot").innerHTML=Z(),n("rcPresets").innerHTML=m.map((c,y)=>`<button type="button" class="rc-preset" data-p="${y}"><b>${L(c.name)}</b><small>${L(c.sub)}</small></button>`).join(""),n("rcVsBaseL").textContent=`vs ${d.span} actual (${v(s.revenue/3)} a month)`,n("rcFoundingL").title=`$${a.dailyFounding.toLocaleString()} a week for the first 5 sponsors, instead of $${a.dailyWeek.toLocaleString()}`,n("rcFoundingL").append(` ($${a.dailyFounding.toLocaleString()}, first 5)`),n("rcDiscSub").textContent=`${d.span} collected ${o(s.discount.stack)}% below the card on average (ads ${u.dAd}%, Breakdowns ${u.dSb}%, LinkedIn ${u.dLi}%). Moving this sets all 4 at once.`,te(),X(),k()}function X(){const e=n("rmRoot");e.querySelectorAll("input[type=range][data-k]").forEach(s=>s.addEventListener("input",()=>{t[s.dataset.k]=+s.value,k()})),n("rcDisc").addEventListener("input",s=>{const a=+s.target.value;t.dAd=t.dSb=t.dLi=t.dDaily=a,k()}),e.querySelectorAll(".rc-pop input[type=number][data-k]").forEach(s=>s.addEventListener("input",()=>{const a=+s.value;a>0&&(t[s.dataset.k]=a,k(!0))})),n("rcFounding").addEventListener("change",s=>{t.founding=s.target.checked,k()}),e.querySelectorAll("[data-seg]").forEach(s=>s.addEventListener("click",a=>{const o=a.target.closest("[data-v]");o&&(t[s.dataset.seg]=+o.dataset.v,k())})),n("rcCardSw").addEventListener("click",s=>{const a=s.target.closest("[data-card]");if(!a)return;const o=a.dataset.card==="old"?d.previousCard:d.card;t.adSingle=o.adSingle,t.adBundle=o.adBundle,t.sbPrice=o.breakdown,t.liPrice=o.linkedin,k()}),n("rcPresets").addEventListener("click",s=>{const a=s.target.closest("[data-p]");a&&(t={...t,...m[+a.dataset.p].o},k())}),n("rcReset").addEventListener("click",()=>{t={...u,...m[0].o},k()}),e.querySelectorAll("[data-step]").forEach(s=>s.addEventListener("click",()=>{t.addOn=Math.max(0,t.addOn+ +s.dataset.step),k()})),e.querySelectorAll("[data-pop]").forEach(s=>s.addEventListener("click",a=>{a.stopPropagation();const o=n(s.dataset.pop),l=o.hidden;e.querySelectorAll(".rc-pop").forEach(i=>{i.hidden=!0}),o.hidden=!l})),e.querySelectorAll("[data-close]").forEach(s=>s.addEventListener("click",()=>{s.closest(".rc-pop").hidden=!0})),document.addEventListener("click",s=>{s.target.closest(".rc-pop, [data-pop]")||e.querySelectorAll(".rc-pop").forEach(a=>{a.hidden=!0})}),document.addEventListener("keydown",s=>{s.key==="Escape"&&e.querySelectorAll(".rc-pop").forEach(a=>{a.hidden=!0})}),n("rcSentence").addEventListener("click",s=>{const a=s.target.closest("[data-card]");if(!a)return;const o=n("rcCard-"+a.dataset.card);o&&(o.classList.remove("rc-flash"),o.offsetWidth,o.classList.add("rc-flash"),o.querySelector("input, button")?.focus({preventScroll:!0}))})}const x={Monthly:"a month","Every 3 wks":"every 3 weeks","Every 2 wks":"every 2 weeks",Weekly:"every week"},V=(e,s)=>(e.find(([a])=>E(a,s))||[null,null])[1];function J(e){n("rcFill").value=t.coreFill,n("rcFillO").textContent=t.coreFill+"%",n("rcBundle").value=t.bundle,n("rcBundleO").textContent=t.bundle?`${t.bundle}%, ${h(I(t))} list`:`none, ${h(t.adSingle)} each`,n("rcDFill").value=t.dFill,n("rcDFillO").textContent=t.dFill+"%",n("rcFounding").checked=t.founding,n("rcDailyFill").classList.toggle("rc-off",!t.dSponsors);const s=Math.round((t.dAd+t.dSb+t.dLi+t.dDaily)/4);n("rcDisc").value=s,n("rcDiscO").textContent=s+"%",n("rcAddO").textContent=v(t.addOn),e||document.querySelectorAll("#rmRoot .rc-pop input[type=number][data-k]").forEach(l=>{l.value=t[l.dataset.k]}),document.querySelectorAll("#rmRoot [data-seg]").forEach(l=>l.querySelectorAll("[data-v]").forEach(i=>i.classList.toggle("on",E(+i.dataset.v,t[l.dataset.seg]))));const a=l=>l&&t.adSingle===l.adSingle&&t.adBundle===l.adBundle&&t.sbPrice===l.breakdown&&t.liPrice===l.linkedin;document.querySelectorAll("#rcCardSw [data-card]").forEach(l=>l.classList.toggle("on",a(l.dataset.card==="old"?d.previousCard:d.card)));let o=-1;m.forEach((l,i)=>{o<0&&Object.entries(l.o).every(([p,c])=>E(t[p],c))&&(o=i)}),document.querySelectorAll("#rcPresets [data-p]").forEach(l=>l.classList.toggle("on",+l.dataset.p===o)),n("rcCustom").textContent=o<0?"Custom":""}function Q(){const e=R(t),s=t.target,a=e.total-s,o=e.parts;n("rcTotal").textContent=h(e.total),n("rcAnnual").textContent=v(e.total*12);const l=(e.total/(d.baseline.revenue/3)-1)*100;n("rcVsBase").textContent=(l>=0?"+":"")+l.toFixed(0)+"%",n("rcVsBase").className=l>=0?"rc-up":"rc-down";const i=(r,b)=>`<b data-card="${r}" style="--c:${w[r]}">${b}</b>`,p=V(q,t.sbN),c=V(j,t.liN),y=[i("core",`weekly ads ${t.coreFill}% sold`),i("sb",t.sbN?`${x[p]?"a Breakdown "+x[p]:t.sbN.toFixed(1)+" Breakdowns a month"}`:"no Breakdowns"),i("li",t.liN?`${x[c]?"a LinkedIn post "+x[c]:t.liN.toFixed(1)+" LinkedIn posts a month"}`:"no LinkedIn"),i("daily",t.dSponsors?`${t.dSponsors} Daily sponsor${t.dSponsors>1?"s":""}, ${t.dFill}% of weeks`:"no Daily")],g=t.dAd||t.dSb||t.dLi||t.dDaily,C=t.bundle===100&&g?"at the prices we actually got":!t.bundle&&!g?"at full card price":`at ${t.bundle?t.bundle+"% of ads in 4-packs":"full ad price"}${g?", less discount":""}`;if(n("rcSentence").innerHTML=`Sponsorship only, ${C}: ${y.join(", ")}, plus ${v(t.addOn)} of add-ons.`,a>=0)n("rcGap").innerHTML=`<span class="rc-good">Clears the ${v(s)} target by ${h(a)}</span>`;else{const r=-a,b=[],M=f.length*2*S*(1-t.coreFill/100),P=(Y,ae,ne)=>`${Y} more ${Y===1?ae:ne}`;e.perAd&&r/e.perAd<=M&&b.push(P(Math.ceil(r/e.perAd),"weekly ad","weekly ads")),e.perSb&&b.push(P(Math.ceil(r/e.perSb),"Breakdown","Breakdowns")),e.perDailyWeek&&b.push(P(Math.ceil(r/e.perDailyWeek),"Daily sponsor week","Daily sponsor weeks")),n("rcGap").innerHTML=`<span class="rc-warn">${h(r)} short of ${v(s)}</span> ${b.length?`<span class="rc-dim">Any 1 of these closes it: ${b.join(", or ")} a month.</span>`:""}`}const $=Math.max(e.total,s)*1.06;n("rcBar").innerHTML=Object.entries(o).filter(([,r])=>r>0).map(([r,b])=>{const M=b/$*100;return`<div style="width:${M}%;background:${w[r]}" title="${H[r]}: ${h(b)}">${M>9?`<span>${H[r]} ${v(b)}</span>`:""}</div>`}).join("")+`<div class="rc-target" style="left:${s/$*100}%"><span>Target ${v(s)}</span></div>`;const N=$>3e5?1e5:$>16e4?5e4:25e3,_=[];for(let r=0;r<=$;r+=N)_.push(r);n("rcScale").innerHTML=_.map(r=>`<span style="left:${r/$*100}%">${r?"$"+r/1e3+"k":"$0"}</span>`).join("");for(const r of Object.keys(o)){const b=n("rcAmt-"+r);b&&(b.textContent=v(o[r]))}const G=f.length*2*S;n("rcCoreSub").textContent=`${(G*t.coreFill/100).toFixed(1)} of ${G.toFixed(1)} slots a month at ${h(e.perAd)} each. ${d.span}: ${Math.round(d.baseline.fill.rate*100)}%.`,n("rcSbSub").textContent=`${t.sbN.toFixed(1)} a month at ${h(e.perSb)}. ${d.span}: ${u.sbN.toFixed(1)} a month.`,n("rcLiSub").textContent=`${t.liN.toFixed(1)} a month at ${h(t.liPrice*(1-t.dLi/100))}. ${d.span}: ${u.liN.toFixed(1)} a month.`,n("rcDailySub").textContent=t.dSponsors?`${h(e.perDailyWeek)} a sponsor a week, ${(S*t.dFill/100*t.dSponsors).toFixed(1)} sponsor-weeks a month.`:"Add a sponsor to see what the Daily adds."}function ee(){const e=t.coreFill,s=t.dFill,a=(i,p,c,y)=>`<span class="rc-slot ${i}" title="${L(y)}" style="--p:${p}%;--c:${c}"><i></i></span>`,o=R(t);n("rcStrip").innerHTML=U.map((i,p)=>{const c=f.includes(p),y=O.includes(p);let g="",C=c&&y?"Both":c?"Weekly":y?"Daily":"";return c&&(g+=[1,2].map($=>a("rc-sq",e,w.core,`${i}, weekly edition, ad slot ${$}: sold ${e}% of the time, ${h(o.perAd)} each`)).join("")),y&&(g+=t.dSponsors?Array.from({length:t.dSponsors},($,N)=>a("rc-dot",s,w.daily,`${i}, Daily, sponsor ${N+1}: sold ${s}% of weeks (the sponsor buys every Daily that week)`)).join(""):'<span class="rc-slot rc-dot rc-empty" title="No Daily sponsor in this scenario"><i></i></span>'),`<div class="rc-day${c?" wk":""}${y?" dl":""}"><span class="rc-dname">${i}</span><span class="rc-tag">${C}</span><div class="rc-slots">${g}</div></div>`}).join("");const l=(f.length*2*e/100).toFixed(1);n("rcWeekSum").innerHTML=`In an average week: <b>${l} of ${f.length*2}</b> weekly ad slots sold`+(t.dSponsors?`, and <b>${(t.dSponsors*s/100).toFixed(1)}</b> Daily sponsor${t.dSponsors>1?"s":""} across ${O.length} Daily sends`:"")+`. That week is worth <b>${v(o.total/S)}</b>.`}function te(){const e=d.baseline,s=[`Weekly ads = ${f.length} editions x 2 slots x 4.33 weeks x slots sold x price, less discount. A month is 52 / 12 = 4.33 weeks.`,"Breakdowns and LinkedIn = how many a month x price, less discount.","Daily = sponsors in every Daily x 4.33 weeks x weeks sold x the weekly price, less discount. A Daily sponsor buys every Daily that week.",`Starting values come from ${d.span}, the last 3 complete months: confirmed deliverables only, the demo sponsor excluded. They roll forward on the 1st of each month. ${e.fill.sold} of ${e.fill.slots} weekly slots sold then.`,"Discount = what was collected / what the card listed on the day each deliverable ran.",'Prices come from the rate card in dashboard/revenue-model.js, copied from "Private Pricing, effective 1 October 2026" in Notion.',`Not included: Partner Program subscriptions billed through Stripe, and single Daily ads sold outside the weekly model (${d.dailySingles.length} on the books).`,`Data pulled ${new Date(d.pulled).toLocaleString("en-GB",{dateStyle:"medium",timeStyle:"short"})}.`];n("rcHowList").innerHTML=s.map(a=>`<li>${L(a)}</li>`).join("")}function k(e){J(e),Q(),ee()}async function se(){if(!(d||A)){A=!0;try{const s=await(await fetch("/api/revenue-model")).json();if(s.error)throw new Error(s.error);K(s)}catch(e){n("rmRoot").innerHTML=`<p class="section-hint" style="color:var(--stale)">Could not read Notion: ${L(e.message)}. The tab needs the Deliverables, Money-Mirror and Issues databases shared with the dashboard integration.</p>`}finally{A=!1}}}window.RevenueModel={show:se}})();
