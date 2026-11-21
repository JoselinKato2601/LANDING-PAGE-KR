(() => {
  'use strict';

  const zone = document.getElementById('place-zone');
  const service = document.getElementById('place-service');
  const cards = [...document.querySelectorAll('[data-location]')];
  const locations = document.getElementById('place-locations');
  const status = document.getElementById('place-status');
  const form = document.getElementById('place-form');
  const result = document.getElementById('place-result');

  function updateActivities(preferred = form.elements.activity.value) {
    const branch = cards.find(card => card.querySelector('[data-choose]').dataset.choose === form.elements.branch.value);
    const services = branch.dataset.services.split(' ');
    for (const option of form.elements.activity.options) {
      option.hidden = option.disabled = !services.includes(option.value);
    }
    form.elements.activity.value = services.includes(preferred) ? preferred : services[0];
  }

  function filterLocations() {
    let visible = 0;
    for (const card of cards) {
      card.hidden = (zone.value && zone.value !== card.dataset.zone) ||
        (service.value && !card.dataset.services.split(' ').includes(service.value));
      if (!card.hidden) visible++;
    }
    status.textContent = visible === 0 ? 'No hay sucursales con esa combinación. Prueba otra zona o servicio.' :
      visible === 1 ? '1 sucursal encontrada' : `${visible} sucursales encontradas`;
  }

  zone.addEventListener('change',filterLocations);
  service.addEventListener('change',filterLocations);
  locations.addEventListener('click',event => {
    const link = event.target.closest('a[data-choose]');
    if (!link) return;
    form.elements.branch.value = link.dataset.choose;
    updateActivities(service.value);
    result.hidden = true;
    document.getElementById('place-request-heading').focus({preventScroll:true});
  });
  form.addEventListener('change',event=>{
    if (event.target === form.elements.branch) updateActivities();
    result.hidden = true;
  });
  form.addEventListener('submit',event => {
    event.preventDefault();
    const data = new FormData(form);
    const activity = form.elements.activity.selectedOptions[0].textContent;
    result.textContent = `${activity} en ${data.get('branch')} · ${data.get('time')}. Es una solicitud de prueba.`;
    result.hidden = false;
  });
  filterLocations();
  updateActivities();
})();
