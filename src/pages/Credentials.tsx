import React, { useState } from 'react';
import type { CSSProperties } from 'react';
import { useNavigate } from 'react-router-dom';

// --- Types ---
interface Credential {
  name: string;
  type: string;
  namespace: string;
  target: string;
  status: 'active' | 'expiring' | 'expired' | 'revoked';
  lastRotated: string;
  expires: string;
}

interface CredentialDependency {
  assets: { name: string; type: string; namespace: string }[];
  routes: { pattern: string; strategy: string; healthy: boolean }[];
  namespaces: string[];
  requests24h: number;
  recentAccess: { timestamp: string; method: string; path: string; consumer: string; status: number; latencyMs: number }[];
}


// --- Mock Data ---
const initialCredentials: Credential[] = [
  { name: 'azure-openai-eastus', type: 'API Key', namespace: 'retail-support', target: 'Azure OpenAI (East US)', status: 'active', lastRotated: '2 days ago', expires: '88 days' },
  { name: 'azure-openai-westus', type: 'API Key', namespace: 'retail-support', target: 'Azure OpenAI (West US)', status: 'active', lastRotated: '2 days ago', expires: '88 days' },
  { name: 'anthropic-prod', type: 'API Key', namespace: 'finance-analytics', target: 'Anthropic API', status: 'active', lastRotated: '14 days ago', expires: '76 days' },
  { name: 'gcp-vertex-sa', type: 'Service Account', namespace: 'finance-analytics', target: 'Google Vertex', status: 'expiring', lastRotated: '45 days ago', expires: '5 days' },
  { name: 'salesforce-oauth', type: 'OAuth 2.0', namespace: 'retail-support', target: 'Salesforce API', status: 'active', lastRotated: '7 days ago', expires: '23 days' },
  { name: 'entra-managed-id', type: 'Managed Identity', namespace: 'Global', target: 'Azure Resources', status: 'active', lastRotated: 'Auto', expires: 'Never' },
  { name: 'bedrock-iam', type: 'IAM Role', namespace: 'customer-ops', target: 'AWS Bedrock', status: 'active', lastRotated: '30 days ago', expires: '60 days' },
  { name: 'servicenow-api', type: 'API Key', namespace: 'hr-automation', target: 'ServiceNow', status: 'expired', lastRotated: '92 days ago', expires: 'Expired' },
  { name: 'jira-oauth', type: 'OAuth 2.0', namespace: 'dev-sandbox', target: 'Jira Cloud', status: 'expiring', lastRotated: '60 days ago', expires: '3 days' },
  { name: 'internal-db', type: 'Connection String', namespace: 'hr-automation', target: 'PostgreSQL', status: 'active', lastRotated: '15 days ago', expires: '45 days' },
];


