import React from 'react';
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

const Traffic: React.FC<TrafficProps> = () => {
  // Mock data
  const providers = [
    { label: 'Azure OpenAI', pct: 45, value: '520K', color: colors.azure },
    { label: 'Anthropic', pct: 25, value: '290K', color: colors.amber },
    { label: 'Google Vertex', pct: 15, value: '174K', color: colors.google },
    { label: 'AWS Bedrock', pct: 10, value: '116K', color: colors.aws },
    { label: 'Self-Hosted', pct: 5, value: '58K', color: colors.selfHosted },
  ];

  const enforcement = [
    { label: 'Passed', value: '1,197,153', pct: 99.7, color: colors.green },
    { label: 'Rate Limited', value: '1,892', pct: 0.16, color: colors.amber },
    { label: 'Blocked (Safety)', value: '847', pct: 0.07, color: colors.red },
    { label: 'Auth Denied', value: '108', pct: 0.01, color: colors.red },
  ];

  const namespaces: {
    name: string;
    requests: string;
    tokens: string;
    status: 'Healthy' | 'Warning';
  }[] = [
    { name: 'retail-support', requests: '312K', tokens: '4.2B', status: 'Healthy' },
    { name: 'finance-analytics', requests: '245K', tokens: '3.1B', status: 'Healthy' },
    { name: 'hr-automation', requests: '189K', tokens: '2.8B', status: 'Warning' },
    { name: 'customer-ops', requests: '156K', tokens: '1.9B', status: 'Healthy' },
    { name: 'dev-sandbox', requests: '98K', tokens: '0.8B', status: 'Healthy' },
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
      {/* ── Top Stats Row ─────────────────────────────────────── */}
      <div style={{ display: 'flex', gap: 12, marginBottom: 16 }}>
        <StatCard value="1.2M" label="Total Requests" sub="Last 24h" accent={colors.green} />
        <StatCard value="47ms" label="Avg Latency" sub="P50" accent={colors.green} />
        <StatCard value="2,847" label="Policy Blocks" sub="Last 24h" accent={colors.amber} />
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
                  <tr key={ns.name}>
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
                style={{
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: 8,
                  padding: '8px 0',
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
