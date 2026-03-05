import { useState } from 'react';
import type { CSSProperties } from 'react';
import RegisterModel from './RegisterModel';
import RegisterTool from './RegisterTool';
import RegisterAgent from './RegisterAgent';

type Tab = 'models' | 'tools' | 'agents';
type Source = 'Foundry' | 'Bedrock' | 'Vertex' | 'OpenAI' | 'Anthropic' | 'Self-Hosted' | 'External';
type Governance = 'full' | 'partial' | 'none';

// --- Styles ---
const page: CSSProperties = { color: '#e0e0e0', fontFamily: 'inherit' };

const tabBar: CSSProperties = {
  display: 'flex',
  gap: 4,
  backgroundColor: '#161616',
  borderRadius: 8,
  padding: 4,
  width: 'fit-content',
};

const tabBarRow: CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  marginBottom: 20,
};

const tabBase: CSSProperties = {
  padding: '7px 20px',
  borderRadius: 6,
  border: 'none',
  cursor: 'pointer',
  fontSize: 13,
  fontWeight: 600,
  fontFamily: 'inherit',
  transition: 'all 0.15s',
};

const tabActive: CSSProperties = {
  ...tabBase,
  backgroundColor: 'rgba(212, 168, 67, 0.15)',
  color: '#D4A843',
};

const tabInactive: CSSProperties = {
  ...tabBase,
  backgroundColor: 'transparent',
  color: '#999',
};

const registerBtn: CSSProperties = {
  padding: '7px 16px',
  borderRadius: 6,
  border: '1px solid rgba(212, 168, 67, 0.3)',
  backgroundColor: 'rgba(212, 168, 67, 0.1)',
  color: '#D4A843',
  fontSize: 13,
  fontWeight: 600,
  fontFamily: 'inherit',
  cursor: 'pointer',
  transition: 'all 0.15s',
};

const summary: CSSProperties = { color: '#aaa', fontSize: 13, marginBottom: 16 };

const tableWrap: CSSProperties = {
  overflowX: 'auto',
  border: '1px solid rgba(212, 168, 67, 0.10)',
  borderRadius: 8,
  backgroundColor: '#111111',
};

const table: CSSProperties = {
  width: '100%',
  borderCollapse: 'collapse',
  fontSize: 13,
  whiteSpace: 'nowrap',
};

const th: CSSProperties = {
  textAlign: 'left',
  padding: '10px 14px',
  color: '#888',
  fontWeight: 600,
  fontSize: 11,
  textTransform: 'uppercase',
  letterSpacing: 0.4,
  borderBottom: '1px solid rgba(212, 168, 67, 0.10)',
  backgroundColor: '#161616',
};

const td: CSSProperties = {
  padding: '10px 14px',
  borderBottom: '1px solid rgba(212, 168, 67, 0.06)',
  color: '#ccc',
};

const badge = (bg: string, fg: string): CSSProperties => ({
  display: 'inline-block',
  padding: '2px 8px',
  borderRadius: 4,
  fontSize: 11,
  fontWeight: 600,
  backgroundColor: bg,
  color: fg,
  marginRight: 4,
});

const healthy: CSSProperties = badge('rgba(74,222,128,0.15)', '#4ADE80');
const degraded: CSSProperties = badge('rgba(245,158,11,0.15)', '#F59E0B');
const down: CSSProperties = badge('rgba(239,68,68,0.15)', '#EF4444');
const policyBadge: CSSProperties = badge('rgba(212, 168, 67, 0.1)', '#D4A843');
const mono: CSSProperties = { fontFamily: 'monospace', fontSize: 12, color: '#9cdcfe' };

