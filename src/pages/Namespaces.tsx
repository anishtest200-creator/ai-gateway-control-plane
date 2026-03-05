import React, { useState } from 'react'
import type { CSSProperties } from 'react'

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

interface Namespace {
  id: string
  name: string
  displayName: string
  description: string
  owner: string
  type: 'managed' | 'personal'
  assetCount: { models: number; tools: number; mcpServers: number; agents: number; skills: number }
  totalAssets: number
  policies: string[]
  members: { name: string; role: string }[]
  serviceIdentities: { name: string; purpose: string }[]
  credentials: { name: string; type: string; environment: string }[]
  environment: 'production' | 'staging' | 'development' | 'sandbox'
  status: string
  createdAt: string
}

interface BudgetRule {
  id: string
  name: string
  scope: 'namespace' | 'team' | 'model'
  scopeTarget: string
  limitAmount: number
  period: 'monthly' | 'weekly' | 'daily'
  alertThresholds: number[]
  action: 'notify' | 'throttle' | 'block'
  spent: number
  status: 'active' | 'paused'
  createdAt: string
}

/* ------------------------------------------------------------------ */
/*  Mock Data                                                          */
/* ------------------------------------------------------------------ */

const initialBudgetRules: Record<string, BudgetRule[]> = {
  'ns-ai-platform-prod-001': [
    { id: 'br-1', name: 'Platform Monthly Cap', scope: 'namespace', scopeTarget: 'ai-platform', limitAmount: 15000, period: 'monthly', alertThresholds: [60, 80, 100], action: 'notify', spent: 11200, status: 'active', createdAt: '2024-06-01' },
    { id: 'br-2', name: 'GPT-4o Spend Limit', scope: 'model', scopeTarget: 'GPT-4o', limitAmount: 5000, period: 'monthly', alertThresholds: [80, 100], action: 'throttle', spent: 3890, status: 'active', createdAt: '2024-07-15' },
    { id: 'br-3', name: 'ML Platform Team', scope: 'team', scopeTarget: 'ML Platform', limitAmount: 8000, period: 'monthly', alertThresholds: [60, 80, 100], action: 'notify', spent: 5420, status: 'active', createdAt: '2024-08-01' },
  ],
  'ns-ml-inference-prod-002': [
    { id: 'br-4', name: 'Inference Budget', scope: 'namespace', scopeTarget: 'ml-inference', limitAmount: 8000, period: 'monthly', alertThresholds: [80, 100], action: 'throttle', spent: 5100, status: 'active', createdAt: '2024-06-15' },
  ],
  'ns-customer-support-ai-prod-004': [
    { id: 'br-5', name: 'Support Monthly Cap', scope: 'namespace', scopeTarget: 'customer-support-ai', limitAmount: 3000, period: 'monthly', alertThresholds: [60, 80, 100], action: 'block', spent: 3400, status: 'active', createdAt: '2024-06-01' },
    { id: 'br-6', name: 'Claude Haiku Limit', scope: 'model', scopeTarget: 'Claude 3 Haiku', limitAmount: 1500, period: 'monthly', alertThresholds: [80, 100], action: 'notify', spent: 980, status: 'active', createdAt: '2024-09-01' },
  ],
  'ns-data-engineering-prod-003': [
    { id: 'br-7', name: 'Data Eng Budget', scope: 'namespace', scopeTarget: 'data-engineering', limitAmount: 5000, period: 'monthly', alertThresholds: [60, 80, 100], action: 'notify', spent: 3900, status: 'active', createdAt: '2024-06-01' },
  ],
  'ns-research-sandbox-007': [
    { id: 'br-8', name: 'Research Sandbox Cap', scope: 'namespace', scopeTarget: 'research-lab', limitAmount: 2000, period: 'monthly', alertThresholds: [80, 100], action: 'notify', spent: 800, status: 'active', createdAt: '2024-07-01' },
  ],
}

