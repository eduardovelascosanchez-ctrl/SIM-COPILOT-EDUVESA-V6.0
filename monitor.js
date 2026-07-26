const colors={ecg:"#62e698",pleth:"#34d7d0",capno:"#f4c35b"};
const fit=canvas=>{const rect=canvas.getBoundingClientRect(),dpr=Math.min(devicePixelRatio||1,2);if(canvas.width!==rect.width*dpr||canvas.height!==rect.height*dpr){canvas.width=rect.width*dpr;canvas.height=rect.height*dpr}return{ctx:canvas.getContext("2d"),w:canvas.width,h:canvas.height,dpr}};
const signal=(type,p,rate,rhythm)=>{
  if(rhythm==="Asistolia") return 0;
  if(type==="ecg"){
    if(rhythm==="FV") return Math.sin(p*31)*.38+Math.sin(p*17)*.24+Math.sin(p*7)*.14;
    const cycle=(p*(rate/60))%1;
    if(cycle<.06)return Math.sin(cycle/.06*Math.PI)*.12;
    if(cycle>.16&&cycle<.19)return-(cycle-.16)/.03*.18;
    if(cycle>=.19&&cycle<.215)return .95-Math.abs(cycle-.2025)/.0125*.95;
    if(cycle>=.215&&cycle<.25)return-.28+(cycle-.215)/.035*.28;
    if(cycle>.42&&cycle<.62)return Math.sin((cycle-.42)/.2*Math.PI)*.22;
    return 0;
  }
  if(type==="pleth"){const c=(p*(rate/60))%1;return c<.18?Math.sin(c/.18*Math.PI):c<.5?Math.exp(-(c-.18)*4)*.8:Math.sin((c-.5)/.25*Math.PI)*.18}
  const c=(p*(Math.max(rate,8)/60))%1;return c<.12?c/.12:c<.52?1:c<.65?1-(c-.52)/.13:0;
};
export function startMonitor(getVitals){
  const configs=[["ecgCanvas","ecg"],["plethCanvas","pleth"],["capnoCanvas","capno"]];
  let t=0,last=performance.now();
  function draw(now){
    const delta=Math.min((now-last)/1000,.05);last=now;t+=delta;const v=getVitals();
    configs.forEach(([id,type])=>{const el=document.getElementById(id);if(!el)return;const{ctx,w,h,dpr}=fit(el);ctx.clearRect(0,0,w,h);ctx.strokeStyle="#17313e";ctx.lineWidth=dpr*.5;for(let x=0;x<w;x+=40*dpr){ctx.beginPath();ctx.moveTo(x,0);ctx.lineTo(x,h);ctx.stroke()}for(let y=0;y<h;y+=30*dpr){ctx.beginPath();ctx.moveTo(0,y);ctx.lineTo(w,y);ctx.stroke()}ctx.strokeStyle=colors[type];ctx.lineWidth=1.8*dpr;ctx.shadowBlur=7*dpr;ctx.shadowColor=colors[type];ctx.beginPath();const rate=type==="ecg"?Math.max(v.hr,30):type==="pleth"?Math.max(v.hr,40):Math.max(v.rr,8);for(let x=0;x<w;x+=2*dpr){const p=t-((w-x)/w)*5;const amp=signal(type,p,rate,v.rhythm);const baseline=type==="ecg"?.55:type==="pleth"?.78:.75;const y=(baseline-amp*(type==="ecg"?.34:type==="pleth"?.52:.48))*h;x?ctx.lineTo(x,y):ctx.moveTo(x,y)}ctx.stroke();ctx.shadowBlur=0});
    requestAnimationFrame(draw);
  }requestAnimationFrame(draw);
}
export function startHeroMonitor(){
  const canvas=document.getElementById("heroCanvas");if(!canvas)return;let t=0;
  const draw=()=>{t+=.025;const ctx=canvas.getContext("2d"),w=canvas.width,h=canvas.height;ctx.clearRect(0,0,w,h);ctx.strokeStyle="#12313e";for(let x=0;x<w;x+=32){ctx.beginPath();ctx.moveTo(x,0);ctx.lineTo(x,h);ctx.stroke()}[70,160,250].forEach((base,i)=>{ctx.beginPath();ctx.strokeStyle=[colors.ecg,colors.pleth,colors.capno][i];ctx.lineWidth=2;for(let x=0;x<w;x+=2){const p=t-(w-x)/130;const val=signal(["ecg","pleth","capno"][i],p,i===2?24:128,"Sinusal");const y=base-val*(i===0?45:35);x?ctx.lineTo(x,y):ctx.moveTo(x,y)}ctx.stroke()});requestAnimationFrame(draw)};draw();
}
