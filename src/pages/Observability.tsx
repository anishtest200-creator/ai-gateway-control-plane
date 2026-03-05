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
  const [activeTab, setActiveTab] = useState<'traffic' | 'cost' | 'budgets'>('traffic');
  const [editingBudget, setEditingBudget] = useState<string | null>(null);
  const [budgetEdits, setBudgetEdits] = useState<Record<string, number>>({});
  const [toastMsg, setToastMsg] = useState<string | null>(null);
  const navigate = useNavigate();

  const budgetData = [
    { namespace: 'ai-platform', env: 'production', budget: 15000, spent: 11200 },
    { namespace: 'ml-inference', env: 'production', budget: 8000, spent: 5100 },
    { namespace: 'customer-support-ai', env: 'production', budget: 3000, spent: 3400 },
    { namespace: 'research-sandbox', env: 'sandbox', budget: 2000, spent: 800 },
    { namespace: 'data-engineering', env: 'production', budget: 5000, spent: 3900 },
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

  const rangeLabel =
    timeRange === '24h' ? 'last 24 hours' : timeRange === '7d' ? 'last 7 days' : 'last 30 days';
  const mult = timeRange === '24h' ? 1 : timeRange === '7d' ? 7 : 30;

  const filteredConsumers =
    nsFilter === 'all' ? consumers : consumers.filter((c) => c.namespace === nsFilter);

  const chartMax = Math.max(...timeSeries.map((t) => t.tokensIn + t.tokensOut));

  const nsUsage = namespaces.map((ns) => {
    const total = consumers
      .filter((c) => c.namespace === ns)
      .reduce((s, c) => s + c.usage24h.totalTokens, 0);
    return { namespace: ns, total };
  });
  const nsMax = Math.max(...nsUsage.map((n) => n.total));
  const nsColors = ['#D4A843', '#B8923A', '#d4875e', '#9b59b6', '#ff9900'];

  const totalBudget = budgetData.reduce((s, b) => s + (budgetEdits[b.namespace] ?? b.budget), 0);
  const totalSpent = budgetData.reduce((s, b) => s + b.spent, 0);
  const teamsOverBudget = budgetData.filter(b => b.spent > (budgetEdits[b.namespace] ?? b.budget)).length;

  const topCostModel = [...models].sort((a, b) => b.cost - a.cost)[0];

  const tabMeta: Record<string, { icon: string; desc: string }> = {
    traffic: { icon: '📡', desc: 'Request volume, latency, provider distribution, and model performance' },
    cost: { icon: '💰', desc: 'Spend analysis, anomaly detection, and chargeback reporting' },
    budgets: { icon: '📊', desc: 'Budget allocation, burn rate, and namespace governance' },
  };

  return (
    <div style={{ padding: 24 }}>
      {/* Toast */}
      {toastMsg && (
        <div style={{
          position: 'fixed', top: 60, right: 24,
          backgroundColor: '#1A1A1A', border: `1px solid ${colors.gold}`,
          borderRadius: 8, padding: '10px 18px', fontSize: 13, color: colors.text,
          zIndex: 2000, boxShadow: '0 4px 16px rgba(0,0,0,0.4)',
          display: 'flex', alignItems: 'center', gap: 8,
        }}>
          <span style={{ color: colors.green }}>✓</span> {toastMsg}
        </div>
      )}

      {/* Header Controls */}
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        marginBottom: 20, flexWrap: 'wrap', gap: 12,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          {nsFilter !== 'all' && (
            <span style={{
              fontSize: 11, fontWeight: 600, color: colors.gold,
              backgroundColor: colors.goldMuted, padding: '2px 8px', borderRadius: 4,
            }}>
              Filtered: {nsFilter}
            </span>
          )}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <button
            onClick={() => { setToastMsg('Report exported to CSV'); setTimeout(() => setToastMsg(null), 3000); }}
            style={{
              backgroundColor: 'transparent', color: colors.text,
              border: `1px solid ${colors.border}`, borderRadius: 6,
              padding: '5px 12px', fontSize: 12, fontWeight: 600,
              cursor: 'pointer', fontFamily: 'inherit',
            }}
          >
            📥 Export
          </button>
          <select
            value={nsFilter}
            onChange={(e) => setNsFilter(e.target.value)}
            style={{
              backgroundColor: '#1A1A1A', color: colors.text,
              border: `1px solid ${colors.border}`, borderRadius: 6,
              padding: '5px 10px', fontSize: 12, outline: 'none', cursor: 'pointer',
            }}
          >
            <option value="all">All namespaces</option>
            {namespaces.map((ns) => <option key={ns} value={ns}>{ns}</option>)}
          </select>
          <div style={{ display: 'flex', border: `1px solid ${colors.border}`, borderRadius: 6, overflow: 'hidden' }}>
            {(['24h', '7d', '30d'] as const).map((r) => (
              <button
                key={r}
                onClick={() => setTimeRange(r)}
                style={{
                  background: timeRange === r ? '#1A1A1A' : 'transparent',
                  color: timeRange === r ? colors.gold : colors.textMuted,
                  border: 'none',
                  borderBottom: timeRange === r ? `2px solid ${colors.gold}` : '2px solid transparent',
                  padding: '5px 14px', fontSize: 12, fontWeight: 600, cursor: 'pointer',
                }}
              >
                {r}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Tab Switcher */}
      <div style={{ marginBottom: 20 }}>
        <div style={{ display: 'flex', gap: 0, borderBottom: `1px solid ${colors.border}` }}>
          {(['traffic', 'cost', 'budgets'] as const).map((key) => (
            <button
              key={key}
              onClick={() => setActiveTab(key)}
              style={{
                background: 'transparent', border: 'none',
                borderBottom: activeTab === key ? `2px solid ${colors.gold}` : '2px solid transparent',
                color: activeTab === key ? colors.gold : colors.textMuted,
                fontSize: 13, fontWeight: 600, padding: '8px 24px',
                cursor: 'pointer', fontFamily: 'inherit', transition: 'all 0.15s',
                display: 'flex', alignItems: 'center', gap: 6,
              }}
            >
              <span style={{ fontSize: 14 }}>{tabMeta[key].icon}</span>
              {key.charAt(0).toUpperCase() + key.slice(1)}
            </button>
          ))}
        </div>
        <div style={{ fontSize: 12, color: colors.textDim, marginTop: 8 }}>
          {tabMeta[activeTab].desc}
        </div>
      </div>

      {/* ═══════════════════════════════════════════════════════════════ */}
      {/* TRAFFIC TAB                                                     */}
      {/* ═══════════════════════════════════════════════════════════════ */}
      {activeTab === 'traffic' && (
        <div>
          {/* Stats */}
          <div style={{ display: 'flex', gap: 12, marginBottom: 20 }}>
            <StatCard value={formatNumber(Math.round(totalRequests * mult))} label="Total Requests" sub={rangeLabel} accent={colors.green} />
            <StatCard value={formatNumber(Math.round(totalTokens * mult))} label="Total Tokens" sub={rangeLabel} accent={colors.blue} />
            <StatCard value={formatLatency(avgLatency)} label="Avg Latency" sub="weighted by requests" accent={colors.purple} />
            <StatCard value={formatNumber(Math.round(2847 * mult))} label="Policy Blocks" sub={rangeLabel} accent={colors.amber} />
          </div>

          {/* Token Throughput Chart */}
          <div style={{ ...card, marginBottom: 16 }}>
            <div style={sectionTitle}>Token Throughput — Last 24 Hours</div>
            <div style={{ display: 'flex', alignItems: 'flex-end', gap: 4, height: 160, padding: '0 4px' }}>
              {timeSeries.map((t, i) => {
                const total = t.tokensIn + t.tokensOut;
                const pct = chartMax > 0 ? (total / chartMax) * 100 : 0;
                const inPct = total > 0 ? (t.tokensIn / total) * 100 : 0;
                return (
                  <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', height: '100%', justifyContent: 'flex-end' }}>
                    <div
                      style={{ width: '100%', maxWidth: 28, height: `${pct}%`, borderRadius: '3px 3px 0 0', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}
                      title={`In: ${formatNumber(t.tokensIn)} · Out: ${formatNumber(t.tokensOut)}`}
                    >
                      <div style={{ flex: `0 0 ${inPct}%`, backgroundColor: colors.gold }} />
                      <div style={{ flex: 1, backgroundColor: colors.goldDim }} />
                    </div>
                  </div>
                );
              })}
            </div>
            <div style={{ display: 'flex', padding: '6px 4px 0' }}>
              {timeSeries.map((t, i) => {
                const hour = new Date(t.timestamp).getHours();
                const show = hour % 4 === 0;
                return (
                  <div key={i} style={{ flex: 1, textAlign: 'center', fontSize: 10, color: show ? colors.textMuted : 'transparent' }}>
                    {show ? `${hour.toString().padStart(2, '0')}:00` : '\u00B7'}
                  </div>
                );
              })}
            </div>
            <div style={{ display: 'flex', gap: 16, marginTop: 10, justifyContent: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11, color: colors.textMuted }}>
                <span style={{ width: 10, height: 10, borderRadius: 2, backgroundColor: colors.gold, display: 'inline-block' }} />
                Tokens In
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11, color: colors.textMuted }}>
                <span style={{ width: 10, height: 10, borderRadius: 2, backgroundColor: colors.goldDim, display: 'inline-block' }} />
                Tokens Out
              </div>
            </div>
          </div>

          {/* Two-column: Provider Distribution + Policy Enforcement */}
          <div style={{ display: 'flex', gap: 12, marginBottom: 16 }}>
            <div style={{ ...card, flex: 1 }}>
              <div style={sectionTitle}>Requests by Provider</div>
              {[
                { label: 'Azure OpenAI', pct: 45, value: formatNumber(Math.round(540000 * mult)), color: '#4F6BED' },
                { label: 'Anthropic', pct: 25, value: formatNumber(Math.round(300000 * mult)), color: '#D4875E' },
                { label: 'Google Vertex', pct: 15, value: formatNumber(Math.round(180000 * mult)), color: '#34A853' },
                { label: 'AWS Bedrock', pct: 10, value: formatNumber(Math.round(120000 * mult)), color: '#FF9900' },
                { label: 'Self-Hosted', pct: 5, value: formatNumber(Math.round(60000 * mult)), color: colors.purple },
              ].map(p => (
                <div key={p.label} style={{ marginBottom: 10 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4, fontSize: 12 }}>
                    <span style={{ color: colors.text }}>{p.label}</span>
                    <span style={{ color: colors.textMuted }}>{p.pct}% · {p.value}</span>
                  </div>
                  <div style={{ height: 6, backgroundColor: 'rgba(212,168,67,0.06)', borderRadius: 3, overflow: 'hidden' }}>
                    <div style={{ height: '100%', width: `${p.pct}%`, backgroundColor: p.color, borderRadius: 3 }} />
                  </div>
                </div>
              ))}
            </div>

            <div style={{ ...card, flex: 1 }}>
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
              <div style={{ marginTop: 12, padding: '10px 12px', backgroundColor: 'rgba(74,222,128,0.06)', borderRadius: 6, display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ fontSize: 14 }}>🛡️</span>
                <span style={{ fontSize: 12, color: colors.green, fontWeight: 600 }}>99.7% pass rate — gateway policies healthy</span>
              </div>
            </div>
          </div>

          {/* Model Performance Table */}
          <div style={{ ...card, marginBottom: 16 }}>
            <div style={sectionTitle}>Model Performance</div>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr>
                    <th style={thStyle}>Model</th>
                    <th style={thStyle}>Provider</th>
                    <th style={{ ...thStyle, textAlign: 'right' }}>Tokens</th>
                    <th style={{ ...thStyle, textAlign: 'right' }}>Requests</th>
                    <th style={{ ...thStyle, textAlign: 'right' }}>Avg Latency</th>
                    <th style={{ ...thStyle, textAlign: 'right' }}>In / Out Split</th>
                  </tr>
                </thead>
                <tbody>
                  {[...models].sort((a, b) => b.totalTokens - a.totalTokens).map((m) => {
                    const pColor = providerColors[m.provider] ?? colors.purple;
                    const inPct = m.totalTokens > 0 ? (m.tokensIn / m.totalTokens) * 100 : 0;
                    const isHov = hoveredRow === m.modelId;
                    return (
                      <tr
                        key={m.modelId}
                        onMouseEnter={() => setHoveredRow(m.modelId)}
                        onMouseLeave={() => setHoveredRow(null)}
                        style={{ backgroundColor: isHov ? '#1A1A1A' : 'transparent', transition: 'background-color 0.15s' }}
                      >
                        <td style={{ ...tdStyle, fontWeight: 600, color: '#fff' }}>{m.modelName}</td>
                        <td style={tdStyle}>
                          <span style={{ fontSize: 10, fontWeight: 600, color: pColor, backgroundColor: `${pColor}1a`, padding: '2px 8px', borderRadius: 4 }}>
                            {m.provider}
                          </span>
                        </td>
                        <td style={{ ...tdStyle, textAlign: 'right', fontFamily: 'monospace' }}>{formatNumber(m.totalTokens)}</td>
                        <td style={{ ...tdStyle, textAlign: 'right', fontFamily: 'monospace' }}>{formatNumber(m.requests)}</td>
                        <td style={{ ...tdStyle, textAlign: 'right' }}>
                          <span style={{ color: m.avgLatencyMs > 1200 ? colors.amber : colors.green, fontWeight: 600 }}>
                            {formatLatency(m.avgLatencyMs)}
                          </span>
                        </td>
                        <td style={{ ...tdStyle, textAlign: 'right' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8, justifyContent: 'flex-end' }}>
                            <div style={{ width: 80, height: 6, backgroundColor: 'rgba(212,168,67,0.06)', borderRadius: 3, overflow: 'hidden', display: 'flex' }}>
                              <div style={{ width: `${inPct}%`, backgroundColor: colors.gold, borderRadius: '3px 0 0 3px' }} />
                              <div style={{ flex: 1, backgroundColor: colors.goldDim, borderRadius: '0 3px 3px 0' }} />
                            </div>
                            <span style={{ fontSize: 10, color: colors.textDim, minWidth: 32 }}>{Math.round(inPct)}% in</span>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Bottom: Namespace Usage + Activity Feed */}
          <div style={{ display: 'flex', gap: 12 }}>
            <div style={{ ...card, flex: '0 0 60%' }}>
              <div style={sectionTitle}>Namespace Token Usage</div>
              {nsUsage.sort((a, b) => b.total - a.total).map((ns, i) => {
                const pct = nsMax > 0 ? (ns.total / nsMax) * 100 : 0;
                return (
                  <div key={ns.namespace} onClick={() => navigate('/namespaces')} style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer', marginBottom: 8 }}>
                    <span style={{ width: 130, textAlign: 'right', fontSize: 12, fontWeight: 600, color: colors.text, flexShrink: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {ns.namespace}
                    </span>
                    <div style={{ flex: 1, height: 18, backgroundColor: 'rgba(212,168,67,0.06)', borderRadius: 4, overflow: 'hidden', position: 'relative' }}>
                      <div style={{
                        height: '100%', width: `${pct}%`, backgroundColor: nsColors[i % nsColors.length],
                        borderRadius: 4, transition: 'width 0.4s ease',
                        display: 'flex', alignItems: 'center', justifyContent: 'flex-end', paddingRight: 6,
                      }}>
                        {pct > 15 && <span style={{ fontSize: 10, fontWeight: 600, color: '#fff', whiteSpace: 'nowrap' }}>{formatNumber(ns.total)}</span>}
                      </div>
                    </div>
                    <span style={{ width: 70, fontSize: 12, color: colors.textMuted, textAlign: 'right', flexShrink: 0 }}>{formatNumber(ns.total)}</span>
                  </div>
                );
              })}
            </div>

            <div style={{ ...card, flex: '0 0 calc(40% - 12px)' }}>
              <div style={sectionTitle}>Recent Activity</div>
              {[
                { text: 'Rate limit triggered — finance-analytics namespace', time: '2 min ago', color: colors.amber },
                { text: 'New endpoint registered — claude-sonnet-4-20250514', time: '15 min ago', color: colors.blue },
                { text: 'Backup activated — Azure OpenAI East US \u2192 West US', time: '32 min ago', color: colors.red },
                { text: 'Content safety block — prompt injection detected', time: '1h ago', color: colors.red },
                { text: 'Credential rotation completed — retail-support', time: '2h ago', color: colors.green },
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
      )}

      {/* ═══════════════════════════════════════════════════════════════ */}
      {/* COST TAB                                                        */}
      {/* ═══════════════════════════════════════════════════════════════ */}
      {activeTab === 'cost' && (
        <div>
          {/* Stats */}
          <div style={{ display: 'flex', gap: 12, marginBottom: 20 }}>
            <StatCard value={formatCost(totalCost * mult)} label="Total Spend" sub={rangeLabel} accent={colors.green} />
            <StatCard
              value={`$${((totalCost / totalTokens) * 1000).toFixed(3)}`}
              label="Avg Cost / 1K Tokens"
              sub="blended across all models"
              accent={colors.blue}
            />
            <StatCard
              value={topCostModel.modelName}
              label="Highest Cost Model"
              sub={formatCost(topCostModel.cost * mult) + ' ' + rangeLabel}
              accent={colors.amber}
            />
            <StatCard
              value={`${Math.round((chargebackTotal / chargebackBudgetTotal) * 100)}%`}
              label="Budget Utilization"
              sub={`$${chargebackTotal.toLocaleString()} of $${chargebackBudgetTotal.toLocaleString()}`}
              accent={colors.purple}
            />
          </div>

          {/* Anomaly Detection */}
          <div style={{ ...card, marginBottom: 16 }}>
            <div style={sectionTitle}>Anomaly Detection</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {[
                { id: 'c1', icon: '\u26A0\uFE0F', message: 'data-pipeline-svc usage up 340% vs 7-day average (12.4K \u2192 42.1K tokens/hr)', borderColor: colors.amber, action: 'View logs \u2192', nav: '/logs' },
                { id: 'c2', icon: '\uD83D\uDCA1', message: '78% of GPT-4o requests could use GPT-4o-mini (est. savings: $420/mo)', borderColor: colors.blue, action: 'Review \u2192', nav: '/routing' },
                { id: 'c3', icon: '\uD83D\uDCC8', message: 'Anthropic spend increased 45% week-over-week across 3 namespaces', borderColor: colors.amber, action: 'Investigate \u2192', nav: '/namespaces' },
                { id: 'c4', icon: '\u2705', message: 'Overall cost efficiency improved 12% this month vs last month', borderColor: colors.green, action: '', nav: null },
              ].map((a) => (
                <div
                  key={a.id}
                  style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    backgroundColor: 'rgba(212,168,67,0.04)',
                    borderLeft: `4px solid ${a.borderColor}`, borderRadius: 6, padding: '10px 14px',
                  }}
                >
                  <span style={{ fontSize: 12, color: colors.text }}>{a.icon} {a.message}</span>
                  {a.action && (
                    <span
                      onClick={() => { if (a.nav) navigate(a.nav); }}
                      style={{ fontSize: 11, fontWeight: 600, color: colors.gold, cursor: a.nav ? 'pointer' : 'default', whiteSpace: 'nowrap', marginLeft: 12 }}
                    >
                      {a.action}
                    </span>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Cost by Model */}
          <div style={{ ...card, marginBottom: 16 }}>
            <div style={sectionTitle}>Cost by Model</div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 12 }}>
              {[...models].sort((a, b) => b.cost - a.cost).map((m) => {
                const pColor = providerColors[m.provider] ?? colors.purple;
                const costPct = totalCost > 0 ? (m.cost / totalCost) * 100 : 0;
                const costPerToken = m.totalTokens > 0 ? (m.cost / m.totalTokens) * 1000 : 0;
                return (
                  <div key={m.modelId} style={{ backgroundColor: 'rgba(212,168,67,0.04)', border: `1px solid ${colors.border}`, borderRadius: 8, padding: 14 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                      <span style={{ color: '#fff', fontSize: 13, fontWeight: 600 }}>{m.modelName}</span>
                      <span style={{ fontSize: 10, fontWeight: 600, color: pColor, backgroundColor: `${pColor}1a`, padding: '2px 8px', borderRadius: 4 }}>{m.provider}</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 6 }}>
                      <span style={{ fontSize: 11, color: colors.textMuted }}>{costPct.toFixed(1)}% of total spend</span>
                      <span style={{ color: '#fff', fontWeight: 700, fontSize: 18 }}>{formatCost(m.cost * mult)}</span>
                    </div>
                    <div style={{ height: 6, backgroundColor: 'rgba(212,168,67,0.06)', borderRadius: 3, overflow: 'hidden', marginBottom: 10 }}>
                      <div style={{ height: '100%', width: `${costPct}%`, backgroundColor: pColor, borderRadius: 3, transition: 'width 0.4s ease' }} />
                    </div>
                    <div style={{ display: 'flex', gap: 12, fontSize: 11, color: colors.textMuted }}>
                      <span>${costPerToken.toFixed(4)} / 1K tokens</span>
                      <span style={{ color: colors.textDim }}>\u00B7</span>
                      <span>{formatNumber(m.requests * mult)} requests</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Chargeback Report */}
          <div style={{ ...card, marginBottom: 16 }}>
            <div style={sectionTitle}>Chargeback Report — March 2026</div>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr>
                    <th style={thStyle}>Namespace</th>
                    <th style={{ ...thStyle, textAlign: 'right' }}>Models</th>
                    <th style={{ ...thStyle, textAlign: 'right' }}>Tools</th>
                    <th style={{ ...thStyle, textAlign: 'right' }}>Agents</th>
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
                          {isOver ? '+' : '-'}${Math.abs(variance).toLocaleString()} {isOver ? '\uD83D\uDD34' : '\u2705'}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 14, flexWrap: 'wrap', gap: 10 }}>
              <span style={{ fontSize: 13, fontWeight: 600, color: colors.text }}>
                Total: <span style={{ color: colors.blue }}>${chargebackTotal.toLocaleString()}</span> / ${chargebackBudgetTotal.toLocaleString()} ({Math.round((chargebackTotal / chargebackBudgetTotal) * 100)}%)
              </span>
              <div style={{ display: 'flex', gap: 8 }}>
                <button
                  style={{ backgroundColor: 'transparent', color: colors.text, border: `1px solid ${colors.border}`, borderRadius: 6, padding: '6px 14px', fontSize: 12, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}
                  onClick={() => { setToastMsg('Chargeback report exported'); setTimeout(() => setToastMsg(null), 3000); }}
                >
                  Export CSV
                </button>
                <button
                  style={{ backgroundColor: 'transparent', color: colors.text, border: `1px solid ${colors.border}`, borderRadius: 6, padding: '6px 14px', fontSize: 12, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}
                  onClick={() => { setToastMsg('PDF report exported'); setTimeout(() => setToastMsg(null), 3000); }}
                >
                  Export PDF
                </button>
              </div>
            </div>
          </div>

          {/* Top Consumers */}
          <div style={{ ...card }}>
            <div style={sectionTitle}>Top Consumers by Spend</div>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr>
                    <th style={thStyle}>Consumer</th>
                    <th style={thStyle}>Type</th>
                    <th style={thStyle}>Namespace</th>
                    <th style={{ ...thStyle, textAlign: 'right' }}>Cost (24h)</th>
                    <th style={{ ...thStyle, textAlign: 'right' }}>Tokens</th>
                    <th style={{ ...thStyle, textAlign: 'right' }}>Requests</th>
                    <th style={{ ...thStyle, textAlign: 'right' }}>Quota</th>
                  </tr>
                </thead>
                <tbody>
                  {[...filteredConsumers].sort((a, b) => b.usage24h.totalCost - a.usage24h.totalCost).map((c) => {
                    const quotaPct = Math.min((c.usage24h.totalTokens / c.quotas.tokensPerDay) * 100, 100);
                    const quotaColor = quotaPct >= 90 ? colors.red : quotaPct >= 70 ? colors.amber : colors.green;
                    const isHov = hoveredRow === c.id;
                    return (
                      <tr
                        key={c.id}
                        onClick={() => navigate('/access')}
                        onMouseEnter={() => setHoveredRow(c.id)}
                        onMouseLeave={() => setHoveredRow(null)}
                        style={{ backgroundColor: isHov ? '#1A1A1A' : 'transparent', transition: 'background-color 0.15s', cursor: 'pointer' }}
                      >
                        <td style={tdStyle}>
                          <div style={{ fontWeight: 600, color: '#fff', fontSize: 12 }}>{c.displayName}</div>
                          <div style={{ fontSize: 10, color: colors.textDim, marginTop: 1 }}>{c.name}</div>
                        </td>
                        <td style={tdStyle}>
                          <span style={{
                            fontSize: 10, fontWeight: 600,
                            color: c.type === 'user' ? colors.blue : colors.amber,
                            backgroundColor: c.type === 'user' ? 'rgba(96,165,250,0.12)' : 'rgba(245,158,11,0.12)',
                            padding: '2px 8px', borderRadius: 4,
                          }}>
                            {c.type}
                          </span>
                        </td>
                        <td style={{ ...tdStyle, fontFamily: 'monospace', fontSize: 11, color: colors.gold }}>{c.namespace}</td>
                        <td style={{ ...tdStyle, textAlign: 'right', fontFamily: 'monospace', fontWeight: 600, color: '#fff' }}>{formatCost(c.usage24h.totalCost)}</td>
                        <td style={{ ...tdStyle, textAlign: 'right', fontFamily: 'monospace' }}>{formatNumber(c.usage24h.totalTokens)}</td>
                        <td style={{ ...tdStyle, textAlign: 'right', fontFamily: 'monospace' }}>{formatNumber(c.usage24h.totalRequests)}</td>
                        <td style={{ ...tdStyle, textAlign: 'right' }}>
                          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 8 }}>
                            <span style={{ fontSize: 12, fontWeight: 600, color: quotaColor, minWidth: 36, textAlign: 'right' }}>
                              {quotaPct.toFixed(0)}%
                            </span>
                            <div style={{ width: 50, height: 5, backgroundColor: 'rgba(212,168,67,0.06)', borderRadius: 3, overflow: 'hidden' }}>
                              <div style={{ height: '100%', width: `${quotaPct}%`, backgroundColor: quotaColor, borderRadius: 3 }} />
                            </div>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════════════ */}
      {/* BUDGETS TAB                                                     */}
      {/* ═══════════════════════════════════════════════════════════════ */}
      {activeTab === 'budgets' && (
        <div>
          {/* Stats */}
          <div style={{ display: 'flex', gap: 12, marginBottom: 20 }}>
            <StatCard value={`$${totalBudget.toLocaleString()}`} label="Total Budget" sub="all namespaces combined" accent={colors.gold} />
            <StatCard value={`$${totalSpent.toLocaleString()}`} label="Total Spent" sub={`${Math.round((totalSpent / totalBudget) * 100)}% of total budget`} accent={colors.blue} />
            <StatCard value={`$${(totalBudget - totalSpent).toLocaleString()}`} label="Remaining" sub="available this period" accent={colors.green} />
            <StatCard
              value={String(teamsOverBudget)}
              label="Over Budget"
              sub={teamsOverBudget === 0 ? 'all teams within limits' : `${teamsOverBudget} team${teamsOverBudget > 1 ? 's' : ''} need attention`}
              accent={teamsOverBudget > 0 ? colors.red : colors.green}
            />
          </div>

          {/* Budget Cards */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 12, marginBottom: 16 }}>
            {budgetData.map((b) => {
              const effectiveBudget = budgetEdits[b.namespace] ?? b.budget;
              const pct = Math.round((b.spent / effectiveBudget) * 100);
              const barColor = pct > 100 ? colors.red : pct >= 80 ? colors.amber : colors.green;
              const remaining = effectiveBudget - b.spent;
              return (
                <div key={b.namespace} style={{
                  ...card, cursor: 'default', borderLeft: `3px solid ${barColor}`,
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <span style={{ fontSize: 14, fontWeight: 600, color: '#fff' }}>{b.namespace}</span>
                      <span style={{ fontSize: 9, fontWeight: 600, color: colors.textMuted, backgroundColor: 'rgba(212,168,67,0.10)', padding: '1px 6px', borderRadius: 3 }}>
                        {b.env}
                      </span>
                    </div>
                    {pct > 100 && <span style={{ fontSize: 10, fontWeight: 600, color: colors.red, backgroundColor: 'rgba(239,68,68,0.12)', padding: '2px 8px', borderRadius: 4 }}>Over budget</span>}
                    {pct >= 80 && pct <= 100 && <span style={{ fontSize: 10, fontWeight: 600, color: colors.amber, backgroundColor: 'rgba(245,158,11,0.12)', padding: '2px 8px', borderRadius: 4 }}>At risk</span>}
                    {pct < 80 && <span style={{ fontSize: 10, fontWeight: 600, color: colors.green, backgroundColor: 'rgba(74,222,128,0.12)', padding: '2px 8px', borderRadius: 4 }}>On track</span>}
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                    <span style={{ fontSize: 11, color: colors.textMuted }}>
                      Budget:{' '}
                      {editingBudget === b.namespace ? (
                        <input
                          autoFocus
                          type="number"
                          defaultValue={effectiveBudget}
                          onBlur={(e) => { setBudgetEdits((prev) => ({ ...prev, [b.namespace]: Number(e.target.value) })); setEditingBudget(null); }}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') { setBudgetEdits((prev) => ({ ...prev, [b.namespace]: Number((e.target as HTMLInputElement).value) })); setEditingBudget(null); }
                            if (e.key === 'Escape') setEditingBudget(null);
                          }}
                          style={{
                            backgroundColor: '#0A0A0A', color: colors.text,
                            border: `1px solid ${colors.gold}`, borderRadius: 4,
                            padding: '1px 6px', fontSize: 11, fontWeight: 600,
                            width: 80, outline: 'none', fontFamily: 'inherit',
                          }}
                          onClick={(e) => e.stopPropagation()}
                        />
                      ) : (
                        <span
                          style={{ color: colors.text, fontWeight: 600, cursor: 'pointer', borderBottom: `1px dashed ${colors.goldDim}` }}
                          onClick={() => setEditingBudget(b.namespace)}
                          title="Click to edit budget"
                        >
                          ${effectiveBudget.toLocaleString()}
                        </span>
                      )}
                    </span>
                    <span style={{ fontSize: 11, color: barColor, fontWeight: 600 }}>{pct}%</span>
                  </div>

                  <div style={{ height: 8, backgroundColor: 'rgba(212,168,67,0.06)', borderRadius: 4, overflow: 'hidden', marginBottom: 10 }}>
                    <div style={{ height: '100%', width: `${Math.min(pct, 100)}%`, backgroundColor: barColor, borderRadius: 4, transition: 'width 0.4s ease' }} />
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12 }}>
                    <span style={{ color: colors.textMuted }}>Spent: <span style={{ color: '#fff', fontWeight: 600 }}>${b.spent.toLocaleString()}</span></span>
                    <span style={{ color: colors.textMuted }}>
                      {remaining >= 0
                        ? <><span style={{ color: colors.green, fontWeight: 600 }}>${remaining.toLocaleString()}</span> left</>
                        : <><span style={{ color: colors.red, fontWeight: 600 }}>${Math.abs(remaining).toLocaleString()}</span> over</>
                      }
                    </span>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Budget Alerts */}
          <div style={{ ...card }}>
            <div style={sectionTitle}>Alerts & Recommendations</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {[
                { id: 'b1', icon: '\uD83D\uDEA8', message: 'customer-support-ai exceeded monthly budget by 13% ($400 over)', borderColor: colors.red, action: 'View namespace \u2192', nav: '/namespaces' },
                { id: 'b2', icon: '\u26A0\uFE0F', message: 'data-engineering at 78% burn rate — projected to exceed by day 25', borderColor: colors.amber, action: 'Adjust budget \u2192', nav: null },
                { id: 'b3', icon: '\u2705', message: 'ml-inference on track: $5.1K of $8K budget (64%)', borderColor: colors.green, action: '', nav: null },
                { id: 'b4', icon: '\u2705', message: 'research-sandbox well within limits: $800 of $2K (40%)', borderColor: colors.green, action: '', nav: null },
              ].map((a) => (
                <div
                  key={a.id}
                  style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    backgroundColor: 'rgba(212,168,67,0.04)',
                    borderLeft: `4px solid ${a.borderColor}`, borderRadius: 6, padding: '10px 14px',
                  }}
                >
                  <span style={{ fontSize: 12, color: colors.text }}>{a.icon} {a.message}</span>
                  {a.action && (
                    <span
                      onClick={() => { if (a.nav) navigate(a.nav); }}
                      style={{ fontSize: 11, fontWeight: 600, color: colors.gold, cursor: a.nav ? 'pointer' : 'default', whiteSpace: 'nowrap', marginLeft: 12 }}
                    >
                      {a.action}
                    </span>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Observability;
