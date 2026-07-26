export function createVoice(onMatch,onStatus){
  const Recognition=window.SpeechRecognition||window.webkitSpeechRecognition;
  if(!Recognition)return{supported:false,toggle:()=>onStatus("El reconocimiento de voz no está disponible en este navegador.")};
  const recognition=new Recognition();recognition.lang="es-MX";recognition.continuous=false;recognition.interimResults=false;let active=false;
  recognition.onstart=()=>{active=true;onStatus("Escuchando… di una intervención.")};
  recognition.onend=()=>{active=false};
  recognition.onerror=()=>onStatus("No fue posible reconocer la orden.");
  recognition.onresult=e=>{const text=e.results[0][0].transcript.toLowerCase();onMatch(text)};
  return{supported:true,toggle:()=>active?recognition.stop():recognition.start()};
}