const initialNamespaces: Namespace[] = [
  {
    id: 'ns-ai-platform-prod-001',
    name: 'ai-platform',
    displayName: 'AI Platform',
    description: 'Central AI platform namespace for shared models, tools, and gateway-wide policies. Acts as the control plane for all production AI workloads.',
    owner: 'platform-team@contoso.com',
    type: 'managed',
    assetCount: { models: 14, tools: 8, mcpServers: 3, agents: 5, skills: 6 },
    totalAssets: 36,
    policies: ['JWT Validation', 'Rate Limit (100K TPM)', 'PII Redaction', 'Content Safety', 'Prompt Injection Shield'],
    members: [
      { name: 'Sarah Chen', role: 'namespace-admin' },
      { name: 'James Wilson', role: 'namespace-admin' },
      { name: 'Priya Sharma', role: 'ai-developer' },
      { name: 'Mike Torres', role: 'ai-developer' },
      { name: 'Lisa Park', role: 'viewer' },
    ],
    serviceIdentities: [
      { name: 'svc-gateway-controller', purpose: 'Gateway routing and load balancing' },
      { name: 'svc-model-registry', purpose: 'Model lifecycle management' },
    ],
    credentials: [
      { name: 'azure-openai-eastus-key', type: 'API Key', environment: 'production' },
      { name: 'azure-openai-westus-key', type: 'API Key', environment: 'production' },
      { name: 'anthropic-prod-key', type: 'API Key', environment: 'production' },
    ],
    environment: 'production',
    status: 'active',
    createdAt: '2024-01-15',
  },
  {
    id: 'ns-ml-inference-prod-002',
    name: 'ml-inference',
    displayName: 'ML Inference',
    description: 'High-throughput inference namespace optimized for real-time model serving with auto-scaling and fallback routing across regions.',
    owner: 'ml-engineering@contoso.com',
    type: 'managed',
    assetCount: { models: 8, tools: 2, mcpServers: 1, agents: 0, skills: 0 },
    totalAssets: 11,
    policies: ['Rate Limit (200K TPM)', 'Burst Control', 'Fallback Chain', 'mTLS'],
    members: [
      { name: 'David Kim', role: 'namespace-admin' },
      { name: 'Anna Kowalski', role: 'ai-developer' },
      { name: 'Raj Patel', role: 'ai-developer' },
    ],
    serviceIdentities: [
      { name: 'svc-inference-scaler', purpose: 'Auto-scaling inference replicas' },
    ],
    credentials: [
      { name: 'azure-openai-inference-key', type: 'API Key', environment: 'production' },
      { name: 'gcp-vertex-sa', type: 'Service Account', environment: 'production' },
    ],
    environment: 'production',
    status: 'active',
    createdAt: '2024-02-08',
  },
  {
    id: 'ns-data-engineering-prod-003',
    name: 'data-engineering',
    displayName: 'Data Engineering',
    description: 'Namespace for data pipeline AI assistants, ETL automation agents, and data quality tools powered by large language models.',
    owner: 'data-eng@contoso.com',
    type: 'managed',
    assetCount: { models: 3, tools: 6, mcpServers: 4, agents: 2, skills: 3 },
    totalAssets: 18,
    policies: ['API Key Auth', 'Rate Limit (50K TPM)', 'PII Redaction'],
    members: [
      { name: 'Carlos Rivera', role: 'namespace-admin' },
      { name: 'Emily Zhang', role: 'ai-developer' },
      { name: 'Tom Anderson', role: 'ai-developer' },
      { name: 'Nina Gupta', role: 'viewer' },
    ],
    serviceIdentities: [
      { name: 'svc-data-pipeline', purpose: 'Automated data pipeline orchestration' },
      { name: 'svc-quality-checker', purpose: 'Data quality validation workflows' },
    ],
    credentials: [
      { name: 'azure-openai-data-key', type: 'API Key', environment: 'production' },
      { name: 'postgres-conn-string', type: 'Connection String', environment: 'production' },
      { name: 'snowflake-oauth', type: 'OAuth 2.0', environment: 'production' },
    ],
    environment: 'production',
    status: 'active',
    createdAt: '2024-03-01',
  },
  {
    id: 'ns-customer-support-ai-prod-004',
    name: 'customer-support-ai',
    displayName: 'Customer Support AI',
    description: 'Production namespace for customer-facing AI agents, including the retail support bot, escalation workflows, and sentiment analysis tools.',
    owner: 'support-ops@contoso.com',
    type: 'managed',
    assetCount: { models: 4, tools: 5, mcpServers: 2, agents: 3, skills: 4 },
    totalAssets: 18,
    policies: ['JWT Validation', 'Content Safety', 'PII Redaction', 'Human-in-the-Loop Gate', 'Agent Step Limit'],
    members: [
      { name: 'Rachel Adams', role: 'namespace-admin' },
      { name: 'Kevin Nguyen', role: 'ai-developer' },
      { name: 'Sofia Martinez', role: 'ai-developer' },
      { name: 'Ben Harper', role: 'viewer' },
      { name: 'Olivia Lee', role: 'viewer' },
    ],
    serviceIdentities: [
      { name: 'svc-support-agent', purpose: 'Customer support agent runtime' },
      { name: 'svc-escalation-bot', purpose: 'Ticket escalation and routing' },
    ],
    credentials: [
      { name: 'azure-openai-support-key', type: 'API Key', environment: 'production' },
      { name: 'salesforce-oauth-token', type: 'OAuth 2.0', environment: 'production' },
      { name: 'servicenow-api-key', type: 'API Key', environment: 'production' },
    ],
    environment: 'production',
    status: 'active',
    createdAt: '2024-01-22',
  },
  {
    id: 'ns-finance-analytics-prod-005',
    name: 'finance-analytics',
    displayName: 'Finance Analytics',
    description: 'Secure namespace for financial analysis models and reporting agents. Strict data governance with full audit logging enabled.',
    owner: 'finance-ai@contoso.com',
    type: 'managed',
    assetCount: { models: 5, tools: 3, mcpServers: 1, agents: 2, skills: 1 },
    totalAssets: 12,
    policies: ['mTLS', 'Rate Limit (30K TPM)', 'PII Redaction', 'Output Content Filter', 'Audit Logging'],
    members: [
      { name: 'Marcus Lee', role: 'namespace-admin' },
      { name: 'Hannah Brooks', role: 'ai-developer' },
    ],
    serviceIdentities: [
      { name: 'svc-finance-reporter', purpose: 'Automated financial report generation' },
    ],
    credentials: [
      { name: 'azure-openai-finance-key', type: 'API Key', environment: 'production' },
      { name: 'bloomberg-api-key', type: 'API Key', environment: 'production' },
    ],
    environment: 'production',
    status: 'active',
    createdAt: '2024-02-14',
  },
  {
    id: 'ns-hr-automation-dev-006',
    name: 'hr-automation',
    displayName: 'HR Automation',
    description: 'Development namespace for HR workflow automation including resume screening, interview scheduling, and employee onboarding assistants.',
    owner: 'hr-tech@contoso.com',
    type: 'managed',
    assetCount: { models: 2, tools: 4, mcpServers: 1, agents: 1, skills: 2 },
    totalAssets: 10,
    policies: ['API Key Auth', 'PII Redaction', 'Rate Limit (20K TPM)'],
    members: [
      { name: 'Jennifer Wu', role: 'namespace-admin' },
      { name: 'Alex Turner', role: 'ai-developer' },
      { name: 'Megan Clark', role: 'viewer' },
    ],
    serviceIdentities: [],
    credentials: [
      { name: 'azure-openai-hr-dev-key', type: 'API Key', environment: 'development' },
      { name: 'workday-oauth', type: 'OAuth 2.0', environment: 'development' },
    ],
    environment: 'development',
    status: 'active',
    createdAt: '2024-04-10',
  },
  {
    id: 'ns-research-sandbox-007',
    name: 'research-lab',
    displayName: 'Research Lab',
    description: 'Sandbox namespace for AI research experiments, model evaluation, prompt engineering, and benchmarking new model releases.',
    owner: 'ai-research@contoso.com',
    type: 'managed',
    assetCount: { models: 10, tools: 2, mcpServers: 0, agents: 1, skills: 0 },
    totalAssets: 13,
    policies: ['Rate Limit (10K TPM)'],
    members: [
      { name: 'Dr. Wei Zhang', role: 'namespace-admin' },
      { name: 'Aisha Okafor', role: 'ai-developer' },
      { name: 'Luca Rossi', role: 'ai-developer' },
      { name: 'Yuki Tanaka', role: 'ai-developer' },
    ],
    serviceIdentities: [],
    credentials: [
      { name: 'azure-openai-sandbox-key', type: 'API Key', environment: 'sandbox' },
      { name: 'anthropic-sandbox-key', type: 'API Key', environment: 'sandbox' },
      { name: 'bedrock-sandbox-iam', type: 'IAM Role', environment: 'sandbox' },
    ],
    environment: 'sandbox',
    status: 'active',
    createdAt: '2024-05-01',
  },
  {
    id: 'ns-security-ops-prod-008',
    name: 'security-ops',
    displayName: 'Security Operations',
    description: 'Managed namespace for security monitoring AI, threat detection agents, and automated incident response powered by LLMs.',
    owner: 'secops@contoso.com',
    type: 'managed',
    assetCount: { models: 3, tools: 5, mcpServers: 2, agents: 2, skills: 3 },
    totalAssets: 15,
    policies: ['mTLS', 'JWT Validation', 'Rate Limit (50K TPM)', 'Content Safety', 'Audit Logging'],
    members: [
      { name: 'Chris Brennan', role: 'namespace-admin' },
      { name: 'Diana Foster', role: 'ai-developer' },
    ],
    serviceIdentities: [
      { name: 'svc-threat-detector', purpose: 'Real-time threat detection and alerting' },
      { name: 'svc-incident-responder', purpose: 'Automated incident triage and response' },
    ],
    credentials: [
      { name: 'azure-openai-secops-key', type: 'API Key', environment: 'production' },
      { name: 'sentinel-api-key', type: 'API Key', environment: 'production' },
    ],
    environment: 'production',
    status: 'active',
    createdAt: '2024-03-20',
  },
  {
    id: 'ns-sarah-chen-personal-009',
    name: 'sarah-chen-workspace',
    displayName: "Sarah's Workspace",
    description: 'Personal development workspace for prototyping AI features and testing new model integrations before promoting to shared namespaces.',
    owner: 'sarah.chen@contoso.com',
    type: 'personal',
    assetCount: { models: 3, tools: 1, mcpServers: 0, agents: 1, skills: 0 },
    totalAssets: 5,
    policies: ['Rate Limit (5K TPM)'],
    members: [
      { name: 'Sarah Chen', role: 'namespace-admin' },
    ],
    serviceIdentities: [],
    credentials: [
      { name: 'personal-openai-key', type: 'API Key', environment: 'development' },
    ],
    environment: 'development',
    status: 'active',
    createdAt: '2024-06-01',
  },
  {
    id: 'ns-raj-patel-personal-010',
    name: 'raj-patel-sandbox',
    displayName: "Raj's Sandbox",
    description: 'Personal sandbox for ML model experimentation, fine-tuning scripts, and evaluating third-party model providers.',
    owner: 'raj.patel@contoso.com',
    type: 'personal',
    assetCount: { models: 5, tools: 0, mcpServers: 0, agents: 0, skills: 0 },
    totalAssets: 5,
    policies: [],
    members: [
      { name: 'Raj Patel', role: 'namespace-admin' },
    ],
    serviceIdentities: [],
    credentials: [
      { name: 'personal-anthropic-key', type: 'API Key', environment: 'sandbox' },
      { name: 'personal-vertex-sa', type: 'Service Account', environment: 'sandbox' },
    ],
    environment: 'sandbox',
    status: 'active',
    createdAt: '2024-06-15',
  },
]