// Governance overview styles
const govSection: CSSProperties = { marginBottom: 28 };
const statRow: CSSProperties = { display: 'flex', gap: 12, marginBottom: 16 };
const statCard = (borderColor: string): CSSProperties => ({
  flex: 1,
  padding: '14px 18px',
  borderRadius: 8,
  backgroundColor: '#111111',
  border: `1px solid ${borderColor}`,
});
const statValue: CSSProperties = { fontSize: 28, fontWeight: 700, color: '#fff', lineHeight: 1 };
const statLabel: CSSProperties = { fontSize: 12, color: '#888', marginTop: 4 };
const statSub: CSSProperties = { fontSize: 11, color: '#666', marginTop: 2 };
const sourceRow: CSSProperties = { display: 'flex', gap: 8, flexWrap: 'wrap' };
const sourcePill = (bg: string, fg: string): CSSProperties => ({
  display: 'inline-flex',
  alignItems: 'center',
  gap: 6,
  padding: '4px 12px',
  borderRadius: 20,
  fontSize: 12,
  fontWeight: 600,
  backgroundColor: bg,
  color: fg,
});

// Source badge colors
const sourceColors: Record<Source, { bg: string; fg: string }> = {
  Foundry:       { bg: 'rgba(79,107,237,0.15)', fg: '#4F6BED' },
  Bedrock:       { bg: 'rgba(255,153,0,0.15)',  fg: '#FF9900' },
  Vertex:        { bg: 'rgba(52,168,83,0.15)',  fg: '#34A853' },
  OpenAI:        { bg: 'rgba(255,255,255,0.12)', fg: '#e0e0e0' },
  Anthropic:     { bg: 'rgba(212,135,94,0.15)', fg: '#D4875E' },
  'Self-Hosted': { bg: 'rgba(158,158,158,0.15)', fg: '#9e9e9e' },
  External:      { bg: 'rgba(0,188,212,0.15)',  fg: '#4dd0e1' },
};

// --- Data ---
const models = [
  { model: 'gpt-4o', provider: 'Azure OpenAI', endpoint: 'East US', region: 'eastus', routing: 'Primary', policies: ['Rate limit', 'Safety'], health: 'healthy', traffic: '245K req', source: 'Foundry' as Source, governance: 'full' as Governance },
  { model: 'gpt-4o', provider: 'Azure OpenAI', endpoint: 'West US', region: 'westus', routing: 'Failover', policies: ['Rate limit', 'Safety'], health: 'healthy', traffic: '12K req', source: 'Foundry' as Source, governance: 'full' as Governance },
  { model: 'gpt-4o-mini', provider: 'Azure OpenAI', endpoint: 'East US', region: 'eastus', routing: 'Primary', policies: ['Rate limit'], health: 'healthy', traffic: '189K req', source: 'Foundry' as Source, governance: 'full' as Governance },
  { model: 'claude-3.5-sonnet', provider: 'Anthropic', endpoint: 'api.anthropic.com', region: '—', routing: 'Primary', policies: ['Rate limit', 'Safety'], health: 'healthy', traffic: '156K req', source: 'Anthropic' as Source, governance: 'full' as Governance },
  { model: 'claude-3-haiku', provider: 'Anthropic', endpoint: 'api.anthropic.com', region: '—', routing: 'Primary', policies: ['Rate limit'], health: 'healthy', traffic: '98K req', source: 'Anthropic' as Source, governance: 'partial' as Governance },
  { model: 'gemini-1.5-pro', provider: 'Google Vertex', endpoint: 'us-central1', region: 'us-central1', routing: 'Primary', policies: ['Rate limit'], health: 'degraded', traffic: '74K req', source: 'Vertex' as Source, governance: 'partial' as Governance },
  { model: 'llama-3.1-70b', provider: 'AWS Bedrock', endpoint: 'us-east-1', region: 'us-east-1', routing: 'Primary', policies: ['Rate limit'], health: 'healthy', traffic: '45K req', source: 'Bedrock' as Source, governance: 'full' as Governance },
  { model: 'mistral-large', provider: 'Self-Hosted', endpoint: 'internal-gpu-01', region: 'on-prem', routing: 'Primary', policies: ['Rate limit'], health: 'healthy', traffic: '23K req', source: 'Self-Hosted' as Source, governance: 'none' as Governance },
];

