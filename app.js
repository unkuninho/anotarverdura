const STORAGE = {
  vegetables: 'verduras_v1',
  activeSession: 'verduras_active_session_v1',
  history: 'verduras_history_v1'
};

const DEFAULT_VEGETABLES = [
  { id: 'salsa', name: 'Salsa', fixed: true },
  { id: 'salsa-crespa', name: 'Salsa crespa', fixed: true },
  { id: 'alface-americana', name: 'Alface americana', fixed: true },
  { id: 'alface-roxa', name: 'Alface roxa', fixed: true }
];

const state = {
  vegetables: loadVegetables(),
  session: loadJSON(STORAGE.activeSession, null),
  selectedVegetableId: null,
  selectedUnit: 'Caixa',
  editingItemId: null
};

const els = {
  startView: document.querySelector('#startView'),
  sessionView: document.querySelector('#sessionView'),
  resultView: document.querySelector('#resultView'),
  sessionDate: document.querySelector('#sessionDate'),
  startSessionBtn: document.querySelector('#startSessionBtn'),
  activeDateLabel: document.querySelector('#activeDateLabel'),
  cancelSessionBtn: document.querySelector('#cancelSessionBtn'),
  vegetableGrid: document.querySelector('#vegetableGrid'),
  quickAddVegetableBtn: document.querySelector('#quickAddVegetableBtn'),
  orderList: document.querySelector('#orderList'),
  emptyOrder: document.querySelector('#emptyOrder'),
  itemCountBadge: document.querySelector('#itemCountBadge'),
  finishSessionBtn: document.querySelector('#finishSessionBtn'),
  resultText: document.querySelector('#resultText'),
  copyResultBtn: document.querySelector('#copyResultBtn'),
  newSessionBtn: document.querySelector('#newSessionBtn'),
  resultHistoryBtn: document.querySelector('#resultHistoryBtn'),
  quantityModal: document.querySelector('#quantityModal'),
  quantityTitle: document.querySelector('#quantityTitle'),
  unitSelector: document.querySelector('#unitSelector'),
  quantityInput: document.querySelector('#quantityInput'),
  qtyUnitLabel: document.querySelector('#qtyUnitLabel'),
  minusQtyBtn: document.querySelector('#minusQtyBtn'),
  plusQtyBtn: document.querySelector('#plusQtyBtn'),
  quickQtyButtons: document.querySelector('#quickQtyButtons'),
  addToOrderBtn: document.querySelector('#addToOrderBtn'),
  settingsModal: document.querySelector('#settingsModal'),
  openSettingsBtn: document.querySelector('#openSettingsBtn'),
  settingsVegetableList: document.querySelector('#settingsVegetableList'),
  vegetableForm: document.querySelector('#vegetableForm'),
  newVegetableName: document.querySelector('#newVegetableName'),
  historyModal: document.querySelector('#historyModal'),
  openHistoryBtn: document.querySelector('#openHistoryBtn'),
  historyList: document.querySelector('#historyList'),
  toast: document.querySelector('#toast')
};

init();

function init() {
  els.sessionDate.value = todayISO();
  bindEvents();
  renderVegetables();
  renderSettingsVegetables();

  if (state.session && state.session.status === 'open') {
    showSessionView();
  } else {
    showStartView();
  }
}

