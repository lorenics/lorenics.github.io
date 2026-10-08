/* Two continuous rows; original labels remain readable with motion/JS disabled. */
(()=>{
 document.querySelectorAll('[data-people-strip]').forEach(section=>{
  const rows=[...section.querySelectorAll('.home-people-track')].map(track=>({track,viewport:track.parentElement,source:track.querySelector('ul'),entries:[...track.querySelector('ul').children].map(node=>node.cloneNode(true))}));
  const button=section.querySelector('.home-people-toggle');
  const reduced=matchMedia('(prefers-reduced-motion: reduce)');
  let paused=false,lastWidth=0;
  function rebuild(){
   section.classList.remove('is-animated');button.hidden=true;
   for(const {track,viewport,source,entries} of rows){
    track.replaceChildren(source);source.replaceChildren(...entries.map(node=>node.cloneNode(true)));
    if(reduced.matches||!viewport.clientWidth||!entries.length)continue;
    while(source.getBoundingClientRect().width<viewport.clientWidth){for(const entry of entries)source.append(entry.cloneNode(true));}
    const repeated=source.cloneNode(true);repeated.inert=true;track.append(repeated);
    track.style.setProperty('--people-duration',`${source.getBoundingClientRect().width/36}s`);
   }
   if(!reduced.matches&&rows.some(row=>row.entries.length)){section.classList.add('is-animated');button.hidden=false;}
   section.classList.toggle('is-paused',paused);
  }
  button.addEventListener('click',()=>{paused=!paused;section.classList.toggle('is-paused',paused);button.setAttribute('aria-pressed',String(paused));button.textContent=paused?'再生する':'一時停止';});
  reduced.addEventListener('change',rebuild);
  new ResizeObserver(()=>{const width=section.clientWidth;if(width!==lastWidth){lastWidth=width;rebuild();}}).observe(section);
  document.fonts.ready.then(rebuild);
 });
})();
