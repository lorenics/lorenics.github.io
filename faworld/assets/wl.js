(function(){
  var URL_='https://faworld-feedback.nishihara-kento.workers.dev/w',VER='20261123-1330',KEY='faworld-waitlist-v1',q=function(s){return document.getElementById(s);};
  var f=q('wf');if(!f)return;
  var em=q('we'),msg=q('wm'),ask=q('wl-ask'),done=q('wl-done'),num=q('wn'),pos=q('wp'),btn=f.querySelector('button'),M=JSON.parse(f.getAttribute('data-msg')),busy=false;
  function say(t,wait){msg.textContent=t;msg.className='wl-m'+(wait?' wait':'');}
  function show(n){if(!f.hasAttribute('data-keep'))document.documentElement.classList.add('wl-in');ask.hidden=true;done.hidden=false;num.textContent=n?String(n):'';pos.hidden=!n;}
  function read(){try{return JSON.parse(localStorage.getItem(KEY)||'{}')||{};}catch(e){return {};}}
  function save(n){try{localStorage.setItem(KEY,JSON.stringify({ok:1,n:n}));}catch(e){}}
  var m=read();if(m.ok&&m.n)show(m.n);
  f.addEventListener('submit',function(e){
    e.preventDefault();if(busy)return;em.classList.remove('bad');
    var a=em.value.trim();
    if(!a){say(M.need);em.classList.add('bad');em.focus();return;}
    if(a.length>200||!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(a)){say(M.email);em.classList.add('bad');em.focus();return;}
    busy=true;btn.disabled=true;say(M.wait,true);
    var end=function(){busy=false;btn.disabled=false;};
    fetch(URL_,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({email:a,lang:document.documentElement.lang,page:location.pathname+location.search,ver:VER,site:q('ws').value})})
      .then(function(r){return r.json().then(function(j){return {s:r.status,j:j};},function(){return {s:r.status,j:{}};});})
      .then(function(r){end();
        if(r.j&&r.j.ok){var n=parseInt(r.j.n,10)||0;if(n)save(n);say('');show(n);return;}
        if(r.s===429){say(M.busy);return;}
        if(r.j&&r.j.why==='email'){say(M.email);em.classList.add('bad');em.focus();return;}
        say(M.net);
      },function(){end();say(M.net);});
  });
})();