function bindEvents() {
  els.startSessionBtn.addEventListener('click', startSession);
  els.cancelSessionBtn.addEventListener('click', cancelSession);
  els.finishSessionBtn.addEventListener('click', finishSession);
  els.copyResultBtn.addEventListener('click', () => copyText(els.resultText.value));
  els.newSessionBtn.addEventListener('click', resetToNewSession);
  els.resultHistoryBtn.addEventListener('click', openHistory);

  els.openSettingsBtn.addEventListener('click', openSettings);
  els.quickAddVegetableBtn.addEventListener('click', openSettings);
  document.querySelector('.close-settings').addEventListener('click', closeSettings);
  document.querySelector('.close-history').addEventListener('click', closeHistory);
  document.querySelector('.close-modal').addEventListener('click', closeQuantityModal);

  els.openHistoryBtn.addEventListener('click', openHistory);

  els.vegetableForm.addEventListener('submit', addVegetable);
  els.unitSelector.addEventListener('click', selectUnit);
  els.minusQtyBtn.addEventListener('click', () => changeQuantity(-1));
  els.plusQtyBtn.addEventListener('click', () => changeQuantity(1));
  els.addToOrderBtn.addEventListener('click', addOrUpdateOrderItem);

  [els.quantityModal, els.settingsModal, els.historyModal].forEach(modal => {
    modal.addEventListener('click', (event) => {
      if (event.target === modal) modal.classList.add('hidden');
    });
  });

  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape') {
      els.quantityModal.classList.add('hidden');
      els.settingsModal.classList.add('hidden');
      els.historyModal.classList.add('hidden');
    }
  });
}

function startSession() {
  const date = els.sessionDate.value || todayISO();
  state.session = {
    id: cryptoRandomId(),
    date,
    createdAt: new Date().toISOString(),
    status: 'open',
    items: []
  };
  persistSession();
  showSessionView();
  showToast('Sessão iniciada!');
}

function cancelSession() {
  if (!state.session) return;
  const hasItems = state.session.items.length > 0;
  const confirmed = window.confirm(hasItems ? 'Cancelar a sessão e apagar os itens lançados?' : 'Cancelar esta sessão?');
  if (!confirmed) return;

  state.session = null;
  localStorage.removeItem(STORAGE.activeSession);
  showStartView();
}

function showStartView() {
  els.startView.classList.remove('hidden');
  els.sessionView.classList.add('hidden');
  els.resultView.classList.add('hidden');
  els.sessionDate.value = todayISO();
}

function showSessionView() {
  els.startView.classList.add('hidden');
  els.sessionView.classList.remove('hidden');
  els.resultView.classList.add('hidden');
  els.activeDateLabel.textContent = `• ${formatDate(state.session.date)}`;
  renderVegetables();
  renderOrder();
}

function renderVegetables() {
  els.vegetableGrid.innerHTML = '';
  state.vegetables.forEach((vegetable) => {
    const totalEntries = state.session?.items?.filter(item => item.vegetableId === vegetable.id).length || 0;
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'vegetable-card';
    button.innerHTML = `
      <span class="veg-icon">🥬</span>
      <strong>${escapeHTML(vegetable.name)}</strong>
      <small>${totalEntries ? `${totalEntries} lançamento${totalEntries > 1 ? 's' : ''}` : 'Toque para adicionar'}</small>
    `;
    button.addEventListener('click', () => openQuantityModal(vegetable.id));
    els.vegetableGrid.appendChild(button);
  });
}

function openQuantityModal(vegetableId, itemId = null) {
  const vegetable = state.vegetables.find(v => v.id === vegetableId);
  if (!vegetable) return;

  state.selectedVegetableId = vegetableId;
  state.editingItemId = itemId;
  els.quantityTitle.textContent = vegetable.name;

  if (itemId) {
    const item = state.session.items.find(i => i.id === itemId);
    state.selectedUnit = item.unit;
    els.quantityInput.value = item.quantity;
    els.addToOrderBtn.textContent = 'Salvar alteração';
  } else {
    state.selectedUnit = 'Caixa';
    els.quantityInput.value = 1;
    els.addToOrderBtn.textContent = 'Adicionar à lista';
  }

  updateUnitUI();
  els.quantityModal.classList.remove('hidden');
}

function closeQuantityModal() {
  els.quantityModal.classList.add('hidden');
  state.editingItemId = null;
}

function selectUnit(event) {
  const button = event.target.closest('[data-unit]');
  if (!button) return;
  state.selectedUnit = button.dataset.unit;
  els.quantityInput.value = state.selectedUnit === 'ML' ? 100 : 1;
  updateUnitUI();
}

