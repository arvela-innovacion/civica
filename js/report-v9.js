const cats=[["🕳️","Bache"],["💡","Alumbrado"],["🚦","Señalización"],["🗑️","Limpieza"],["🪑","Mobiliario urbano"],["💧","Agua / alcantarillado"],["•••","Otro"]];
let state={step:1,category:"",lat:null,lng:null,address:"",photoFile:null},all=[],marker;
let incidentsPromise=null;

const $=id=>document.getElementById(id);
const categories=$("categories"),stepLabel=$("step-label"),progress=$("progress"),locate=$("locate"),address=$("address"),coords=$("coords");
const duplicateTitle=$("duplicate-title"),duplicateResults=$("duplicate-results"),newReport=$("new-report");
const photo=$("photo"),preview=$("preview"),description=$("description"),chars=$("chars"),submitReport=$("submit-report"),formFeedback=$("form-feedback");
const successCard=$("success-card"),viewCreated=$("view-created");

const map=L.map("report-map").setView([40.4168,-3.7038],14);
L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",{attribution:"&copy; OpenStreetMap contributors"}).addTo(map);

function loadIncidents(force=false){
  if(force||!incidentsPromise){
    incidentsPromise=Backend.incidents().then(x=>{all=Array.isArray(x)?x:[];return all}).catch(e=>{incidentsPromise=null;throw e});
  }
  return incidentsPromise;
}
// Precarga, pero un fallo no debe romper el asistente.
loadIncidents().catch(e=>console.warn("No se pudieron precargar incidencias:",e));

categories.innerHTML=cats.map(([ico,n])=>`<button class="category-option" data-cat="${n}"><span>${ico}</span><b>${n}</b></button>`).join("");
document.querySelectorAll(".category-option").forEach(b=>b.onclick=()=>{document.querySelectorAll(".category-option").forEach(x=>x.classList.remove("selected"));b.classList.add("selected");state.category=b.dataset.cat;document.querySelector('[data-step="1"] .next').disabled=false});
document.querySelectorAll(".next").forEach(b=>b.onclick=()=>go(state.step+1));
document.querySelectorAll(".back").forEach(b=>b.onclick=()=>go(Math.max(1,state.step-1)));

function go(n){
  state.step=n;
  document.querySelectorAll(".wizard-step").forEach(x=>x.classList.toggle("active",+x.dataset.step===n));
  stepLabel.textContent=n<=4?`Paso ${n} de 4`:"Completado";
  progress.style.width=`${Math.min(n,4)*25}%`;
  if(n===2)setTimeout(()=>map.invalidateSize(),80);
  if(n===3)findDuplicates();
  scrollTo({top:0,behavior:"smooth"});
}

locate.onclick=()=>navigator.geolocation?navigator.geolocation.getCurrentPosition(p=>setPoint(p.coords.latitude,p.coords.longitude),()=>{address.textContent="No pudimos obtener tu ubicación. Toca el punto en el mapa."},{enableHighAccuracy:true,timeout:12000,maximumAge:30000}):address.textContent="Geolocalización no disponible. Toca el mapa.";
map.on("click",e=>setPoint(e.latlng.lat,e.latlng.lng));

async function setPoint(a,b){
  state.lat=a;state.lng=b;
  if(marker)marker.setLatLng([a,b]);else marker=L.marker([a,b],{draggable:true}).addTo(map);
  marker.off("dragend").on("dragend",()=>{const p=marker.getLatLng();setPoint(p.lat,p.lng)});
  map.setView([a,b],17);coords.textContent=`${a.toFixed(5)}, ${b.toFixed(5)}`;address.textContent="Buscando dirección…";
  document.querySelector('[data-step="2"] .next').disabled=false;
  try{
    const controller=new AbortController(),timer=setTimeout(()=>controller.abort(),8000);
    const r=await fetch(`https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${a}&lon=${b}&zoom=18&addressdetails=1`,{headers:{"Accept-Language":"es"},signal:controller.signal});
    clearTimeout(timer);if(!r.ok)throw Error("Geocodificación no disponible");
    const j=await r.json(),ad=j.address||{};
    state.address=[ad.road||ad.pedestrian||ad.footway,ad.house_number].filter(Boolean).join(" ")||j.display_name?.split(",").slice(0,2).join(", ")||"Ubicación seleccionada";
  }catch{state.address="Ubicación seleccionada"}
  address.textContent=state.address;
}

