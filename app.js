import { PRODUCTS, STORAGE_KEY, formatRupiah, simulate, storeApplication, readApplications } from './model.mjs';

const form = document.querySelector('#simulation-form');
const motorSelect = document.querySelector('#motor-select');
const formError = document.querySelector('#form-error');
const submitButton = document.querySelector('#submit-button');
const dialog = document.querySelector('#success-dialog');
let orders = [];
let storageAvailable = true;
let draftId = crypto.randomUUID();

for (const product of PRODUCTS) {
  const option = document.createElement('option');
  option.value = product.id;
  option.textContent = product.name;
  motorSelect.append(option);
  const card = document.createElement('article');
  card.className = 'product-card';
  card.dataset.product = product.id;
  card.innerHTML = `<div class="product-art ${product.color}"><span class="product-tag">${product.category}</span><img src="/motor.svg" width="760" height="480" alt="Ilustrasi ${product.name}" loading="lazy"></div><div class="product-content"><div class="product-name-line"><h3>${product.name}</h3><span class="product-dot ${product.color}-dot" aria-hidden="true"></span></div><p class="product-description">${product.description}</p><div class="product-specs"><span><b>↗</b> ${product.range} km / isi daya</span><span><b>ϟ</b> ${product.speed} km/jam</span></div><div class="product-price"><span>Harga ilustratif / unit</span><strong>${formatRupiah(product.price)}</strong></div><button class="button product-select" type="button" aria-label="Pilih ${product.name}"><span class="select-label">Pilih motor</span><span aria-hidden="true">↗</span></button></div>`;
  card.querySelector('button').addEventListener('click', () => {
    motorSelect.value = product.id;
    updateSimulation();
    document.querySelector('#simulasi').scrollIntoView({ behavior: 'smooth' });
    motorSelect.focus({ preventScroll: true });
  });
  document.querySelector('#product-grid').append(card);
}

function readInput() {
  const data = new FormData(form);
  return {
    productId: data.get('productId'), customer: data.get('customer'),
    quantity: Number(data.get('quantity')), payment: data.get('payment'),
    downPercent: Number(data.get('downPercent')), months: Number(data.get('months')),
  };
}

function setText(id, text) {
  document.getElementById(id).textContent = text;
}

function updateSimulation() {
  draftId = crypto.randomUUID();
  const input = readInput();
  const cash = input.payment === 'tunai';
  document.querySelector('#financing-fields').hidden = cash;
  document.querySelector('#down-row').hidden = cash;
  document.querySelector('#interest-row').hidden = cash;
  document.querySelector('#consent').checked = false;
  for (const card of document.querySelectorAll('.product-card')) {
    const selected = card.dataset.product === input.productId;
    card.classList.toggle('selected', selected);
    card.querySelector('button').setAttribute('aria-pressed', String(selected));
    card.querySelector('.select-label').textContent = selected ? 'Motor pilihan Anda' : 'Pilih motor';
  }
  try {
    const quote = simulate(input);
    setText('quote-label', cash ? 'Estimasi pembayaran tunai' : 'Estimasi cicilan / bulan');
    setText('quote-main', formatRupiah(cash ? quote.total : quote.monthlyTotal));
    setText('quote-unit', `untuk ${quote.quantity} unit`);
    setText('per-unit-cost', quote.quantity > 1 ? `${formatRupiah(cash ? quote.price : quote.perUnitMonthly)} / unit${cash ? '' : ' / bulan'}` : '');
    setText('base-total', formatRupiah(quote.baseTotal));
    setText('down-total', formatRupiah(quote.downTotal));
    setText('interest-total', formatRupiah(quote.financingTotal));
    setText('payment-total', formatRupiah(quote.total));
    setText('simulation-disclaimer', cash
      ? 'Harga ilustratif, termasuk baterai. Belum termasuk administrasi, asuransi, dan biaya pengiriman. Bukan penawaran dari penjual.'
      : 'Ilustrasi bunga flat 8% per tahun, dibulatkan ke rupiah. Belum termasuk administrasi, asuransi, dan biaya pengiriman. Bukan penawaran atau persetujuan pembiayaan.');
    formError.hidden = true;
    submitButton.disabled = !storageAvailable;
  } catch (error) {
    for (const id of ['quote-main', 'base-total', 'down-total', 'interest-total', 'payment-total']) setText(id, '—');
    setText('quote-unit', '');
    setText('per-unit-cost', '');
    formError.textContent = error.message;
    formError.hidden = false;
    submitButton.disabled = true;
  }
}

