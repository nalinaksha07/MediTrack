import { useEffect, useState } from 'react';
import { getInsights, runAIAnalysis, updateInsightStatus, createTransferFromAI, getHospitals } from '../services/api';

export default function AIInsights() {
  const [insights, setInsights] = useState([]);
  const [hospitals, setHospitals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [analyzing, setAnalyzing] = useState(false);
  const [filters, setFilters] = useState({ hospital: '', status: 'Open', riskLevel: '', problem: '' });

  const load = async () => {
    try {
      const params = {};
      if (filters.hospital) params.hospital = filters.hospital;
      if (filters.status) params.status = filters.status;
      if (filters.riskLevel) params.riskLevel = filters.riskLevel;
      if (filters.problem) params.problem = filters.problem;
      const [iRes, hRes] = await Promise.all([getInsights(params), getHospitals()]);
      setInsights(iRes.data);
      setHospitals(hRes.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, [filters]);

  const handleAnalyze = async () => {
    setAnalyzing(true);
    try {
      const res = await runAIAnalysis(filters.hospital || null);
      alert(res.data.message);
      load();
    } catch (err) {
      alert(err.response?.data?.message || 'Analysis failed');
    } finally {
      setAnalyzing(false);
    }
  };

  const handleStatus = async (id, status) => {
    try {
      await updateInsightStatus(id, status);
      load();
    } catch (err) {
      alert(err.response?.data?.message || 'Update failed');
    }
  };

  const handleCreateTransfer = async (id) => {
    if (!confirm('Create a transfer recommendation from this AI insight?')) return;
    try {
      const res = await createTransferFromAI(id);
      alert(`Transfer ${res.data.transferNumber} created (status: recommended)`);
      load();
    } catch (err) {
      alert(err.response?.data?.message || 'Could not create transfer');
    }
  };

  if (loading) return <div className="loading">Loading AI insights...</div>;

  return (
    <div>
      <div className="page-header">
        <h2>AI Insights</h2>
        <button className="btn btn-primary" onClick={handleAnalyze} disabled={analyzing}>
          {analyzing ? 'Analyzing...' : 'Run AI Analysis'}
        </button>
      </div>

      <div className="filters">
        <select className="form-control" value={filters.hospital} onChange={(e) => setFilters({ ...filters, hospital: e.target.value })}>
          <option value="">All Hospitals</option>
          {hospitals.map((h) => <option key={h._id} value={h._id}>{h.name}</option>)}
        </select>
        <select className="form-control" value={filters.status} onChange={(e) => setFilters({ ...filters, status: e.target.value })}>
          <option value="">All Status</option>
          {['Open', 'Acknowledged', 'In Progress', 'Resolved', 'Dismissed'].map((s) => (
            <option key={s} value={s}>{s}</option>
          ))}
        </select>
        <select className="form-control" value={filters.riskLevel} onChange={(e) => setFilters({ ...filters, riskLevel: e.target.value })}>
          <option value="">All Risk Levels</option>
          {['Critical', 'High', 'Medium', 'Low'].map((r) => (
            <option key={r} value={r}>{r}</option>
          ))}
        </select>
        <select className="form-control" value={filters.problem} onChange={(e) => setFilters({ ...filters, problem: e.target.value })}>
          <option value="">All Problems</option>
          {['Expiry Risk', 'High Demand', 'Stockout Risk', 'Overstock', 'Supplier Issue'].map((p) => (
            <option key={p} value={p}>{p}</option>
          ))}
        </select>
      </div>

      {insights.length === 0 ? (
        <div className="card empty-state">
          <div className="icon">AI</div>
          <p>No insights found. Click "Run AI Analysis" to detect risks across hospitals.</p>
        </div>
      ) : (
        insights.map((ins) => (
          <div key={ins._id} className={`card insight-card ${ins.riskLevel?.toLowerCase()}`} style={{ marginBottom: '1rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.5rem' }}>
              <div>
                <h3 style={{ fontSize: '1.05rem' }}>
                  {ins.medicine?.name} <span style={{ fontWeight: 400, color: '#64748b' }}>@ {ins.hospital?.name}</span>
                </h3>
                <div style={{ marginTop: '0.35rem' }}>
                  <span className={`badge badge-${ins.riskLevel?.toLowerCase()}`}>{ins.riskLevel}</span>
                  <span className="badge badge-open" style={{ marginLeft: 6 }}>{ins.problem}</span>
                  <span className={`badge badge-${ins.status === 'Open' ? 'open' : 'resolved'}`} style={{ marginLeft: 6 }}>{ins.status}</span>
                  <span className="badge badge-pending" style={{ marginLeft: 6 }}>Urgency: {ins.urgency}</span>
                </div>
              </div>
              <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap' }}>
                {ins.status === 'Open' && (
                  <>
                    <button className="btn btn-outline btn-sm" onClick={() => handleStatus(ins._id, 'Acknowledged')}>Acknowledge</button>
                    <button className="btn btn-outline btn-sm" onClick={() => handleStatus(ins._id, 'Resolved')}>Resolve</button>
                    <button className="btn btn-outline btn-sm" onClick={() => handleStatus(ins._id, 'Dismissed')}>Dismiss</button>
                  </>
                )}
                {(ins.recommendedAction === 'Transfer In' || ins.recommendedAction === 'Transfer Out') &&
                  ins.metadata?.transferSuggestion &&
                  ins.status === 'Open' && (
                    <button className="btn btn-primary btn-sm" onClick={() => handleCreateTransfer(ins._id)}>
                      Create Transfer
                    </button>
                  )}
              </div>
            </div>

            <div className="insight-meta">
              <span><strong>Current Stock:</strong> {ins.currentStock}</span>
              <span><strong>Recommended Action:</strong> {ins.recommendedAction}</span>
              {ins.recommendedQuantity > 0 && (
                <span><strong>Qty:</strong> {ins.recommendedQuantity}</span>
              )}
            </div>

            <p style={{ marginTop: '0.75rem', fontSize: '0.9rem' }}>
              <strong>Reason:</strong> {ins.reason}
            </p>
            {ins.prediction && (
              <p style={{ fontSize: '0.9rem', color: '#475569' }}>
                <strong>Prediction:</strong> {ins.prediction}
              </p>
            )}

            {ins.metadata?.transferSuggestion && (
              <div style={{ marginTop: '0.75rem', padding: '0.75rem', background: '#f0fdfa', borderRadius: 8, fontSize: '0.85rem' }}>
                <strong>Transfer Suggestion:</strong>{' '}
                {ins.metadata.transferSuggestion.fromHospitalName && (
                  <>From {ins.metadata.transferSuggestion.fromHospitalName} → </>
                )}
                {ins.metadata.transferSuggestion.toHospitalName && (
                  <>To {ins.metadata.transferSuggestion.toHospitalName}</>
                )}
                {' '}• Qty: {ins.metadata.transferSuggestion.quantity}
                <br />
                <em>{ins.metadata.transferSuggestion.reason}</em>
              </div>
            )}

            {ins.metadata?.supplierSuggestion && (
              <div style={{ marginTop: '0.75rem', padding: '0.75rem', background: '#eff6ff', borderRadius: 8, fontSize: '0.85rem' }}>
                <strong>Supplier Suggestion:</strong> {ins.metadata.supplierSuggestion.supplierName}
                {' '}• Delivery: {ins.metadata.supplierSuggestion.deliveryDays} days
                {' '}• Reliability: {ins.metadata.supplierSuggestion.reliability}%
              </div>
            )}
          </div>
        ))
      )}
    </div>
  );
}
