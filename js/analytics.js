Backend.incidents().then(all=>{
  const cutoff=Date.now()-30*864e5;
  const x=all.filter(i=>new Date(i.created).getTime()>=cutoff);
  const resolved=x.filter(i=>i.status==="Resuelta");
  const hours=resolved.map(i=>{
    const h=Array.isArray(i.history)?i.history:Object.values(i.history||{});
    const e=h.filter(z=>String(z.action||"").includes("resuelta")).slice(-1)[0];
    return e?(new Date(e.at)-new Date(i.created))/36e5:null;
  }).filter(v=>v!=null&&v>=0);
  const avg=hours.length?hours.reduce((a,b)=>a+b,0)/hours.length:null;
  kpis.innerHTML=[
    ["Recibidas",x.length],["Resueltas",resolved.length],
    ["Tasa de resolución",x.length?Math.round(resolved.length/x.length*100)+"%":"—"],
    ["Tiempo medio",avg==null?"—":avg<24?Math.round(avg)+" h":(avg/24).toFixed(1)+" d"]
  ].map(([a,b])=>`<div class="stat"><strong>${b}</strong><span>${a}</span></div>`).join("");
  bars(by_cat,count(x,"category")); bars(by_status,count(x,"status"));
  resolution.innerHTML=hours.length
    ?`<p><strong>${avg<24?Math.round(avg)+" horas":(avg/24).toFixed(1)+" días"}</strong> de media en ${hours.length} incidencias con historial de resolución.</p>`
    :"<p class='muted'>Aún no hay suficientes resoluciones con historial para calcular este indicador.</p>";
  function count(a,k){return Object.entries(a.reduce((o,i)=>{o[i[k]]=(o[i[k]]||0)+1;return o},{})).sort((a,b)=>b[1]-a[1])}
  function bars(el,rows){const max=Math.max(1,...rows.map(x=>x[1]));el.innerHTML=rows.map(([n,v])=>`<div class="metric-row"><span>${App.esc(n)}</span><div><i style="width:${v/max*100}%"></i></div><strong>${v}</strong></div>`).join("")||"<p class='muted'>Sin datos.</p>"}
});