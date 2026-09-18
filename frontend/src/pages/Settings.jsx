import { useAuth } from '../context/AuthContext';

export default function Settings() {
  const { user } = useAuth();

  return (
    <div>
      <div className="page-header">
        <h2>Settings</h2>
      </div>

      <div className="grid-2">
        <div className="card">
          <h3 style={{ marginBottom: '1rem' }}>Profile</h3>
          <div className="form-group">
            <label>Name</label>
            <input className="form-control" value={user?.name || ''} disabled />
          </div>
          <div className="form-group">
            <label>Email</label>
            <input className="form-control" value={user?.email || ''} disabled />
          </div>
          <div className="form-group">
            <label>Role</label>
            <input className="form-control" value={user?.role || ''} disabled />
          </div>
          <div className="form-group">
            <label>Hospital</label>
            <input className="form-control" value={user?.hospital?.name || '—'} disabled />
          </div>
        </div>

        <div className="card">
          <h3 style={{ marginBottom: '1rem' }}>About MediTrack</h3>
          <p style={{ fontSize: '0.9rem', color: '#475569', lineHeight: 1.7 }}>
            <strong>MediTrack</strong> is an AI-Powered Hospital Inventory Management System designed
            for multi-hospital networks. It uses an explainable rule-based Decision Engine that follows:
          </p>
          <ul style={{ margin: '1rem 0', paddingLeft: '1.25rem', fontSize: '0.9rem', color: '#475569' }}>
            <li><strong>Detect</strong> — Expiry, stockout, overstock, high demand</li>
            <li><strong>Predict</strong> — Days to stockout, projected waste</li>
            <li><strong>Decide</strong> — Best action based on network availability</li>
            <li><strong>Recommend</strong> — Transfer, procure, FEFO use, dispose</li>
          </ul>
          <p style={{ fontSize: '0.85rem', color: '#64748b' }}>
            Version 1.0.0 • Built for hackathon demonstration
          </p>
        </div>
      </div>

      <div className="card" style={{ marginTop: '1.25rem' }}>
        <h3 style={{ marginBottom: '0.75rem' }}>AI Decision Engine Thresholds</h3>
        <div className="table-container">
          <table>
            <thead>
              <tr>
                <th>Parameter</th>
                <th>Value</th>
                <th>Description</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>Expiry Critical</td>
                <td>≤ 30 days</td>
                <td>Batches expiring within 30 days flagged as Critical</td>
              </tr>
              <tr>
                <td>Expiry High</td>
                <td>≤ 60 days</td>
                <td>Batches expiring within 60 days flagged as High</td>
              </tr>
              <tr>
                <td>Stockout Threshold</td>
                <td>≤ 14 days of stock</td>
                <td>Based on average daily consumption</td>
              </tr>
              <tr>
                <td>Overstock Multiplier</td>
                <td>2.5 × max stock level</td>
                <td>Triggers overstock detection</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
