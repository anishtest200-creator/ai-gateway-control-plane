import React, { useState, useMemo } from 'react';
import type { CSSProperties } from 'react';
import { useNavigate } from 'react-router-dom';

/* ── palette ─────────────────────────────────────────────────────── */

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
};

/* ── shared styles ───────────────────────────────────────────────── */

const card: CSSProperties = {
  backgroundColor: colors.card,
  border: `1px solid ${colors.border}`,
  borderRadius: 8,
  padding: 16,
};

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

const inputStyle: CSSProperties = {
  backgroundColor: '#1A1A1A',
  color: '#ccc',
  border: '1px solid rgba(212, 168, 67, 0.10)',
  borderRadius: 6,
  padding: '6px 10px',
  fontSize: 13,
  fontFamily: 'inherit',
  outline: 'none',
};

const badge = (bg: string, fg: string): CSSProperties => ({
  display: 'inline-block',
  padding: '2px 8px',
  borderRadius: 4,
  fontSize: 11,
  fontWeight: 600,
  backgroundColor: bg,
  color: fg,
});

/* ── types ────────────────────────────────────────────────────────── */

interface LogEntry {
  id: string;
  timestamp: string;
  method: 'POST' | 'GET' | 'PUT' | 'DELETE';
  path: string;
  assetType: 'model' | 'tool' | 'mcp-server' | 'agent';
  assetName: string;
  statusCode: number;
  latencyMs: number;
  tokensIn?: number;
  tokensOut?: number;
  userId: string;
  ipAddress: string;
}

/* ── asset type colour map ───────────────────────────────────────── */

const assetTypeColors: Record<LogEntry['assetType'], { bg: string; color: string }> = {
  model: { bg: '#1e293b', color: '#93c5fd' },
  tool: { bg: '#1a2d3d', color: '#38bdf8' },
  'mcp-server': { bg: '#1a3a2a', color: '#4ade80' },
  agent: { bg: '#3d2800', color: '#fbbf24' },
};

const assetLabel: Record<LogEntry['assetType'], string> = {
  model: 'Model',
  tool: 'Tool',
  'mcp-server': 'MCP',
  agent: 'Agent',
};

/* ── status helpers ──────────────────────────────────────────────── */

const statusDotColor = (code: number) => {
  if (code >= 200 && code < 300) return colors.green;
  if (code >= 400 && code < 500) return colors.amber;
  return colors.red;
};

const latencyColor = (ms: number) => {
  if (ms < 500) return colors.green;
  if (ms < 2000) return colors.amber;
  return colors.red;
};

const statusText: Record<number, string> = {
  200: 'OK',
  201: 'Created',
  204: 'No Content',
  400: 'Bad Request',
  401: 'Unauthorized',
  403: 'Forbidden',
  404: 'Not Found',
  429: 'Too Many Requests',
  500: 'Internal Server Error',
  502: 'Bad Gateway',
  503: 'Service Unavailable',
};

/* ── mock data ────────────────────────────────────────────────────── */

const now = Date.now();
const ts = (minutesAgo: number) => new Date(now - minutesAgo * 60_000).toISOString();

