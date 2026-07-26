import{scenarios,byProgram,getScenario}from"../data/scenarios.js";
import{session,resetSession,saveSession,settings}from"./state.js";
import{startMonitor,startHeroMonitor}from"./monitor.js";
import{beep,alarm,chargeSound,shockSound}from"./audio.js";
import{buildDebrief,downloadReport,esc}from"./report.js";
import{createVoice}from"./voice.js";
import{setupPWA}from"./pwa.js";

const $=id=>document.getElementById(id),views=["homeView","setupView","simView","resultView"];
let timerId,deteriorationId,toastId;
const showView=id=>{views.forEach(v=>$(v).classList.toggle("active",v===id));scrollTo({top:0,behavior:"smooth"})};
const toast=text=>{clearTimeout(toastId);$("toast").textContent=text;$("toast").classList.add("show");toastId=setTimeout(()=>$("toast").classList.remove("show"),2600)};
const timeText=s=>`${String(Math.floor(s/60)).padStart(2,"0")}:${String(s%60).padStart(2,"0")}`;
const addLog=(text,type="neutral")=>{const entry={time:timeText(session.elapsed),text,type};session.log.unshift(entry);renderLog();saveSession()};

function populateScenarios(){
  const list=byProgram($("programSelect").value);$("scenarioSelect").innerHTML=list.map(s=>`<option value="${s.id}">${s.title}</option>`).join("");previewScenario();
}
function previewScenario(){
  const s=getScenario($("scenarioSelect").value);if(!s)return;$("scenarioPreview").innerHTML=`<strong>${esc(s.patient)}</strong>${esc(s.narrative)}`;$("patientWeight").value=s.weight;
}
function renderVitals(){
  const v=session.vitals;$("hrValue").textContent=$("hrBottom").textContent=Math.round(v.hr);$("spo2Value").textContent=$("spo2Bottom").textContent=Math.round(v.spo2);$("bpValue").textContent=`${Math.round(v.sys)}/${Math.round(v.dia)}`;$("rrValue").textContent=Math.round(v.rr);$("etco2Value").textContent=Math.round(v.etco2);$("rhythmLabel").textContent=`Ritmo: ${session.rhythm}`;
}
function renderGoals(){
  const total=session.scenario.goals.length,done=Math.min(total,Math.floor(session.completed.size/(session.scenario.interventions.length/total)));$("goalCount").textContent=`${done}/${total}`;$("goalProgress").value=done/total*100;$("goalList").innerHTML=session.scenario.goals.map((g,i)=>`<div class="goal-item ${i<done?"done":""}"><span>${i<done?"✓":""}</span>${esc(g)}</div>`).join("");
}
function renderLog(){
  $("logList").innerHTML=session.log.length?session.log.map(e=>`<div class="log-entry ${e.type}"><time>${e.time}</time><i></i><p>${esc(e.text)}</p></div>`).join(""):`<p style="color:var(--muted);font-size:12px">Las acciones aparecerán aquí.</p>`;
}
function applyIntervention(index){
  if(session.completed.has(index))return toast("Esta intervención ya fue registrada.");
  const item=session.scenario.interventions[index];session.completed.add(index);session.score=Math.min(100,session.score+item[2]);addLog(item[0],"positive");beep();
  const progress=session.completed.size/session.scenario.interventions.length,response=session.scenario.response,initial=session.scenario.vitals;
  Object.keys(response).forEach(k=>session.vitals[k]=initial[k]+(response[k]-initial[k])*progress);
  if(progress>.7&&["FV","TSV","Bradicardia"].includes(session.rhythm))session.rhythm="Sinusal";
  renderVitals();renderGoals();renderInterventions();saveSession();
}
function renderInterventions(){
  $("interventionGrid").innerHTML=session.scenario.interventions.map((x,i)=>`<button class="intervention ${session.completed.has(i)?"done":""}" data-intervention="${i}"><strong>${session.completed.has(i)?"✓ ":""}${esc(x[0])}</strong><small>${esc(x[1])}</small></button>`).join("");
  document.querySelectorAll("[data-intervention]").forEach(b=>b.onclick=()=>applyIntervention(Number(b.dataset.intervention)));
}
function beginSession(e){
  e.preventDefault();resetSession();const s=getScenario($("scenarioSelect").value);session.scenario=s;session.instructor=$("instructorName").value.trim();session.team=$("teamName").value.trim();session.weight=Number($("patientWeight").value)||s.weight;session.difficulty=$("difficultySelect").value;session.vitals={...s.vitals};session.rhythm=s.rhythm;session.running=true;session.startedAt=Date.now();
  $("simProgram").textContent=s.program;$("simTitle").textContent=s.title;$("patientLabel").textContent=s.patient;$("caseNarrative").textContent=s.narrative;$("timer").textContent="00:00";$("pauseBtn").textContent="Pausar";
  renderVitals();renderGoals();renderInterventions();addLog("Escenario iniciado");showView("simView");clearInterval(timerId);timerId=setInterval(()=>{if(session.running){session.elapsed++;$("timer").textContent=timeText(session.elapsed);if(session.elapsed%30===0)saveSession()}},1000);
}
function togglePause(){session.running=!session.running;$("pauseBtn").textContent=session.running?"Pausar":"Reanudar";addLog(session.running?"Escenario reanudado":"Escenario pausado")}
function finishSession(){
  if(!session.scenario)return;session.running=false;clearInterval(timerId);clearInterval(deteriorationId);session.deteriorating=false;session.score=Math.max(0,Math.min(100,session.score-session.errors*10));const auto=session.score>=80?"Aprueba":session.score>=60?"Remediación":"No aprueba";const decision=session.decision||auto;
  $("finalScore").textContent=session.score;$("scoreRing").style.setProperty("--score",session.score);$("resultTitle").textContent=decision;$("resultSummary").textContent=`${session.scenario.title} · ${timeText(session.elapsed)} · ${session.completed.size} intervenciones registradas`;$("decisionBadge").textContent=session.decision?`Decisión del instructor: ${decision}`:`Evaluación automática: ${decision}`;
  const d=buildDebrief(session);$("debriefing").innerHTML=`<div class="debrief-section"><strong>PLUS · Fortalezas</strong><p>${esc(d.plus)}</p></div><div class="debrief-section delta"><strong>DELTA · Oportunidades</strong><p>${esc(d.delta)}</p></div><div class="debrief-section"><strong>Pregunta reflexiva</strong><p>${esc(d.question)}</p></div>`;
  $("metricGrid").innerHTML=[["Intervenciones",`${session.completed.size}/${session.scenario.interventions.length}`],["Duración",timeText(session.elapsed)],["Errores críticos",session.errors],["Dificultad",session.difficulty]].map(x=>`<div class="metric"><strong>${esc(x[1])}</strong><small>${esc(x[0])}</small></div>`).join("");saveSession();showView("resultView");
}
function openInstructor(){
  $("pinGate").classList.remove("hidden");$("instructorControls").classList.add("hidden");$("pinInput").value="";$("instructorDialog").showModal();
}
function unlockInstructor(){
  if($("pinInput").value!==settings.pin)return toast("PIN incorrecto.");
  $("pinGate").classList.add("hidden");$("instructorControls").classList.remove("hidden");const v=session.vitals||{};$("manualHr").value=v.hr??"";$("manualSpo2").value=v.spo2??"";$("manualSys").value=v.sys??"";$("manualDia").value=v.dia??"";$("manualRr").value=v.rr??"";$("manualEtco2").value=v.etco2??"";$("rhythmSelect").value=session.rhythm||"Sinusal";$("decisionSelect").value=session.decision||"";
}
function applyManualVitals(){
  if(!session.scenario)return toast("Inicia un escenario primero.");const v=session.vitals;v.hr=Number($("manualHr").value);v.spo2=Number($("manualSpo2").value);v.sys=Number($("manualSys").value);v.dia=Number($("manualDia").value);v.rr=Number($("manualRr").value);v.etco2=Number($("manualEtco2").value);session.rhythm=$("rhythmSelect").value;addLog(`Instructor modificó signos vitales: FC ${v.hr}, SpO₂ ${v.spo2}%, TA ${v.sys}/${v.dia}, FR ${v.rr}, ETCO₂ ${v.etco2}`);renderVitals();alarm();
}
function toggleDeterioration(){
  if(!session.scenario)return toast("Inicia un escenario primero.");session.deteriorating=!session.deteriorating;$("toggleDeteriorationBtn").textContent=session.deteriorating?"Detener deterioro":"Iniciar deterioro";clearInterval(deteriorationId);
  if(session.deteriorating)deteriorationId=setInterval(()=>{session.vitals.spo2=Math.max(30,session.vitals.spo2-1);session.vitals.sys=Math.max(25,session.vitals.sys-1);session.vitals.hr=session.rhythm==="Bradicardia"?Math.max(20,session.vitals.hr-2):Math.min(260,session.vitals.hr+2);renderVitals()},2000);
  addLog(session.deteriorating?"Deterioro iniciado por instructor":"Deterioro detenido por instructor","negative");
}
function criticalError(){if(!session.scenario)return toast("Inicia un escenario primero.");session.errors++;addLog(`Error crítico #${session.errors}`,"negative");alarm()}
function setEnergy(){ $("joules").textContent=$("energyRange").value }
function charge(){if(!session.scenario)return toast("Inicia un escenario primero.");session.charged=true;$("shockBtn").disabled=false;chargeSound();addLog(`Desfibrilador cargando a ${$("energyRange").value} J/kg`)}
function shock(){if(!session.charged)return;session.charged=false;$("shockBtn").disabled=true;shockSound();addLog(`Descarga aplicada: ${$("energyRange").value} J/kg`,"positive");if(["FV","TV"].includes(session.rhythm)){session.rhythm="Sinusal";session.vitals.hr=108;session.vitals.sys=78;session.vitals.dia=44;session.vitals.spo2=88;renderVitals()}}
function generateScenario(e){
  e.preventDefault();const program=$("genProgram").value,diff=$("genDifficulty").value,problem=$("genProblem").value.trim(),patient=$("genPatient").value.trim();const priorities=program==="NRP"?["Control térmico y vía aérea","Ventilación efectiva","Frecuencia cardiaca y oxigenación"]:["Evaluación ABCDE","Oxigenación y monitorización","Tratamiento de la causa"];
  $("generatedScenario").classList.remove("hidden");$("generatedScenario").innerHTML=`<strong>${esc(problem)} · ${esc(diff)}</strong><p>${esc(patient)} presenta signos compatibles con ${esc(problem.toLowerCase())}. El equipo debe reconocer el deterioro, distribuir funciones y actuar en secuencia.</p><b>Objetivos sugeridos</b><ul>${priorities.map(x=>`<li>${esc(x)}</li>`).join("")}</ul><small>Borrador educativo: debe ser revisado por un instructor experto antes de utilizarse.</small>`;
}
function voiceMatch(text){
  const normalized=s=>s.normalize("NFD").replace(/\p{Diacritic}/gu,"").toLowerCase();const target=normalized(text);const index=session.scenario?.interventions.findIndex(i=>target.includes(normalized(i[0]).split(" ")[0]));
  if(index>=0){applyIntervention(index);toast(`Voz: ${session.scenario.interventions[index][0]}`)}else toast(`No reconocí una intervención en “${text}”.`);
}
const voice=createVoice(voiceMatch,toast);

