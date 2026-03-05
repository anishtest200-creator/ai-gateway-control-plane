import React, { useState } from 'react';

/* ── Types ── */
interface Endpoint {
  provider: string;
  region: string;
  health: 'healthy' | 'degraded' | 'unhealthy';
  weight?: number;
}

interface RouteGroup {
  id: string;
  name: string;
  pattern: string;
  strategy: 'failover' | 'load-balance' | 'single';
  enabled: boolean;
  endpoints: Endpoint[];
}

/* ── Mock Data ── */
const initialGroups: RouteGroup[] = [
  {
    id: 'gpt4o',
    name: 'GPT-4o',
    pattern: '/v1/chat/completions (gpt-4o*)',
    strategy: 'failover',
    enabled: true,
    endpoints: [
      { provider: 'Azure OpenAI', region: 'East US', health: 'healthy' },
      { provider: 'Azure OpenAI', region: 'West US', health: 'healthy' },
      { provider: 'OpenAI Direct', region: 'api.openai.com', health: 'healthy' },
    ],
  },
  {
    id: 'claude',
    name: 'Claude Sonnet',
    pattern: '/v1/chat/completions (claude-*)',
    strategy: 'failover',
    enabled: true,
    endpoints: [
      { provider: 'Anthropic', region: 'api.anthropic.com', health: 'healthy' },
      { provider: 'AWS Bedrock', region: 'us-east-1', health: 'healthy' },
    ],
  },
  {
    id: 'gemini',
    name: 'Gemini Pro',
    pattern: '/v1/chat/completions (gemini-*)',
    strategy: 'single',
    enabled: true,
    endpoints: [
      { provider: 'Google Vertex', region: 'us-central1', health: 'degraded' },
    ],
  },
  {
    id: 'auto',
    name: 'Auto-Route (Cost Optimized)',
    pattern: '/v1/chat/completions (auto)',
    strategy: 'load-balance',
    enabled: true,
    endpoints: [
      { provider: 'Azure OpenAI', region: 'East US', health: 'healthy', weight: 60 },
      { provider: 'Anthropic', region: 'api.anthropic.com', health: 'healthy', weight: 25 },
      { provider: 'Google Vertex', region: 'us-central1', health: 'degraded', weight: 15 },
    ],
  },
];

/* ── Styles ── */
const colors = {
  gold: '#D4A843',
  card: '#161616',
  border: 'rgba(212, 168, 67, 0.10)',
  text: '#E8E8E8',
  textMuted: '#999',
  green: '#4ADE80',
  amber: '#F59E0B',
  red: '#EF4444',
  purple: '#A78BFA',
  blue: '#60A5FA',
};

const card: React.CSSProperties = {
  backgroundColor: colors.card,
  border: `1px solid ${colors.border}`,
  borderRadius: 8,
  padding: 16,
};

const inputStyle: React.CSSProperties = {
  width: '100%',
  backgroundColor: '#0F0F0F',
  border: '1px solid rgba(212,168,67,0.15)',
  color: colors.text,
  padding: '8px 12px',
  borderRadius: 6,
  fontSize: 13,
  fontFamily: 'inherit',
  boxSizing: 'border-box' as const,
};

const selectStyle: React.CSSProperties = { ...inputStyle };

const healthColor = (h: string) => h === 'healthy' ? colors.green : h === 'degraded' ? colors.amber : colors.red;
const healthLabel = (h: string) => h === 'healthy' ? 'Healthy' : h === 'degraded' ? 'Degraded' : 'Unhealthy';
const strategyLabel = (s: string) => s === 'failover' ? 'Failover Chain' : s === 'load-balance' ? 'Load Balanced' : 'Single Endpoint';
const strategyColor = (s: string) => s === 'failover' ? colors.purple : s === 'load-balance' ? colors.blue : colors.textMuted;

