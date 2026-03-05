import { useState } from 'react'
import type { CSSProperties } from 'react'
import { useNavigate } from 'react-router-dom'

/* ── colour tokens ─────────────────────────────────────────────── */
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
  cyan: '#22D3EE',
}

/* ── shared styles ─────────────────────────────────────────────── */
const card: CSSProperties = {
  backgroundColor: colors.card,
  border: `1px solid ${colors.border}`,
  borderRadius: 8,
  padding: 16,
}
const page: CSSProperties = {
  backgroundColor: colors.bg, color: colors.text, minHeight: '100vh',
  padding: '24px 32px', fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
}
const sectionTitle: CSSProperties = { fontSize: 18, fontWeight: 600, margin: '28px 0 6px' }
const sectionSub: CSSProperties = { fontSize: 13, color: colors.textMuted, marginBottom: 16 }

/* ── mock data ─────────────────────────────────────────────────── */
const subMetrics = {
  assetCoverage:      { current: 36, total: 44 },
  credentialHealth:   { current: 41, total: 47 },
  policyCoverage:     92,
  consumerCompliance: { current: 8, total: 10 },
}
const pct = (c: number, t: number) => Math.round((c / t) * 100)
const governanceScore = Math.round(
  (pct(subMetrics.assetCoverage.current, subMetrics.assetCoverage.total) +
   pct(subMetrics.credentialHealth.current, subMetrics.credentialHealth.total) +
   subMetrics.policyCoverage +
   pct(subMetrics.consumerCompliance.current, subMetrics.consumerCompliance.total)) / 4,
)

const scoreColor = (s: number) => s > 80 ? colors.green : s >= 60 ? colors.amber : colors.red

interface Alert { color: string; icon: string; message: string; route: string }
const alerts: Alert[] = [
  { color: colors.red, icon: '🔴', message: '2 credentials expired — 3 more expiring within 7 days', route: '/credentials' },
  { color: colors.amber, icon: '🟡', message: '4 assets without governance policies', route: '/assets' },
  { color: colors.amber, icon: '🟡', message: '2 pending access requests awaiting review', route: '/access' },
]

type PolicyStatus = 'enabled' | 'disabled' | 'none'
const policyCategories = ['Authentication', 'Rate Limits', 'Content Safety', 'Routing', 'Agent Execution', 'Credential Scope'] as const
const assetTypes = ['Models', 'Tools', 'MCP Servers', 'Agents'] as const
const heatmapData: Record<string, Record<string, { status: PolicyStatus; count: number }>> = {
  Authentication:    { Models: { status: 'enabled', count: 12 }, Tools: { status: 'enabled', count: 8 }, 'MCP Servers': { status: 'enabled', count: 5 }, Agents: { status: 'enabled', count: 3 } },
  'Rate Limits':     { Models: { status: 'enabled', count: 10 }, Tools: { status: 'enabled', count: 6 }, 'MCP Servers': { status: 'disabled', count: 2 }, Agents: { status: 'enabled', count: 4 } },
  'Content Safety':  { Models: { status: 'enabled', count: 9 }, Tools: { status: 'none', count: 0 }, 'MCP Servers': { status: 'none', count: 0 }, Agents: { status: 'disabled', count: 1 } },
  Routing:           { Models: { status: 'enabled', count: 7 }, Tools: { status: 'enabled', count: 5 }, 'MCP Servers': { status: 'enabled', count: 4 }, Agents: { status: 'none', count: 0 } },
  'Agent Execution': { Models: { status: 'none', count: 0 }, Tools: { status: 'disabled', count: 1 }, 'MCP Servers': { status: 'none', count: 0 }, Agents: { status: 'enabled', count: 6 } },
  'Credential Scope':{ Models: { status: 'enabled', count: 8 }, Tools: { status: 'enabled', count: 7 }, 'MCP Servers': { status: 'enabled', count: 5 }, Agents: { status: 'disabled', count: 2 } },
}

