(() => {
  'use strict';

  const keys = ['opening','cash','card','transfer','withdrawals','counted'];
  const scenarios = {
    balanced:{shift:'Mañana',opening:500,cash:2350,card:1540,transfer:680,withdrawals:200,counted:2650},
    short:{shift:'Tarde',opening:400,cash:1480,card:940,transfer:520,withdrawals:150,counted:1680},
    over:{shift:'Noche',opening:300,cash:980,card:875,transfer:310,withdrawals:125,counted:1175}
  };
  const saved = KR.load('miga-cortes',[]);
  const cuts = Array.isArray(saved) ? saved : [];
  const form = document.getElementById('cut-form');
  const download = document.getElementById('export-cuts');
  const dateLabel = new Intl.DateTimeFormat('es-MX',{dateStyle:'short',timeStyle:'short'});
  const result = document.getElementById('save-result');

  function totals(data) {
    const expected = data.opening + data.cash - data.withdrawals;
    return {...data, expected, sales:data.cash + data.card + data.transfer, difference:data.counted - expected};
  }

  function readTurn() {
    const data = {shift:form.elements.shift.value};
    for (const key of keys) data[key] = KR.cents(form.elements[key].value);
    return totals(data);
  }

  function describe(difference) {
    if (difference === 0) return 'La caja cuadra';
    return `${difference < 0 ? 'Faltan' : 'Sobran'} ${KR.money(Math.abs(difference))}`;
  }

  function paintTurn() {
    const cut = readTurn();
    document.getElementById('sales-total').textContent = KR.money(cut.sales);
    document.getElementById('cash-expected').textContent = KR.money(cut.expected);
    document.getElementById('cash-counted').textContent = KR.money(cut.counted);
    const difference = document.getElementById('cash-difference');
    difference.textContent = cut.expected < 0 ? 'Revisa las salidas: superan el efectivo disponible.' : describe(cut.difference);
    difference.dataset.state = cut.expected < 0 || cut.difference < 0 ? 'short' : cut.difference > 0 ? 'over' : 'balanced';
  }

  function paintSaved() {
    document.getElementById('saved-cuts').innerHTML = cuts.length
      ? `<div class="saved-list">${cuts.map(cut => `<article class="flow-panel saved-cut"><h3>${KR.esc(cut.shift)}</h3><p>${dateLabel.format(new Date(cut.created))} · ${KR.money(cut.sales)} en ventas</p><strong>${describe(cut.difference)}</strong></article>`).join('')}</div>`
      : '<p class="empty-state">Aún no hay cortes guardados.</p>';
    download.disabled = !cuts.length;
  }

  for (const button of document.querySelectorAll('[data-scenario]')) {
    button.addEventListener('click',() => {
      const scenario = scenarios[button.dataset.scenario];
      for (const key of ['shift',...keys]) form.elements[key].value = scenario[key];
      result.textContent = `Cargaste el turno de ${scenario.shift.toLowerCase()}.`;
      paintTurn();
    });
  }
  form.addEventListener('input',() => { result.textContent = ''; paintTurn(); });
  form.addEventListener('submit',event => {
    event.preventDefault();
    const cut = readTurn();
    if (cut.expected < 0) {
      result.textContent = 'Corrige las salidas de efectivo antes de guardar.';
      form.elements.withdrawals.focus();
      return;
    }
    cuts.unshift({...cut,created:Date.now()});
    KR.save('miga-cortes',cuts);
    paintSaved();
    result.textContent = `Corte de ${cut.shift.toLowerCase()} guardado. ${describe(cut.difference)}.`;
  });
  download.addEventListener('click',() => {
    const data = [['Fecha','Turno','Fondo inicial','Ventas efectivo','Ventas tarjeta','Transferencias','Salidas efectivo','Efectivo esperado','Efectivo contado','Diferencia'],
      ...cuts.map(cut => [dateLabel.format(new Date(cut.created)),cut.shift,...keys.slice(0,5).map(key => (cut[key]/100).toFixed(2)),(cut.expected/100).toFixed(2),(cut.counted/100).toFixed(2),(cut.difference/100).toFixed(2)])];
    KR.download('cortes-de-caja-muestra.csv',KR.csv(data),'text/csv;charset=utf-8');
  });
  paintTurn();
  paintSaved();
})();
