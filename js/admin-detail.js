const id=new URLSearchParams(location.search).get("id"),el=document.querySelector("#admin-detail");
let current=null;
init();
async function init(){current=await Backend.incident(id);if(!current){el.innerHTML="<div class='panel'>Incidencia no encontrada.</div>";return}render()}
function historyOf(i){return Array.isArray(i.history)?i.history:Object.values(i.history||{})}
function render(){
  const i=current,p=App.priorityParts(i),hist=historyOf(i),sla=Workflow.sla(i);
  const allowed=Workflow.transitions.municipal[i.status]||[];
  el.innerHTML=`<span class="eyebrow">Incidencia #${App.esc(String(i.id))}</span><h1>${App.esc(i.category)}</h1>
  <div class="detail-grid"><div>
    <div class="panel"><h2>Reporte</h2><p>${App.esc(i.description)}</p>${i.photo?`<img class="photo" src="${i.photo}" alt="Evidencia inicial">`:""}<p><strong>Ubicación:</strong><br>${i.address?App.esc(i.address)+"<br>":""}${i.lat.toFixed(5)}, ${i.lng.toFixed(5)}</p><p><strong>Zona:</strong> ${App.esc(Workflow.zone(i))}</p><p><strong>SLA:</strong> <span class="${sla.breached?"sla-breach":""}">${sla.label}</span></p></div>
    <div class="panel priority-explain"><span class="eyebrow">Prioridad explicable</span><div class="priority-score">${p.total}<small>/100</small></div><div class="bars">${bar("Gravedad",p.gravity,35)}${bar("Confirmaciones +1",p.confirm,25)}${bar("Reputación",p.reputation,15)}${bar("Antigüedad",p.age,15)}${bar("Riesgo categoría",p.risk,10)}</div></div>
    ${i.resolutionPhoto||i.resolutionNote?`<div class="panel"><span class="eyebrow">Resolución</span><h2>Resultado</h2>${i.resolutionPhoto?`<img class="photo" src="${i.resolutionPhoto}" alt="Evidencia de resolución">`:""}<p>${App.esc(i.resolutionNote||"")}</p></div>`:""}
  </div><div>
    <form class="panel admin-form" id="manage"><h2>Gestión municipal</h2>
      <label>Estado actual<input value="${App.esc(i.status)}" disabled></label>
      <label>Siguiente estado<select id="next-status"><option value="">Mantener ${App.esc(i.status)}</option>${allowed.map(x=>`<option>${App.esc(x)}</option>`).join("")}</select></label>
      <label>Cuadrilla<select id="crew"><option value="">Sin asignar</option>${App.crews.map(c=>`<option ${c.name===i.crew?"selected":""}>${App.esc(c.name)}</option>`).join("")}</select></label>
      <label>Nota interna<textarea id="note" rows="3">${App.esc(i.internalNote||"")}</textarea></label>
      <button class="btn primary">Guardar cambios</button>
    </form>
    <div class="panel audit"><h2>Historial</h2>${hist.slice().reverse().map(h=>`<div class="audit-row"><strong>${App.esc(h.action)}</strong><small>${new Date(h.at).toLocaleString("es-ES")} · ${App.esc(h.by)}</small></div>`).join("")}</div>
  </div></div>`;
  document.querySelector("#manage").onsubmit=saveManagement;
}
async function saveManagement(e){
  e.preventDefault();
  const actor=await CivicaAuth.role(),next=document.querySelector("#next-status").value,crew=document.querySelector("#crew").value,note=document.querySelector("#note").value;
  try{
    if(next){
      if(next==="Asignada"&&!crew)throw Error("Selecciona una cuadrilla antes de asignar.");
      await Workflow.transition(id,next,actor,next==="Asignada"?{crew,internalNote:note}:{internalNote:note});
    }else{
      const patch={internalNote:note};
      if(crew!==current.crew)patch.crew=crew;
      await Backend.municipalUpdate(id,patch);
      if(crew!==current.crew)await Workflow.audit(id,{type:"assignment",from:current.crew||"",to:crew,actorRole:"municipal",actorUid:actor.uid});
    }
    current=await Backend.incident(id);render();
  }catch(err){alert(err.message)}
}
function bar(n,v,m){return `<div class="barrow"><span>${n}</span><strong>${v}/${m}</strong><div><i style="width:${v/m*100}%"></i></div></div>`}
document.querySelector("#discard-btn").onclick=async()=>{
  const reason=document.querySelector("#discard-reason").value;if(!confirm(`¿Descartar esta incidencia como "${reason}"?`))return;
  try{const a=await CivicaAuth.role();await Workflow.transition(id,"Descartada",a,{discardReason:reason});location.href="index.html"}catch(e){alert(e.message)}
};
document.querySelector("#merge-btn").onclick=async()=>{
  const target=document.querySelector("#merge-id").value.trim();if(!target||target===String(id)){alert("Introduce un ID de incidencia principal diferente.");return}
  const a=await Backend.incident(id),b=await Backend.incident(target);if(!b){alert("No existe la incidencia principal indicada.");return}
  if(!confirm(`Fusionar #${id} dentro de #${target}?`))return;
  try{
    const actor=await CivicaAuth.role();
    await Backend.municipalUpdate(target,{votes:(+b.votes||0)+(+a.votes||0)});
    await Backend.pushHistory(target,`Fusionada con incidencia #${id}`,"Ayuntamiento");
    await Workflow.transition(id,"Duplicada",actor,{mergedInto:target});
    await Workflow.audit(target,{type:"merge_target",source:String(id),actorRole:"municipal",actorUid:actor.uid});
    location.href=`incidencia.html?id=${encodeURIComponent(target)}`;
  }catch(e){alert(e.message)}
};