async function findDuplicates(force=false){
  duplicateTitle.textContent="Comprobando avisos cercanos…";
  duplicateResults.innerHTML='<div class="notice">Consultando incidencias abiertas…</div>';
  newReport.disabled=true;
  try{
    await loadIncidents(force);
    if(!Number.isFinite(state.lat)||!Number.isFinite(state.lng))throw Error("No hay una ubicación válida seleccionada.");
    const near=all.filter(i=>Number.isFinite(+i.lat)&&Number.isFinite(+i.lng)&&!["Resuelta","Descartada","Duplicada"].includes(i.status))
      .map(i=>({...i,d:App.dist(state.lat,state.lng,+i.lat,+i.lng),match:i.category===state.category}))
      .filter(i=>i.d<=150&&(i.match||i.d<=60)).sort((a,b)=>(b.match-a.match)||(a.d-b.d)).slice(0,3);
    duplicateTitle.textContent=near.length?"¿Ya está reportado?":"No hemos encontrado un aviso igual";
    duplicateResults.innerHTML=near.length?near.map(i=>`<article class="dup-v9">${i.photo?`<img src="${App.esc(i.photo)}" alt="">`:`<div class="dup-placeholder">📍</div>`}<div><h3>${App.esc(i.category)}</h3><p>${App.esc(i.description)}</p><p><strong>A ${Math.round(i.d)} m</strong> · 👥 ${i.votes} confirmaciones · ${App.esc(i.status)}</p><button class="btn primary" data-confirm-id="${App.esc(String(i.id))}">Sí, es este · Yo también lo he visto</button></div></article>`).join(""):`<div class="notice">Puedes continuar y crear un nuevo aviso.</div>`;
    duplicateResults.querySelectorAll("[data-confirm-id]").forEach(b=>b.onclick=()=>confirmExisting(b.dataset.confirmId));
    newReport.disabled=false;
  }catch(e){
    console.error("Error comprobando avisos cercanos:",e);
    duplicateTitle.textContent="No hemos podido comprobar avisos cercanos";
    duplicateResults.innerHTML=`<div class="notice"><strong>La consulta no ha respondido.</strong><br>${App.esc(e.message||"Error de conexión con Firebase.")}<br><br><button class="btn" id="retry-duplicates">Reintentar comprobación</button></div>`;
    $("retry-duplicates").onclick=()=>findDuplicates(true);
    // No bloqueamos el reporte por un fallo de consulta: el usuario puede continuar.
    newReport.disabled=false;
  }
}

async function confirmExisting(id){
  try{
    await Backend.vote(id);const i=await Backend.incident(id);if(!i)throw Error("No se pudo recuperar la incidencia.");
    state.step=5;document.querySelectorAll(".wizard-step").forEach(x=>x.classList.toggle("active",+x.dataset.step===5));stepLabel.textContent="Completado";progress.style.width="100%";
    await Backend.follow(id,true);successCard.innerHTML=`<strong>Has confirmado una incidencia existente</strong><p>${App.esc(i.category)} · ${App.esc(i.description)}</p><p>👥 Ahora tiene ${i.votes} confirmaciones.</p>`;viewCreated.href=`incidencia.html?id=${encodeURIComponent(id)}`;
  }catch(e){alert(e.message||"No se pudo confirmar la incidencia.")}
}

newReport.onclick=()=>go(4);
photo.onchange=e=>{state.photoFile=e.target.files[0]||null;if(state.photoFile){const u=URL.createObjectURL(state.photoFile);preview.innerHTML=`<img class="photo" src="${u}" alt="Vista previa de la foto">`}};
description.oninput=()=>chars.textContent=description.value.length;
submitReport.onclick=async()=>{
  const desc=description.value.trim();if(desc.length<3){formFeedback.textContent="⚠ Describe brevemente el problema (mínimo 3 caracteres).";description.focus();return}
  const risk=+document.querySelector('input[name="risk"]:checked').value,btn=submitReport;btn.disabled=true;btn.textContent="Enviando…";formFeedback.textContent=state.photoFile?"Comprimiendo foto y enviando…":"Enviando aviso…";
  try{
    const i=await Backend.createIncident({category:state.category,description:desc,lat:state.lat,lng:state.lng,urgency:risk,photoFile:state.photoFile,address:state.address});
    await Backend.follow(i.id,true);successCard.innerHTML=`<strong>Incidencia #${App.esc(String(i.id))}</strong><p>${App.esc(state.category)} · ${App.esc(state.address)}</p><p>👥 Eres la primera persona que la confirma.</p>`;viewCreated.href=`incidencia.html?id=${encodeURIComponent(i.id)}`;go(5);
  }catch(e){formFeedback.textContent="⚠ "+(e.message||"No se pudo enviar el aviso.");btn.disabled=false;btn.textContent="Enviar aviso"}
};
