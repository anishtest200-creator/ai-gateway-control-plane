import { useState } from 'react'
import type { CSSProperties } from 'react'
import { useNavigate } from 'react-router-dom'

/* ── colour tokens ─────────────────────────────────────────────── */
const colors = {
  bg: '#0A0A0A',
  card: '#161616',
  border: 'rgba(129, 140, 248, 0.10)',
  text: '#E8E8E8',
  textMuted: '#999',
  textDim: '#666',
  green: '#4ADE80',
  amber: '#F59E0B',
  red: '#EF4444',
  blue: '#60A5FA',
  gold: '#818CF8',
  goldDim: '#6366F1',
  goldMuted: 'rgba(129, 140, 248, 0.15)',
  purple: '#A78BFA',
  cyan: '#22D3EE',
}

const card: CSSProperties = {
  backgroundColor: colors.card,
  border: `1px solid ${colors.border}`,
  borderRadius: 8,
  padding: 16,
  boxShadow: '0 2px 8px rgba(0,0,0,0.35), 0 1px 3px rgba(0,0,0,0.25)',
}

/* ── helpers ────────────────────────────────────────────────────── */
function formatNumber(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`
  return n.toLocaleString()
}

/* ── mock data ─────────────────────────────────────────────────── */
const gatewayHealth = {
  status: 'healthy' as const,
  uptime: 99.97,
  requestsToday: 1_247_000,
  tokensToday: 42_800_000,
  avgLatency: 47,
  errorRate: 0.12,
  activeModels: 14,
  activePolicies: 23,
  costToday: 829.63,
  alertCount: 3,
  providers: [
    { name: 'Azure OpenAI', status: 'healthy', latency: 42 },
    { name: 'Anthropic', status: 'healthy', latency: 51 },
    { name: 'Google Vertex', status: 'healthy', latency: 38 },
    { name: 'AWS Bedrock', status: 'degraded', latency: 127 },
  ],
}

interface QuickLink { label: string; desc: string; icon: string; route: string; accent: string }
const quickLinks: QuickLink[] = [
  { label: 'Test Console', desc: 'Test models and routing rules live', icon: '🧪', route: '/test-console', accent: colors.purple },
  { label: 'Assets', desc: 'Browse models, tools, and agents', icon: '📦', route: '/assets', accent: colors.blue },
  { label: 'Routing', desc: 'Configure load balancing and fallbacks', icon: '🔀', route: '/routing', accent: colors.cyan },
  { label: 'Credentials', desc: 'Manage API keys and secrets', icon: '🔑', route: '/credentials', accent: colors.amber },
  { label: 'Metrics', desc: 'View traffic, cost, and budgets', icon: '📊', route: '/observability', accent: colors.green },
  { label: 'Audit Log', desc: 'Full request and response history', icon: '📋', route: '/logs', accent: colors.gold },
]

interface ActionItem { id: string; severity: 'critical' | 'warning' | 'info'; icon: string; message: string; action: string; route: string }
const actionItems: ActionItem[] = [
  { id: 'a1', severity: 'critical', icon: '🔑', message: '2 credentials expired — 3 more expiring within 7 days', action: 'Rotate now', route: '/credentials' },
  { id: 'a2', severity: 'critical', icon: '🛑', message: 'customer-support-ai exceeded monthly budget by 13%', action: 'Review', route: '/namespaces' },
  { id: 'a3', severity: 'warning', icon: '⚠️', message: '4 assets without governance policies attached', action: 'Configure', route: '/assets' },
  { id: 'a4', severity: 'warning', icon: '📈', message: 'data-pipeline-svc usage up 340% vs 7-day average', action: 'Investigate', route: '/logs' },
  { id: 'a5', severity: 'warning', icon: '🔄', message: 'AWS Bedrock endpoint degraded — latency 127ms (3x normal)', action: 'Check', route: '/routing' },
  { id: 'a6', severity: 'info', icon: '📋', message: '2 pending access requests awaiting review', action: 'Review', route: '/access' },
  { id: 'a7', severity: 'info', icon: '💡', message: '78% of GPT-4o requests could use GPT-4o-mini (est. savings: $420/mo)', action: 'Optimize', route: '/routing' },
]

interface TimelineEvent { time: string; icon: string; color: string; desc: string; route: string }
const recentActivity: TimelineEvent[] = [
  { time: '2m ago', icon: '📡', color: colors.green, desc: '1.2M requests processed — all systems healthy', route: '/observability' },
  { time: '12m ago', icon: '🛡', color: colors.red, desc: 'Rate limit triggered — finance-analytics namespace', route: '/logs' },
  { time: '28m ago', icon: '⚠️', color: colors.amber, desc: 'PII detected and redacted in customer-support-ai', route: '/logs' },
  { time: '45m ago', icon: '✅', color: colors.green, desc: 'Access approved: sarah.chen → ml-inference namespace', route: '/access' },
  { time: '1h ago', icon: '🔀', color: colors.cyan, desc: 'Backup activated — Azure OpenAI East US → West US', route: '/routing' },
  { time: '1.5h ago', icon: '🔑', color: colors.purple, desc: 'Azure OpenAI API Key rotated in ai-platform namespace', route: '/credentials' },
  { time: '2h ago', icon: '🛡', color: colors.red, desc: 'Prompt injection detected and blocked on support-bot', route: '/logs' },
  { time: '3h ago', icon: '💰', color: colors.amber, desc: 'ml-inference namespace at 80% of monthly budget', route: '/observability' },
]

interface ModelMetric { name: string; provider: string; requests: number; latency: number; cost: number; providerColor: string }
const topModels: ModelMetric[] = [
  { name: 'GPT-4o-mini', provider: 'Azure OpenAI', requests: 42310, latency: 680, cost: 112.77, providerColor: '#4F6BED' },
  { name: 'GPT-4o', provider: 'Azure OpenAI', requests: 18420, latency: 1240, cost: 289.35, providerColor: '#4F6BED' },
  { name: 'Claude 3 Haiku', provider: 'Anthropic', requests: 31200, latency: 340, cost: 58.50, providerColor: '#D4875E' },
  { name: 'Claude 3.5 Sonnet', provider: 'Anthropic', requests: 12840, latency: 1580, cost: 241.00, providerColor: '#D4875E' },
  { name: 'Gemini 1.5 Pro', provider: 'Google', requests: 9150, latency: 920, cost: 85.26, providerColor: '#34A853' },
]

/* ── component ─────────────────────────────────────────────────── */
export default function GovernanceDashboard() {
  const navigate = useNavigate()
  const [hoveredEvent, setHoveredEvent] = useState<number | null>(null)
  const [hoveredAction, setHoveredAction] = useState<string | null>(null)

  const severityColor: Record<string, string> = { critical: colors.red, warning: colors.amber, info: colors.blue }

  return (
    <div style={{ padding: 24 }}>

      {/* ═══════════════════════════════════════════════════════════ */}
      {/* 1. QUICK START                                              */}
      {/* ═══════════════════════════════════════════════════════════ */}
      <div style={{ marginBottom: 24 }}>
        <div style={{ display: 'flex', gap: 8 }}>
          {quickLinks.map(ql => (
            <button
              key={ql.label}
              onClick={() => navigate(ql.route)}
              style={{
                flex: 1, cursor: 'pointer', transition: 'all 0.2s',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                gap: 8, padding: '10px 12px', borderRadius: 8,
                background: 'transparent',
                border: `1.5px solid ${colors.gold}50`,
                color: colors.gold,
                fontSize: 13, fontWeight: 600, fontFamily: 'inherit',
                letterSpacing: 0.2,
              }}
              onMouseEnter={e => {
                e.currentTarget.style.background = colors.gold
                e.currentTarget.style.color = '#FFFFFF'
                e.currentTarget.style.borderColor = colors.gold
                e.currentTarget.style.transform = 'translateY(-1px)'
                e.currentTarget.style.boxShadow = `0 4px 16px ${colors.gold}40`
              }}
              onMouseLeave={e => {
                e.currentTarget.style.background = 'transparent'
                e.currentTarget.style.color = colors.gold
                e.currentTarget.style.borderColor = `${colors.gold}50`
                e.currentTarget.style.transform = 'none'
                e.currentTarget.style.boxShadow = 'none'
              }}
            >
              <span style={{ fontSize: 16 }}>{ql.icon}</span>
              {ql.label}
            </button>
          ))}
        </div>
      </div>

      {/* ═══════════════════════════════════════════════════════════ */}
      {/* 2. GATEWAY HEALTH HERO                                      */}
      {/* ═══════════════════════════════════════════════════════════ */}
      <div style={{ ...card, padding: 20, marginBottom: 16, display: 'flex', alignItems: 'center', gap: 20 }}>
        {/* Status indicator */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexShrink: 0 }}>
          <div style={{
            width: 48, height: 48, borderRadius: 12,
            backgroundColor: 'rgba(74,222,128,0.12)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <div style={{
              width: 16, height: 16, borderRadius: '50%', backgroundColor: colors.green,
              boxShadow: `0 0 12px ${colors.green}80`,
              animation: 'pulse 2s ease-in-out infinite',
            }} />
          </div>
          <div>
            <div style={{ fontSize: 16, fontWeight: 700, color: '#fff' }}>Gateway Healthy</div>
            <div style={{ fontSize: 12, color: colors.textMuted }}>{gatewayHealth.uptime}% uptime · all providers operational</div>
          </div>
        </div>

        {/* Divider */}
        <div style={{ width: 1, height: 40, backgroundColor: colors.border, flexShrink: 0 }} />

        {/* Provider status pills */}
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          {gatewayHealth.providers.map(p => {
            const isHealthy = p.status === 'healthy'
            return (
              <div key={p.name} style={{
                display: 'flex', alignItems: 'center', gap: 6,
                padding: '4px 10px', borderRadius: 6,
                backgroundColor: isHealthy ? 'rgba(74,222,128,0.08)' : 'rgba(245,158,11,0.08)',
                border: `1px solid ${isHealthy ? 'rgba(74,222,128,0.15)' : 'rgba(245,158,11,0.15)'}`,
              }}>
                <div style={{
                  width: 6, height: 6, borderRadius: '50%',
                  backgroundColor: isHealthy ? colors.green : colors.amber,
                }} />
                <span style={{ fontSize: 11, fontWeight: 600, color: isHealthy ? colors.green : colors.amber }}>{p.name}</span>
                <span style={{ fontSize: 10, color: colors.textDim }}>{p.latency}ms</span>
              </div>
            )
          })}
        </div>
      </div>

      {/* ═══════════════════════════════════════════════════════════ */}
      {/* 3. KEY METRICS ROW                                          */}
      {/* ═══════════════════════════════════════════════════════════ */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: 10, marginBottom: 20 }}>
        {[
          { label: 'Requests (24h)', value: formatNumber(gatewayHealth.requestsToday), accent: colors.green, route: '/observability' },
          { label: 'Tokens Processed', value: formatNumber(gatewayHealth.tokensToday), accent: colors.blue, route: '/observability' },
          { label: 'Active Models', value: String(gatewayHealth.activeModels), accent: colors.purple, route: '/assets' },
          { label: 'Active Policies', value: String(gatewayHealth.activePolicies), accent: colors.gold, route: '/policies' },
          { label: 'Cost Today', value: `$${gatewayHealth.costToday.toFixed(0)}`, accent: colors.cyan, route: '/observability' },
          { label: 'Alerts', value: String(gatewayHealth.alertCount), accent: gatewayHealth.alertCount > 0 ? colors.red : colors.green, route: '/logs' },
        ].map(m => (
          <div
            key={m.label}
            onClick={() => navigate(m.route)}
            style={{
              ...card, cursor: 'pointer', transition: 'all 0.15s',
              display: 'flex', flexDirection: 'column', gap: 4,
            }}
            onMouseEnter={e => { e.currentTarget.style.borderColor = m.accent }}
            onMouseLeave={e => { e.currentTarget.style.borderColor = colors.border }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <span style={{ width: 8, height: 8, borderRadius: '50%', backgroundColor: m.accent, display: 'inline-block', flexShrink: 0 }} />
              <span style={{ color: colors.textMuted, fontSize: 11 }}>{m.label}</span>
            </div>
            <span style={{ color: '#fff', fontSize: 24, fontWeight: 700, lineHeight: 1.1 }}>{m.value}</span>
          </div>
        ))}
      </div>

      {/* ═══════════════════════════════════════════════════════════ */}
      {/* 4. TWO-COLUMN: ATTENTION NEEDED + RECENT ACTIVITY           */}
      {/* ═══════════════════════════════════════════════════════════ */}
      <div style={{ display: 'flex', gap: 16, marginBottom: 20 }}>

        {/* LEFT — Attention Needed (55%) */}
        <div style={{ flex: '0 0 55%' }}>
          <div style={{ fontSize: 15, fontWeight: 600, color: colors.text, marginBottom: 10, display: 'flex', alignItems: 'center', gap: 8 }}>
            Attention Needed
            <span style={{
              fontSize: 11, fontWeight: 700, backgroundColor: colors.red, color: '#fff',
              borderRadius: 10, padding: '1px 8px',
            }}>
              {actionItems.filter(a => a.severity === 'critical').length}
            </span>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {actionItems.map(item => {
              const isHov = hoveredAction === item.id
              return (
                <div
                  key={item.id}
                  onClick={() => navigate(item.route)}
                  onMouseEnter={() => setHoveredAction(item.id)}
                  onMouseLeave={() => setHoveredAction(null)}
                  style={{
                    ...card, display: 'flex', alignItems: 'center', gap: 10,
                    borderLeft: `3px solid ${severityColor[item.severity]}`,
                    cursor: 'pointer', padding: '10px 14px',
                    backgroundColor: isHov ? '#1A1A1A' : colors.card,
                    transition: 'background-color 0.15s',
                  }}
                >
                  <span style={{ fontSize: 16, flexShrink: 0 }}>{item.icon}</span>
                  <span style={{ flex: 1, fontSize: 12, color: colors.text, lineHeight: 1.4 }}>{item.message}</span>
                  <span style={{
                    fontSize: 11, fontWeight: 600, color: severityColor[item.severity],
                    whiteSpace: 'nowrap', flexShrink: 0,
                  }}>
                    {item.action} →
                  </span>
                </div>
              )
            })}
          </div>
        </div>

        {/* RIGHT — Recent Activity (45%) */}
        <div style={{ flex: '0 0 calc(45% - 16px)' }}>
          <div style={{ fontSize: 15, fontWeight: 600, color: colors.text, marginBottom: 10 }}>
            Recent Activity
          </div>
          <div style={{ ...card, padding: 0 }}>
            {recentActivity.map((ev, i) => (
              <div
                key={i}
                onClick={() => navigate(ev.route)}
                onMouseEnter={() => setHoveredEvent(i)}
                onMouseLeave={() => setHoveredEvent(null)}
                style={{
                  display: 'flex', alignItems: 'center', gap: 10,
                  padding: '10px 14px', cursor: 'pointer',
                  backgroundColor: hoveredEvent === i ? '#1A1A1A' : 'transparent',
                  borderBottom: i < recentActivity.length - 1 ? `1px solid ${colors.border}` : 'none',
                  transition: 'background-color 0.15s',
                }}
              >
                <span style={{ fontSize: 11, color: colors.textDim, width: 52, flexShrink: 0, textAlign: 'right' }}>{ev.time}</span>
                <div style={{ width: 7, height: 7, borderRadius: '50%', backgroundColor: ev.color, flexShrink: 0 }} />
                <span style={{ flex: 1, fontSize: 12, color: colors.text, lineHeight: 1.4 }}>{ev.desc}</span>
                <span style={{ fontSize: 11, color: colors.gold, flexShrink: 0 }}>→</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ═══════════════════════════════════════════════════════════ */}
      {/* 5. TOP MODELS PERFORMANCE TABLE                             */}
      {/* ═══════════════════════════════════════════════════════════ */}
      <div style={{ fontSize: 15, fontWeight: 600, color: colors.text, marginBottom: 10 }}>
        Top Models
      </div>
      <div style={{ ...card, padding: 0 }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr>
              {['Model', 'Provider', 'Requests (24h)', 'Avg Latency', 'Cost (24h)', ''].map(h => (
                <th key={h} style={{
                  textAlign: h === 'Model' || h === 'Provider' || h === '' ? 'left' : 'right',
                  padding: '10px 14px', fontSize: 11, fontWeight: 600, color: colors.textMuted,
                  borderBottom: `1px solid ${colors.border}`,
                }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {topModels.map((m, i) => (
              <tr
                key={m.name}
                onClick={() => navigate('/observability')}
                style={{ cursor: 'pointer', transition: 'background-color 0.15s' }}
                onMouseEnter={e => { (e.currentTarget as HTMLTableRowElement).style.backgroundColor = '#1A1A1A' }}
                onMouseLeave={e => { (e.currentTarget as HTMLTableRowElement).style.backgroundColor = 'transparent' }}
              >
                <td style={{ padding: '10px 14px', fontWeight: 600, color: '#fff', fontSize: 13, borderBottom: i < topModels.length - 1 ? `1px solid ${colors.border}` : 'none' }}>
                  {m.name}
                </td>
                <td style={{ padding: '10px 14px', borderBottom: i < topModels.length - 1 ? `1px solid ${colors.border}` : 'none' }}>
                  <span style={{
                    fontSize: 10, fontWeight: 600, color: m.providerColor,
                    backgroundColor: `${m.providerColor}1a`, padding: '2px 8px', borderRadius: 4,
                  }}>{m.provider}</span>
                </td>
                <td style={{ padding: '10px 14px', textAlign: 'right', fontFamily: 'monospace', fontSize: 13, color: colors.text, borderBottom: i < topModels.length - 1 ? `1px solid ${colors.border}` : 'none' }}>
                  {formatNumber(m.requests)}
                </td>
                <td style={{ padding: '10px 14px', textAlign: 'right', fontSize: 13, borderBottom: i < topModels.length - 1 ? `1px solid ${colors.border}` : 'none' }}>
                  <span style={{ color: m.latency > 1200 ? colors.amber : colors.green, fontWeight: 600 }}>
                    {m.latency >= 1000 ? `${(m.latency / 1000).toFixed(1)}s` : `${m.latency}ms`}
                  </span>
                </td>
                <td style={{ padding: '10px 14px', textAlign: 'right', fontFamily: 'monospace', fontSize: 13, fontWeight: 600, color: '#fff', borderBottom: i < topModels.length - 1 ? `1px solid ${colors.border}` : 'none' }}>
                  ${m.cost.toFixed(2)}
                </td>
                <td style={{ padding: '10px 14px', textAlign: 'left', borderBottom: i < topModels.length - 1 ? `1px solid ${colors.border}` : 'none' }}>
                  <span style={{ fontSize: 11, color: colors.gold, fontWeight: 600 }}>View →</span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
