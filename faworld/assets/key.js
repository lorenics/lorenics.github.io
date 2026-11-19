(function(){
  var PID='0mUxuO1-b0sQ8oHkDcVptg==',KEY='lorenics-member-v1',q=function(s){return document.querySelector(s);};
  var f=q('#kf'),inp=q('#k'),msg=q('#km'),ask=q('#ask'),done=q('#done'),M=JSON.parse(f.getAttribute('data-msg'));
  function read(){try{return JSON.parse(localStorage.getItem(KEY)||'{}')||{};}catch(e){return {};}}
  function save(o){try{localStorage.setItem(KEY,JSON.stringify(o));}catch(e){}}
  function show(ok){ask.hidden=ok;done.hidden=!ok;if(ok){var s=done.querySelector('.go');if(s)s.focus();}}
  function say(t,wait){msg.textContent=t;msg.className='msg'+(wait?' wait':'');}
  function verify(key){
    return fetch('https://api.gumroad.com/v2/licenses/verify',{method:'POST',body:new URLSearchParams({product_id:PID,license_key:key,increment_uses_count:'false'})})
      .then(function(r){return r.json();})
      .then(function(j){
        if(!j.success)return {ok:false,final:true,why:M.none};
        var p=j.purchase||{};
        if(p.refunded||p.chargebacked||p.disputed)return {ok:false,final:true,why:M.dead};
        if(p.subscription_ended_at||p.subscription_failed_at)return {ok:false,final:true,why:M.ended};
        return {ok:true};
      },function(){return {ok:false,why:M.net};});
  }
  var busy=false;
  f.addEventListener('submit',function(e){
    e.preventDefault();if(busy)return;var k=inp.value.trim();inp.classList.remove('bad');
    if(!k){say(M.empty);inp.focus();return;}
    busy=true;say(M.wait,true);
    verify(k).then(function(r){busy=false;
      if(r.ok){save({key:k,ok:true,at:Date.now()});say('');show(true);}
      else{say(r.why);inp.classList.add('bad');inp.focus();}
    });
  });
  q('#again').addEventListener('click',function(){show(false);inp.value='';say('');inp.focus();});
  var m=read();
  if(m.key){verify(m.key).then(function(r){if(r.ok){save({key:m.key,ok:true,at:Date.now()});show(true);}else if(r.final){save({});}});}
})();
