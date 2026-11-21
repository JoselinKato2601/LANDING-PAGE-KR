(() => {
  'use strict';

  const branches = [
    {id:'centro', name:'Miga Centro', location:'Zona Centro · junto a la plaza', schedule:'Lun a sáb, 8:00 a 19:00', sunday:'Dom, 9:00 a 15:00', services:['terraza','retiro','acceso'], note:'Terraza para desayunar y parada rápida para llevar.', times:['09:30','11:00','13:30','16:00','18:00']},
    {id:'norte', name:'Miga Norte', location:'Zona Norte · dentro de la galería', schedule:'Lun a sáb, 9:00 a 20:00', sunday:'Dom, 10:00 a 16:00', services:['retiro','acceso'], note:'Mostrador para recoger pedidos y mesas interiores.', times:['10:00','12:00','14:00','17:00','19:00']},
    {id:'sur', name:'Miga Sur', location:'Zona Sur · frente al parque', schedule:'Mar a sáb, 8:00 a 18:00', sunday:'Dom, 9:00 a 14:00 · Lun cerrado', services:['terraza','retiro'], note:'Una terraza tranquila para tomar café cerca del parque.', times:['09:00','10:30','12:30','15:00','17:00']}
  ];
  const serviceNames = {terraza:'Terraza', retiro:'Retiro de pedidos', acceso:'Acceso sin escalones'};
  const products = {coffee:{name:'Café de la casa', price:49},latte:{name:'Latte de vainilla', price:68},bread:{name:'Pan de canela', price:42}};
  const currency = new Intl.NumberFormat('es-MX',{style:'currency',currency:'MXN'});
  const zone = document.getElementById('zone');
  const service = document.getElementById('branch-service');
  const results = document.getElementById('branch-results');
  const pickupBranch = document.getElementById('pickup-branch');
  const pickupTime = document.getElementById('pickup-time');
  const pickupForm = document.getElementById('pickup-form');
  const summary = document.getElementById('pickup-result');

  function renderBranches() {
    const filtered = branches.filter(branch =>
      (!zone.value || branch.id === zone.value) && (!service.value || branch.services.includes(service.value))
    );
    document.getElementById('branch-count').textContent = filtered.length === 1 ? '1 sucursal encontrada' : `${filtered.length} sucursales encontradas`;
    results.innerHTML = filtered.length ? filtered.map(branch => `
      <article class="branch-card">
        <span class="branch-zone">${branch.location}</span><h3>${branch.name}</h3>
        <p>${branch.note}</p>
        <dl><dt>Horarios</dt><dd>${branch.schedule}<br>${branch.sunday}</dd></dl>
        <ul class="facility-list">${branch.services.map(value => `<li>${serviceNames[value]}</li>`).join('')}</ul>
        <a class="secondary" href="#pedido" data-branch="${branch.id}">Recoger en ${branch.name}</a>
      </article>`).join('') : '<p class="empty-state">No hay sucursales con esa combinación. Prueba otra zona o servicio.</p>';
  }

  function updateTimes() {
    const branch = branches.find(item => item.id === pickupBranch.value);
    pickupTime.replaceChildren(...branch.times.map(time => new Option(time,time)));
    summary.hidden = true;
  }

  zone.addEventListener('change',renderBranches);
  service.addEventListener('change',renderBranches);
  pickupBranch.replaceChildren(...branches.map(branch => new Option(branch.name,branch.id)));
  pickupBranch.addEventListener('change',updateTimes);
  results.addEventListener('click',event => {
    const link = event.target.closest('[data-branch]');
    if (!link) return;
    pickupBranch.value = link.dataset.branch;
    updateTimes();
    pickupBranch.focus({preventScroll:true});
  });
  pickupForm.addEventListener('input',() => { summary.hidden = true; });
  pickupForm.addEventListener('submit',event => {
    event.preventDefault();
    const data = new FormData(pickupForm);
    const branch = branches.find(item => item.id === data.get('branch'));
    const product = products[data.get('product')];
    const quantity = Number(data.get('quantity'));
    const time = data.get('time');
    if (!branch || !product || !branch.times.includes(time) || !Number.isInteger(quantity) || quantity < 1 || quantity > 12) return;
    const heading = document.createElement('strong');
    heading.textContent = 'Tu pedido de ejemplo';
    const description = document.createElement('p');
    description.textContent = `${quantity} × ${product.name} · ${branch.name}, ${time} h · ${currency.format(product.price * quantity)}`;
    summary.replaceChildren(heading,description);
    summary.hidden = false;
  });
  renderBranches();
  updateTimes();
})();
