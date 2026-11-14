(function(){
  var URL_='https://faworld-feedback.nishihara-kento.workers.dev/f',VER='20261114-1934',q=function(s){return document.querySelector(s);};
  var f=q('#fbf'),ta=q('#fm'),em=q('#fe'),msg=q('#fmsg'),ask=q('#ask'),done=q('#done'),M=JSON.parse(f.getAttribute('data-msg')),busy=false;
  var from='';try{from=new URLSearchParams(location.search).get('from')||(document.referrer?new URL(document.referrer).pathname:'');}catch(e){}
  function say(t,wait){msg.textContent=t;msg.className='msg'+(wait?' wait':'');}
  function show(ok){ask.hidden=ok;done.hidden=!ok;if(ok){var s=done.querySelector('.go');if(s)s.focus();window.scrollTo(0,0);}}
  f.addEventListener('submit',function(e){
    e.preventDefault();if(busy)return;ta.classList.remove('bad');em.classList.remove('bad');
    var m=ta.value.trim(),a=em.value.trim(),k=(f.querySelector('input[name=kind]:checked')||{}).value||'other';
    if(!m){say(M.empty);ta.classList.add('bad');ta.focus();return;}
    if(m.length>4000){say(M.long);ta.classList.add('bad');ta.focus();return;}
    if(a&&!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(a)){say(M.email);em.classList.add('bad');em.focus();return;}
    busy=true;say(M.wait,true);
    fetch(URL_,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({kind:k,message:m,email:a,lang:document.documentElement.lang,page:from,ver:VER,ua:navigator.userAgent,site:q('#fs').value})})
      .then(function(r){return r.json().then(function(j){return {s:r.status,j:j};},function(){return {s:r.status,j:{}};});})
      .then(function(r){busy=false;
        if(r.j&&r.j.ok){say('');show(true);return;}
        if(r.s===429){say(M.busy);return;}
        if(r.j&&r.j.why==='email'){say(M.email);em.classList.add('bad');return;}
        if(r.j&&r.j.why==='long'){say(M.long);ta.classList.add('bad');return;}
        say(M.net);
      },function(){busy=false;say(M.net);});
  });
  q('#again').addEventListener('click',function(){ta.value='';say('');show(false);ta.focus();});
})();
