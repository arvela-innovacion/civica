window.Workflow=(()=>{
const transitions={
  citizen:{},
  municipal:{Reportada:["Validada","Descartada","Duplicada"],Validada:["Asignada","Descartada","Duplicada"],Asignada:["En curso","Validada","Descartada"],"En curso":["Resuelta","Asignada"],Resuelta:["Reabierta"],Reabierta:["Validada","Asignada"]},
  crew:{Asignada:["En curso"],"En curso":["Resuelta"]}
};
const slaHours={"Agua / alcantarillado":8,"Señalización":8,"Bache":24,"Alumbrado":24,"Mobiliario urbano":72,"Limpieza":48,"Otro":72};
function can(role,from,to){return (transitions[role]?.[from]||[]).includes(to)}
function sla(i){let hours=slaHours[i.category]||72,start=new Date(i.created).getTime(),deadline=start+hours*36e5,left=(deadline-Date.now())/36e5;return{hours,deadline:new Date(deadline),left,breached:left<0,label:left<0?`Vencida hace ${human(-left)}`:`Quedan ${human(left)}`}}
function human(h){return h<1?`${Math.max(1,Math.round(h*60))} min`:h<24?`${Math.round(h)} h`:`${(h/24).toFixed(1)} d`}
function zone(i){if(i.zone)return i.zone;if(i.address){let a=i.address.split(",").map(x=>x.trim());return a.length>2?a[a.length-3]:"Sin zona"}return "Sin zona"}
async function transition(id,to,actor,extra={}){let i=await Backend.incident(id);if(!i)throw new Error("Incidencia no encontrada.");if(!can(actor.role,i.status,to))throw new Error(`No se permite ${i.status} → ${to} para este rol.`);let patch={...extra,status:to};if(to==="Resuelta")patch.resolvedAt=new Date().toISOString();if(to==="En curso")patch.workStartedAt=new Date().toISOString();let update=actor.role==="municipal"?Backend.municipalUpdate:Backend.crewUpdate;await update(id,patch);await Backend.pushHistory(id,`Estado: ${i.status} → ${to}`,actor.role==="crew"?(actor.crew||"Cuadrilla"):"Ayuntamiento");
await audit(id,{type:"status",from:i.status,to,actorRole:actor.role,actorUid:actor.uid,crew:actor.crew||"",at:new Date().toISOString()});return true}
async function audit(id,event){let clean={...event,at:event.at||new Date().toISOString()};if(Backend.immutableAudit)await Backend.immutableAudit(id,clean)}
return{transitions,can,sla,zone,transition,audit,slaHours}})();