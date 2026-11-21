(() => {
  'use strict';

  const menu = [
    {id:'coffee', name:'Café de la casa', note:'Café de filtro, servido caliente', category:'Bebidas', photo:0, cents:4900},
    {id:'latte', name:'Latte de vainilla', note:'Espresso frío, leche y vainilla', category:'Bebidas', photo:1, cents:6800},
    {id:'bread', name:'Pan de canela', note:'Masa suave con glaseado ligero', category:'Panadería', photo:2, cents:4200},
    {id:'sandwich', name:'Sándwich de la casa', note:'Pan tostado, queso y verduras', category:'Para comer', photo:3, cents:9500}
  ];
  const pickupTimes = {
    'Miga Centro':['09:30','11:00','13:30','16:00','18:00'],
    'Miga Norte':['10:00','12:00','14:00','17:00','19:00'],
    'Miga Sur':['09:00','10:30','12:30','15:00','17:00']
  };
  const payments = {
    card:{name:'Tarjeta en la página', status:'Pago simulado en la página', help:'Al enviar al negocio se simula el pago. La prueba no pide datos de tarjeta.'},
    whatsapp:{name:'Pago acordado por WhatsApp', status:'Pago por acordar por WhatsApp', help:'El negocio puede confirmar el importe y compartir por WhatsApp la forma de pago que prefiera.'},
    transfer:{name:'Transferencia', status:'Transferencia por confirmar', help:'El negocio puede confirmar la transferencia al revisar el pedido.'}
  };
  const fulfillment = {
    pickup:{name:'Para recoger', branch:'Recoger en', direct:'Pagar al recoger', ready:'Listo para recoger', delivered:'Entregado'},
    delivery:{name:'A domicilio', branch:'Preparado en', direct:'Pagar al recibir', ready:'Listo para reparto', delivered:'Entregado'},
    dine:{name:'Comer aquí', branch:'Comer en', direct:'Pagar en el local', ready:'Listo para servir', delivered:'Servido'}
  };
  const stages = [
    {id:'received', label:'Recibido', action:'Empezar preparación'},
    {id:'preparing', label:'En preparación', action:'Marcar listo'},
    {id:'ready', label:'Listo', action:'Marcar entregado'},
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
  const fulfillmentFilter = document.getElementById('fulfillment-filter');
  const submit = document.getElementById('confirm-order');
  const whatsappButton = document.getElementById('whatsapp-order');
  const basket = document.getElementById('basket');
  const checkout = document.getElementById('order-checkout');
  const jump = document.getElementById('catalog-jump');
  const whatsapp = text => 'https://wa.me/?text=' + encodeURIComponent(text);
  let submitting = false;
  const mode = order => fulfillment[order.fulfillment] || fulfillment.pickup;
  const paymentName = order => payments[order.payment]?.name || mode(order).direct;
  const paymentStatus = order => order.paid ? 'Pago registrado en la demostración' : payments[order.payment]?.status || 'Pendiente de pago directo';

  function deliveryText(order) {
    if (order.fulfillment === 'delivery') return `Dirección: ${order.address}`;
    if (order.fulfillment === 'dine') return order.table ? `Mesa ${order.table}` : 'Mesa por elegir al llegar';
    return order.pickupTime ? `Recoger a las ${order.pickupTime} h` : '';
  }

  function stageLabel(order) {
    if (order.stage === 'ready' || order.stage === 'delivered') return mode(order)[order.stage];
    return stages.find(stage => stage.id === order.stage).label;
  }

  function readOrders() {
    const data = KR.load(storageKey,null);
    if (Array.isArray(data)) orders = data;
  }
  async function changeOrders(update) {
    const apply = () => {
      readOrders();
      if (update()) KR.save(storageKey,orders);
    };
    if (navigator.locks) await navigator.locks.request(storageKey,apply).catch(apply);
    else apply();
    renderOrders();
  }
  function lines() {
    return menu.filter(item => quantities.has(item.id)).map(item => ({...item, quantity:quantities.get(item.id)}));
  }
  const sum = items => items.reduce((total,item) => total + item.quantity * item.cents,0);
  const lineText = item => `${item.quantity} × ${item.name} · ${KR.money(item.quantity * item.cents)}`;
  function orderText(title, order) {
    return [`Café Miga · ${title} de muestra`,order.id ? `Folio: ${order.id}` : '',`Entrega: ${mode(order).name}`,`${mode(order).branch}: ${order.branch}`,deliveryText(order),
      ...order.items.map(lineText),`Total: ${KR.money(sum(order.items))}`,`Forma de pago: ${paymentName(order)}`,
      order.stage ? `Estado: ${stageLabel(order)} · ${paymentStatus(order)}` : '',
      'Demostración, sin cobro real.'].filter(Boolean).join('\n');
  }

  function orderDetails() {
    const fields = form.elements;
    const choice = fields.fulfillment.value;
    return {fulfillment:choice, branch:fields.branch.value, payment:fields.payment.value, pickupTime:choice === 'pickup' ? fields.pickupTime.value : '',
      address:choice === 'delivery' ? fields.address.value.trim() : '', table:choice === 'dine' ? fields.table.value : ''};
  }

  function renderCheckout() {
    const order = orderDetails();
    const delivery = order.fulfillment === 'delivery';
    const pickup = order.fulfillment === 'pickup';
    document.getElementById('branch-label').textContent = mode(order).branch;
    document.getElementById('address-field').hidden = !delivery;
    document.getElementById('dine-field').hidden = order.fulfillment !== 'dine';
    document.getElementById('pickup-time-field').hidden = !pickup;
    form.elements.address.required = delivery;
    form.elements.address.disabled = !delivery;
    form.elements.table.disabled = order.fulfillment !== 'dine';
    const timeSelect = form.elements.pickupTime;
    timeSelect.disabled = !pickup;
    if (timeSelect.dataset.branch !== order.branch) {
      timeSelect.replaceChildren(new Option('Lo antes posible',''), ...pickupTimes[order.branch].map(time => new Option(time,time)));
      timeSelect.dataset.branch = order.branch;
    }
    form.elements.payment.querySelector('[value="pickup"]').textContent = mode(order).direct;
    document.getElementById('payment-help').textContent = payments[order.payment]?.help || 'El cliente paga directamente al negocio.';
  }

  function renderBasket() {
    const items = lines();
    basket.innerHTML = items.length
      ? KRMenu.cart(items,'miga') + `<div class="ticket-total"><span>Total de muestra</span><strong>${KR.money(sum(items))}</strong></div>`
      : '<p class="hint">Agrega productos del menú para armar tu pedido.</p>';
    catalog.refresh();
    checkout.hidden = !items.length;
    if (checkout.hidden) checkout.open = false;
    KRMenu.updateJump(jump,items,sum(items));
    submit.disabled = whatsappButton.disabled = !items.length || submitting;
  }

  function renderOrders() {
    const visible = orders.filter(order => (!filter.value || order.stage === filter.value) &&
      (!fulfillmentFilter.value || (order.fulfillment || 'pickup') === fulfillmentFilter.value));
    document.getElementById('order-count').textContent = orders.length ? `(${orders.length})` : '';
    document.getElementById('board-status').textContent = visible.length === 1 ? '1 pedido visible' : `${visible.length} pedidos visibles`;
    list.innerHTML = visible.length ? visible.map(order => {
      const stage = stages.find(item => item.id === order.stage);
      return `<article class="flow-panel order-card" id="pedido-${order.id}">
        <div class="order-top"><div><h3>Pedido ${order.id}</h3><p>${KR.esc(order.branch)} · ${date.format(new Date(order.created))}</p></div><span class="pill ${['ready','delivered'].includes(order.stage) ? 'good' : 'warn'}">${stageLabel(order)}</span></div>
        <p class="order-fulfillment"><strong>${mode(order).name}</strong>${deliveryText(order) ? ` <span>${KR.esc(deliveryText(order))}</span>` : ''}</p>
        <ul class="ticket-lines">${order.items.map(item => `<li><span>${item.quantity} × ${KR.esc(item.name)}</span><b>${KR.money(item.quantity * item.cents)}</b></li>`).join('')}</ul>
        <div class="ticket-total"><span>${paymentName(order)}</span><strong>${KR.money(sum(order.items))}</strong></div>
        <p class="hint">${paymentStatus(order)}</p>
        <div class="flow-actions">${stage.action ? `<button type="button" class="primary" data-next="${order.id}" data-stage="${order.stage}">${order.stage === 'ready' && order.fulfillment === 'dine' ? 'Marcar servido' : stage.action}</button>` : ''}
          ${order.payment !== 'card' && !order.paid ? `<button type="button" class="secondary" data-paid="${order.id}">Registrar pago de prueba</button>` : ''}
          <button type="button" class="secondary" data-receipt="${order.id}">Ver recibo de muestra</button></div>
      </article>`;
    }).join('') : '<div class="flow-panel"><p>No hay pedidos para mostrar.</p><a class="secondary" href="#cliente">Ir al menú</a></div>';
  }

  let currentBusinessView;
  function renderView(focus = false) {
    const isBusiness = location.hash === '#negocio';
    const changedView = currentBusinessView !== isBusiness;
    currentBusinessView = isBusiness;
    document.getElementById('cliente').hidden = isBusiness;
    document.getElementById('negocio').hidden = !isBusiness;
    for (const link of document.querySelectorAll('[data-view]')) {
      if ((link.dataset.view === 'negocio') === isBusiness) link.setAttribute('aria-current','page');
      else link.removeAttribute('aria-current');
    }
    if (isBusiness) { readOrders(); renderOrders(); }
    if (focus && changedView) document.getElementById(isBusiness ? 'business-title' : 'client-title').focus();
  }

  const getQuantity = id => quantities.get(id) || 0;
  function setQuantity(id,qty) {
    if (submitting) return;
    if (qty > 0) quantities.set(id,qty);
    else quantities.delete(id);
    result.hidden = true;
    renderBasket();
  }
  const catalog = KRMenu.mount(document.getElementById('product-list'),menu,{brand:'miga',get:getQuantity,set:setQuantity,placeholder:'Busca café, pan o algo para comer'});
  KRMenu.bindQuantity(basket,getQuantity,setQuantity);
  jump.addEventListener('click',()=>document.getElementById('cart-title').focus());
  form.addEventListener('change',renderCheckout);
  form.elements.address.addEventListener('input', () => {
    const field = form.elements.address;
    field.setCustomValidity(field.value && !field.value.trim() ? 'Escribe una dirección de ejemplo.' : '');
  });
  form.addEventListener('submit',async event => {
    event.preventDefault();
    const items = lines();
    if (!items.length || submitting || !checkout.open || !event.submitter) return;
    const order = {...orderDetails(),items};
    if (event.submitter === whatsappButton) {
      const text = orderText('Pedido',order);
      const dialog = KR.modal('<div class="modal-head"><h2>Pedido para WhatsApp</h2><button class="icon-button" data-close-dialog aria-label="Cerrar borrador">×</button></div><p>Revisa el mensaje. Si decides abrir WhatsApp, podrás elegir el destinatario.</p><pre class="receipt-text"></pre><div class="flow-actions"><a class="primary" id="open-order-whatsapp" target="_blank" rel="noopener noreferrer">Abrir WhatsApp</a><button class="secondary" type="button" data-close-dialog>Volver al pedido</button></div>');
      dialog.querySelector('pre').textContent = text;
      dialog.querySelector('#open-order-whatsapp').href = whatsapp(text);
      return;
    }
    submitting = true;
    renderBasket();
    const id = 'M-' + (globalThis.crypto?.randomUUID?.().slice(0,8) ?? (Date.now().toString(36) + Math.random().toString(36).slice(2,5))).toUpperCase();
    await changeOrders(() => { orders.unshift({...order,id,stage:'received',created:Date.now()}); return true; });
    quantities.clear();
    submitting = false;
    renderBasket();
    result.innerHTML = `<strong>Pedido ${id} recibido</strong><p>${mode(order).name} · ${KR.money(sum(items))}</p><a class="secondary" href="#negocio">Ver en el negocio</a>`;
    result.hidden = false;
    result.querySelector('a').focus({preventScroll:true});
  });
  filter.addEventListener('change',renderOrders);
  fulfillmentFilter.addEventListener('change',renderOrders);
  list.addEventListener('click',async event => {
    const button = event.target.closest('[data-next],[data-paid],[data-receipt]');
    if (!button) return;
    readOrders();
    const order = orders.find(item => item.id === (button.dataset.next || button.dataset.paid || button.dataset.receipt));
    if (!order) return;
    if (button.dataset.paid) {
      await changeOrders(() => {
        const current = orders.find(item => item.id === order.id);
        if (!current || current.paid) return false;
        current.paid = true;
        return true;
      });
      document.getElementById('board-status').textContent = `Pago de prueba del pedido ${order.id} registrado.`;
      list.querySelector(`#pedido-${order.id} [data-receipt]`)?.focus({preventScroll:true});
      return;
    }
    if (button.dataset.next) {
      const expected = button.dataset.stage;
      const next = stages[stages.findIndex(stage => stage.id === expected) + 1];
      if (!next) return;
      await changeOrders(() => {
        const current = orders.find(item => item.id === order.id);
        if (current?.stage !== expected) return false;
        current.stage = next.id;
        return true;
      });
      const current = orders.find(item => item.id === order.id);
      const status = document.getElementById('board-status');
      if (current) status.textContent = `Pedido ${order.id}: ${stageLabel(current)}.`;
      (document.querySelector(`#pedido-${order.id} [data-next], #pedido-${order.id} [data-receipt]`) || filter).focus({preventScroll:true});
      return;
    }
    const text = orderText('Recibo',order);
    const dialog = KR.modal('<div class="modal-head"><h2>Recibo de muestra</h2><button class="icon-button" data-close-dialog aria-label="Cerrar recibo">×</button></div><pre class="receipt-text"></pre><div class="flow-actions"><a class="primary" id="share-receipt" target="_blank" rel="noopener noreferrer">Preparar recibo para WhatsApp</a><button class="secondary" type="button" id="save-receipt">Descargar recibo</button></div>');
    dialog.querySelector('pre').textContent = text;
    dialog.querySelector('#share-receipt').href = whatsapp(text);
    dialog.querySelector('#save-receipt').addEventListener('click',() => KR.download('recibo-' + order.id + '.txt',text));
  });
  window.addEventListener('hashchange',() => renderView(true));
  window.addEventListener('storage',event => {
    if (event.key !== 'kr-v2-' + storageKey) return;
    orders = [];
    readOrders();
    renderOrders();
  });
  readOrders();
  renderOrders();
  const requestedBranch = new URLSearchParams(location.search).get('sucursal');
  const branchNames = new Map([['centro','Miga Centro'],['norte','Miga Norte'],['sur','Miga Sur']]);
  if (branchNames.has(requestedBranch)) form.elements.branch.value = branchNames.get(requestedBranch);
  renderCheckout();
  renderBasket();
  renderView();
})();
