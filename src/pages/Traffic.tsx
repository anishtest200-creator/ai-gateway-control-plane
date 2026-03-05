import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import type { CSSProperties } from 'react';

// ── Inline style helpers ──────────────────────────────────────────────
const colors = {
  bg: '#0A0A0A',
  card: '#161616',
  border: 'rgba(212, 168, 67, 0.10)',
  text: '#E8E8E8',
  textMuted: '#999',
  textDim: '#666',
  green: '#4ADE80',
  amber: '#F59E0B',
  red: '#EF4444',
  blue: '#60A5FA',
  gold: '#D4A843',
  goldDim: '#B8923A',
  goldMuted: 'rgba(212, 168, 67, 0.15)',
  purple: '#A78BFA',
  azure: '#4F6BED',
  google: '#34A853',
  aws: '#FF9900',
  selfHosted: '#A78BFA',
};

const card: CSSProperties = {
  backgroundColor: colors.card,
  border: `1px solid ${colors.border}`,
  borderRadius: 8,
  padding: 16,
};

const sectionTitle: CSSProperties = {
  color: colors.text,
  fontSize: 14,
  fontWeight: 600,
  marginBottom: 12,
};

// ── Stat Card ─────────────────────────────────────────────────────────
const StatCard: React.FC<{
  value: string;
  label: string;
  sub: string;
  accent: string;
}> = ({ value, label, sub, accent }) => (
  <div
    style={{
      ...card,
      flex: 1,
      display: 'flex',
      flexDirection: 'column',
      gap: 4,
    }}
  >
    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
      <span
        style={{
          width: 8,
          height: 8,
          borderRadius: '50%',
          backgroundColor: accent,
          display: 'inline-block',
          flexShrink: 0,
        }}
      />
      <span style={{ color: colors.textMuted, fontSize: 12 }}>{label}</span>
    </div>
    <span style={{ color: '#fff', fontSize: 28, fontWeight: 700, lineHeight: 1.1 }}>
      {value}
    </span>
    <span style={{ color: colors.textDim, fontSize: 11 }}>{sub}</span>
  </div>
);

// ── Progress Bar Row ──────────────────────────────────────────────────
const BarRow: React.FC<{
  label: string;
  value: string;
  pct: number;
  color: string;
}> = ({ label, value, pct, color }) => (
  <div style={{ marginBottom: 10 }}>
    <div
      style={{
        display: 'flex',
        justifyContent: 'space-between',
        marginBottom: 4,
        fontSize: 12,
      }}
    >
      <span style={{ color: colors.text }}>{label}</span>
      <span style={{ color: colors.textMuted }}>{value}</span>
    </div>
    <div
      style={{
        height: 6,
        backgroundColor: 'rgba(212, 168, 67, 0.06)',
        borderRadius: 3,
        overflow: 'hidden',
      }}
    >
      <div
        style={{
          height: '100%',
          width: `${pct}%`,
          backgroundColor: color,
          borderRadius: 3,
          transition: 'width 0.4s ease',
        }}
      />
    </div>
  </div>
);

// ── Status Pill ───────────────────────────────────────────────────────
const StatusPill: React.FC<{ status: 'Healthy' | 'Warning' }> = ({ status }) => {
  const isHealthy = status === 'Healthy';
  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 4,
        fontSize: 11,
        fontWeight: 600,
        color: isHealthy ? colors.green : colors.amber,
        backgroundColor: isHealthy
          ? 'rgba(74,222,128,0.12)'
          : 'rgba(245,158,11,0.12)',
        padding: '2px 8px',
        borderRadius: 4,
      }}
    >
      <span
        style={{
          width: 6,
          height: 6,
          borderRadius: '50%',
          backgroundColor: isHealthy ? colors.green : colors.amber,
        }}
      />
      {status}
    </span>
  );
};

// ── Main Component ────────────────────────────────────────────────────
interface TrafficProps {}

const timeRangeMultipliers: Record<string, number> = {
  '1h': 0.04,
  '6h': 0.25,
  '24h': 1,
  '7d': 7,
  '30d': 30,
};

const timeRangeLabels: Record<string, string> = {
  '1h': 'Last 1 hour',
  '6h': 'Last 6 hours',
  '24h': 'Last 24 hours',
  '7d': 'Last 7 days',
  '30d': 'Last 30 days',
};

const providerOptions = ['All Providers', 'Azure OpenAI', 'Anthropic', 'Google Vertex', 'OpenAI', 'AWS Bedrock'];