/* ------------------------------------------------------------------ */
/*  Design tokens                                                      */
/* ------------------------------------------------------------------ */

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
}

const card: CSSProperties = {
  backgroundColor: colors.card,
  border: `1px solid ${colors.border}`,
  borderRadius: 8,
  padding: 14,
}

const badge = (bg: string, fg: string): CSSProperties => ({
  display: 'inline-block',
  padding: '2px 8px',
  borderRadius: 4,
  fontSize: 11,
  fontWeight: 600,
  backgroundColor: bg,
  color: fg,
  marginRight: 4,
})

/* ------------------------------------------------------------------ */
/*  Config maps                                                        */
/* ------------------------------------------------------------------ */

const envConfig: Record<string, { bg: string; color: string }> = {
  production: { bg: '#1a3a2a', color: '#4ade80' },
  staging: { bg: '#2d1a3d', color: '#c084fc' },
  development: { bg: '#3d2800', color: '#fbbf24' },
  sandbox: { bg: '#1a2d3d', color: '#38bdf8' },
}

const typeConfig: Record<string, { bg: string; color: string; icon: string }> = {
  managed: { bg: '#312e81', color: '#a5b4fc', icon: '🏢' },
  personal: { bg: '#1e3a5f', color: '#7dd3fc', icon: '👤' },
}

const roleConfig: Record<string, { bg: string; color: string }> = {
  'namespace-admin': { bg: '#312e81', color: '#a5b4fc' },
  'ai-developer': { bg: '#1a3a2a', color: '#4ade80' },
  'viewer': { bg: '#1e293b', color: '#94a3b8' },
}

/* ------------------------------------------------------------------ */
/*  Shared styles                                                      */
/* ------------------------------------------------------------------ */

const tabBase: CSSProperties = {
  padding: '7px 20px',
  borderRadius: 6,
  border: 'none',
  borderBottom: '2px solid transparent',
  cursor: 'pointer',
  fontSize: 13,
  fontWeight: 600,
  fontFamily: 'inherit',
  transition: 'all 0.15s',
}

const sectionHeader: CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  marginBottom: 12,
}

const sectionTitle: CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: 8,
  color: colors.text,
  fontSize: 14,
  fontWeight: 600,
}

/* ------------------------------------------------------------------ */
/*  Component                                                          */
/* ------------------------------------------------------------------ */

type TabKey = 'all' | 'managed' | 'personal'

