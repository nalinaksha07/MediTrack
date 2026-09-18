import { useEffect, useState } from 'react';
import { getConsumptions, getHospitals, getMedicines, createConsumption } from '../services/api';

export default function Consumption() {
  const [consumptions, setConsumptions] = useState([]);
  const [hospitals, setHospitals] = useState([]);
  const [medicines, setMedicines] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({
    hospital: '', medicine: '', quantity: '', department: 'General', reason: 'patient_use', notes: '',
  });

  const load = async () => {
    try {
      const [cRes, hRes, mRes] = await Promise.all([
        getConsumptions(),
        getHospitals(),
        getMedicines(),
      ]);
      setConsumptions(cRes.data);
      setHospitals(hRes.data);
      setMedicines(mRes.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await createConsumption({ ...form, quantity: Number(form.quantity) });
      setShowModal(false);
      setForm({ hospital: '', medicine: '', quantity: '', department: 'General', reason: 'patient_use', notes: '' });
      load();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to record consumption');
    }
  };

  if (loading) return <div className="loading">Loading consumption history...</div>;

  return (
    <div>
      <div className="page-header">
        <h2>Consumption History</h2>
        <button className="btn btn-primary" onClick={() => setShowModal(true)}>+ Record Consumption</button>
      </div>

      <div className="card">
        <div className="table-container">
          <table>
            <thead>
              <tr>
                <th>Date</th>
                <th>Hospital</th>
                <th>Medicine</th>
                <th>Qty</th>
                <th>Department</th>
                <th>Reason</th>
                <th>Recorded By</th>
              </tr>
            </thead>
            <tbody>
              {consumptions.map((c) => (
                <tr key={c._id}>
                  <td>{new Date(c.consumptionDate).toLocaleDateString()}</td>
                  <td>{c.hospital?.name}</td>
                  <td>{c.medicine?.name}</td>
                  <td>{c.quantity}</td>
                  <td>{c.department}</td>
                  <td>{c.reason?.replace('_', ' ')}</td>
                  <td>{c.recordedBy?.name || '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
          {consumptions.length === 0 && <div className="empty-state">No consumption records</div>}
        </div>
      </div>

      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Record Consumption</h3>
              <button className="btn btn-outline btn-sm" onClick={() => setShowModal(false)}>✕</button>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="modal-body">
                <div className="form-group">
                  <label>Hospital</label>
                  <select className="form-control" value={form.hospital} onChange={(e) => setForm({ ...form, hospital: e.target.value })} required>
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
                <div className="form-row">
                  <div className="form-group">
                    <label>Quantity</label>
                    <input className="form-control" type="number" min="1" value={form.quantity} onChange={(e) => setForm({ ...form, quantity: e.target.value })} required />
                  </div>
                  <div className="form-group">
                    <label>Department</label>
                    <select className="form-control" value={form.department} onChange={(e) => setForm({ ...form, department: e.target.value })}>
                      {['General', 'ICU', 'Emergency', 'OPD', 'Surgery', 'Pediatrics'].map((d) => (
                        <option key={d} value={d}>{d}</option>
                      ))}
                    </select>
                  </div>
                </div>
                <div className="form-group">
                  <label>Reason</label>
                  <select className="form-control" value={form.reason} onChange={(e) => setForm({ ...form, reason: e.target.value })}>
                    <option value="patient_use">Patient Use</option>
                    <option value="procedure">Procedure</option>
                    <option value="emergency">Emergency</option>
                    <option value="waste">Waste</option>
                    <option value="other">Other</option>
                  </select>
                </div>
                <div className="form-group">
                  <label>Notes</label>
                  <textarea className="form-control" rows="2" value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} />
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary">Record</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
