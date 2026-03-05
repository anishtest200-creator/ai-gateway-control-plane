import React, { useState } from 'react';

/* ── Types ── */
type Strategy = 'failover' | 'load-balance' | 'single' | 'cost-aware' | 'latency-aware' | 'capability-aware';

interface Endpoint {
  provider: string;
  model: string;
  region: string;
  health: 'healthy' | 'degraded' | 'unhealthy';
  weight?: number;
  costPer1k?: number;
  latencyP95?: number;
  capabilities?: string[];
}

/* ── Model Catalog ── */
const modelCatalog: Record<string, string[]> = {
  'Azure OpenAI': ['gpt-4o', 'gpt-4o-mini', 'gpt-4-turbo', 'gpt-4', 'gpt-3.5-turbo', 'o1-preview', 'o1-mini', 'text-embedding-ada-002', 'dall-e-3'],
  'Anthropic': ['claude-sonnet-4-20250514', 'claude-3.5-haiku', 'claude-3-opus', 'claude-3-haiku'],
  'Google Vertex': ['gemini-2.0-flash', 'gemini-1.5-pro', 'gemini-1.5-flash', 'gemini-1.0-pro', 'palm-2'],
  'OpenAI Direct': ['gpt-4o', 'gpt-4o-mini', 'gpt-4-turbo', 'o1-preview', 'o1-mini', 'gpt-3.5-turbo'],
  'AWS Bedrock': ['claude-sonnet-4-20250514', 'claude-3-haiku', 'titan-text-express', 'llama-3-70b', 'mistral-large'],
};

interface SmartConfig {
  budgetLimit?: number;
  budgetPeriod?: string;
  preferCheapest?: boolean;
  latencyTarget?: number;
  capabilityRules?: { capability: string; preferredProvider: string }[];
  fallbackProvider?: string;
}

interface RouteGroup {
  id: string;
  name: string;
  pattern: string;
  strategy: Strategy;
  enabled: boolean;
  endpoints: Endpoint[];
  smartConfig?: SmartConfig;
}

