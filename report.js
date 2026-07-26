const esc=s=>String(s??"").replace(/[&<>"']/g,m=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;"}[m]));
export function buildDebrief(session){
  const total=session.scenario.interventions.length,done=session.completed.size,pending=session.scenario.interventions.filter((_,i)=>!session.completed.has(i)).map(x=>x[0]);
  const plus=done?`El equipo completó ${done} de ${total} intervenciones previstas. Destacó la priorización de ${[...session.completed].slice(0,2).map(i=>session.scenario.interventions[i][0].toLowerCase()).join(" y ")}.`:"No se registraron intervenciones esperadas.";
  const delta=pending.length?`Conviene revisar: ${pending.slice(0,3).join(", ")}${pending.length>3?" y otras acciones pendientes":""}.`:"Se completaron todos los objetivos operativos.";
  const question=session.errors?`¿Qué señales permitían evitar los ${session.errors} errores críticos registrados?`:"¿Qué elemento de comunicación de circuito cerrado fue más útil y cuál reforzarían?";
  return{plus,delta,question};
}
export function reportText(session){
  const d=buildDebrief(session),lines=session.log.map(e=>`${e.time} | ${e.text}`);
  return `SIMCOPILOT EDUVESA · REPORTE DE SESIÓN
Fecha: ${new Date().toLocaleString("es-MX")}
Programa: ${session.scenario.program}
Escenario: ${session.scenario.title}
Paciente: ${session.scenario.patient}
Instructor: ${session.instructor||"No especificado"}
Equipo: ${session.team||"No especificado"}
Duración: ${Math.floor(session.elapsed/60)} min ${session.elapsed%60} s
Puntuación: ${session.score}/100
Errores críticos: ${session.errors}
Decisión: ${session.decision||"Evaluación automática"}

PLUS
${d.plus}

DELTA
${d.delta}

PREGUNTA DE DEBRIEFING
${d.question}

CRONOLOGÍA
${lines.join("\n")}

Aviso: herramienta educativa; no sustituye protocolos oficiales ni juicio clínico.`;
}
export function downloadReport(session){
  const blob=new Blob([reportText(session)],{type:"text/plain;charset=utf-8"}),url=URL.createObjectURL(blob),a=document.createElement("a");
  a.href=url;a.download=`SimCopilot-${session.scenario.id}-${new Date().toISOString().slice(0,10)}.txt`;a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);
}
export {esc};
