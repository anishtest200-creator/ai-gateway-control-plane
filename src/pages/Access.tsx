import React, { useState } from 'react'
import type { CSSProperties } from 'react'

/* ------------------------------------------------------------------ */
/*  STYLES                                                            */
/* ------------------------------------------------------------------ */

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
}

const card: CSSProperties = {
  backgroundColor: colors.card,
  border: `1px solid ${colors.border}`,
  borderRadius: 8,
  padding: 16,
  boxShadow: '0 2px 8px rgba(0,0,0,0.35), 0 1px 3px rgba(0,0,0,0.25)',
}

const badge = (bg: string, fg: string): CSSProperties => ({
  display: 'inline-block',
  padding: '2px 8px',
  borderRadius: 4,
  fontSize: 11,
  fontWeight: 600,
  backgroundColor: bg,
  color: fg,
})

const authMethodStyles: Record<string, { bg: string; color: string; label: string }> = {
  'api-key': { bg: '#3d3200', color: '#F7C948', label: 'API Key' },
  'entra-id': { bg: '#1a2d4d', color: '#818CF8', label: 'Entra ID' },
  'oauth2': { bg: '#1a3a2a', color: '#4ade80', label: 'OAuth 2.0' },
  'managed-identity': { bg: '#2d1a4d', color: '#c084fc', label: 'Managed Identity' },
}

const requestTypeStyles: Record<string, { bg: string; color: string; label: string }> = {
  'namespace-access': { bg: '#1e293b', color: '#93c5fd', label: 'Namespace Access' },
  'model-access': { bg: '#1a2d1a', color: '#86efac', label: 'Model Access' },
  'tool-access': { bg: '#2d1a4d', color: '#c084fc', label: 'Tool Access' },
  'role-change': { bg: '#3d2800', color: '#fbbf24', label: 'Role Change' },
}

const inputStyle: CSSProperties = {
  backgroundColor: '#2d2c2b',
  color: '#E8E8E8',
  border: '1px solid rgba(129, 140, 248, 0.10)',
  borderRadius: 6,
  padding: '6px 12px',
  fontSize: 13,
  fontFamily: 'inherit',
  outline: 'none',
}

const primaryBtn: CSSProperties = {
  backgroundColor: colors.gold,
  color: '#FFFFFF',
  border: 'none',
  borderRadius: 6,
  padding: '8px 18px',
  fontWeight: 600,
  fontSize: 13,
  cursor: 'pointer',
  fontFamily: 'inherit',
}

const secondaryBtn: CSSProperties = {
  backgroundColor: 'transparent',
  color: colors.textMuted,
  border: `1px solid ${colors.border}`,
  borderRadius: 6,
  padding: '6px 14px',
  fontWeight: 600,
  fontSize: 12,
  cursor: 'pointer',
  fontFamily: 'inherit',
}

/* ------------------------------------------------------------------ */
/*  TYPES                                                             */
/* ------------------------------------------------------------------ */

interface Consumer {
  id: string
  name: string
  displayName: string
  type: 'user' | 'application' | 'service-principal'
  authMethod: 'api-key' | 'entra-id' | 'oauth2' | 'managed-identity'
  email?: string
  team: string
  namespace: string
  quotas: { tokensPerMinute: number; tokensPerDay: number; requestsPerMinute: number }
  usage24h: { totalTokens: number; totalRequests: number; totalCost: number; modelsUsed: string[] }
  status: 'active' | 'suspended' | 'pending'
  lastActive: string
  createdAt: string
  apiKeyPrefix?: string
  apiKeyCreatedAt?: string
  apiKeyExpiresAt?: string
}

interface AccessRequest {
  id: string
  requesterName: string
  type: string
  requestedRole: string
  targetName: string
  targetNamespace: string
  justification: string
  status: 'pending' | 'approved' | 'denied'
  createdAt: string
  reviewedBy?: string
  reviewedAt?: string
}

interface AuditEntry {
  id: string
  timestamp: string
  actor: string
  action: string
  resource: string
  outcome: 'success' | 'failure' | 'denied'
  details: string
}

type Tab = 'users' | 'services' | 'apikeys' | 'requests' | 'audit'

/* ------------------------------------------------------------------ */
/*  MOCK DATA                                                         */
/* ------------------------------------------------------------------ */

