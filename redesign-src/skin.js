(function(){
  // New-design shell: sidebar brand, section labels, credit line. Pure DOM additions — no app logic touched.
  function build(){
    var tb=document.querySelector('#app-content>.tabbar');
    if(!tb||tb.dataset.rd)return; tb.dataset.rd='1';
    var brand=document.createElement('div');brand.className='rd-brand';
    brand.innerHTML='<img src="windsor-seal.png" alt="" width="42" height="42"><div><b>Windsor Tracker</b><small>Fall 2026</small></div>';
    tb.insertBefore(brand,tb.firstChild);
    function lbl(t,before){var d=document.createElement('div');d.className='rd-lbl';d.textContent=t;tb.insertBefore(d,before)}
    var pl=tb.querySelector('[data-tab="planner"]'), first=tb.querySelector('[data-tab="rns401"],[data-tab="msk101"],[data-tab="ghs201"],[data-tab="fbs301"]');
    var sch=tb.querySelector('[data-tab="schedule"]');
    if(first)lbl('Modules',first);
    if(sch)lbl('Tools',sch);
    var c=document.createElement('div');c.className='rd-credit';
    c.innerHTML='Created by <b>Maninder</b><br>Independent study tool — not affiliated with or endorsed by the school.';
    tb.appendChild(c);
    // collapse toggle (remembered per browser; defaults to the slim rail on small laptop windows)
    var root=document.documentElement,pref=null;
    try{pref=localStorage.getItem('rd_collapsed')}catch(e){}
    if(pref===null)pref=(window.innerWidth<1400)?'1':'0';
    if(pref==='1')root.classList.add('rd-collapsed');
    tb.querySelectorAll('.tab-btn').forEach(function(b){b.title=b.textContent.trim()});
    var t=document.createElement('button');t.type='button';t.className='rd-collapse';t.title='Collapse or expand the sidebar';
    t.innerHTML='<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M15 18l-6-6 6-6"/></svg><span>Collapse</span>';
    t.onclick=function(){var on=root.classList.toggle('rd-collapsed');try{localStorage.setItem('rd_collapsed',on?'1':'0')}catch(e){}};
    tb.appendChild(t);
  }
  if(document.readyState!=='loading')build();else document.addEventListener('DOMContentLoaded',build);
})();
