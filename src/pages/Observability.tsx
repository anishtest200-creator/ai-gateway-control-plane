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

const providerColors: Record<string, string> = {
  'Azure OpenAI': '#4F6BED',
  Anthropic: '#d4875e',
  Google: '#34a853',
  'AWS Bedrock': '#ff9900',
  Meta: '#0668E1',
};

// ── Helpers ───────────────────────────────────────────────────────────
function formatNumber(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return n.toLocaleString();
}

function formatCost(n: number): string {
  return `$${n.toFixed(2)}`;
}

function formatLatency(ms: number): string {
  if (ms >= 1000) return `${(ms / 1000).toFixed(1)}s`;
  return `${Math.round(ms)}ms`;
}

// ── Types ─────────────────────────────────────────────────────────────
interface TokenUsageByModel {
  modelId: string;
  modelName: string;
  provider: string;
  tokensIn: number;
  tokensOut: number;
  totalTokens: number;
  requests: number;
  cost: number;
  avgLatencyMs: number;
}

interface TimeSeries {
  timestamp: string;
  tokensIn: number;
  tokensOut: number;
  requests: number;
  errors: number;
}

interface Consumer {
  id: string;
  name: string;
  displayName: string;
  type: 'user' | 'application';
  team: string;
  namespace: string;
  quotas: { tokensPerDay: number };
  usage24h: {
    totalTokens: number;
    totalRequests: number;
    totalCost: number;
    modelsUsed: string[];
  };
}

// ── Mock Data ─────────────────────────────────────────────────────────
const namespaces = [
  'ai-platform',
  'ml-inference',
  'data-engineering',
  'customer-support-ai',
  'research-sandbox',
];

const models: TokenUsageByModel[] = [
  {
    modelId: 'gpt-4o',
    modelName: 'GPT-4o',
    provider: 'Azure OpenAI',
    tokensIn: 4_280_000,
    tokensOut: 2_150_000,
    totalTokens: 6_430_000,
    requests: 18_420,
    cost: 289.35,
    avgLatencyMs: 1_240,
  },
  {
    modelId: 'gpt-4o-mini',
    modelName: 'GPT-4o-mini',
    provider: 'Azure OpenAI',
    tokensIn: 8_920_000,
    tokensOut: 3_610_000,
    totalTokens: 12_530_000,
    requests: 42_310,
    cost: 112.77,
    avgLatencyMs: 680,
  },
  {
    modelId: 'claude-3-5-sonnet',
    modelName: 'Claude 3.5 Sonnet',
    provider: 'Anthropic',
    tokensIn: 3_150_000,
    tokensOut: 1_870_000,
    totalTokens: 5_020_000,
    requests: 12_840,
    cost: 241.0,
    avgLatencyMs: 1_580,
  },
  {
    modelId: 'gemini-1-5-pro',
    modelName: 'Gemini 1.5 Pro',
    provider: 'Google',
    tokensIn: 2_740_000,
    tokensOut: 1_320_000,
    totalTokens: 4_060_000,
    requests: 9_150,
    cost: 85.26,
    avgLatencyMs: 920,
  },
  {
    modelId: 'claude-3-haiku',
    modelName: 'Claude 3 Haiku',
    provider: 'Anthropic',
    tokensIn: 6_810_000,
    tokensOut: 2_940_000,
    totalTokens: 9_750_000,
    requests: 31_200,
    cost: 58.5,
    avgLatencyMs: 340,
  },
  {
    modelId: 'llama-3-1-70b',
    modelName: 'Llama 3.1 70B',
    provider: 'AWS Bedrock',
    tokensIn: 1_960_000,
    tokensOut: 890_000,
    totalTokens: 2_850_000,
    requests: 6_780,
    cost: 42.75,
    avgLatencyMs: 1_100,
  },
];

function buildTimeSeries(): TimeSeries[] {
  const now = new Date();
  return Array.from({ length: 24 }, (_, i) => {
    const ts = new Date(now.getTime() - (23 - i) * 3_600_000);
    const hour = ts.getHours();
    const scale = hour >= 9 && hour <= 18 ? 1.0 : hour >= 6 && hour <= 21 ? 0.6 : 0.25;
    const base = 800_000 + Math.floor(Math.random() * 400_000);
    const tokensIn = Math.floor(base * scale);
    const tokensOut = Math.floor(tokensIn * (0.35 + Math.random() * 0.2));
    return {
      timestamp: ts.toISOString(),
      tokensIn,
      tokensOut,
      requests: Math.floor((tokensIn + tokensOut) / 250),
      errors: Math.floor(Math.random() * 12),
    };
  });
}

const timeSeries = buildTimeSeries();