const consumers: Consumer[] = [
  {
    id: 'u-001', name: 'jchen@contoso.com', displayName: 'Jessica Chen',
    type: 'user', authMethod: 'entra-id', email: 'jchen@contoso.com',
    team: 'Platform Engineering', namespace: 'platform',
    quotas: { tokensPerMinute: 80000, tokensPerDay: 2000000, requestsPerMinute: 60 },
    usage24h: { totalTokens: 1450000, totalRequests: 892, totalCost: 14.20, modelsUsed: ['gpt-4o', 'gpt-4o-mini'] },
    status: 'active', lastActive: '2025-01-15T10:23:00Z', createdAt: '2024-09-01T00:00:00Z',
  },
  {
    id: 'u-002', name: 'mwilson@contoso.com', displayName: 'Marcus Wilson',
    type: 'user', authMethod: 'api-key', email: 'mwilson@contoso.com',
    team: 'Data Science', namespace: 'research',
    quotas: { tokensPerMinute: 120000, tokensPerDay: 5000000, requestsPerMinute: 100 },
    usage24h: { totalTokens: 4200000, totalRequests: 2340, totalCost: 52.80, modelsUsed: ['gpt-4o', 'claude-3.5-sonnet'] },
    status: 'active', lastActive: '2025-01-15T10:45:00Z', createdAt: '2024-06-15T00:00:00Z',
    apiKeyPrefix: 'aigw_prod_7x', apiKeyCreatedAt: '2024-12-01T00:00:00Z', apiKeyExpiresAt: '2025-06-01T00:00:00Z',
  },
  {
    id: 'u-003', name: 'arobinson@contoso.com', displayName: 'Aisha Robinson',
    type: 'user', authMethod: 'oauth2', email: 'arobinson@contoso.com',
    team: 'Frontend', namespace: 'product',
    quotas: { tokensPerMinute: 40000, tokensPerDay: 1000000, requestsPerMinute: 30 },
    usage24h: { totalTokens: 320000, totalRequests: 210, totalCost: 3.10, modelsUsed: ['gpt-4o-mini'] },
    status: 'active', lastActive: '2025-01-15T09:12:00Z', createdAt: '2024-11-20T00:00:00Z',
  },
  {
    id: 'u-004', name: 'tkumar@contoso.com', displayName: 'Tarun Kumar',
    type: 'user', authMethod: 'entra-id', email: 'tkumar@contoso.com',
    team: 'Security', namespace: 'security',
    quotas: { tokensPerMinute: 60000, tokensPerDay: 1500000, requestsPerMinute: 50 },
    usage24h: { totalTokens: 0, totalRequests: 0, totalCost: 0, modelsUsed: [] },
    status: 'suspended', lastActive: '2025-01-10T16:00:00Z', createdAt: '2024-08-01T00:00:00Z',
  },
  {
    id: 's-001', name: 'copilot-proxy-prod', displayName: 'Copilot Proxy (Prod)',
    type: 'application', authMethod: 'managed-identity',
    team: 'Platform Engineering', namespace: 'platform',
    quotas: { tokensPerMinute: 500000, tokensPerDay: 20000000, requestsPerMinute: 500 },
    usage24h: { totalTokens: 18500000, totalRequests: 12400, totalCost: 185.00, modelsUsed: ['gpt-4o', 'gpt-4o-mini', 'text-embedding-3-large'] },
    status: 'active', lastActive: '2025-01-15T10:50:00Z', createdAt: '2024-04-01T00:00:00Z',
  },
  {
    id: 's-002', name: 'search-indexer-svc', displayName: 'Search Indexer Service',
    type: 'application', authMethod: 'managed-identity',
    team: 'Search', namespace: 'search',
    quotas: { tokensPerMinute: 200000, tokensPerDay: 8000000, requestsPerMinute: 200 },
    usage24h: { totalTokens: 6700000, totalRequests: 4500, totalCost: 67.00, modelsUsed: ['text-embedding-3-large', 'text-embedding-3-small'] },
    status: 'active', lastActive: '2025-01-15T10:48:00Z', createdAt: '2024-05-10T00:00:00Z',
  },
  {
    id: 's-003', name: 'chatbot-api-staging', displayName: 'Chatbot API (Staging)',
    type: 'application', authMethod: 'api-key',
    team: 'Product', namespace: 'product',
    quotas: { tokensPerMinute: 100000, tokensPerDay: 3000000, requestsPerMinute: 80 },
    usage24h: { totalTokens: 890000, totalRequests: 620, totalCost: 8.90, modelsUsed: ['gpt-4o-mini'] },
    status: 'active', lastActive: '2025-01-15T10:30:00Z', createdAt: '2024-10-01T00:00:00Z',
    apiKeyPrefix: 'aigw_stg_3k', apiKeyCreatedAt: '2024-12-15T00:00:00Z', apiKeyExpiresAt: '2025-03-15T00:00:00Z',
  },
  {
    id: 's-004', name: 'ml-pipeline-runner', displayName: 'ML Pipeline Runner',
    type: 'service-principal', authMethod: 'entra-id',
    team: 'Data Science', namespace: 'research',
    quotas: { tokensPerMinute: 300000, tokensPerDay: 15000000, requestsPerMinute: 300 },
    usage24h: { totalTokens: 12100000, totalRequests: 8200, totalCost: 145.00, modelsUsed: ['gpt-4o', 'claude-3.5-sonnet', 'gpt-4o-mini'] },
    status: 'active', lastActive: '2025-01-15T10:52:00Z', createdAt: '2024-03-15T00:00:00Z',
  },
  {
    id: 's-005', name: 'doc-processor-func', displayName: 'Document Processor',
    type: 'application', authMethod: 'managed-identity',
    team: 'Content', namespace: 'content',
    quotas: { tokensPerMinute: 150000, tokensPerDay: 5000000, requestsPerMinute: 100 },
    usage24h: { totalTokens: 2300000, totalRequests: 1100, totalCost: 23.00, modelsUsed: ['gpt-4o', 'text-embedding-3-large'] },
    status: 'active', lastActive: '2025-01-15T08:40:00Z', createdAt: '2024-07-20T00:00:00Z',
  },
  {
    id: 's-006', name: 'legacy-integration-svc', displayName: 'Legacy Integration',
    type: 'service-principal', authMethod: 'api-key',
    team: 'Infrastructure', namespace: 'infra',
    quotas: { tokensPerMinute: 50000, tokensPerDay: 1000000, requestsPerMinute: 40 },
    usage24h: { totalTokens: 0, totalRequests: 0, totalCost: 0, modelsUsed: [] },
    status: 'pending', lastActive: '2025-01-12T14:00:00Z', createdAt: '2025-01-12T00:00:00Z',
    apiKeyPrefix: 'aigw_lgcy_9m', apiKeyCreatedAt: '2025-01-12T00:00:00Z', apiKeyExpiresAt: '2025-04-12T00:00:00Z',
  },
]

