import { useEffect, useState } from 'react';
import { getPurchases, getHospitals, getSuppliers, getMedicines, createPurchase, receivePurchase } from '../services/api';

export default function Purchases() {
  const [purchases, setPurchases] = useState([]);
  const [hospitals, setHospitals] = useState([]);
  const [suppliers, setSuppliers] = useState([]);
  const [medicines, setMedicines] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({
    hospital: '', supplier: '', expectedDeliveryDate: '', notes: '',
    items: [{ medicine: '', quantity: '', unitCost: '' }],
  });

  const load = async () => {
    try {
      const [pRes, hRes, sRes, mRes] = await Promise.all([
        getPurchases(),
        getHospitals(),
        getSuppliers(),
        getMedicines(),
      ]);
      setPurchases(pRes.data);
      setHospitals(hRes.data);
      setSuppliers(sRes.data);
      setMedicines(mRes.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const addItem = () => {
    setForm({ ...form, items: [...form.items, { medicine: '', quantity: '', unitCost: '' }] });
  };

  const updateItem = (idx, field, value) => {
    const items = [...form.items];
    items[idx] = { ...items[idx], [field]: value };
    setForm({ ...form, items });
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    try {
      await createPurchase({
        ...form,
        items: form.items.map((i) => ({
          medicine: i.medicine,
          quantity: Number(i.quantity),
          unitCost: Number(i.unitCost),
        })),
      });
      setShowModal(false);
      setForm({ hospital: '', supplier: '', expectedDeliveryDate: '', notes: '', items: [{ medicine: '', quantity: '', unitCost: '' }] });
      load();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to create purchase');
    }
  };

  const handleReceive = async (id) => {
    if (!confirm('Mark this purchase as received and add stock to inventory?')) return;
    try {
      await receivePurchase(id, {});
      load();
    } catch (err) {
      alert(err.response?.data?.message || 'Receive failed');
    }
  };

  if (loading) return <div className="loading">Loading purchases...</div>;

  return (
    <div>
      <div className="page-header">
        <h2>Purchases</h2>
        <button className="btn btn-primary" onClick={() => setShowModal(true)}>+ New Purchase Order</button>
      </div>

      <div className="card">
        <div className="table-container">
          <table>
            <thead>
              <tr>
                <th>PO Number</th>
                <th>Hospital</th>
                <th>Supplier</th>
                <th>Items</th>
                <th>Total</th>
                <th>Order Date</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {purchases.map((p) => (
                <tr key={p._id}>
                  <td><strong>{p.purchaseOrderNumber}</strong></td>
                  <td>{p.hospital?.name}</td>
                  <td>{p.supplier?.name}</td>
                  <td>{p.items?.length} item(s)</td>
                  <td>₹{p.totalAmount?.toLocaleString()}</td>
                  <td>{new Date(p.orderDate).toLocaleDateString()}</td>
                  <td>
                    <span className={`badge badge-${p.status === 'received' ? 'completed' : p.status === 'ordered' ? 'pending' : 'open'}`}>
                      {p.status}
                    </span>
                  </td>
                  <td>
                    {(p.status === 'ordered' || p.status === 'pending') && (
                      <button className="btn btn-primary btn-sm" onClick={() => handleReceive(p._id)}>Receive</button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {purchases.length === 0 && <div className="empty-state">No purchase orders yet</div>}
        </div>
      </div>

      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal" style={{ maxWidth: 640 }} onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>New Purchase Order</h3>
              <button className="btn btn-outline btn-sm" onClick={() => setShowModal(false)}>✕</button>
            </div>
            <form onSubmit={handleCreate}>
              <div className="modal-body">
                <div className="form-row">
                  <div className="form-group">
                    <label>Hospital</label>
                    <select className="form-control" value={form.hospital} onChange={(e) => setForm({ ...form, hospital: e.target.value })} required>
                      <option value="">Select...</option>
                      {hospitals.map((h) => <option key={h._id} value={h._id}>{h.name}</option>)}
                    </select>
                  </div>
                  <div className="form-group">
                    <label>Supplier</label>
                    <select className="form-control" value={form.supplier} onChange={(e) => setForm({ ...form, supplier: e.target.value })} required>
                      <option value="">Select...</option>
                      {suppliers.map((s) => <option key={s._id} value={s._id}>{s.name}</option>)}
                    </select>
                  </div>
                </div>
                <div className="form-group">
                  <label>Expected Delivery</label>
                  <input className="form-control" type="date" value={form.expectedDeliveryDate} onChange={(e) => setForm({ ...form, expectedDeliveryDate: e.target.value })} />
                </div>
                <h4 style={{ margin: '1rem 0 0.5rem', fontSize: '0.95rem' }}>Items</h4>
                {form.items.map((item, idx) => (
                  <div key={idx} className="form-row" style={{ marginBottom: '0.5rem' }}>
                    <div className="form-group">
                      <select className="form-control" value={item.medicine} onChange={(e) => updateItem(idx, 'medicine', e.target.value)} required>
                        <option value="">Medicine...</option>
                        {medicines.map((m) => <option key={m._id} value={m._id}>{m.name}</option>)}
                      </select>
                    </div>
                    <div className="form-group">
                      <input className="form-control" type="number" placeholder="Qty" value={item.quantity} onChange={(e) => updateItem(idx, 'quantity', e.target.value)} required />
                    </div>
                    <div className="form-group">
                      <input className="form-control" type="number" step="0.01" placeholder="Unit Cost" value={item.unitCost} onChange={(e) => updateItem(idx, 'unitCost', e.target.value)} required />
                    </div>
                  </div>
                ))}
                <button type="button" className="btn btn-outline btn-sm" onClick={addItem}>+ Add Item</button>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary">Create PO</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
