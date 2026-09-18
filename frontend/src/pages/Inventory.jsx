import { useEffect, useState } from 'react';
import { getInventory, getHospitals, getMedicines, getSuppliers, stockIn, stockOut } from '../services/api';

export default function Inventory() {
  const [inventory, setInventory] = useState([]);
  const [hospitals, setHospitals] = useState([]);
  const [medicines, setMedicines] = useState([]);
  const [suppliers, setSuppliers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [hospitalFilter, setHospitalFilter] = useState('');
  const [lowStock, setLowStock] = useState(false);
  const [expiringSoon, setExpiringSoon] = useState(false);
  const [showStockIn, setShowStockIn] = useState(false);
  const [showStockOut, setShowStockOut] = useState(false);
  const [stockInForm, setStockInForm] = useState({ hospital: '', medicine: '', batchNumber: '', quantity: '', expiryDate: '', unitCost: '', supplier: '' });
  const [stockOutForm, setStockOutForm] = useState({ hospital: '', medicine: '', quantity: '', batchNumber: '' });

  const load = async () => {
    try {
      const [invRes, hRes, mRes, sRes] = await Promise.all([
        getInventory({
          hospital: hospitalFilter || undefined,
          lowStock: lowStock ? 'true' : undefined,
          expiringSoon: expiringSoon ? 'true' : undefined,
        }),
        getHospitals(),
        getMedicines(),
        getSuppliers(),
      ]);
      setInventory(invRes.data);
      setHospitals(hRes.data);
      setMedicines(mRes.data);
      setSuppliers(sRes.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, [hospitalFilter, lowStock, expiringSoon]);

  const handleStockIn = async (e) => {
    e.preventDefault();
    try {
      await stockIn({
        ...stockInForm,
        quantity: Number(stockInForm.quantity),
        unitCost: Number(stockInForm.unitCost) || 0,
      });
      setShowStockIn(false);
      setStockInForm({ hospital: '', medicine: '', batchNumber: '', quantity: '', expiryDate: '', unitCost: '', supplier: '' });
      load();
    } catch (err) {
      alert(err.response?.data?.message || 'Stock-in failed');
    }
  };

  const handleStockOut = async (e) => {
    e.preventDefault();
    try {
      await stockOut({
        ...stockOutForm,
        quantity: Number(stockOutForm.quantity),
      });
      setShowStockOut(false);
      setStockOutForm({ hospital: '', medicine: '', quantity: '', batchNumber: '' });
      load();
    } catch (err) {
      alert(err.response?.data?.message || 'Stock-out failed');
    }
  };

  const daysToExpiry = (date) => Math.ceil((new Date(date) - new Date()) / (1000 * 60 * 60 * 24));

  if (loading) return <div className="loading">Loading inventory...</div>;

  return (
    <div>
      <div className="page-header">
        <h2>Inventory</h2>
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <button className="btn btn-primary" onClick={() => setShowStockIn(true)}>+ Stock In</button>
          <button className="btn btn-secondary" onClick={() => setShowStockOut(true)}>Stock Out</button>
        </div>
      </div>

      <div className="filters">
        <select className="form-control" value={hospitalFilter} onChange={(e) => setHospitalFilter(e.target.value)}>
          <option value="">All Hospitals</option>
          {hospitals.map((h) => <option key={h._id} value={h._id}>{h.name}</option>)}
        </select>
        <label style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.875rem' }}>
          <input type="checkbox" checked={lowStock} onChange={(e) => setLowStock(e.target.checked)} /> Low Stock
        </label>
        <label style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.875rem' }}>
          <input type="checkbox" checked={expiringSoon} onChange={(e) => setExpiringSoon(e.target.checked)} /> Expiring Soon
        </label>
      </div>

      <div className="card">
        <div className="table-container">
          <table>
            <thead>
              <tr>
                <th>Hospital</th>
                <th>Medicine</th>
                <th>Total Qty</th>
                <th>Batches</th>
                <th>Nearest Expiry</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {inventory.map((inv) => {
                const activeBatches = inv.batches?.filter((b) => b.status === 'active' && b.quantity > 0) || [];
                const nearest = activeBatches.sort((a, b) => new Date(a.expiryDate) - new Date(b.expiryDate))[0];
                const days = nearest ? daysToExpiry(nearest.expiryDate) : null;
                const isLow = inv.totalQuantity <= (inv.medicine?.minStockLevel || 50);
                return (
                  <tr key={inv._id}>
                    <td>{inv.hospital?.name || inv.hospital?.code}</td>
                    <td>
                      <strong>{inv.medicine?.name}</strong>
                      <div style={{ fontSize: '0.75rem', color: '#64748b' }}>{inv.medicine?.code}</div>
                    </td>
                    <td>
                      <strong style={{ color: isLow ? '#dc2626' : 'inherit' }}>{inv.totalQuantity}</strong>
                      <span style={{ fontSize: '0.75rem', color: '#64748b' }}> {inv.medicine?.unit}</span>
                    </td>
                    <td>
                      {activeBatches.map((b) => (
                        <div key={b._id || b.batchNumber} style={{ fontSize: '0.8rem' }}>
                          {b.batchNumber}: {b.quantity}
                          {daysToExpiry(b.expiryDate) <= 60 && (
                            <span className="badge badge-high" style={{ marginLeft: 4 }}>
                              {daysToExpiry(b.expiryDate)}d
                            </span>
                          )}
                        </div>
                      ))}
                    </td>
                    <td>
                      {nearest ? (
                        <span className={days <= 30 ? 'badge badge-critical' : days <= 60 ? 'badge badge-high' : ''}>
                          {new Date(nearest.expiryDate).toLocaleDateString()} ({days}d)
                        </span>
                      ) : '—'}
                    </td>
                    <td>
                      {isLow && <span className="badge badge-critical">Low Stock</span>}
                      {days !== null && days <= 30 && <span className="badge badge-critical" style={{ marginLeft: 4 }}>Expiry Risk</span>}
                      {!isLow && (days === null || days > 60) && <span className="badge badge-low">OK</span>}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          {inventory.length === 0 && <div className="empty-state">No inventory records found</div>}
        </div>
      </div>

      {showStockIn && (
        <div className="modal-overlay" onClick={() => setShowStockIn(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Stock In</h3>
              <button className="btn btn-outline btn-sm" onClick={() => setShowStockIn(false)}>✕</button>
            </div>
            <form onSubmit={handleStockIn}>
              <div className="modal-body">
                <div className="form-group">
                  <label>Hospital</label>
                  <select className="form-control" value={stockInForm.hospital} onChange={(e) => setStockInForm({ ...stockInForm, hospital: e.target.value })} required>
                    <option value="">Select...</option>
                    {hospitals.map((h) => <option key={h._id} value={h._id}>{h.name}</option>)}
                  </select>
                </div>
                <div className="form-group">
                  <label>Medicine</label>
                  <select className="form-control" value={stockInForm.medicine} onChange={(e) => setStockInForm({ ...stockInForm, medicine: e.target.value })} required>
                    <option value="">Select...</option>
                    {medicines.map((m) => <option key={m._id} value={m._id}>{m.name}</option>)}
                  </select>
                </div>
                <div className="form-row">
                  <div className="form-group">
                    <label>Batch Number</label>
                    <input className="form-control" value={stockInForm.batchNumber} onChange={(e) => setStockInForm({ ...stockInForm, batchNumber: e.target.value })} required />
                  </div>
                  <div className="form-group">
                    <label>Quantity</label>
                    <input className="form-control" type="number" min="1" value={stockInForm.quantity} onChange={(e) => setStockInForm({ ...stockInForm, quantity: e.target.value })} required />
                  </div>
                </div>
                <div className="form-row">
                  <div className="form-group">
                    <label>Expiry Date</label>
                    <input className="form-control" type="date" value={stockInForm.expiryDate} onChange={(e) => setStockInForm({ ...stockInForm, expiryDate: e.target.value })} required />
                  </div>
                  <div className="form-group">
                    <label>Unit Cost</label>
                    <input className="form-control" type="number" step="0.01" value={stockInForm.unitCost} onChange={(e) => setStockInForm({ ...stockInForm, unitCost: e.target.value })} />
                  </div>
                </div>
                <div className="form-group">
                  <label>Supplier</label>
                  <select className="form-control" value={stockInForm.supplier} onChange={(e) => setStockInForm({ ...stockInForm, supplier: e.target.value })}>
                    <option value="">Select...</option>
                    {suppliers.map((s) => <option key={s._id} value={s._id}>{s.name}</option>)}
                  </select>
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setShowStockIn(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary">Add Stock</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showStockOut && (
        <div className="modal-overlay" onClick={() => setShowStockOut(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Stock Out (FEFO)</h3>
              <button className="btn btn-outline btn-sm" onClick={() => setShowStockOut(false)}>✕</button>
            </div>
            <form onSubmit={handleStockOut}>
              <div className="modal-body">
                <div className="form-group">
                  <label>Hospital</label>
                  <select className="form-control" value={stockOutForm.hospital} onChange={(e) => setStockOutForm({ ...stockOutForm, hospital: e.target.value })} required>
                    <option value="">Select...</option>
                    {hospitals.map((h) => <option key={h._id} value={h._id}>{h.name}</option>)}
                  </select>
                </div>
                <div className="form-group">
                  <label>Medicine</label>
                  <select className="form-control" value={stockOutForm.medicine} onChange={(e) => setStockOutForm({ ...stockOutForm, medicine: e.target.value })} required>
                    <option value="">Select...</option>
                    {medicines.map((m) => <option key={m._id} value={m._id}>{m.name}</option>)}
                  </select>
                </div>
                <div className="form-row">
                  <div className="form-group">
                    <label>Quantity</label>
                    <input className="form-control" type="number" min="1" value={stockOutForm.quantity} onChange={(e) => setStockOutForm({ ...stockOutForm, quantity: e.target.value })} required />
                  </div>
                  <div className="form-group">
                    <label>Batch (optional)</label>
                    <input className="form-control" value={stockOutForm.batchNumber} onChange={(e) => setStockOutForm({ ...stockOutForm, batchNumber: e.target.value })} placeholder="Auto FEFO if empty" />
                  </div>
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setShowStockOut(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary">Deduct Stock</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
