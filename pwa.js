export function setupPWA(button,notify){
  if("serviceWorker"in navigator)window.addEventListener("load",()=>navigator.serviceWorker.register("./sw.js").catch(()=>{}));
  let deferred;
  window.addEventListener("beforeinstallprompt",e=>{e.preventDefault();deferred=e;button.classList.remove("hidden")});
  button.addEventListener("click",async()=>{if(!deferred)return notify("Usa el menú del navegador para agregar la aplicación a inicio.");deferred.prompt();await deferred.userChoice;deferred=null;button.classList.add("hidden")});
  const update=()=>{document.getElementById("connectionBadge").innerHTML=navigator.onLine?"<span></span> Local":"<span></span> Sin conexión"};
  addEventListener("online",update);addEventListener("offline",update);update();
}