const credentialDependencies: Record<string, CredentialDependency> = {
  'azure-openai-eastus': {
    assets: [
      { name: 'GPT-4o', type: 'model', namespace: 'retail-support' },
      { name: 'GPT-4o-mini', type: 'model', namespace: 'retail-support' },
      { name: 'Embedding Ada-002', type: 'model', namespace: 'retail-support' },
      { name: 'Support Summarizer', type: 'agent', namespace: 'retail-support' },
      { name: 'Content Moderator', type: 'tool', namespace: 'retail-support' },
    ],
    routes: [
      { pattern: '/v1/chat/completions', strategy: 'round-robin', healthy: true },
      { pattern: '/v1/embeddings', strategy: 'priority', healthy: true },
      { pattern: '/v1/moderations', strategy: 'failover', healthy: true },
    ],
    namespaces: ['retail-support', 'finance-analytics'],
    requests24h: 12400,
    recentAccess: [
      { timestamp: '2024-01-15T14:32:01Z', method: 'POST', path: '/v1/chat/completions', consumer: 'support-bot', status: 200, latencyMs: 342 },
      { timestamp: '2024-01-15T14:31:45Z', method: 'POST', path: '/v1/chat/completions', consumer: 'analytics-svc', status: 200, latencyMs: 289 },
      { timestamp: '2024-01-15T14:31:12Z', method: 'POST', path: '/v1/embeddings', consumer: 'search-indexer', status: 200, latencyMs: 156 },
      { timestamp: '2024-01-15T14:30:58Z', method: 'POST', path: '/v1/chat/completions', consumer: 'support-bot', status: 429, latencyMs: 12 },
      { timestamp: '2024-01-15T14:30:33Z', method: 'POST', path: '/v1/moderations', consumer: 'content-filter', status: 200, latencyMs: 98 },
      { timestamp: '2024-01-15T14:29:50Z', method: 'POST', path: '/v1/chat/completions', consumer: 'support-bot', status: 200, latencyMs: 410 },
      { timestamp: '2024-01-15T14:29:22Z', method: 'POST', path: '/v1/embeddings', consumer: 'search-indexer', status: 200, latencyMs: 134 },
      { timestamp: '2024-01-15T14:28:55Z', method: 'POST', path: '/v1/chat/completions', consumer: 'analytics-svc', status: 200, latencyMs: 267 },
    ],
  },
  'azure-openai-westus': {
    assets: [
      { name: 'GPT-4o (failover)', type: 'model', namespace: 'retail-support' },
      { name: 'GPT-4o-mini (failover)', type: 'model', namespace: 'retail-support' },
    ],
    routes: [
      { pattern: '/v1/chat/completions', strategy: 'failover', healthy: true },
      { pattern: '/v1/embeddings', strategy: 'failover', healthy: false },
    ],
    namespaces: ['retail-support'],
    requests24h: 1840,
    recentAccess: [
      { timestamp: '2024-01-15T14:20:01Z', method: 'POST', path: '/v1/chat/completions', consumer: 'support-bot', status: 200, latencyMs: 512 },
      { timestamp: '2024-01-15T13:55:22Z', method: 'POST', path: '/v1/chat/completions', consumer: 'analytics-svc', status: 200, latencyMs: 478 },
      { timestamp: '2024-01-15T13:40:10Z', method: 'POST', path: '/v1/embeddings', consumer: 'search-indexer', status: 503, latencyMs: 5002 },
      { timestamp: '2024-01-15T13:22:44Z', method: 'POST', path: '/v1/chat/completions', consumer: 'support-bot', status: 200, latencyMs: 390 },
      { timestamp: '2024-01-15T12:58:11Z', method: 'POST', path: '/v1/chat/completions', consumer: 'support-bot', status: 200, latencyMs: 445 },
      { timestamp: '2024-01-15T12:30:02Z', method: 'POST', path: '/v1/embeddings', consumer: 'search-indexer', status: 200, latencyMs: 189 },
      { timestamp: '2024-01-15T12:15:33Z', method: 'POST', path: '/v1/chat/completions', consumer: 'analytics-svc', status: 200, latencyMs: 367 },
      { timestamp: '2024-01-15T11:50:48Z', method: 'POST', path: '/v1/chat/completions', consumer: 'support-bot', status: 200, latencyMs: 401 },
    ],
  },
  'anthropic-prod': {
    assets: [
      { name: 'Claude 3.5 Sonnet', type: 'model', namespace: 'finance-analytics' },
      { name: 'Claude 3 Haiku', type: 'model', namespace: 'finance-analytics' },
      { name: 'Financial Analyst Agent', type: 'agent', namespace: 'finance-analytics' },
    ],
    routes: [
      { pattern: '/v1/messages', strategy: 'priority', healthy: true },
    ],
    namespaces: ['finance-analytics'],
    requests24h: 3200,
    recentAccess: [
      { timestamp: '2024-01-15T14:31:22Z', method: 'POST', path: '/v1/messages', consumer: 'fin-analyst', status: 200, latencyMs: 1230 },
      { timestamp: '2024-01-15T14:28:44Z', method: 'POST', path: '/v1/messages', consumer: 'fin-analyst', status: 200, latencyMs: 980 },
      { timestamp: '2024-01-15T14:25:10Z', method: 'POST', path: '/v1/messages', consumer: 'report-gen', status: 200, latencyMs: 2100 },
      { timestamp: '2024-01-15T14:22:55Z', method: 'POST', path: '/v1/messages', consumer: 'fin-analyst', status: 200, latencyMs: 1450 },
      { timestamp: '2024-01-15T14:18:30Z', method: 'POST', path: '/v1/messages', consumer: 'report-gen', status: 200, latencyMs: 1890 },
      { timestamp: '2024-01-15T14:15:02Z', method: 'POST', path: '/v1/messages', consumer: 'fin-analyst', status: 429, latencyMs: 8 },
      { timestamp: '2024-01-15T14:12:18Z', method: 'POST', path: '/v1/messages', consumer: 'fin-analyst', status: 200, latencyMs: 1100 },
      { timestamp: '2024-01-15T14:08:40Z', method: 'POST', path: '/v1/messages', consumer: 'report-gen', status: 200, latencyMs: 1670 },
    ],
  },
  'gcp-vertex-sa': {
    assets: [
      { name: 'Gemini 1.5 Pro', type: 'model', namespace: 'finance-analytics' },
    ],
    routes: [
      { pattern: '/v1/gemini/generate', strategy: 'single', healthy: true },
    ],
    namespaces: ['finance-analytics'],
    requests24h: 870,
    recentAccess: [
      { timestamp: '2024-01-15T14:29:10Z', method: 'POST', path: '/v1/gemini/generate', consumer: 'research-bot', status: 200, latencyMs: 890 },
      { timestamp: '2024-01-15T14:20:33Z', method: 'POST', path: '/v1/gemini/generate', consumer: 'research-bot', status: 200, latencyMs: 1020 },
      { timestamp: '2024-01-15T14:10:05Z', method: 'POST', path: '/v1/gemini/generate', consumer: 'research-bot', status: 200, latencyMs: 760 },
      { timestamp: '2024-01-15T13:55:44Z', method: 'POST', path: '/v1/gemini/generate', consumer: 'research-bot', status: 200, latencyMs: 930 },
      { timestamp: '2024-01-15T13:40:22Z', method: 'POST', path: '/v1/gemini/generate', consumer: 'research-bot', status: 200, latencyMs: 845 },
      { timestamp: '2024-01-15T13:25:11Z', method: 'POST', path: '/v1/gemini/generate', consumer: 'research-bot', status: 200, latencyMs: 1100 },
      { timestamp: '2024-01-15T13:10:48Z', method: 'POST', path: '/v1/gemini/generate', consumer: 'research-bot', status: 200, latencyMs: 780 },
      { timestamp: '2024-01-15T12:55:30Z', method: 'POST', path: '/v1/gemini/generate', consumer: 'research-bot', status: 200, latencyMs: 910 },
    ],
  },
  'salesforce-oauth': {
    assets: [
      { name: 'CRM Lookup Tool', type: 'tool', namespace: 'retail-support' },
      { name: 'Lead Scoring Agent', type: 'agent', namespace: 'retail-support' },
    ],
    routes: [
      { pattern: '/v1/tools/crm-lookup', strategy: 'single', healthy: true },
      { pattern: '/v1/agents/lead-score', strategy: 'single', healthy: true },
    ],
    namespaces: ['retail-support'],
    requests24h: 2100,
    recentAccess: [
      { timestamp: '2024-01-15T14:30:55Z', method: 'POST', path: '/v1/tools/crm-lookup', consumer: 'support-bot', status: 200, latencyMs: 220 },
      { timestamp: '2024-01-15T14:28:12Z', method: 'POST', path: '/v1/agents/lead-score', consumer: 'sales-pipeline', status: 200, latencyMs: 540 },
      { timestamp: '2024-01-15T14:25:40Z', method: 'POST', path: '/v1/tools/crm-lookup', consumer: 'support-bot', status: 200, latencyMs: 198 },
      { timestamp: '2024-01-15T14:22:18Z', method: 'POST', path: '/v1/tools/crm-lookup', consumer: 'support-bot', status: 200, latencyMs: 245 },
      { timestamp: '2024-01-15T14:18:55Z', method: 'POST', path: '/v1/agents/lead-score', consumer: 'sales-pipeline', status: 200, latencyMs: 612 },
      { timestamp: '2024-01-15T14:15:30Z', method: 'POST', path: '/v1/tools/crm-lookup', consumer: 'support-bot', status: 200, latencyMs: 189 },
      { timestamp: '2024-01-15T14:12:08Z', method: 'POST', path: '/v1/tools/crm-lookup', consumer: 'support-bot', status: 200, latencyMs: 210 },
      { timestamp: '2024-01-15T14:08:44Z', method: 'POST', path: '/v1/agents/lead-score', consumer: 'sales-pipeline', status: 200, latencyMs: 580 },
    ],
  },
  'entra-managed-id': {
    assets: [
      { name: 'Azure Key Vault Resolver', type: 'tool', namespace: 'Global' },
      { name: 'Azure Storage Connector', type: 'tool', namespace: 'Global' },
      { name: 'Config Sync Agent', type: 'agent', namespace: 'Global' },
    ],
    routes: [
      { pattern: '/internal/keyvault/*', strategy: 'single', healthy: true },
      { pattern: '/internal/storage/*', strategy: 'single', healthy: true },
    ],
    namespaces: ['Global'],
    requests24h: 45200,
    recentAccess: [
      { timestamp: '2024-01-15T14:32:10Z', method: 'GET', path: '/internal/keyvault/secrets', consumer: 'config-sync', status: 200, latencyMs: 45 },
      { timestamp: '2024-01-15T14:32:08Z', method: 'GET', path: '/internal/storage/blobs', consumer: 'log-archiver', status: 200, latencyMs: 78 },
      { timestamp: '2024-01-15T14:32:05Z', method: 'GET', path: '/internal/keyvault/secrets', consumer: 'config-sync', status: 200, latencyMs: 42 },
      { timestamp: '2024-01-15T14:32:02Z', method: 'PUT', path: '/internal/storage/blobs', consumer: 'log-archiver', status: 201, latencyMs: 120 },
      { timestamp: '2024-01-15T14:31:58Z', method: 'GET', path: '/internal/keyvault/secrets', consumer: 'config-sync', status: 200, latencyMs: 38 },
      { timestamp: '2024-01-15T14:31:55Z', method: 'GET', path: '/internal/keyvault/secrets', consumer: 'config-sync', status: 200, latencyMs: 50 },
      { timestamp: '2024-01-15T14:31:50Z', method: 'GET', path: '/internal/storage/blobs', consumer: 'log-archiver', status: 200, latencyMs: 65 },
      { timestamp: '2024-01-15T14:31:45Z', method: 'GET', path: '/internal/keyvault/secrets', consumer: 'config-sync', status: 200, latencyMs: 41 },
    ],
  },
  'bedrock-iam': {
    assets: [
      { name: 'Claude 3 (Bedrock)', type: 'model', namespace: 'customer-ops' },
      { name: 'Titan Embeddings', type: 'model', namespace: 'customer-ops' },
    ],
    routes: [
      { pattern: '/v1/bedrock/invoke', strategy: 'priority', healthy: true },
    ],
    namespaces: ['customer-ops'],
    requests24h: 1560,
    recentAccess: [
      { timestamp: '2024-01-15T14:30:20Z', method: 'POST', path: '/v1/bedrock/invoke', consumer: 'ops-assistant', status: 200, latencyMs: 1340 },
      { timestamp: '2024-01-15T14:25:18Z', method: 'POST', path: '/v1/bedrock/invoke', consumer: 'ops-assistant', status: 200, latencyMs: 1120 },
      { timestamp: '2024-01-15T14:20:05Z', method: 'POST', path: '/v1/bedrock/invoke', consumer: 'ticket-classifier', status: 200, latencyMs: 890 },
      { timestamp: '2024-01-15T14:15:44Z', method: 'POST', path: '/v1/bedrock/invoke', consumer: 'ops-assistant', status: 200, latencyMs: 1250 },
      { timestamp: '2024-01-15T14:10:30Z', method: 'POST', path: '/v1/bedrock/invoke', consumer: 'ticket-classifier', status: 200, latencyMs: 920 },
      { timestamp: '2024-01-15T14:05:15Z', method: 'POST', path: '/v1/bedrock/invoke', consumer: 'ops-assistant', status: 200, latencyMs: 1380 },
      { timestamp: '2024-01-15T14:00:02Z', method: 'POST', path: '/v1/bedrock/invoke', consumer: 'ticket-classifier', status: 200, latencyMs: 870 },
      { timestamp: '2024-01-15T13:55:48Z', method: 'POST', path: '/v1/bedrock/invoke', consumer: 'ops-assistant', status: 200, latencyMs: 1190 },
    ],
  },
  'servicenow-api': {
    assets: [
      { name: 'Ticket Creator Tool', type: 'tool', namespace: 'hr-automation' },
    ],
    routes: [
      { pattern: '/v1/tools/servicenow/*', strategy: 'single', healthy: false },
    ],
    namespaces: ['hr-automation'],
    requests24h: 0,
    recentAccess: [
      { timestamp: '2024-01-12T09:15:30Z', method: 'POST', path: '/v1/tools/servicenow/tickets', consumer: 'hr-bot', status: 401, latencyMs: 45 },
      { timestamp: '2024-01-12T09:10:22Z', method: 'POST', path: '/v1/tools/servicenow/tickets', consumer: 'hr-bot', status: 401, latencyMs: 38 },
      { timestamp: '2024-01-12T09:05:10Z', method: 'POST', path: '/v1/tools/servicenow/tickets', consumer: 'hr-bot', status: 200, latencyMs: 320 },
      { timestamp: '2024-01-12T09:00:05Z', method: 'POST', path: '/v1/tools/servicenow/tickets', consumer: 'hr-bot', status: 200, latencyMs: 298 },
      { timestamp: '2024-01-12T08:55:48Z', method: 'POST', path: '/v1/tools/servicenow/tickets', consumer: 'hr-bot', status: 200, latencyMs: 310 },
      { timestamp: '2024-01-12T08:50:30Z', method: 'POST', path: '/v1/tools/servicenow/tickets', consumer: 'hr-bot', status: 200, latencyMs: 275 },
      { timestamp: '2024-01-12T08:45:15Z', method: 'POST', path: '/v1/tools/servicenow/tickets', consumer: 'hr-bot', status: 200, latencyMs: 340 },
      { timestamp: '2024-01-12T08:40:02Z', method: 'POST', path: '/v1/tools/servicenow/tickets', consumer: 'hr-bot', status: 200, latencyMs: 290 },
    ],
  },
  'jira-oauth': {
    assets: [
      { name: 'Jira Issue Tracker', type: 'tool', namespace: 'dev-sandbox' },
      { name: 'Sprint Planning Agent', type: 'agent', namespace: 'dev-sandbox' },
    ],
    routes: [
      { pattern: '/v1/tools/jira/*', strategy: 'single', healthy: true },
    ],
    namespaces: ['dev-sandbox'],
    requests24h: 420,
    recentAccess: [
      { timestamp: '2024-01-15T14:28:30Z', method: 'GET', path: '/v1/tools/jira/issues', consumer: 'sprint-planner', status: 200, latencyMs: 180 },
      { timestamp: '2024-01-15T14:20:15Z', method: 'POST', path: '/v1/tools/jira/issues', consumer: 'sprint-planner', status: 201, latencyMs: 340 },
      { timestamp: '2024-01-15T14:12:44Z', method: 'GET', path: '/v1/tools/jira/issues', consumer: 'dev-assistant', status: 200, latencyMs: 165 },
      { timestamp: '2024-01-15T14:05:22Z', method: 'PUT', path: '/v1/tools/jira/issues', consumer: 'sprint-planner', status: 200, latencyMs: 210 },
      { timestamp: '2024-01-15T13:58:10Z', method: 'GET', path: '/v1/tools/jira/issues', consumer: 'sprint-planner', status: 200, latencyMs: 155 },
      { timestamp: '2024-01-15T13:50:55Z', method: 'GET', path: '/v1/tools/jira/issues', consumer: 'dev-assistant', status: 200, latencyMs: 172 },
      { timestamp: '2024-01-15T13:42:30Z', method: 'POST', path: '/v1/tools/jira/issues', consumer: 'sprint-planner', status: 201, latencyMs: 320 },
      { timestamp: '2024-01-15T13:35:18Z', method: 'GET', path: '/v1/tools/jira/issues', consumer: 'sprint-planner', status: 200, latencyMs: 148 },
    ],
  },
  'internal-db': {
    assets: [
      { name: 'HR Database Connector', type: 'tool', namespace: 'hr-automation' },
    ],
    routes: [
      { pattern: '/v1/tools/hr-db/*', strategy: 'single', healthy: true },
    ],
    namespaces: ['hr-automation'],
    requests24h: 680,
    recentAccess: [
      { timestamp: '2024-01-15T14:31:50Z', method: 'GET', path: '/v1/tools/hr-db/employees', consumer: 'hr-bot', status: 200, latencyMs: 45 },
      { timestamp: '2024-01-15T14:28:30Z', method: 'GET', path: '/v1/tools/hr-db/departments', consumer: 'hr-bot', status: 200, latencyMs: 32 },
      { timestamp: '2024-01-15T14:25:10Z', method: 'GET', path: '/v1/tools/hr-db/employees', consumer: 'hr-bot', status: 200, latencyMs: 48 },
      { timestamp: '2024-01-15T14:20:55Z', method: 'POST', path: '/v1/tools/hr-db/query', consumer: 'hr-analytics', status: 200, latencyMs: 120 },
      { timestamp: '2024-01-15T14:15:30Z', method: 'GET', path: '/v1/tools/hr-db/employees', consumer: 'hr-bot', status: 200, latencyMs: 38 },
      { timestamp: '2024-01-15T14:10:12Z', method: 'GET', path: '/v1/tools/hr-db/departments', consumer: 'hr-bot', status: 200, latencyMs: 30 },
      { timestamp: '2024-01-15T14:05:48Z', method: 'POST', path: '/v1/tools/hr-db/query', consumer: 'hr-analytics', status: 200, latencyMs: 115 },
      { timestamp: '2024-01-15T14:00:22Z', method: 'GET', path: '/v1/tools/hr-db/employees', consumer: 'hr-bot', status: 200, latencyMs: 42 },
    ],
  },
};


