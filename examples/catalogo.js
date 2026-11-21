(() => {
  'use strict';

  const normalize = value => value.normalize('NFD').replace(/\p{Diacritic}/gu,'').toLowerCase().trim();
  const productPhoto = (brand, item) => `<span class="catalog-photo photo-${brand} photo-${item.photo}" aria-hidden="true"></span>`;

  function quantity(item, count, max) {
    if (!count) return `<button class="primary catalog-add" type="button" data-id="${item.id}" data-step="1" aria-label="Agregar ${item.name}">Agregar</button>`;
    return `<div class="catalog-quantity">
      <button type="button" data-id="${item.id}" data-step="-1" aria-label="Quitar una unidad de ${item.name}">−</button>
      <select data-id="${item.id}" data-amount aria-label="Cantidad de ${item.name}">
        ${Array.from({length:max},(_,index)=>`<option ${count===index+1?'selected':''}>${index+1}</option>`).join('')}
      </select>
      <button type="button" data-id="${item.id}" data-step="1" aria-label="Agregar una unidad de ${item.name}" ${count >= max ? 'disabled' : ''}>+</button>
    </div>`;
  }

  function bindQuantity(container, get, set, max = 20) {
    const update = (target, value) => {
      const {id,step} = target.dataset;
      const next = Math.min(max,Math.max(0,Math.trunc(value)));
      set(id,next);
      const sameProduct = [...container.querySelectorAll('[data-id]')].filter(element => element.dataset.id === id);
      const useSameControl = sameProduct.find(element => element.dataset.step === step && !element.disabled);
      if (target !== document.activeElement && document.activeElement !== document.body) return;
      (useSameControl || sameProduct.find(element => element.hasAttribute('data-amount')) || sameProduct[0])?.focus({preventScroll:true});
    };
    container.addEventListener('click', event => {
      const button = event.target.closest('[data-step][data-id]');
      if (button) update(button,get(button.dataset.id)+Number(button.dataset.step));
    });
    container.addEventListener('change', event => {
      const select = event.target.closest('select[data-amount]');
      if (select) update(select,Number(select.value));
    });
  }

  function mount(root, items, {brand, get, set, placeholder = 'Buscar en el menú'}) {
    const categories = [...new Set(items.map(item => item.category))];
    const categoriesId = `${brand}-catalog-search`;
    root.innerHTML = `<label class="sr-only" for="${categoriesId}">Buscar en el menú</label>
      <input class="search-input catalog-search" type="search" id="${categoriesId}" placeholder="${placeholder}">
      <div class="catalog-categories" role="group" aria-label="Categorías del menú">
        ${['Todo',...categories].map((category,index)=>`<button type="button" class="secondary" data-category="${category}" aria-pressed="${index === 0}">${category}</button>`).join('')}
      </div>
      <p class="sr-only" role="status" data-menu-results></p>
      <div class="menu-catalog" data-menu-cards></div>`;
    let active = 'Todo';
    const search = root.querySelector('input[type=search]');
    const grid = root.querySelector('[data-menu-cards]');
    const status = root.querySelector('[data-menu-results]');
    const refresh = () => {
      for (const box of grid.querySelectorAll('[data-product-box]')) {
        const item = items.find(product => product.id === box.dataset.productBox);
        const count = get(item.id);
        if (box.dataset.count !== String(count)) {
          box.innerHTML = quantity(item,count,20);
          box.dataset.count = String(count);
        }
      }
    };
    const render = () => {
      const term = normalize(search.value);
      const visible = items.filter(item => (active === 'Todo' || active === item.category) &&
        normalize(`${item.name} ${item.note || item.detail}`).includes(term));
      grid.innerHTML = visible.length ? visible.map(item => `<article class="catalog-menu-card">
        ${productPhoto(brand,item)}
        <div class="catalog-menu-copy"><h3>${item.name}</h3><p>${item.note || item.detail}</p>
          <strong>${KR.money(item.cents)}</strong><div class="catalog-buy" data-product-box="${item.id}"></div>
        </div></article>`).join('') : '<p class="catalog-no-results">No encontramos ese producto. Prueba otra búsqueda o categoría.</p>';
      status.textContent = visible.length === 1 ? '1 producto' : `${visible.length} productos`;
      refresh();
    };
    root.querySelector('.catalog-categories').addEventListener('click', event => {
      const button = event.target.closest('[data-category]');
      if (!button) return;
      active = button.dataset.category;
      for (const item of root.querySelectorAll('[data-category]')) item.setAttribute('aria-pressed',String(button===item));
      render();
    });
    search.addEventListener('input',render);
    bindQuantity(grid,get,set);
    render();
    return {refresh};
  }

  function cart(items,brand) {
    return `<ul class="catalog-cart">${items.map(item=>`<li class="catalog-cart-item">
      ${productPhoto(brand,item)}<div><strong>${item.quantity} × ${item.name}</strong><span>${KR.money(item.cents*item.quantity)}</span>${quantity(item,item.quantity,20)}</div>
    </li>`).join('')}</ul>`;
  }

  function updateJump(button, items, total) {
    const count = items.reduce((sum,item)=>sum+item.quantity,0);
    button.hidden = !count;
    button.querySelector('span').textContent = count === 1 ? '1 artículo' : `${count} artículos`;
    button.querySelector('strong').textContent = KR.money(total);
  }

  window.KRMenu = {mount, bindQuantity, cart, updateJump};
})();