const Namespaces: React.FC = () => {
  const [search, setSearch] = useState('')
  const [activeTab, setActiveTab] = useState<TabKey>('all')
  const [selectedNs, setSelectedNs] = useState<Namespace | null>(null)
  const [hoveredCard, setHoveredCard] = useState<string | null>(null)
  const [nsList, setNsList] = useState<Namespace[]>(initialNamespaces)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [editingNs, setEditingNs] = useState<Namespace | null>(null)
  const [menuOpenId, setMenuOpenId] = useState<string | null>(null)
  const [formName, setFormName] = useState('')
  const [formEnv, setFormEnv] = useState<'production' | 'staging' | 'development' | 'sandbox'>('production')
  const [formDesc, setFormDesc] = useState('')
  const [formBudget, setFormBudget] = useState('')
  const [formOwner, setFormOwner] = useState('')
  const [showAddMember, setShowAddMember] = useState(false)
  const [newMemberEmail, setNewMemberEmail] = useState('')
  const [newMemberRole, setNewMemberRole] = useState('Viewer')
  const [budgetRules, setBudgetRules] = useState<Record<string, BudgetRule[]>>(initialBudgetRules)
  const [showBudgetModal, setShowBudgetModal] = useState(false)
  const [budgetForm, setBudgetForm] = useState({ name: '', scope: 'namespace' as BudgetRule['scope'], scopeTarget: '', limitAmount: '', period: 'monthly' as BudgetRule['period'], action: 'notify' as BudgetRule['action'], alerts: [60, 80, 100] as number[] })

  const managedCount = nsList.filter(n => n.type === 'managed').length
  const personalCount = nsList.filter(n => n.type === 'personal').length

  const openCreateModal = (ns?: Namespace) => {
    if (ns) {
      setEditingNs(ns)
      setFormName(ns.displayName)
      setFormEnv(ns.environment)
      setFormDesc(ns.description)
      setFormBudget('')
      setFormOwner(ns.owner)
    } else {
      setEditingNs(null)
      setFormName('')
      setFormEnv('production')
      setFormDesc('')
      setFormBudget('')
      setFormOwner('')
    }
    setShowCreateModal(true)
  }

  const handleCreateOrEdit = () => {
    if (!formName.trim()) return
    if (editingNs) {
      setNsList(prev => prev.map(n => n.id === editingNs.id ? { ...n, displayName: formName, name: formName.toLowerCase().replace(/\s+/g, '-'), environment: formEnv, description: formDesc, owner: formOwner } : n))
      if (selectedNs && selectedNs.id === editingNs.id) {
        setSelectedNs(prev => prev ? { ...prev, displayName: formName, name: formName.toLowerCase().replace(/\s+/g, '-'), environment: formEnv, description: formDesc, owner: formOwner } : prev)
      }
    } else {
      const newNs: Namespace = {
        id: `ns-${Date.now()}`,
        name: formName.toLowerCase().replace(/\s+/g, '-'),
        displayName: formName,
        description: formDesc,
        owner: formOwner || 'unassigned',
        type: 'managed',
        assetCount: { models: 0, tools: 0, mcpServers: 0, agents: 0, skills: 0 },
        totalAssets: 0,
        policies: [],
        members: [],
        serviceIdentities: [],
        credentials: [],
        environment: formEnv,
        status: 'active',
        createdAt: new Date().toISOString().slice(0, 10),
      }
      setNsList(prev => [...prev, newNs])
    }
    setShowCreateModal(false)
  }

  const handleDelete = (nsId: string) => {
    if (confirm('Delete this namespace? This cannot be undone.')) {
      setNsList(prev => prev.filter(n => n.id !== nsId))
      setMenuOpenId(null)
    }
  }

  const handleAddMember = () => {
    if (!newMemberEmail.trim() || !selectedNs) return
    const updatedNs = { ...selectedNs, members: [...selectedNs.members, { name: newMemberEmail, role: newMemberRole.toLowerCase().replace(/\s+/g, '-') }] }
    setSelectedNs(updatedNs)
    setNsList(prev => prev.map(n => n.id === updatedNs.id ? updatedNs : n))
    setNewMemberEmail('')
    setNewMemberRole('Viewer')
    setShowAddMember(false)
  }

  const openBudgetModal = () => {
    setBudgetForm({ name: '', scope: 'namespace', scopeTarget: selectedNs?.name || '', limitAmount: '', period: 'monthly', action: 'notify', alerts: [60, 80, 100] })
    setShowBudgetModal(true)
  }

  const handleCreateBudgetRule = () => {
    if (!budgetForm.name.trim() || !budgetForm.limitAmount || !selectedNs) return
    const newRule: BudgetRule = {
      id: `br-${Date.now()}`,
      name: budgetForm.name,
      scope: budgetForm.scope,
      scopeTarget: budgetForm.scopeTarget || selectedNs.name,
      limitAmount: Number(budgetForm.limitAmount),
      period: budgetForm.period,
      alertThresholds: budgetForm.alerts,
      action: budgetForm.action,
      spent: 0,
      status: 'active',
      createdAt: new Date().toISOString().slice(0, 10),
    }
    setBudgetRules(prev => ({
      ...prev,
      [selectedNs.id]: [...(prev[selectedNs.id] || []), newRule],
    }))
    setShowBudgetModal(false)
  }

  const handleDeleteBudgetRule = (ruleId: string) => {
    if (!selectedNs) return
    setBudgetRules(prev => ({
      ...prev,
      [selectedNs.id]: (prev[selectedNs.id] || []).filter(r => r.id !== ruleId),
    }))
  }

  const handleToggleBudgetRule = (ruleId: string) => {
    if (!selectedNs) return
    setBudgetRules(prev => ({
      ...prev,
      [selectedNs.id]: (prev[selectedNs.id] || []).map(r => r.id === ruleId ? { ...r, status: r.status === 'active' ? 'paused' as const : 'active' as const } : r),
    }))
  }

  const getNsBudgetSummary = (nsId: string) => {
    const rules = budgetRules[nsId] || []
    if (rules.length === 0) return null
    const totalBudget = rules.filter(r => r.scope === 'namespace').reduce((s, r) => s + r.limitAmount, 0)
    const totalSpent = rules.filter(r => r.scope === 'namespace').reduce((s, r) => s + r.spent, 0)
    return { rules: rules.length, totalBudget, totalSpent }
  }

  const filtered = nsList.filter(ns => {
    const matchesTab = activeTab === 'all' || ns.type === activeTab
    const q = search.toLowerCase()
    const matchesSearch =
      !q ||
      ns.name.toLowerCase().includes(q) ||
      ns.displayName.toLowerCase().includes(q) ||
      ns.description.toLowerCase().includes(q) ||
      ns.owner.toLowerCase().includes(q)
    return matchesTab && matchesSearch
  })

  /* ---- Detail view ---- */
  if (selectedNs) {
    const ns = selectedNs
    const tc = typeConfig[ns.type]
    const ec = envConfig[ns.environment]

    const statItems: { label: string; value: number; color: string }[] = [
      { label: 'Assets', value: ns.totalAssets, color: colors.gold },
      { label: 'Members', value: ns.members.length, color: colors.purple },
      { label: 'Service Identities', value: ns.serviceIdentities.length, color: colors.amber },
      { label: 'Policies', value: ns.policies.length, color: colors.green },
      { label: 'Credentials', value: ns.credentials.length, color: '#f87171' },
    ]

    const assetEntries: { emoji: string; label: string; count: number }[] = [
      { emoji: '🧠', label: 'Models', count: ns.assetCount.models },
      { emoji: '🔧', label: 'Tools', count: ns.assetCount.tools },
      { emoji: '🖥', label: 'MCP Servers', count: ns.assetCount.mcpServers },
      { emoji: '🤖', label: 'Agents', count: ns.assetCount.agents },
      { emoji: '💡', label: 'Skills', count: ns.assetCount.skills },
    ]

    const peopleCount = ns.members.length + ns.serviceIdentities.length

    return (
      <div style={{ color: colors.text, display: 'flex', flexDirection: 'column', gap: 20 }}>
        {/* Header with inline description */}
        <div>
          <button
            onClick={() => setSelectedNs(null)}
            style={{
              background: 'none', border: 'none', color: colors.gold,
              cursor: 'pointer', fontSize: 13, fontFamily: 'inherit',
              padding: 0, marginBottom: 16, fontWeight: 500,
            }}
          >
            ← Namespaces
          </button>
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12, marginBottom: 8 }}>
            <span style={{
              width: 44, height: 44, borderRadius: 10, backgroundColor: tc.bg,
              display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontSize: 22, flexShrink: 0,
            }}>
              {tc.icon}
            </span>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ fontSize: 20, fontWeight: 700, color: '#fff' }}>{ns.displayName}</span>
                <span style={badge(tc.bg, tc.color)}>
                  {ns.type === 'managed' ? 'Managed' : 'Personal'}
                </span>
                <span style={badge(ec.bg, ec.color)}>{ns.environment}</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginTop: 4 }}>
                <span style={{ fontFamily: 'monospace', fontSize: 12, color: '#9cdcfe' }}>{ns.name}</span>
                <span style={{ color: colors.textDim, fontSize: 12 }}>Owner: {ns.owner}</span>
                <span style={{ color: colors.textDim, fontSize: 12 }}>Created: {ns.createdAt}</span>
              </div>
              <div style={{ fontSize: 13, color: colors.textMuted, lineHeight: 1.5, marginTop: 6 }}>{ns.description}</div>
            </div>
          </div>
        </div>

        {/* Stat cards (matches Access page) */}
        <div style={{ display: 'flex', gap: 14, alignItems: 'stretch' }}>
          {statItems.map((s) => (
            <div key={s.label} style={{ backgroundColor: colors.card, border: `1px solid ${colors.border}`, borderRadius: 8, padding: 16, flex: 1, display: 'flex', flexDirection: 'column', gap: 4 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <span style={{ width: 8, height: 8, borderRadius: '50%', backgroundColor: s.color, display: 'inline-block', flexShrink: 0 }} />
                <span style={{ color: colors.textMuted, fontSize: 12 }}>{s.label}</span>
              </div>
              <span style={{ color: '#fff', fontSize: 28, fontWeight: 700, lineHeight: 1.1 }}>{s.value}</span>
            </div>
          ))}
        </div>

        {/* Assets section */}
        <div>
          <div style={sectionHeader}>
            <div style={sectionTitle}>
              <span style={{ fontSize: 16 }}>📦</span>
              <span>Assets</span>
              <span style={badge('rgba(212, 168, 67, 0.12)', colors.gold)}>{ns.totalAssets}</span>
            </div>
          </div>
          <div style={card}>
            <div style={{ display: 'flex', gap: 24, flexWrap: 'wrap' }}>
              {assetEntries.map(a => (
                <div key={a.label} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <span style={{ fontSize: 16 }}>{a.emoji}</span>
                  <span style={{ fontSize: 20, fontWeight: 700, color: '#fff' }}>{a.count}</span>
                  <span style={{ fontSize: 12, color: colors.textMuted }}>{a.label}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* People & Identities section */}
        <div>
          <div style={sectionHeader}>
            <div style={sectionTitle}>
              <span style={{ fontSize: 16 }}>👥</span>
              <span>People &amp; Identities</span>
              <span style={badge('rgba(167, 139, 250, 0.15)', colors.purple)}>{peopleCount}</span>
            </div>
            <button onClick={() => setShowAddMember(!showAddMember)} style={{
              padding: '6px 14px', borderRadius: 6, border: '1px solid rgba(212, 168, 67, 0.3)',
              backgroundColor: 'rgba(212, 168, 67, 0.1)', color: colors.gold,
              fontSize: 12, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit',
            }}>
              + Add Member
            </button>
          </div>
          {showAddMember && (
            <div style={{ ...card, marginBottom: 8, display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
              <input type="text" placeholder="Email address" value={newMemberEmail} onChange={(e) => setNewMemberEmail(e.target.value)} style={{ flex: 1, minWidth: 180, padding: '6px 10px', borderRadius: 6, border: `1px solid ${colors.border}`, backgroundColor: '#1A1A1A', color: colors.text, fontSize: 13, fontFamily: 'inherit', outline: 'none' }} />
              <select value={newMemberRole} onChange={(e) => setNewMemberRole(e.target.value)} style={{ padding: '6px 10px', borderRadius: 6, border: `1px solid ${colors.border}`, backgroundColor: '#1A1A1A', color: colors.text, fontSize: 13, fontFamily: 'inherit', cursor: 'pointer', outline: 'none' }}>
                <option value="Admin">Admin</option>
                <option value="Editor">Editor</option>
                <option value="Viewer">Viewer</option>
              </select>
              <button onClick={handleAddMember} style={{ padding: '6px 14px', borderRadius: 6, border: 'none', backgroundColor: colors.gold, color: '#0A0A0A', fontSize: 12, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}>Add</button>
            </div>
          )}
          <div style={card}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {ns.members.map(m => {
                const rc = roleConfig[m.role] || { bg: '#1e293b', color: '#94a3b8' }
                return (
                  <div key={m.name} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '6px 0', borderBottom: `1px solid ${colors.border}` }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <span style={{ fontSize: 14 }}>👤</span>
                      <span style={{ fontSize: 13, color: '#fff', fontWeight: 500 }}>{m.name}</span>
                    </div>
                    <span style={badge(rc.bg, rc.color)}>{m.role}</span>
                  </div>
                )
              })}
            </div>
            {ns.serviceIdentities.length > 0 && (
              <>
                <div style={{ fontSize: 11, fontWeight: 600, color: colors.textDim, textTransform: 'uppercase', letterSpacing: 0.5, marginTop: 12, marginBottom: 8 }}>Service Identities</div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {ns.serviceIdentities.map(si => (
                    <div key={si.name} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '6px 0', borderBottom: `1px solid ${colors.border}` }}>
                      <span style={{ fontFamily: 'monospace', fontSize: 12, color: '#9cdcfe', fontWeight: 500 }}>{si.name}</span>
                      <span style={{ color: colors.textMuted, fontSize: 12 }}>{si.purpose}</span>
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>
        </div>

        {/* Policies & Credentials section */}
        <div>
          <div style={sectionHeader}>
            <div style={sectionTitle}>
              <span style={{ fontSize: 16 }}>🛡</span>
              <span>Policies &amp; Credentials</span>
              <span style={badge('rgba(74, 222, 128, 0.15)', colors.green)}>{ns.policies.length + ns.credentials.length}</span>
            </div>
            <button style={{
              padding: '6px 14px', borderRadius: 6, border: '1px solid rgba(212, 168, 67, 0.3)',
              backgroundColor: 'rgba(212, 168, 67, 0.1)', color: colors.gold,
              fontSize: 12, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit',
            }} onClick={() => alert('Navigate to Secrets page to add a credential scoped to this namespace')}>
              + Add Credential
            </button>
          </div>
          <div style={card}>
            {ns.policies.length > 0 ? (
              <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                {ns.policies.map(p => (
                  <span key={p} style={badge('rgba(212, 168, 67, 0.12)', colors.gold)}>{p}</span>
                ))}
              </div>
            ) : (
              <span style={{ color: colors.textDim, fontStyle: 'italic', fontSize: 13 }}>No policies configured</span>
            )}
            <div style={{ fontSize: 11, fontWeight: 600, color: colors.textDim, textTransform: 'uppercase', letterSpacing: 0.5, marginTop: 12, marginBottom: 8 }}>Credentials</div>
            {ns.credentials.length > 0 ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {ns.credentials.map(cr => {
                  const credEc = envConfig[cr.environment] || envConfig.production
                  return (
                    <div key={cr.name} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '6px 0', borderBottom: `1px solid ${colors.border}` }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <span style={{ fontSize: 14 }}>🔑</span>
                        <span style={{ fontFamily: 'monospace', fontSize: 12, color: '#9cdcfe' }}>{cr.name}</span>
                      </div>
                      <div style={{ display: 'flex', gap: 6 }}>
                        <span style={badge('rgba(212, 168, 67, 0.06)', colors.textMuted)}>{cr.type}</span>
                        <span style={badge(credEc.bg, credEc.color)}>{cr.environment}</span>
                      </div>
                    </div>
                  )
                })}
              </div>
            ) : (
              <span style={{ color: colors.textDim, fontStyle: 'italic', fontSize: 13 }}>No credentials configured</span>
            )}
          </div>
        </div>

        {/* Budget Rules section */}
        {(() => {
          const nsRules = budgetRules[ns.id] || []
          const scopeIcon: Record<string, string> = { namespace: '🏢', team: '👥', model: '🧠' }
          const actionCfg: Record<string, { label: string; color: string; bg: string }> = {
            notify: { label: 'Notify', color: colors.blue, bg: 'rgba(96,165,250,0.12)' },
            throttle: { label: 'Throttle', color: colors.amber, bg: 'rgba(245,158,11,0.12)' },
            block: { label: 'Hard Block', color: colors.red, bg: 'rgba(239,68,68,0.12)' },
          }

          return (
            <div>
              <div style={sectionHeader}>
                <div style={sectionTitle}>
                  <span style={{ fontSize: 16 }}>💰</span>
                  <span>Budget Rules</span>
                  <span style={badge('rgba(212, 168, 67, 0.12)', colors.gold)}>{nsRules.length}</span>
                </div>
                <button onClick={openBudgetModal} style={{
                  padding: '6px 14px', borderRadius: 6, border: '1px solid rgba(212, 168, 67, 0.3)',
                  backgroundColor: 'rgba(212, 168, 67, 0.1)', color: colors.gold,
                  fontSize: 12, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit',
                }}>
                  + Create Rule
                </button>
              </div>

              {nsRules.length === 0 ? (
                <div style={{ ...card, textAlign: 'center', padding: 32 }}>
                  <div style={{ fontSize: 28, marginBottom: 8 }}>💰</div>
                  <div style={{ color: colors.textMuted, fontSize: 13, marginBottom: 12 }}>No budget rules configured for this namespace</div>
                  <button onClick={openBudgetModal} style={{
                    padding: '8px 18px', borderRadius: 6, border: 'none',
                    backgroundColor: colors.gold, color: '#0A0A0A',
                    fontSize: 12, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit',
                  }}>
                    Create First Budget Rule
                  </button>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  {nsRules.map(rule => {
                    const pct = Math.round((rule.spent / rule.limitAmount) * 100)
                    const barColor = pct > 100 ? colors.red : pct >= 80 ? colors.amber : colors.green
                    const remaining = rule.limitAmount - rule.spent
                    const ac = actionCfg[rule.action]
                    return (
                      <div key={rule.id} style={{
                        ...card, borderLeft: `3px solid ${barColor}`,
                        opacity: rule.status === 'paused' ? 0.6 : 1,
                      }}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                            <span style={{ fontSize: 14 }}>{scopeIcon[rule.scope]}</span>
                            <span style={{ fontSize: 13, fontWeight: 600, color: '#fff' }}>{rule.name}</span>
                            {rule.status === 'paused' && <span style={badge('rgba(102,102,102,0.2)', colors.textDim)}>Paused</span>}
                          </div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                            <span style={badge(ac.bg, ac.color)}>{ac.label}</span>
                            <span style={badge('rgba(212,168,67,0.06)', colors.textMuted)}>{rule.period}</span>
                            <button
                              onClick={() => handleToggleBudgetRule(rule.id)}
                              title={rule.status === 'active' ? 'Pause rule' : 'Activate rule'}
                              style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 14, color: rule.status === 'active' ? colors.amber : colors.green, padding: '0 4px' }}
                            >
                              {rule.status === 'active' ? '⏸' : '▶'}
                            </button>
                            <button
                              onClick={() => handleDeleteBudgetRule(rule.id)}
                              title="Delete rule"
                              style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 14, color: colors.red, padding: '0 4px' }}
                            >
                              ×
                            </button>
                          </div>
                        </div>

                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                          <span style={{ fontSize: 11, color: colors.textMuted }}>Scope:</span>
                          <span style={{ fontSize: 12, color: colors.gold, fontFamily: 'monospace' }}>{rule.scopeTarget}</span>
                          <span style={{ color: colors.textDim, fontSize: 11 }}>·</span>
                          <span style={{ fontSize: 11, color: colors.textMuted }}>Alerts at: {rule.alertThresholds.map(t => `${t}%`).join(', ')}</span>
                        </div>

                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                          <span style={{ fontSize: 12, color: colors.textMuted }}>
                            ${rule.spent.toLocaleString()} <span style={{ color: colors.textDim }}>of</span> ${rule.limitAmount.toLocaleString()}
                          </span>
                          <span style={{ fontSize: 12, fontWeight: 600, color: barColor }}>{pct}%</span>
                        </div>

                        <div style={{ height: 6, backgroundColor: 'rgba(212,168,67,0.06)', borderRadius: 3, overflow: 'hidden', marginBottom: 6 }}>
                          <div style={{ height: '100%', width: `${Math.min(pct, 100)}%`, backgroundColor: barColor, borderRadius: 3, transition: 'width 0.4s ease' }} />
                        </div>

                        <div style={{ fontSize: 11, color: remaining >= 0 ? colors.green : colors.red, fontWeight: 600 }}>
                          {remaining >= 0 ? `$${remaining.toLocaleString()} remaining` : `$${Math.abs(remaining).toLocaleString()} over budget`}
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          )
        })()}

        {/* Budget Rule Create Modal */}
        {showBudgetModal && (
          <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.6)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <div style={{ backgroundColor: '#1A1A1A', border: `1px solid ${colors.border}`, borderRadius: 10, padding: 24, width: 480, maxHeight: '80vh', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div style={{ fontSize: 16, fontWeight: 700, color: '#fff' }}>Create Budget Rule</div>
              <div style={{ fontSize: 12, color: colors.textMuted }}>Set spending limits with alerts and enforcement actions for this namespace.</div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                <label style={{ fontSize: 12, color: colors.textMuted }}>Rule Name</label>
                <input type="text" value={budgetForm.name} onChange={(e) => setBudgetForm(p => ({ ...p, name: e.target.value }))} placeholder="e.g. Monthly GPT-4o Cap" style={{ padding: '8px 12px', borderRadius: 6, border: `1px solid ${colors.border}`, backgroundColor: '#111', color: colors.text, fontSize: 13, fontFamily: 'inherit', outline: 'none' }} />
              </div>

              <div style={{ display: 'flex', gap: 12 }}>
                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 6 }}>
                  <label style={{ fontSize: 12, color: colors.textMuted }}>Scope</label>
                  <div style={{ display: 'flex', gap: 6 }}>
                    {(['namespace', 'team', 'model'] as const).map(s => (
                      <button
                        key={s}
                        onClick={() => setBudgetForm(p => ({ ...p, scope: s, scopeTarget: s === 'namespace' ? (selectedNs?.name || '') : '' }))}
                        style={{
                          flex: 1, padding: '8px 4px', borderRadius: 6, border: `1px solid ${budgetForm.scope === s ? colors.gold : colors.border}`,
                          backgroundColor: budgetForm.scope === s ? 'rgba(212,168,67,0.12)' : 'transparent',
                          color: budgetForm.scope === s ? colors.gold : colors.textMuted,
                          fontSize: 12, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit',
                          display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2,
                        }}
                      >
                        <span style={{ fontSize: 16 }}>{{ namespace: '🏢', team: '👥', model: '🧠' }[s]}</span>
                        {s.charAt(0).toUpperCase() + s.slice(1)}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {budgetForm.scope !== 'namespace' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  <label style={{ fontSize: 12, color: colors.textMuted }}>
                    {budgetForm.scope === 'team' ? 'Team Name' : 'Model Name'}
                  </label>
                  {budgetForm.scope === 'model' ? (
                    <select
                      value={budgetForm.scopeTarget}
                      onChange={(e) => setBudgetForm(p => ({ ...p, scopeTarget: e.target.value }))}
                      style={{ padding: '8px 12px', borderRadius: 6, border: `1px solid ${colors.border}`, backgroundColor: '#111', color: colors.text, fontSize: 13, fontFamily: 'inherit', cursor: 'pointer', outline: 'none' }}
                    >
                      <option value="">Select model...</option>
                      {['GPT-4o', 'GPT-4o-mini', 'Claude 3.5 Sonnet', 'Claude 3 Haiku', 'Gemini 1.5 Pro', 'Llama 3.1 70B'].map(m => (
                        <option key={m} value={m}>{m}</option>
                      ))}
                    </select>
                  ) : (
                    <input type="text" value={budgetForm.scopeTarget} onChange={(e) => setBudgetForm(p => ({ ...p, scopeTarget: e.target.value }))} placeholder="e.g. ML Platform" style={{ padding: '8px 12px', borderRadius: 6, border: `1px solid ${colors.border}`, backgroundColor: '#111', color: colors.text, fontSize: 13, fontFamily: 'inherit', outline: 'none' }} />
                  )}
                </div>
              )}

              <div style={{ display: 'flex', gap: 12 }}>
                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 6 }}>
                  <label style={{ fontSize: 12, color: colors.textMuted }}>Spend Limit ($)</label>
                  <input type="number" value={budgetForm.limitAmount} onChange={(e) => setBudgetForm(p => ({ ...p, limitAmount: e.target.value }))} placeholder="5000" style={{ padding: '8px 12px', borderRadius: 6, border: `1px solid ${colors.border}`, backgroundColor: '#111', color: colors.text, fontSize: 13, fontFamily: 'inherit', outline: 'none' }} />
                </div>
                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 6 }}>
                  <label style={{ fontSize: 12, color: colors.textMuted }}>Period</label>
                  <select value={budgetForm.period} onChange={(e) => setBudgetForm(p => ({ ...p, period: e.target.value as BudgetRule['period'] }))} style={{ padding: '8px 12px', borderRadius: 6, border: `1px solid ${colors.border}`, backgroundColor: '#111', color: colors.text, fontSize: 13, fontFamily: 'inherit', cursor: 'pointer', outline: 'none' }}>
                    <option value="daily">Daily</option>
                    <option value="weekly">Weekly</option>
                    <option value="monthly">Monthly</option>
                  </select>
                </div>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                <label style={{ fontSize: 12, color: colors.textMuted }}>When limit is reached</label>
                <div style={{ display: 'flex', gap: 8 }}>
                  {([
                    { key: 'notify' as const, label: '🔔 Notify Only', desc: 'Send alerts but allow traffic' },
                    { key: 'throttle' as const, label: '🔄 Throttle', desc: 'Rate-limit to reduce spend' },
                    { key: 'block' as const, label: '🛑 Hard Block', desc: 'Block all requests' },
                  ]).map(a => (
                    <button
                      key={a.key}
                      onClick={() => setBudgetForm(p => ({ ...p, action: a.key }))}
                      style={{
                        flex: 1, padding: '10px 8px', borderRadius: 6,
                        border: `1px solid ${budgetForm.action === a.key ? colors.gold : colors.border}`,
                        backgroundColor: budgetForm.action === a.key ? 'rgba(212,168,67,0.12)' : 'transparent',
                        color: budgetForm.action === a.key ? '#fff' : colors.textMuted,
                        fontSize: 12, cursor: 'pointer', fontFamily: 'inherit', textAlign: 'center',
                      }}
                    >
                      <div style={{ fontWeight: 600, marginBottom: 2 }}>{a.label}</div>
                      <div style={{ fontSize: 10, color: colors.textDim }}>{a.desc}</div>
                    </button>
                  ))}
                </div>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                <label style={{ fontSize: 12, color: colors.textMuted }}>Alert Thresholds</label>
                <div style={{ display: 'flex', gap: 8 }}>
                  {[60, 80, 90, 100].map(t => {
                    const isActive = budgetForm.alerts.includes(t)
                    return (
                      <button
                        key={t}
                        onClick={() => setBudgetForm(p => ({
                          ...p,
                          alerts: isActive ? p.alerts.filter(a => a !== t) : [...p.alerts, t].sort((a, b) => a - b),
                        }))}
                        style={{
                          padding: '6px 14px', borderRadius: 6,
                          border: `1px solid ${isActive ? colors.gold : colors.border}`,
                          backgroundColor: isActive ? 'rgba(212,168,67,0.12)' : 'transparent',
                          color: isActive ? colors.gold : colors.textMuted,
                          fontSize: 12, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit',
                        }}
                      >
                        {t}%
                      </button>
                    )
                  })}
                </div>
                <div style={{ fontSize: 11, color: colors.textDim }}>Select thresholds to receive alert notifications</div>
              </div>

              <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', marginTop: 4 }}>
                <button onClick={() => setShowBudgetModal(false)} style={{ padding: '8px 18px', borderRadius: 6, border: `1px solid ${colors.border}`, backgroundColor: 'transparent', color: colors.textMuted, fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}>Cancel</button>
                <button onClick={handleCreateBudgetRule} style={{ padding: '8px 18px', borderRadius: 6, border: 'none', backgroundColor: colors.gold, color: '#0A0A0A', fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}>Create Rule</button>
              </div>
            </div>
          </div>
        )}
      </div>
    )
  }

  /* ---- List view ---- */
  const tabs: { key: TabKey; label: string; count: number; icon?: string }[] = [
    { key: 'all', label: 'All', count: nsList.length },
    { key: 'managed', label: 'Managed', count: managedCount, icon: '🏢' },
    { key: 'personal', label: 'Personal', count: personalCount, icon: '👤' },
  ]

  return (
    <div style={{ color: colors.text, display: 'flex', flexDirection: 'column', gap: 20 }}>
      {/* Stat cards (matches Access page) */}
      <div style={{ display: 'flex', gap: 14, alignItems: 'stretch' }}>
        {[
          { label: 'Namespaces', value: nsList.length, color: colors.gold },
          { label: 'Managed', value: managedCount, color: colors.purple },
          { label: 'Personal', value: personalCount, color: colors.blue },
          { label: 'Total Assets', value: nsList.reduce((s, n) => s + n.totalAssets, 0), color: colors.green },
        ].map((s) => (
          <div key={s.label} style={{ backgroundColor: colors.card, border: `1px solid ${colors.border}`, borderRadius: 8, padding: 16, flex: 1, display: 'flex', flexDirection: 'column', gap: 4 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <span style={{ width: 8, height: 8, borderRadius: '50%', backgroundColor: s.color, display: 'inline-block', flexShrink: 0 }} />
              <span style={{ color: colors.textMuted, fontSize: 12 }}>{s.label}</span>
            </div>
            <span style={{ color: '#fff', fontSize: 28, fontWeight: 700, lineHeight: 1.1 }}>{s.value}</span>
          </div>
        ))}
      </div>

      {/* Toolbar */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <input
            type="text"
            placeholder="Search namespaces..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            style={{
              minWidth: 280, padding: '8px 12px', borderRadius: 6,
              border: '1px solid rgba(212, 168, 67, 0.10)', backgroundColor: '#1a1a1a',
              color: colors.text, fontSize: 13, fontFamily: 'inherit', outline: 'none',
            }}
          />
          <span style={{ color: colors.textMuted, fontSize: 13 }}>{filtered.length} result{filtered.length !== 1 ? 's' : ''}</span>
        </div>
        <button onClick={() => openCreateModal()} style={{
          padding: '8px 18px', borderRadius: 6, border: 'none',
          backgroundColor: colors.gold, color: '#0A0A0A',
          fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit',
        }}>
          + Create Namespace
        </button>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: 4 }}>
        {tabs.map(t => {
          const isActive = activeTab === t.key
          return (
            <button
              key={t.key}
              onClick={() => setActiveTab(t.key)}
              style={{
                ...tabBase,
                backgroundColor: isActive ? '#1A1A1A' : 'transparent',
                borderBottomColor: isActive ? colors.gold : 'transparent',
                color: isActive ? colors.gold : colors.textMuted,
              }}
            >
              {t.icon ? `${t.icon} ` : ''}{t.label} ({t.count})
            </button>
          )
        })}
      </div>

      {/* Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(380px, 1fr))', gap: 16 }}>
        {filtered.map(ns => {
          const tc = typeConfig[ns.type]
          const ec = envConfig[ns.environment]
          const isHovered = hoveredCard === ns.id

          const assetParts = [
            { label: 'models', count: ns.assetCount.models, color: colors.blue },
            { label: 'tools', count: ns.assetCount.tools, color: colors.green },
            { label: 'MCP', count: ns.assetCount.mcpServers, color: colors.amber },
            { label: 'agents', count: ns.assetCount.agents, color: colors.purple },
            { label: 'skills', count: ns.assetCount.skills, color: '#f87171' },
          ].filter(a => a.count > 0)

          return (
            <div
              key={ns.id}
              onClick={() => setSelectedNs(ns)}
              onMouseEnter={() => setHoveredCard(ns.id)}
              onMouseLeave={() => setHoveredCard(null)}
              style={{
                ...card,
                cursor: 'pointer',
                transition: 'all 0.15s',
                boxShadow: isHovered ? '0 4px 20px rgba(0,0,0,0.4)' : 'none',
                borderColor: isHovered ? 'rgba(212, 168, 67, 0.20)' : String(colors.border),
                display: 'flex',
                flexDirection: 'column',
                gap: 8,
              }}
            >
              {/* Row 1: Icon + Name + Env badge + Menu */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <span style={{
                  width: 32, height: 32, borderRadius: 8, backgroundColor: tc.bg,
                  display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 16, flexShrink: 0,
                }}>
                  {tc.icon}
                </span>
                <span style={{ fontSize: 14, fontWeight: 700, color: '#fff', flex: 1, minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={`${ns.displayName} (${ns.name})`}>{ns.displayName}</span>
                <span style={badge(ec.bg, ec.color)}>{ns.environment}</span>
                <div style={{ position: 'relative', flexShrink: 0 }}>
                  <button onClick={(e) => { e.stopPropagation(); setMenuOpenId(menuOpenId === ns.id ? null : ns.id); }} style={{ background: 'none', border: 'none', color: colors.textMuted, fontSize: 18, cursor: 'pointer', padding: '0 4px', lineHeight: 1 }}>⋯</button>
                  {menuOpenId === ns.id && (
                    <div style={{ position: 'absolute', top: 24, right: 0, backgroundColor: '#1A1A1A', border: `1px solid ${colors.border}`, borderRadius: 6, padding: 4, zIndex: 100, minWidth: 100, boxShadow: '0 4px 12px rgba(0,0,0,0.4)' }}>
                      <button onClick={(e) => { e.stopPropagation(); setMenuOpenId(null); openCreateModal(ns); }} style={{ display: 'block', width: '100%', textAlign: 'left', background: 'none', border: 'none', color: colors.text, fontSize: 13, padding: '6px 12px', cursor: 'pointer', fontFamily: 'inherit', borderRadius: 4 }}>Edit</button>
                      <button onClick={(e) => { e.stopPropagation(); handleDelete(ns.id); }} style={{ display: 'block', width: '100%', textAlign: 'left', background: 'none', border: 'none', color: colors.red, fontSize: 13, padding: '6px 12px', cursor: 'pointer', fontFamily: 'inherit', borderRadius: 4 }}>Delete</button>
                    </div>
                  )}
                </div>
              </div>

              {/* Row 2: Description */}
              <div style={{ color: colors.textMuted, fontSize: 13, lineHeight: 1.4, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {ns.description.length > 100 ? ns.description.slice(0, 100) + '…' : ns.description}
              </div>

              {/* Row 3: Compact asset stats */}
              {assetParts.length > 0 && (
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                  {assetParts.map((a, i) => (
                    <React.Fragment key={a.label}>
                      {i > 0 && <span style={{ color: colors.textDim, fontSize: 11 }}>·</span>}
                      <span style={{ fontSize: 12 }}>
                        <span style={{ fontWeight: 700, color: a.color }}>{a.count}</span>
                        {' '}
                        <span style={{ color: colors.textMuted }}>{a.label}</span>
                      </span>
                    </React.Fragment>
                  ))}
                </div>
              )}

              {/* Row 4: Budget indicator */}
              {(() => {
                const bs = getNsBudgetSummary(ns.id)
                if (!bs) return null
                const pct = bs.totalBudget > 0 ? Math.round((bs.totalSpent / bs.totalBudget) * 100) : 0
                const barColor = pct > 100 ? colors.red : pct >= 80 ? colors.amber : colors.green
                return (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 11 }}>
                    <span style={{ color: colors.textMuted }}>💰</span>
                    <span style={{ color: colors.textMuted }}>${bs.totalSpent.toLocaleString()} / ${bs.totalBudget.toLocaleString()}</span>
                    <div style={{ flex: 1, height: 4, backgroundColor: 'rgba(212,168,67,0.06)', borderRadius: 2, overflow: 'hidden' }}>
                      <div style={{ height: '100%', width: `${Math.min(pct, 100)}%`, backgroundColor: barColor, borderRadius: 2 }} />
                    </div>
                    <span style={{ color: barColor, fontWeight: 600 }}>{pct}%</span>
                    <span style={{ color: colors.textDim }}>{bs.rules} rule{bs.rules !== 1 ? 's' : ''}</span>
                  </div>
                )
              })()}

              {/* Row 5: Owner + Members */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: 12, color: colors.textDim }}>
                <span>{ns.owner}</span>
                <span>{ns.members.length} member{ns.members.length !== 1 ? 's' : ''}</span>
              </div>
            </div>
          )
        })}
      </div>

      {filtered.length === 0 && (
        <div style={{ textAlign: 'center', padding: 40, color: colors.textDim }}>
          No namespaces match your search.
        </div>
      )}

      {/* Create/Edit Namespace Modal */}
      {showCreateModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.6)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ backgroundColor: '#1A1A1A', border: `1px solid ${colors.border}`, borderRadius: 10, padding: 24, width: 420, maxHeight: '80vh', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div style={{ fontSize: 16, fontWeight: 700, color: '#fff' }}>{editingNs ? 'Edit Namespace' : 'Create Namespace'}</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              <label style={{ fontSize: 12, color: colors.textMuted }}>Name</label>
              <input type="text" value={formName} onChange={(e) => setFormName(e.target.value)} style={{ padding: '8px 12px', borderRadius: 6, border: `1px solid ${colors.border}`, backgroundColor: '#111', color: colors.text, fontSize: 13, fontFamily: 'inherit', outline: 'none' }} />
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              <label style={{ fontSize: 12, color: colors.textMuted }}>Environment</label>
              <select value={formEnv} onChange={(e) => setFormEnv(e.target.value as 'production' | 'staging' | 'development' | 'sandbox')} style={{ padding: '8px 12px', borderRadius: 6, border: `1px solid ${colors.border}`, backgroundColor: '#111', color: colors.text, fontSize: 13, fontFamily: 'inherit', cursor: 'pointer', outline: 'none' }}>
                <option value="production">Production</option>
                <option value="staging">Staging</option>
                <option value="development">Development</option>
                <option value="sandbox">Sandbox</option>
              </select>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              <label style={{ fontSize: 12, color: colors.textMuted }}>Description</label>
              <textarea value={formDesc} onChange={(e) => setFormDesc(e.target.value)} rows={3} style={{ padding: '8px 12px', borderRadius: 6, border: `1px solid ${colors.border}`, backgroundColor: '#111', color: colors.text, fontSize: 13, fontFamily: 'inherit', outline: 'none', resize: 'vertical' }} />
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              <label style={{ fontSize: 12, color: colors.textMuted }}>Token Budget</label>
              <input type="number" value={formBudget} onChange={(e) => setFormBudget(e.target.value)} placeholder="e.g. 100000" style={{ padding: '8px 12px', borderRadius: 6, border: `1px solid ${colors.border}`, backgroundColor: '#111', color: colors.text, fontSize: 13, fontFamily: 'inherit', outline: 'none' }} />
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              <label style={{ fontSize: 12, color: colors.textMuted }}>Owner</label>
              <input type="text" value={formOwner} onChange={(e) => setFormOwner(e.target.value)} placeholder="team@example.com" style={{ padding: '8px 12px', borderRadius: 6, border: `1px solid ${colors.border}`, backgroundColor: '#111', color: colors.text, fontSize: 13, fontFamily: 'inherit', outline: 'none' }} />
            </div>
            <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', marginTop: 8 }}>
              <button onClick={() => setShowCreateModal(false)} style={{ padding: '8px 18px', borderRadius: 6, border: `1px solid ${colors.border}`, backgroundColor: 'transparent', color: colors.textMuted, fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}>Cancel</button>
              <button onClick={handleCreateOrEdit} style={{ padding: '8px 18px', borderRadius: 6, border: 'none', backgroundColor: colors.gold, color: '#0A0A0A', fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}>{editingNs ? 'Save' : 'Create'}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default Namespaces
