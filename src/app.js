const form = document.getElementById('tx-form');
const txList = document.getElementById('tx-list');
const incomeEl = document.getElementById('income');
const expenseEl = document.getElementById('expense');
const balanceEl = document.getElementById('balance');

const txs = [];

const toRupiah = (n) =>
  new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(n);

function render() {
  let income = 0;
  let expense = 0;

  txList.innerHTML = '';

  txs.forEach((tx) => {
    if (tx.type === 'income') income += tx.amount;
    else expense += tx.amount;

    const item = document.createElement('li');
    item.className = 'tx-item';
    item.innerHTML = `
      <div>
        <strong>${tx.description}</strong><br/>
        <small>${tx.date} • ${tx.type === 'income' ? 'Pemasukan' : 'Pengeluaran'}</small>
      </div>
      <strong>${toRupiah(tx.amount)}</strong>
    `;
    txList.appendChild(item);
  });

  const balance = income - expense;
  incomeEl.textContent = toRupiah(income);
  expenseEl.textContent = toRupiah(expense);
  balanceEl.textContent = toRupiah(balance);
}

form.addEventListener('submit', (e) => {
  e.preventDefault();
  const fd = new FormData(form);
  const tx = {
    description: String(fd.get('description')).trim(),
    amount: Number(fd.get('amount')),
    type: String(fd.get('type')),
    date: String(fd.get('date')),
  };

  if (!tx.description || !tx.amount || !tx.date) return;
  txs.unshift(tx);
  form.reset();
  render();
});

render();