const accessRequests: AccessRequest[] = [
  {
    id: 'ar-001', requesterName: 'Sarah Park', type: 'namespace-access',
    requestedRole: 'contributor', targetName: 'research', targetNamespace: 'research',
    justification: 'Need access to research namespace for the new recommendation engine project.',
    status: 'pending', createdAt: '2025-01-15T08:00:00Z',
  },
  {
    id: 'ar-002', requesterName: 'DevOps Pipeline Bot', type: 'model-access',
    requestedRole: 'consumer', targetName: 'gpt-4o-realtime', targetNamespace: 'platform',
    justification: 'Deploying real-time translation feature requiring gpt-4o-realtime model access.',
    status: 'pending', createdAt: '2025-01-14T16:30:00Z',
  },
  {
    id: 'ar-003', requesterName: 'Wei Zhang', type: 'tool-access',
    requestedRole: 'operator', targetName: 'code-interpreter', targetNamespace: 'research',
    justification: 'Data analysis workflows require code interpreter tool for automated EDA.',
    status: 'pending', createdAt: '2025-01-14T12:00:00Z',
  },
  {
    id: 'ar-004', requesterName: 'Emily Torres', type: 'namespace-access',
    requestedRole: 'viewer', targetName: 'product', targetNamespace: 'product',
    justification: 'Monitoring product namespace for QA testing observability.',
    status: 'approved', createdAt: '2025-01-13T09:00:00Z',
    reviewedBy: 'Jessica Chen', reviewedAt: '2025-01-13T11:00:00Z',
  },
  {
    id: 'ar-005', requesterName: 'Carlos Mendez', type: 'role-change',
    requestedRole: 'admin', targetName: 'platform', targetNamespace: 'platform',
    justification: 'Promoted to tech lead, need admin access for infrastructure management.',
    status: 'approved', createdAt: '2025-01-12T10:00:00Z',
    reviewedBy: 'Marcus Wilson', reviewedAt: '2025-01-12T14:00:00Z',
  },
  {
    id: 'ar-006', requesterName: 'Anonymous Bot', type: 'model-access',
    requestedRole: 'consumer', targetName: 'gpt-4o', targetNamespace: 'platform',
    justification: 'Automated request from unverified service account.',
    status: 'denied', createdAt: '2025-01-11T22:00:00Z',
    reviewedBy: 'Tarun Kumar', reviewedAt: '2025-01-12T08:00:00Z',
  },
]