const mockLogs: LogEntry[] = [
  { id: 'log-001', timestamp: ts(1),  method: 'POST', path: '/v1/chat/completions',  assetType: 'model',      assetName: 'gpt-4o',            statusCode: 200, latencyMs: 1820,  tokensIn: 1200, tokensOut: 850,  userId: 'user:sarah.chen@contoso.com',   ipAddress: '10.0.12.45' },
  { id: 'log-002', timestamp: ts(2),  method: 'POST', path: '/v1/tools/execute',     assetType: 'tool',       assetName: 'web-search',        statusCode: 200, latencyMs: 340,   userId: 'user:alex.kim@contoso.com',     ipAddress: '10.0.12.112' },
  { id: 'log-003', timestamp: ts(3),  method: 'POST', path: '/v1/chat/completions',  assetType: 'model',      assetName: 'claude-3.5-sonnet', statusCode: 429, latencyMs: 45,    tokensIn: 800,  tokensOut: 0,    userId: 'svc:data-pipeline',             ipAddress: '10.0.8.200' },
  { id: 'log-004', timestamp: ts(5),  method: 'GET',  path: '/mcp/sse',              assetType: 'mcp-server', assetName: 'github-mcp',        statusCode: 200, latencyMs: 120,   userId: 'user:priya.patel@contoso.com',  ipAddress: '10.0.14.78' },
  { id: 'log-005', timestamp: ts(7),  method: 'POST', path: '/v1/agents/run',        assetType: 'agent',      assetName: 'support-agent',     statusCode: 200, latencyMs: 3450,  tokensIn: 2100, tokensOut: 1480, userId: 'user:sarah.chen@contoso.com',   ipAddress: '10.0.12.45' },
  { id: 'log-006', timestamp: ts(9),  method: 'POST', path: '/v1/chat/completions',  assetType: 'model',      assetName: 'gpt-4o',            statusCode: 200, latencyMs: 980,   tokensIn: 560,  tokensOut: 320,  userId: 'user:alex.kim@contoso.com',     ipAddress: '10.0.12.112' },
  { id: 'log-007', timestamp: ts(12), method: 'POST', path: '/v1/tools/execute',     assetType: 'tool',       assetName: 'code-interpreter',  statusCode: 500, latencyMs: 2100,  userId: 'svc:ci-runner',                 ipAddress: '10.0.20.5' },
  { id: 'log-008', timestamp: ts(15), method: 'GET',  path: '/mcp/sse',              assetType: 'mcp-server', assetName: 'azure-devops-mcp',  statusCode: 200, latencyMs: 210,   userId: 'user:james.lee@contoso.com',    ipAddress: '10.0.11.33' },
  { id: 'log-009', timestamp: ts(18), method: 'POST', path: '/v1/chat/completions',  assetType: 'model',      assetName: 'claude-3.5-sonnet', statusCode: 200, latencyMs: 1540,  tokensIn: 1800, tokensOut: 920,  userId: 'user:priya.patel@contoso.com',  ipAddress: '10.0.14.78' },
  { id: 'log-010', timestamp: ts(22), method: 'POST', path: '/v1/agents/run',        assetType: 'agent',      assetName: 'research-agent',    statusCode: 200, latencyMs: 2800,  tokensIn: 3200, tokensOut: 2100, userId: 'svc:data-pipeline',             ipAddress: '10.0.8.200' },
  { id: 'log-011', timestamp: ts(28), method: 'POST', path: '/v1/chat/completions',  assetType: 'model',      assetName: 'gpt-4o-mini',       statusCode: 200, latencyMs: 420,   tokensIn: 300,  tokensOut: 180,  userId: 'user:alex.kim@contoso.com',     ipAddress: '10.0.12.112' },
  { id: 'log-012', timestamp: ts(33), method: 'POST', path: '/v1/tools/execute',     assetType: 'tool',       assetName: 'web-search',        statusCode: 200, latencyMs: 280,   userId: 'user:sarah.chen@contoso.com',   ipAddress: '10.0.12.45' },
  { id: 'log-013', timestamp: ts(40), method: 'POST', path: '/v1/chat/completions',  assetType: 'model',      assetName: 'gpt-4o',            statusCode: 500, latencyMs: 3500,  tokensIn: 950,  tokensOut: 0,    userId: 'svc:ci-runner',                 ipAddress: '10.0.20.5' },
  { id: 'log-014', timestamp: ts(48), method: 'GET',  path: '/mcp/sse',              assetType: 'mcp-server', assetName: 'github-mcp',        statusCode: 200, latencyMs: 135,   userId: 'user:james.lee@contoso.com',    ipAddress: '10.0.11.33' },
  { id: 'log-015', timestamp: ts(55), method: 'POST', path: '/v1/agents/run',        assetType: 'agent',      assetName: 'support-agent',     statusCode: 429, latencyMs: 38,    tokensIn: 1500, tokensOut: 0,    userId: 'user:priya.patel@contoso.com',  ipAddress: '10.0.14.78' },
];

/* ── component ────────────────────────────────────────────────────── */

