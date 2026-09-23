let data=[];
today.textContent=new Intl.DateTimeFormat("es-ES",{weekday:"long",day:"numeric",month:"long"}).format(new Date());
const map=L.map("ops-map",{zoomControl:false}).setView([40.4168,-3.7038],13);
L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",{attribution:"&copy; OpenStreetMap"}).addTo(map);
let layer=L.layerGroup().addTo(map);
[search,filter_status,filter_priority].forEach(e=>e.oninput=draw);
Backend.subscribe(x=>{data=x;draw()});
function active(i){return !["Resuelta","Descartada","Duplicada"].includes(i.status)}
function draw(){
  const open=data.filter(active),critical=open.filter(i=>App.priority(i)>=80),unvalidated=open.filter(i=>i.status==="Reportada"),unassigned=open.filter(i=>["Validada","Asignada"].includes(i.status)&&!i.crew),progress=open.filter(i=>i.status==="En curso");
  kpi_strip.innerHTML=[["Atención inmediata",critical.length,"critical"],["Por validar",unvalidated.length,""],["Sin cuadrilla",unassigned.length,""],["En curso",progress.length,""]].map(([a,b,c])=>`<button class="kpi-v11 ${c}"><strong>${b}</strong><span>${a}</span></button>`).join("");
  const q=search.value.toLowerCase();
  let x=data.filter(i=>{
    const matchesText=!q||`${i.id} ${i.category} ${i.description}`.toLowerCase().includes(q);
    const matchesStatus=!filter_status.value||i.status===filter_status.value;
    return matchesText&&matchesStatus;
  });
  if(filter_priority.value)x=x.filter(i=>filter_priority.value==="critical"?App.priority(i)>=80:filter_priority.value==="high"?App.priority(i)>=60&&App.priority(i)<80:App.priority(i)<60);
  x.sort((a,b)=>(Number(active(b))-Number(active(a)))||(App.priority(b)-App.priority(a)));
  queue_count.textContent=`${x.length} incidencias`;
  ops_list.innerHTML=x.length?x.map(row).join(""):"<div class='empty-ops'>No hay incidencias con estos filtros.</div>";
  drawMap(x.filter(active));drawCrews(open);
  document.querySelectorAll(".quick-validate").forEach(b=>b.onclick=()=>quickValidate(b.dataset.id));
  document.querySelectorAll(".quick-assign").forEach(el=>el.onchange=()=>quickAssign(el.dataset.id,el.value));
}
function row(i){
  const p=App.priority(i),age=Math.max(0,Math.floor((Date.now()-new Date(i.created))/864e5));
  const reason=p>=80?"Prioridad crítica":i.status==="Reportada"?"Pendiente de validar":!i.crew&&active(i)?"Necesita asignación":i.status;
  const sla=Workflow.sla(i);
  return `<article class="ops-row ${p>=80?"is-critical":""}">
    <div class="score-v11"><strong>${p}</strong><span>/100</span></div>
    <div class="ops-main"><div class="ops-meta"><span class="status">${App.esc(i.status)}</span><span>#${App.esc(String(i.id))}</span><span>${age===0?"Hoy":`Hace ${age} d`}</span></div>
    <h3>${App.esc(i.category)}</h3><p>${App.esc(i.description)}</p>
    <div class="ops-signals"><span>👥 ${i.votes}</span>${i.address?`<span>📍 ${App.esc(i.address)}</span>`:""}<span>⚑ ${App.esc(reason)}</span><span>🗺 ${App.esc(Workflow.zone(i))}</span><span class="${sla.breached?"sla-breach":""}">⏱ ${sla.label}</span></div></div>
    <div class="ops-actions">${i.status==="Reportada"?`<button class="btn primary quick-validate" data-id="${i.id}">Validar</button>`:""}${active(i)?`<select class="quick-assign" data-id="${i.id}"><option value="">${i.crew?App.esc(i.crew):"Asignar cuadrilla…"}</option>${App.crews.filter(c=>c.name!==i.crew).map(c=>`<option>${App.esc(c.name)}</option>`).join("")}</select>`:""}<a class="btn" href="incidencia.html?id=${i.id}">Abrir →</a></div>
  </article>`;
}
async function quickValidate(id){try{const a=await CivicaAuth.role();await Workflow.transition(id,"Validada",a)}catch(e){alert(e.message)}}
async function quickAssign(id,crew){
  if(!crew)return;
  try{
    const a=await CivicaAuth.role(),i=await Backend.incident(id);
    if(i.status==="Validada")await Workflow.transition(id,"Asignada",a,{crew});
    else{await Backend.municipalUpdate(id,{crew});await Workflow.audit(id,{type:"assignment",crew,actorRole:"municipal",actorUid:a.uid})}
  }catch(e){alert(e.message)}
}
function drawMap(x){layer.clearLayers();x.forEach(i=>L.circleMarker([i.lat,i.lng],{radius:App.priority(i)>=80?9:6,weight:2,fillOpacity:.7}).bindPopup(`<b>${App.esc(i.category)}</b><br>${App.priority(i)}/100 · ${App.esc(i.status)}`).addTo(layer))}
function drawCrews(open){crew_load.innerHTML=App.crews.map(c=>{let n=open.filter(i=>i.crew===c.name).length,working=open.filter(i=>i.crew===c.name&&i.status==="En curso").length;return `<div class="crew-load-row"><div><strong>${App.esc(c.name)}</strong><span>${working?"En trabajo":"Disponible"}</span></div><b>${n}</b></div>`}).join("")}