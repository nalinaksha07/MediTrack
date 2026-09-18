import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { getDashboardStats, getInsights, runAIAnalysis } from '../services/api';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';

export default function Dashboard() {
  const [stats, setStats] = useState(null);
  const [insights, setInsights] = useState([]);
  const [loading, setLoading] = useState(true);
  const [analyzing, setAnalyzing] = useState(false);

  const load = async () => {
    try {
      const [statsRes, insightsRes] = await Promise.all([
        getDashboardStats(),
        getInsights({ status: 'Open' }),
      ]);
      setStats(statsRes.data);
      setInsights(insightsRes.data.slice(0, 8));
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const handleAnalyze = async () => {
    setAnalyzing(true);
    try {
      await runAIAnalysis();
      await load();
    } catch (err) {
      alert(err.response?.data?.message || 'Analysis failed');
    } finally {
      setAnalyzing(false);
    }
  };

  if (loading) return <div className="loading">Loading dashboard...</div>;

  const chartData = [
    { name: 'Critical', value: stats?.criticalInsights || 0 },
    { name: 'Low Stock', value: stats?.lowStock || 0 },
    { name: 'Expiring', value: stats?.expiringSoon || 0 },
    { name: 'Transfers', value: stats?.pendingTransfers || 0 },
    { name: 'Purchases', value: stats?.pendingPurchases || 0 },
  ];

  return (
    <div>
      <div className="page-header">
        <h2>Dashboard</h2>
        <button className="btn btn-primary" onClick={handleAnalyze} disabled={analyzing}>
          {analyzing ? 'Running AI...' : '🤖 Run AI Analysis'}
        </button>
      </div>

      <div className="stats-grid">
        <div className="stat-card primary">
          <span className="label">Hospitals</span>
          <span className="value">{stats?.hospitalCount ?? 0}</span>
        </div>
        <div className="stat-card info">
          <span className="label">Medicines</span>
          <span className="value">{stats?.medicineCount ?? 0}</span>
        </div>
        <div className="stat-card critical">
          <span className="label">Critical Alerts</span>
          <span className="value">{stats?.criticalInsights ?? 0}</span>
        </div>
        <div className="stat-card warning">
          <span className="label">Open Insights</span>
          <span className="value">{stats?.openInsights ?? 0}</span>
        </div>
        <div className="stat-card">
          <span className="label">Low Stock Items</span>
          <span className="value">{stats?.lowStock ?? 0}</span>
        </div>
        <div className="stat-card warning">
          <span className="label">Expiring Soon</span>
          <span className="value">{stats?.expiringSoon ?? 0}</span>
        </div>
        <div className="stat-card info">
          <span className="label">Pending Transfers</span>
          <span className="value">{stats?.pendingTransfers ?? 0}</span>
        </div>
        <div className="stat-card">
          <span className="label">Pending Purchases</span>
          <span className="value">{stats?.pendingPurchases ?? 0}</span>
        </div>
      </div>

      <div className="grid-2">
        <div className="card">
          <h3 style={{ marginBottom: '1rem' }}>Risk Overview</h3>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis dataKey="name" tick={{ fontSize: 12 }} />
              <YAxis tick={{ fontSize: 12 }} />
              <Tooltip />
              <Bar dataKey="value" fill="#0d9488" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="card">
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem' }}>
            <h3>Latest AI Insights</h3>
            <Link to="/ai-insights" className="btn btn-outline btn-sm">View All</Link>
          </div>
          {insights.length === 0 ? (
            <div className="empty-state">
              <div className="icon">🤖</div>
              <p>No open insights. Run AI Analysis to detect risks.</p>
            </div>
          ) : (
            insights.map((ins) => (
              <div key={ins._id} className={`card insight-card ${ins.riskLevel?.toLowerCase()}`} style={{ padding: '0.85rem', marginBottom: '0.5rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div>
                    <strong>{ins.medicine?.name}</strong>
                    <span style={{ color: '#64748b', marginLeft: '0.5rem', fontSize: '0.85rem' }}>
                      @ {ins.hospital?.name}
                    </span>
                  </div>
                  <span className={`badge badge-${ins.riskLevel?.toLowerCase()}`}>{ins.riskLevel}</span>
                </div>
                <div style={{ fontSize: '0.85rem', marginTop: '0.25rem' }}>
                  <strong>{ins.problem}</strong> → {ins.recommendedAction}
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