const providerColors: Record<string, string> = {
  'Azure OpenAI': '#4F6BED',
  'Anthropic': '#D4875E',
  'Google Vertex': colors.amber,
  'OpenAI Direct': '#10B981',
  'AWS Bedrock': '#FF9900',
};

/* ── Component ── */
const Routing: React.FC = () => {
  const [groups, setGroups] = useState<RouteGroup[]>(initialGroups);
  const [search, setSearch] = useState('');
  const [showCreate, setShowCreate] = useState(false);
  const [createStep, setCreateStep] = useState<1 | 2>(1);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [expandedGroup, setExpandedGroup] = useState<string | null>(null);

  // Form state
  const [formName, setFormName] = useState('');
  const [formPattern, setFormPattern] = useState('');
  const [formStrategy, setFormStrategy] = useState<'failover' | 'load-balance' | 'single'>('failover');
  const [formEndpoints, setFormEndpoints] = useState<Endpoint[]>([{ provider: 'Azure OpenAI', region: '', health: 'healthy' }]);

  const resetForm = () => {
    setFormName(''); setFormPattern(''); setFormStrategy('failover');
    setFormEndpoints([{ provider: 'Azure OpenAI', region: '', health: 'healthy' }]);
    setCreateStep(1); setEditingId(null);
  };

  const openCreate = () => { resetForm(); setShowCreate(true); };

  const openEdit = (g: RouteGroup) => {
    setEditingId(g.id);
    setFormName(g.name); setFormPattern(g.pattern); setFormStrategy(g.strategy);
    setFormEndpoints(g.endpoints.map(e => ({ ...e })));
    setCreateStep(1); setShowCreate(true);
  };

  const handleSave = () => {
    const newGroup: RouteGroup = {
      id: editingId || `route-${Date.now()}`,
      name: formName,
      pattern: formPattern,
      strategy: formStrategy,
      enabled: true,
      endpoints: formEndpoints,
    };
    if (editingId) {
      setGroups(prev => prev.map(g => g.id === editingId ? newGroup : g));
    } else {
      setGroups(prev => [...prev, newGroup]);
    }
    setShowCreate(false); resetForm();
  };

  const handleDelete = (id: string) => {
    if (confirm('Delete this route group?')) {
      setGroups(prev => prev.filter(g => g.id !== id));
    }
  };

  const toggleEnabled = (id: string) => {
    setGroups(prev => prev.map(g => g.id === id ? { ...g, enabled: !g.enabled } : g));
  };

  const addEndpoint = () => {
    setFormEndpoints(prev => [...prev, { provider: 'Azure OpenAI', region: '', health: 'healthy' }]);
  };

  const removeEndpoint = (idx: number) => {
    setFormEndpoints(prev => prev.filter((_, i) => i !== idx));
  };

  const updateEndpoint = (idx: number, field: keyof Endpoint, value: string | number) => {
    setFormEndpoints(prev => prev.map((ep, i) => i === idx ? { ...ep, [field]: value } : ep));
  };

  // Stats
  const totalEndpoints = groups.reduce((s, g) => s + g.endpoints.length, 0);
  const healthyEndpoints = groups.reduce((s, g) => s + g.endpoints.filter(e => e.health === 'healthy').length, 0);
  const degradedEndpoints = groups.reduce((s, g) => s + g.endpoints.filter(e => e.health === 'degraded').length, 0);

  const filtered = search
    ? groups.filter(g => g.name.toLowerCase().includes(search.toLowerCase()) || g.pattern.toLowerCase().includes(search.toLowerCase()))
    : groups;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>

      {/* ── Stat Cards ── */}
      <div style={{ display: 'flex', gap: 14, alignItems: 'stretch' }}>
        {[
          { label: 'Route Groups', value: groups.length, color: colors.gold },
          { label: 'Endpoints', value: totalEndpoints, color: colors.purple },
          { label: 'Healthy', value: healthyEndpoints, color: colors.green },
          { label: 'Degraded', value: degradedEndpoints, color: degradedEndpoints > 0 ? colors.amber : colors.green },
        ].map((s) => (
          <div key={s.label} style={{ ...card, flex: 1, display: 'flex', flexDirection: 'column', gap: 4 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <span style={{ width: 8, height: 8, borderRadius: '50%', backgroundColor: s.color, display: 'inline-block', flexShrink: 0 }} />
              <span style={{ color: colors.textMuted, fontSize: 12 }}>{s.label}</span>
            </div>
            <span style={{ color: '#fff', fontSize: 28, fontWeight: 700, lineHeight: 1.1 }}>{s.value}</span>
          </div>
        ))}
      </div>

      {/* ── Action Bar ── */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
        <button onClick={openCreate} style={{ backgroundColor: colors.gold, color: '#0A0A0A', border: 'none', borderRadius: 6, padding: '8px 18px', fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}>
          + Create Route
        </button>
        <input
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Search routes..."
          style={{ flex: 1, minWidth: 200, ...inputStyle }}
        />
        <span style={{ color: colors.textMuted, fontSize: 13 }}>{filtered.length} route{filtered.length !== 1 ? 's' : ''}</span>
      </div>

      {/* ── Route Group Cards ── */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        {filtered.length === 0 && (
          <div style={{ ...card, textAlign: 'center', padding: 40, color: colors.textMuted }}>
            No route groups found. Create one to get started.
          </div>
        )}
        {filtered.map(g => {
          const isExpanded = expandedGroup === g.id;
          return (
            <div key={g.id} style={{ ...card, padding: 0, opacity: g.enabled ? 1 : 0.5, transition: 'opacity 0.2s' }}>
              {/* Card Header */}
              <div
                onClick={() => setExpandedGroup(isExpanded ? null : g.id)}
                style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '14px 16px', cursor: 'pointer' }}
              >
                <span style={{ color: colors.textMuted, fontSize: 12, transition: 'transform 0.2s', transform: isExpanded ? 'rotate(90deg)' : 'none' }}>▶</span>

                {/* Name + pattern */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span style={{ color: '#fff', fontWeight: 600, fontSize: 14 }}>{g.name}</span>
                    <code style={{ fontSize: 11, color: '#888', backgroundColor: '#1A1A1A', padding: '2px 8px', borderRadius: 4 }}>{g.pattern}</code>
                  </div>
                </div>

                {/* Strategy pill */}
                <span style={{
                  padding: '3px 10px', borderRadius: 12, fontSize: 11, fontWeight: 600,
                  color: strategyColor(g.strategy), backgroundColor: `${strategyColor(g.strategy)}15`,
                  border: `1px solid ${strategyColor(g.strategy)}30`,
                }}>
                  {strategyLabel(g.strategy)}
                </span>

                {/* Endpoint chain preview */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                  {g.endpoints.map((ep, ei) => (
                    <React.Fragment key={ei}>
                      {ei > 0 && <span style={{ color: '#444', fontSize: 12 }}>→</span>}
                      <span style={{
                        width: 8, height: 8, borderRadius: '50%',
                        backgroundColor: healthColor(ep.health), display: 'inline-block',
                      }} title={`${ep.provider} (${ep.region}) — ${healthLabel(ep.health)}`} />
                    </React.Fragment>
                  ))}
                </div>

                {/* Toggle + actions */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }} onClick={e => e.stopPropagation()}>
                  <button
                    onClick={() => toggleEnabled(g.id)}
                    style={{
                      width: 36, height: 20, borderRadius: 10, border: 'none', cursor: 'pointer',
                      backgroundColor: g.enabled ? colors.green : '#333', position: 'relative', transition: 'background-color 0.2s',
                    }}
                  >
                    <span style={{
                      position: 'absolute', top: 2, left: g.enabled ? 18 : 2,
                      width: 16, height: 16, borderRadius: '50%', backgroundColor: '#fff',
                      transition: 'left 0.2s',
                    }} />
                  </button>
                  <span onClick={() => openEdit(g)} style={{ color: colors.gold, fontSize: 12, cursor: 'pointer', fontWeight: 500 }}>Edit</span>
                  <span onClick={() => handleDelete(g.id)} style={{ color: colors.red, fontSize: 12, cursor: 'pointer', fontWeight: 500 }}>Delete</span>
                </div>
              </div>

              {/* Expanded Detail */}
              {isExpanded && (
                <div style={{ borderTop: `1px solid ${colors.border}`, padding: 16, display: 'flex', flexDirection: 'column', gap: 14 }}>
                  {/* Endpoint chain visualization */}
                  <div>
                    <div style={{ fontSize: 12, color: colors.textMuted, marginBottom: 10, textTransform: 'uppercase', letterSpacing: 0.5 }}>
                      {g.strategy === 'failover' ? 'Failover Order (priority left → right)' : g.strategy === 'load-balance' ? 'Traffic Distribution' : 'Endpoint'}
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 0, flexWrap: 'wrap' }}>
                      {g.endpoints.map((ep, ei) => (
                        <React.Fragment key={ei}>
                          <div style={{
                            display: 'inline-flex', alignItems: 'center', gap: 8,
                            padding: '8px 14px', borderRadius: 8, backgroundColor: '#1A1A1A',
                            border: `1px solid ${healthColor(ep.health)}40`,
                          }}>
                            <span style={{ width: 8, height: 8, borderRadius: '50%', backgroundColor: healthColor(ep.health), flexShrink: 0 }} />
                            <div>
                              <div style={{ fontSize: 13, color: '#fff', fontWeight: 500 }}>{ep.provider}</div>
                              <div style={{ fontSize: 11, color: colors.textMuted, fontFamily: 'monospace' }}>{ep.region}</div>
                            </div>
                            {g.strategy === 'load-balance' && ep.weight != null && (
                              <span style={{ fontSize: 13, fontWeight: 700, color: providerColors[ep.provider] || colors.gold, marginLeft: 4 }}>{ep.weight}%</span>
                            )}
                            {g.strategy === 'failover' && (
                              <span style={{ fontSize: 11, color: colors.textMuted }}>P{ei + 1}</span>
                            )}
                          </div>
                          {ei < g.endpoints.length - 1 && (
                            <span style={{ color: '#555', fontSize: 16, margin: '0 8px', userSelect: 'none' }}>
                              {g.strategy === 'failover' ? '→' : '·'}
                            </span>
                          )}
                        </React.Fragment>
                      ))}
                    </div>
                  </div>

                  {/* Load balance bars */}
                  {g.strategy === 'load-balance' && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                      {g.endpoints.filter(ep => ep.weight != null).map((ep, i) => (
                        <div key={i}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, color: colors.text, marginBottom: 3 }}>
                            <span>{ep.provider} ({ep.region})</span>
                            <span style={{ fontWeight: 600 }}>{ep.weight}%</span>
                          </div>
                          <div style={{ height: 5, backgroundColor: 'rgba(212,168,67,0.06)', borderRadius: 3, overflow: 'hidden' }}>
                            <div style={{ width: `${ep.weight}%`, height: '100%', backgroundColor: providerColors[ep.provider] || colors.gold, borderRadius: 3 }} />
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Health config summary */}
                  <div style={{ display: 'flex', gap: 20, fontSize: 12, color: colors.textMuted }}>
                    <span>Health check: <span style={{ color: colors.text }}>30s interval</span></span>
                    <span>Timeout: <span style={{ color: colors.text }}>5s</span></span>
                    <span>Auto-recovery: <span style={{ color: colors.green }}>Enabled</span></span>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* ── Create / Edit Route Modal ── */}
      {showCreate && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <div style={{ backgroundColor: '#1A1A1A', borderTop: '3px solid ' + colors.gold, borderRadius: 8, padding: 24, width: '100%', maxWidth: 560, border: `1px solid ${colors.border}`, maxHeight: '85vh', overflowY: 'auto' }}>

            {/* Step indicator */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 20 }}>
              {[1, 2].map(s => (
                <React.Fragment key={s}>
                  {s > 1 && <div style={{ flex: 1, height: 1, backgroundColor: createStep >= s ? colors.gold : '#333' }} />}
                  <div style={{
                    width: 28, height: 28, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 12, fontWeight: 700,
                    backgroundColor: createStep >= s ? colors.gold : '#333',
                    color: createStep >= s ? '#0A0A0A' : '#888',
                  }}>{s}</div>
                </React.Fragment>
              ))}
              <span style={{ color: colors.textMuted, fontSize: 12, marginLeft: 8 }}>
                {createStep === 1 ? 'Route Details' : 'Add Endpoints'}
              </span>
            </div>

            <h3 style={{ color: '#fff', fontSize: 16, fontWeight: 600, margin: '0 0 16px' }}>
              {editingId ? 'Edit Route' : 'Create Route'}
            </h3>

            {createStep === 1 && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                <div>
                  <label style={{ color: colors.textMuted, fontSize: 12, marginBottom: 4, display: 'block' }}>Route Name</label>
                  <input value={formName} onChange={e => setFormName(e.target.value)} placeholder="e.g. GPT-4o Production" style={inputStyle} />
                </div>
                <div>
                  <label style={{ color: colors.textMuted, fontSize: 12, marginBottom: 4, display: 'block' }}>Request Pattern</label>
                  <input value={formPattern} onChange={e => setFormPattern(e.target.value)} placeholder="/v1/chat/completions (gpt-4o*)" style={inputStyle} />
                  <div style={{ fontSize: 11, color: '#666', marginTop: 4 }}>Matches incoming requests to this route group</div>
                </div>
                <div>
                  <label style={{ color: colors.textMuted, fontSize: 12, marginBottom: 8, display: 'block' }}>Routing Strategy</label>
                  <div style={{ display: 'flex', gap: 8 }}>
                    {([
                      { key: 'failover' as const, label: 'Failover', desc: 'Try endpoints in priority order' },
                      { key: 'load-balance' as const, label: 'Load Balance', desc: 'Distribute traffic by weight' },
                      { key: 'single' as const, label: 'Single', desc: 'One endpoint only' },
                    ]).map(opt => (
                      <div
                        key={opt.key}
                        onClick={() => setFormStrategy(opt.key)}
                        style={{
                          flex: 1, padding: '10px 12px', borderRadius: 8, cursor: 'pointer',
                          backgroundColor: formStrategy === opt.key ? `${strategyColor(opt.key)}15` : '#0F0F0F',
                          border: `1px solid ${formStrategy === opt.key ? strategyColor(opt.key) : 'rgba(212,168,67,0.10)'}`,
                          transition: 'all 0.15s',
                        }}
                      >
                        <div style={{ fontSize: 13, fontWeight: 600, color: formStrategy === opt.key ? strategyColor(opt.key) : colors.text }}>{opt.label}</div>
                        <div style={{ fontSize: 11, color: colors.textMuted, marginTop: 2 }}>{opt.desc}</div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {createStep === 2 && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                <div style={{ fontSize: 12, color: colors.textMuted, marginBottom: 4 }}>
                  {formStrategy === 'failover' ? 'Add endpoints in failover priority order (first = primary)' :
                   formStrategy === 'load-balance' ? 'Add endpoints and set traffic weight for each' :
                   'Configure the single endpoint for this route'}
                </div>

                {formEndpoints.map((ep, idx) => (
                  <div key={idx} style={{ backgroundColor: '#0F0F0F', borderRadius: 8, padding: 12, border: `1px solid ${colors.border}`, display: 'flex', flexDirection: 'column', gap: 8 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      {formStrategy === 'failover' && (
                        <span style={{ fontSize: 11, color: colors.textMuted, fontWeight: 700, minWidth: 20 }}>P{idx + 1}</span>
                      )}
                      <select
                        value={ep.provider}
                        onChange={e => updateEndpoint(idx, 'provider', e.target.value)}
                        style={{ ...selectStyle, flex: 1 }}
                      >
                        <option>Azure OpenAI</option>
                        <option>Anthropic</option>
                        <option>Google Vertex</option>
                        <option>OpenAI Direct</option>
                        <option>AWS Bedrock</option>
                      </select>
                      <input
                        value={ep.region}
                        onChange={e => updateEndpoint(idx, 'region', e.target.value)}
                        placeholder="Region / URL"
                        style={{ ...inputStyle, flex: 1 }}
                      />
                      {formStrategy === 'load-balance' && (
                        <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                          <input
                            type="number"
                            min={0}
                            max={100}
                            value={ep.weight ?? 0}
                            onChange={e => updateEndpoint(idx, 'weight', Number(e.target.value))}
                            style={{ ...inputStyle, width: 60, textAlign: 'center' }}
                          />
                          <span style={{ color: colors.textMuted, fontSize: 12 }}>%</span>
                        </div>
                      )}
                      {formEndpoints.length > 1 && (
                        <button onClick={() => removeEndpoint(idx)} style={{ background: 'none', border: 'none', color: colors.red, cursor: 'pointer', fontSize: 16, padding: '0 4px' }}>×</button>
                      )}
                    </div>
                  </div>
                ))}

                {(formStrategy !== 'single' || formEndpoints.length === 0) && (
                  <button onClick={addEndpoint} style={{ background: 'none', border: `1px dashed ${colors.border}`, borderRadius: 8, padding: '10px', color: colors.gold, fontSize: 13, cursor: 'pointer', fontFamily: 'inherit' }}>
                    + Add {formStrategy === 'failover' ? 'Fallback' : 'Endpoint'}
                  </button>
                )}
              </div>
            )}

            {/* Footer */}
            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 20 }}>
              <div>
                {createStep === 2 && (
                  <button onClick={() => setCreateStep(1)} style={{ backgroundColor: 'transparent', color: '#ccc', border: `1px solid ${colors.border}`, borderRadius: 6, padding: '8px 18px', fontSize: 13, fontWeight: 500, cursor: 'pointer', fontFamily: 'inherit' }}>← Back</button>
                )}
              </div>
              <div style={{ display: 'flex', gap: 10 }}>
                <button onClick={() => { setShowCreate(false); resetForm(); }} style={{ backgroundColor: 'transparent', color: '#ccc', border: `1px solid ${colors.border}`, borderRadius: 6, padding: '8px 18px', fontSize: 13, fontWeight: 500, cursor: 'pointer', fontFamily: 'inherit' }}>Cancel</button>
                {createStep === 1 ? (
                  <button
                    onClick={() => setCreateStep(2)}
                    disabled={!formName || !formPattern}
                    style={{
                      backgroundColor: formName && formPattern ? colors.gold : '#333',
                      color: formName && formPattern ? '#0A0A0A' : '#666',
                      border: 'none', borderRadius: 6, padding: '8px 18px', fontSize: 13, fontWeight: 600,
                      cursor: formName && formPattern ? 'pointer' : 'not-allowed', fontFamily: 'inherit',
                    }}
                  >Next →</button>
                ) : (
                  <button
                    onClick={handleSave}
                    disabled={formEndpoints.length === 0 || formEndpoints.some(ep => !ep.region)}
                    style={{
                      backgroundColor: colors.gold, color: '#0A0A0A', border: 'none', borderRadius: 6,
                      padding: '8px 18px', fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit',
                    }}
                  >{editingId ? 'Save Changes' : 'Create Route'}</button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Routing;
