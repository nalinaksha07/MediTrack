import { useEffect, useState } from 'react';
import { getInventory, getInsights, getConsumptions, getDashboardStats } from '../services/api';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, PieChart, Pie, Cell, Legend } from 'recharts';

const COLORS = ['#0d9488', '#0284c7', '#d97706', '#dc2626', '#7c3aed', '#16a34a'];

export default function Reports() {
  const [stats, setStats] = useState(null);
  const [inventory, setInventory] = useState([]);
  const [insights, setInsights] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const [sRes, iRes, insRes] = await Promise.all([
          getDashboardStats(),
          getInventory(),
          getInsights(),
        ]);
        setStats(sRes.data);
        setInventory(iRes.data);
        setInsights(insRes.data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  if (loading) return <div className="loading">Loading reports...</div>;

  // Stock by hospital
  const stockByHospital = {};
  inventory.forEach((inv) => {
    const name = inv.hospital?.name || inv.hospital?.code || 'Unknown';
    stockByHospital[name] = (stockByHospital[name] || 0) + (inv.totalQuantity || 0);
  });
  const hospitalChart = Object.entries(stockByHospital).map(([name, value]) => ({ name: name.split(' ')[0], value }));

  // Insights by problem
  const byProblem = {};
  insights.forEach((i) => {
    byProblem[i.problem] = (byProblem[i.problem] || 0) + 1;
  });
  const problemChart = Object.entries(byProblem).map(([name, value]) => ({ name, value }));

  // Insights by risk
  const byRisk = {};
  insights.forEach((i) => {
    byRisk[i.riskLevel] = (byRisk[i.riskLevel] || 0) + 1;
  });
  const riskChart = Object.entries(byRisk).map(([name, value]) => ({ name, value }));

  // Low stock list
  const lowStockList = inventory
    .filter((i) => i.totalQuantity <= (i.medicine?.minStockLevel || 50))
    .slice(0, 10);

  // Expiring
  const threshold = new Date();
  threshold.setDate(threshold.getDate() + 60);
  const expiringList = [];
  inventory.forEach((inv) => {
    inv.batches?.forEach((b) => {
      if (b.status === 'active' && b.quantity > 0 && new Date(b.expiryDate) <= threshold) {
        expiringList.push({
          hospital: inv.hospital?.name,
          medicine: inv.medicine?.name,
          batch: b.batchNumber,
          qty: b.quantity,
          expiry: b.expiryDate,
          days: Math.ceil((new Date(b.expiryDate) - new Date()) / (1000 * 60 * 60 * 24)),
        });
      }
    });
  });
  expiringList.sort((a, b) => a.days - b.days);

  return (
    <div>
      <div className="page-header">
        <h2>Reports</h2>
      </div>

      <div className="stats-grid">
        <div className="stat-card primary">
          <span className="label">Total Hospitals</span>
          <span className="value">{stats?.hospitalCount}</span>
        </div>
        <div className="stat-card info">
          <span className="label">Medicines Tracked</span>
          <span className="value">{stats?.medicineCount}</span>
        </div>
        <div className="stat-card critical">
          <span className="label">Critical Insights</span>
          <span className="value">{stats?.criticalInsights}</span>
        </div>
        <div className="stat-card warning">
          <span className="label">Low Stock Items</span>
          <span className="value">{stats?.lowStock}</span>
        </div>
      </div>

      <div className="grid-2" style={{ marginBottom: '1.25rem' }}>
        <div className="card">
          <h3 style={{ marginBottom: '1rem' }}>Stock by Hospital</h3>
          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={hospitalChart}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis dataKey="name" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} />
              <Tooltip />
              <Bar dataKey="value" fill="#0d9488" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
        <div className="card">
          <h3 style={{ marginBottom: '1rem' }}>Insights by Problem Type</h3>
          <ResponsiveContainer width="100%" height={240}>
            <PieChart>
              <Pie data={problemChart} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} label>
                {problemChart.map((_, i) => (
                  <Cell key={i} fill={COLORS[i % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="grid-2">
        <div className="card">
          <h3 style={{ marginBottom: '1rem' }}>Low Stock Items</h3>
          <div className="table-container">
            <table>
              <thead>
                <tr>
                  <th>Hospital</th>
                  <th>Medicine</th>
                  <th>Qty</th>
                  <th>Min Level</th>
                </tr>
              </thead>
              <tbody>
                {lowStockList.map((i) => (
                  <tr key={i._id}>
                    <td>{i.hospital?.name}</td>
                    <td>{i.medicine?.name}</td>
                    <td style={{ color: '#dc2626', fontWeight: 600 }}>{i.totalQuantity}</td>
                    <td>{i.medicine?.minStockLevel}</td>
                  </tr>
                ))}
                {lowStockList.length === 0 && (
                  <tr><td colSpan="4" style={{ textAlign: 'center', color: '#64748b' }}>No low stock items</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        <div className="card">
          <h3 style={{ marginBottom: '1rem' }}>Expiring Within 60 Days</h3>
          <div className="table-container">
            <table>
              <thead>
                <tr>
                  <th>Hospital</th>
                  <th>Medicine</th>
                  <th>Batch</th>
                  <th>Qty</th>
                  <th>Days Left</th>
                </tr>
              </thead>
              <tbody>
                {expiringList.slice(0, 10).map((e, idx) => (
                  <tr key={idx}>
                    <td>{e.hospital}</td>
                    <td>{e.medicine}</td>
                    <td>{e.batch}</td>
                    <td>{e.qty}</td>
                    <td>
                      <span className={`badge badge-${e.days <= 30 ? 'critical' : 'high'}`}>{e.days}d</span>
                    </td>
                  </tr>
                ))}
                {expiringList.length === 0 && (
                  <tr><td colSpan="5" style={{ textAlign: 'center', color: '#64748b' }}>No expiring batches</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