function updateUnitUI() {
  document.querySelectorAll('#unitSelector [data-unit]').forEach(button => {
    button.classList.toggle('active', button.dataset.unit === state.selectedUnit);
  });

  const isML = state.selectedUnit === 'ML';
  els.quantityInput.step = isML ? '50' : '1';
  els.quantityInput.min = isML ? '50' : '1';
  els.qtyUnitLabel.textContent = unitLabel(state.selectedUnit, Number(els.quantityInput.value));

  const quickValues = isML ? [100, 250, 500, 750, 1000] : [1, 2, 3, 5, 10];
  els.quickQtyButtons.innerHTML = '';
  quickValues.forEach(value => {
    const button = document.createElement('button');
    button.type = 'button';
    button.textContent = `${value}`;
    button.addEventListener('click', () => {
      els.quantityInput.value = value;
      syncQuantityLabel();
    });
    els.quickQtyButtons.appendChild(button);
  });
}

function changeQuantity(direction) {
  const step = state.selectedUnit === 'ML' ? 50 : 1;
  const min = step;
  const current = Number(els.quantityInput.value) || min;
  els.quantityInput.value = Math.max(min, current + (direction * step));
  syncQuantityLabel();
}

els.quantityInput.addEventListener('input', syncQuantityLabel);

function syncQuantityLabel() {
  els.qtyUnitLabel.textContent = unitLabel(state.selectedUnit, Number(els.quantityInput.value));
}

function addOrUpdateOrderItem() {
  if (!state.session) return;
  const quantity = Number(els.quantityInput.value);
  if (!Number.isFinite(quantity) || quantity <= 0) {
    showToast('Informe uma quantidade válida.');
    return;
  }

  const wasEditing = Boolean(state.editingItemId);

  if (state.editingItemId) {
    const item = state.session.items.find(i => i.id === state.editingItemId);
    if (item) {
      item.unit = state.selectedUnit;
      item.quantity = quantity;
    }
  } else {
    const sameItem = state.session.items.find(item =>
      item.vegetableId === state.selectedVegetableId && item.unit === state.selectedUnit
    );

    if (sameItem) {
      sameItem.quantity += quantity;
    } else {
      state.session.items.push({
        id: cryptoRandomId(),
        vegetableId: state.selectedVegetableId,
        vegetableName: state.vegetables.find(v => v.id === state.selectedVegetableId)?.name || 'Verdura',
        unit: state.selectedUnit,
        quantity
      });
    }
  }

  persistSession();
  renderOrder();
  renderVegetables();
  closeQuantityModal();
  showToast(wasEditing ? 'Item atualizado.' : 'Adicionado à lista.');
}

function renderOrder() {
  if (!state.session) return;
  els.orderList.innerHTML = '';
  const items = state.session.items;
  els.emptyOrder.classList.toggle('hidden', items.length > 0);
  els.finishSessionBtn.disabled = items.length === 0;
  els.itemCountBadge.textContent = `${items.length} ${items.length === 1 ? 'item' : 'itens'}`;

  items.forEach(item => {
    const vegetable = state.vegetables.find(v => v.id === item.vegetableId);
    if (!vegetable) return;
    const row = document.createElement('div');
    row.className = 'order-item';
    row.innerHTML = `
      <div class="order-item-main">
        <strong>${escapeHTML(vegetable.name)}</strong>
        <span>${formatQuantity(item.quantity, item.unit)}</span>
      </div>
      <div class="order-actions">
        <button class="mini-icon-btn edit-item" type="button" aria-label="Editar">✏️</button>
        <button class="mini-icon-btn danger remove-item" type="button" aria-label="Remover">🗑️</button>
      </div>
    `;
    row.querySelector('.edit-item').addEventListener('click', () => openQuantityModal(item.vegetableId, item.id));
    row.querySelector('.remove-item').addEventListener('click', () => removeOrderItem(item.id));
    els.orderList.appendChild(row);
  });
}

