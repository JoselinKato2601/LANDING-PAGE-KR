(() => {
  'use strict';
  const menuButton=document.getElementById('menu-button'),navigation=document.getElementById('navigation');
  function closeMenu(){menuButton.setAttribute('aria-expanded','false');menuButton.setAttribute('aria-label','Abrir menú');navigation.classList.remove('is-open');}
  menuButton.addEventListener('click',()=>{const open=menuButton.getAttribute('aria-expanded')!=='true';menuButton.setAttribute('aria-expanded',String(open));menuButton.setAttribute('aria-label',open?'Cerrar menú':'Abrir menú');navigation.classList.toggle('is-open',open);});
  navigation.addEventListener('click',event=>{if(event.target.closest('a'))closeMenu();});
  document.addEventListener('click',event=>{if(!event.target.closest('.header-inner'))closeMenu();});
  document.addEventListener('keydown',event=>{if(event.key==='Escape'&&navigation.classList.contains('is-open')){closeMenu();menuButton.focus();}});
  matchMedia('(min-width:901px)').addEventListener('change',event=>{if(event.matches)closeMenu();});

  document.querySelectorAll('[data-interest]').forEach(link => link.addEventListener('click',() => {
    const field = document.getElementById('contact-service');
    field.value = link.dataset.interest;
    field.dispatchEvent(new Event('change',{bubbles:true}));
  }));
  document.querySelectorAll('[data-plan]').forEach(link => link.addEventListener('click',() => {
    const field = document.getElementById('contact-plan');
    field.value = link.dataset.plan;
    field.dispatchEvent(new Event('change',{bubbles:true}));
  }));
  document.querySelectorAll('.service').forEach(detail=>detail.addEventListener('toggle',()=>{if(detail.open)document.querySelectorAll('.service').forEach(other=>{if(other!==detail)other.open=false;});}));

  const filters=[...document.querySelectorAll('[data-filter]')],examples=[...document.querySelectorAll('.example')];
  function showExamples(category) {
    for (const filter of filters) {
      const active = filter.dataset.filter === category;
      filter.classList.toggle('active',active);
      filter.setAttribute('aria-pressed',String(active));
    }
    for (const example of examples) {
      example.hidden = category !== 'all' && !example.dataset.category.split(' ').includes(category);
    }
    const count = examples.filter(example => !example.hidden).length;
    document.getElementById('filter-status').textContent = count === 1 ? '1 ejemplo' : `${count} ejemplos`;
  }
  filters.forEach(button => button.addEventListener('click',() => showExamples(button.dataset.filter)));
  document.querySelectorAll('[data-show-examples]').forEach(link =>
    link.addEventListener('click',() => showExamples(link.dataset.showExamples))
  );
  showExamples('all');

  const form = document.getElementById('contact-form');
  const preview = document.getElementById('quote-preview');
  const quoteLink = document.getElementById('quote-whatsapp');
  const feedback = document.getElementById('contact-feedback');
  function resetPreview() {
    if (!preview.hidden) {
      preview.hidden = true;
      quoteLink.removeAttribute('href');
      feedback.textContent = 'Prepara otro mensaje para incluir tus cambios.';
    }
  }
  form.addEventListener('input',resetPreview);
  form.addEventListener('change',resetPreview);
  form.addEventListener('submit',event => {
    event.preventDefault();
    const data = new FormData(form);
    const name = data.get('name').trim();
    const message = data.get('message').trim();
    if (!name || !message) {
      feedback.textContent = 'Escribe tu nombre y un poco sobre tu idea para preparar el mensaje.';
      (name ? form.elements.message : form.elements.name).focus();
      return;
    }
    const features = data.getAll('feature');
    const text = [
      `Hola, equipo de KR. Soy ${name} y me gustaría solicitar una cotización.`,
      `Me interesa: ${data.get('service')}.`,
      `Dónde lo usaré: ${data.get('use')}.`,
      `Forma de pago: ${form.elements.plan.selectedOptions[0].textContent}.`,
      features.length ? `Funciones: ${features.join(', ')}.` : '',
      '', message
    ].filter((line,index,lines) => line || index === lines.length - 2).join('\n');
    document.getElementById('quote-text').textContent = text;
    quoteLink.href = 'https://wa.me/529618578982?text=' + encodeURIComponent(text);
    preview.hidden = false;
    feedback.textContent = 'Tu mensaje está listo para revisar.';
    quoteLink.focus();
  });
  const reduceMotion = matchMedia('(prefers-reduced-motion: reduce)');
  if ('IntersectionObserver' in window && !reduceMotion.matches) {
    const observer = new IntersectionObserver(entries => {
      for (const entry of entries) {
        if (!entry.isIntersecting) continue;
        entry.target.classList.add('scroll-enter');
        observer.unobserve(entry.target);
      }
    },{threshold:.12});
    document.querySelectorAll('main .section-heading,.example,.services-intro,.service-list,.process-list>li,.plan,.team-layout,.faq-list,.contact-form').forEach(element => observer.observe(element));
  }
  document.getElementById('year').textContent=String(new Date().getFullYear());
})();