const selectStyle: CSSProperties = {
  backgroundColor: '#1A1A1A',
  color: '#E8E8E8',
  border: '1px solid rgba(212, 168, 67, 0.10)',
  borderRadius: 6,
  padding: '5px 10px',
  fontSize: 12,
  outline: 'none',
  cursor: 'pointer',
};

const Traffic: React.FC<TrafficProps> = () => {
  const navigate = useNavigate();
  const [timeRange, setTimeRange] = useState('24h');
  const [providerFilter, setProviderFilter] = useState('All Providers');
  const [hoveredNsRow, setHoveredNsRow] = useState<string | null>(null);
  const [hoveredActivity, setHoveredActivity] = useState<number | null>(null);

  const mult = timeRangeMultipliers[timeRange] ?? 1;
  const rangeLabel = timeRangeLabels[timeRange] ?? 'Last 24 hours';

  const scaleVal = (v: string): string => {
    const num = parseFloat(v.replace(/[^0-9.]/g, ''));
    const suffix = v.replace(/[0-9.,]/g, '');
    const scaled = num * mult;
    if (scaled >= 1000) return `${(scaled / 1000).toFixed(1)}M`;
    return `${scaled.toFixed(scaled < 10 ? 1 : 0)}${suffix}`;
  };

  // Mock data
  const allProviders = [
    { label: 'Azure OpenAI', pct: 45, value: '520K', color: colors.azure },
    { label: 'Anthropic', pct: 25, value: '290K', color: colors.amber },
    { label: 'Google Vertex', pct: 15, value: '174K', color: colors.google },
    { label: 'AWS Bedrock', pct: 10, value: '116K', color: colors.aws },
    { label: 'Self-Hosted', pct: 5, value: '58K', color: colors.selfHosted },
  ];

  const providers = providerFilter === 'All Providers'
    ? allProviders
    : allProviders.filter((p) => p.label === providerFilter || p.label.startsWith(providerFilter.split(' ')[0]));

  const enforcement = [
    { label: 'Passed', value: `${Math.round(1197153 * mult).toLocaleString()}`, pct: 99.7, color: colors.green },
    { label: 'Rate Limited', value: `${Math.round(1892 * mult).toLocaleString()}`, pct: 0.16, color: colors.amber },
    { label: 'Blocked (Safety)', value: `${Math.round(847 * mult).toLocaleString()}`, pct: 0.07, color: colors.red },
    { label: 'Auth Denied', value: `${Math.round(108 * mult).toLocaleString()}`, pct: 0.01, color: colors.red },
  ];

  const namespaces: {
    name: string;
    requests: string;
    tokens: string;
    status: 'Healthy' | 'Warning';
  }[] = [
    { name: 'retail-support', requests: scaleVal('312K'), tokens: scaleVal('4.2B'), status: 'Healthy' },
    { name: 'finance-analytics', requests: scaleVal('245K'), tokens: scaleVal('3.1B'), status: 'Healthy' },
    { name: 'hr-automation', requests: scaleVal('189K'), tokens: scaleVal('2.8B'), status: 'Warning' },
    { name: 'customer-ops', requests: scaleVal('156K'), tokens: scaleVal('1.9B'), status: 'Healthy' },
    { name: 'dev-sandbox', requests: scaleVal('98K'), tokens: scaleVal('0.8B'), status: 'Healthy' },
  ];

  const activity = [
    { text: 'Rate limit triggered — finance-analytics namespace', time: '2 min ago', color: colors.amber },
    { text: 'New model endpoint registered — claude-3.5-sonnet', time: '15 min ago', color: colors.blue },
    { text: 'Failover activated — Azure OpenAI East US → West US', time: '32 min ago', color: colors.red },
    { text: 'Content safety block — prompt injection detected', time: '1h ago', color: colors.red },
    { text: 'Credential rotation completed — retail-support namespace', time: '2h ago', color: colors.green },
  ];

  const thStyle: CSSProperties = {
    textAlign: 'left',
    padding: '6px 10px',
    fontSize: 11,
    fontWeight: 600,
    color: colors.textMuted,
    borderBottom: `1px solid ${colors.border}`,
    whiteSpace: 'nowrap',
  };

  const tdStyle: CSSProperties = {
    padding: '8px 10px',
    fontSize: 12,
    color: colors.text,
    borderBottom: `1px solid ${colors.border}`,
    whiteSpace: 'nowrap',
  };

  return (
    <div>
      {/* ── Filter Bar ────────────────────────────────────────── */}
      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginBottom: 14 }}>
        <select value={providerFilter} onChange={(e) => setProviderFilter(e.target.value)} style={selectStyle}>
          {providerOptions.map((p) => (
            <option key={p} value={p}>{p}</option>
          ))}
        </select>
        <select value={timeRange} onChange={(e) => setTimeRange(e.target.value)} style={selectStyle}>
          {Object.entries(timeRangeLabels).map(([k, v]) => (
            <option key={k} value={k}>{v}</option>
          ))}
        </select>
      </div>

      {/* ── Top Stats Row ─────────────────────────────────────── */}
      <div style={{ display: 'flex', gap: 12, marginBottom: 16 }}>
        <StatCard value={scaleVal('1.2M')} label="Total Requests" sub={rangeLabel} accent={colors.green} />
        <StatCard value="47ms" label="Avg Latency" sub="P50" accent={colors.green} />
        <StatCard value={scaleVal('2847')} label="Policy Blocks" sub={rangeLabel} accent={colors.amber} />
        <StatCard value="156" label="Active Endpoints" sub="Healthy" accent={colors.green} />
      </div>

      {/* ── Main Content (2 columns) ─────────────────────────── */}
      <div style={{ display: 'flex', gap: 12 }}>
        {/* Left Column — 60 % */}
        <div style={{ flex: '0 0 60%', display: 'flex', flexDirection: 'column', gap: 12 }}>
          {/* Requests by Provider */}
          <div style={card}>
            <div style={sectionTitle}>Requests by Provider</div>
            {providers.map((p) => (
              <BarRow
                key={p.label}
                label={p.label}
                value={`${p.pct}% (${p.value})`}
                pct={p.pct}
                color={p.color}
              />
            ))}
          </div>

          {/* Policy Enforcement */}
          <div style={card}>
            <div style={sectionTitle}>Policy Enforcement</div>
            {enforcement.map((e) => (
              <BarRow
                key={e.label}
                label={e.label}
                value={e.value}
                pct={Math.max(e.pct, 1.5)}
                color={e.color}
              />
            ))}
          </div>
        </div>

        {/* Right Column — 40 % */}
        <div style={{ flex: '0 0 calc(40% - 12px)', display: 'flex', flexDirection: 'column', gap: 12 }}>
          {/* Top Namespaces */}
          <div style={card}>
            <div style={sectionTitle}>Top Namespaces</div>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr>
                  <th style={thStyle}>Namespace</th>
                  <th style={thStyle}>Requests</th>
                  <th style={thStyle}>Tokens</th>
                  <th style={thStyle}>Status</th>
                </tr>
              </thead>
              <tbody>
                {namespaces.map((ns) => (
                  <tr
                    key={ns.name}
                    onClick={() => navigate('/namespaces')}
                    onMouseEnter={() => setHoveredNsRow(ns.name)}
                    onMouseLeave={() => setHoveredNsRow(null)}
                    style={{
                      cursor: 'pointer',
                      backgroundColor: hoveredNsRow === ns.name ? '#1A1A1A' : 'transparent',
                      borderLeft: hoveredNsRow === ns.name ? '3px solid #D4A843' : '3px solid transparent',
                      transition: 'all 0.15s',
                    }}
                  >
                    <td style={{ ...tdStyle, fontFamily: 'monospace', fontSize: 12, color: colors.gold }}>
                      {ns.name}
                    </td>
                    <td style={tdStyle}>{ns.requests}</td>
                    <td style={tdStyle}>{ns.tokens}</td>
                    <td style={tdStyle}>
                      <StatusPill status={ns.status} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Recent Activity */}
          <div style={card}>
            <div style={sectionTitle}>Recent Activity</div>
            {activity.map((a, i) => (
              <div
                key={i}
                onClick={() => navigate('/logs')}
                onMouseEnter={() => setHoveredActivity(i)}
                onMouseLeave={() => setHoveredActivity(null)}
                style={{
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: 8,
                  padding: '8px 0',
                  cursor: 'pointer',
                  backgroundColor: hoveredActivity === i ? '#1A1A1A' : 'transparent',
                  borderRadius: 4,
                  transition: 'background-color 0.15s',
                  borderBottom:
                    i < activity.length - 1
                      ? `1px solid ${colors.border}`
                      : 'none',
                }}
              >
                <span
                  style={{
                    width: 7,
                    height: 7,
                    borderRadius: '50%',
                    backgroundColor: a.color,
                    flexShrink: 0,
                    marginTop: 4,
                  }}
                />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ color: colors.text, fontSize: 12, lineHeight: 1.4 }}>
                    {a.text}
                  </div>
                  <div style={{ color: colors.textDim, fontSize: 11, marginTop: 2 }}>
                    {a.time}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Traffic;
