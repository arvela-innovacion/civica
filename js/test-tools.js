const TestTools=(()=>{
 const seed=[
 {id:9101,category:"Bache",description:"Bache profundo junto al paso de peatones.",lat:40.4168,lng:-3.7038,urgency:4,votes:18,status:"Reportada",crew:"",created:new Date(Date.now()-2*864e5).toISOString(),reporterRep:82,photo:"",history:[]},
 {id:9102,category:"Alumbrado",description:"Farola apagada desde hace varios días.",lat:40.4180,lng:-3.7009,urgency:2,votes:7,status:"Validada",crew:"",created:new Date(Date.now()-4*864e5).toISOString(),reporterRep:74,photo:"",history:[]},
 {id:9103,category:"Señalización",description:"Señal de tráfico doblada y poco visible.",lat:40.4149,lng:-3.7060,urgency:3,votes:10,status:"Asignada",crew:"Mantenimiento 3",created:new Date(Date.now()-864e5).toISOString(),reporterRep:67,photo:"",history:[]},
 {id:9104,category:"Limpieza",description:"Acumulación de residuos junto a contenedores.",lat:40.4190,lng:-3.7051,urgency:2,votes:5,status:"En curso",crew:"Limpieza Centro",created:new Date(Date.now()-12*36e5).toISOString(),reporterRep:80,photo:"",history:[]}
 ];
 function reset(){localStorage.setItem("civica_incidents",JSON.stringify(seed));localStorage.removeItem("civica_followed_v10");Object.keys(localStorage).filter(k=>k.startsWith("civica_vote_")||k.startsWith("civica_review_")).forEach(k=>localStorage.removeItem(k));location.href="index.html?test=1"}
 return{reset}
})();