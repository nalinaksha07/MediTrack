import { useEffect, useState } from 'react';
import {
  getTransfers, getHospitals, getMedicines, createTransfer,
  approveTransfer, completeTransfer,
} from '../services/api';

export default function Transfers() {
  const [transfers, setTransfers] = useState([]);
  const [hospitals, setHospitals] = useState([]);
  const [medicines, setMedicines] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({
    fromHospital: '', toHospital: '', medicine: '', quantity: '', reason: '',
    transportDetails: { vehicle: 'Hospital Transport Van', estimatedTimeHours: 4, distanceKm: 25, cost: 1500 },
  });

  const load = async () => {
    try {
      const [tRes, hRes, mRes] = await Promise.all([
        getTransfers(),
        getHospitals(),
        getMedicines(),
      ]);
      setTransfers(tRes.data);
      setHospitals(hRes.data);
      setMedicines(mRes.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const handleCreate = async (e) => {
    e.preventDefault();
    try {
      await createTransfer({
        ...form,
        quantity: Number(form.quantity),
        transportDetails: {
          ...form.transportDetails,
          estimatedTimeHours: Number(form.transportDetails.estimatedTimeHours),
          distanceKm: Number(form.transportDetails.distanceKm),
          cost: Number(form.transportDetails.cost),
        },
      });
      setShowModal(false);
      load();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to create transfer');
    }
  };

  const handleApprove = async (id) => {
    try {
      await approveTransfer(id);
      load();
    } catch (err) {
      alert(err.response?.data?.message || 'Approve failed');
    }
  };

  const handleComplete = async (id) => {
    if (!confirm('Complete transfer? This will move stock between hospitals.')) return;
    try {
      await completeTransfer(id);
      load();
    } catch (err) {
      alert(err.response?.data?.message || 'Complete failed');
    }
  };

  if (loading) return <div className="loading">Loading transfers...</div>;

  return (
    <div>
      <div className="page-header">
        <h2>Hospital Transfers</h2>
        <button className="btn btn-primary" onClick={() => setShowModal(true)}>+ New Transfer</button>
      </div>

      <div className="card">
        <div className="table-container">
          <table>
            <thead>
              <tr>
                <th>Transfer #</th>
                <th>From</th>
                <th>To</th>
                <th>Medicine</th>
                <th>Qty</th>
                <th>Status</th>
                <th>AI</th>
                <th>Transport</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {transfers.map((t) => (
                <tr key={t._id}>
                  <td><strong>{t.transferNumber}</strong></td>
                  <td>{t.fromHospital?.name || t.fromHospital?.code}</td>
                  <td>{t.toHospital?.name || t.toHospital?.code}</td>
                  <td>{t.medicine?.name}</td>
                  <td>{t.quantity}</td>
                  <td>
                    <span className={`badge badge-${
                      t.status === 'completed' ? 'completed' :
                      t.status === 'approved' ? 'approved' :
                      t.status === 'recommended' ? 'open' : 'pending'
                    }`}>
                      {t.status}
                    </span>
                  </td>
                  <td>{t.recommendedByAI ? '🤖' : '—'}</td>
                  <td style={{ fontSize: '0.8rem' }}>
                    {t.transportDetails?.distanceKm && `${t.transportDetails.distanceKm} km`}
                    {t.transportDetails?.estimatedTimeHours && ` • ${t.transportDetails.estimatedTimeHours}h`}
                  </td>
                  <td>
                    {(t.status === 'pending' || t.status === 'recommended') && (
                      <button className="btn btn-primary btn-sm" onClick={() => handleApprove(t._id)}>Approve</button>
                    )}
                    {(t.status === 'approved' || t.status === 'in_transit') && (
                      <button className="btn btn-primary btn-sm" onClick={() => handleComplete(t._id)}>Complete</button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {transfers.length === 0 && <div className="empty-state">No transfers yet. Create one or generate from AI Insights.</div>}
        </div>
      </div>

      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>New Transfer</h3>
              <button className="btn btn-outline btn-sm" onClick={() => setShowModal(false)}>✕</button>
            </div>
            <form onSubmit={handleCreate}>
              <div className="modal-body">
                <div className="form-group">
                  <label>From Hospital</label>
                  <select className="form-control" value={form.fromHospital} onChange={(e) => setForm({ ...form, fromHospital: e.target.value })} required>
                    <option value="">Select...</option>
                    {hospitals.map((h) => <option key={h._id} value={h._id}>{h.name}</option>)}
                  </select>
                </div>
                <div className="form-group">
                  <label>To Hospital</label>
                  <select className="form-control" value={form.toHospital} onChange={(e) => setForm({ ...form, toHospital: e.target.value })} required>
                    <option value="">Select...</option>
                    {hospitals.map((h) => <option key={h._id} value={h._id}>{h.name}</option>)}
                  </select>
                </div>
                <div className="form-group">
                  <label>Medicine</label>
                  <select className="form-control" value={form.medicine} onChange={(e) => setForm({ ...form, medicine: e.target.value })} required>
                    <option value="">Select...</option>
                    {medicines.map((m) => <option key={m._id} value={m._id}>{m.name}</option>)}
                  </select>
                </div>
                <div className="form-group">
                  <label>Quantity</label>
                  <input className="form-control" type="number" min="1" value={form.quantity} onChange={(e) => setForm({ ...form, quantity: e.target.value })} required />
                </div>
                <div className="form-group">
                  <label>Reason</label>
                  <input className="form-control" value={form.reason} onChange={(e) => setForm({ ...form, reason: e.target.value })} />
                </div>
                <div className="form-row">
                  <div className="form-group">
                    <label>Distance (km)</label>
                    <input className="form-control" type="number" value={form.transportDetails.distanceKm} onChange={(e) => setForm({ ...form, transportDetails: { ...form.transportDetails, distanceKm: e.target.value } })} />
                  </div>
                  <div className="form-group">
                    <label>Est. Hours</label>
                    <input className="form-control" type="number" value={form.transportDetails.estimatedTimeHours} onChange={(e) => setForm({ ...form, transportDetails: { ...form.transportDetails, estimatedTimeHours: e.target.value } })} />
                  </div>
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary">Create</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
