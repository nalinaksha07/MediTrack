import { useEffect, useState } from 'react';
import { getHospitals, getInventory } from '../services/api';

export default function HospitalNetwork() {
  const [hospitals, setHospitals] = useState([]);
  const [inventory, setInventory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedMedicine, setSelectedMedicine] = useState('');

  useEffect(() => {
    const load = async () => {
      try {
        const [hRes, iRes] = await Promise.all([getHospitals(), getInventory()]);
        setHospitals(hRes.data);
        setInventory(iRes.data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const medicines = [...new Map(
    inventory.filter((i) => i.medicine).map((i) => [i.medicine._id, i.medicine])
  ).values()];

  const networkData = hospitals.map((h) => {
    const invs = inventory.filter((i) => i.hospital?._id === h._id || i.hospital === h._id);
    const totalStock = invs.reduce((s, i) => s + (i.totalQuantity || 0), 0);
    const lowItems = invs.filter((i) => i.totalQuantity <= (i.medicine?.minStockLevel || 50)).length;
    const selectedQty = selectedMedicine
      ? invs.find((i) => i.medicine?._id === selectedMedicine)?.totalQuantity || 0
      : null;
    return { hospital: h, totalStock, itemCount: invs.length, lowItems, selectedQty };
  });

  if (loading) return <div className="loading">Loading network...</div>;

  return (
    <div>
      <div className="page-header">
        <h2>Hospital Network</h2>
      </div>

      <p style={{ marginBottom: '1.25rem', color: '#64748b', fontSize: '0.9rem' }}>
        View stock across all hospitals. Select a medicine to compare availability for potential transfers.
      </p>

      <div className="filters">
        <select className="form-control" value={selectedMedicine} onChange={(e) => setSelectedMedicine(e.target.value)}>
          <option value="">Compare medicine stock...</option>
          {medicines.map((m) => (
            <option key={m._id} value={m._id}>{m.name} ({m.code})</option>
          ))}
        </select>
      </div>

      <div className="stats-grid">
        {networkData.map(({ hospital, totalStock, itemCount, lowItems, selectedQty }) => (
          <div key={hospital._id} className="stat-card">
            <span className="label">{hospital.code}</span>
            <span className="value" style={{ fontSize: '1.1rem' }}>{hospital.name}</span>
            <span className="sub">{hospital.address?.city}, {hospital.address?.state}</span>
            <div style={{ marginTop: '0.75rem', fontSize: '0.85rem' }}>
              <div>Items tracked: <strong>{itemCount}</strong></div>
              <div>Total units: <strong>{totalStock.toLocaleString()}</strong></div>
              {lowItems > 0 && (
                <div style={{ color: '#dc2626' }}>Low stock items: <strong>{lowItems}</strong></div>
              )}
              {selectedMedicine && selectedQty !== null && (
                <div style={{ marginTop: '0.5rem', padding: '0.4rem', background: '#f0fdfa', borderRadius: 6 }}>
                  Selected med stock: <strong>{selectedQty}</strong>
                  {selectedQty === 0 && <span className="badge badge-critical" style={{ marginLeft: 6 }}>None</span>}
                  {selectedQty > 0 && selectedQty < 100 && <span className="badge badge-high" style={{ marginLeft: 6 }}>Low</span>}
                  {selectedQty >= 300 && <span className="badge badge-low" style={{ marginLeft: 6 }}>Surplus</span>}
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {selectedMedicine && (
        <div className="card" style={{ marginTop: '1.25rem' }}>
          <h3 style={{ marginBottom: '1rem' }}>
            Stock Comparison: {medicines.find((m) => m._id === selectedMedicine)?.name}
          </h3>
          <div className="table-container">
            <table>
              <thead>
                <tr>
                  <th>Hospital</th>
                  <th>Quantity</th>
                  <th>Status</th>
                  <th>Potential Action</th>
                </tr>
              </thead>
              <tbody>
                {networkData
                  .sort((a, b) => (b.selectedQty || 0) - (a.selectedQty || 0))
                  .map(({ hospital, selectedQty }) => {
                    const qty = selectedQty || 0;
                    let status = 'OK';
                    let action = '—';
                    if (qty === 0) {
                      status = 'Stockout';
                      action = 'Transfer In / Procure';
                    } else if (qty < 100) {
                      status = 'Low';
                      action = 'Consider Transfer In';
                    } else if (qty >= 500) {
                      status = 'Surplus';
                      action = 'Can Transfer Out';
                    }
                    return (
                      <tr key={hospital._id}>
                        <td>{hospital.name}</td>
                        <td><strong>{qty}</strong></td>
                        <td>
                          <span className={`badge badge-${status === 'Stockout' || status === 'Low' ? 'critical' : status === 'Surplus' ? 'low' : 'open'}`}>
                            {status}
                          </span>
                        </td>
                        <td>{action}</td>
                      </tr>
                    );
                  })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
