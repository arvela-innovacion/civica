const Backend=(()=>{
  const cfg=window.CIVICA_CONFIG||{};
  const configured=!cfg.DEMO_MODE&&window.firebase&&cfg.FIREBASE?.databaseURL&&!cfg.FIREBASE.databaseURL.includes("TU-PROYECTO");
  let db=null;
  if(configured){
    if(!firebase.apps.length) firebase.initializeApp(cfg.FIREBASE);
    db=firebase.database();
  }
  const normalize=(r,id)=>({
    id:id||r.id,category:r.category,description:r.description,lat:+r.lat,lng:+r.lng,
    urgency:+r.urgency,votes:+(r.votes||0),status:r.status||"Reportada",crew:r.crew||"",
    created:r.created||new Date().toISOString(),reporterRep:+(r.reporterRep||50),
    reporterUid:r.reporterUid||"",address:r.address||"",zone:r.zone||"",
    photo:r.photoUrl||r.photo||"",resolutionPhoto:r.resolutionPhotoUrl||r.resolutionPhoto||"",
    resolutionNote:r.resolutionNote||"",internalNote:r.internalNote||"",history:r.history||[],
    mergedInto:r.mergedInto||"",discardReason:r.discardReason||""
  });
  async function incidents(){
    if(!configured)return App.incidents;
    const s=await db.ref("incidents").once("value"),x=[];
    s.forEach(c=>x.push(normalize(c.val(),c.key)));
    return x.sort((a,b)=>new Date(b.created)-new Date(a.created));
  }
  async function incident(id){
    if(!configured)return App.incidents.find(x=>String(x.id)===String(id))||null;
    const s=await db.ref("incidents/"+id).once("value");
    return s.exists()?normalize(s.val(),s.key):null;
  }
  async function compress(file){
    return new Promise((resolve,reject)=>{
      const img=new Image(),u=URL.createObjectURL(file);
      img.onload=()=>{
        const max=1600,scale=Math.min(1,max/Math.max(img.width,img.height)),cv=document.createElement("canvas");
        cv.width=Math.round(img.width*scale);cv.height=Math.round(img.height*scale);
        cv.getContext("2d").drawImage(img,0,0,cv.width,cv.height);
        cv.toBlob(b=>{URL.revokeObjectURL(u);b?resolve(b):reject(Error("No se pudo comprimir la foto"))},"image/jpeg",.78);
      };
      img.onerror=()=>{URL.revokeObjectURL(u);reject(Error("No se pudo leer la foto"))};img.src=u;
    });
  }
  async function uploadImage(file,folder="incidents"){
    if(!file)return "";
    const c=cfg.CLOUDINARY;
    if(!c?.cloudName||c.cloudName.includes("TU_")||!c.uploadPreset||c.uploadPreset.includes("TU_"))throw Error("Cloudinary no está configurado.");
    const compressed=await compress(file),fd=new FormData();
    fd.append("file",compressed,"photo.jpg");fd.append("upload_preset",c.uploadPreset);fd.append("folder","civica/"+folder);
    const r=await fetch(`https://api.cloudinary.com/v1_1/${encodeURIComponent(c.cloudName)}/image/upload`,{method:"POST",body:fd}),j=await r.json();
    if(!r.ok)throw Error(j.error?.message||"No se pudo subir la foto");
    return j.secure_url;
  }
  async function ensureAuth(){
    if(!configured||!firebase.auth)return {uid:"demo-user"};
    if(firebase.auth().currentUser)return firebase.auth().currentUser;
    const r=await firebase.auth().signInAnonymously();return r.user;
  }
  async function uid(){return (await ensureAuth()).uid}
  async function createIncident(d){
    const reporterUid=await uid(),created=new Date().toISOString();
    if(!configured){
      const x=App.incidents,i={...d,id:Date.now(),votes:1,status:"Reportada",crew:"",created,reporterRep:App.user.reputation,reporterUid,address:d.address||"",photo:d.photo||"",history:[{at:created,action:"Incidencia reportada",by:"Ciudadanía"}]};
      delete i.photoFile;x.unshift(i);App.save(x);return i;
    }
    const ref=db.ref("incidents").push(),photoUrl=d.photoFile?await uploadImage(d.photoFile):"";
    const i={category:d.category,description:d.description,lat:d.lat,lng:d.lng,urgency:d.urgency,votes:1,status:"Reportada",crew:"",created,reporterRep:50,reporterUid,address:d.address||"",photoUrl,history:{initial:{at:created,action:"Incidencia reportada",by:"Ciudadanía"}}};
    await ref.set(i);return normalize(i,ref.key);
  }
  async function updateIncident(id,patch){
    if(!configured){
      const x=App.incidents,i=x.find(z=>String(z.id)===String(id));if(!i)throw Error("Incidencia no encontrada.");
      Object.assign(i,patch);App.save(x);return i;
    }
    await db.ref("incidents/"+id).update(patch);return incident(id);
  }
  async function pushHistory(id,action,by="Sistema"){
    const event={at:new Date().toISOString(),action,by};
    if(!configured){
      const x=App.incidents,i=x.find(z=>String(z.id)===String(id));if(!i)return;
      i.history=Array.isArray(i.history)?i.history:Object.values(i.history||{});i.history.push(event);App.save(x);return;
    }
    await db.ref(`incidents/${id}/history`).push(event);
  }
  async function immutableAudit(id,event){
    if(!configured)return;
    const u=await uid();await db.ref(`audit/${id}`).push({...event,uid:u,at:event.at||new Date().toISOString()});
  }
  async function hasVoted(id){
    const u=await uid();
    if(!configured)return localStorage.getItem(`civica_vote_${id}`)==="1";
    return (await db.ref(`votes/${id}/${u}`).once("value")).exists();
  }
  async function voteUnique(id){
    const u=await uid();if(await hasVoted(id))return false;
    if(!configured){
      const x=App.incidents,i=x.find(z=>String(z.id)===String(id));if(!i)throw Error("Incidencia no encontrada.");
      i.votes=(+i.votes||0)+1;i.history=Array.isArray(i.history)?i.history:Object.values(i.history||{});
      i.history.push({at:new Date().toISOString(),action:"Nueva confirmación ciudadana",by:"Ciudadanía"});
      App.save(x);localStorage.setItem(`civica_vote_${id}`,"1");return true;
    }
    const vr=db.ref(`votes/${id}/${u}`);let committed=false;
    await vr.transaction(v=>{if(v)return;committed=true;return {at:new Date().toISOString()}});
    if(!committed)return false;
    await db.ref(`incidents/${id}/votes`).transaction(v=>(+v||0)+1);
    await pushHistory(id,"Nueva confirmación ciudadana","Ciudadanía");return true;
  }
  async function follow(id,on=true){
    const u=await uid();
    if(!configured){
      let a=JSON.parse(localStorage.getItem("civica_followed_v10")||"[]");
      a=on?[...new Set([...a,String(id)])]:a.filter(x=>x!==String(id));
      localStorage.setItem("civica_followed_v10",JSON.stringify(a));return;
    }
    const r=db.ref(`follows/${u}/${id}`);on?await r.set({since:new Date().toISOString()}):await r.remove();
  }
  async function isFollowing(id){
    const u=await uid();
    if(!configured)return JSON.parse(localStorage.getItem("civica_followed_v10")||"[]").includes(String(id));
    return (await db.ref(`follows/${u}/${id}`).once("value")).exists();
  }
  async function followedIncidents(){
    const u=await uid();let ids=[];
    if(!configured)ids=JSON.parse(localStorage.getItem("civica_followed_v10")||"[]");
    else ids=Object.keys((await db.ref(`follows/${u}`).once("value")).val()||{});
    return (await incidents()).filter(i=>ids.includes(String(i.id)));
  }
  async function submitResolutionFeedback(id,value){
    const u=await uid(),payload={value,at:new Date().toISOString()};
    if(!configured){localStorage.setItem(`civica_review_${id}`,JSON.stringify(payload));await pushHistory(id,value==="confirmed"?"Ciudadanía confirma la resolución":"Ciudadanía solicita revisión","Ciudadanía");return}
    await db.ref(`reviews/${id}/${u}`).set(payload);
    await pushHistory(id,value==="confirmed"?"Ciudadanía confirma la resolución":"Ciudadanía solicita revisión","Ciudadanía");
  }
  async function actor(){return window.CivicaAuth?CivicaAuth.role():{role:"citizen",uid:await uid(),crew:""}}
  async function municipalUpdate(id,patch){const a=await actor();if(a.role!=="municipal")throw Error("Esta acción requiere acceso de Ayuntamiento.");return updateIncident(id,patch)}
  async function crewUpdate(id,patch){const a=await actor();if(a.role!=="crew")throw Error("Esta acción requiere acceso de cuadrilla.");const i=await incident(id);if(!i||i.crew!==a.crew)throw Error("Esta incidencia no está asignada a tu cuadrilla.");return updateIncident(id,patch)}
  function subscribe(cb){
    if(!configured){cb(App.incidents);return()=>{}}
    const r=db.ref("incidents"),fn=s=>{const x=[];s.forEach(c=>x.push(normalize(c.val(),c.key)));cb(x.sort((a,b)=>new Date(b.created)-new Date(a.created)))};
    r.on("value",fn);return()=>r.off("value",fn);
  }
  return{configured,incidents,incident,createIncident,updateIncident,municipalUpdate,crewUpdate,uploadImage,pushHistory,immutableAudit,ensureAuth,uid,vote:voteUnique,hasVoted,follow,isFollowing,followedIncidents,submitResolutionFeedback,subscribe};
})();