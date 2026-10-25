// Inline application scripts extracted from the supplied HTML.
document.documentElement.classList.add("js-enabled");


(function(){
// Light theme is the default for first-time visitors; remember a user's choice.
var root=document.documentElement,themeButton=document.getElementById('themeToggle'),themeMeta=document.getElementById('themeColorMeta');
function applyTheme(theme){
  var dark=theme==='dark';
  root.setAttribute('data-theme',dark?'dark':'light');
  if(themeButton){themeButton.setAttribute('aria-pressed',dark?'true':'false');themeButton.setAttribute('aria-label',dark?'Switch to light mode':'Switch to dark mode');themeButton.querySelector('.theme-icon').textContent=dark?'☀':'☾';themeButton.querySelector('.theme-label').textContent=dark?'Light mode':'Dark mode';}
  if(themeMeta)themeMeta.setAttribute('content',dark?'#101417':'#FBF5EC');
}
var savedTheme=null;try{savedTheme=localStorage.getItem('ukvc-theme')}catch(e){}
applyTheme(savedTheme==='dark'?'dark':'light');
// Robust navigation + theme controls. Works consistently on every page.
var burger=document.getElementById('burger');
var menu=document.getElementById('menu');
function setMenuOpen(open){
  if(!burger || !menu) return;
  menu.classList.toggle('open', !!open);
  burger.setAttribute('aria-expanded', open ? 'true' : 'false');
  burger.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
}
if(burger && menu){
  // onclick assignment avoids duplicate handlers if this script is accidentally loaded twice.
  burger.onclick=function(event){ event.preventDefault(); event.stopPropagation(); var isOpen=menu.classList.contains('open'); setMenuOpen(!isOpen); };
  menu.addEventListener('click',function(event){
    var link=event.target.closest('a');
    if(link) setMenuOpen(false);
  });
  document.addEventListener('keydown',function(event){ if(event.key==='Escape') setMenuOpen(false); });
  document.addEventListener('click',function(event){
    if(menu.classList.contains('open') && !menu.contains(event.target) && !burger.contains(event.target)) setMenuOpen(false);
  });
  window.addEventListener('resize',function(){ if(window.innerWidth>1050) setMenuOpen(false); });
}
if(themeButton){
  themeButton.onclick=function(){
    var next=root.getAttribute('data-theme')==='dark'?'light':'dark';
    applyTheme(next);
    try{localStorage.setItem('ukvc-theme',next)}catch(e){}
  };
}
// Set to your backend endpoint (e.g. "/api/mot"); it must return JSON for ?reg=AB12CDE
var API_URL=""; // Configure this with your own secure backend endpoint before launch.
var form=document.getElementById('form'),input=document.getElementById('reg'),plate=document.getElementById('plate'),msg=document.getElementById('msg'),go=document.getElementById('go'),gotxt=document.getElementById('gotxt'),busy=false;
var liveResults=document.getElementById('liveResults');
function esc(v){return String(v==null?'':v).replace(/[&<>"']/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]})}
function first(obj,keys){for(var i=0;i<keys.length;i++){if(obj&&obj[keys[i]]!==undefined&&obj[keys[i]]!==null&&obj[keys[i]]!=='')return obj[keys[i]]}return ''}
function renderResults(data,reg){
 var vehicle=(data&&data.vehicle)||data||{};var records=Array.isArray(data)?data:(Array.isArray(vehicle.motTests)?[vehicle]:[]);
 if(Array.isArray(data)&&data.length===1&&data[0]&&Array.isArray(data[0].motTests)){vehicle=data[0];records=[vehicle]}
 var tests=[];records.forEach(function(rec){if(Array.isArray(rec.motTests))tests=tests.concat(rec.motTests);else if(rec&&rec.completedDate)tests.push(rec)});
 if(data&&data.motTests&&Array.isArray(data.motTests))tests=data.motTests;
 tests.sort(function(a,b){return String(first(b,['completedDate','testDate'])).localeCompare(String(first(a,['completedDate','testDate'])))});
 var make=first(vehicle,['make','vehicleMake'])||first(data,['make'])||'Not provided';
 var model=first(vehicle,['model','vehicleModel'])||first(data,['model']);
 var colour=first(vehicle,['primaryColour','colour','color'])||first(data,['primaryColour']);
 var fuel=first(vehicle,['fuelType'])||first(data,['fuelType']);
 var engine=first(vehicle,['engineSize','engineCapacity'])||first(data,['engineSize']);
 var firstUsed=first(vehicle,['firstUsedDate','registrationDate','manufactureDate'])||first(data,['firstUsedDate','registrationDate']);
 var latest=tests[0]||{};var expiry=first(latest,['expiryDate'])||first(vehicle,['motExpiryDate','expiryDate']);
 var cards=[['Registration',reg],['Make',make],['Model',model],['Colour',colour],['Fuel type',fuel],['Engine size',engine?String(engine)+(String(engine).toLowerCase().indexOf('cc')>=0?'':' cc'):''] ,['First used / registered',firstUsed],['Latest recorded test',first(latest,['completedDate','testDate'])],['Latest test result',first(latest,['testResult','result'])],['MOT expiry (recorded)',expiry]];
 document.getElementById('resultTitle').textContent=(make&&make!=='Not provided'?make+' ':'')+(model?model+' ':'')+'MOT report';
 document.getElementById('resultSubtitle').textContent='Registration: '+reg+' · '+tests.length+' recorded test'+(tests.length===1?'':'s')+' returned';
 document.getElementById('vehicleCards').innerHTML=cards.filter(function(c){return c[1]!==''&&c[1]!==null&&c[1]!==undefined}).map(function(c){return '<div class="vehicle-card"><small>'+esc(c[0])+'</small><strong>'+esc(c[1])+'</strong></div>'}).join('');
 document.getElementById('historyRows').innerHTML=tests.map(function(t){var result=first(t,['testResult','result'])||'Not provided';var pass=String(result).toLowerCase()==='pass';var fail=String(result).toLowerCase()==='fail';var mileage=first(t,['odometerValue','mileage']);var unit=first(t,['odometerUnit'])||'miles';return '<tr><td>'+esc(first(t,['completedDate','testDate'])||'—')+'</td><td><span class="result-badge '+(pass?'pass':fail?'fail':'')+'">'+esc(result)+'</span></td><td>'+esc(mileage?(mileage+' '+unit):'—')+'</td><td>'+esc(first(t,['expiryDate'])||'—')+'</td></tr>'}).join('');
 document.getElementById('noTests').hidden=tests.length>0;
 var mileageItems=tests.filter(function(t){return first(t,['odometerValue','mileage'])!==''});var max=0;mileageItems.forEach(function(t){max=Math.max(max,Number(String(first(t,['odometerValue','mileage'])).replace(/[^0-9.]/g,''))||0)});
 document.getElementById('mileageChart').innerHTML=mileageItems.length?mileageItems.slice().reverse().map(function(t){var val=first(t,['odometerValue','mileage']);var n=Number(String(val).replace(/[^0-9.]/g,''))||0;var date=first(t,['completedDate','testDate'])||'Test';return '<div class="mileage-row"><span>'+esc(date)+'</span><div class="mileage-bar-wrap"><div class="mileage-bar" style="width:'+ (max?Math.max(3,n/max*100):3)+'%"></div></div><strong>'+esc(val)+' '+esc(first(t,['odometerUnit'])||'miles')+'</strong></div>'}).join(''):'<p class="empty-state">No mileage readings were returned.</p>';
 var defects=[];tests.forEach(function(t){var ds=Array.isArray(t.defects)?t.defects:(Array.isArray(t.rfrAndComments)?t.rfrAndComments:[]);ds.forEach(function(d){defects.push({text:first(d,['text','description','comment'])||String(d),type:first(d,['type','defectType'])||'',dangerous:!!d.dangerous})})});
 document.getElementById('defectList').innerHTML=defects.length?defects.map(function(d){var typ=d.dangerous?'Dangerous':d.type||'Recorded defect / advisory';return '<div class="defect-item"><div class="defect-meta"><span class="defect-type">'+esc(typ)+'</span></div><p>'+esc(d.text)+'</p></div>'}).join(''):'<p class="empty-state">No defect/advisory details were returned in this response.</p>';
 liveResults.hidden=false;liveResults.scrollIntoView({behavior:'smooth',block:'start'});
}
document.getElementById('clearResults').addEventListener('click',function(){liveResults.hidden=true;document.getElementById('historyRows').innerHTML='';document.getElementById('vehicleCards').innerHTML='';document.getElementById('mileageChart').innerHTML='';document.getElementById('defectList').innerHTML='';input.focus()});
document.querySelectorAll('a[href="#reg"]').forEach(function(a){a.addEventListener('click',function(e){e.preventDefault();document.getElementById('top').scrollIntoView({behavior:'smooth'});setTimeout(function(){input.focus()},250)})});
function show(t,c){msg.className='msg'+(c?' '+c:'');msg.textContent=t}
input.addEventListener('input',function(){var v=input.value.replace(/[^a-zA-Z0-9]/g,'').toUpperCase();if(v!==input.value)input.value=v;plate.classList.remove('bad');show('','')});
function valid(r){return r.length>=2&&r.length<=7&&/[A-Z]/.test(r)&&/[0-9]/.test(r)}
function setBusy(b){busy=b;go.disabled=b;form.classList.toggle('loading',b);gotxt.textContent=b?'Checking…':'Check Vehicle';go.setAttribute('aria-busy',b)}
form.addEventListener('submit',function(e){
e.preventDefault();if(busy)return;
var r=input.value.trim().replace(/\s+/g,'').toUpperCase();input.value=r;
if(!r){plate.classList.add('bad');show('Enter a registration number to run a check.','err');input.focus();return}
if(!valid(r)){plate.classList.add('bad');show('That does not look like a UK registration number. Use letters and numbers only, for example AB12CDE.','err');input.focus();return}
if(!API_URL){show('The lookup service is not connected yet, so no result can be shown. The site owner needs to add the MOT data source.','err');return}
setBusy(true);show('Checking records…','ok');
fetch(API_URL+'?reg='+encodeURIComponent(r),{headers:{Accept:'application/json'}}).then(function(res){if(res.status===404)throw{t:'nf'};if(!res.ok)throw{t:'api'};return res.json()}).then(function(d){
if(!d||(Array.isArray(d)&&!d.length))throw{t:'nf'};renderResults(d,r);show('MOT data received for '+r+'. Check the report below.','ok')}).catch(function(x){
if(x&&x.t==='nf')show('No MOT record was found for '+r+'. Check the registration and try again. New vehicles may not have a record yet.','err');else show('The lookup could not be completed. Please try again shortly.','err')}).finally(function(){setBusy(false)})});
})();

// Page-style navigation: the Home view is shown on first load; menu links open one content section at a time.
(function(){
  var main = document.getElementById('main');
  if (!main) return;
  var home = document.getElementById('top');
  var strip = main.querySelector('.strip');
  var sections = Array.prototype.slice.call(main.querySelectorAll(':scope > section'));
  var menu = document.getElementById('menu');

  function sectionForHash(hash) {
    if (!hash || hash === '#top' || hash === '#main' || hash === '#reg') return home;
    var id;
    try { id = decodeURIComponent(hash.slice(1)); } catch(e) { id = hash.slice(1); }
    var target = document.getElementById(id);
    if (!target) return null;
    if (target === home || target.closest('section') === home) return home;
    return target.closest('section') || null;
  }

  function showPage(hash, shouldScroll) {
    var chosen = sectionForHash(hash) || home;
    sections.forEach(function(section) {
      section.classList.toggle('page-view-active', section === chosen && section !== home);
      if (section === home) section.classList.toggle('page-view-active', chosen === home);
    });
    if (strip) strip.classList.toggle('page-view-active', chosen === home);
    // Keep links that point into the visible page usable, and mark the current menu item.
    document.querySelectorAll('#menu a.l').forEach(function(link) {
      var linkSection = sectionForHash(link.getAttribute('href'));
      if (linkSection === chosen) link.setAttribute('aria-current', 'page');
      else link.removeAttribute('aria-current');
    });
    if (menu) menu.classList.remove('open');
    var burger = document.getElementById('burger');
    if (burger) {
      burger.setAttribute('aria-expanded', 'false');
      burger.setAttribute('aria-label', 'Open menu');
    }
    if (shouldScroll) {
      window.scrollTo({top:0, behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth'});
    }
  }

  // Open the correct page when a menu or footer link is clicked, and support browser Back/Forward.
  document.addEventListener('click', function(event) {
    var link = event.target.closest('a[href^="#"]');
    if (!link) return;
    var hash = link.getAttribute('href');
    if (!hash || hash === '#privacy') return;
    var chosen = sectionForHash(hash);
    if (!chosen) return;
    // Existing "Check Vehicle" links should return to Home, where the registration field lives.
    event.preventDefault();
    if (window.location.hash !== hash) history.pushState(null, '', hash);
    showPage(hash, true);
    if (hash === '#reg') {
      window.setTimeout(function(){
        var input = document.getElementById('reg');
        if (input) input.focus({preventScroll:true});
      }, 250);
    }
  });

  window.addEventListener('popstate', function(){ showPage(window.location.hash, true); });
  window.addEventListener('hashchange', function(){ showPage(window.location.hash, true); });

  // On first open, force the Home view even if the URL has no hash.
  showPage(window.location.hash || '#top', false);
})();




/* OneSignal Web Push integration. This remains inactive until a real App ID is added below
   and OneSignal's worker file is deployed at the website root over HTTPS. */
(function () {
  var ONESIGNAL_APP_ID = "YOUR_ONESIGNAL_APP_ID";
  var buttons = document.querySelectorAll("[data-push-optin]");
  var status = document.getElementById("notifyStatus");
  var ready = false;
  var loading = false;

  function say(message) {
    if (status) status.textContent = message;
    buttons.forEach(function (button) {
      if (button.id === "notifyBtnNav") button.setAttribute("aria-label", message);
    });
  }

  function setButtonsDisabled(disabled) {
    buttons.forEach(function (button) { button.disabled = disabled; });
  }

  if (!buttons.length) return;

  if (ONESIGNAL_APP_ID === "YOUR_ONESIGNAL_APP_ID") {
    say("Setup needed: connect a OneSignal App ID and upload the service-worker file before subscriptions can work.");
  } else {
    window.OneSignalDeferred = window.OneSignalDeferred || [];
    window.OneSignalDeferred.push(async function (OneSignal) {
      try {
        await OneSignal.init({
          appId: ONESIGNAL_APP_ID,
          serviceWorkerPath: "OneSignalSDKWorker.js",
          serviceWorkerParam: { scope: "/" },
          notifyButton: { enable: false }
        });
        ready = true;
        say("Notifications are ready. Tap Enable notifications to subscribe.");
      } catch (error) {
        console.error("OneSignal initialisation failed:", error);
        say("Notifications could not initialise. Check the OneSignal App ID, HTTPS and service-worker setup.");
      }
    });
  }

  buttons.forEach(function (button) {
    button.addEventListener("click", async function () {
      if (loading) return;
      if (ONESIGNAL_APP_ID === "YOUR_ONESIGNAL_APP_ID") {
        say("Notifications are not active yet. First configure OneSignal and upload OneSignalSDKWorker.js to your website root.");
        return;
      }
      if (!ready || !window.OneSignal) {
        say("Notifications are loading. Please try again in a moment.");
        return;
      }
      loading = true;
      setButtonsDisabled(true);
      try {
        if (!("Notification" in window) || !("serviceWorker" in navigator)) {
          say("This browser does not support web push notifications. Try a supported browser on HTTPS.");
          return;
        }
        if (Notification.permission === "denied") {
          say("Notifications are blocked in your browser settings. Allow them for this site, then try again.");
          return;
        }
        await window.OneSignal.Notifications.requestPermission();
        if (Notification.permission === "granted") {
          await window.OneSignal.User.PushSubscription.optIn();
          say("Thanks! Your browser has opted in. You can manage or turn off notifications in browser settings.");
        } else {
          say("No problem—you have not enabled notifications. You can choose again later.");
        }
      } catch (error) {
        console.error("Push opt-in failed:", error);
        say("We couldn't enable notifications. Please check browser permission and site setup.");
      } finally {
        loading = false;
        setButtonsDisabled(false);
      }
    });
  });
})();
