(() => {
  'use strict';

  const products = [
    {id:'caja', name:'Caja apilable', category:'Almacenamiento', size:'32 L · tapa incluida', unit:15900, wholesale:13200, art:'bin'},
    {id:'canasta', name:'Canasta organizadora', category:'Almacenamiento', size:'23 × 16 cm · ventilada', unit:5400, wholesale:4500, art:'basket'},
    {id:'cubeta', name:'Cubeta con asa', category:'Limpieza', size:'12 L · asa reforzada', unit:6900, wholesale:5800, art:'bucket'},
    {id:'jarra', name:'Jarra con tapa', category:'Cocina', size:'2 L · graduada', unit:7600, wholesale:6300, art:'jug'},
    {id:'recipiente', name:'Recipiente hermético', category:'Cocina', size:'1.2 L · transparente', unit:5900, wholesale:4900, art:'storage'},
    {id:'cesto', name:'Cesto para residuos', category:'Limpieza', size:'10 L · tapa basculante', unit:11200, wholesale:9400, art:'waste'}
  ];
  const saved = KR.load('punto-cotizacion',{});
  const quote = new Map();
  for (const product of products) {
    const quantity = Number(saved[product.id]);
    if (Number.isInteger(quantity) && quantity > 0 && quantity <= 999) quote.set(product.id,quantity);
  }
  const search = document.getElementById('product-search');
  const category = document.getElementById('product-category');
  const catalog = document.getElementById('catalog-results');
  const items = document.getElementById('quote-items');
  const download = document.getElementById('download-quote');
  const clear = document.getElementById('clear-quote');
  const priceFor = (product, quantity) => quantity >= 12 ? product.wholesale : product.unit;

  function renderCatalog() {
    const term = search.value.trim().toLocaleLowerCase('es');
    const filtered = products.filter(product => (!category.value || product.category === category.value) &&
      `${product.name} ${product.size}`.toLocaleLowerCase('es').includes(term));
    document.getElementById('product-count').textContent = filtered.length === 1 ? '1 producto encontrado' : `${filtered.length} productos encontrados`;
    catalog.innerHTML = filtered.length ? filtered.map(product => `
      <article class="catalog-card"><div class="product-art ${product.art}" aria-hidden="true"><span></span></div>
        <div class="catalog-content"><p class="branch-zone">${product.category}</p><h3>${product.name}</h3><p>${product.size}</p>
        <dl class="unit-prices"><dt>Por pieza</dt><dd>${KR.money(product.unit)}</dd><dt>Desde 12 piezas</dt><dd>${KR.money(product.wholesale)} c/u</dd></dl>
        <button type="button" class="secondary" data-add="${product.id}" aria-label="Agregar ${product.name}">Agregar a mi lista</button></div>
      </article>`).join('') : '<p class="empty-state">No encontramos productos. Prueba otra categoría o palabra.</p>';
  }

  function quoteLines() {
    return products.filter(product => quote.has(product.id)).map(product => {
      const quantity = quote.get(product.id);
      const price = priceFor(product,quantity);
      return {product, quantity, price, subtotal:price * quantity};
    });
  }

  function renderTotals(lines) {
    document.getElementById('quote-count').textContent = lines.reduce((sum, line) => sum + line.quantity,0);
    document.getElementById('quote-total').innerHTML = `<span>Total estimado</span><strong>${KR.money(lines.reduce((sum,line) => sum + line.subtotal,0))}</strong>`;
    download.disabled = clear.disabled = lines.length === 0;
  }

  function renderQuote() {
    const lines = quoteLines();
    items.innerHTML = lines.length ? lines.map(({product, quantity, price, subtotal}) => `
      <div class="quote-line"><div><h3>${product.name}</h3><p data-unit-price>${KR.money(price)} c/u${quantity >= 12 ? ' · Precio por volumen' : ''}</p>
      <button type="button" class="remove-line" data-remove="${product.id}" aria-label="Quitar ${product.name}">Quitar</button></div>
      <label class="field quantity-label">Cantidad<input data-quantity="${product.id}" aria-label="Cantidad de ${product.name}" type="number" min="1" max="999" value="${quantity}" inputmode="numeric"></label>
      <strong data-subtotal>${KR.money(subtotal)}</strong></div>`).join('') : '<p class="hint empty-quote">Tu lista está vacía. Agrega productos desde el catálogo para empezar.</p>';
    renderTotals(lines);
  }

  function saveQuote() {
    KR.save('punto-cotizacion',Object.fromEntries(quote));
  }

  search.addEventListener('input',renderCatalog);
  category.addEventListener('change',renderCatalog);
  catalog.addEventListener('click',event => {
    const button = event.target.closest('[data-add]');
    if (!button) return;
    const product = products.find(item => item.id === button.dataset.add);
    const quantity = quote.get(product.id) || 0;
    if (quantity >= 999) { KR.toast('Ya tienes 999 piezas de este producto.'); return; }
    quote.set(product.id,quantity + 1);
    saveQuote();
    renderQuote();
    KR.toast(`${product.name} agregado a tu lista.`);
  });
  function updateQuantity(field, normalize = false) {
    const id = field.dataset.quantity;
    if (!id || !quote.has(id)) return;
    const raw = Number(field.value);
    if (!normalize && (!Number.isInteger(raw) || raw < 1 || raw > 999)) return;
    const value = Math.min(999,Math.max(1,Math.trunc(raw || 1)));
    quote.set(id,value);
    saveQuote();
    if (normalize) field.value = value;
    const lines = quoteLines();
    const line = lines.find(item => item.product.id === id);
    const row = field.closest('.quote-line');
    row.querySelector('[data-unit-price]').textContent = `${KR.money(line.price)} c/u${value >= 12 ? ' · Precio por volumen' : ''}`;
    row.querySelector('[data-subtotal]').textContent = KR.money(line.subtotal);
    renderTotals(lines);
  }
  items.addEventListener('input',event => updateQuantity(event.target));
  items.addEventListener('change',event => updateQuantity(event.target,true));
  items.addEventListener('click',event => {
    const button = event.target.closest('[data-remove]');
    if (!button) return;
    quote.delete(button.dataset.remove);
    saveQuote();
    renderQuote();
    (items.querySelector('[data-quantity]') || search).focus();
  });
  clear.addEventListener('click',() => {
    quote.clear();
    saveQuote();
    renderQuote();
    KR.toast('Tu lista está vacía.');
    search.focus();
  });
  download.addEventListener('click',() => {
    const lines = quoteLines();
    if (!lines.length) return;
    const total = lines.reduce((sum,line) => sum + line.subtotal,0);
    const text = ['Plásticos Punto — Cotización de muestra','',...lines.map(({product, quantity, price, subtotal}) =>
      `${quantity} × ${product.name} · ${KR.money(price)} c/u · ${KR.money(subtotal)}`
    ),'',`Total estimado: ${KR.money(total)} MXN`,'Ejemplo ficticio. No es un pedido ni incluye envío.'].join('\n');
    KR.download('cotizacion-punto-muestra.txt',text);
  });
  renderCatalog();
  renderQuote();
})();