/* ── Mock Data ── */
const initialGroups: RouteGroup[] = [
  {
    id: 'gpt4o',
    name: 'GPT-4o Reliability',
    pattern: '/v1/chat/completions (gpt-4o*)',
    strategy: 'failover',
    enabled: true,
    endpoints: [
      { provider: 'Azure OpenAI', model: 'gpt-4o', region: 'East US', health: 'healthy' },
      { provider: 'Azure OpenAI', model: 'gpt-4o', region: 'West US', health: 'healthy' },
      { provider: 'OpenAI Direct', model: 'gpt-4o', region: 'api.openai.com', health: 'healthy' },
    ],
  },
  {
    id: 'claude',
    name: 'Claude Reliability',
    pattern: '/v1/chat/completions (claude-*)',
    strategy: 'failover',
    enabled: true,
    endpoints: [
      { provider: 'Anthropic', model: 'claude-sonnet-4-20250514', region: 'api.anthropic.com', health: 'healthy' },
      { provider: 'AWS Bedrock', model: 'claude-sonnet-4-20250514', region: 'us-east-1', health: 'healthy' },
    ],
  },
  {
    id: 'gemini',
    name: 'Gemini Pro',
    pattern: '/v1/chat/completions (gemini-*)',
    strategy: 'single',
    enabled: true,
    endpoints: [
      { provider: 'Google Vertex', model: 'gemini-1.5-pro', region: 'us-central1', health: 'degraded' },
    ],
  },
  {
    id: 'auto',
    name: 'Auto-Route (Cost Optimized)',
    pattern: '/v1/chat/completions (auto)',
    strategy: 'cost-aware',
    enabled: true,
    endpoints: [
      { provider: 'Azure OpenAI', model: 'gpt-4o-mini', region: 'East US', health: 'healthy', costPer1k: 0.03, latencyP95: 180, capabilities: ['chat', 'vision', 'tools'] },
      { provider: 'Anthropic', model: 'claude-3.5-haiku', region: 'api.anthropic.com', health: 'healthy', costPer1k: 0.015, latencyP95: 220, capabilities: ['chat', 'vision', 'tools', 'large-context'] },
      { provider: 'Google Vertex', model: 'gemini-2.0-flash', region: 'us-central1', health: 'degraded', costPer1k: 0.01, latencyP95: 350, capabilities: ['chat', 'vision'] },
    ],
    smartConfig: {
      budgetLimit: 5000,
      budgetPeriod: 'monthly',
      preferCheapest: true,
      fallbackProvider: 'Azure OpenAI',
    },
  },
  {
    id: 'latency',
    name: 'Low-Latency Route',
    pattern: '/v1/chat/completions (fast-*)',
    strategy: 'latency-aware',
    enabled: true,
    endpoints: [
      { provider: 'Azure OpenAI', model: 'gpt-4o-mini', region: 'East US', health: 'healthy', costPer1k: 0.03, latencyP95: 120 },
      { provider: 'Azure OpenAI', model: 'gpt-4o-mini', region: 'West US', health: 'healthy', costPer1k: 0.03, latencyP95: 145 },
      { provider: 'Anthropic', model: 'claude-3.5-haiku', region: 'api.anthropic.com', health: 'healthy', costPer1k: 0.015, latencyP95: 280 },
    ],
    smartConfig: {
      latencyTarget: 200,
      fallbackProvider: 'Azure OpenAI',
    },
  },
  {
    id: 'capability',
    name: 'Smart Capability Router',
    pattern: '/v1/chat/completions (smart-*)',
    strategy: 'capability-aware',
    enabled: true,
    endpoints: [
      { provider: 'Azure OpenAI', model: 'gpt-4o', region: 'East US', health: 'healthy', costPer1k: 0.03, capabilities: ['chat', 'vision', 'tools'] },
      { provider: 'Anthropic', model: 'claude-sonnet-4-20250514', region: 'api.anthropic.com', health: 'healthy', costPer1k: 0.015, capabilities: ['chat', 'vision', 'tools', 'large-context'] },
      { provider: 'Google Vertex', model: 'gemini-1.5-pro', region: 'us-central1', health: 'degraded', costPer1k: 0.01, capabilities: ['chat', 'vision'] },
    ],
    smartConfig: {
      capabilityRules: [
        { capability: 'large-context', preferredProvider: 'Anthropic' },
        { capability: 'vision', preferredProvider: 'Azure OpenAI' },
        { capability: 'tools', preferredProvider: 'Azure OpenAI' },
      ],
      fallbackProvider: 'Google Vertex',
    },
  },
];

/* ── Styles ── */
const colors = {
  gold: '#818CF8',
  card: '#161616',
  border: 'rgba(129, 140, 248, 0.10)',
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
  boxShadow: '0 2px 8px rgba(0,0,0,0.35), 0 1px 3px rgba(0,0,0,0.25)',
};

