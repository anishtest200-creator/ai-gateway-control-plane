import React, { useState } from 'react';

/* ── Mock Data ── */
const initialRoutes = [
  { name: 'GPT-4o Primary', source: '/v1/chat/completions (gpt-4o)', provider: 'Azure OpenAI', endpoint: 'East US', strategy: 'Primary', priority: 1, health: 'healthy', status: 'Active' },
  { name: 'GPT-4o Fallback', source: '/v1/chat/completions (gpt-4o)', provider: 'Azure OpenAI', endpoint: 'West US', strategy: 'Failover', priority: 2, health: 'healthy', status: 'Active' },
  { name: 'GPT-4o Emergency', source: '/v1/chat/completions (gpt-4o)', provider: 'OpenAI Direct', endpoint: 'api.openai.com', strategy: 'Failover', priority: 3, health: 'healthy', status: 'Standby' },
  { name: 'Claude Sonnet', source: '/v1/chat/completions (claude-*)', provider: 'Anthropic', endpoint: 'api.anthropic.com', strategy: 'Primary', priority: 1, health: 'healthy', status: 'Active' },
  { name: 'Gemini Pro', source: '/v1/chat/completions (gemini-*)', provider: 'Google Vertex', endpoint: 'us-central1', strategy: 'Primary', priority: 1, health: 'degraded', status: 'Active' },
  { name: 'Cost-Optimized', source: '/v1/chat/completions (auto)', provider: 'Multi-Provider', endpoint: '—', strategy: 'Cost-Aware', priority: null, health: 'healthy', status: 'Active' },
];

const failoverChains = [
  { label: 'GPT-4o Chain', nodes: [
    { name: 'Azure OpenAI (East US)', health: 'healthy' },
    { name: 'Azure OpenAI (West US)', health: 'healthy' },
    { name: 'OpenAI Direct', health: 'healthy' },
  ]},
  { label: 'Claude Chain', nodes: [
    { name: 'Anthropic (Primary)', health: 'healthy' },
    { name: 'AWS Bedrock (Claude)', health: 'healthy' },
    { name: 'Azure OpenAI (GPT-4o)', health: 'healthy' },
  ]},
  { label: 'Auto-Route Chain (Cost-Aware)', nodes: [
    { name: 'Cheapest Available', health: 'healthy' },
    { name: 'Lowest Latency', health: 'healthy' },
    { name: 'Any Healthy', health: 'healthy' },
  ]},
];

/* ── Styles ── */
const card: React.CSSProperties = {
  backgroundColor: '#161616',
  border: '1px solid rgba(212, 168, 67, 0.10)',
  borderRadius: 8,
  padding: 20,
};

const heading: React.CSSProperties = {
  color: '#fff',
  fontSize: 14,
  fontWeight: 600,
  margin: 0,
  marginBottom: 16,
};

const healthDot = (h: string): React.CSSProperties => ({
  display: 'inline-block',
  width: 8,
  height: 8,
  borderRadius: '50%',
  backgroundColor: h === 'healthy' ? '#4ADE80' : h === 'degraded' ? '#F59E0B' : '#EF4444',
  marginRight: 6,
  verticalAlign: 'middle',
});

const statusPill = (s: string): React.CSSProperties => ({
  display: 'inline-block',
  padding: '2px 10px',
  borderRadius: 12,
  fontSize: 12,
  fontWeight: 600,
  backgroundColor: s === 'Active' ? 'rgba(74,222,128,0.15)' : 'rgba(212, 168, 67, 0.10)',
  color: s === 'Active' ? '#4ADE80' : '#999',
  border: `1px solid ${s === 'Active' ? 'rgba(74,222,128,0.3)' : 'rgba(212, 168, 67, 0.10)'}`,
});

const healthLabel = (h: string) =>
  h === 'healthy' ? '✓ Healthy' : h === 'degraded' ? '⚠ Degraded' : '✗ Unhealthy';