const auditLog: AuditEntry[] = [
  {
    id: 'al-001', timestamp: '2025-01-15T10:50:00Z', actor: 'Jessica Chen',
    action: 'consumer.create', resource: 'legacy-integration-svc',
    outcome: 'success', details: 'Created new service principal consumer with API key authentication.',
  },
  {
    id: 'al-002', timestamp: '2025-01-15T10:30:00Z', actor: 'System',
    action: 'key.rotate', resource: 'chatbot-api-staging',
    outcome: 'success', details: 'Automatic API key rotation completed. New key prefix: aigw_stg_3k.',
  },
  {
    id: 'al-003', timestamp: '2025-01-15T09:15:00Z', actor: 'Marcus Wilson',
    action: 'request.approve', resource: 'ar-004',
    outcome: 'success', details: 'Approved namespace access request for Emily Torres to product namespace.',
  },
  {
    id: 'al-004', timestamp: '2025-01-15T08:00:00Z', actor: 'Tarun Kumar',
    action: 'consumer.suspend', resource: 'u-004',
    outcome: 'success', details: 'Suspended own account pending security review after credential leak investigation.',
  },
  {
    id: 'al-005', timestamp: '2025-01-14T23:45:00Z', actor: 'ml-pipeline-runner',
    action: 'quota.exceeded', resource: 'research namespace',
    outcome: 'failure', details: 'Token-per-minute quota exceeded (312K/300K). Requests throttled for 60s.',
  },
  {
    id: 'al-006', timestamp: '2025-01-14T22:10:00Z', actor: 'Anonymous Bot',
    action: 'auth.attempt', resource: 'platform/gpt-4o',
    outcome: 'denied', details: 'Authentication failed: invalid API key prefix. IP: 198.51.100.42.',
  },
  {
    id: 'al-007', timestamp: '2025-01-14T18:00:00Z', actor: 'System',
    action: 'key.expiry-warning', resource: 'chatbot-api-staging',
    outcome: 'success', details: 'API key expiry warning sent. Key expires in 59 days.',
  },
  {
    id: 'al-008', timestamp: '2025-01-14T14:30:00Z', actor: 'Aisha Robinson',
    action: 'consumer.update', resource: 'copilot-proxy-prod',
    outcome: 'success', details: 'Updated token-per-day quota from 15M to 20M for copilot-proxy-prod.',
  },
]

/* ------------------------------------------------------------------ */
/*  HELPERS                                                           */
/* ------------------------------------------------------------------ */