const inputStyle: React.CSSProperties = {
  width: '100%',
  backgroundColor: '#0F0F0F',
  border: '1px solid rgba(129, 140, 248,0.15)',
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

const strategyMeta: Record<Strategy, { label: string; color: string; desc: string; icon: string }> = {
  'failover': { label: 'Backup / Reliability', color: colors.purple, desc: 'Auto-failover to backup endpoints when primary is down', icon: '🛡️' },
  'load-balance': { label: 'Load Balanced', color: colors.blue, desc: 'Distribute traffic by weight', icon: '⚖️' },
  'single': { label: 'Single Endpoint', color: colors.textMuted, desc: 'One endpoint only', icon: '🎯' },
  'cost-aware': { label: 'Cost-Aware', color: '#10B981', desc: 'Prefer cheapest healthy endpoint; respect budget limits', icon: '💰' },
  'latency-aware': { label: 'Latency-Aware', color: '#F59E0B', desc: 'Route to lowest-latency healthy endpoint (rolling p95)', icon: '⚡' },
  'capability-aware': { label: 'Capability-Aware', color: '#EC4899', desc: 'Route by required capabilities (vision, tools, context size)', icon: '🧠' },
};

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
  const [formStrategy, setFormStrategy] = useState<Strategy>('failover');
  const [formEndpoints, setFormEndpoints] = useState<Endpoint[]>([{ provider: 'Azure OpenAI', model: 'gpt-4o', region: '', health: 'healthy' }]);
  const [formSmartConfig, setFormSmartConfig] = useState<SmartConfig>({});

  const resetForm = () => {
    setFormName(''); setFormPattern(''); setFormStrategy('failover');
    setFormEndpoints([{ provider: 'Azure OpenAI', model: 'gpt-4o', region: '', health: 'healthy' }]);
    setFormSmartConfig({});
    setCreateStep(1); setEditingId(null);
  };

  const openCreate = () => { resetForm(); setShowCreate(true); };

  const openEdit = (g: RouteGroup) => {
    setEditingId(g.id);
    setFormName(g.name); setFormPattern(g.pattern); setFormStrategy(g.strategy);
    setFormEndpoints(g.endpoints.map(e => ({ ...e })));
    setFormSmartConfig(g.smartConfig ? { ...g.smartConfig } : {});
    setCreateStep(1); setShowCreate(true);
  };

  const handleSave = () => {
    const isSmartStrategy = ['cost-aware', 'latency-aware', 'capability-aware'].includes(formStrategy);
    const newGroup: RouteGroup = {
      id: editingId || `route-${Date.now()}`,
      name: formName,
      pattern: formPattern,
      strategy: formStrategy,
      enabled: true,
      endpoints: formEndpoints,
      ...(isSmartStrategy ? { smartConfig: formSmartConfig } : {}),
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
    setFormEndpoints(prev => [...prev, { provider: 'Azure OpenAI', model: 'gpt-4o', region: '', health: 'healthy' }]);
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
        <button onClick={openCreate} style={{ backgroundColor: colors.gold, color: '#FFFFFF', border: 'none', borderRadius: 6, padding: '8px 18px', fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}>
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
                  color: strategyMeta[g.strategy].color, backgroundColor: `${strategyMeta[g.strategy].color}15`,
                  border: `1px solid ${strategyMeta[g.strategy].color}30`,
                }}>
                  {strategyMeta[g.strategy].icon} {strategyMeta[g.strategy].label}
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
                      {g.strategy === 'failover' ? 'Backup Order (primary → fallbacks)' :
                       g.strategy === 'load-balance' ? 'Traffic Distribution' :
                       g.strategy === 'cost-aware' ? 'Available Endpoints (routed by cost)' :
                       g.strategy === 'latency-aware' ? 'Available Endpoints (routed by latency)' :
                       g.strategy === 'capability-aware' ? 'Available Endpoints (routed by capability)' :
                       'Endpoint'}
                    </div>
                    <div style={{ display: 'flex', alignItems: 'stretch', gap: 0, flexWrap: 'wrap' }}>
                      {g.endpoints.map((ep, ei) => (
                        <React.Fragment key={ei}>
                          <div style={{
                            display: 'inline-flex', alignItems: 'center', gap: 8,
                            padding: '8px 14px', borderRadius: 8, backgroundColor: '#1A1A1A',
                            border: `1px solid ${healthColor(ep.health)}40`,
                          }}>
                            <span style={{ width: 8, height: 8, borderRadius: '50%', backgroundColor: healthColor(ep.health), flexShrink: 0 }} />
                            <div>
                              <div style={{ fontSize: 13, color: '#fff', fontWeight: 500 }}>{ep.model}</div>
                              <div style={{ fontSize: 11, color: colors.textMuted }}>{ep.provider} · <span style={{ fontFamily: 'monospace' }}>{ep.region}</span></div>
                              {g.strategy === 'cost-aware' && ep.costPer1k != null && (
                                <div style={{ fontSize: 10, color: '#10B981', marginTop: 2 }}>${ep.costPer1k}/1k tokens</div>
                              )}
                              {g.strategy === 'latency-aware' && ep.latencyP95 != null && (
                                <div style={{ fontSize: 10, color: colors.amber, marginTop: 2 }}>p95: {ep.latencyP95}ms</div>
                              )}
                              {g.strategy === 'capability-aware' && ep.capabilities && (
                                <div style={{ display: 'flex', gap: 3, marginTop: 3, flexWrap: 'wrap' }}>
                                  {ep.capabilities.map(c => (
                                    <span key={c} style={{ fontSize: 9, padding: '1px 5px', borderRadius: 3, backgroundColor: 'rgba(236,72,153,0.15)', color: '#EC4899' }}>{c}</span>
                                  ))}
                                </div>
                              )}
                            </div>
                            {g.strategy === 'load-balance' && ep.weight != null && (
                              <span style={{ fontSize: 13, fontWeight: 700, color: providerColors[ep.provider] || colors.gold, marginLeft: 4 }}>{ep.weight}%</span>
                            )}
                            {g.strategy === 'failover' && (
                              <span style={{ fontSize: 11, color: colors.textMuted }}>P{ei + 1}</span>
                            )}
                          </div>
                          {ei < g.endpoints.length - 1 && (
                            <span style={{ color: '#555', fontSize: 16, margin: '0 8px', userSelect: 'none', alignSelf: 'center' }}>
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
                          <div style={{ height: 5, backgroundColor: 'rgba(129, 140, 248,0.06)', borderRadius: 3, overflow: 'hidden' }}>
                            <div style={{ width: `${ep.weight}%`, height: '100%', backgroundColor: providerColors[ep.provider] || colors.gold, borderRadius: 3 }} />
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Smart routing config display */}
                  {g.smartConfig && g.strategy === 'cost-aware' && (
                    <div style={{ backgroundColor: '#0F0F0F', borderRadius: 8, padding: 12, border: `1px solid rgba(16,185,129,0.2)` }}>
                      <div style={{ fontSize: 12, fontWeight: 600, color: '#10B981', marginBottom: 8 }}>💰 Cost Rules</div>
                      <div style={{ display: 'flex', gap: 20, fontSize: 12, color: colors.textMuted, flexWrap: 'wrap' }}>
                        {g.smartConfig.budgetLimit && (
                          <span>Budget limit: <span style={{ color: colors.text }}>${g.smartConfig.budgetLimit.toLocaleString()}/{g.smartConfig.budgetPeriod || 'month'}</span></span>
                        )}
                        <span>Prefer cheapest: <span style={{ color: g.smartConfig.preferCheapest ? colors.green : colors.text }}>{g.smartConfig.preferCheapest ? 'Yes' : 'No'}</span></span>
                        {g.smartConfig.fallbackProvider && (
                          <span>Fallback: <span style={{ color: colors.text }}>{g.smartConfig.fallbackProvider}</span></span>
                        )}
                      </div>
                    </div>
                  )}

                  {g.smartConfig && g.strategy === 'latency-aware' && (
                    <div style={{ backgroundColor: '#0F0F0F', borderRadius: 8, padding: 12, border: `1px solid rgba(245,158,11,0.2)` }}>
                      <div style={{ fontSize: 12, fontWeight: 600, color: colors.amber, marginBottom: 8 }}>⚡ Latency Rules</div>
                      <div style={{ display: 'flex', gap: 20, fontSize: 12, color: colors.textMuted, flexWrap: 'wrap' }}>
                        {g.smartConfig.latencyTarget && (
                          <span>Target p95: <span style={{ color: colors.text }}>&lt; {g.smartConfig.latencyTarget}ms</span></span>
                        )}
                        <span>Selection: <span style={{ color: colors.text }}>Lowest rolling p95 among healthy</span></span>
                        {g.smartConfig.fallbackProvider && (
                          <span>Fallback: <span style={{ color: colors.text }}>{g.smartConfig.fallbackProvider}</span></span>
                        )}
                      </div>
                    </div>
                  )}

                  {g.smartConfig && g.strategy === 'capability-aware' && (
                    <div style={{ backgroundColor: '#0F0F0F', borderRadius: 8, padding: 12, border: `1px solid rgba(236,72,153,0.2)` }}>
                      <div style={{ fontSize: 12, fontWeight: 600, color: '#EC4899', marginBottom: 8 }}>🧠 Capability Rules</div>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                        {(g.smartConfig.capabilityRules || []).map((rule, ri) => (
                          <div key={ri} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12 }}>
                            <span style={{ color: colors.textMuted }}>If request needs</span>
                            <span style={{ padding: '1px 6px', borderRadius: 3, backgroundColor: 'rgba(236,72,153,0.15)', color: '#EC4899', fontSize: 11 }}>{rule.capability}</span>
                            <span style={{ color: colors.textMuted }}>→ prefer</span>
                            <span style={{ color: colors.text, fontWeight: 500 }}>{rule.preferredProvider}</span>
                          </div>
                        ))}
                        {g.smartConfig.fallbackProvider && (
                          <div style={{ fontSize: 12, color: colors.textMuted, marginTop: 2 }}>
                            Default fallback: <span style={{ color: colors.text }}>{g.smartConfig.fallbackProvider}</span>
                          </div>
                        )}
                      </div>
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
                {createStep === 1 ? 'Route Details' : ['cost-aware', 'latency-aware', 'capability-aware'].includes(formStrategy) ? 'Rules & Endpoints' : 'Add Endpoints'}
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
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8 }}>
                    {(Object.entries(strategyMeta) as [Strategy, typeof strategyMeta[Strategy]][]).map(([key, meta]) => (
                      <div
                        key={key}
                        onClick={() => setFormStrategy(key)}
                        style={{
                          padding: '10px 12px', borderRadius: 8, cursor: 'pointer',
                          backgroundColor: formStrategy === key ? `${meta.color}15` : '#0F0F0F',
                          border: `1px solid ${formStrategy === key ? meta.color : 'rgba(129, 140, 248,0.10)'}`,
                          transition: 'all 0.15s',
                        }}
                      >
                        <div style={{ fontSize: 13, fontWeight: 600, color: formStrategy === key ? meta.color : colors.text }}>{meta.icon} {meta.label}</div>
                        <div style={{ fontSize: 10, color: colors.textMuted, marginTop: 2, lineHeight: 1.3 }}>{meta.desc}</div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {createStep === 2 && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {/* Smart config section for smart strategies */}
                {formStrategy === 'cost-aware' && (
                  <div style={{ backgroundColor: '#0F0F0F', borderRadius: 8, padding: 14, border: '1px solid rgba(16,185,129,0.2)', display: 'flex', flexDirection: 'column', gap: 10 }}>
                    <div style={{ fontSize: 12, fontWeight: 600, color: '#10B981' }}>💰 Cost Rules</div>
                    <div style={{ display: 'flex', gap: 10 }}>
                      <div style={{ flex: 1 }}>
                        <label style={{ color: colors.textMuted, fontSize: 11, display: 'block', marginBottom: 3 }}>Monthly Budget Limit ($)</label>
                        <input type="number" value={formSmartConfig.budgetLimit ?? ''} onChange={e => setFormSmartConfig(c => ({ ...c, budgetLimit: Number(e.target.value) }))} placeholder="5000" style={inputStyle} />
                      </div>
                      <div style={{ flex: 1 }}>
                        <label style={{ color: colors.textMuted, fontSize: 11, display: 'block', marginBottom: 3 }}>Fallback Provider</label>
                        <select value={formSmartConfig.fallbackProvider ?? ''} onChange={e => setFormSmartConfig(c => ({ ...c, fallbackProvider: e.target.value }))} style={selectStyle}>
                          <option value="">Select...</option>
                          <option>Azure OpenAI</option><option>Anthropic</option><option>Google Vertex</option><option>OpenAI Direct</option><option>AWS Bedrock</option>
                        </select>
                      </div>
                    </div>
                    <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12, color: colors.text, cursor: 'pointer' }}>
                      <input type="checkbox" checked={formSmartConfig.preferCheapest ?? true} onChange={e => setFormSmartConfig(c => ({ ...c, preferCheapest: e.target.checked }))} />
                      Always prefer cheapest healthy endpoint
                    </label>
                  </div>
                )}

                {formStrategy === 'latency-aware' && (
                  <div style={{ backgroundColor: '#0F0F0F', borderRadius: 8, padding: 14, border: '1px solid rgba(245,158,11,0.2)', display: 'flex', flexDirection: 'column', gap: 10 }}>
                    <div style={{ fontSize: 12, fontWeight: 600, color: colors.amber }}>⚡ Latency Rules</div>
                    <div style={{ display: 'flex', gap: 10 }}>
                      <div style={{ flex: 1 }}>
                        <label style={{ color: colors.textMuted, fontSize: 11, display: 'block', marginBottom: 3 }}>Target p95 Latency (ms)</label>
                        <input type="number" value={formSmartConfig.latencyTarget ?? ''} onChange={e => setFormSmartConfig(c => ({ ...c, latencyTarget: Number(e.target.value) }))} placeholder="200" style={inputStyle} />
                      </div>
                      <div style={{ flex: 1 }}>
                        <label style={{ color: colors.textMuted, fontSize: 11, display: 'block', marginBottom: 3 }}>Fallback Provider</label>
                        <select value={formSmartConfig.fallbackProvider ?? ''} onChange={e => setFormSmartConfig(c => ({ ...c, fallbackProvider: e.target.value }))} style={selectStyle}>
                          <option value="">Select...</option>
                          <option>Azure OpenAI</option><option>Anthropic</option><option>Google Vertex</option><option>OpenAI Direct</option><option>AWS Bedrock</option>
                        </select>
                      </div>
                    </div>
                    <div style={{ fontSize: 11, color: '#666' }}>Routes to the endpoint with lowest rolling p95 latency among healthy targets</div>
                  </div>
                )}

                {formStrategy === 'capability-aware' && (
                  <div style={{ backgroundColor: '#0F0F0F', borderRadius: 8, padding: 14, border: '1px solid rgba(236,72,153,0.2)', display: 'flex', flexDirection: 'column', gap: 10 }}>
                    <div style={{ fontSize: 12, fontWeight: 600, color: '#EC4899' }}>🧠 Capability Rules</div>
                    {(formSmartConfig.capabilityRules || []).map((rule, ri) => (
                      <div key={ri} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <span style={{ fontSize: 12, color: colors.textMuted, whiteSpace: 'nowrap' }}>If needs</span>
                        <select value={rule.capability} onChange={e => {
                          const rules = [...(formSmartConfig.capabilityRules || [])];
                          rules[ri] = { ...rules[ri], capability: e.target.value };
                          setFormSmartConfig(c => ({ ...c, capabilityRules: rules }));
                        }} style={{ ...selectStyle, flex: 1 }}>
                          <option value="vision">Vision</option>
                          <option value="tools">Tool Calling</option>
                          <option value="large-context">Large Context (&gt;32k)</option>
                          <option value="code">Code Generation</option>
                          <option value="embedding">Embeddings</option>
                        </select>
                        <span style={{ fontSize: 12, color: colors.textMuted }}>→</span>
                        <select value={rule.preferredProvider} onChange={e => {
                          const rules = [...(formSmartConfig.capabilityRules || [])];
                          rules[ri] = { ...rules[ri], preferredProvider: e.target.value };
                          setFormSmartConfig(c => ({ ...c, capabilityRules: rules }));
                        }} style={{ ...selectStyle, flex: 1 }}>
                          <option>Azure OpenAI</option><option>Anthropic</option><option>Google Vertex</option><option>OpenAI Direct</option><option>AWS Bedrock</option>
                        </select>
                        <button onClick={() => {
                          const rules = (formSmartConfig.capabilityRules || []).filter((_, i) => i !== ri);
                          setFormSmartConfig(c => ({ ...c, capabilityRules: rules }));
                        }} style={{ background: 'none', border: 'none', color: colors.red, cursor: 'pointer', fontSize: 16 }}>×</button>
                      </div>
                    ))}
                    <button onClick={() => {
                      const rules = [...(formSmartConfig.capabilityRules || []), { capability: 'vision', preferredProvider: 'Azure OpenAI' }];
                      setFormSmartConfig(c => ({ ...c, capabilityRules: rules }));
                    }} style={{ background: 'none', border: `1px dashed ${colors.border}`, borderRadius: 6, padding: '6px', color: '#EC4899', fontSize: 12, cursor: 'pointer', fontFamily: 'inherit' }}>
                      + Add Capability Rule
                    </button>
                    <div>
                      <label style={{ color: colors.textMuted, fontSize: 11, display: 'block', marginBottom: 3 }}>Default Fallback Provider</label>
                      <select value={formSmartConfig.fallbackProvider ?? ''} onChange={e => setFormSmartConfig(c => ({ ...c, fallbackProvider: e.target.value }))} style={selectStyle}>
                        <option value="">Select...</option>
                        <option>Azure OpenAI</option><option>Anthropic</option><option>Google Vertex</option><option>OpenAI Direct</option><option>AWS Bedrock</option>
                      </select>
                    </div>
                  </div>
                )}

                {/* Endpoints section */}
                <div style={{ fontSize: 12, color: colors.textMuted, marginBottom: 4 }}>
                  {formStrategy === 'failover' ? 'Add endpoints in backup priority order — first is primary, rest are fallbacks for reliability' :
                   formStrategy === 'load-balance' ? 'Add endpoints and set traffic weight for each' :
                   formStrategy === 'single' ? 'Configure the single endpoint for this route' :
                   'Add available endpoints for smart routing to choose from'}
                </div>

                {formEndpoints.map((ep, idx) => (
                  <div key={idx} style={{ backgroundColor: '#0F0F0F', borderRadius: 8, padding: 12, border: `1px solid ${colors.border}`, display: 'flex', flexDirection: 'column', gap: 8 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      {formStrategy === 'failover' && (
                        <span style={{ fontSize: 11, color: colors.textMuted, fontWeight: 700, minWidth: 20 }}>P{idx + 1}</span>
                      )}
                      <select
                        value={ep.provider}
                        onChange={e => {
                          const newProvider = e.target.value;
                          const models = modelCatalog[newProvider] || [];
                          const updated = [...formEndpoints];
                          updated[idx] = { ...updated[idx], provider: newProvider, model: models[0] || '' };
                          setFormEndpoints(updated);
                        }}
                        style={{ ...selectStyle, flex: 1 }}
                      >
                        {Object.keys(modelCatalog).map(p => <option key={p}>{p}</option>)}
                      </select>
                      <select
                        value={ep.model}
                        onChange={e => updateEndpoint(idx, 'model', e.target.value)}
                        style={{ ...selectStyle, flex: 1 }}
                      >
                        {(modelCatalog[ep.provider] || []).map(m => <option key={m} value={m}>{m}</option>)}
                      </select>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <input
                        value={ep.region}
                        onChange={e => updateEndpoint(idx, 'region', e.target.value)}
                        placeholder="Region / Endpoint URL"
                        style={{ ...inputStyle, flex: 1 }}
                      />
                      {formStrategy === 'load-balance' && (
                        <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                          <input
                            type="number" min={0} max={100}
                            value={ep.weight ?? 0}
                            onChange={e => updateEndpoint(idx, 'weight', Number(e.target.value))}
                            style={{ ...inputStyle, width: 60, textAlign: 'center' }}
                          />
                          <span style={{ color: colors.textMuted, fontSize: 12 }}>%</span>
                        </div>
                      )}
                      {formStrategy === 'cost-aware' && (
                        <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                          <input
                            type="number" min={0} step={0.001}
                            value={ep.costPer1k ?? ''}
                            onChange={e => updateEndpoint(idx, 'costPer1k', Number(e.target.value))}
                            placeholder="$/1k"
                            style={{ ...inputStyle, width: 70, textAlign: 'center' }}
                          />
                          <span style={{ color: colors.textMuted, fontSize: 10 }}>$/1k</span>
                        </div>
                      )}
                      {formStrategy === 'latency-aware' && (
                        <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                          <input
                            type="number" min={0}
                            value={ep.latencyP95 ?? ''}
                            onChange={e => updateEndpoint(idx, 'latencyP95', Number(e.target.value))}
                            placeholder="p95ms"
                            style={{ ...inputStyle, width: 70, textAlign: 'center' }}
                          />
                          <span style={{ color: colors.textMuted, fontSize: 10 }}>ms</span>
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
                    + Add {formStrategy === 'failover' ? 'Backup Endpoint' : 'Endpoint'}
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
                      backgroundColor: colors.gold, color: '#FFFFFF', border: 'none', borderRadius: 6,
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
