import { useState } from "react";

type Item = { id: number; name: string; qty: number; price: number };

export default function InvoiceGenerator({ slug }: { slug?: string }) {
  const [items, setItems] = useState<Item[]>([{ id: 1, name: "Service", qty: 1, price: 100 }]);
  const [taxPercent, setTaxPercent] = useState(10);
  const [company, setCompany] = useState("My Company");
  const [client, setClient] = useState("Client Name");

  const addItem = () => setItems((s) => [...s, { id: Date.now(), name: "Item", qty: 1, price: 0 }]);
  const update = (id: number, patch: Partial<Item>) => setItems((s) => s.map((it) => (it.id === id ? { ...it, ...patch } : it)));
  const remove = (id: number) => setItems((s) => s.filter((it) => it.id !== id));

  const subtotal = items.reduce((a, b) => a + b.qty * b.price, 0);
  const tax = (subtotal * taxPercent) / 100;
  const total = subtotal + tax;

  const printInvoice = () => {
    const original = document.body.innerHTML;
    const el = document.getElementById("invoice-preview");
    if (!el) return;
    const html = el.innerHTML;
    document.body.innerHTML = html;
    window.print();
    document.body.innerHTML = original;
    window.location.reload();
  };

  return (
    <div>
      <h2 className="text-lg font-semibold mb-3">Invoice Generator</h2>
      <div className="grid gap-2 sm:grid-cols-2">
        <input className="input" value={company} onChange={(e) => setCompany(e.target.value)} placeholder="Your company" />
        <input className="input" value={client} onChange={(e) => setClient(e.target.value)} placeholder="Client" />
        <div className="col-span-2">
          <label className="text-sm">Tax %</label>
          <input type="number" className="input" value={taxPercent} onChange={(e) => setTaxPercent(Number(e.target.value))} />
        </div>
      </div>

      <div className="mt-4">
        {items.map((it) => (
          <div key={it.id} className="grid grid-cols-4 gap-2 items-center mb-2">
            <input className="input col-span-2" value={it.name} onChange={(e) => update(it.id, { name: e.target.value })} />
            <input type="number" className="input" value={it.qty} onChange={(e) => update(it.id, { qty: Number(e.target.value) })} />
            <input type="number" className="input" value={it.price} onChange={(e) => update(it.id, { price: Number(e.target.value) })} />
            <button onClick={() => remove(it.id)} className="btn-ghost">Remove</button>
          </div>
        ))}
        <div className="flex gap-2 mt-2">
          <button onClick={addItem} className="btn-primary">Add Item</button>
        </div>
      </div>

      <div id="invoice-preview" className="mt-6 rounded p-4 border">
        <h3 className="font-semibold">{company}</h3>
        <p>Bill To: {client}</p>
        <table className="w-full mt-3">
          <thead>
            <tr className="text-left"><th>Item</th><th>Qty</th><th>Price</th><th>Line</th></tr>
          </thead>
          <tbody>
            {items.map((it) => (
              <tr key={it.id}><td>{it.name}</td><td>{it.qty}</td><td>{it.price.toFixed(2)}</td><td>{(it.qty * it.price).toFixed(2)}</td></tr>
            ))}
          </tbody>
        </table>
        <div className="mt-3 text-right">
          <div>Subtotal: {subtotal.toFixed(2)}</div>
          <div>Tax ({taxPercent}%): {tax.toFixed(2)}</div>
          <div className="font-bold">Total: {total.toFixed(2)}</div>
        </div>
      </div>

      <div className="mt-4 flex gap-2">
        <button onClick={printInvoice} className="btn-primary">Print / Export</button>
      </div>
    </div>
  );
}