function removeOrderItem(itemId) {
  state.session.items = state.session.items.filter(item => item.id !== itemId);
  persistSession();
  renderOrder();
  renderVegetables();
}

function finishSession() {
  if (!state.session || state.session.items.length === 0) return;
  const finished = {
    ...state.session,
    status: 'finished',
    finishedAt: new Date().toISOString()
  };

  const history = loadJSON(STORAGE.history, []);
  history.unshift(finished);
  localStorage.setItem(STORAGE.history, JSON.stringify(history.slice(0, 100)));

  const generated = generateList(finished);
  els.resultText.value = generated;
  state.session = null;
  localStorage.removeItem(STORAGE.activeSession);

  els.startView.classList.add('hidden');
  els.sessionView.classList.add('hidden');
  els.resultView.classList.remove('hidden');
}

function generateList(session) {
  const lines = [
    `🥬 VERDURAS — ${formatDate(session.date)}`,
    ''
  ];

  const items = [...session.items].sort((a, b) => {
    const nameA = state.vegetables.find(v => v.id === a.vegetableId)?.name || '';
    const nameB = state.vegetables.find(v => v.id === b.vegetableId)?.name || '';
    return nameA.localeCompare(nameB, 'pt-BR');
  });

  items.forEach(item => {
    const vegetable = state.vegetables.find(v => v.id === item.vegetableId);
    const fallbackName = item.vegetableName || 'Verdura';
    lines.push(`• ${vegetable?.name || fallbackName}: ${formatQuantity(item.quantity, item.unit)}`);
  });

  lines.push('', `Total de lançamentos: ${items.length}`);
  return lines.join('\n');
}

async function copyText(text) {
  try {
    await navigator.clipboard.writeText(text);
  } catch {
    const helper = document.createElement('textarea');
    helper.value = text;
    helper.style.position = 'fixed';
    helper.style.opacity = '0';
    document.body.appendChild(helper);
    helper.select();
    document.execCommand('copy');
    helper.remove();
  }
  showToast('Lista copiada!');
}

function resetToNewSession() {
  els.resultText.value = '';
  showStartView();
}

function openSettings() {
  renderSettingsVegetables();
  els.settingsModal.classList.remove('hidden');
  setTimeout(() => els.newVegetableName.focus(), 80);
}

function closeSettings() {
  els.settingsModal.classList.add('hidden');
}

function addVegetable(event) {
  event.preventDefault();
  const name = normalizeName(els.newVegetableName.value);
  if (!name) return;

  const duplicate = state.vegetables.some(v => v.name.toLocaleLowerCase('pt-BR') === name.toLocaleLowerCase('pt-BR'));
  if (duplicate) {
    showToast('Essa verdura já está cadastrada.');
    return;
  }

  state.vegetables.push({ id: slugWithId(name), name, fixed: false });
  saveVegetables();
  els.newVegetableName.value = '';
  renderVegetables();
  renderSettingsVegetables();
  showToast(`${name} cadastrada.`);
}

function renderSettingsVegetables() {
  els.settingsVegetableList.innerHTML = '';
  state.vegetables.forEach(vegetable => {
    const row = document.createElement('div');
    row.className = 'settings-item';
    row.innerHTML = `<span>🥬 ${escapeHTML(vegetable.name)}</span>`;

    const remove = document.createElement('button');
    remove.type = 'button';
    remove.className = 'mini-icon-btn danger';
    remove.textContent = '🗑️';
    remove.setAttribute('aria-label', `Remover ${vegetable.name}`);
    remove.addEventListener('click', () => removeVegetable(vegetable.id));
    row.appendChild(remove);
    els.settingsVegetableList.appendChild(row);
  });
}

