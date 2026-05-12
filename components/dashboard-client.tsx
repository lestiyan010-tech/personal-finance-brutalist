"use client";

import { useMemo, useState } from "react";

type Tx = {
  id: string;
  title: string;
  amount: number;
  type: "INCOME" | "EXPENSE";
  category: string | null;
  notes: string | null;
  happenedAt: string | Date;
};

const fmt = (n: number) => new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 }).format(n);

export default function DashboardClient({ initial }: { initial: Tx[] }) {
  const [rows, setRows] = useState<Tx[]>(initial);

  const summary = useMemo(() => {
    let income = 0;
    let expense = 0;
    for (const r of rows) r.type === "INCOME" ? (income += r.amount) : (expense += r.amount);
    return { income, expense, balance: income - expense };
  }, [rows]);

  async function addTx(formData: FormData) {
    const payload = {
      title: String(formData.get("title")),
      amount: Number(formData.get("amount")),
      type: String(formData.get("type")),
      category: String(formData.get("category") || ""),
      notes: String(formData.get("notes") || ""),
      happenedAt: String(formData.get("happenedAt")),
    };

    const res = await fetch("/api/transactions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    if (!res.ok) return;
    const created = await res.json();
    if (created.ignored) return;
    setRows((prev) => [{ ...created, amount: Number(created.amount) }, ...prev]);
  }

  async function delTx(id: string) {
    const res = await fetch(`/api/transactions/${id}`, { method: "DELETE" });
    if (res.ok) setRows((prev) => prev.filter((x) => x.id !== id));
  }

  return (
    <div className="grid gap-4">
      <section className="brutal-box">
        <h2 className="text-2xl font-black">Tambah Transaksi</h2>
        <form action={addTx} className="mt-4 grid md:grid-cols-2 gap-3">
          <input className="brut-input" required name="title" placeholder="Judul transaksi" />
          <input className="brut-input" required name="amount" type="number" min="1" placeholder="Nominal" />
          <select className="brut-input" name="type" defaultValue="EXPENSE">
            <option value="EXPENSE">Pengeluaran</option>
            <option value="INCOME">Pemasukan</option>
          </select>
          <input className="brut-input" name="category" placeholder="Kategori" />
          <input className="brut-input" name="happenedAt" type="date" required />
          <input className="brut-input md:col-span-2" name="notes" placeholder="Catatan" />
          <button className="brut-btn bg-brut-yellow md:col-span-2">Simpan</button>
        </form>
      </section>

      <section className="grid md:grid-cols-3 gap-3">
        <div className="brutal-box"><p className="font-black">Pemasukan</p><p className="text-xl text-green-700 font-black">{fmt(summary.income)}</p></div>
        <div className="brutal-box"><p className="font-black">Pengeluaran</p><p className="text-xl text-red-700 font-black">{fmt(summary.expense)}</p></div>
        <div className="brutal-box"><p className="font-black">Saldo</p><p className="text-xl font-black">{fmt(summary.balance)}</p></div>
      </section>

      <section className="brutal-box overflow-x-auto">
        <h2 className="text-2xl font-black mb-3">Riwayat</h2>
        <table className="w-full border-collapse">
          <thead>
            <tr className="border-2 border-black">
              <th className="p-2 border-2 border-black text-left">Tanggal</th>
              <th className="p-2 border-2 border-black text-left">Judul</th>
              <th className="p-2 border-2 border-black">Tipe</th>
              <th className="p-2 border-2 border-black text-right">Nominal</th>
              <th className="p-2 border-2 border-black"></th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.id}>
                <td className="p-2 border-2 border-black">{new Date(r.happenedAt).toLocaleDateString("id-ID")}</td>
                <td className="p-2 border-2 border-black">{r.title}</td>
                <td className="p-2 border-2 border-black text-center">{r.type === "INCOME" ? "Masuk" : "Keluar"}</td>
                <td className="p-2 border-2 border-black text-right">{fmt(r.amount)}</td>
                <td className="p-2 border-2 border-black text-center"><button className="brut-btn bg-white" onClick={() => delTx(r.id)}>Hapus</button></td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>
    </div>
  );
}