interface TimelineEvent { time: string; icon: string; color: string; description: string; route: string }
const timelineEvents: TimelineEvent[] = [
  { time: '12m ago', icon: '🛡', color: colors.red,    description: 'Rate limit exceeded for data-pipeline-svc on GPT-4o', route: '/logs' },
  { time: '28m ago', icon: '⚠️', color: colors.amber,  description: 'PII detected and redacted in customer-support-ai request', route: '/logs' },
  { time: '45m ago', icon: '✅', color: colors.green,  description: 'Access approved: sarah.chen → ml-inference namespace', route: '/access' },
  { time: '1h ago',  icon: '📋', color: colors.blue,   description: 'Token quota policy updated: 5M → 8M daily for research-sandbox', route: '/policies' },
  { time: '1.5h ago',icon: '🔑', color: colors.purple, description: 'Azure OpenAI API Key rotated in ai-platform namespace', route: '/credentials' },
  { time: '2h ago',  icon: '🛡', color: colors.red,    description: 'Unauthorized model access attempt blocked for intern-bot', route: '/logs' },
  { time: '3h ago',  icon: '🏢', color: colors.cyan,   description: 'New namespace created: finance-analytics (production)', route: '/namespaces' },
  { time: '4h ago',  icon: '✅', color: colors.green,  description: 'Access approved: dev-team → staging-models namespace', route: '/access' },
  { time: '5h ago',  icon: '📋', color: colors.blue,   description: 'Content safety guardrail added to customer-facing agents', route: '/policies' },
  { time: '8h ago',  icon: '⚠️', color: colors.amber,  description: 'Prompt injection attempt detected and blocked on support-bot', route: '/logs' },
  { time: '14h ago', icon: '🔑', color: colors.purple, description: 'Service principal credential renewed for ci-cd-pipeline', route: '/credentials' },
  { time: '22h ago', icon: '🏢', color: colors.cyan,   description: 'Namespace policy inheritance updated for research-sandbox', route: '/namespaces' },
]

interface Namespace { name: string; env: 'production' | 'dev' | 'sandbox'; score: number; assets: number; members: number }
const namespaces: Namespace[] = [
  { name: 'ai-platform',        env: 'production', score: 95, assets: 12, members: 8 },
  { name: 'ml-inference',        env: 'production', score: 88, assets: 9,  members: 6 },
  { name: 'customer-support-ai', env: 'production', score: 78, assets: 7,  members: 5 },
  { name: 'research-sandbox',    env: 'sandbox',    score: 62, assets: 8,  members: 12 },
  { name: 'dev-experiments',     env: 'dev',        score: 45, assets: 5,  members: 4 },
  { name: 'finance-analytics',   env: 'production', score: 71, assets: 3,  members: 3 },
]

interface UngovernedAsset { name: string; type: string; source: string; missing: string }
const ungovernedAssets: UngovernedAsset[] = [
  { name: 'gpt-4o-dev-mirror',   type: 'Model',      source: 'Azure OpenAI',   missing: 'No rate limit, No content safety' },
  { name: 'web-scraper-tool',    type: 'Tool',        source: 'Custom',         missing: 'No authentication, No rate limit' },
  { name: 'legacy-search-mcp',   type: 'MCP Server',  source: 'Internal',       missing: 'No safety guardrail, No credential scope' },
  { name: 'experiment-agent-v2', type: 'Agent',       source: 'LangChain',      missing: 'No rate limit, No safety guardrail' },
]

interface QuickAction { label: string; count?: number; icon: string; route: string }
const quickActions: QuickAction[] = [
  { label: 'Review Pending Approvals', count: 2, icon: '📋', route: '/policies' },
  { label: 'Rotate Expiring Credentials', count: 3, icon: '🔑', route: '/credentials' },
  { label: 'Configure Ungoverned Assets', count: 4, icon: '⚙️', route: '/assets' },
  { label: 'Run Compliance Check', icon: '🔍', route: '/compliance' },
]

/* ── helpers ────────────────────────────────────────────────────── */
const envColor: Record<string, string> = { production: colors.green, dev: colors.blue, sandbox: colors.amber }

function ProgressBar({ value, color, height = 6 }: { value: number; color: string; height?: number }) {
  return (
    <div style={{ width: '100%', height, backgroundColor: 'rgba(212, 168, 67, 0.06)', borderRadius: height / 2 }}>
      <div style={{ width: `${Math.min(value, 100)}%`, height: '100%', backgroundColor: color, borderRadius: height / 2, transition: 'width .4s ease' }} />
    </div>
  )
}