$("startFlowBtn").onclick=()=>showView("setupView");$("generatorBtn").onclick=()=>$("generatorDialog").showModal();document.querySelectorAll("[data-go-home]").forEach(b=>b.onclick=()=>showView("homeView"));
$("programSelect").onchange=populateScenarios;$("scenarioSelect").onchange=previewScenario;$("setupForm").onsubmit=beginSession;$("pauseBtn").onclick=togglePause;$("finishBtn").onclick=finishSession;$("instructorBtn").onclick=openInstructor;$("unlockBtn").onclick=unlockInstructor;$("applyVitalsBtn").onclick=applyManualVitals;$("rhythmSelect").onchange=()=>{session.rhythm=$("rhythmSelect").value;renderVitals();addLog(`Ritmo activado: ${session.rhythm}`)};$("toggleDeteriorationBtn").onclick=toggleDeterioration;$("criticalErrorBtn").onclick=criticalError;$("decisionSelect").onchange=()=>session.decision=$("decisionSelect").value;$("instructorFinishBtn").onclick=()=>{$("instructorDialog").close();finishSession()};
$("energyRange").oninput=setEnergy;$("chargeBtn").onclick=charge;$("shockBtn").onclick=shock;$("voiceBtn").onclick=()=>voice.toggle();$("addNoteBtn").onclick=()=>$("noteDialog").showModal();$("noteForm").onsubmit=e=>{e.preventDefault();addLog(`Nota: ${$("noteText").value}`);$("noteText").value="";$("noteDialog").close()};$("generatorForm").onsubmit=generateScenario;$("downloadReportBtn").onclick=()=>downloadReport(session);$("printBtn").onclick=()=>print();$("newSessionBtn").onclick=()=>{resetSession();showView("setupView")};

populateScenarios();startHeroMonitor();startMonitor(()=>({...session.vitals,rhythm:session.rhythm}));setupPWA($("installBtn"),toast);
window.addEventListener("beforeunload",saveSession);
