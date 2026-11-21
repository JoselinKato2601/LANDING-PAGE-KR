(() => {
  'use strict';

  const menu = [
    {id:'enchiladas', name:'Enchiladas de la casa', detail:'Pollo, salsa verde y crema', category:'Platos fuertes', photo:0, cents:12500},
    {id:'tacos', name:'Tacos de guisado', detail:'Tres tacos con guarnición', category:'Platos fuertes', photo:1, cents:10500},
    {id:'sopa', name:'Sopa de tortilla', detail:'Aguacate, queso y chile pasilla', category:'Entradas', photo:2, cents:8500},
    {id:'jamaica', name:'Agua de jamaica', detail:'Vaso de agua fresca', category:'Bebidas', photo:3, cents:3500}
  ];
  const statuses = {
    waiting:'Por confirmar',
    kitchen:'En cocina',
    preparing:'En preparación',
    ready:'Listo para servir',
    served:'Servido'
  };
  const waiterActions = {
    waiting:{next:'kitchen', label:'Enviar a cocina'},
    ready:{next:'served', label:'Marcar servido'}
  };
  const kitchenActions = {
    kitchen:{next:'preparing', label:'Empezar preparación'},
    preparing:{next:'ready', label:'Marcar listo'}
  };
  const prefix = 'kr-laurel-order-';
  const memory = new Map();
  const form = document.getElementById('table-form');
  const productList = document.getElementById('laurel-menu');
  const basket = document.getElementById('table-basket');
  const result = document.getElementById('table-result');
  const station = document.getElementById('order-station');
  const waiterStation = document.getElementById('waiter-station');
  const kitchenStation = document.getElementById('kitchen-station');
  const tableOrders = document.getElementById('table-orders');
  const waiterOrders = document.getElementById('waiter-orders');
  const kitchenOrders = document.getElementById('kitchen-orders');
  const submit = document.getElementById('send-table-order');
  const jump = document.getElementById('catalog-jump');
  const drafts = {
    mesa:{table:'04', note:'', staff:'', quantities:new Map()},
    'tomar-pedido':{table:'04', note:'', staff:'', quantities:new Map()}
  };
  let view = 'mesa';

  function readOrders() {
    const orders = new Map(memory);
    try {
      for (const key of Object.keys(localStorage)) {
        if (!key.startsWith(prefix)) continue;
        const order = JSON.parse(localStorage.getItem(key));
        if (order?.id && statuses[order.stage] && Array.isArray(order.items)) orders.set(order.id, order);
      }
    } catch {
      // Orders created during this visit remain available when storage is blocked.
    }
    return [...orders.values()].sort((a, b) => b.created - a.created);
  }

  function saveOrder(order) {
    try {
      localStorage.setItem(prefix + order.id, JSON.stringify(order));
      memory.delete(order.id);
    } catch {
      memory.set(order.id, order);
      KR.toast('El pedido estará disponible durante esta visita.');
    }
  }

  const currency = items => KR.money(items.reduce((total, item) => total + item.cents * item.quantity, 0));

  function ticketLines(items, prices = true) {
    return `<ul class="ticket-lines">${items.map(item =>
      `<li><span>${item.quantity} × ${KR.esc(item.name)}</span>${prices ? `<b>${KR.money(item.quantity * item.cents)}</b>` : ''}</li>`
    ).join('')}</ul>`;
  }

  function renderBasket() {
    const {quantities} = drafts[view];
    const items = menu.filter(item => quantities.has(item.id)).map(item => ({...item, quantity:quantities.get(item.id)}));
    basket.innerHTML = items.length
      ? KRMenu.cart(items,'laurel') + `<div class="ticket-total"><span>Total de muestra</span><strong>${currency(items)}</strong></div>`
      : '<p class="hint">Agrega platillos o bebidas para armar el pedido.</p>';
    catalog.refresh();
    KRMenu.updateJump(jump,items,items.reduce((total,item)=>total+item.cents*item.quantity,0));
    submit.disabled = !items.length;
    return items;
  }

  function ticket(order, audience) {
    const actions = audience === 'meseros' ? waiterActions : audience === 'cocina' ? kitchenActions : {};
    const action = actions[order.stage];
    const kind = order.source === 'staff' ? 'Tomado por mesero' : 'Pedido desde la mesa';
    const color = ['ready','served'].includes(order.stage) ? 'good' : 'warn';
    const note = order.note && audience !== 'mesa' ? `<p class="kitchen-note"><strong>Indicaciones</strong> ${KR.esc(order.note)}</p>` : '';
    const staffSelect = audience === 'meseros' && order.stage !== 'served'
      ? `<label class="field">Mesero asignado<select data-staff>
          ${['','Ana','Leo'].map(staff => `<option value="${staff}" ${order.staff === staff ? 'selected' : ''}>${staff || 'Sin asignar'}</option>`).join('')}
        </select></label>`
      : '';
    return `<article class="flow-panel order-card" data-order="${KR.esc(order.id)}">
      <div class="order-top"><div><h3 tabindex="-1">Mesa ${KR.esc(order.table)}</h3><p>${KR.esc(order.id)} · ${kind}</p></div><span class="pill ${color}">${statuses[order.stage]}</span></div>
      ${ticketLines(order.items,audience !== 'cocina')}
      ${note}${staffSelect}
      ${action ? `<button class="primary station-action" type="button" data-stage="${order.stage}">${action.label}</button>` : ''}
    </article>`;
  }

  function renderStations() {
    const orders = readOrders();
    const ready = orders.filter(order => order.stage === 'ready').length;
    const waiting = orders.filter(order => order.stage === 'waiting').length;
    const kitchenPending = orders.filter(order => ['kitchen','preparing'].includes(order.stage)).length;
    document.getElementById('waiter-count').textContent = waiting + ready ? `(${waiting + ready})` : '';
    document.getElementById('kitchen-count').textContent = kitchenPending ? `(${kitchenPending})` : '';

    if (view === 'mesa') {
      const byTable = orders.filter(order => order.table === form.elements.table.value);
      tableOrders.innerHTML = byTable.length
        ? byTable.map(order => ticket(order, 'mesa')).join('')
        : '<p class="flow-panel">Todavía no hay pedidos para esta mesa.</p>';
    } else if (view === 'meseros') {
      const rank = ['ready','waiting','preparing','kitchen','served'];
      orders.sort((a,b) => rank.indexOf(a.stage) - rank.indexOf(b.stage));
      document.getElementById('waiter-status').textContent = `Por confirmar: ${waiting} · Listos para servir: ${ready}`;
      waiterOrders.innerHTML = orders.length
        ? orders.map(order => ticket(order, 'meseros')).join('')
        : '<p class="flow-panel">Aquí llegarán los pedidos de mesa y los avisos de cocina.</p>';
    } else if (view === 'cocina') {
      const tickets = orders.filter(order => ['kitchen','preparing','ready'].includes(order.stage));
      tickets.sort((a,b) => Number(a.stage === 'ready') - Number(b.stage === 'ready') || a.created - b.created);
      document.getElementById('kitchen-status').textContent = `Pendientes en cocina: ${kitchenPending}`;
      kitchenOrders.innerHTML = tickets.length
        ? tickets.map(order => ticket(order, 'cocina')).join('')
        : '<p class="flow-panel">Las comandas aparecen cuando un mesero las envía a cocina.</p>';
    }
  }

  function renderView(focus = false) {
    const route = location.hash.slice(1);
    view = ['meseros','cocina','tomar-pedido'].includes(route) ? route : 'mesa';
    const isWaiterForm = view === 'tomar-pedido';
    station.hidden = !drafts[view];
    waiterStation.hidden = view !== 'meseros';
    kitchenStation.hidden = view !== 'cocina';
    for (const link of document.querySelectorAll('[data-view]')) {
      if (link.dataset.view === (isWaiterForm ? 'meseros' : view)) link.setAttribute('aria-current','page');
      else link.removeAttribute('aria-current');
    }
    if (!station.hidden) {
      const draft = drafts[view];
      form.elements.table.value = draft.table;
      form.elements.note.value = draft.note;
      form.elements.staff.value = draft.staff;
      document.getElementById('staff-field').hidden = !isWaiterForm;
      document.getElementById('table-tracking').hidden = isWaiterForm;
      document.getElementById('station-title').textContent = isWaiterForm ? 'Tomar pedido de mesa' : 'Menú de la mesa';
      document.getElementById('table-form-title').textContent = isWaiterForm ? 'Nueva comanda' : 'Tu pedido';
      submit.textContent = isWaiterForm ? 'Enviar comanda a cocina' : 'Enviar a meseros';
      const next = document.getElementById('station-next');
      next.href = isWaiterForm ? '#cocina' : '#meseros';
      next.textContent = isWaiterForm ? 'Ver cocina' : 'Ver pedidos de meseros';
      result.hidden = true;
      renderBasket();
    }
    renderStations();
    if (focus) document.querySelector(view === 'meseros' ? '#waiter-title' : view === 'cocina' ? '#kitchen-title' : '#station-title').focus();
  }

  const getQuantity = id => drafts[view].quantities.get(id) || 0;
  function setQuantity(id,qty) {
    const quantities = drafts[view].quantities;
    if (qty) quantities.set(id, qty);
    else quantities.delete(id);
    result.hidden = true;
    renderBasket();
  }
  const catalog = KRMenu.mount(productList,menu,{brand:'laurel',get:getQuantity,set:setQuantity,placeholder:'Busca platillos o bebidas'});
  KRMenu.bindQuantity(basket,getQuantity,setQuantity);
  jump.addEventListener('click',()=>document.getElementById('table-form-title').focus());

  form.addEventListener('input', event => {
    if (event.target.name) drafts[view][event.target.name] = event.target.value;
    if (event.target.name === 'table') renderStations();
  });
  form.addEventListener('submit', event => {
    event.preventDefault();
    const items = renderBasket();
    if (!items.length) return;
    const draft = drafts[view];
    const staffOrder = view === 'tomar-pedido';
    const id = 'L-' + (globalThis.crypto?.randomUUID?.().slice(0,8) ?? (Date.now().toString(36) + Math.random().toString(36).slice(2,5))).toUpperCase();
    saveOrder({id, items, table:draft.table, note:draft.note.trim(), staff:staffOrder ? draft.staff : '', source:staffOrder ? 'staff' : 'table', stage:staffOrder ? 'kitchen' : 'waiting', created:Date.now()});
    draft.quantities.clear();
    draft.note = '';
    form.elements.note.value = '';
    renderBasket();
    renderStations();
    result.hidden = false;
    result.textContent = staffOrder ? `Comanda ${id} enviada a cocina.` : `Pedido ${id} enviado a meseros.`;
    document.getElementById('station-next').focus({preventScroll:true});
  });

  async function updateOrder(target, applyChange) {
    const origin = view;
    const id = target.closest('[data-order]').dataset.order;
    const update = () => {
      const order = readOrders().find(item => item.id === id);
      if (order && applyChange(order)) saveOrder(order);
    };
    if (navigator.locks) await navigator.locks.request(prefix + id, update).catch(update);
    else update();
    renderStations();
    if (origin !== view) return;
    const card = [...(view === 'meseros' ? waiterOrders : kitchenOrders).children].find(el => el.dataset.order === id);
    const fallback = document.getElementById(view === 'meseros' ? 'waiter-title' : 'kitchen-title');
    (card?.querySelector(target.matches('select') ? '[data-staff]' : '[data-stage]') || card?.querySelector('h3') || fallback).focus({preventScroll:true});
  }

  for (const list of [waiterOrders, kitchenOrders]) {
    list.addEventListener('click', event => {
      const button = event.target.closest('[data-stage]');
      if (!button) return;
      const expected = button.dataset.stage;
      const actions = view === 'meseros' ? waiterActions : kitchenActions;
      const next = actions[expected]?.next;
      if (!next) return;
      updateOrder(button, order => {
        if (order.stage !== expected) return false;
        order.stage = next;
        return true;
      });
    });
  }
  waiterOrders.addEventListener('change', event => {
    const staffSelect = event.target.closest('[data-staff]');
    if (!staffSelect) return;
    const staff = staffSelect.value;
    updateOrder(staffSelect, order => {
      if (order.stage === 'served') return false;
      order.staff = staff;
      return true;
    });
  });
  window.addEventListener('hashchange', () => renderView(true));
  window.addEventListener('storage', event => {
    if (event.key === null || event.key?.startsWith(prefix)) renderStations();
  });
  renderView();
})();