function removeVegetable(id) {
  const vegetable = state.vegetables.find(v => v.id === id);
  if (!vegetable) return;
  const usedInOpenSession = state.session?.items?.some(item => item.vegetableId === id);
  if (usedInOpenSession) {
    showToast('Remova essa verdura da lista do dia antes de excluir o cadastro.');
    return;
  }
  if (!window.confirm(`Remover “${vegetable.name}” do cadastro?`)) return;
  state.vegetables = state.vegetables.filter(v => v.id !== id);
  saveVegetables();
  renderVegetables();
  renderSettingsVegetables();
}

function openHistory() {
  renderHistory();
  els.historyModal.classList.remove('hidden');
}

function closeHistory() {
  els.historyModal.classList.add('hidden');
}

function renderHistory() {
  const history = loadJSON(STORAGE.history, []);
  els.historyList.innerHTML = '';

  if (history.length === 0) {
    els.historyList.innerHTML = '<div class="empty-state"><span>📅</span><p>Nenhuma sessão finalizada ainda.</p></div>';
    return;
  }

  history.forEach(session => {
    const row = document.createElement('div');
    row.className = 'history-item';
    row.innerHTML = `
      <div class="history-meta">
        <strong>${formatDate(session.date)}</strong>
        <span>${session.items.length} ${session.items.length === 1 ? 'item' : 'itens'}</span>
      </div>
      <div class="history-actions">
        <button class="mini-icon-btn history-copy" type="button" aria-label="Copiar lista">📋</button>
        <button class="mini-icon-btn danger history-delete" type="button" aria-label="Excluir registro">🗑️</button>
      </div>
    `;
    row.querySelector('.history-copy').addEventListener('click', () => copyText(generateList(session)));
    row.querySelector('.history-delete').addEventListener('click', () => deleteHistorySession(session.id));
    els.historyList.appendChild(row);
  });
}

function deleteHistorySession(id) {
  if (!window.confirm('Excluir este registro do histórico?')) return;
  const history = loadJSON(STORAGE.history, []).filter(session => session.id !== id);
  localStorage.setItem(STORAGE.history, JSON.stringify(history));
  renderHistory();
}

function loadVegetables() {
  const stored = loadJSON(STORAGE.vegetables, null);
  if (!Array.isArray(stored) || stored.length === 0) return [...DEFAULT_VEGETABLES];
  return stored;
}

function saveVegetables() {
  localStorage.setItem(STORAGE.vegetables, JSON.stringify(state.vegetables));
}

function persistSession() {
  localStorage.setItem(STORAGE.activeSession, JSON.stringify(state.session));
}

function loadJSON(key, fallback) {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
}

function unitLabel(unit, quantity = 1) {
  if (unit === 'ML') return 'ml';
  if (unit === 'Caixa') return quantity === 1 ? 'caixa' : 'caixas';
  return quantity === 1 ? 'unidade' : 'unidades';
}

function formatQuantity(quantity, unit) {
  if (unit === 'ML') return `${formatNumber(quantity)} ml`;
  return `${formatNumber(quantity)} ${unitLabel(unit, quantity)}`;
}

function formatNumber(value) {
  return new Intl.NumberFormat('pt-BR', { maximumFractionDigits: 2 }).format(value);
}

function formatDate(isoDate) {
  const [year, month, day] = isoDate.split('-').map(Number);
  return new Intl.DateTimeFormat('pt-BR').format(new Date(year, month - 1, day));
}

function todayISO() {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function cryptoRandomId() {
  if (window.crypto?.randomUUID) return window.crypto.randomUUID();
  return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function slugWithId(name) {
  const slug = name.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
  return `${slug || 'verdura'}-${Date.now().toString(36)}`;
}

function normalizeName(value) {
  return value.trim().replace(/\s+/g, ' ').replace(/^./, char => char.toLocaleUpperCase('pt-BR'));
}

function escapeHTML(value) {
  return String(value).replace(/[&<>'"]/g, char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' }[char]));
}

let toastTimer;
function showToast(message) {
  clearTimeout(toastTimer);
  els.toast.textContent = message;
  els.toast.classList.add('show');
  toastTimer = setTimeout(() => els.toast.classList.remove('show'), 1800);
}