function formatTokens(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`
  return n.toString()
}

function relativeTime(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return 'just now'
  if (mins < 60) return `${mins}m ago`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return `${hrs}h ago`
  const days = Math.floor(hrs / 24)
  return `${days}d ago`
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

/* ------------------------------------------------------------------ */
/*  SUB-COMPONENTS                                                    */
/* ------------------------------------------------------------------ */

const StatCard: React.FC<{ label: string; value: number; accent: string }> = ({ label, value, accent }) => (
  <div style={{ ...card, flex: 1, display: 'flex', flexDirection: 'column', gap: 4 }}>
    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
      <span style={{ width: 8, height: 8, borderRadius: '50%', backgroundColor: accent, display: 'inline-block', flexShrink: 0 }} />
      <span style={{ color: colors.textMuted, fontSize: 12 }}>{label}</span>
    </div>
    <span style={{ color: '#fff', fontSize: 28, fontWeight: 700, lineHeight: 1.1 }}>{value}</span>
  </div>
)

const StatusBadge: React.FC<{ status: 'active' | 'suspended' | 'pending' }> = ({ status }) => {
  const m: Record<string, { bg: string; fg: string; label: string }> = {
    active: { bg: 'rgba(74,222,128,0.15)', fg: '#4ADE80', label: '✓ Active' },
    suspended: { bg: 'rgba(239,68,68,0.15)', fg: '#EF4444', label: '✗ Suspended' },
    pending: { bg: 'rgba(245,158,11,0.15)', fg: '#fbbf24', label: '⏳ Pending' },
  }
  const s = m[status]
  return <span style={badge(s.bg, s.fg)}>{s.label}</span>
}

const QuotaBar: React.FC<{ used: number; limit: number }> = ({ used, limit }) => {
  const pct = limit > 0 ? Math.min((used / limit) * 100, 100) : 0
  const barColor = pct > 80 ? '#D13438' : pct > 60 ? '#F7C948' : '#4ADE80'
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
      <div style={{ width: 100, height: 8, backgroundColor: 'rgba(129, 140, 248, 0.10)', borderRadius: 4, overflow: 'hidden' }}>
        <div style={{ width: `${pct}%`, height: '100%', backgroundColor: barColor, borderRadius: 4, transition: 'width 0.4s ease' }} />
      </div>
      <span style={{ fontSize: 11, color: colors.textMuted, minWidth: 32 }}>{Math.round(pct)}%</span>
    </div>
  )
}

const ConsumerCard: React.FC<{ c: Consumer }> = ({ c }) => {
  const isUser = c.type === 'user'
  const iconBg = isUser ? '#1a2d4d' : '#2d1a4d'
  const iconChar = isUser ? '👤' : '⚙️'
  const am = authMethodStyles[c.authMethod]

  return (
    <div style={{ ...card, display: 'flex', alignItems: 'center', gap: 16, padding: '14px 18px' }}>
      {/* Left: icon + name */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, minWidth: 220 }}>
        <div style={{
          width: 40, height: 40, borderRadius: 10, backgroundColor: iconBg,
          display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, flexShrink: 0,
        }}>
          {iconChar}
        </div>
        <div>
          <div style={{ fontWeight: 600, color: '#fff', fontSize: 13 }}>{c.displayName}</div>
          <div style={{ fontSize: 11, color: colors.textDim, fontFamily: 'monospace' }}>{c.email || c.name}</div>
        </div>
      </div>

      {/* Middle: details */}
      <div style={{ flex: 1, display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 8 }}>
        <span style={badge(am.bg, am.color)}>{am.label}</span>
        <span style={{ fontSize: 11, color: colors.textMuted }}>ns/{c.namespace}</span>
        <span style={{ fontSize: 11, color: colors.textDim }}>• {c.team}</span>
        {c.apiKeyPrefix && (
          <span style={{ fontSize: 11, color: colors.textMuted }}>
            Key: <code style={{ backgroundColor: '#1A1A1A', padding: '1px 6px', borderRadius: 3, fontSize: 11 }}>{c.apiKeyPrefix}...</code>
            {c.apiKeyExpiresAt && <span style={{ color: colors.textDim }}> exp {formatDate(c.apiKeyExpiresAt)}</span>}
          </span>
        )}
      </div>

      {/* Right: usage + quota + status */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 20, flexShrink: 0 }}>
        <div style={{ textAlign: 'right', minWidth: 80 }}>
          <div style={{ fontWeight: 700, color: '#fff', fontSize: 14 }}>{formatTokens(c.usage24h.totalTokens)}</div>
          <div style={{ fontSize: 11, color: colors.textDim }}>
            ${c.usage24h.totalCost.toFixed(2)} · {c.usage24h.totalRequests} req
          </div>
        </div>
        <QuotaBar used={c.usage24h.totalTokens} limit={c.quotas.tokensPerDay} />
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 4, minWidth: 90 }}>
          <StatusBadge status={c.status} />
          <span style={{ fontSize: 10, color: colors.textDim }}>{relativeTime(c.lastActive)}</span>
        </div>
      </div>
    </div>
  )
}

/* ------------------------------------------------------------------ */
/*  MAIN COMPONENT                                                    */
/* ------------------------------------------------------------------ */

const Access: React.FC = () => {
  const [activeTab, setActiveTab] = useState<Tab>('users')
  const [userSearch, setUserSearch] = useState('')
  const [userStatusFilter, setUserStatusFilter] = useState('all')
  const [requestSearch, setRequestSearch] = useState('')
  const [requestStatusFilter, setRequestStatusFilter] = useState('all')
  const [auditSearch, setAuditSearch] = useState('')
  const [requests, setRequests] = useState(accessRequests)
  const [showInvite, setShowInvite] = useState(false)
  const [inviteEmail, setInviteEmail] = useState('')
  const [inviteRole, setInviteRole] = useState('Viewer')
  const [inviteNs, setInviteNs] = useState('platform')
  const [actionFeedback, setActionFeedback] = useState<string | null>(null)

  const users = consumers.filter(c => c.type === 'user')
  const services = consumers.filter(c => c.type === 'application' || c.type === 'service-principal')
  const apiKeyConsumers = consumers.filter(c => c.apiKeyPrefix)
  const pendingRequests = requests.filter(r => r.status === 'pending')

  const showFeedback = (msg: string) => { setActionFeedback(msg); setTimeout(() => setActionFeedback(null), 2500); }

  const handleRequestAction = (id: string, action: 'approved' | 'denied') => {
    setRequests(prev => prev.map(r => r.id === id ? { ...r, status: action, reviewedBy: 'anishta@microsoft.com', reviewedAt: new Date().toISOString() } : r))
    showFeedback(action === 'approved' ? '✓ Request approved' : '✗ Request denied')
  }

  /* --- filtered lists --- */
  const filteredUsers = users.filter(c => {
    const matchSearch = !userSearch || c.displayName.toLowerCase().includes(userSearch.toLowerCase()) || (c.email || '').toLowerCase().includes(userSearch.toLowerCase())
    const matchStatus = userStatusFilter === 'all' || c.status === userStatusFilter
    return matchSearch && matchStatus
  })

  const filteredServices = services.filter(c => {
    const matchSearch = !userSearch || c.displayName.toLowerCase().includes(userSearch.toLowerCase()) || c.name.toLowerCase().includes(userSearch.toLowerCase())
    const matchStatus = userStatusFilter === 'all' || c.status === userStatusFilter
    return matchSearch && matchStatus
  })

  const filteredRequests = requests.filter(r => {
    const matchSearch = !requestSearch || r.requesterName.toLowerCase().includes(requestSearch.toLowerCase()) || r.targetName.toLowerCase().includes(requestSearch.toLowerCase())
    const matchStatus = requestStatusFilter === 'all' || r.status === requestStatusFilter
    return matchSearch && matchStatus
  })

  const filteredAudit = auditLog.filter(e => {
    return !auditSearch || e.action.toLowerCase().includes(auditSearch.toLowerCase()) || e.actor.toLowerCase().includes(auditSearch.toLowerCase()) || e.resource.toLowerCase().includes(auditSearch.toLowerCase())
  })

  /* --- tabs config --- */
  const tabs: { key: Tab; label: string; icon: string; count?: number; pendingCount?: number }[] = [
    { key: 'users', label: 'Users', icon: '👤', count: users.length },
    { key: 'services', label: 'Service Identities', icon: '🔧', count: services.length },
    { key: 'apikeys', label: 'API Keys', icon: '🔑', count: apiKeyConsumers.length },
    { key: 'requests', label: 'Access Requests', icon: '🛡', pendingCount: pendingRequests.length },
    { key: 'audit', label: 'Audit Log', icon: '📋' },
  ]

  const tabBase: CSSProperties = {
    padding: '8px 18px',
    borderRadius: 6,
    border: 'none',
    cursor: 'pointer',
    fontSize: 13,
    fontWeight: 600,
    fontFamily: 'inherit',
    transition: 'all 0.15s',
    display: 'flex',
    alignItems: 'center',
    gap: 6,
  }

  return (
    <>
    <div style={{ color: colors.text, display: 'flex', flexDirection: 'column', gap: 20 }}>

      {/* --------- HEADER STATS ROW --------- */}
      <div style={{ display: 'flex', gap: 14, alignItems: 'stretch' }}>
        <StatCard label="Users" value={users.length} accent={colors.gold} />
        <StatCard label="Service Identities" value={services.length} accent={colors.purple} />
        <StatCard label="API Keys" value={apiKeyConsumers.length} accent={colors.amber} />
        <StatCard label="Pending Requests" value={pendingRequests.length} accent={pendingRequests.length > 0 ? colors.amber : colors.green} />
        <button style={{ ...primaryBtn, alignSelf: 'center', whiteSpace: 'nowrap' }} onClick={() => setShowInvite(true)}>
          + Invite User
        </button>
      </div>

      {/* --------- TAB NAVIGATION --------- */}
      <div style={{ display: 'flex', gap: 4, backgroundColor: colors.card, borderRadius: 8, padding: 4, width: 'fit-content' }}>
        {tabs.map(t => (
          <button
            key={t.key}
            style={{
              ...tabBase,
              backgroundColor: activeTab === t.key ? '#1A1A1A' : 'transparent',
              color: activeTab === t.key ? colors.gold : colors.textMuted,
              borderBottom: activeTab === t.key ? `2px solid ${colors.gold}` : '2px solid transparent',
            }}
            onClick={() => setActiveTab(t.key)}
          >
            <span>{t.icon}</span>
            <span>{t.label}</span>
            {t.count !== undefined && <span style={{ fontSize: 11, opacity: 0.7 }}>({t.count})</span>}
            {t.pendingCount !== undefined && t.pendingCount > 0 && (
              <span style={{
                backgroundColor: colors.amber, color: '#000', fontSize: 10, fontWeight: 700,
                borderRadius: 10, padding: '1px 6px', marginLeft: 2,
              }}>
                {t.pendingCount}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* --------- USERS TAB --------- */}
      {activeTab === 'users' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div style={{ display: 'flex', gap: 10 }}>
            <input
              placeholder="Search users..."
              value={userSearch}
              onChange={e => setUserSearch(e.target.value)}
              style={{ ...inputStyle, flex: 1, maxWidth: 320 }}
            />
            <select value={userStatusFilter} onChange={e => setUserStatusFilter(e.target.value)} style={inputStyle}>
              <option value="all">All Statuses</option>
              <option value="active">Active</option>
              <option value="suspended">Suspended</option>
              <option value="pending">Pending</option>
            </select>
          </div>
          {filteredUsers.length === 0 ? (
            <div style={{ ...card, textAlign: 'center', color: colors.textDim, padding: 40 }}>No users match your filters.</div>
          ) : (
            filteredUsers.map(c => <ConsumerCard key={c.id} c={c} />)
          )}
        </div>
      )}

      {/* --------- SERVICE IDENTITIES TAB --------- */}
      {activeTab === 'services' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div style={{ display: 'flex', gap: 10 }}>
            <input
              placeholder="Search service identities..."
              value={userSearch}
              onChange={e => setUserSearch(e.target.value)}
              style={{ ...inputStyle, flex: 1, maxWidth: 320 }}
            />
            <select value={userStatusFilter} onChange={e => setUserStatusFilter(e.target.value)} style={inputStyle}>
              <option value="all">All Statuses</option>
              <option value="active">Active</option>
              <option value="suspended">Suspended</option>
              <option value="pending">Pending</option>
            </select>
          </div>
          {filteredServices.length === 0 ? (
            <div style={{ ...card, textAlign: 'center', color: colors.textDim, padding: 40 }}>No service identities match your filters.</div>
          ) : (
            filteredServices.map(c => <ConsumerCard key={c.id} c={c} />)
          )}
        </div>
      )}

      {/* --------- API KEYS TAB --------- */}
      {activeTab === 'apikeys' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {apiKeyConsumers.map(c => (
            <div key={c.id} style={{ ...card, display: 'flex', alignItems: 'center', gap: 16, padding: '14px 18px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, flex: 1 }}>
                <span style={{ fontSize: 20 }}>🔑</span>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <code style={{
                      backgroundColor: '#1A1A1A', padding: '3px 10px', borderRadius: 4,
                      fontSize: 13, fontFamily: 'monospace', color: colors.gold,
                    }}>
                      {c.apiKeyPrefix}...
                    </code>
                    <span style={{ fontWeight: 600, color: '#fff', fontSize: 13 }}>{c.displayName}</span>
                    <StatusBadge status={c.status} />
                  </div>
                  <div style={{ display: 'flex', gap: 16, marginTop: 6, fontSize: 11, color: colors.textDim }}>
                    <span>Created: {formatDate(c.apiKeyCreatedAt!)}</span>
                    <span>Expires: {formatDate(c.apiKeyExpiresAt!)}</span>
                    <span>Consumer: {c.name}</span>
                  </div>
                </div>
              </div>
              <div style={{ display: 'flex', gap: 8, flexShrink: 0 }}>
                <button style={secondaryBtn} onClick={() => { navigator.clipboard?.writeText(`https://gateway.azure.com/v1/${c.namespace}`); showFeedback('✓ Endpoint copied to clipboard'); }}>Copy Endpoint</button>
                <button style={{ ...secondaryBtn, color: colors.amber, borderColor: colors.amber }} onClick={() => showFeedback('✓ API key rotated — new key issued')}>Rotate</button>
                <button style={{ ...secondaryBtn, color: colors.red, borderColor: colors.red }} onClick={() => { if (confirm(`Revoke API key ${c.apiKeyPrefix}... for ${c.displayName}?`)) showFeedback('✓ API key revoked'); }}>Revoke</button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* --------- ACCESS REQUESTS TAB --------- */}
      {activeTab === 'requests' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div style={{ display: 'flex', gap: 10 }}>
            <input
              placeholder="Search requests..."
              value={requestSearch}
              onChange={e => setRequestSearch(e.target.value)}
              style={{ ...inputStyle, flex: 1, maxWidth: 320 }}
            />
            <select value={requestStatusFilter} onChange={e => setRequestStatusFilter(e.target.value)} style={inputStyle}>
              <option value="all">All Statuses</option>
              <option value="pending">Pending</option>
              <option value="approved">Approved</option>
              <option value="denied">Denied</option>
            </select>
          </div>
          {filteredRequests.length === 0 ? (
            <div style={{ ...card, textAlign: 'center', color: colors.textDim, padding: 40 }}>No requests match your filters.</div>
          ) : (
            filteredRequests.map(r => {
              const rt = requestTypeStyles[r.type] || requestTypeStyles['namespace-access']
              const statusMap: Record<string, { bg: string; fg: string; label: string }> = {
                pending: { bg: 'rgba(245,158,11,0.15)', fg: '#fbbf24', label: '⏳ Pending' },
                approved: { bg: 'rgba(74,222,128,0.15)', fg: '#4ADE80', label: '✓ Approved' },
                denied: { bg: 'rgba(239,68,68,0.15)', fg: '#EF4444', label: '✗ Denied' },
              }
              const st = statusMap[r.status]

              return (
                <div key={r.id} style={{ ...card, padding: '14px 18px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <span style={{ fontWeight: 600, color: '#fff', fontSize: 14 }}>{r.requesterName}</span>
                      <span style={badge(rt.bg, rt.color)}>{rt.label}</span>
                      <span style={badge(st.bg, st.fg)}>{st.label}</span>
                    </div>
                    {r.status === 'pending' && (
                      <div style={{ display: 'flex', gap: 8 }}>
                        <button style={primaryBtn} onClick={() => handleRequestAction(r.id, 'approved')}>Approve</button>
                        <button style={{ ...secondaryBtn, color: colors.red, borderColor: colors.red }} onClick={() => handleRequestAction(r.id, 'denied')}>Deny</button>
                      </div>
                    )}
                  </div>
                  <div style={{ fontSize: 13, color: colors.text, marginBottom: 6 }}>
                    Requesting <strong>{r.requestedRole}</strong> access to <strong>{r.targetName}</strong> in namespace <strong>{r.targetNamespace}</strong>
                  </div>
                  <div style={{ fontSize: 12, color: colors.textMuted, fontStyle: 'italic', marginBottom: 8 }}>
                    "{r.justification}"
                  </div>
                  <div style={{ display: 'flex', gap: 16, fontSize: 11, color: colors.textDim }}>
                    <span>Requested: {relativeTime(r.createdAt)}</span>
                    {r.reviewedBy && <span>Reviewed by {r.reviewedBy} · {relativeTime(r.reviewedAt!)}</span>}
                  </div>
                </div>
              )
            })
          )}
        </div>
      )}

      {/* --------- AUDIT LOG TAB --------- */}
      {activeTab === 'audit' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div style={{ display: 'flex', gap: 10 }}>
            <input
              placeholder="Search audit log..."
              value={auditSearch}
              onChange={e => setAuditSearch(e.target.value)}
              style={{ ...inputStyle, flex: 1, maxWidth: 320 }}
            />
          </div>
          {filteredAudit.map(e => {
            const borderColor = e.outcome === 'success' ? colors.green : e.outcome === 'failure' ? colors.red : '#f97316'
            const outcomeBadge: Record<string, { bg: string; fg: string; label: string }> = {
              success: { bg: 'rgba(74,222,128,0.15)', fg: '#4ADE80', label: '✓ Success' },
              failure: { bg: 'rgba(239,68,68,0.15)', fg: '#EF4444', label: '✗ Failure' },
              denied: { bg: 'rgba(249,115,22,0.15)', fg: '#fb923c', label: '⊘ Denied' },
            }
            const ob = outcomeBadge[e.outcome]

            return (
              <div key={e.id} style={{ ...card, padding: '14px 18px', borderLeft: `4px solid ${borderColor}` }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <span style={{ fontSize: 11, color: colors.textDim, fontFamily: 'monospace' }}>{relativeTime(e.timestamp)}</span>
                    <span style={{ fontWeight: 600, color: colors.gold, fontSize: 13 }}>{e.action}</span>
                    <span style={{ fontSize: 12, color: colors.textMuted }}>by {e.actor}</span>
                  </div>
                  <span style={badge(ob.bg, ob.fg)}>{ob.label}</span>
                </div>
                <div style={{ fontSize: 12, color: colors.textMuted, marginBottom: 4 }}>
                  Resource: <span style={{ color: '#fff' }}>{e.resource}</span>
                </div>
                <div style={{ fontSize: 12, color: colors.textDim }}>{e.details}</div>
              </div>
            )
          })}
        </div>
      )}
    </div>

      {/* --------- INVITE USER MODAL --------- */}
      {showInvite && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}
          onClick={(e) => { if (e.target === e.currentTarget) setShowInvite(false); }}>
          <div style={{ backgroundColor: '#1A1A1A', borderRadius: 12, padding: 24, width: 400, borderTop: `3px solid ${colors.gold}` }}>
            <h3 style={{ margin: '0 0 16px', color: '#fff', fontSize: 16 }}>Invite User</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div>
                <div style={{ fontSize: 12, color: '#999', marginBottom: 4 }}>Email</div>
                <input value={inviteEmail} onChange={e => setInviteEmail(e.target.value)} placeholder="user@contoso.com"
                  style={{ width: '100%', boxSizing: 'border-box', backgroundColor: '#0F0F0F', border: '1px solid rgba(129, 140, 248,0.15)', borderRadius: 6, padding: '8px 12px', color: '#E8E8E8', fontSize: 13 }} />
              </div>
              <div>
                <div style={{ fontSize: 12, color: '#999', marginBottom: 4 }}>Role</div>
                <select value={inviteRole} onChange={e => setInviteRole(e.target.value)}
                  style={{ width: '100%', backgroundColor: '#0F0F0F', border: '1px solid rgba(129, 140, 248,0.15)', borderRadius: 6, padding: '8px 12px', color: '#E8E8E8', fontSize: 13 }}>
                  <option>Viewer</option><option>Editor</option><option>Admin</option>
                </select>
              </div>
              <div>
                <div style={{ fontSize: 12, color: '#999', marginBottom: 4 }}>Namespace</div>
                <select value={inviteNs} onChange={e => setInviteNs(e.target.value)}
                  style={{ width: '100%', backgroundColor: '#0F0F0F', border: '1px solid rgba(129, 140, 248,0.15)', borderRadius: 6, padding: '8px 12px', color: '#E8E8E8', fontSize: 13 }}>
                  <option value="platform">platform</option><option value="research">research</option><option value="customer-support">customer-support</option><option value="finance">finance</option>
                </select>
              </div>
              <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', marginTop: 8 }}>
                <button onClick={() => setShowInvite(false)} style={secondaryBtn}>Cancel</button>
                <button onClick={() => { setShowInvite(false); setInviteEmail(''); showFeedback(`✓ Invitation sent to ${inviteEmail || 'user'}`); }} style={primaryBtn}>Send Invite</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* --------- FEEDBACK TOAST --------- */}
      {actionFeedback && (
        <div style={{ position: 'fixed', bottom: 24, right: 24, backgroundColor: '#1A1A1A', border: `1px solid ${colors.gold}`, borderRadius: 8, padding: '12px 20px', color: colors.gold, fontSize: 13, fontWeight: 600, zIndex: 1001, boxShadow: '0 4px 12px rgba(0,0,0,0.5)' }}>
          {actionFeedback}
        </div>
      )}
    </>
  )
}

export default Access
