(() => {
  'use strict';

  const menu = [
    {id:'coffee', name:'Café de la casa', note:'Café de filtro, servido caliente', cents:4900},
    {id:'latte', name:'Latte de vainilla', note:'Espresso, leche y vainilla', cents:6800},
    {id:'bread', name:'Pan de canela', note:'Masa suave con glaseado ligero', cents:4200},
    {id:'sandwich', name:'Sándwich de la casa', note:'Pan tostado, queso y verduras', cents:9500}
  ];
  const payments = {
    card:{name:'Tarjeta en el sitio', status:'Pago simulado en la web', help:'Aquí verás cómo quedaría el pedido pagado en línea. No se solicitan datos de tarjeta.'},
    transfer:{name:'Transferencia', status:'Por confirmar con el negocio', help:'El comercio puede compartir sus datos de pago y confirmar la transferencia.'},
    pickup:{name:'Pago al recoger', status:'Pendiente de pago al recoger', help:'El cliente paga directamente en el mostrador.'}
  };
  const stages = [
    {id:'received', label:'Recibido', action:'Empezar preparación'},
    {id:'preparing', label:'En preparación', action:'Marcar listo'},
    {id:'ready', label:'Listo para recoger', action:'Marcar entregado'},
    {id:'delivered', label:'Entregado'}
  ];
  const date = new Intl.DateTimeFormat('es-MX',{dateStyle:'short',timeStyle:'short'});
  const storageKey = 'miga-pedidos';
  const quantities = new Map();
  let orders = [];
  const form = document.getElementById('order-form');
  const list = document.getElementById('order-list');
  const result = document.getElementById('order-result');
  const filter = document.getElementById('order-filter');
  const whatsapp = text => 'https://wa.me/?text=' + encodeURIComponent(text);
  const paymentStatus = order => order.paid ? 'Pago directo registrado en la demostración' : payments[order.payment].status;

  function readOrders() {
    const data = KR.load(storageKey,null);
    if (Array.isArray(data)) orders = data;
  }
  function saveOrders() {
    KR.save(storageKey,orders);
    renderOrders();
  }
  function lines() {
    return menu.filter(item => quantities.has(item.id)).map(item => ({...item, quantity:quantities.get(item.id)}));
  }
  const sum = items => items.reduce((total,item) => total + item.quantity * item.cents,0);
  const lineText = item => `${item.quantity} × ${item.name} · ${KR.money(item.quantity * item.cents)}`;
  function orderText(title, order) {
    return [`Café Miga · ${title} de muestra`,order.id ? `Folio: ${order.id}` : '',`Recoger en: ${order.branch}`,
      ...order.items.map(lineText),`Total: ${KR.money(sum(order.items))}`,`Forma de pago: ${payments[order.payment].name}`,
      order.stage ? `Estado: ${stages.find(stage => stage.id === order.stage).label} · ${paymentStatus(order)}` : '',
      'Demostración, sin cobro real.'].filter(Boolean).join('\n');
  }

  function renderBasket() {
    const items = lines();
    document.getElementById('basket').innerHTML = items.length
      ? `<ul class="ticket-lines">${items.map(item => `<li><span>${item.quantity} × ${item.name}</span><b>${KR.money(item.quantity * item.cents)}</b></li>`).join('')}</ul><div class="ticket-total"><span>Total de muestra</span><strong>${KR.money(sum(items))}</strong></div>`
      : '<p class="hint">Agrega algo del menú para empezar.</p>';
    for (const item of menu) {
      const qty = quantities.get(item.id) || 0;
      const row = document.querySelector(`[data-product="${item.id}"]`);
      row.querySelector('output').textContent = qty;
      row.querySelector('[data-delta="-1"]').disabled = qty < 1;
      row.querySelector('[data-delta="1"]').disabled = qty >= 20;
    }
    const link = document.getElementById('whatsapp-order');
    link.hidden = !items.length;
    if (items.length) link.href = whatsapp(orderText('Pedido',{items,branch:form.elements.branch.value,payment:form.elements.payment.value}));
    else link.removeAttribute('href');
    document.getElementById('confirm-order').disabled = !items.length;
    document.getElementById('payment-help').textContent = payments[form.elements.payment.value].help;
  }

  function renderOrders() {
    const visible = orders.filter(order => !filter.value || order.stage === filter.value);
    document.getElementById('order-count').textContent = orders.length ? `(${orders.length})` : '';
    document.getElementById('board-status').textContent = visible.length === 1 ? '1 pedido visible' : `${visible.length} pedidos visibles`;
    list.innerHTML = visible.length ? visible.map(order => {
      const stage = stages.find(item => item.id === order.stage);
      return `<article class="flow-panel order-card" id="pedido-${order.id}">
        <div class="order-top"><div><h3>Pedido ${order.id}</h3><p>${KR.esc(order.branch)} · ${date.format(new Date(order.created))}</p></div><span class="pill ${order.stage === 'delivered' ? 'good' : 'warn'}">${stage.label}</span></div>
        <ul class="ticket-lines">${order.items.map(item => `<li><span>${item.quantity} × ${KR.esc(item.name)}</span><b>${KR.money(item.quantity * item.cents)}</b></li>`).join('')}</ul>
        <div class="ticket-total"><span>${payments[order.payment].name}</span><strong>${KR.money(sum(order.items))}</strong></div>
        <p class="hint">${paymentStatus(order)}</p>
        <div class="flow-actions">${stage.action ? `<button type="button" class="primary" data-next="${order.id}">${stage.action}</button>` : ''}
          ${order.payment !== 'card' && !order.paid ? `<button type="button" class="secondary" data-paid="${order.id}">Registrar pago de prueba</button>` : ''}
          <button type="button" class="secondary" data-receipt="${order.id}">Ver recibo de muestra</button></div>
      </article>`;
    }).join('') : '<div class="flow-panel"><p>Aún no hay pedidos para mostrar. Haz uno de prueba desde la vista de cliente.</p></div>';
  }

  function renderView() {
    const isBusiness = location.hash === '#negocio';
    document.getElementById('cliente').hidden = isBusiness;
    document.getElementById('negocio').hidden = !isBusiness;
    for (const link of document.querySelectorAll('[data-view]')) {
      if ((link.dataset.view === 'negocio') === isBusiness) link.setAttribute('aria-current','page');
      else link.removeAttribute('aria-current');
    }
    if (isBusiness) { readOrders(); renderOrders(); }
  }

  document.getElementById('product-list').innerHTML = menu.map(item => `<article class="menu-row" data-product="${item.id}"><div><h3>${item.name}</h3><p>${item.note}</p><strong>${KR.money(item.cents)}</strong></div><div class="stepper"><button type="button" data-delta="-1" aria-label="Quitar ${item.name}">−</button><output aria-label="Cantidad de ${item.name}">0</output><button type="button" data-delta="1" aria-label="Agregar ${item.name}">+</button></div></article>`).join('');
  document.getElementById('product-list').addEventListener('click',event => {
    const button = event.target.closest('[data-delta]');
    if (!button) return;
    const id = button.closest('[data-product]').dataset.product;
    const qty = (quantities.get(id) || 0) + Number(button.dataset.delta);
    if (qty > 0) quantities.set(id,qty);
    else quantities.delete(id);
    result.hidden = true;
    renderBasket();
    if (button.disabled) button.parentElement.querySelector('button:not(:disabled)')?.focus({preventScroll:true});
  });
  form.addEventListener('change',renderBasket);
  form.addEventListener('submit',event => {
    event.preventDefault();
    const items = lines();
    if (!items.length) return;
    readOrders();
    const id = 'M-' + (crypto.randomUUID?.().slice(0,8) || Date.now().toString(36)).toUpperCase();
    orders.unshift({id,items,branch:form.elements.branch.value,payment:form.elements.payment.value,stage:'received',created:Date.now()});
    saveOrders();
    quantities.clear();
    renderBasket();
    result.innerHTML = `<strong>Pedido ${id} recibido en la demostración</strong><p>${KR.money(sum(items))} · <a class="underlined" href="#negocio">Ver cómo llegó al negocio</a></p>`;
    result.hidden = false;
  });
  filter.addEventListener('change',renderOrders);
  list.addEventListener('click',event => {
    const button = event.target.closest('[data-next],[data-paid],[data-receipt]');
    if (!button) return;
    readOrders();
    const order = orders.find(item => item.id === (button.dataset.next || button.dataset.paid || button.dataset.receipt));
    if (!order) return;
    if (button.dataset.paid) {
      order.paid = true;
      saveOrders();
      document.getElementById('board-status').textContent = `Pago de prueba del pedido ${order.id} registrado.`;
      list.querySelector(`#pedido-${order.id} [data-receipt]`)?.focus({preventScroll:true});
      return;
    }
    if (button.dataset.next) {
      const next = stages[stages.findIndex(stage => stage.id === order.stage) + 1];
      if (!next) return;
      order.stage = next.id;
      saveOrders();
      const status = document.getElementById('board-status');
      status.textContent = `Pedido ${order.id}: ${next.label}.`;
      (document.querySelector(`#pedido-${order.id} [data-next], #pedido-${order.id} [data-receipt]`) || filter).focus({preventScroll:true});
      return;
    }
    const text = orderText('Recibo',order);
    const dialog = KR.modal('<div class="modal-head"><h2>Recibo de muestra</h2><button class="icon-button" data-close-dialog aria-label="Cerrar recibo">×</button></div><pre class="receipt-text"></pre><div class="flow-actions"><a class="primary" id="share-receipt" target="_blank" rel="noopener noreferrer">Preparar recibo para WhatsApp</a><button class="secondary" type="button" id="save-receipt">Descargar recibo</button></div>');
    dialog.querySelector('pre').textContent = text;
    dialog.querySelector('#share-receipt').href = whatsapp(text);
    dialog.querySelector('#save-receipt').addEventListener('click',() => KR.download('recibo-' + order.id + '.txt',text));
  });
  window.addEventListener('hashchange',renderView);
  window.addEventListener('storage',event => {
    if (event.key !== 'kr-v2-' + storageKey) return;
    orders = [];
    readOrders();
    renderOrders();
  });
  readOrders();
  renderOrders();
  renderBasket();
  renderView();
})();