const tools = [
  { tool: 'salesforce-crm', type: 'REST API', endpoint: 'api.salesforce.com', namespace: 'retail-support', auth: 'OAuth 2.0', policies: ['Rate limit', 'Allowlist'], health: 'active', invocations: '12.4K', source: 'External' as Source, governance: 'full' as Governance },
  { tool: 'order-lookup', type: 'MCP Server', endpoint: 'mcp.internal/orders', namespace: 'retail-support', auth: 'API Key', policies: ['Rate limit'], health: 'active', invocations: '8.7K', source: 'Foundry' as Source, governance: 'full' as Governance },
  { tool: 'jira-tickets', type: 'REST API', endpoint: 'jira.atlassian.com', namespace: 'dev-sandbox', auth: 'OAuth 2.0', policies: ['Rate limit'], health: 'active', invocations: '3.2K', source: 'External' as Source, governance: 'partial' as Governance },
  { tool: 'servicenow-incidents', type: 'REST API', endpoint: 'instance.service-now.com', namespace: 'hr-automation', auth: 'API Key', policies: ['Rate limit', 'Allowlist'], health: 'down', invocations: '0', source: 'External' as Source, governance: 'none' as Governance },
  { tool: 'postgres-query', type: 'MCP Server', endpoint: 'mcp.internal/db', namespace: 'finance-analytics', auth: 'Connection String', policies: ['Allowlist'], health: 'active', invocations: '15.1K', source: 'Self-Hosted' as Source, governance: 'full' as Governance },
  { tool: 'weather-api', type: 'REST API', endpoint: 'api.openweathermap.org', namespace: 'dev-sandbox', auth: 'API Key', policies: ['Rate limit'], health: 'active', invocations: '1.8K', source: 'External' as Source, governance: 'partial' as Governance },
];

const agents = [
  { agent: 'retail-support-agent', protocol: 'RAPI', endpoint: 'agents.internal/retail', namespace: 'retail-support', models: 'gpt-4o, claude-3.5', tools: 'salesforce, order-lookup', policies: ['Safety', 'Rate limit'], health: 'active', source: 'Foundry' as Source, governance: 'full' as Governance },
  { agent: 'finance-analyst', protocol: 'A2A', endpoint: 'agents.internal/finance', namespace: 'finance-analytics', models: 'gpt-4o', tools: 'postgres-query', policies: ['Safety', 'Rate limit'], health: 'active', source: 'Foundry' as Source, governance: 'full' as Governance },
  { agent: 'hr-assistant', protocol: 'RAPI', endpoint: 'agents.internal/hr', namespace: 'hr-automation', models: 'gpt-4o-mini', tools: 'servicenow', policies: ['Rate limit'], health: 'degraded', source: 'Bedrock' as Source, governance: 'partial' as Governance },
  { agent: 'dev-copilot', protocol: 'RAPI', endpoint: 'agents.internal/dev', namespace: 'dev-sandbox', models: 'claude-3-haiku', tools: 'jira-tickets', policies: ['Rate limit'], health: 'active', source: 'Vertex' as Source, governance: 'full' as Governance },
];

// --- Helpers ---
const HealthBadge = ({ status }: { status: string }) => {
  if (status === 'healthy' || status === 'active')
    return <span style={healthy}>✓ {status === 'healthy' ? 'Healthy' : 'Active'}</span>;
  if (status === 'degraded')
    return <span style={degraded}>⚠ Degraded</span>;
  return <span style={down}>✗ Down</span>;
};

const Policies = ({ list }: { list: string[] }) => (
  <>
    {list.map((p) => (
      <span key={p} style={policyBadge}>{p}</span>
    ))}
  </>
);

const SourceBadge = ({ source }: { source: Source }) => {
  const c = sourceColors[source];
  return <span style={badge(c.bg, c.fg)}>{source}</span>;
};

const GovernanceBadge = ({ status }: { status: Governance }) => {
  if (status === 'full') return <span style={healthy}>✓ Full</span>;
  if (status === 'partial') return <span style={degraded}>⚠ Partial</span>;
  return <span style={down}>✗ None</span>;
};

