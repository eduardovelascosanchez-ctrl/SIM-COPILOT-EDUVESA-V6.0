const fresh = () => ({scenario:null,instructor:"",team:"",weight:0,difficulty:"Intermedia",elapsed:0,running:false,startedAt:null,completed:new Set(),log:[],score:0,errors:0,decision:"",deteriorating:false,charged:false,vitals:{},rhythm:"Sinusal"});
export let session = fresh();
export const resetSession = () => { session = fresh(); return session; };
export const saveSession = () => {
  const serializable={...session,completed:[...session.completed]};
  localStorage.setItem("simcopilot-session",JSON.stringify(serializable));
};
export const settings = {
  get pin(){return localStorage.getItem("simcopilot-pin")||"2026"},
  set pin(value){localStorage.setItem("simcopilot-pin",value)}
};
