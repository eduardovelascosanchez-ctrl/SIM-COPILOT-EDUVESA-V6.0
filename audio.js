let ctx;
const getCtx=()=>ctx||(ctx=new (window.AudioContext||window.webkitAudioContext)());
const tone=(frequency,duration,type="sine",volume=.05,delay=0)=>{const c=getCtx(),osc=c.createOscillator(),gain=c.createGain();osc.type=type;osc.frequency.value=frequency;gain.gain.setValueAtTime(volume,c.currentTime+delay);gain.gain.exponentialRampToValueAtTime(.001,c.currentTime+delay+duration);osc.connect(gain).connect(c.destination);osc.start(c.currentTime+delay);osc.stop(c.currentTime+delay+duration)};
export const beep=()=>tone(760,.08);
export const alarm=()=>{tone(880,.12,"square",.03);tone(880,.12,"square",.03,.18)};
export const chargeSound=()=>{for(let i=0;i<10;i++)tone(180+i*55,.08,"sawtooth",.025,i*.06)};
export const shockSound=()=>{tone(90,.28,"square",.1);tone(45,.35,"sawtooth",.07,.03)};