const consumers: Consumer[] = [
  {
    id: 'u1',
    name: 'jchen@contoso.com',
    displayName: 'Jessica Chen',
    type: 'user',
    team: 'ML Platform',
    namespace: 'ai-platform',
    quotas: { tokensPerDay: 5_000_000 },
    usage24h: { totalTokens: 3_840_000, totalRequests: 1_420, totalCost: 84.2, modelsUsed: ['GPT-4o', 'Claude 3.5 Sonnet'] },
  },
  {
    id: 'a1',
    name: 'copilot-chat-svc',
    displayName: 'Copilot Chat Service',
    type: 'application',
    team: 'Developer Tools',
    namespace: 'ai-platform',
    quotas: { tokensPerDay: 20_000_000 },
    usage24h: { totalTokens: 14_250_000, totalRequests: 48_200, totalCost: 312.5, modelsUsed: ['GPT-4o-mini', 'GPT-4o', 'Claude 3 Haiku'] },
  },
  {
    id: 'u2',
    name: 'asingh@contoso.com',
    displayName: 'Amit Singh',
    type: 'user',
    team: 'Data Science',
    namespace: 'ml-inference',
    quotas: { tokensPerDay: 3_000_000 },
    usage24h: { totalTokens: 2_120_000, totalRequests: 890, totalCost: 45.8, modelsUsed: ['Gemini 1.5 Pro', 'GPT-4o'] },
  },
  {
    id: 'a2',
    name: 'support-bot-prod',
    displayName: 'Support Bot (Production)',
    type: 'application',
    team: 'Customer Experience',
    namespace: 'customer-support-ai',
    quotas: { tokensPerDay: 10_000_000 },
    usage24h: { totalTokens: 7_680_000, totalRequests: 22_400, totalCost: 156.3, modelsUsed: ['Claude 3 Haiku', 'GPT-4o-mini'] },
  },
  {
    id: 'u3',
    name: 'mwilson@contoso.com',
    displayName: 'Maria Wilson',
    type: 'user',
    team: 'Research',
    namespace: 'research-sandbox',
    quotas: { tokensPerDay: 8_000_000 },
    usage24h: { totalTokens: 5_410_000, totalRequests: 3_210, totalCost: 198.4, modelsUsed: ['Claude 3.5 Sonnet', 'GPT-4o', 'Llama 3.1 70B'] },
  },
  {
    id: 'a3',
    name: 'etl-summarizer',
    displayName: 'ETL Summarizer Pipeline',
    type: 'application',
    team: 'Data Engineering',
    namespace: 'data-engineering',
    quotas: { tokensPerDay: 15_000_000 },
    usage24h: { totalTokens: 9_320_000, totalRequests: 15_600, totalCost: 78.9, modelsUsed: ['GPT-4o-mini', 'Claude 3 Haiku'] },
  },
  {
    id: 'u4',
    name: 'tkumar@contoso.com',
    displayName: 'Tara Kumar',
    type: 'user',
    team: 'ML Platform',
    namespace: 'ml-inference',
    quotas: { tokensPerDay: 4_000_000 },
    usage24h: { totalTokens: 1_870_000, totalRequests: 620, totalCost: 52.1, modelsUsed: ['GPT-4o', 'Gemini 1.5 Pro'] },
  },
  {
    id: 'a4',
    name: 'doc-indexer-svc',
    displayName: 'Document Indexing Service',
    type: 'application',
    team: 'Search Platform',
    namespace: 'ai-platform',
    quotas: { tokensPerDay: 12_000_000 },
    usage24h: { totalTokens: 6_540_000, totalRequests: 8_900, totalCost: 67.4, modelsUsed: ['GPT-4o-mini'] },
  },
];

// ── Sub-components ────────────────────────────────────────────────────
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