const Logs: React.FC = () => {
  const navigate = useNavigate();
  const [search, setSearch] = useState('');
  const [assetFilter, setAssetFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [hoveredRow, setHoveredRow] = useState<string | null>(null);
  const [showToast, setShowToast] = useState(false);
  const [reqBodyOpen, setReqBodyOpen] = useState(false);
  const [resBodyOpen, setResBodyOpen] = useState(false);

  /* ── filtering ──────────────────────────────────────────────────── */

  const filtered = useMemo(() => {
    let list = mockLogs;

    if (search) {
      const q = search.toLowerCase();
      list = list.filter(
        (l) =>
          l.assetName.toLowerCase().includes(q) ||
          l.path.toLowerCase().includes(q) ||
          l.userId.toLowerCase().includes(q),
      );
    }

    if (assetFilter !== 'all') {
      list = list.filter((l) => l.assetType === assetFilter);
    }

    if (statusFilter !== 'all') {
      if (statusFilter === '2xx') list = list.filter((l) => l.statusCode >= 200 && l.statusCode < 300);
      else if (statusFilter === 'errors') list = list.filter((l) => l.statusCode >= 400);
      else if (statusFilter === '4xx') list = list.filter((l) => l.statusCode >= 400 && l.statusCode < 500);
      else if (statusFilter === '5xx') list = list.filter((l) => l.statusCode >= 500);
    }

    return list;
  }, [search, assetFilter, statusFilter]);

  const okCount = filtered.filter((l) => l.statusCode >= 200 && l.statusCode < 300).length;
  const errCount = filtered.length - okCount;
  const selected = filtered.find((l) => l.id === selectedId) ?? null;

  /* ── helpers ────────────────────────────────────────────────────── */

  const fmtTime = (iso: string) => {
    const d = new Date(iso);
    return d.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
  };

  const fmtFull = (iso: string) => {
    const d = new Date(iso);
    return d.toLocaleString('en-GB', {
      year: 'numeric', month: 'short', day: 'numeric',
      hour: '2-digit', minute: '2-digit', second: '2-digit',
    });
  };

  /* ── render ─────────────────────────────────────────────────────── */

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      {/* ── toolbar ─────────────────────────────────────────────────── */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
        {/* live indicator */}
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, marginRight: 4 }}>
          <span
            style={{
              width: 8,
              height: 8,
              borderRadius: '50%',
              backgroundColor: colors.green,
              display: 'inline-block',
              boxShadow: `0 0 6px ${colors.green}`,
            }}
          />
          <span style={{ fontSize: 12, fontWeight: 600, color: colors.green }}>Live</span>
        </span>

        {/* search */}
        <input
          type="text"
          placeholder="Search logs..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          style={{ ...inputStyle, width: 200 }}
        />

        {/* asset type */}
        <select
          value={assetFilter}
          onChange={(e) => setAssetFilter(e.target.value)}
          style={{ ...inputStyle, cursor: 'pointer' }}
        >
          <option value="all">All types</option>
          <option value="model">Models</option>
          <option value="tool">Tools</option>
          <option value="mcp-server">MCP Servers</option>
          <option value="agent">Agents</option>
        </select>

        {/* status */}
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          style={{ ...inputStyle, cursor: 'pointer' }}
        >
          <option value="all">All statuses</option>
          <option value="2xx">2xx Success</option>
          <option value="errors">All errors</option>
          <option value="4xx">4xx Client Error</option>
          <option value="5xx">5xx Server Error</option>
        </select>

        {/* status summary badges */}
        <span style={badge('rgba(16,185,129,0.18)', colors.green)}>{okCount} ok</span>
        <span style={badge('rgba(239,68,68,0.18)', colors.red)}>{errCount} errors</span>

        {/* refresh */}
        <button
          style={{
            padding: '6px 14px',
            borderRadius: 6,
            border: '1px solid rgba(212, 168, 67, 0.10)',
            backgroundColor: '#1A1A1A',
            color: '#ccc',
            fontSize: 13,
            fontWeight: 600,
            fontFamily: 'inherit',
            cursor: 'pointer',
            transition: 'all 0.15s',
          }}
          onClick={() => { /* mock refresh — data already static */ }}
        >
          Refresh
        </button>

        {/* export */}
        <button
          onClick={() => { setShowToast(true); setTimeout(() => setShowToast(false), 3000); }}
          style={{
            padding: '6px 14px',
            borderRadius: 6,
            border: '1px solid rgba(212, 168, 67, 0.30)',
            backgroundColor: 'rgba(212, 168, 67, 0.1)',
            color: '#D4A843',
            fontSize: 13,
            fontWeight: 600,
            fontFamily: 'inherit',
            cursor: 'pointer',
            transition: 'all 0.15s',
          }}
        >
          Export
        </button>

        {/* request count */}
        <span style={{ fontSize: 12, color: colors.textMuted, marginLeft: 'auto' }}>
          {filtered.length} requests
        </span>
      </div>

      {/* ── table ───────────────────────────────────────────────────── */}
      <div style={{ ...card, padding: 0, overflow: 'hidden' }}>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr>
                {['Time', 'Status', 'Method', 'Path', 'Asset', 'Latency', 'Tokens', 'User'].map((h) => (
                  <th key={h} style={thStyle}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map((log) => {
                const isSelected = log.id === selectedId;
                const isHovered = log.id === hoveredRow;
                return (
                  <tr
                    key={log.id}
                    onClick={() => setSelectedId(isSelected ? null : log.id)}
                    onMouseEnter={() => setHoveredRow(log.id)}
                    onMouseLeave={() => setHoveredRow(null)}
                    style={{
                      cursor: 'pointer',
                      backgroundColor: isSelected ? '#1A1A1A' : isHovered ? '#1a1a1a' : 'transparent',
                      transition: 'background-color 0.1s',
                    }}
                  >
                    {/* time */}
                    <td style={{ ...tdStyle, fontFamily: 'monospace', fontSize: 12 }}>
                      {fmtTime(log.timestamp)}
                    </td>

                    {/* status */}
                    <td style={tdStyle}>
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                        <span
                          style={{
                            width: 7,
                            height: 7,
                            borderRadius: '50%',
                            backgroundColor: statusDotColor(log.statusCode),
                            display: 'inline-block',
                            flexShrink: 0,
                          }}
                        />
                        <span style={{ fontFamily: 'monospace', fontSize: 12, color: statusDotColor(log.statusCode) }}>
                          {log.statusCode}
                        </span>
                      </span>
                    </td>

                    {/* method */}
                    <td style={tdStyle}>
                      <span
                        style={{
                          display: 'inline-block',
                          padding: '1px 7px',
                          borderRadius: 4,
                          fontSize: 11,
                          fontWeight: 600,
                          fontFamily: 'monospace',
                          border: '1px solid rgba(212, 168, 67, 0.10)',
                          color: colors.textMuted,
                        }}
                      >
                        {log.method}
                      </span>
                    </td>

                    {/* path */}
                    <td style={{ ...tdStyle, fontFamily: 'monospace', fontSize: 12, color: colors.textMuted }}>
                      {log.path}
                    </td>

                    {/* asset */}
                    <td style={tdStyle}>
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                        <span style={badge(assetTypeColors[log.assetType].bg, assetTypeColors[log.assetType].color)}>
                          {assetLabel[log.assetType]}
                        </span>
                        <span style={{ fontSize: 12 }}>{log.assetName}</span>
                      </span>
                    </td>

                    {/* latency */}
                    <td style={{ ...tdStyle, fontVariantNumeric: 'tabular-nums' }}>
                      <span style={{ color: latencyColor(log.latencyMs), fontSize: 12, fontWeight: 600 }}>
                        {log.latencyMs}
                      </span>
                      <span style={{ color: colors.textDim, fontSize: 11 }}> ms</span>
                    </td>

                    {/* tokens */}
                    <td style={{ ...tdStyle, fontFamily: 'monospace', fontSize: 12, color: colors.textMuted }}>
                      {log.tokensIn != null ? `${log.tokensIn} → ${log.tokensOut}` : '—'}
                    </td>

                    {/* user */}
                    <td style={{ ...tdStyle, fontFamily: 'monospace', fontSize: 11, color: colors.textMuted }}>
                      {log.userId}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* ── detail panel (slide-in overlay) ─────────────────────────── */}
      {selected && (
        <div style={{ position: 'fixed', top: 0, right: 0, bottom: 0, width: 420, backgroundColor: '#1A1A1A', borderLeft: '1px solid rgba(212, 168, 67, 0.10)', zIndex: 1000, overflowY: 'auto', padding: 24, display: 'flex', flexDirection: 'column', gap: 16, boxShadow: '-4px 0 20px rgba(0,0,0,0.5)' }}>
          {/* close */}
          <button onClick={() => { setSelectedId(null); setReqBodyOpen(false); setResBodyOpen(false); }} style={{ position: 'absolute', top: 16, right: 16, background: 'none', border: 'none', color: colors.textMuted, fontSize: 20, cursor: 'pointer', padding: '0 4px', fontFamily: 'inherit', lineHeight: 1 }}>✕</button>

          {/* method + path */}
          <div style={{ fontSize: 16, fontWeight: 700, color: colors.text, fontFamily: 'monospace', paddingRight: 24 }}>{selected.method} {selected.path}</div>

          {/* timestamp */}
          <DetailField label="Timestamp" value={fmtFull(selected.timestamp)} />

          {/* status badge */}
          <div>
            <div style={{ fontSize: 11, fontWeight: 600, color: colors.textMuted, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 4 }}>Status</div>
            <span style={badge(selected.statusCode < 300 ? 'rgba(74,222,128,0.15)' : selected.statusCode < 500 ? 'rgba(245,158,11,0.15)' : 'rgba(239,68,68,0.15)', statusDotColor(selected.statusCode))}>{selected.statusCode} {statusText[selected.statusCode] ?? ''}</span>
          </div>

          {/* latency */}
          <DetailField label="Latency" value={`${selected.latencyMs} ms`} valueColor={latencyColor(selected.latencyMs)} />

          {/* asset */}
          <div>
            <div style={{ fontSize: 11, fontWeight: 600, color: colors.textMuted, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 4 }}>Asset</div>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
              <span style={badge(assetTypeColors[selected.assetType].bg, assetTypeColors[selected.assetType].color)}>{assetLabel[selected.assetType]}</span>
              <span style={{ fontSize: 13, color: colors.text }}>{selected.assetName}</span>
            </span>
          </div>

          {/* user + ip */}
          <DetailField label="User ID" value={selected.userId} mono />
          <DetailField label="IP Address" value={selected.ipAddress} mono />

          {/* request headers */}
          <div>
            <div style={{ fontSize: 11, fontWeight: 600, color: colors.textMuted, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 4 }}>Request Headers</div>
            <div style={{ backgroundColor: '#111', borderRadius: 6, padding: 10, fontFamily: 'monospace', fontSize: 11, color: '#9cdcfe', lineHeight: 1.6 }}>
              Content-Type: application/json<br />
              Authorization: Bearer ••••••••<br />
              X-Request-ID: {selected.id}
            </div>
          </div>

          {/* request body */}
          <div>
            <button onClick={() => setReqBodyOpen(!reqBodyOpen)} style={{ background: 'none', border: 'none', color: colors.gold, fontSize: 12, fontWeight: 600, cursor: 'pointer', padding: 0, fontFamily: 'inherit' }}>{reqBodyOpen ? '▾' : '▸'} Request Body</button>
            {reqBodyOpen && (
              <div style={{ backgroundColor: '#111', borderRadius: 6, padding: 10, fontFamily: 'monospace', fontSize: 11, color: '#9cdcfe', marginTop: 6, whiteSpace: 'pre-wrap' }}>
{JSON.stringify({ model: selected.assetName, messages: [{ role: 'user', content: 'Hello' }], max_tokens: 1024 }, null, 2)}
              </div>
            )}
          </div>

          {/* response body */}
          <div>
            <button onClick={() => setResBodyOpen(!resBodyOpen)} style={{ background: 'none', border: 'none', color: colors.gold, fontSize: 12, fontWeight: 600, cursor: 'pointer', padding: 0, fontFamily: 'inherit' }}>{resBodyOpen ? '▾' : '▸'} Response Body</button>
            {resBodyOpen && (
              <div style={{ backgroundColor: '#111', borderRadius: 6, padding: 10, fontFamily: 'monospace', fontSize: 11, color: '#9cdcfe', marginTop: 6, whiteSpace: 'pre-wrap' }}>
{JSON.stringify({ id: selected.id, status: selected.statusCode, latency_ms: selected.latencyMs, tokens: { input: selected.tokensIn ?? 0, output: selected.tokensOut ?? 0 } }, null, 2)}
              </div>
            )}
          </div>

          {/* trace id */}
          <DetailField label="Trace ID" value="a1b2c3d4-e5f6-7890-abcd-ef1234567890" mono />

          {/* view in catalog */}
          <button onClick={() => navigate('/assets')} style={{ background: 'none', border: 'none', color: colors.gold, fontSize: 13, fontWeight: 600, cursor: 'pointer', padding: 0, fontFamily: 'inherit', textAlign: 'left' }}>View in Catalog →</button>
        </div>
      )}

      {/* ── toast ─────────────────────────────────────────────────────── */}
      {showToast && (
        <div style={{ position: 'fixed', bottom: 24, right: 24, backgroundColor: '#1A1A1A', border: '1px solid rgba(212, 168, 67, 0.30)', borderRadius: 8, padding: '12px 20px', color: colors.gold, fontSize: 13, fontWeight: 600, zIndex: 2000, boxShadow: '0 4px 16px rgba(0,0,0,0.4)' }}>
          Audit log exported to CSV
        </div>
      )}
    </div>
  );
};

/* ── detail field sub-component ──────────────────────────────────── */

const DetailField: React.FC<{
  label: string;
  value: string;
  mono?: boolean;
  valueColor?: string;
}> = ({ label, value, mono, valueColor }) => (
  <div>
    <div
      style={{
        fontSize: 11,
        fontWeight: 600,
        color: colors.textMuted,
        textTransform: 'uppercase',
        letterSpacing: 0.5,
        marginBottom: 4,
      }}
    >
      {label}
    </div>
    <div
      style={{
        fontSize: 14,
        fontWeight: 700,
        color: valueColor ?? colors.text,
        fontFamily: mono ? 'monospace' : 'inherit',
      }}
    >
      {value}
    </div>
  </div>
);

export default Logs;