/* ── component ─────────────────────────────────────────────────── */
export default function GovernanceDashboard() {
  const navigate = useNavigate()
  const [hoveredEvent, setHoveredEvent] = useState<number | null>(null)
  const [hoveredCell, setHoveredCell] = useState<string | null>(null)

  /* SVG ring params */
  const ringRadius = 62
  const ringStroke = 10
  const ringCircumference = 2 * Math.PI * ringRadius
  const ringOffset = ringCircumference - (governanceScore / 100) * ringCircumference

  return (
    <div style={page}>
      {/* ── 1. Governance Score Hero ────────────────────────── */}
      <div style={{ ...card, display: 'flex', alignItems: 'center', gap: 40, padding: 28, marginBottom: 20 }}>
        {/* ring */}
        <div style={{ position: 'relative', flexShrink: 0 }}>
          <svg width={150} height={150} viewBox="0 0 150 150">
            <circle cx={75} cy={75} r={ringRadius} fill="none" stroke="rgba(212, 168, 67, 0.06)" strokeWidth={ringStroke} />
            <circle
              cx={75} cy={75} r={ringRadius} fill="none"
              stroke={colors.gold} strokeWidth={ringStroke}
              strokeLinecap="round"
              strokeDasharray={ringCircumference}
              strokeDashoffset={ringOffset}
              transform="rotate(-90 75 75)"
              style={{ transition: 'stroke-dashoffset .6s ease' }}
            />
          </svg>
          <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
            <span style={{ fontSize: 36, fontWeight: 700, color: colors.gold }}>{governanceScore}</span>
            <span style={{ fontSize: 12, color: colors.textMuted }}>/100</span>
          </div>
        </div>

        {/* label */}
        <div style={{ flex: '0 0 200px' }}>
          <div style={{ fontSize: 22, fontWeight: 700, marginBottom: 6 }}>Governance Score</div>
          <div style={{ fontSize: 13, color: colors.textMuted, lineHeight: 1.5 }}>
            Based on asset coverage, credential health, policy enforcement, and consumer compliance
          </div>
        </div>

        {/* mini metric cards */}
        <div style={{ display: 'flex', gap: 14, flex: 1, flexWrap: 'wrap' }}>
          {([
            { label: 'Asset Coverage', cur: subMetrics.assetCoverage.current, tot: subMetrics.assetCoverage.total, route: '/assets' },
            { label: 'Credential Health', cur: subMetrics.credentialHealth.current, tot: subMetrics.credentialHealth.total, route: '/credentials' },
            { label: 'Policy Coverage', cur: subMetrics.policyCoverage, tot: 100, route: '/policies' },
            { label: 'Consumer Compliance', cur: subMetrics.consumerCompliance.current, tot: subMetrics.consumerCompliance.total, route: '/access' },
          ] as const).map((m) => {
            const p = pct(m.cur, m.tot)
            return (
              <div
                key={m.label}
                onClick={() => navigate(m.route)}
                style={{ ...card, flex: '1 1 140px', cursor: 'pointer', minWidth: 140, transition: 'border-color .2s' }}
                onMouseEnter={e => (e.currentTarget.style.borderColor = colors.gold)}
                onMouseLeave={e => (e.currentTarget.style.borderColor = colors.border)}
              >
                <div style={{ fontSize: 12, color: colors.textMuted, marginBottom: 6 }}>{m.label}</div>
                <div style={{ fontSize: 22, fontWeight: 700 }}>
                  {m.label === 'Policy Coverage' ? `${m.cur}%` : `${m.cur}/${m.tot}`}
                  {m.label !== 'Policy Coverage' && <span style={{ fontSize: 13, color: colors.textMuted, marginLeft: 6 }}>({p}%)</span>}
                </div>
                <div style={{ marginTop: 8 }}>
                  <ProgressBar value={p} color={scoreColor(p)} />
                </div>
                <div style={{ width: 8, height: 8, borderRadius: '50%', backgroundColor: scoreColor(p), marginTop: 8 }} />
              </div>
            )
          })}
        </div>
      </div>

      {/* ── 2. Critical Alerts Bar ─────────────────────────── */}
      <div style={{ display: 'flex', gap: 14, marginBottom: 24 }}>
        {alerts.map((a, i) => (
          <div
            key={i}
            onClick={() => navigate(a.route)}
            style={{
              ...card, flex: 1, display: 'flex', alignItems: 'center', gap: 12,
              borderLeft: `4px solid ${a.color}`, cursor: 'pointer', transition: 'background-color .2s',
            }}
            onMouseEnter={e => (e.currentTarget.style.backgroundColor = '#1A1A1A')}
            onMouseLeave={e => (e.currentTarget.style.backgroundColor = colors.card)}
          >
            <span style={{ fontSize: 18 }}>{a.icon}</span>
            <span style={{ flex: 1, fontSize: 13, lineHeight: 1.45 }}>{a.message}</span>
            <span style={{ fontSize: 13, color: colors.gold, whiteSpace: 'nowrap' }}>View →</span>
          </div>
        ))}
      </div>

      {/* ── 3. Policy Coverage Heatmap ─────────────────────── */}
      <div style={sectionTitle}>Policy Coverage Matrix</div>
      <div style={sectionSub}>Which asset types have which governance controls</div>
      <div style={{ ...card, overflowX: 'auto', marginBottom: 28 }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
          <thead>
            <tr>
              <th style={{ textAlign: 'left', padding: '8px 12px', color: colors.textMuted, fontWeight: 500, borderBottom: `1px solid ${colors.border}` }} />
              {assetTypes.map(at => (
                <th key={at} style={{ textAlign: 'center', padding: '8px 12px', color: colors.textMuted, fontWeight: 500, borderBottom: `1px solid ${colors.border}` }}>{at}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {policyCategories.map(cat => (
              <tr key={cat}>
                <td style={{ padding: '10px 12px', fontWeight: 500, borderBottom: `1px solid ${colors.border}` }}>{cat}</td>
                {assetTypes.map(at => {
                  const cell = heatmapData[cat][at]
                  const cellKey = `${cat}-${at}`
                  const bg = cell.status === 'enabled' ? colors.green : cell.status === 'disabled' ? colors.amber : 'rgba(212, 168, 67, 0.06)'
                  const isHovered = hoveredCell === cellKey
                  return (
                    <td
                      key={at}
                      onClick={() => navigate('/policies')}
                      onMouseEnter={() => setHoveredCell(cellKey)}
                      onMouseLeave={() => setHoveredCell(null)}
                      style={{
                        textAlign: 'center', padding: '10px 12px', cursor: 'pointer',
                        borderBottom: `1px solid ${colors.border}`,
                      }}
                    >
                      <div style={{
                        display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                        width: 42, height: 28, borderRadius: 6,
                        backgroundColor: isHovered ? `${bg}cc` : `${bg}88`,
                        color: cell.status === 'none' ? colors.textDim : '#fff',
                        fontSize: 12, fontWeight: 600, transition: 'background-color .15s',
                      }}>
                        {cell.count}
                      </div>
                    </td>
                  )
                })}
              </tr>
            ))}
          </tbody>
        </table>

        {/* legend */}
        <div style={{ display: 'flex', gap: 20, marginTop: 12, paddingTop: 10, borderTop: `1px solid ${colors.border}` }}>
          {[
            { label: 'Enabled', color: colors.green },
            { label: 'Disabled', color: colors.amber },
            { label: 'No policy', color: 'rgba(212, 168, 67, 0.06)' },
          ].map(l => (
            <div key={l.label} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: colors.textMuted }}>
              <div style={{ width: 14, height: 14, borderRadius: 4, backgroundColor: l.color }} />
              {l.label}
            </div>
          ))}
        </div>
      </div>

      {/* ── 4. Two-Column Layout ───────────────────────────── */}
      <div style={{ display: 'flex', gap: 20, marginBottom: 28 }}>

        {/* LEFT — Timeline (60%) */}
        <div style={{ flex: '0 0 60%' }}>
          <div style={sectionTitle}>Governance Activity Timeline</div>
          <div style={sectionSub}>Last 24 hours</div>
          <div style={{ ...card, padding: 0 }}>
            {timelineEvents.map((ev, i) => (
              <div
                key={i}
                onClick={() => navigate(ev.route)}
                onMouseEnter={() => setHoveredEvent(i)}
                onMouseLeave={() => setHoveredEvent(null)}
                style={{
                  display: 'flex', alignItems: 'center', gap: 12,
                  padding: '12px 16px', cursor: 'pointer',
                  backgroundColor: hoveredEvent === i ? '#1A1A1A' : 'transparent',
                  borderBottom: i < timelineEvents.length - 1 ? `1px solid ${colors.border}` : 'none',
                  transition: 'background-color .15s',
                }}
              >
                <span style={{ fontSize: 12, color: colors.textDim, width: 60, flexShrink: 0, textAlign: 'right' }}>{ev.time}</span>
                <span style={{ fontSize: 16 }}>{ev.icon}</span>
                <div style={{ width: 8, height: 8, borderRadius: '50%', backgroundColor: ev.color, flexShrink: 0 }} />
                <span style={{ flex: 1, fontSize: 13, lineHeight: 1.4 }}>{ev.description}</span>
                <span style={{ fontSize: 12, color: colors.gold, flexShrink: 0 }}>→</span>
              </div>
            ))}
          </div>
        </div>

        {/* RIGHT — Namespace Health + Ungoverned Assets (40%) */}
        <div style={{ flex: '0 0 calc(40% - 20px)' }}>
          {/* Namespace Health */}
          <div style={sectionTitle}>Namespace Health Summary</div>
          <div style={sectionSub}>Governance posture by namespace</div>
          <div style={{ ...card, padding: 0, marginBottom: 20 }}>
            {namespaces.map((ns, i) => (
              <div
                key={ns.name}
                onClick={() => navigate('/namespaces')}
                style={{
                  display: 'flex', alignItems: 'center', gap: 12, padding: '12px 16px', cursor: 'pointer',
                  borderBottom: i < namespaces.length - 1 ? `1px solid ${colors.border}` : 'none',
                  transition: 'background-color .15s',
                }}
                onMouseEnter={e => (e.currentTarget.style.backgroundColor = '#1A1A1A')}
                onMouseLeave={e => (e.currentTarget.style.backgroundColor = 'transparent')}
              >
                <div style={{ width: 8, height: 8, borderRadius: '50%', backgroundColor: scoreColor(ns.score), flexShrink: 0 }} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                    <span style={{ fontSize: 13, fontWeight: 600 }}>{ns.name}</span>
                    <span style={{
                      fontSize: 10, padding: '1px 6px', borderRadius: 4, fontWeight: 600,
                      backgroundColor: `${envColor[ns.env]}22`, color: envColor[ns.env],
                    }}>{ns.env}</span>
                  </div>
                  <ProgressBar value={ns.score} color={scoreColor(ns.score)} height={4} />
                </div>
                <div style={{ textAlign: 'right', flexShrink: 0 }}>
                  <div style={{ fontSize: 14, fontWeight: 700 }}>{ns.score}%</div>
                  <div style={{ fontSize: 11, color: colors.textDim }}>{ns.assets} assets · {ns.members} members</div>
                </div>
              </div>
            ))}
          </div>

          {/* Top Ungoverned Assets */}
          <div style={sectionTitle}>Top Ungoverned Assets</div>
          <div style={sectionSub}>Assets missing governance controls</div>
          <div style={{ ...card, padding: 0 }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
              <thead>
                <tr>
                  {['Asset', 'Type', 'Missing', ''].map(h => (
                    <th key={h} style={{ textAlign: 'left', padding: '10px 12px', color: colors.textMuted, fontWeight: 500, borderBottom: `1px solid ${colors.border}`, fontSize: 12 }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {ungovernedAssets.map(a => (
                  <tr key={a.name}>
                    <td style={{ padding: '10px 12px', borderBottom: `1px solid ${colors.border}` }}>
                      <div style={{ fontWeight: 600 }}>{a.name}</div>
                      <div style={{ fontSize: 11, color: colors.textDim }}>{a.source}</div>
                    </td>
                    <td style={{ padding: '10px 12px', borderBottom: `1px solid ${colors.border}` }}>
                      <span style={{
                        fontSize: 11, padding: '2px 8px', borderRadius: 4, fontWeight: 600,
                        backgroundColor: colors.goldMuted, color: colors.gold,
                      }}>{a.type}</span>
                    </td>
                    <td style={{ padding: '10px 12px', borderBottom: `1px solid ${colors.border}`, color: colors.amber, fontSize: 12 }}>{a.missing}</td>
                    <td style={{ padding: '10px 12px', borderBottom: `1px solid ${colors.border}` }}>
                      <button
                        onClick={() => navigate('/policies')}
                        style={{
                          backgroundColor: colors.gold, color: '#0A0A0A', border: 'none',
                          borderRadius: 6, padding: '5px 14px', fontSize: 12, fontWeight: 600,
                          cursor: 'pointer', whiteSpace: 'nowrap',
                        }}
                      >Fix</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* ── 5. Quick Actions Bar ───────────────────────────── */}
      <div style={sectionTitle}>Quick Actions</div>
      <div style={{ display: 'flex', gap: 14, marginTop: 12 }}>
        {quickActions.map(qa => (
          <div
            key={qa.label}
            onClick={() => navigate(qa.route)}
            style={{
              ...card, flex: 1, display: 'flex', alignItems: 'center', gap: 12,
              cursor: 'pointer', transition: 'border-color .2s',
            }}
            onMouseEnter={e => (e.currentTarget.style.borderColor = colors.gold)}
            onMouseLeave={e => (e.currentTarget.style.borderColor = colors.border)}
          >
            <span style={{ fontSize: 22 }}>{qa.icon}</span>
            <span style={{ flex: 1, fontSize: 13, fontWeight: 600 }}>{qa.label}</span>
            {qa.count != null && (
              <span style={{
                backgroundColor: colors.gold, color: '#0A0A0A', borderRadius: 10,
                padding: '2px 9px', fontSize: 12, fontWeight: 700,
              }}>{qa.count}</span>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
