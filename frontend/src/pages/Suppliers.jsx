import { useEffect, useState } from 'react';
import { getSuppliers, createSupplier, updateSupplier } from '../services/api';

export default function Suppliers() {
  const [suppliers, setSuppliers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({
    name: '', code: '', contact: { person: '', phone: '', email: '' },
    address: { city: '', state: '' }, deliveryTimeDays: 7, reliabilityScore: 80,
  });

  const load = async () => {
    try {
      const res = await getSuppliers();
      setSuppliers(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const openCreate = () => {
    setEditing(null);
    setForm({
      name: '', code: '', contact: { person: '', phone: '', email: '' },
      address: { city: '', state: '' }, deliveryTimeDays: 7, reliabilityScore: 80,
    });
    setShowModal(true);
  };

  const openEdit = (s) => {
    setEditing(s);
    setForm({
      name: s.name, code: s.code,
      contact: s.contact || { person: '', phone: '', email: '' },
      address: s.address || { city: '', state: '' },
      deliveryTimeDays: s.deliveryTimeDays, reliabilityScore: s.reliabilityScore,
    });
    setShowModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editing) await updateSupplier(editing._id, form);
      else await createSupplier(form);
      setShowModal(false);
      load();
    } catch (err) {
      alert(err.response?.data?.message || 'Error saving supplier');
    }
  };

  if (loading) return <div className="loading">Loading suppliers...</div>;

  return (
    <div>
      <div className="page-header">
        <h2>Suppliers</h2>
        <button className="btn btn-primary" onClick={openCreate}>+ Add Supplier</button>
      </div>

      <div className="card">
        <div className="table-container">
          <table>
            <thead>
              <tr>
                <th>Code</th>
                <th>Name</th>
                <th>Contact</th>
                <th>Location</th>
                <th>Delivery (days)</th>
                <th>Reliability</th>
                <th>Medicines</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {suppliers.map((s) => (
                <tr key={s._id}>
                  <td><strong>{s.code}</strong></td>
                  <td>{s.name}</td>
                  <td>
                    <div>{s.contact?.person}</div>
                    <div style={{ fontSize: '0.8rem', color: '#64748b' }}>{s.contact?.phone}</div>
                  </td>
                  <td>{s.address?.city}, {s.address?.state}</td>
                  <td>{s.deliveryTimeDays}</td>
                  <td>
                    <span className={`badge ${s.reliabilityScore >= 90 ? 'badge-low' : s.reliabilityScore >= 75 ? 'badge-medium' : 'badge-high'}`}>
                      {s.reliabilityScore}%
                    </span>
                  </td>
                  <td>{s.medicinesSupplied?.length || 0}</td>
                  <td>
                    <button className="btn btn-outline btn-sm" onClick={() => openEdit(s)}>Edit</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>{editing ? 'Edit Supplier' : 'Add Supplier'}</h3>
              <button className="btn btn-outline btn-sm" onClick={() => setShowModal(false)}>✕</button>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="modal-body">
                <div className="form-row">
                  <div className="form-group">
                    <label>Name</label>
                    <input className="form-control" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
                  </div>
                  <div className="form-group">
                    <label>Code</label>
                    <input className="form-control" value={form.code} onChange={(e) => setForm({ ...form, code: e.target.value.toUpperCase() })} required />
                  </div>
                </div>
                <div className="form-row">
                  <div className="form-group">
                    <label>Contact Person</label>
                    <input className="form-control" value={form.contact.person} onChange={(e) => setForm({ ...form, contact: { ...form.contact, person: e.target.value } })} />
                  </div>
                  <div className="form-group">
                    <label>Phone</label>
                    <input className="form-control" value={form.contact.phone} onChange={(e) => setForm({ ...form, contact: { ...form.contact, phone: e.target.value } })} />
                  </div>
                </div>
                <div className="form-group">
                  <label>Email</label>
                  <input className="form-control" type="email" value={form.contact.email} onChange={(e) => setForm({ ...form, contact: { ...form.contact, email: e.target.value } })} />
                </div>
                <div className="form-row">
                  <div className="form-group">
                    <label>City</label>
                    <input className="form-control" value={form.address.city} onChange={(e) => setForm({ ...form, address: { ...form.address, city: e.target.value } })} />
                  </div>
                  <div className="form-group">
                    <label>State</label>
                    <input className="form-control" value={form.address.state} onChange={(e) => setForm({ ...form, address: { ...form.address, state: e.target.value } })} />
                  </div>
                </div>
                <div className="form-row">
                  <div className="form-group">
                    <label>Delivery Time (days)</label>
                    <input className="form-control" type="number" value={form.deliveryTimeDays} onChange={(e) => setForm({ ...form, deliveryTimeDays: Number(e.target.value) })} />
                  </div>
                  <div className="form-group">
                    <label>Reliability Score (0-100)</label>
                    <input className="form-control" type="number" min="0" max="100" value={form.reliabilityScore} onChange={(e) => setForm({ ...form, reliabilityScore: Number(e.target.value) })} />
                  </div>
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary">Save</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
