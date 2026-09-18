import { useEffect, useState } from 'react';
import { getMedicines, createMedicine, updateMedicine } from '../services/api';

const categories = ['Antibiotic', 'Analgesic', 'Antipyretic', 'Antiviral', 'Vaccine', 'Cardiac', 'Diabetes', 'Respiratory', 'Other'];

export default function Medicines() {
  const [medicines, setMedicines] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({
    name: '', genericName: '', code: '', category: 'Other', unit: 'tablets',
    minStockLevel: 50, maxStockLevel: 500, reorderPoint: 100, averageDailyConsumption: 5,
  });

  const load = async () => {
    try {
      const res = await getMedicines({ search: search || undefined, category: category || undefined });
      setMedicines(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, [search, category]);

  const openCreate = () => {
    setEditing(null);
    setForm({
      name: '', genericName: '', code: '', category: 'Other', unit: 'tablets',
      minStockLevel: 50, maxStockLevel: 500, reorderPoint: 100, averageDailyConsumption: 5,
    });
    setShowModal(true);
  };

  const openEdit = (m) => {
    setEditing(m);
    setForm({
      name: m.name, genericName: m.genericName || '', code: m.code, category: m.category,
      unit: m.unit, minStockLevel: m.minStockLevel, maxStockLevel: m.maxStockLevel,
      reorderPoint: m.reorderPoint, averageDailyConsumption: m.averageDailyConsumption,
    });
    setShowModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editing) await updateMedicine(editing._id, form);
      else await createMedicine(form);
      setShowModal(false);
      load();
    } catch (err) {
      alert(err.response?.data?.message || 'Error saving medicine');
    }
  };

  if (loading) return <div className="loading">Loading medicines...</div>;

  return (
    <div>
      <div className="page-header">
        <h2>Medicines</h2>
        <button className="btn btn-primary" onClick={openCreate}>+ Add Medicine</button>
      </div>

      <div className="filters">
        <input className="form-control search-input" placeholder="Search name, code..." value={search} onChange={(e) => setSearch(e.target.value)} />
        <select className="form-control" value={category} onChange={(e) => setCategory(e.target.value)}>
          <option value="">All Categories</option>
          {categories.map((c) => <option key={c} value={c}>{c}</option>)}
        </select>
      </div>

      <div className="card">
        <div className="table-container">
          <table>
            <thead>
              <tr>
                <th>Code</th>
                <th>Name</th>
                <th>Generic</th>
                <th>Category</th>
                <th>Unit</th>
                <th>Min / Max</th>
                <th>Reorder</th>
                <th>Avg Daily</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {medicines.map((m) => (
                <tr key={m._id}>
                  <td><strong>{m.code}</strong></td>
                  <td>{m.name}</td>
                  <td>{m.genericName}</td>
                  <td>{m.category}</td>
                  <td>{m.unit}</td>
                  <td>{m.minStockLevel} / {m.maxStockLevel}</td>
                  <td>{m.reorderPoint}</td>
                  <td>{m.averageDailyConsumption}</td>
                  <td>
                    <button className="btn btn-outline btn-sm" onClick={() => openEdit(m)}>Edit</button>
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
              <h3>{editing ? 'Edit Medicine' : 'Add Medicine'}</h3>
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
                    <label>Generic Name</label>
                    <input className="form-control" value={form.genericName} onChange={(e) => setForm({ ...form, genericName: e.target.value })} />
                  </div>
                  <div className="form-group">
                    <label>Category</label>
                    <select className="form-control" value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })}>
                      {categories.map((c) => <option key={c} value={c}>{c}</option>)}
                    </select>
                  </div>
                </div>
                <div className="form-row">
                  <div className="form-group">
                    <label>Unit</label>
                    <input className="form-control" value={form.unit} onChange={(e) => setForm({ ...form, unit: e.target.value })} />
                  </div>
                  <div className="form-group">
                    <label>Avg Daily Consumption</label>
                    <input className="form-control" type="number" value={form.averageDailyConsumption} onChange={(e) => setForm({ ...form, averageDailyConsumption: Number(e.target.value) })} />
                  </div>
                </div>
                <div className="form-row">
                  <div className="form-group">
                    <label>Min Stock</label>
                    <input className="form-control" type="number" value={form.minStockLevel} onChange={(e) => setForm({ ...form, minStockLevel: Number(e.target.value) })} />
                  </div>
                  <div className="form-group">
                    <label>Max Stock</label>
                    <input className="form-control" type="number" value={form.maxStockLevel} onChange={(e) => setForm({ ...form, maxStockLevel: Number(e.target.value) })} />
                  </div>
                </div>
                <div className="form-group">
                  <label>Reorder Point</label>
                  <input className="form-control" type="number" value={form.reorderPoint} onChange={(e) => setForm({ ...form, reorderPoint: Number(e.target.value) })} />
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
