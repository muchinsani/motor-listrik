export const PRODUCTS = Object.freeze([
  Object.freeze({ id: 'aruna', name: 'Aruna City', category: 'Harian', description: 'Ringan untuk setiap perjalanan kota.', price: 18500000, range: 70, speed: 55, color: 'mint' }),
  Object.freeze({ id: 'raya', name: 'Raya Plus', category: 'Serbaguna', description: 'Lebih jauh, untuk lebih banyak rencana.', price: 24900000, range: 110, speed: 70, color: 'slate' }),
  Object.freeze({ id: 'angkut', name: 'Angkut Pro', category: 'Bisnis', description: 'Teman andal untuk operasional usaha.', price: 28900000, range: 130, speed: 65, color: 'sand' }),
]);

export const STORAGE_KEY = 'motor-listrik-demo.orders.v1';
export const ANNUAL_FLAT_RATE = 8;

export function formatRupiah(value) {
  if (!Number.isSafeInteger(value) || value < 0) throw new Error('Nominal rupiah tidak valid.');
  return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(value);
}

export function simulate({ productId, customer, quantity, payment, downPercent = 30, months = 24 }) {
  const product = PRODUCTS.find(item => item.id === productId);
  if (!product) throw new Error('Pilih motor yang tersedia.');
  if (!['individu', 'bisnis'].includes(customer)) throw new Error('Pilih jenis pengguna.');
  if (!Number.isInteger(quantity) || quantity < 1 || quantity > 100) throw new Error('Jumlah unit harus bilangan bulat antara 1 dan 100.');
  if (!['tunai', 'cicilan'].includes(payment)) throw new Error('Pilih metode pembayaran.');
  if (payment === 'cicilan' && (!Number.isInteger(downPercent) || downPercent < 20 || downPercent > 50)) throw new Error('Uang muka harus antara 20% dan 50%.');
  if (payment === 'cicilan' && ![12, 24, 36].includes(months)) throw new Error('Pilih tenor 12, 24, atau 36 bulan.');
  const perUnitDown = payment === 'tunai' ? product.price : Math.round(product.price * downPercent / 100);
  const principal = product.price - perUnitDown;
  const perUnitInterest = payment === 'tunai' ? 0 : Math.round(principal * ANNUAL_FLAT_RATE * months / 1200);
  const perUnitMonthly = payment === 'tunai' ? 0 : Math.ceil((principal + perUnitInterest) / months);
  const perUnitTotal = perUnitDown + perUnitMonthly * (payment === 'tunai' ? 0 : months);
  return {
    productId, customer, quantity, payment,
    downPercent: payment === 'tunai' ? 100 : downPercent,
    months: payment === 'tunai' ? 0 : months,
    price: product.price,
    baseTotal: product.price * quantity,
    perUnitDown, downTotal: perUnitDown * quantity,
    perUnitMonthly, monthlyTotal: perUnitMonthly * quantity,
    total: perUnitTotal * quantity,
    financingTotal: (perUnitTotal - product.price) * quantity,
  };
}

export function createApplication(input, existing, id, createdAt = new Date().toISOString()) {
  const quote = simulate(input);
  if (typeof id !== 'string' || !/^[a-zA-Z0-9-]{1,64}$/.test(id)) throw new Error('ID pengajuan tidak valid.');
  if (typeof createdAt !== 'string' || !Number.isFinite(Date.parse(createdAt))) throw new Error('Tanggal pengajuan tidak valid.');
  const duplicate = existing.find(order => order.id === id);
  if (duplicate) {
    if (JSON.stringify(duplicate.quote) !== JSON.stringify(quote)) throw new Error('ID pengajuan sudah digunakan untuk simulasi lain.');
    return { order: duplicate, orders: existing, created: false };
  }
  const order = { id, createdAt, status: 'DIAJUKAN', quote };
  return { order, orders: [order, ...existing], created: true };
}

export function readApplications(storage) {
  const raw = storage.getItem(STORAGE_KEY);
  if (raw === null) return [];
  const orders = JSON.parse(raw);
  if (!Array.isArray(orders)) throw new Error('Data pengajuan lokal tidak valid.');
  const ids = new Set();
  for (const order of orders) {
    if (!order || typeof order.id !== 'string' || !/^[a-zA-Z0-9-]{1,64}$/.test(order.id) || ids.has(order.id) || order.status !== 'DIAJUKAN' || typeof order.createdAt !== 'string' || !Number.isFinite(Date.parse(order.createdAt))) throw new Error('Data pengajuan lokal tidak valid.');
    const expected = simulate(order.quote);
    for (const [key, value] of Object.entries(expected)) {
      if (order.quote[key] !== value) throw new Error('Rincian simulasi lokal tidak valid.');
    }
    ids.add(order.id);
  }
  return orders;
}

export function saveApplications(storage, orders) {
  storage.setItem(STORAGE_KEY, JSON.stringify(orders));
}

export function storeApplication(storage, input, id) {
  const result = createApplication(input, readApplications(storage), id);
  saveApplications(storage, result.orders);
  return result;
}