/* ── Component ── */
const Routing: React.FC = () => {
  const [filter, setFilter] = useState('all');
  const [hoveredRow, setHoveredRow] = useState<number | null>(null);
  const [routes, setRoutes] = useState(initialRoutes);
  const [showAddRoute, setShowAddRoute] = useState(false);
  const [showImportModal, setShowImportModal] = useState(false);
  const [editingRouteIndex, setEditingRouteIndex] = useState<number | null>(null);
  const [formData, setFormData] = useState({ name: '', source: '', provider: 'Azure OpenAI', endpoint: '', strategy: 'Primary', priority: 1 });

  const openAddModal = () => {
    setEditingRouteIndex(null);
    setFormData({ name: '', source: '', provider: 'Azure OpenAI', endpoint: '', strategy: 'Primary', priority: 1 });
    setShowAddRoute(true);
  };

  const openEditModal = (idx: number) => {
    const r = routes[idx];
    setEditingRouteIndex(idx);
    setFormData({ name: r.name, source: r.source, provider: r.provider, endpoint: r.endpoint, strategy: r.strategy, priority: r.priority ?? 1 });
    setShowAddRoute(true);
  };

  const handleSaveRoute = () => {
    const newRoute = { name: formData.name, source: formData.source, provider: formData.provider, endpoint: formData.endpoint, strategy: formData.strategy, priority: formData.priority as number | null, health: 'healthy', status: 'Active' };
    if (editingRouteIndex !== null) {
      setRoutes(prev => prev.map((r, i) => i === editingRouteIndex ? { ...r, ...newRoute } : r));
    } else {
      setRoutes(prev => [...prev, newRoute]);
    }
    setShowAddRoute(false);
  };

  const handleDeleteRoute = (idx: number) => {
    if (confirm('Delete this route?')) {
      setRoutes(prev => prev.filter((_, i) => i !== idx));
    }
  };

  const thStyle: React.CSSProperties = {
    textAlign: 'left',
    padding: '10px 12px',
    fontSize: 12,
    fontWeight: 600,
    color: '#999',
    borderBottom: '1px solid rgba(212, 168, 67, 0.10)',
    textTransform: 'uppercase',
    letterSpacing: 0.4,
    whiteSpace: 'nowrap',
  };

  const tdStyle = (idx: number): React.CSSProperties => ({
    padding: '10px 12px',
    fontSize: 13,
    color: '#E8E8E8',
    borderBottom: '1px solid rgba(212, 168, 67, 0.06)',
    backgroundColor: hoveredRow === idx ? '#1A1A1A' : 'transparent',
    transition: 'background-color 0.15s',
    whiteSpace: 'nowrap',
  });

  const filtered = filter === 'all'
    ? routes
    : routes.filter((r) => r.provider.toLowerCase().includes(filter));

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      {/* ── Top Action Bar ── */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
        <button
          style={{
            backgroundColor: '#D4A843',
            color: '#0A0A0A',
            border: 'none',
            borderRadius: 6,
            padding: '7px 18px',
            fontSize: 13,
            fontWeight: 600,
            cursor: 'pointer',
            fontFamily: 'inherit',
          }}
          onClick={openAddModal}
        >
          + Add Route
        </button>
        <button
          onClick={() => setShowImportModal(true)}
          style={{
            backgroundColor: 'transparent',
            color: '#ccc',
            border: '1px solid rgba(212, 168, 67, 0.10)',
            borderRadius: 6,
            padding: '7px 18px',
            fontSize: 13,
            fontWeight: 500,
            cursor: 'pointer',
            fontFamily: 'inherit',
          }}
        >
          Import Rules
        </button>
        <div style={{ flex: 1 }} />
        <select
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          style={{
            backgroundColor: '#1A1A1A',
            color: '#ccc',
            border: '1px solid rgba(212, 168, 67, 0.10)',
            borderRadius: 6,
            padding: '7px 12px',
            fontSize: 13,
            fontFamily: 'inherit',
            cursor: 'pointer',
          }}
        >
          <option value="all">All Providers</option>
          <option value="azure">Azure OpenAI</option>
          <option value="anthropic">Anthropic</option>
          <option value="google">Google Vertex</option>
          <option value="openai">OpenAI Direct</option>
        </select>
      </div>

      {/* ── 1. Routing Rules Table ── */}
      <div style={card}>
        <h3 style={heading}>Routing Rules</h3>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr>
                <th style={thStyle}>Rule Name</th>
                <th style={thStyle}>Source Pattern</th>
                <th style={thStyle}>Target Provider</th>
                <th style={thStyle}>Endpoint</th>
                <th style={thStyle}>Strategy</th>
                <th style={thStyle}>Priority</th>
                <th style={thStyle}>Health</th>
                <th style={thStyle}>Status</th>
                <th style={thStyle}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((r, i) => (
                <tr
                  key={r.name}
                  onMouseEnter={() => setHoveredRow(i)}
                  onMouseLeave={() => setHoveredRow(null)}
                  style={{ cursor: 'pointer', borderLeft: hoveredRow === i ? '2px solid #D4A843' : '2px solid transparent' }}
                >
                  <td style={{ ...tdStyle(i), color: '#D4A843', fontWeight: 600 }}>{r.name}</td>
                  <td style={tdStyle(i)}>
                    <code style={{ fontSize: 12, color: '#aaa', backgroundColor: '#1A1A1A', padding: '2px 6px', borderRadius: 4 }}>
                      {r.source}
                    </code>
                  </td>
                  <td style={tdStyle(i)}>{r.provider}</td>
                  <td style={{ ...tdStyle(i), fontFamily: 'monospace', fontSize: 12 }}>{r.endpoint}</td>
                  <td style={tdStyle(i)}>{r.strategy}</td>
                  <td style={{ ...tdStyle(i), textAlign: 'center' }}>{r.priority ?? '—'}</td>
                  <td style={tdStyle(i)}>
                    <span style={healthDot(r.health)} />
                    <span style={{ color: r.health === 'healthy' ? '#4ADE80' : r.health === 'degraded' ? '#F59E0B' : '#EF4444' }}>
                      {healthLabel(r.health)}
                    </span>
                  </td>
                  <td style={tdStyle(i)}>
                    <span style={statusPill(r.status)}>{r.status}</span>
                  </td>
                  <td style={tdStyle(i)}>
                    <span
                      onClick={(e) => { e.stopPropagation(); openEditModal(routes.indexOf(r)); }}
                      style={{ color: '#D4A843', fontSize: 12, cursor: 'pointer', marginRight: 10 }}
                    >Edit</span>
                    <span
                      onClick={(e) => { e.stopPropagation(); handleDeleteRoute(routes.indexOf(r)); }}
                      style={{ color: '#D4A843', fontSize: 12, cursor: 'pointer' }}
                    >Delete</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* ── 2. Failover Chains ── */}
      <div style={card}>
        <h3 style={heading}>Failover Chains</h3>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          {failoverChains.map((chain) => (
            <div key={chain.label}>
              <div style={{ fontSize: 13, fontWeight: 600, color: '#E8E8E8', marginBottom: 10 }}>
                {chain.label}
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 0, flexWrap: 'wrap' }}>
                {chain.nodes.map((node, ni) => (
                  <React.Fragment key={node.name}>
                    <span
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: 6,
                        padding: '6px 14px',
                        borderRadius: 20,
                        fontSize: 12,
                        fontWeight: 500,
                        color: '#fff',
                        backgroundColor: '#1A1A1A',
                        border: `1px solid ${node.health === 'healthy' ? '#4ADE80' : node.health === 'degraded' ? '#F59E0B' : '#EF4444'}`,
                      }}
                    >
                      <span style={healthDot(node.health)} />
                      {node.name}
                    </span>
                    {ni < chain.nodes.length - 1 && (
                      <span style={{ color: '#666', fontSize: 18, margin: '0 8px', userSelect: 'none' }}>→</span>
                    )}
                  </React.Fragment>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ── 3. Load Balancing Configuration ── */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
        {/* Strategy Card */}
        <div style={card}>
          <h3 style={heading}>Load Balancing Strategy</h3>
          <div style={{ fontSize: 13, color: '#999', marginBottom: 14 }}>
            Current: <span style={{ color: '#D4A843', fontWeight: 600 }}>Weighted Round Robin</span>
          </div>
          {[
            { label: 'Azure OpenAI', pct: 60, color: '#4F6BED' },
            { label: 'Anthropic', pct: 25, color: '#D4875E' },
            { label: 'Google Vertex', pct: 15, color: '#f59e0b' },
          ].map((item) => (
            <div key={item.label} style={{ marginBottom: 12 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, color: '#E8E8E8', marginBottom: 4 }}>
                <span>{item.label}</span>
                <span style={{ fontWeight: 600 }}>{item.pct}%</span>
              </div>
              <div style={{ height: 6, backgroundColor: 'rgba(212, 168, 67, 0.06)', borderRadius: 3, overflow: 'hidden' }}>
                <div style={{ width: `${item.pct}%`, height: '100%', backgroundColor: item.color, borderRadius: 3 }} />
              </div>
            </div>
          ))}
        </div>

        {/* Health Check Card */}
        <div style={card}>
          <h3 style={heading}>Health Check Configuration</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            {[
              { label: 'Interval', value: '30s' },
              { label: 'Timeout', value: '5s' },
              { label: 'Unhealthy Threshold', value: '3 consecutive failures' },
              { label: 'Auto-Recovery', value: 'Enabled' },
            ].map((row) => (
              <div key={row.label} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13 }}>
                <span style={{ color: '#999' }}>{row.label}</span>
                <span style={{ color: row.label === 'Auto-Recovery' ? '#4ADE80' : '#ccc', fontWeight: 500 }}>
                  {row.value}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
      {/* ── Add/Edit Route Modal ── */}
      {showAddRoute && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <div style={{ backgroundColor: '#1A1A1A', borderTop: '3px solid #D4A843', borderRadius: 8, padding: 24, width: '100%', maxWidth: 500, border: '1px solid rgba(212, 168, 67, 0.10)' }}>
            <h3 style={{ color: '#fff', fontSize: 16, fontWeight: 600, margin: '0 0 16px' }}>{editingRouteIndex !== null ? 'Edit Route' : 'Add Route'}</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div>
                <label style={{ color: '#999', fontSize: 12, marginBottom: 4, display: 'block' }}>Rule Name</label>
                <input value={formData.name} onChange={e => setFormData(f => ({ ...f, name: e.target.value }))} style={{ width: '100%', backgroundColor: '#0F0F0F', border: '1px solid rgba(212,168,67,0.15)', color: '#E8E8E8', padding: '8px 12px', borderRadius: 6, fontSize: 13, fontFamily: 'inherit', boxSizing: 'border-box' as const }} />
              </div>
              <div>
                <label style={{ color: '#999', fontSize: 12, marginBottom: 4, display: 'block' }}>Source Pattern</label>
                <input value={formData.source} onChange={e => setFormData(f => ({ ...f, source: e.target.value }))} placeholder="/api/v1/*" style={{ width: '100%', backgroundColor: '#0F0F0F', border: '1px solid rgba(212,168,67,0.15)', color: '#E8E8E8', padding: '8px 12px', borderRadius: 6, fontSize: 13, fontFamily: 'inherit', boxSizing: 'border-box' as const }} />
              </div>
              <div>
                <label style={{ color: '#999', fontSize: 12, marginBottom: 4, display: 'block' }}>Target Provider</label>
                <select value={formData.provider} onChange={e => setFormData(f => ({ ...f, provider: e.target.value }))} style={{ width: '100%', backgroundColor: '#0F0F0F', border: '1px solid rgba(212,168,67,0.15)', color: '#E8E8E8', padding: '8px 12px', borderRadius: 6, fontSize: 13, fontFamily: 'inherit' }}>
                  <option>Azure OpenAI</option>
                  <option>Anthropic</option>
                  <option>Google Vertex</option>
                  <option>OpenAI</option>
                  <option>AWS Bedrock</option>
                </select>
              </div>
              <div>
                <label style={{ color: '#999', fontSize: 12, marginBottom: 4, display: 'block' }}>Endpoint URL</label>
                <input value={formData.endpoint} onChange={e => setFormData(f => ({ ...f, endpoint: e.target.value }))} style={{ width: '100%', backgroundColor: '#0F0F0F', border: '1px solid rgba(212,168,67,0.15)', color: '#E8E8E8', padding: '8px 12px', borderRadius: 6, fontSize: 13, fontFamily: 'inherit', boxSizing: 'border-box' as const }} />
              </div>
              <div>
                <label style={{ color: '#999', fontSize: 12, marginBottom: 4, display: 'block' }}>Strategy</label>
                <select value={formData.strategy} onChange={e => setFormData(f => ({ ...f, strategy: e.target.value }))} style={{ width: '100%', backgroundColor: '#0F0F0F', border: '1px solid rgba(212,168,67,0.15)', color: '#E8E8E8', padding: '8px 12px', borderRadius: 6, fontSize: 13, fontFamily: 'inherit' }}>
                  <option>Primary</option>
                  <option>Failover</option>
                  <option>Load Balance</option>
                </select>
              </div>
              <div>
                <label style={{ color: '#999', fontSize: 12, marginBottom: 4, display: 'block' }}>Priority</label>
                <input type="number" min={1} max={10} value={formData.priority} onChange={e => setFormData(f => ({ ...f, priority: Number(e.target.value) }))} style={{ width: '100%', backgroundColor: '#0F0F0F', border: '1px solid rgba(212,168,67,0.15)', color: '#E8E8E8', padding: '8px 12px', borderRadius: 6, fontSize: 13, fontFamily: 'inherit', boxSizing: 'border-box' as const }} />
              </div>
            </div>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 20 }}>
              <button onClick={() => setShowAddRoute(false)} style={{ backgroundColor: 'transparent', color: '#ccc', border: '1px solid rgba(212, 168, 67, 0.10)', borderRadius: 6, padding: '8px 18px', fontSize: 13, fontWeight: 500, cursor: 'pointer', fontFamily: 'inherit' }}>Cancel</button>
              <button onClick={handleSaveRoute} style={{ backgroundColor: '#D4A843', color: '#0A0A0A', border: 'none', borderRadius: 6, padding: '8px 18px', fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}>{editingRouteIndex !== null ? 'Save Changes' : 'Create Route'}</button>
            </div>
          </div>
        </div>
      )}

      {/* ── Import Rules Modal ── */}
      {showImportModal && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <div style={{ backgroundColor: '#1A1A1A', borderTop: '3px solid #D4A843', borderRadius: 8, padding: 24, width: '100%', maxWidth: 400, border: '1px solid rgba(212, 168, 67, 0.10)', textAlign: 'center' as const }}>
            <div style={{ fontSize: 14, color: '#E8E8E8', marginBottom: 16 }}>Import from JSON or YAML file — coming soon</div>
            <button onClick={() => setShowImportModal(false)} style={{ backgroundColor: '#D4A843', color: '#0A0A0A', border: 'none', borderRadius: 6, padding: '8px 18px', fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}>Close</button>
          </div>
        </div>
      )}
    </div>
  );
};

export default Routing;
