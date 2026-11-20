(() => {
  'use strict';
  const moneyFormat = new Intl.NumberFormat('es-MX',{style:'currency',currency:'MXN'});
  const esc = value => String(value??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  let timer,returnFocus;
  const dialog=document.getElementById('app-dialog');
  dialog.addEventListener('click',e=>{if(e.target===dialog||e.target.closest('[data-close-dialog]'))dialog.close();});
  dialog.addEventListener('close',()=>{if(returnFocus?.isConnected)returnFocus.focus({preventScroll:true});});
  document.addEventListener('click',e=>{const button=e.target.closest('[data-menu]');if(button){const menu=document.querySelector('.app-sidebar');if(menu){const open=menu.classList.toggle('is-open');button.setAttribute('aria-expanded',String(open));}}});
  window.KR = {
    esc, money:cents=>moneyFormat.format(cents/100),
    cents:value=>{const n=Number(value);if(!Number.isFinite(n))return 0;const [c,e='0']=String(Math.max(0,Math.min(999999999,n))).split('e');return Math.round(Number(`${c}e${Number(e)+2}`));},
    load(key,fallback){try{const data=JSON.parse(localStorage.getItem('kr-v2-'+key));return data??structuredClone(fallback);}catch{return structuredClone(fallback);}},
    save(key,value){try{localStorage.setItem('kr-v2-'+key,JSON.stringify(value));}catch{this.toast('Tu navegador no permite guardar cambios. Puedes seguir probando durante esta visita.');}},
    toast(message){const node=document.getElementById('toast');clearTimeout(timer);node.textContent=message;node.classList.add('visible');timer=setTimeout(()=>node.classList.remove('visible'),4500);},
    modal(html){if(!dialog.open)returnFocus=document.activeElement;dialog.className="";dialog.innerHTML=html;if(!dialog.open)dialog.showModal();return dialog;},
    close(){dialog.close();},
    download(name,content,mime='text/plain;charset=utf-8'){const url=URL.createObjectURL(new Blob([content],{type:mime}));const a=document.createElement('a');a.href=url;a.download=name;document.body.append(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),1500);this.toast('Reporte preparado. Revisa las descargas de tu navegador.');},
    csv(rows){return '\uFEFF'+rows.map(row=>row.map(v=>{const s=String(v);return '"'+(/^[=+\-@\t\r]/.test(s)?"'":'')+s.replace(/"/g,'""')+'"';}).join(',')).join('\r\n');},
    focus(selector){document.querySelector(selector)?.focus({preventScroll:true});},
    dayKey(d){return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;},
    dayLabel(key,options={weekday:'long',day:'numeric',month:'long'}){return new Intl.DateTimeFormat('es-MX',options).format(new Date(key+'T12:00:00'));},
    reset(action){const node=this.modal('<div class="modal-head"><div><span class="overline">DATOS DE EJEMPLO</span><h2>¿Empezar de nuevo?</h2></div><button class="icon-button" data-close-dialog aria-label="Cerrar">×</button></div><p>Se restaurarán los datos iniciales de este negocio ficticio en tu navegador.</p><div class="modal-actions"><button class="secondary" data-close-dialog>Conservar cambios</button><button class="primary" id="confirm-reset">Restablecer ejemplo</button></div>');node.querySelector('#confirm-reset').onclick=()=>{this.close();action();this.toast('Ejemplo restablecido.');};}
  };
})();
