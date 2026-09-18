import { useEffect, useState } from 'react';
import { getHospitals, createHospital, updateHospital } from '../services/api';

export default function Hospitals() {
  const [hospitals, setHospitals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({ name: '', code: '', address: { city: '', state: '' }, contact: { phone: '', email: '' }, capacity: 500 });

  const load = async () => {
    try {
      const res = await getHospitals();
      setHospitals(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const openCreate = () => {
    setEditing(null);
    setForm({ name: '', code: '', address: { city: '', state: '' }, contact: { phone: '', email: '' }, capacity: 500 });
    setShowModal(true);
  };

  const openEdit = (h) => {
    setEditing(h);
    setForm({
      name: h.name,
      code: h.code,
      address: h.address || { city: '', state: '' },
      contact: h.contact || { phone: '', email: '' },
      capacity: h.capacity || 500,
    });
    setShowModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editing) {
        await updateHospital(editing._id, form);
      } else {
        await createHospital(form);
      }
      setShowModal(false);
      load();
    } catch (err) {
      alert(err.response?.data?.message || 'Error saving hospital');
    }
  };

  if (loading) return <div className="loading">Loading hospitals...</div>;

  return (
    <div>
      <div className="page-header">
        <h2>Hospitals</h2>
        <button className="btn btn-primary" onClick={openCreate}>+ Add Hospital</button>
      </div>

      <div className="card">
        <div className="table-container">
          <table>
            <thead>
              <tr>
                <th>Code</th>
                <th>Name</th>
                <th>City</th>
                <th>State</th>
                <th>Contact</th>
                <th>Capacity</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {hospitals.map((h) => (
                <tr key={h._id}>
                  <td><strong>{h.code}</strong></td>
                  <td>{h.name}</td>
                  <td>{h.address?.city}</td>
                  <td>{h.address?.state}</td>
                  <td>{h.contact?.phone || h.contact?.email}</td>
                  <td>{h.capacity}</td>
                  <td>
                    <span className={`badge ${h.isActive ? 'badge-low' : 'badge-critical'}`}>
                      {h.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td>
                    <button className="btn btn-outline btn-sm" onClick={() => openEdit(h)}>Edit</button>
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
              <h3>{editing ? 'Edit Hospital' : 'Add Hospital'}</h3>
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
                    <label>Phone</label>
                    <input className="form-control" value={form.contact.phone} onChange={(e) => setForm({ ...form, contact: { ...form.contact, phone: e.target.value } })} />
                  </div>
                  <div className="form-group">
                    <label>Email</label>
                    <input className="form-control" type="email" value={form.contact.email} onChange={(e) => setForm({ ...form, contact: { ...form.contact, email: e.target.value } })} />
                  </div>
                </div>
                <div className="form-group">
                  <label>Capacity (beds)</label>
                  <input className="form-control" type="number" value={form.capacity} onChange={(e) => setForm({ ...form, capacity: Number(e.target.value) })} />
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