function renderOrders() {
  setText('order-count', String(orders.length));
  const list = document.querySelector('#orders-list');
  list.replaceChildren();
  if (!orders.length) {
    const empty = document.createElement('div');
    empty.className = 'empty-orders';
    empty.innerHTML = '<span class="empty-icon" aria-hidden="true">↗</span><div><h3>Perjalanan Anda dimulai di sini.</h3><p>Belum ada pengajuan demo. Pilih motor dan coba simulasinya terlebih dahulu.</p></div>';
    list.append(empty);
    return;
  }
  for (const order of orders) {
    const product = PRODUCTS.find(item => item.id === order.quote.productId);
    const article = document.createElement('article');
    article.className = 'order-item';
    const image = document.createElement('img');
    image.src = '/motor.svg';
    image.alt = '';
    const info = document.createElement('div');
    info.className = 'order-info';
    const title = document.createElement('h3');
    title.textContent = `${product.name} · ${order.quote.quantity} unit`;
    const details = document.createElement('p');
    details.textContent = `${order.quote.customer === 'bisnis' ? 'Bisnis' : 'Individu'} · ${order.quote.payment === 'tunai' ? 'Tunai' : `Cicilan ${order.quote.months} bulan`} · Total ${formatRupiah(order.quote.total)}`;
    const reference = document.createElement('p');
    reference.textContent = `DEMO-${order.id.slice(0, 8).toUpperCase()} · ${new Date(order.createdAt).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}`;
    const terms = document.createElement('p');
    terms.textContent = 'Motor & baterai termasuk. Biaya lain belum dihitung.';
    info.append(title, details, reference, terms);
    const status = document.createElement('div');
    status.className = 'order-status';
    const badge = document.createElement('span');
    badge.textContent = 'DIAJUKAN · DEMO';
    const note = document.createElement('p');
    note.textContent = 'Belum dikirim atau disetujui';
    status.append(badge, note);
    article.append(image, info, status);
    list.append(article);
  }
}

function loadOrders() {
  try {
    orders = readApplications(localStorage);
    storageAvailable = true;
    document.querySelector('#storage-error').hidden = true;
  } catch {
    storageAvailable = false;
    const error = document.querySelector('#storage-error');
    error.textContent = 'Data pengajuan lokal tidak dapat dibaca. Simulasi tetap tersedia, tetapi pengajuan baru tidak disimpan. Gunakan browser dengan penyimpanan lokal yang aktif atau periksa data situs ini.';
    error.hidden = false;
  }
}
loadOrders();
window.addEventListener('storage', event => {
  if (event.key !== STORAGE_KEY && event.key !== null) return;
  loadOrders();
  renderOrders();
  submitButton.disabled = !storageAvailable || !document.querySelector('#quantity').validity.valid;
});

form.addEventListener('input', event => {
  if (event.target.id !== 'consent') updateSimulation();
});
form.addEventListener('submit', async event => {
  event.preventDefault();
  if (!storageAvailable || !form.reportValidity()) return;
  const input = readInput();
  const id = draftId;
  try {
    const result = await navigator.locks.request(STORAGE_KEY, () => storeApplication(localStorage, input, id));
    orders = result.orders;
    renderOrders();
    setText('success-reference', `Referensi DEMO-${result.order.id.slice(0, 8).toUpperCase()}`);
    if (!dialog.open) dialog.showModal();
  } catch (error) {
    formError.textContent = `Pengajuan belum tersimpan. ${error.name === 'QuotaExceededError' || error.name === 'SecurityError' ? 'Penyimpanan browser tidak tersedia atau sudah penuh.' : error.message}`;
    formError.hidden = false;
  }
});
document.querySelector('#close-dialog').addEventListener('click', () => {
  dialog.close();
  document.querySelector('#pengajuan').scrollIntoView({ behavior: 'smooth' });
});
renderOrders();
updateSimulation();