const assetTypeEmoji: Record<string, string> = {
  model: '🧠',
  tool: '🔧',
  agent: '🤖',
};

// --- Styles ---
const card: CSSProperties = {
  backgroundColor: '#161616',
  borderRadius: 8,
  border: '1px solid rgba(212, 168, 67, 0.10)',
  padding: 20,
};

const statusColors: Record<string, string> = {
  active: '#4ADE80',
  expiring: '#F59E0B',
  expired: '#EF4444',
  revoked: '#EF4444',
};

const statusLabels: Record<string, string> = {
  active: '✓ Active',
  expiring: '⚠ Expiring',
  expired: '✗ Expired',
  revoked: '✗ Revoked',
};

const Credentials: React.FC = () => {
  const [hoveredRow, setHoveredRow] = useState<number | null>(null);
  const [selectedCredential, setSelectedCredential] = useState<Credential | null>(null);
  const navigate = useNavigate();
  const [credList, setCredList] = useState<Credential[]>(initialCredentials);
  const [showAddCredential, setShowAddCredential] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [rotateMsg, setRotateMsg] = useState<string | null>(null);
  const [showEditScope, setShowEditScope] = useState(false);
  const [editScopeData, setEditScopeData] = useState<{
    primaryNamespace: string;
    sharedNamespaces: string[];
    assetBindings: { name: string; type: string; namespace: string; bound: boolean }[];
    environment: string;
  }>({ primaryNamespace: '', sharedNamespaces: [], assetBindings: [], environment: 'Production' });
  const [credFormData, setCredFormData] = useState({ name: '', type: 'API Key', provider: '', namespace: 'ai-platform', expires: '' });
  const [addCredStep, setAddCredStep] = useState(1);
  const [credAssignments, setCredAssignments] = useState<Record<string, boolean>>({});
  const [assignMode, setAssignMode] = useState<'namespace' | 'asset'>('namespace');
  const [assignNsSelections, setAssignNsSelections] = useState<Record<string, boolean>>({});
  const [assignAssetSearch, setAssignAssetSearch] = useState('');
  const [credToast, setCredToast] = useState<string | null>(null);
  const showCredToast = (msg: string) => { setCredToast(msg); setTimeout(() => setCredToast(null), 3000); };

  const filteredCreds = credList.filter(c => {
    const matchesSearch = searchTerm === '' || c.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || c.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const handleAddCredential = () => {
    const newCred: Credential = {
      name: credFormData.name,
      type: credFormData.type,
      namespace: credFormData.namespace,
      target: credFormData.provider,
      status: 'active',
      lastRotated: 'Just now',
      expires: credFormData.expires || '90 days',
    };
    setCredList(prev => [...prev, newCred]);
    setShowAddCredential(false);
    setAddCredStep(1);
    setCredAssignments({});
    setAssignMode('namespace');
    setAssignNsSelections({});
    setAssignAssetSearch('');
    setCredFormData({ name: '', type: 'API Key', provider: '', namespace: 'ai-platform', expires: '' });
    const assignedAssets = Object.entries(credAssignments).filter(([, v]) => v).length;
    const assignedNs = Object.entries(assignNsSelections).filter(([, v]) => v).length;
    const parts: string[] = [];
    if (assignedNs > 0) parts.push(`${assignedNs} namespace${assignedNs !== 1 ? 's' : ''}`);
    if (assignedAssets > 0) parts.push(`${assignedAssets} asset${assignedAssets !== 1 ? 's' : ''}`);
    showCredToast(`✓ Credential "${newCred.name}" created${parts.length > 0 ? ` and assigned to ${parts.join(' and ')}` : ''}`);
  };

  const allNamespaces = ['retail-support', 'finance-analytics', 'customer-ops', 'hr-automation', 'dev-sandbox', 'Global', 'ai-platform', 'ml-inference', 'research-sandbox'];

  const allAvailableAssets: { name: string; type: string; namespace: string }[] = [
    { name: 'GPT-4o', type: 'model', namespace: 'retail-support' },
    { name: 'GPT-4o-mini', type: 'model', namespace: 'retail-support' },
    { name: 'Embedding Ada-002', type: 'model', namespace: 'retail-support' },
    { name: 'Claude 3.5 Sonnet', type: 'model', namespace: 'finance-analytics' },
    { name: 'Claude 3 Haiku', type: 'model', namespace: 'finance-analytics' },
    { name: 'Gemini 1.5 Pro', type: 'model', namespace: 'finance-analytics' },
    { name: 'Claude 3 (Bedrock)', type: 'model', namespace: 'customer-ops' },
    { name: 'Titan Embeddings', type: 'model', namespace: 'customer-ops' },
    { name: 'Support Summarizer', type: 'agent', namespace: 'retail-support' },
    { name: 'Financial Analyst Agent', type: 'agent', namespace: 'finance-analytics' },
    { name: 'Config Sync Agent', type: 'agent', namespace: 'Global' },
    { name: 'Sprint Planning Agent', type: 'agent', namespace: 'dev-sandbox' },
    { name: 'Lead Scoring Agent', type: 'agent', namespace: 'retail-support' },
    { name: 'Content Moderator', type: 'tool', namespace: 'retail-support' },
    { name: 'CRM Lookup Tool', type: 'tool', namespace: 'retail-support' },
    { name: 'Jira Issue Tracker', type: 'tool', namespace: 'dev-sandbox' },
    { name: 'Ticket Creator Tool', type: 'tool', namespace: 'hr-automation' },
    { name: 'HR Database Connector', type: 'tool', namespace: 'hr-automation' },
    { name: 'Azure Key Vault Resolver', type: 'tool', namespace: 'Global' },
    { name: 'Azure Storage Connector', type: 'tool', namespace: 'Global' },
  ];

  const openEditScope = () => {
    if (!selectedCredential) return;
    const deps = credentialDependencies[selectedCredential.name];
    const boundAssetNames = deps ? deps.assets.map(a => a.name) : [];
    const sharedNs = deps ? deps.namespaces.filter(n => n !== selectedCredential.namespace) : [];

    const assetBindings = allAvailableAssets.map(a => ({
      ...a,
      bound: boundAssetNames.includes(a.name),
    }));

    setEditScopeData({
      primaryNamespace: selectedCredential.namespace,
      sharedNamespaces: sharedNs,
      assetBindings,
      environment: 'Production',
    });
    setShowEditScope(true);
  };

  const handleSaveScope = () => {
    if (!selectedCredential) return;
    // Update the credential's namespace
    setCredList(prev => prev.map(c =>
      c.name === selectedCredential.name ? { ...c, namespace: editScopeData.primaryNamespace } : c
    ));
    setSelectedCredential({ ...selectedCredential, namespace: editScopeData.primaryNamespace });
    setShowEditScope(false);
    showCredToast(`✓ Scope updated — ${editScopeData.assetBindings.filter(a => a.bound).length} assets bound, ${editScopeData.sharedNamespaces.length + 1} namespace(s)`);
  };

  // --- Stat cards ---
  const stats: { label: string; value: number | string; color?: string }[] = [
    { label: 'Total Credentials', value: 47 },
    { label: 'Healthy', value: 41, color: '#4ADE80' },
    { label: 'Expiring Soon', value: 4, color: '#F59E0B' },
    { label: 'Expired', value: 2, color: '#EF4444' },
  ];

  // --- Blast Radius Detail View ---
  if (selectedCredential) {
    const deps = credentialDependencies[selectedCredential.name];
    const fallbackDeps: CredentialDependency = {
      assets: [], routes: [], namespaces: [selectedCredential.namespace], requests24h: 0, recentAccess: [],
    };
    const d = deps || fallbackDeps;

    const formatTimestamp = (ts: string) => {
      const date = new Date(ts);
      return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false });
    };

    const formatRequests = (n: number) => {
      if (n >= 1000) return `${(n / 1000).toFixed(1)}K`;
      return String(n);
    };

    const impactStats = [
      { label: 'Dependent Assets', value: d.assets.length, color: '#D4A843' },
      { label: 'Active Routes', value: d.routes.length, color: '#A78BFA' },
      { label: 'Namespaces', value: d.namespaces.length, color: '#4ADE80' },
      { label: 'Requests (24h)', value: formatRequests(d.requests24h), color: '#F59E0B' },
    ];

    return (
      <div style={{ color: '#e0e0e0', display: 'flex', flexDirection: 'column', gap: 20 }}>
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap' }}>
          <button
            onClick={() => setSelectedCredential(null)}
            style={{
              background: 'none', border: 'none', color: '#D4A843', cursor: 'pointer',
              fontSize: 14, fontWeight: 500, padding: 0, display: 'flex', alignItems: 'center', gap: 6,
            }}
          >
            ← Back to Credentials
          </button>
          <span style={{ fontSize: 18, fontWeight: 700, color: '#fff' }}>{selectedCredential.name}</span>
          <span style={{
            backgroundColor: '#1E1E1E', padding: '2px 10px', borderRadius: 4, fontSize: 12, color: '#ccc',
          }}>{selectedCredential.type}</span>
          <span style={{
            display: 'inline-flex', alignItems: 'center', gap: 6,
          }}>
            <span style={{
              width: 8, height: 8, borderRadius: '50%',
              backgroundColor: statusColors[selectedCredential.status], display: 'inline-block',
            }} />
            <span style={{ color: statusColors[selectedCredential.status], fontSize: 13 }}>
              {statusLabels[selectedCredential.status]}
            </span>
          </span>
        </div>

        {/* Action Buttons */}
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'center' }}>
          <button
            onClick={() => { setRotateMsg('Credential rotated successfully ✓'); setTimeout(() => setRotateMsg(null), 2000); }}
            style={{ backgroundColor: 'transparent', color: '#D4A843', border: '1px solid #D4A843', borderRadius: 6, padding: '6px 16px', fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}
          >Rotate</button>
          <button
            onClick={() => { if (confirm('Revoke this credential?')) { setCredList(prev => prev.map(c => c.name === selectedCredential.name ? { ...c, status: 'revoked' as const } : c)); setSelectedCredential(null); } }}
            style={{ backgroundColor: 'transparent', color: '#EF4444', border: '1px solid #EF4444', borderRadius: 6, padding: '6px 16px', fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}
          >Revoke</button>
          <button
            onClick={openEditScope}
            style={{ backgroundColor: 'transparent', color: '#D4A843', border: '1px solid #D4A843', borderRadius: 6, padding: '6px 16px', fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}
          >Edit Scope</button>
          {rotateMsg && <span style={{ color: '#4ADE80', fontSize: 13 }}>{rotateMsg}</span>}
        </div>

        {/* Impact Summary */}
        <div style={{ display: 'flex', gap: 14, alignItems: 'stretch' }}>
          {impactStats.map((s) => (
            <div key={s.label} style={{ ...card, padding: 16, flex: 1, display: 'flex', flexDirection: 'column', gap: 4 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <span style={{ width: 8, height: 8, borderRadius: '50%', backgroundColor: s.color, display: 'inline-block', flexShrink: 0 }} />
                <span style={{ color: '#999', fontSize: 12 }}>{s.label}</span>
              </div>
              <span style={{ color: '#fff', fontSize: 28, fontWeight: 700, lineHeight: 1.1 }}>{s.value}</span>
            </div>
          ))}
        </div>

        {/* Dependent Assets */}
        <div style={{ ...card, padding: 0, overflow: 'hidden' }}>
          <div style={{ padding: '16px 20px', borderBottom: '1px solid rgba(212, 168, 67, 0.10)', fontWeight: 600, fontSize: 14 }}>
            Dependent Assets
          </div>
          {d.assets.length === 0 ? (
            <div style={{ padding: '20px', color: '#666', fontSize: 13 }}>No dependent assets found.</div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              {d.assets.map((asset, i) => (
                <div
                  key={`${asset.name}-${i}`}
                  onClick={() => navigate('/assets')}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 12, padding: '12px 20px',
                    borderBottom: i < d.assets.length - 1 ? '1px solid rgba(212, 168, 67, 0.06)' : 'none',
                    cursor: 'pointer', transition: 'background-color 0.15s',
                  }}
                  onMouseEnter={(e) => { (e.currentTarget as HTMLDivElement).style.backgroundColor = '#1E1E1E'; }}
                  onMouseLeave={(e) => { (e.currentTarget as HTMLDivElement).style.backgroundColor = 'transparent'; }}
                >
                  <span style={{ fontSize: 18 }}>{assetTypeEmoji[asset.type] || '📦'}</span>
                  <span style={{ color: '#e0e0e0', fontWeight: 500, fontSize: 13, flex: 1 }}>{asset.name}</span>
                  <span style={{
                    backgroundColor: '#1E1E1E', padding: '2px 8px', borderRadius: 4, fontSize: 11, color: '#999',
                  }}>{asset.namespace}</span>
                  <span style={{ width: 8, height: 8, borderRadius: '50%', backgroundColor: '#4ADE80', display: 'inline-block' }} />
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Routing Rules */}
        <div style={{ ...card, padding: 0, overflow: 'hidden' }}>
          <div style={{ padding: '16px 20px', borderBottom: '1px solid rgba(212, 168, 67, 0.10)', fontWeight: 600, fontSize: 14 }}>
            Routing Rules
          </div>
          {d.routes.length === 0 ? (
            <div style={{ padding: '20px', color: '#666', fontSize: 13 }}>No routing rules found.</div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              {d.routes.map((route, i) => (
                <div
                  key={`${route.pattern}-${i}`}
                  onClick={() => navigate('/routing')}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 12, padding: '12px 20px',
                    borderBottom: i < d.routes.length - 1 ? '1px solid rgba(212, 168, 67, 0.06)' : 'none',
                    cursor: 'pointer', transition: 'background-color 0.15s',
                  }}
                  onMouseEnter={(e) => { (e.currentTarget as HTMLDivElement).style.backgroundColor = '#1E1E1E'; }}
                  onMouseLeave={(e) => { (e.currentTarget as HTMLDivElement).style.backgroundColor = 'transparent'; }}
                >
                  <code style={{ color: '#D4A843', fontSize: 13, flex: 1, fontFamily: 'monospace' }}>{route.pattern}</code>
                  <span style={{
                    backgroundColor: '#1E1E1E', padding: '2px 8px', borderRadius: 4, fontSize: 11, color: '#A78BFA',
                  }}>{route.strategy}</span>
                  <span style={{
                    width: 8, height: 8, borderRadius: '50%',
                    backgroundColor: route.healthy ? '#4ADE80' : '#EF4444', display: 'inline-block',
                  }} />
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Access Audit */}
        <div style={{ ...card, padding: 0, overflow: 'hidden' }}>
          <div style={{ padding: '16px 20px', borderBottom: '1px solid rgba(212, 168, 67, 0.10)', fontWeight: 600, fontSize: 14 }}>
            Recent Access (Last 24h)
          </div>
          {d.recentAccess.length === 0 ? (
            <div style={{ padding: '20px', color: '#666', fontSize: 13 }}>No recent access records.</div>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid rgba(212, 168, 67, 0.10)', color: '#999', textAlign: 'left' }}>
                    {['Timestamp', 'Method', 'Path', 'Consumer', 'Status', 'Latency'].map((h) => (
                      <th key={h} style={{ padding: '10px 16px', fontWeight: 600, fontSize: 11, whiteSpace: 'nowrap' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {d.recentAccess.map((access, i) => (
                    <tr
                      key={`${access.timestamp}-${i}`}
                      onClick={() => navigate('/logs')}
                      style={{
                        borderBottom: '1px solid rgba(212, 168, 67, 0.06)', cursor: 'pointer', transition: 'background-color 0.15s',
                      }}
                      onMouseEnter={(e) => { (e.currentTarget as HTMLTableRowElement).style.backgroundColor = '#1E1E1E'; }}
                      onMouseLeave={(e) => { (e.currentTarget as HTMLTableRowElement).style.backgroundColor = 'transparent'; }}
                    >
                      <td style={{ padding: '8px 16px', color: '#999', fontFamily: 'monospace', whiteSpace: 'nowrap' }}>{formatTimestamp(access.timestamp)}</td>
                      <td style={{ padding: '8px 16px' }}>
                        <span style={{
                          backgroundColor: access.method === 'GET' ? '#1a3a2a' : access.method === 'POST' ? '#1a2a3a' : '#2a2a1a',
                          color: access.method === 'GET' ? '#4ADE80' : access.method === 'POST' ? '#D4A843' : '#F59E0B',
                          padding: '1px 6px', borderRadius: 3, fontSize: 11, fontWeight: 600, fontFamily: 'monospace',
                        }}>{access.method}</span>
                      </td>
                      <td style={{ padding: '8px 16px', color: '#bbb', fontFamily: 'monospace', fontSize: 11 }}>{access.path}</td>
                      <td style={{ padding: '8px 16px', color: '#ccc' }}>{access.consumer}</td>
                      <td style={{ padding: '8px 16px' }}>
                        <span style={{
                          color: access.status < 300 ? '#4ADE80' : access.status < 400 ? '#F59E0B' : '#EF4444',
                          fontWeight: 600, fontFamily: 'monospace',
                        }}>{access.status}</span>
                      </td>
                      <td style={{ padding: '8px 16px', color: '#999', fontFamily: 'monospace' }}>{access.latencyMs}ms</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Emergency Actions */}
        <div style={{
          ...card,
          backgroundColor: '#2a1a1a',
          border: '1px solid #4a2020',
        }}>
          <div style={{ fontWeight: 600, fontSize: 14, marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
            🚨 Emergency Response
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 14, flexWrap: 'wrap' }}>
              <button style={{
                backgroundColor: '#EF4444', color: '#fff', border: 'none', borderRadius: 6,
                padding: '8px 18px', fontWeight: 600, fontSize: 13, cursor: 'pointer', whiteSpace: 'nowrap',
              }} onClick={() => { if (confirm('Revoke this credential immediately? All dependent assets will be affected.')) { showCredToast('✓ Credential revoked'); setSelectedCredential(null); } }}>
                Revoke Immediately
              </button>
              <span style={{ color: '#EF4444', fontSize: 12 }}>
                This will invalidate all {d.assets.length} dependent asset{d.assets.length !== 1 ? 's' : ''} and {d.routes.length} active route{d.routes.length !== 1 ? 's' : ''}
              </span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 14, flexWrap: 'wrap' }}>
              <button style={{
                backgroundColor: '#7a5c00', color: '#fff', border: 'none', borderRadius: 6,
                padding: '8px 18px', fontWeight: 600, fontSize: 13, cursor: 'pointer', whiteSpace: 'nowrap',
              }} onClick={() => showCredToast('✓ Credential rotated — all references updated')}>
                Rotate & Update References
              </button>
              <span style={{ color: '#D4A843', fontSize: 12 }}>
                Generate new credential and update all {d.assets.length + d.routes.length} reference{(d.assets.length + d.routes.length) !== 1 ? 's' : ''} automatically
              </span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 14, flexWrap: 'wrap' }}>
              <button style={{
                backgroundColor: 'transparent', color: '#ccc', border: '1px solid rgba(212, 168, 67, 0.10)', borderRadius: 6,
                padding: '8px 18px', fontWeight: 600, fontSize: 13, cursor: 'pointer', whiteSpace: 'nowrap',
              }} onClick={() => showCredToast(`✓ Alert sent to ${d.namespaces.length} namespace admin${d.namespaces.length !== 1 ? 's' : ''}`)}>
                Notify Stakeholders
              </button>
              <span style={{ color: '#999', fontSize: 12 }}>
                Send alert to {d.namespaces.length} namespace admin{d.namespaces.length !== 1 ? 's' : ''}
              </span>
            </div>
          </div>
        </div>

        {/* Edit Scope Modal */}
        {showEditScope && (
          <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
            <div style={{ backgroundColor: '#1A1A1A', borderTop: '3px solid #D4A843', borderRadius: 8, padding: 24, width: '100%', maxWidth: 640, border: '1px solid rgba(212, 168, 67, 0.10)', maxHeight: '85vh', overflowY: 'auto' }}>
              <h3 style={{ color: '#fff', fontSize: 16, fontWeight: 600, margin: '0 0 4px' }}>Edit Credential Scope</h3>
              <p style={{ color: '#999', fontSize: 12, margin: '0 0 20px' }}>
                Configure where <span style={{ color: '#D4A843' }}>{selectedCredential.name}</span> can be used — by namespace, environment, and asset binding.
              </p>

              {/* Primary Namespace */}
              <div style={{ marginBottom: 16 }}>
                <label style={{ color: '#999', fontSize: 12, marginBottom: 4, display: 'block' }}>Primary Namespace</label>
                <select
                  value={editScopeData.primaryNamespace}
                  onChange={e => setEditScopeData(prev => ({ ...prev, primaryNamespace: e.target.value }))}
                  style={{ width: '100%', backgroundColor: '#0F0F0F', border: '1px solid rgba(212,168,67,0.15)', color: '#E8E8E8', padding: '8px 12px', borderRadius: 6, fontSize: 13, fontFamily: 'inherit' }}
                >
                  {allNamespaces.map(ns => <option key={ns} value={ns}>{ns}</option>)}
                </select>
              </div>

              {/* Shared Namespaces */}
              <div style={{ marginBottom: 16 }}>
                <label style={{ color: '#999', fontSize: 12, marginBottom: 4, display: 'block' }}>
                  Shared With (additional namespaces)
                </label>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                  {allNamespaces.filter(ns => ns !== editScopeData.primaryNamespace).map(ns => {
                    const isShared = editScopeData.sharedNamespaces.includes(ns);
                    return (
                      <button
                        key={ns}
                        onClick={() => setEditScopeData(prev => ({
                          ...prev,
                          sharedNamespaces: isShared
                            ? prev.sharedNamespaces.filter(n => n !== ns)
                            : [...prev.sharedNamespaces, ns],
                        }))}
                        style={{
                          backgroundColor: isShared ? 'rgba(212,168,67,0.15)' : '#0F0F0F',
                          border: `1px solid ${isShared ? '#D4A843' : 'rgba(212,168,67,0.10)'}`,
                          color: isShared ? '#D4A843' : '#999',
                          borderRadius: 16, padding: '4px 12px', fontSize: 12, cursor: 'pointer', fontFamily: 'inherit',
                        }}
                      >
                        {isShared ? '✓ ' : ''}{ns}
                      </button>
                    );
                  })}
                </div>
                <div style={{ color: '#666', fontSize: 11, marginTop: 4 }}>
                  Click to toggle. Shared namespaces can reference this credential for their assets.
                </div>
              </div>

              {/* Environment */}
              <div style={{ marginBottom: 16 }}>
                <label style={{ color: '#999', fontSize: 12, marginBottom: 4, display: 'block' }}>Environment Tag</label>
                <div style={{ display: 'flex', gap: 8 }}>
                  {['Production', 'Staging', 'Development'].map(env => (
                    <button
                      key={env}
                      onClick={() => setEditScopeData(prev => ({ ...prev, environment: env }))}
                      style={{
                        backgroundColor: editScopeData.environment === env ? 'rgba(212,168,67,0.15)' : '#0F0F0F',
                        border: `1px solid ${editScopeData.environment === env ? '#D4A843' : 'rgba(212,168,67,0.10)'}`,
                        color: editScopeData.environment === env ? '#D4A843' : '#999',
                        borderRadius: 6, padding: '6px 14px', fontSize: 12, cursor: 'pointer', fontFamily: 'inherit', fontWeight: 500,
                      }}
                    >
                      {env}
                    </button>
                  ))}
                </div>
              </div>

              {/* Asset Bindings */}
              <div style={{ marginBottom: 16 }}>
                <label style={{ color: '#999', fontSize: 12, marginBottom: 8, display: 'block' }}>
                  Asset Bindings — {editScopeData.assetBindings.filter(a => a.bound).length} of {editScopeData.assetBindings.length} bound
                </label>

                {/* Asset filter by type */}
                {(['model', 'agent', 'tool'] as const).map(assetType => {
                  const assets = editScopeData.assetBindings.filter(a => a.type === assetType);
                  if (assets.length === 0) return null;
                  return (
                    <div key={assetType} style={{ marginBottom: 12 }}>
                      <div style={{ color: '#888', fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 6, display: 'flex', alignItems: 'center', gap: 6 }}>
                        <span>{assetTypeEmoji[assetType] || '📦'}</span> {assetType}s
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                        {assets.map(asset => (
                          <div
                            key={`${asset.name}-${asset.namespace}`}
                            onClick={() => {
                              setEditScopeData(prev => ({
                                ...prev,
                                assetBindings: prev.assetBindings.map(a =>
                                  a.name === asset.name && a.namespace === asset.namespace
                                    ? { ...a, bound: !a.bound }
                                    : a
                                ),
                              }));
                            }}
                            style={{
                              display: 'flex', alignItems: 'center', gap: 10, padding: '6px 12px',
                              backgroundColor: asset.bound ? 'rgba(212,168,67,0.08)' : '#0F0F0F',
                              border: `1px solid ${asset.bound ? 'rgba(212,168,67,0.20)' : 'rgba(212,168,67,0.06)'}`,
                              borderRadius: 6, cursor: 'pointer', transition: 'all 0.15s',
                            }}
                          >
                            <span style={{
                              width: 16, height: 16, borderRadius: 4,
                              border: `1px solid ${asset.bound ? '#D4A843' : '#555'}`,
                              backgroundColor: asset.bound ? '#D4A843' : 'transparent',
                              display: 'flex', alignItems: 'center', justifyContent: 'center',
                              fontSize: 10, color: '#0A0A0A', fontWeight: 700, flexShrink: 0,
                            }}>
                              {asset.bound ? '✓' : ''}
                            </span>
                            <span style={{ color: asset.bound ? '#E8E8E8' : '#888', fontSize: 13, flex: 1 }}>{asset.name}</span>
                            <span style={{ backgroundColor: '#1E1E1E', padding: '1px 8px', borderRadius: 4, fontSize: 10, color: '#777' }}>{asset.namespace}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Summary */}
              <div style={{ backgroundColor: '#0F0F0F', border: '1px solid rgba(212,168,67,0.10)', borderRadius: 6, padding: 12, marginBottom: 16 }}>
                <div style={{ color: '#999', fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 8 }}>Scope Summary</div>
                <div style={{ display: 'flex', gap: 20, flexWrap: 'wrap', fontSize: 12 }}>
                  <span style={{ color: '#D4A843' }}>Primary: {editScopeData.primaryNamespace}</span>
                  <span style={{ color: '#4ADE80' }}>Shared: {editScopeData.sharedNamespaces.length > 0 ? editScopeData.sharedNamespaces.join(', ') : 'None'}</span>
                  <span style={{ color: '#A78BFA' }}>Env: {editScopeData.environment}</span>
                  <span style={{ color: '#F59E0B' }}>Bound: {editScopeData.assetBindings.filter(a => a.bound).length} assets</span>
                </div>
              </div>

              {/* Actions */}
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
                <button onClick={() => setShowEditScope(false)} style={{ backgroundColor: 'transparent', color: '#ccc', border: '1px solid rgba(212, 168, 67, 0.10)', borderRadius: 6, padding: '8px 18px', fontSize: 13, fontWeight: 500, cursor: 'pointer', fontFamily: 'inherit' }}>Cancel</button>
                <button onClick={handleSaveScope} style={{ backgroundColor: '#D4A843', color: '#0A0A0A', border: 'none', borderRadius: 6, padding: '8px 18px', fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}>Save Scope</button>
              </div>
            </div>
          </div>
        )}

        {credToast && (
          <div style={{ position: 'fixed', bottom: 24, right: 24, backgroundColor: '#1A1A1A', border: '1px solid #D4A843', borderRadius: 8, padding: '12px 20px', color: '#D4A843', fontSize: 13, fontWeight: 600, zIndex: 1001, boxShadow: '0 4px 12px rgba(0,0,0,0.5)' }}>
            {credToast}
          </div>
        )}
      </div>
    );
  }

  return (
    <div style={{ color: '#e0e0e0', display: 'flex', flexDirection: 'column', gap: 16 }}>
      {/* Unified action bar: Add + Search + Filters */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
        <button
          onClick={() => setShowAddCredential(true)}
          style={{
            backgroundColor: '#D4A843', color: '#0A0A0A', border: 'none', borderRadius: 6,
            padding: '8px 18px', fontWeight: 600, fontSize: 13, cursor: 'pointer', whiteSpace: 'nowrap',
          }}>
          + Add Credential
        </button>
        <input
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder="Search credentials..."
          style={{ flex: 1, minWidth: 180, backgroundColor: '#0F0F0F', border: '1px solid rgba(212,168,67,0.15)', color: '#E8E8E8', padding: '8px 12px', borderRadius: 6, fontSize: 13, fontFamily: 'inherit' }}
        />
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          style={{ backgroundColor: '#1E1E1E', color: '#ccc', border: '1px solid rgba(212, 168, 67, 0.10)', borderRadius: 6, padding: '8px 12px', fontSize: 13, fontFamily: 'inherit' }}
        >
          <option value="all">All Status</option>
          <option value="active">Active</option>
          <option value="expiring">Expiring</option>
          <option value="expired">Expired</option>
          <option value="revoked">Revoked</option>
        </select>
      </div>

      {/* Stat cards (matches Access page) */}
      <div style={{ display: 'flex', gap: 14, alignItems: 'stretch' }}>
        {[
          { label: 'Total Credentials', value: stats[0].value, color: '#D4A843' },
          { label: 'Healthy', value: stats[1].value, color: '#4ADE80' },
          { label: 'Expiring Soon', value: stats[2].value, color: '#F59E0B' },
          { label: 'Expired', value: stats[3].value, color: '#EF4444' },
        ].map((s) => (
          <div key={s.label} style={{ ...card, padding: 16, flex: 1, display: 'flex', flexDirection: 'column', gap: 4 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <span style={{ width: 8, height: 8, borderRadius: '50%', backgroundColor: s.color, display: 'inline-block', flexShrink: 0 }} />
              <span style={{ color: '#999', fontSize: 12 }}>{s.label}</span>
            </div>
            <span style={{ color: '#fff', fontSize: 28, fontWeight: 700, lineHeight: 1.1 }}>{s.value}</span>
          </div>
        ))}
      </div>

      {/* Credentials Table — simplified columns */}
      <div style={{ ...card, padding: 0, overflow: 'hidden' }}>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
            <thead>
              <tr style={{ borderBottom: '1px solid rgba(212, 168, 67, 0.10)', color: '#999', textAlign: 'left' }}>
                {['Name', 'Type', 'Namespace', 'Target', 'Status', 'Expires'].map((h) => (
                  <th key={h} style={{ padding: '10px 16px', fontWeight: 600, fontSize: 12, whiteSpace: 'nowrap' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filteredCreds.map((c, i) => (
                <tr
                  key={c.name}
                  onMouseEnter={() => setHoveredRow(i)}
                  onMouseLeave={() => setHoveredRow(null)}
                  onClick={() => setSelectedCredential(c)}
                  style={{
                    borderBottom: '1px solid rgba(212, 168, 67, 0.06)',
                    backgroundColor: hoveredRow === i ? '#2d2c2b' : 'transparent',
                    transition: 'background-color 0.15s',
                    cursor: 'pointer',
                  }}
                >
                  <td style={{ padding: '10px 16px', fontWeight: 500, color: '#D4A843' }}>{c.name}</td>
                  <td style={{ padding: '10px 16px' }}>
                    <span style={{ backgroundColor: '#1E1E1E', padding: '2px 8px', borderRadius: 4, fontSize: 12 }}>{c.type}</span>
                  </td>
                  <td style={{ padding: '10px 16px', color: '#bbb' }}>{c.namespace}</td>
                  <td style={{ padding: '10px 16px', color: '#bbb' }}>{c.target}</td>
                  <td style={{ padding: '10px 16px' }}>
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                      <span style={{ width: 8, height: 8, borderRadius: '50%', backgroundColor: statusColors[c.status], display: 'inline-block' }} />
                      <span style={{ color: statusColors[c.status] }}>{statusLabels[c.status]}</span>
                    </span>
                  </td>
                  <td style={{ padding: '10px 16px', color: c.status === 'expired' ? '#EF4444' : c.status === 'expiring' ? '#F59E0B' : '#999' }}>
                    {c.expires}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
      {/* Add Credential Modal */}
      {showAddCredential && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <div style={{ backgroundColor: '#1A1A1A', borderTop: '3px solid #D4A843', borderRadius: 8, padding: 24, width: '100%', maxWidth: 560, border: '1px solid rgba(212, 168, 67, 0.10)' }}>
            {/* Step indicator */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 20 }}>
              {['Details', 'Assign'].map((label, idx) => {
                const step = idx + 1;
                const active = addCredStep === step;
                const done = addCredStep > step;
                return (
                  <React.Fragment key={label}>
                    {idx > 0 && <div style={{ flex: 1, height: 1, backgroundColor: done ? '#D4A843' : 'rgba(212,168,67,0.15)' }} />}
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <span style={{
                        width: 22, height: 22, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontSize: 11, fontWeight: 600,
                        backgroundColor: active ? '#D4A843' : done ? 'rgba(212,168,67,0.25)' : '#1E1E1E',
                        color: active ? '#0A0A0A' : done ? '#D4A843' : '#666',
                        border: active ? 'none' : '1px solid rgba(212,168,67,0.15)',
                      }}>{done ? '✓' : step}</span>
                      <span style={{ fontSize: 12, color: active ? '#fff' : '#888', fontWeight: active ? 600 : 400 }}>{label}</span>
                    </div>
                  </React.Fragment>
                );
              })}
            </div>

            {addCredStep === 1 && (
              <>
                <h3 style={{ color: '#fff', fontSize: 16, fontWeight: 600, margin: '0 0 16px' }}>Credential Details</h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                  <div>
                    <label style={{ color: '#999', fontSize: 12, marginBottom: 4, display: 'block' }}>Name</label>
                    <input value={credFormData.name} onChange={e => setCredFormData(f => ({ ...f, name: e.target.value }))} style={{ width: '100%', backgroundColor: '#0F0F0F', border: '1px solid rgba(212,168,67,0.15)', color: '#E8E8E8', padding: '8px 12px', borderRadius: 6, fontSize: 13, fontFamily: 'inherit', boxSizing: 'border-box' as const }} />
                  </div>
                  <div>
                    <label style={{ color: '#999', fontSize: 12, marginBottom: 4, display: 'block' }}>Type</label>
                    <select value={credFormData.type} onChange={e => setCredFormData(f => ({ ...f, type: e.target.value }))} style={{ width: '100%', backgroundColor: '#0F0F0F', border: '1px solid rgba(212,168,67,0.15)', color: '#E8E8E8', padding: '8px 12px', borderRadius: 6, fontSize: 13, fontFamily: 'inherit' }}>
                      <option>API Key</option>
                      <option>OAuth 2.0</option>
                      <option>Managed Identity</option>
                      <option>Service Account</option>
                      <option>IAM Role</option>
                      <option>Connection String</option>
                    </select>
                  </div>
                  <div>
                    <label style={{ color: '#999', fontSize: 12, marginBottom: 4, display: 'block' }}>Provider</label>
                    <input value={credFormData.provider} onChange={e => setCredFormData(f => ({ ...f, provider: e.target.value }))} style={{ width: '100%', backgroundColor: '#0F0F0F', border: '1px solid rgba(212,168,67,0.15)', color: '#E8E8E8', padding: '8px 12px', borderRadius: 6, fontSize: 13, fontFamily: 'inherit', boxSizing: 'border-box' as const }} />
                  </div>
                  <div>
                    <label style={{ color: '#999', fontSize: 12, marginBottom: 4, display: 'block' }}>Namespace</label>
                    <select value={credFormData.namespace} onChange={e => setCredFormData(f => ({ ...f, namespace: e.target.value }))} style={{ width: '100%', backgroundColor: '#0F0F0F', border: '1px solid rgba(212,168,67,0.15)', color: '#E8E8E8', padding: '8px 12px', borderRadius: 6, fontSize: 13, fontFamily: 'inherit' }}>
                      <option value="ai-platform">ai-platform</option>
                      <option value="ml-inference">ml-inference</option>
                      <option value="customer-support-ai">customer-support-ai</option>
                      <option value="research-sandbox">research-sandbox</option>
                    </select>
                  </div>
                  <div>
                    <label style={{ color: '#999', fontSize: 12, marginBottom: 4, display: 'block' }}>Expires</label>
                    <input type="date" value={credFormData.expires} onChange={e => setCredFormData(f => ({ ...f, expires: e.target.value }))} style={{ width: '100%', backgroundColor: '#0F0F0F', border: '1px solid rgba(212,168,67,0.15)', color: '#E8E8E8', padding: '8px 12px', borderRadius: 6, fontSize: 13, fontFamily: 'inherit', boxSizing: 'border-box' as const }} />
                  </div>
                </div>
                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 20 }}>
                  <button onClick={() => { setShowAddCredential(false); setAddCredStep(1); setCredAssignments({}); setAssignMode('namespace'); setAssignNsSelections({}); setAssignAssetSearch(''); }} style={{ backgroundColor: 'transparent', color: '#ccc', border: '1px solid rgba(212, 168, 67, 0.10)', borderRadius: 6, padding: '8px 18px', fontSize: 13, fontWeight: 500, cursor: 'pointer', fontFamily: 'inherit' }}>Cancel</button>
                  <button
                    disabled={!credFormData.name || !credFormData.provider}
                    onClick={() => setAddCredStep(2)}
                    style={{
                      backgroundColor: !credFormData.name || !credFormData.provider ? '#555' : '#D4A843',
                      color: !credFormData.name || !credFormData.provider ? '#999' : '#0A0A0A',
                      border: 'none', borderRadius: 6, padding: '8px 18px', fontSize: 13, fontWeight: 600, cursor: !credFormData.name || !credFormData.provider ? 'not-allowed' : 'pointer', fontFamily: 'inherit',
                    }}>
                    Next: Assign →
                  </button>
                </div>
              </>
            )}

            {addCredStep === 2 && (() => {
              const assetTypeEmojis: Record<string, string> = { model: '🧠', agent: '🤖', tool: '🔧' };
              const assetTypes = ['model', 'agent', 'tool'] as const;
              const assignedAssetCount = Object.values(credAssignments).filter(Boolean).length;
              const assignedNsCount = Object.values(assignNsSelections).filter(Boolean).length;
              const totalAssigned = assignedAssetCount + assignedNsCount;
              return (
                <>
                  <h3 style={{ color: '#fff', fontSize: 16, fontWeight: 600, margin: '0 0 4px' }}>Assign Credential</h3>
                  <p style={{ color: '#888', fontSize: 12, margin: '0 0 16px' }}>
                    Assign to entire namespaces or pick individual assets. You can also do this later.
                  </p>

                  {/* Mode toggle */}
                  <div style={{ display: 'flex', gap: 0, marginBottom: 16, borderRadius: 6, overflow: 'hidden', border: '1px solid rgba(212,168,67,0.15)' }}>
                    {([['namespace', 'Namespaces'], ['asset', 'Individual Assets']] as const).map(([mode, label]) => (
                      <button
                        key={mode}
                        onClick={() => setAssignMode(mode)}
                        style={{
                          flex: 1, padding: '8px 12px', fontSize: 13, fontWeight: 600, border: 'none', cursor: 'pointer', fontFamily: 'inherit',
                          backgroundColor: assignMode === mode ? '#D4A843' : '#1E1E1E',
                          color: assignMode === mode ? '#0A0A0A' : '#999',
                          transition: 'all 0.15s',
                        }}
                      >{label}{mode === 'namespace' && assignedNsCount > 0 ? ` (${assignedNsCount})` : ''}{mode === 'asset' && assignedAssetCount > 0 ? ` (${assignedAssetCount})` : ''}</button>
                    ))}
                  </div>

                  {/* Namespace assignment mode */}
                  {assignMode === 'namespace' && (
                    <div style={{ maxHeight: 300, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 4 }}>
                      {allNamespaces.map(ns => {
                        const checked = !!assignNsSelections[ns];
                        const assetCount = allAvailableAssets.filter(a => a.namespace === ns).length;
                        return (
                          <label
                            key={ns}
                            style={{
                              display: 'flex', alignItems: 'center', gap: 10, padding: '8px 12px', borderRadius: 6,
                              backgroundColor: checked ? 'rgba(212,168,67,0.08)' : 'transparent',
                              border: '1px solid ' + (checked ? 'rgba(212,168,67,0.25)' : 'rgba(212,168,67,0.06)'),
                              cursor: 'pointer', transition: 'all 0.15s',
                            }}
                          >
                            <input
                              type="checkbox"
                              checked={checked}
                              onChange={() => setAssignNsSelections(prev => ({ ...prev, [ns]: !prev[ns] }))}
                              style={{ accentColor: '#D4A843' }}
                            />
                            <span style={{ fontSize: 13, color: '#E8E8E8', flex: 1 }}>{ns}</span>
                            <span style={{ fontSize: 11, color: '#666' }}>{assetCount} asset{assetCount !== 1 ? 's' : ''}</span>
                          </label>
                        );
                      })}
                    </div>
                  )}

                  {/* Individual asset assignment mode */}
                  {assignMode === 'asset' && (
                    <>
                      <input
                        value={assignAssetSearch}
                        onChange={e => setAssignAssetSearch(e.target.value)}
                        placeholder="Search models, tools, agents..."
                        style={{ width: '100%', backgroundColor: '#0F0F0F', border: '1px solid rgba(212,168,67,0.15)', color: '#E8E8E8', padding: '8px 12px', borderRadius: 6, fontSize: 13, fontFamily: 'inherit', boxSizing: 'border-box' as const, marginBottom: 12 }}
                      />
                      <div style={{ maxHeight: 260, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 14, paddingRight: 4 }}>
                        {assetTypes.map(aType => {
                          const assetsOfType = allAvailableAssets.filter(a =>
                            a.type === aType && (
                              !assignAssetSearch ||
                              a.name.toLowerCase().includes(assignAssetSearch.toLowerCase()) ||
                              a.namespace.toLowerCase().includes(assignAssetSearch.toLowerCase())
                            )
                          );
                          if (assetsOfType.length === 0) return null;
                          const checkedCount = assetsOfType.filter(a => credAssignments[a.name]).length;
                          return (
                            <div key={aType}>
                              <div style={{ fontSize: 12, color: '#888', fontWeight: 600, marginBottom: 6, textTransform: 'uppercase', letterSpacing: 0.5 }}>
                                {assetTypeEmojis[aType]} {aType}s ({checkedCount}/{assetsOfType.length})
                              </div>
                              <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                                {assetsOfType.map(a => {
                                  const checked = !!credAssignments[a.name];
                                  return (
                                    <label
                                      key={a.name}
                                      style={{
                                        display: 'flex', alignItems: 'center', gap: 10, padding: '6px 10px', borderRadius: 6,
                                        backgroundColor: checked ? 'rgba(212,168,67,0.08)' : 'transparent',
                                        border: '1px solid ' + (checked ? 'rgba(212,168,67,0.25)' : 'rgba(212,168,67,0.06)'),
                                        cursor: 'pointer', transition: 'all 0.15s',
                                      }}
                                    >
                                      <input
                                        type="checkbox"
                                        checked={checked}
                                        onChange={() => setCredAssignments(prev => ({ ...prev, [a.name]: !prev[a.name] }))}
                                        style={{ accentColor: '#D4A843' }}
                                      />
                                      <span style={{ fontSize: 13, color: '#E8E8E8', flex: 1 }}>{a.name}</span>
                                      <span style={{ fontSize: 11, color: '#666' }}>{a.namespace}</span>
                                    </label>
                                  );
                                })}
                              </div>
                            </div>
                          );
                        })}
                        {allAvailableAssets.filter(a => !assignAssetSearch || a.name.toLowerCase().includes(assignAssetSearch.toLowerCase()) || a.namespace.toLowerCase().includes(assignAssetSearch.toLowerCase())).length === 0 && (
                          <div style={{ textAlign: 'center', color: '#666', fontSize: 13, padding: 20 }}>No assets match "{assignAssetSearch}"</div>
                        )}
                      </div>
                    </>
                  )}

                  {/* Selection summary */}
                  {totalAssigned > 0 && (
                    <div style={{ marginTop: 12, padding: '8px 12px', backgroundColor: 'rgba(212,168,67,0.06)', borderRadius: 6, fontSize: 12, color: '#D4A843', display: 'flex', gap: 12 }}>
                      {assignedNsCount > 0 && <span>{assignedNsCount} namespace{assignedNsCount !== 1 ? 's' : ''}</span>}
                      {assignedNsCount > 0 && assignedAssetCount > 0 && <span style={{ color: '#555' }}>·</span>}
                      {assignedAssetCount > 0 && <span>{assignedAssetCount} individual asset{assignedAssetCount !== 1 ? 's' : ''}</span>}
                    </div>
                  )}

                  <div style={{ display: 'flex', justifyContent: 'space-between', gap: 10, marginTop: 20 }}>
                    <button onClick={() => setAddCredStep(1)} style={{ backgroundColor: 'transparent', color: '#ccc', border: '1px solid rgba(212, 168, 67, 0.10)', borderRadius: 6, padding: '8px 18px', fontSize: 13, fontWeight: 500, cursor: 'pointer', fontFamily: 'inherit' }}>← Back</button>
                    <div style={{ display: 'flex', gap: 10 }}>
                      <button onClick={() => { setCredAssignments({}); setAssignNsSelections({}); handleAddCredential(); }} style={{ backgroundColor: 'transparent', color: '#ccc', border: '1px solid rgba(212, 168, 67, 0.10)', borderRadius: 6, padding: '8px 18px', fontSize: 13, fontWeight: 500, cursor: 'pointer', fontFamily: 'inherit' }}>Skip</button>
                      <button onClick={handleAddCredential} style={{ backgroundColor: '#D4A843', color: '#0A0A0A', border: 'none', borderRadius: 6, padding: '8px 18px', fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}>
                        {totalAssigned > 0 ? `Create & Assign (${totalAssigned})` : 'Create'}
                      </button>
                    </div>
                  </div>
                </>
              );
            })()}
          </div>
        </div>
      )}
      {credToast && (
        <div style={{ position: 'fixed', bottom: 24, right: 24, backgroundColor: '#1A1A1A', border: '1px solid #D4A843', borderRadius: 8, padding: '12px 20px', color: '#D4A843', fontSize: 13, fontWeight: 600, zIndex: 1001, boxShadow: '0 4px 12px rgba(0,0,0,0.5)' }}>
          {credToast}
        </div>
      )}
    </div>
  );
};


export default Credentials;