// --- Component ---
function Assets() {
  const [activeTab, setActiveTab] = useState<Tab>('models');
  const [showWizard, setShowWizard] = useState<'model' | 'tool' | 'agent' | null>(null);

  const registerLabels: Record<Tab, { label: string; wizard: 'model' | 'tool' | 'agent' }> = {
    models: { label: 'Register Model', wizard: 'model' },
    tools: { label: 'Register Tool', wizard: 'tool' },
    agents: { label: 'Register Agent', wizard: 'agent' },
  };

  return (
    <div style={page}>
      {/* Governance Overview */}
      <div style={govSection}>
        {/* Row 1 — Stat cards */}
        <div style={statRow}>
          <div style={statCard('rgba(212, 168, 67, 0.10)')}>
            <div style={statValue}>44</div>
            <div style={statLabel}>Total Assets</div>
            <div style={statSub}>All registered</div>
          </div>
          <div style={statCard('rgba(74,222,128,0.3)')}>
            <div style={{ ...statValue, color: '#4ADE80' }}>36</div>
            <div style={statLabel}>Fully Governed</div>
            <div style={statSub}>All policies applied</div>
          </div>
          <div style={statCard('rgba(245,158,11,0.3)')}>
            <div style={{ ...statValue, color: '#F59E0B' }}>6</div>
            <div style={statLabel}>Partially Governed</div>
            <div style={statSub}>Missing some policies</div>
          </div>
          <div style={statCard('rgba(239,68,68,0.3)')}>
            <div style={{ ...statValue, color: '#EF4444' }}>2</div>
            <div style={statLabel}>Ungoverned</div>
            <div style={statSub}>No policies applied</div>
          </div>
        </div>

        {/* Row 2 — Source Distribution */}
        <div style={sourceRow}>
          <span style={sourcePill('rgba(79,107,237,0.15)', '#4F6BED')}>Azure AI Foundry <strong>18</strong></span>
          <span style={sourcePill('rgba(255,153,0,0.15)', '#FF9900')}>AWS Bedrock <strong>8</strong></span>
          <span style={sourcePill('rgba(52,168,83,0.15)', '#34A853')}>Google Vertex <strong>5</strong></span>
          <span style={sourcePill('rgba(255,255,255,0.12)', '#e0e0e0')}>OpenAI Direct <strong>4</strong></span>
          <span style={sourcePill('rgba(212,135,94,0.15)', '#D4875E')}>Anthropic Direct <strong>3</strong></span>
          <span style={sourcePill('rgba(158,158,158,0.15)', '#9e9e9e')}>Self-Hosted <strong>4</strong></span>
          <span style={sourcePill('rgba(0,188,212,0.15)', '#4dd0e1')}>External APIs <strong>2</strong></span>
        </div>
      </div>

      {/* Tab bar with register button */}
      <div style={tabBarRow}>
        <div style={tabBar}>
          {(['models', 'tools', 'agents'] as Tab[]).map((t) => (
            <button
              key={t}
              style={activeTab === t ? tabActive : tabInactive}
              onClick={() => setActiveTab(t)}
            >
              {t.charAt(0).toUpperCase() + t.slice(1)}
            </button>
          ))}
        </div>
        <button
          style={registerBtn}
          onClick={() => setShowWizard(registerLabels[activeTab].wizard)}
        >
          + {registerLabels[activeTab].label}
        </button>
      </div>

      {/* Models */}
      {activeTab === 'models' && (
        <>
          <div style={summary}>32 models registered across 5 providers</div>
          <div style={tableWrap}>
            <table style={table}>
              <thead>
                <tr>
                  <th style={th}>Model</th>
                  <th style={th}>Provider</th>
                  <th style={th}>Source</th>
                  <th style={th}>Endpoint</th>
                  <th style={th}>Region</th>
                  <th style={th}>Routing</th>
                  <th style={th}>Policies</th>
                  <th style={th}>Governance</th>
                  <th style={th}>Health</th>
                  <th style={th}>Traffic (24h)</th>
                </tr>
              </thead>
              <tbody>
                {models.map((r, i) => (
                  <tr key={i}>
                    <td style={{ ...td, fontWeight: 600, color: '#fff' }}>{r.model}</td>
                    <td style={td}>{r.provider}</td>
                    <td style={td}><SourceBadge source={r.source} /></td>
                    <td style={{ ...td, ...mono }}>{r.endpoint}</td>
                    <td style={{ ...td, ...mono }}>{r.region}</td>
                    <td style={td}>
                      <span style={badge(
                        r.routing === 'Primary' ? 'rgba(212, 168, 67, 0.1)' : 'rgba(245,158,11,0.12)',
                        r.routing === 'Primary' ? '#D4A843' : '#F59E0B',
                      )}>{r.routing}</span>
                    </td>
                    <td style={td}><Policies list={r.policies} /></td>
                    <td style={td}><GovernanceBadge status={r.governance} /></td>
                    <td style={td}><HealthBadge status={r.health} /></td>
                    <td style={{ ...td, fontVariantNumeric: 'tabular-nums' }}>{r.traffic}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}

      {/* Tools */}
      {activeTab === 'tools' && (
        <>
          <div style={summary}>24 tools registered across 3 types</div>
          <div style={tableWrap}>
            <table style={table}>
              <thead>
                <tr>
                  <th style={th}>Tool</th>
                  <th style={th}>Type</th>
                  <th style={th}>Source</th>
                  <th style={th}>Endpoint</th>
                  <th style={th}>Namespace</th>
                  <th style={th}>Auth</th>
                  <th style={th}>Policies</th>
                  <th style={th}>Governance</th>
                  <th style={th}>Health</th>
                  <th style={th}>Invocations (24h)</th>
                </tr>
              </thead>
              <tbody>
                {tools.map((r, i) => (
                  <tr key={i}>
                    <td style={{ ...td, fontWeight: 600, color: '#fff' }}>{r.tool}</td>
                    <td style={td}>
                      <span style={badge('rgba(212, 168, 67, 0.1)', '#D4A843')}>{r.type}</span>
                    </td>
                    <td style={td}><SourceBadge source={r.source} /></td>
                    <td style={{ ...td, ...mono }}>{r.endpoint}</td>
                    <td style={{ ...td, ...mono }}>{r.namespace}</td>
                    <td style={td}>{r.auth}</td>
                    <td style={td}><Policies list={r.policies} /></td>
                    <td style={td}><GovernanceBadge status={r.governance} /></td>
                    <td style={td}><HealthBadge status={r.health} /></td>
                    <td style={{ ...td, fontVariantNumeric: 'tabular-nums' }}>{r.invocations}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}

      {/* Agents */}
      {activeTab === 'agents' && (
        <>
          <div style={summary}>8 agents registered</div>
          <div style={tableWrap}>
            <table style={table}>
              <thead>
                <tr>
                  <th style={th}>Agent</th>
                  <th style={th}>Protocol</th>
                  <th style={th}>Source</th>
                  <th style={th}>Endpoint</th>
                  <th style={th}>Namespace</th>
                  <th style={th}>Models</th>
                  <th style={th}>Tools</th>
                  <th style={th}>Policies</th>
                  <th style={th}>Governance</th>
                  <th style={th}>Health</th>
                </tr>
              </thead>
              <tbody>
                {agents.map((r, i) => (
                  <tr key={i}>
                    <td style={{ ...td, fontWeight: 600, color: '#fff' }}>{r.agent}</td>
                    <td style={td}>
                      <span style={badge('rgba(212, 168, 67, 0.1)', '#D4A843')}>{r.protocol}</span>
                    </td>
                    <td style={td}><SourceBadge source={r.source} /></td>
                    <td style={{ ...td, ...mono }}>{r.endpoint}</td>
                    <td style={{ ...td, ...mono }}>{r.namespace}</td>
                    <td style={td}>{r.models}</td>
                    <td style={td}>{r.tools}</td>
                    <td style={td}><Policies list={r.policies} /></td>
                    <td style={td}><GovernanceBadge status={r.governance} /></td>
                    <td style={td}><HealthBadge status={r.health} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}

      {/* Registration Wizards */}
      {showWizard === 'model' && (
        <RegisterModel onClose={() => setShowWizard(null)} onComplete={() => setShowWizard(null)} />
      )}
      {showWizard === 'tool' && (
        <RegisterTool onClose={() => setShowWizard(null)} onComplete={() => setShowWizard(null)} />
      )}
      {showWizard === 'agent' && (
        <RegisterAgent onClose={() => setShowWizard(null)} onComplete={() => setShowWizard(null)} />
      )}
    </div>
  );
}

export default Assets;