// ── Main Component ────────────────────────────────────────────────────
const Observability: React.FC = () => {
  const [timeRange, setTimeRange] = useState<'24h' | '7d' | '30d'>('24h');
  const [nsFilter, setNsFilter] = useState<string>('all');
  const [hoveredRow, setHoveredRow] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'live' | 'usage' | 'cost' | 'budgets'>('live');
  const [editingBudget, setEditingBudget] = useState<string | null>(null);
  const [budgetEdits, setBudgetEdits] = useState<Record<string, number>>({});
  const [toastMsg, setToastMsg] = useState<string | null>(null);
  const navigate = useNavigate();

  // Budget data for cost governance
  const budgetData = [
    { namespace: 'ai-platform', env: 'production', budget: 15000, spent: 11200 },
    { namespace: 'ml-inference', env: 'production', budget: 8000, spent: 5100 },
    { namespace: 'customer-support-ai', env: 'production', budget: 3000, spent: 3400 },
    { namespace: 'research-sandbox', env: 'sandbox', budget: 2000, spent: 800 },
    { namespace: 'data-engineering', env: 'production', budget: 5000, spent: 3900 },
  ];

  const anomalyAlerts = [
    { id: 'a1', icon: '⚠️', message: 'customer-support-ai exceeded monthly budget by 13% ($400 over)', borderColor: colors.red, action: 'Investigate →', nav: '/namespaces' as const },
    { id: 'a2', icon: '📈', message: 'data-pipeline-svc usage up 340% vs 7-day average (12.4K → 42.1K tokens/hr)', borderColor: colors.amber, action: 'Investigate →', nav: '/logs' as const },
    { id: 'a3', icon: '💡', message: 'research-sandbox: 78% of GPT-4o requests could use GPT-4o-mini (est. savings: $420/mo)', borderColor: colors.blue, action: 'Optimize →', nav: null },
    { id: 'a4', icon: '✅', message: 'ml-inference on track: $5.1K of $8K budget (64%)', borderColor: colors.green, action: '', nav: null },
  ];

  const chargebackData = [
    { namespace: 'ai-platform', modelsCost: 8400, toolsCost: 1800, agentCost: 1000, total: 11200, budget: 15000 },
    { namespace: 'ml-inference', modelsCost: 4200, toolsCost: 600, agentCost: 300, total: 5100, budget: 8000 },
    { namespace: 'customer-support-ai', modelsCost: 2800, toolsCost: 400, agentCost: 200, total: 3400, budget: 3000 },
    { namespace: 'research-sandbox', modelsCost: 500, toolsCost: 200, agentCost: 100, total: 800, budget: 2000 },
    { namespace: 'data-engineering', modelsCost: 3200, toolsCost: 500, agentCost: 200, total: 3900, budget: 5000 },
  ];

  const chargebackTotal = chargebackData.reduce((s, r) => s + r.total, 0);
  const chargebackBudgetTotal = chargebackData.reduce((s, r) => s + r.budget, 0);

  // Derived totals
  const totalTokens = models.reduce((s, m) => s + m.totalTokens, 0);
  const totalCost = models.reduce((s, m) => s + m.cost, 0);
  const totalRequests = models.reduce((s, m) => s + m.requests, 0);
  const avgLatency = Math.round(
    models.reduce((s, m) => s + m.avgLatencyMs * m.requests, 0) / totalRequests,
  );

  // Time multiplier label
  const rangeLabel =
    timeRange === '24h' ? 'last 24 hours' : timeRange === '7d' ? 'last 7 days' : 'last 30 days';
  const mult = timeRange === '24h' ? 1 : timeRange === '7d' ? 7 : 30;

  // Filtered consumers
  const filteredConsumers =
    nsFilter === 'all' ? consumers : consumers.filter((c) => c.namespace === nsFilter);

  // Chart max for bar scaling
  const chartMax = Math.max(...timeSeries.map((t) => t.tokensIn + t.tokensOut));

  // Namespace usage aggregation
  const nsUsage = namespaces.map((ns) => {
    const total = consumers
      .filter((c) => c.namespace === ns)
      .reduce((s, c) => s + c.usage24h.totalTokens, 0);
    return { namespace: ns, total };
  });
  const nsMax = Math.max(...nsUsage.map((n) => n.total));

  const nsColors = ['#D4A843', '#B8923A', '#d4875e', '#9b59b6', '#ff9900'];

  return (
    <div style={{ padding: 24, maxWidth: 1280, margin: '0 auto' }}>
      {/* ── Toast ──────────────────────────────────────────────── */}
      {toastMsg && (
        <div style={{
          position: 'fixed',
          top: 60,
          right: 24,
          backgroundColor: '#1A1A1A',
          border: `1px solid ${colors.gold}`,
          borderRadius: 8,
          padding: '10px 18px',
          fontSize: 13,
          color: colors.text,
          zIndex: 2000,
          boxShadow: '0 4px 16px rgba(0,0,0,0.4)',
          display: 'flex',
          alignItems: 'center',
          gap: 8,
        }}>
          <span style={{ color: colors.green }}>✓</span> {toastMsg}
        </div>
      )}

      {/* ── Header ─────────────────────────────────────────────── */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: 20,
          flexWrap: 'wrap',
          gap: 12,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <span style={{ fontSize: 22, fontWeight: 600, color: colors.text }}>
            📊 Token Analytics
          </span>
          {nsFilter !== 'all' && (
            <span
              style={{
                fontSize: 11,
                fontWeight: 600,
                color: colors.gold,
                backgroundColor: colors.goldMuted,
                padding: '2px 8px',
                borderRadius: 4,
              }}
            >
              {nsFilter}
            </span>
          )}
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          {/* Export Report */}
          <button
            onClick={() => {
              setToastMsg('Report exported to CSV');
              setTimeout(() => setToastMsg(null), 3000);
            }}
            style={{
              backgroundColor: 'transparent',
              color: colors.text,
              border: `1px solid ${colors.border}`,
              borderRadius: 6,
              padding: '5px 12px',
              fontSize: 12,
              fontWeight: 600,
              cursor: 'pointer',
              fontFamily: 'inherit',
            }}
          >
            📥 Export Report
          </button>

          {/* Namespace filter */}
          <select
            value={nsFilter}
            onChange={(e) => setNsFilter(e.target.value)}
            style={{
              backgroundColor: '#1A1A1A',
              color: colors.text,
              border: `1px solid ${colors.border}`,
              borderRadius: 6,
              padding: '5px 10px',
              fontSize: 12,
              outline: 'none',
              cursor: 'pointer',
            }}
          >
            <option value="all">All namespaces</option>
            {namespaces.map((ns) => (
              <option key={ns} value={ns}>
                {ns}
              </option>
            ))}
          </select>

          {/* Time range toggles */}
          <div
            style={{
              display: 'flex',
              border: `1px solid ${colors.border}`,
              borderRadius: 6,
              overflow: 'hidden',
            }}
          >
            {(['24h', '7d', '30d'] as const).map((r) => (
              <button
                key={r}
                onClick={() => setTimeRange(r)}
                style={{
                  background: timeRange === r ? '#1A1A1A' : 'transparent',
                  color: timeRange === r ? colors.blue : colors.textMuted,
                  border: 'none',
                  borderBottom: timeRange === r ? `2px solid ${colors.blue}` : '2px solid transparent',
                  padding: '5px 14px',
                  fontSize: 12,
                  fontWeight: 600,
                  cursor: 'pointer',
                }}
              >
                {r}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* ── Tab Switcher ───────────────────────────────────────── */}
      <div style={{ display: 'flex', gap: 0, marginBottom: 16, borderBottom: `1px solid ${colors.border}` }}>
        {([
          { key: 'live' as const, label: 'Live' },
          { key: 'usage' as const, label: 'Usage' },
          { key: 'cost' as const, label: 'Cost' },
          { key: 'budgets' as const, label: 'Budgets' },
        ]).map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            style={{
              background: 'transparent',
              border: 'none',
              borderBottom: activeTab === tab.key ? `2px solid ${colors.gold}` : '2px solid transparent',
              color: activeTab === tab.key ? colors.gold : colors.textMuted,
              fontSize: 13,
              fontWeight: 600,
              padding: '8px 20px',
              cursor: 'pointer',
              fontFamily: 'inherit',
              transition: 'all 0.15s',
            }}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* ── Live Tab ────────────────────────────────────────────── */}
      {activeTab === 'live' && (
        <div>
          {/* Live Stats */}
          <div style={{ display: 'flex', gap: 12, marginBottom: 16 }}>
            <StatCard value={formatNumber(Math.round(1200000 * mult))} label="Total Requests" sub={rangeLabel} accent={colors.green} />
            <StatCard value="47ms" label="Avg Latency (P50)" sub="All endpoints" accent={colors.green} />
            <StatCard value={formatNumber(Math.round(2847 * mult))} label="Policy Blocks" sub={rangeLabel} accent={colors.amber} />
            <StatCard value="156" label="Active Endpoints" sub="Healthy" accent={colors.green} />
          </div>

          <div style={{ display: 'flex', gap: 12 }}>
            {/* Left — Provider distribution + Policy enforcement */}
            <div style={{ flex: '0 0 60%', display: 'flex', flexDirection: 'column', gap: 12 }}>
              {/* Requests by Provider */}
              <div style={card}>
                <div style={sectionTitle}>Requests by Provider</div>
                {[
                  { label: 'Azure OpenAI', pct: 45, value: '520K', color: '#4F6BED' },
                  { label: 'Anthropic', pct: 25, value: '290K', color: '#D4875E' },
                  { label: 'Google Vertex', pct: 15, value: '174K', color: '#34A853' },
                  { label: 'AWS Bedrock', pct: 10, value: '116K', color: '#FF9900' },
                  { label: 'Self-Hosted', pct: 5, value: '58K', color: colors.purple },
                ].map(p => (
                  <div key={p.label} style={{ marginBottom: 10 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4, fontSize: 12 }}>
                      <span style={{ color: colors.text }}>{p.label}</span>
                      <span style={{ color: colors.textMuted }}>{p.pct}% ({p.value})</span>
                    </div>
                    <div style={{ height: 6, backgroundColor: 'rgba(212,168,67,0.06)', borderRadius: 3, overflow: 'hidden' }}>
                      <div style={{ height: '100%', width: `${p.pct}%`, backgroundColor: p.color, borderRadius: 3 }} />
                    </div>
                  </div>
                ))}
              </div>

              {/* Policy Enforcement */}
              <div style={card}>
                <div style={sectionTitle}>Policy Enforcement</div>
                {[
                  { label: 'Passed', value: formatNumber(Math.round(1197153 * mult)), pct: 99.7, color: colors.green },
                  { label: 'Rate Limited', value: formatNumber(Math.round(1892 * mult)), pct: 0.16, color: colors.amber },
                  { label: 'Blocked (Safety)', value: formatNumber(Math.round(847 * mult)), pct: 0.07, color: colors.red },
                  { label: 'Auth Denied', value: formatNumber(Math.round(108 * mult)), pct: 0.01, color: colors.red },
                ].map(e => (
                  <div key={e.label} style={{ marginBottom: 10 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4, fontSize: 12 }}>
                      <span style={{ color: colors.text }}>{e.label}</span>
                      <span style={{ color: colors.textMuted }}>{e.value}</span>
                    </div>
                    <div style={{ height: 6, backgroundColor: 'rgba(212,168,67,0.06)', borderRadius: 3, overflow: 'hidden' }}>
                      <div style={{ height: '100%', width: `${Math.max(e.pct, 1.5)}%`, backgroundColor: e.color, borderRadius: 3 }} />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Right — Namespace health + Activity feed */}
            <div style={{ flex: '0 0 calc(40% - 12px)', display: 'flex', flexDirection: 'column', gap: 12 }}>
              {/* Top Namespaces */}
              <div style={card}>
                <div style={sectionTitle}>Top Namespaces</div>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr>
                      {['Namespace', 'Requests', 'Tokens', 'Status'].map(h => (
                        <th key={h} style={thStyle}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {[
                      { name: 'retail-support', requests: '312K', tokens: '4.2B', status: 'Healthy' as const },
                      { name: 'finance-analytics', requests: '245K', tokens: '3.1B', status: 'Healthy' as const },
                      { name: 'hr-automation', requests: '189K', tokens: '2.8B', status: 'Warning' as const },
                      { name: 'customer-ops', requests: '156K', tokens: '1.9B', status: 'Healthy' as const },
                      { name: 'dev-sandbox', requests: '98K', tokens: '0.8B', status: 'Healthy' as const },
                    ].map(ns => (
                      <tr
                        key={ns.name}
                        onClick={() => navigate('/namespaces')}
                        onMouseEnter={() => setHoveredRow(ns.name)}
                        onMouseLeave={() => setHoveredRow(null)}
                        style={{ cursor: 'pointer', backgroundColor: hoveredRow === ns.name ? '#1A1A1A' : 'transparent', transition: 'all 0.15s' }}
                      >
                        <td style={{ ...tdStyle, fontFamily: 'monospace', fontSize: 12, color: colors.gold }}>{ns.name}</td>
                        <td style={tdStyle}>{ns.requests}</td>
                        <td style={tdStyle}>{ns.tokens}</td>
                        <td style={tdStyle}>
                          <span style={{
                            display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: 11, fontWeight: 600,
                            color: ns.status === 'Healthy' ? colors.green : colors.amber,
                            backgroundColor: ns.status === 'Healthy' ? 'rgba(74,222,128,0.12)' : 'rgba(245,158,11,0.12)',
                            padding: '2px 8px', borderRadius: 4,
                          }}>
                            <span style={{ width: 6, height: 6, borderRadius: '50%', backgroundColor: ns.status === 'Healthy' ? colors.green : colors.amber }} />
                            {ns.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Recent Activity */}
              <div style={card}>
                <div style={sectionTitle}>Recent Activity</div>
                {[
                  { text: 'Rate limit triggered — finance-analytics namespace', time: '2 min ago', color: colors.amber },
                  { text: 'New model endpoint registered — claude-sonnet-4-20250514', time: '15 min ago', color: '#60A5FA' },
                  { text: 'Backup activated — Azure OpenAI East US → West US', time: '32 min ago', color: colors.red },
                  { text: 'Content safety block — prompt injection detected', time: '1h ago', color: colors.red },
                  { text: 'Credential rotation completed — retail-support namespace', time: '2h ago', color: colors.green },
                ].map((a, i, arr) => (
                  <div
                    key={i}
                    onClick={() => navigate('/logs')}
                    style={{
                      display: 'flex', alignItems: 'flex-start', gap: 8, padding: '8px 0',
                      cursor: 'pointer', borderBottom: i < arr.length - 1 ? `1px solid ${colors.border}` : 'none',
                    }}
                  >
                    <span style={{ width: 7, height: 7, borderRadius: '50%', backgroundColor: a.color, flexShrink: 0, marginTop: 4 }} />
                    <div style={{ flex: 1 }}>
                      <div style={{ color: colors.text, fontSize: 12, lineHeight: 1.4 }}>{a.text}</div>
                      <div style={{ color: colors.textDim, fontSize: 11, marginTop: 2 }}>{a.time}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── Stats Grid (Usage + Cost tabs) ──────────────────── */}
      {(activeTab === 'usage' || activeTab === 'cost') && (
      <div style={{ display: 'flex', gap: 12, marginBottom: 16 }}>
        <StatCard
          label="Total Tokens"
          value={formatNumber(totalTokens)}
          sub={`across all models · ${rangeLabel}`}
          accent="#4f6bed"
        />
        <StatCard
          label="Total Cost"
          value={formatCost(totalCost)}
          sub={`estimated spend · ${rangeLabel}`}
          accent="#47c28e"
        />
        <StatCard
          label="Total Requests"
          value={formatNumber(totalRequests)}
          sub={`completions · ${rangeLabel}`}
          accent="#d4875e"
        />
        <StatCard
          label="Avg Latency"
          value={formatLatency(avgLatency)}
          sub={`weighted by requests · ${rangeLabel}`}
          accent="#9b59b6"
        />
      </div>
      )}

      {/* ── Cost Governance (Cost + Budgets tabs) ─────────────── */}
      {(activeTab === 'cost' || activeTab === 'budgets') && (
      <div style={{ ...card, marginBottom: 16 }}>
        <div style={sectionTitle}>💰 Cost Governance</div>

        {/* Budget Overview */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 12, marginBottom: 20 }}>
          {budgetData.map((b) => {
            const effectiveBudget = budgetEdits[b.namespace] ?? b.budget;
            const pct = Math.round((b.spent / effectiveBudget) * 100);
            const barColor = pct > 100 ? colors.red : pct >= 60 ? colors.amber : colors.green;
            return (
              <div
                key={b.namespace}
                onClick={() => navigate('/namespaces')}
                style={{
                  backgroundColor: 'rgba(212, 168, 67, 0.04)',
                  border: `1px solid ${colors.border}`,
                  borderRadius: 8,
                  padding: 14,
                  cursor: 'pointer',
                  transition: 'background-color 0.15s',
                }}
                onMouseEnter={(e) => { (e.currentTarget as HTMLDivElement).style.backgroundColor = '#1A1A1A'; }}
                onMouseLeave={(e) => { (e.currentTarget as HTMLDivElement).style.backgroundColor = 'rgba(212, 168, 67, 0.04)'; }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                  <span style={{ fontSize: 13, fontWeight: 600, color: '#fff' }}>{b.namespace}</span>
                  <span style={{ fontSize: 9, fontWeight: 600, color: colors.textMuted, backgroundColor: 'rgba(212, 168, 67, 0.10)', padding: '1px 6px', borderRadius: 3 }}>
                    {b.env}
                  </span>
                </div>
                <div style={{ fontSize: 11, color: colors.textMuted, marginBottom: 2 }}>
                  Monthly budget:{' '}
                  {editingBudget === b.namespace ? (
                    <input
                      autoFocus
                      type="number"
                      defaultValue={budgetEdits[b.namespace] ?? b.budget}
                      onBlur={(e) => {
                        setBudgetEdits((prev) => ({ ...prev, [b.namespace]: Number(e.target.value) }));
                        setEditingBudget(null);
                      }}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          setBudgetEdits((prev) => ({ ...prev, [b.namespace]: Number((e.target as HTMLInputElement).value) }));
                          setEditingBudget(null);
                        }
                        if (e.key === 'Escape') setEditingBudget(null);
                      }}
                      style={{
                        backgroundColor: '#0A0A0A',
                        color: colors.text,
                        border: `1px solid ${colors.gold}`,
                        borderRadius: 4,
                        padding: '1px 6px',
                        fontSize: 11,
                        fontWeight: 600,
                        width: 80,
                        outline: 'none',
                        fontFamily: 'inherit',
                      }}
                      onClick={(e) => e.stopPropagation()}
                    />
                  ) : (
                    <span
                      style={{ color: colors.text, fontWeight: 600, cursor: 'pointer', borderBottom: `1px dashed ${colors.goldDim}` }}
                      onClick={(e) => { e.stopPropagation(); setEditingBudget(b.namespace); }}
                      title="Click to edit budget"
                    >
                      ${(budgetEdits[b.namespace] ?? b.budget).toLocaleString()}
                    </span>
                  )}
                </div>
                <div style={{ fontSize: 11, color: colors.textMuted, marginBottom: 8 }}>
                  Spent this month: <span style={{ color: barColor, fontWeight: 600 }}>${b.spent.toLocaleString()}</span>
                  <span style={{ color: colors.textDim, marginLeft: 4 }}>({pct}%)</span>
                </div>
                {/* Progress bar */}
                <div style={{ height: 6, backgroundColor: 'rgba(212, 168, 67, 0.06)', borderRadius: 3, overflow: 'hidden', marginBottom: 6 }}>
                  <div style={{ height: '100%', width: `${Math.min(pct, 100)}%`, backgroundColor: barColor, borderRadius: 3, transition: 'width 0.4s ease' }} />
                </div>
                {pct > 100 && (
                  <span style={{ fontSize: 11, color: colors.red, fontWeight: 600 }}>🚨 Over budget</span>
                )}
                {pct > 80 && pct <= 100 && (
                  <span style={{ fontSize: 11, color: colors.amber, fontWeight: 600 }}>⚠️ Budget alert</span>
                )}
              </div>
            );
          })}
        </div>

        {/* Cost Anomaly Detection */}
        <div style={{ fontSize: 13, fontWeight: 600, color: colors.text, marginBottom: 10 }}>🔍 Cost Anomaly Detection</div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {anomalyAlerts.map((a) => (
            <div
              key={a.id}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                backgroundColor: 'rgba(212, 168, 67, 0.04)',
                borderLeft: `4px solid ${a.borderColor}`,
                borderRadius: 6,
                padding: '10px 14px',
              }}
            >
              <span style={{ fontSize: 12, color: colors.text }}>
                {a.icon} {a.message}
              </span>
              {a.action && (
                <span
                  onClick={() => { if (a.nav) navigate(a.nav); }}
                  style={{
                    fontSize: 11,
                    fontWeight: 600,
                    color: colors.gold,
                    cursor: a.nav ? 'pointer' : 'default',
                    whiteSpace: 'nowrap',
                    marginLeft: 12,
                  }}
                >
                  {a.action}
                </span>
              )}
            </div>
          ))}
        </div>
      </div>
      )}

      {/* ── Token Usage Chart (Usage tab) ──────────────────────── */}
      {activeTab === 'usage' && (
      <div style={{ ...card, marginBottom: 16 }}>
        <div style={sectionTitle}>📈 Token Usage — Last 24 Hours</div>
        <div
          style={{
            display: 'flex',
            alignItems: 'flex-end',
            gap: 4,
            height: 180,
            padding: '0 4px',
          }}
        >
          {timeSeries.map((t, i) => {
            const total = t.tokensIn + t.tokensOut;
            const pct = chartMax > 0 ? (total / chartMax) * 100 : 0;
            const inPct = total > 0 ? (t.tokensIn / total) * 100 : 0;
            return (
              <div
                key={i}
                style={{
                  flex: 1,
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  height: '100%',
                  justifyContent: 'flex-end',
                }}
              >
                {/* Stacked bar */}
                <div
                  style={{
                    width: '100%',
                    maxWidth: 28,
                    height: `${pct}%`,
                    borderRadius: '3px 3px 0 0',
                    overflow: 'hidden',
                    display: 'flex',
                    flexDirection: 'column',
                  }}
                  title={`In: ${formatNumber(t.tokensIn)} · Out: ${formatNumber(t.tokensOut)}`}
                >
                  <div
                    style={{
                      flex: `0 0 ${inPct}%`,
                      backgroundColor: '#D4A843',
                    }}
                  />
                  <div
                    style={{
                      flex: 1,
                      backgroundColor: '#B8923A',
                    }}
                  />
                </div>
              </div>
            );
          })}
        </div>

        {/* X-axis labels */}
        <div
          style={{
            display: 'flex',
            padding: '6px 4px 0',
          }}
        >
          {timeSeries.map((t, i) => {
            const hour = new Date(t.timestamp).getHours();
            const show = hour % 4 === 0;
            return (
              <div
                key={i}
                style={{
                  flex: 1,
                  textAlign: 'center',
                  fontSize: 10,
                  color: show ? colors.textMuted : 'transparent',
                }}
              >
                {show ? `${hour.toString().padStart(2, '0')}:00` : '·'}
              </div>
            );
          })}
        </div>

        {/* Legend */}
        <div
          style={{
            display: 'flex',
            gap: 16,
            marginTop: 10,
            justifyContent: 'center',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11, color: colors.textMuted }}>
            <span style={{ width: 10, height: 10, borderRadius: 2, backgroundColor: '#D4A843', display: 'inline-block' }} />
            Tokens In
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11, color: colors.textMuted }}>
            <span style={{ width: 10, height: 10, borderRadius: 2, backgroundColor: '#B8923A', display: 'inline-block' }} />
            Tokens Out
          </div>
        </div>
      </div>
      )}

      {/* ── Usage by Model (Usage tab) ─────────────────────────── */}
      {activeTab === 'usage' && (
      <div style={{ marginBottom: 16 }}>
        <div style={sectionTitle}>📊 Usage by Model</div>
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
            gap: 12,
          }}
        >
          {models.map((m) => {
            const pColor = providerColors[m.provider] ?? colors.purple;
            const pctOfTotal = totalTokens > 0 ? (m.totalTokens / totalTokens) * 100 : 0;
            const inPct = m.totalTokens > 0 ? (m.tokensIn / m.totalTokens) * 100 : 0;
            return (
              <div key={m.modelId} style={card}>
                {/* Model header */}
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    marginBottom: 10,
                  }}
                >
                  <span style={{ color: '#fff', fontSize: 14, fontWeight: 600 }}>
                    {m.modelName}
                  </span>
                  <span
                    style={{
                      fontSize: 10,
                      fontWeight: 600,
                      color: pColor,
                      backgroundColor: `${pColor}1a`,
                      padding: '2px 8px',
                      borderRadius: 4,
                    }}
                  >
                    {m.provider}
                  </span>
                </div>

                {/* Percentage of total bar */}
                <div style={{ marginBottom: 8 }}>
                  <div
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      fontSize: 11,
                      color: colors.textMuted,
                      marginBottom: 4,
                    }}
                  >
                    <span>{pctOfTotal.toFixed(1)}% of total tokens</span>
                    <span>{formatNumber(m.totalTokens)}</span>
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
                        width: `${pctOfTotal}%`,
                        backgroundColor: pColor,
                        borderRadius: 3,
                        transition: 'width 0.4s ease',
                      }}
                    />
                  </div>
                </div>

                {/* In / Out split bar */}
                <div style={{ marginBottom: 10 }}>
                  <div
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      fontSize: 10,
                      color: colors.textDim,
                      marginBottom: 3,
                    }}
                  >
                    <span>In: {formatNumber(m.tokensIn)}</span>
                    <span>Out: {formatNumber(m.tokensOut)}</span>
                  </div>
                  <div
                    style={{
                      height: 8,
                      backgroundColor: 'rgba(212, 168, 67, 0.06)',
                      borderRadius: 4,
                      overflow: 'hidden',
                      display: 'flex',
                    }}
                  >
                    <div
                      style={{
                        width: `${inPct}%`,
                        backgroundColor: '#D4A843',
                        borderRadius: '4px 0 0 4px',
                      }}
                    />
                    <div
                      style={{
                        flex: 1,
                        backgroundColor: '#B8923A',
                        borderRadius: '0 4px 4px 0',
                      }}
                    />
                  </div>
                </div>

                {/* 2×2 metric grid */}
                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: '1fr 1fr',
                    gap: 8,
                  }}
                >
                  {[
                    { label: 'Total Tokens', value: formatNumber(m.totalTokens) },
                    { label: 'Requests', value: formatNumber(m.requests) },
                    { label: 'Cost', value: formatCost(m.cost) },
                    { label: 'Avg Latency', value: formatLatency(m.avgLatencyMs) },
                  ].map((metric) => (
                    <div
                      key={metric.label}
                      style={{
                        backgroundColor: 'rgba(212, 168, 67, 0.04)',
                        borderRadius: 6,
                        padding: '6px 8px',
                      }}
                    >
                      <div style={{ fontSize: 10, color: colors.textDim, marginBottom: 2 }}>
                        {metric.label}
                      </div>
                      <div style={{ fontSize: 14, fontWeight: 600, color: colors.text }}>
                        {metric.value}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>
      )}

      {/* ── Top Consumers Table (Usage + Cost tabs) ────────────── */}
      {(activeTab === 'usage' || activeTab === 'cost') && (
      <div style={{ ...card, marginBottom: 16 }}>
        <div style={sectionTitle}>👥 Top Consumers</div>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr>
                <th style={thStyle}>Consumer</th>
                <th style={thStyle}>Type</th>
                <th style={thStyle}>Team</th>
                <th style={{ ...thStyle, textAlign: 'right' }}>Tokens Used</th>
                <th style={{ ...thStyle, textAlign: 'right' }}>Cost</th>
                <th style={{ ...thStyle, textAlign: 'right' }}>Requests</th>
                <th style={{ ...thStyle, textAlign: 'center' }}>Models Used</th>
                <th style={{ ...thStyle, textAlign: 'right' }}>Quota %</th>
                <th style={{ ...thStyle, textAlign: 'center' }}>Action</th>
              </tr>
            </thead>
            <tbody>
              {filteredConsumers.map((c) => {
                const quotaPct = Math.min(
                  (c.usage24h.totalTokens / c.quotas.tokensPerDay) * 100,
                  100,
                );
                const quotaColor =
                  quotaPct >= 90 ? colors.red : quotaPct >= 70 ? colors.amber : colors.green;
                const isHovered = hoveredRow === c.id;
                return (
                  <tr
                    key={c.id}
                    onClick={() => navigate('/access')}
                    onMouseEnter={() => setHoveredRow(c.id)}
                    onMouseLeave={() => setHoveredRow(null)}
                    style={{
                      backgroundColor: isHovered ? '#1A1A1A' : 'transparent',
                      transition: 'background-color 0.15s',
                      cursor: 'pointer',
                    }}
                  >
                    <td style={tdStyle}>
                      <div style={{ fontWeight: 600, color: '#fff', fontSize: 12 }}>
                        {c.displayName}
                      </div>
                      <div style={{ fontSize: 10, color: colors.textDim, marginTop: 1 }}>
                        {c.name}
                      </div>
                    </td>
                    <td style={tdStyle}>
                      <span
                        style={{
                          fontSize: 10,
                          fontWeight: 600,
                          color: c.type === 'user' ? colors.blue : colors.amber,
                          backgroundColor:
                            c.type === 'user'
                              ? colors.goldMuted
                              : 'rgba(245,158,11,0.12)',
                          padding: '2px 8px',
                          borderRadius: 4,
                        }}
                      >
                        {c.type}
                      </span>
                    </td>
                    <td style={{ ...tdStyle, color: colors.textMuted }}>{c.team}</td>
                    <td style={{ ...tdStyle, textAlign: 'right', fontFamily: 'monospace' }}>
                      {formatNumber(c.usage24h.totalTokens)}
                    </td>
                    <td style={{ ...tdStyle, textAlign: 'right', fontFamily: 'monospace' }}>
                      {formatCost(c.usage24h.totalCost)}
                    </td>
                    <td style={{ ...tdStyle, textAlign: 'right', fontFamily: 'monospace' }}>
                      {formatNumber(c.usage24h.totalRequests)}
                    </td>
                    <td style={{ ...tdStyle, textAlign: 'center' }}>
                      {c.usage24h.modelsUsed.length}
                    </td>
                    <td style={{ ...tdStyle, textAlign: 'right' }}>
                      <div
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'flex-end',
                          gap: 8,
                        }}
                      >
                        <span
                          style={{
                            fontSize: 12,
                            fontWeight: 600,
                            color: quotaColor,
                            minWidth: 36,
                            textAlign: 'right',
                          }}
                        >
                          {quotaPct.toFixed(0)}%
                        </span>
                        <div
                          style={{
                            width: 60,
                            height: 6,
                            backgroundColor: 'rgba(212, 168, 67, 0.06)',
                            borderRadius: 3,
                            overflow: 'hidden',
                          }}
                        >
                          <div
                            style={{
                              height: '100%',
                              width: `${quotaPct}%`,
                              backgroundColor: quotaColor,
                              borderRadius: 3,
                              transition: 'width 0.4s ease',
                            }}
                          />
                        </div>
                      </div>
                    </td>
                    <td style={{ ...tdStyle, textAlign: 'center' }}>
                      <span style={{ fontSize: 11, fontWeight: 600, color: colors.blue }}>View →</span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
      )}

      {/* ── Chargeback Summary (Cost tab) ──────────────────────── */}
      {activeTab === 'cost' && (
      <div style={{ ...card, marginBottom: 16 }}>
        <div style={sectionTitle}>📊 Chargeback Report — March 2026</div>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr>
                <th style={thStyle}>Namespace</th>
                <th style={{ ...thStyle, textAlign: 'right' }}>Models Cost</th>
                <th style={{ ...thStyle, textAlign: 'right' }}>Tools Cost</th>
                <th style={{ ...thStyle, textAlign: 'right' }}>Agent Cost</th>
                <th style={{ ...thStyle, textAlign: 'right' }}>Total</th>
                <th style={{ ...thStyle, textAlign: 'right' }}>Budget</th>
                <th style={{ ...thStyle, textAlign: 'right' }}>Variance</th>
              </tr>
            </thead>
            <tbody>
              {chargebackData.map((r) => {
                const variance = r.budget - r.total;
                const isOver = variance < 0;
                return (
                  <tr
                    key={r.namespace}
                    style={{ transition: 'background-color 0.15s' }}
                    onMouseEnter={(e) => { (e.currentTarget as HTMLTableRowElement).style.backgroundColor = '#1A1A1A'; }}
                    onMouseLeave={(e) => { (e.currentTarget as HTMLTableRowElement).style.backgroundColor = 'transparent'; }}
                  >
                    <td style={{ ...tdStyle, fontWeight: 600, color: '#fff' }}>{r.namespace}</td>
                    <td style={{ ...tdStyle, textAlign: 'right', fontFamily: 'monospace' }}>${r.modelsCost.toLocaleString()}</td>
                    <td style={{ ...tdStyle, textAlign: 'right', fontFamily: 'monospace' }}>${r.toolsCost.toLocaleString()}</td>
                    <td style={{ ...tdStyle, textAlign: 'right', fontFamily: 'monospace' }}>${r.agentCost.toLocaleString()}</td>
                    <td style={{ ...tdStyle, textAlign: 'right', fontFamily: 'monospace', fontWeight: 600 }}>${r.total.toLocaleString()}</td>
                    <td style={{ ...tdStyle, textAlign: 'right', fontFamily: 'monospace', color: colors.textMuted }}>${r.budget.toLocaleString()}</td>
                    <td style={{ ...tdStyle, textAlign: 'right', fontFamily: 'monospace', fontWeight: 600, color: isOver ? colors.red : colors.green }}>
                      {isOver ? '+' : '-'}${Math.abs(variance).toLocaleString()} {isOver ? '🔴' : '✅'}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 14, flexWrap: 'wrap', gap: 10 }}>
          <span style={{ fontSize: 13, fontWeight: 600, color: colors.text }}>
            Total AI Spend: <span style={{ color: colors.blue }}>${chargebackTotal.toLocaleString()}</span> / ${chargebackBudgetTotal.toLocaleString()} budget ({Math.round((chargebackTotal / chargebackBudgetTotal) * 100)}%)
          </span>
          <div style={{ display: 'flex', gap: 8 }}>
            <button
              style={{
                backgroundColor: 'transparent',
                color: colors.text,
                border: `1px solid ${colors.border}`,
                borderRadius: 6,
                padding: '6px 14px',
                fontSize: 12,
                fontWeight: 600,
                cursor: 'pointer',
              }}
              onClick={() => { setToastMsg('Chargeback report exported to CSV'); setTimeout(() => setToastMsg(null), 3000); }}
            >
              Export Chargeback CSV
            </button>
            <button
              style={{
                backgroundColor: 'transparent',
                color: colors.text,
                border: `1px solid ${colors.border}`,
                borderRadius: 6,
                padding: '6px 14px',
                fontSize: 12,
                fontWeight: 600,
                cursor: 'pointer',
              }}
              onClick={() => { setToastMsg('PDF report exported'); setTimeout(() => setToastMsg(null), 3000); }}
            >
              Export PDF Report
            </button>
          </div>
        </div>
      </div>
      )}

      {/* ── Namespace Usage (Usage tab) ─────────────────────────── */}
      {activeTab === 'usage' && (
      <div style={{ ...card, marginBottom: 16 }}>
        <div style={sectionTitle}>🏢 Namespace Token Usage</div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {nsUsage
            .sort((a, b) => b.total - a.total)
            .map((ns, i) => {
              const pct = nsMax > 0 ? (ns.total / nsMax) * 100 : 0;
              const barColor = nsColors[i % nsColors.length];
              return (
                <div
                  key={ns.namespace}
                  onClick={() => navigate('/namespaces')}
                  style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer' }}
                >
                  <span
                    style={{
                      width: 130,
                      textAlign: 'right',
                      fontSize: 12,
                      fontWeight: 600,
                      color: colors.text,
                      flexShrink: 0,
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    {ns.namespace}
                  </span>
                  <div
                    style={{
                      flex: 1,
                      height: 20,
                      backgroundColor: 'rgba(212, 168, 67, 0.06)',
                      borderRadius: 4,
                      overflow: 'hidden',
                      position: 'relative',
                    }}
                  >
                    <div
                      style={{
                        height: '100%',
                        width: `${pct}%`,
                        backgroundColor: barColor,
                        borderRadius: 4,
                        transition: 'width 0.4s ease',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'flex-end',
                        paddingRight: 6,
                      }}
                    >
                      {pct > 15 && (
                        <span
                          style={{
                            fontSize: 10,
                            fontWeight: 600,
                            color: '#fff',
                            whiteSpace: 'nowrap',
                          }}
                        >
                          {formatNumber(ns.total)}
                        </span>
                      )}
                    </div>
                  </div>
                  <span
                    style={{
                      width: 90,
                      fontSize: 12,
                      color: colors.textMuted,
                      textAlign: 'right',
                      flexShrink: 0,
                    }}
                  >
                    {formatNumber(ns.total)}
                  </span>
                </div>
              );
            })}
        </div>
      </div>
      )}
    </div>
  );
};

export default Observability;
