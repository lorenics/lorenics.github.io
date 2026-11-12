(function(){
  function done(el){var t=el.getAttribute('data-done'),o=el.getAttribute('data-label');el.textContent=t;setTimeout(function(){el.textContent=o;},2200);}
  function byHand(el,u){var i=document.createElement('input');i.value=u;i.setAttribute('readonly','');i.style.position='fixed';i.style.top='0';i.style.opacity='0';document.body.appendChild(i);i.focus();i.select();var ok=false;try{ok=document.execCommand('copy');}catch(e){}document.body.removeChild(i);if(ok)done(el);else el.textContent=u;}
  var els=document.querySelectorAll('[data-copy]');
  for(var k=0;k<els.length;k++){els[k].setAttribute('data-label',els[k].textContent);els[k].addEventListener('click',function(ev){ev.preventDefault();var el=this,u=location.origin+location.pathname;
    if(navigator.clipboard&&navigator.clipboard.writeText){navigator.clipboard.writeText(u).then(function(){done(el);},function(){byHand(el,u);});}else byHand(el,u);});}
})();
