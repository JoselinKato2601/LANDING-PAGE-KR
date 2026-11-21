(() => {
  'use strict';
  const menuButton=document.getElementById('menu-button'),navigation=document.getElementById('navigation');
  function closeMenu(){menuButton.setAttribute('aria-expanded','false');menuButton.setAttribute('aria-label','Abrir menú');navigation.classList.remove('is-open');}
  menuButton.addEventListener('click',()=>{const open=menuButton.getAttribute('aria-expanded')!=='true';menuButton.setAttribute('aria-expanded',String(open));menuButton.setAttribute('aria-label',open?'Cerrar menú':'Abrir menú');navigation.classList.toggle('is-open',open);});
  navigation.addEventListener('click',event=>{if(event.target.closest('a'))closeMenu();});
  document.addEventListener('click',event=>{if(!event.target.closest('.header-inner'))closeMenu();});
  document.addEventListener('keydown',event=>{if(event.key==='Escape'&&navigation.classList.contains('is-open')){closeMenu();menuButton.focus();}});
  matchMedia('(min-width:901px)').addEventListener('change',event=>{if(event.matches)closeMenu();});

  const goals={
    branches: {
      title:'Una página para tus sucursales.',
      copy:'Ayuda a tus clientes a elegir qué local visitar, consultar su horario o preparar un pedido.',
      link:'examples/sucursales.html',
      label:'Ver página de sucursales',
      interest:'Dar a conocer mis sucursales'
    },
    store:{title:'Una tienda en línea.',copy:'Tus clientes pueden conocer tus productos, elegir lo que les gusta y preparar su compra.',link:'examples/moda.html',label:'Ver tienda de ejemplo',interest:'Vender mis productos'},
    inventory:{title:'Un inventario en orden.',copy:'Consulta qué productos tienes, registra lo que entra o sale y detecta qué hace falta reponer.',link:'examples/ferreteria.html',label:'Ver inventario de ejemplo',interest:'Organizar mi inventario'},
    cash:{title:'Un cierre de caja más claro.',copy:'Cuenta billetes y monedas, revisa cuánto debería haber y guarda el resultado del día.',link:'examples/caja.html',label:'Ver cierre de caja de ejemplo',interest:'Llevar mejor mis cuentas'},
    booking:{title:'Una agenda para tus clientes.',copy:'Muestra tus servicios y horarios disponibles para que reservar una cita sea más sencillo.',link:'examples/agenda.html',label:'Ver agenda de ejemplo',interest:'Administrar mis citas'}
  };
  function updateGoal(input,interactive=true){
    const goal=goals[input.value];if(!goal)return;
    document.getElementById('recommendation-title').textContent=goal.title;
    document.getElementById('recommendation-copy').textContent=goal.copy;
    const link=document.getElementById('recommendation-link');link.href=goal.link;link.replaceChildren(document.createTextNode(goal.label+' '));const caption=document.createElement('span');caption.textContent='En otra pestaña';link.append(caption);
    if(interactive){
      document.getElementById('contact-service').value=goal.interest;
      const panel=document.querySelector('.recommendation');panel.classList.remove('changed');void panel.offsetWidth;panel.classList.add('changed');
    }
  }
  document.querySelectorAll('[name="business-goal"]').forEach(input=>input.addEventListener('change',()=>updateGoal(input)));
  window.addEventListener('pageshow',()=>{const selected=document.querySelector('[name="business-goal"]:checked');if(selected)updateGoal(selected,false);});
  document.querySelectorAll('[data-interest]').forEach(link=>link.addEventListener('click',()=>{document.getElementById('contact-service').value=link.dataset.interest;}));
  document.querySelectorAll('.service').forEach(detail=>detail.addEventListener('toggle',()=>{if(detail.open)document.querySelectorAll('.service').forEach(other=>{if(other!==detail)other.open=false;});}));

  const filters=[...document.querySelectorAll('[data-filter]')],examples=[...document.querySelectorAll('.example')];
  function showExamples(category) {
    for (const filter of filters) {
      const active = filter.dataset.filter === category;
      filter.classList.toggle('active',active);
      filter.setAttribute('aria-pressed',String(active));
    }
    for (const example of examples) {
      example.hidden = category !== 'all' && example.dataset.category !== category;
    }
    const count = examples.filter(example => !example.hidden).length;
    document.getElementById('filter-status').textContent = count === 1 ? '1 ejemplo' : `${count} ejemplos`;
  }
  filters.forEach(button => button.addEventListener('click',() => showExamples(button.dataset.filter)));
  document.querySelectorAll('[data-show-examples]').forEach(link =>
    link.addEventListener('click',() => showExamples(link.dataset.showExamples))
  );
  window.addEventListener('pageshow',() => showExamples('all'));

  const form=document.getElementById('contact-form');
  form.addEventListener('submit',event=>{
    event.preventDefault();const name=form.elements.name.value.trim(),message=form.elements.message.value.trim(),feedback=document.getElementById('contact-feedback');
    if(!name||!message){feedback.textContent='Escribe tu nombre y un poco sobre tu idea para preparar el mensaje.';return;}
    const text=`Hola, equipo de KR. Soy ${name}.\nMe gustaría: ${form.elements.service.value}.\n\n${message}`;
    const href='https://wa.me/529618578982?text='+encodeURIComponent(text);window.open(href,'_blank','noopener,noreferrer');
    feedback.replaceChildren(document.createTextNode('Tu mensaje está preparado. Si WhatsApp no se abrió, '));const link=document.createElement('a');link.href=href;link.target='_blank';link.rel='noopener noreferrer';link.textContent='puedes abrirlo aquí.';feedback.append(link);
  });
  document.getElementById('year').textContent=String(new Date().getFullYear());
})();
