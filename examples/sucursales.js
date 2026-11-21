(() => {
  'use strict';

  const branches = [
    {id:'centro', name:'Miga Centro', location:'Zona Centro · junto a la plaza', schedule:'Lun a sáb, 8:00 a 19:00', sunday:'Dom, 9:00 a 15:00', services:['terraza','retiro','acceso'], note:'Terraza para desayunar y parada rápida para llevar.'},
    {id:'norte', name:'Miga Norte', location:'Zona Norte · dentro de la galería', schedule:'Lun a sáb, 9:00 a 20:00', sunday:'Dom, 10:00 a 16:00', services:['retiro','acceso'], note:'Mostrador para recoger pedidos y mesas interiores.'},
    {id:'sur', name:'Miga Sur', location:'Zona Sur · frente al parque', schedule:'Mar a sáb, 8:00 a 18:00', sunday:'Dom, 9:00 a 14:00 · Lun cerrado', services:['terraza','retiro'], note:'Una terraza tranquila para tomar café cerca del parque.'}
  ];
  const serviceNames = {terraza:'Terraza', retiro:'Retiro de pedidos', acceso:'Acceso sin escalones'};
  const zone = document.getElementById('zone');
  const service = document.getElementById('branch-service');
  const results = document.getElementById('branch-results');
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
        <a class="secondary" href="pedidos.html?sucursal=${branch.id}#cliente">Recoger en ${branch.name}</a>
      </article>`).join('') : '<p class="empty-state">No hay sucursales con esa combinación. Prueba otra zona o servicio.</p>';
  }

  zone.addEventListener('change',renderBranches);
  service.addEventListener('change',renderBranches);
  renderBranches();
})();
