import React, { useState } from 'react';
import type { CSSProperties } from 'react';
import { useNavigate } from 'react-router-dom';

// --- Types ---
interface Credential {
  name: string;
  type: string;
  namespace: string;
  target: string;
  status: 'active' | 'expiring' | 'expired';
  lastRotated: string;
  expires: string;
}

interface TypeBreakdown {
  label: string;
  count: number;
  total: number;
  color: string;
}

interface CredentialDependency {
  assets: { name: string; type: string; namespace: string }[];
  routes: { pattern: string; strategy: string; healthy: boolean }[];
  namespaces: string[];
  requests24h: number;
  recentAccess: { timestamp: string; method: string; path: string; consumer: string; status: number; latencyMs: number }[];
}

interface HealthAlert {
  emoji: string;
  message: string;
  borderColor: string;
  credentialIndex: number;
}

// --- Mock Data ---
const credentials: Credential[] = [
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

const typeBreakdown: TypeBreakdown[] = [
  { label: 'API Keys', count: 18, total: 47, color: '#D4A843' },
  { label: 'OAuth 2.0', count: 12, total: 47, color: '#A78BFA' },
  { label: 'Managed Identity', count: 8, total: 47, color: '#4ADE80' },
  { label: 'Service Account', count: 5, total: 47, color: '#F59E0B' },
  { label: 'IAM Role', count: 3, total: 47, color: '#60A5FA' },
  { label: 'Connection String', count: 1, total: 47, color: '#888' },
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

const healthAlerts: HealthAlert[] = [
  { emoji: '🔴', message: 'ServiceNow API Key expired 3 days ago — 1 asset affected', borderColor: '#EF4444', credentialIndex: 7 },
  { emoji: '🟡', message: 'Jira OAuth token expires in 3 days — 2 assets depend on it', borderColor: '#F59E0B', credentialIndex: 8 },
  { emoji: '🟡', message: 'GCP Vertex Service Account expires in 5 days — 1 asset affected', borderColor: '#F59E0B', credentialIndex: 3 },
  { emoji: '💡', message: 'Entra Managed Identity (auto-renew) — no action needed', borderColor: '#4ADE80', credentialIndex: 5 },
];

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
};

const statusLabels: Record<string, string> = {
  active: '✓ Active',
  expiring: '⚠ Expiring',
  expired: '✗ Expired',
};

const Credentials: React.FC = () => {
  const [hoveredRow, setHoveredRow] = useState<number | null>(null);
  const [selectedCredential, setSelectedCredential] = useState<Credential | null>(null);
  const navigate = useNavigate();

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

        {/* Impact Summary */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 14 }}>
          {impactStats.map((s) => (
            <div key={s.label} style={{ ...card, padding: '16px 20px' }}>
              <div style={{ fontSize: 12, color: '#999', marginBottom: 4 }}>{s.label}</div>
              <div style={{ fontSize: 28, fontWeight: 700, color: s.color }}>{s.value}</div>
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
              }}>
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
              }}>
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
              }}>
                Notify Stakeholders
              </button>
              <span style={{ color: '#999', fontSize: 12 }}>
                Send alert to {d.namespaces.length} namespace admin{d.namespaces.length !== 1 ? 's' : ''}
              </span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={{ color: '#e0e0e0', display: 'flex', flexDirection: 'column', gap: 20 }}>
      {/* Top Action Bar */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
        <div style={{ display: 'flex', gap: 10 }}>
          <button style={{
            backgroundColor: '#D4A843', color: '#0A0A0A', border: 'none', borderRadius: 6,
            padding: '8px 18px', fontWeight: 600, fontSize: 13, cursor: 'pointer',
          }}>
            + Add Credential
          </button>
          <button style={{
            backgroundColor: 'transparent', color: '#F59E0B', border: '1px solid #f5a623',
            borderRadius: 6, padding: '8px 18px', fontWeight: 600, fontSize: 13, cursor: 'pointer',
          }}>
            Rotate All Expiring
          </button>
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          <select style={{
            backgroundColor: '#1E1E1E', color: '#ccc', border: '1px solid rgba(212, 168, 67, 0.10)',
            borderRadius: 6, padding: '6px 12px', fontSize: 13,
          }}>
            <option>All Types</option>
            <option>API Key</option>
            <option>OAuth 2.0</option>
            <option>Managed Identity</option>
            <option>Service Account</option>
            <option>IAM Role</option>
            <option>Connection String</option>
          </select>
          <select style={{
            backgroundColor: '#1E1E1E', color: '#ccc', border: '1px solid rgba(212, 168, 67, 0.10)',
            borderRadius: 6, padding: '6px 12px', fontSize: 13,
          }}>
            <option>All Namespaces</option>
            <option>retail-support</option>
            <option>finance-analytics</option>
            <option>customer-ops</option>
            <option>hr-automation</option>
            <option>dev-sandbox</option>
          </select>
        </div>
      </div>

      {/* Summary Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 14 }}>
        {stats.map((s) => (
          <div key={s.label} style={{ ...card, padding: '16px 20px' }}>
            <div style={{ fontSize: 12, color: '#999', marginBottom: 4 }}>{s.label}</div>
            <div style={{ fontSize: 28, fontWeight: 700, color: s.color || '#fff' }}>{s.value}</div>
          </div>
        ))}
      </div>

      {/* Credential Health Alerts */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {healthAlerts.map((alert, i) => (
          <div
            key={i}
            onClick={() => setSelectedCredential(credentials[alert.credentialIndex])}
            style={{
              ...card,
              padding: '12px 16px',
              borderLeft: `4px solid ${alert.borderColor}`,
              cursor: 'pointer',
              display: 'flex', alignItems: 'center', gap: 10, transition: 'background-color 0.15s',
            }}
            onMouseEnter={(e) => { (e.currentTarget as HTMLDivElement).style.backgroundColor = '#1E1E1E'; }}
            onMouseLeave={(e) => { (e.currentTarget as HTMLDivElement).style.backgroundColor = '#161616'; }}
          >
            <span style={{ fontSize: 16 }}>{alert.emoji}</span>
            <span style={{ fontSize: 13, color: '#ccc', flex: 1 }}>{alert.message}</span>
            <span style={{ color: '#D4A843', fontSize: 12, whiteSpace: 'nowrap' }}>View blast radius →</span>
          </div>
        ))}
      </div>

      {/* Credentials Table */}
      <div style={{ ...card, padding: 0, overflow: 'hidden' }}>
        <div style={{ padding: '16px 20px', borderBottom: '1px solid rgba(212, 168, 67, 0.10)', fontWeight: 600, fontSize: 14 }}>
          Credentials
        </div>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
            <thead>
              <tr style={{ borderBottom: '1px solid rgba(212, 168, 67, 0.10)', color: '#999', textAlign: 'left' }}>
                {['Name', 'Type', 'Scope (Namespace)', 'Target', 'Status', 'Last Rotated', 'Expires', 'Dependencies', ''].map((h) => (
                  <th key={h} style={{ padding: '10px 16px', fontWeight: 600, fontSize: 12, whiteSpace: 'nowrap' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {credentials.map((c, i) => {
                const deps = credentialDependencies[c.name];
                const depCount = deps ? deps.assets.length : 0;
                return (
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
                    <span style={{
                      backgroundColor: '#1E1E1E', padding: '2px 8px', borderRadius: 4, fontSize: 12,
                    }}>{c.type}</span>
                  </td>
                  <td style={{ padding: '10px 16px', color: '#bbb' }}>{c.namespace}</td>
                  <td style={{ padding: '10px 16px', color: '#bbb' }}>{c.target}</td>
                  <td style={{ padding: '10px 16px' }}>
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                      <span style={{
                        width: 8, height: 8, borderRadius: '50%',
                        backgroundColor: statusColors[c.status], display: 'inline-block',
                      }} />
                      <span style={{ color: statusColors[c.status] }}>{statusLabels[c.status]}</span>
                    </span>
                  </td>
                  <td style={{ padding: '10px 16px', color: '#999' }}>{c.lastRotated}</td>
                  <td style={{ padding: '10px 16px', color: c.status === 'expired' ? '#EF4444' : c.status === 'expiring' ? '#F59E0B' : '#999' }}>
                    {c.expires}
                  </td>
                  <td style={{ padding: '10px 16px' }}>
                    <span
                      onClick={(e) => { e.stopPropagation(); setSelectedCredential(c); }}
                      style={{ color: '#D4A843', fontSize: 12, cursor: 'pointer', whiteSpace: 'nowrap' }}
                    >
                      {depCount > 0 ? `${depCount} asset${depCount !== 1 ? 's' : ''} →` : '—'}
                    </span>
                  </td>
                  <td style={{ padding: '10px 16px', color: '#666', fontSize: 16 }}>⋯</td>
                </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Bottom row: Type Breakdown + Rotation Policy */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
        {/* Credential Types Breakdown */}
        <div style={card}>
          <div style={{ fontWeight: 600, fontSize: 14, marginBottom: 16 }}>Credential Types Breakdown</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {typeBreakdown.map((t) => (
              <div key={t.label}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, marginBottom: 4 }}>
                  <span style={{ color: '#ccc' }}>{t.label}</span>
                  <span style={{ color: '#999' }}>{t.count}</span>
                </div>
                <div style={{ height: 6, backgroundColor: '#1E1E1E', borderRadius: 3, overflow: 'hidden' }}>
                  <div style={{
                    height: '100%', borderRadius: 3,
                    width: `${(t.count / t.total) * 100}%`,
                    backgroundColor: t.color,
                  }} />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Rotation Policy */}
        <div style={card}>
          <div style={{ fontWeight: 600, fontSize: 14, marginBottom: 16 }}>Rotation Policy</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14, fontSize: 13 }}>
            <PolicyItem
              label="Auto-rotation"
              value="Enabled for API Keys (90-day cycle)"
              dotColor="#4ADE80"
            />
            <PolicyItem
              label="Alert threshold"
              value="7 days before expiry"
              dotColor="#F59E0B"
            />
            <PolicyItem
              label="Managed identities"
              value="Auto-renewed by Azure"
              dotColor="#D4A843"
            />
            <PolicyItem
              label="Manual review required"
              value="OAuth tokens, IAM roles"
              dotColor="#999"
            />
          </div>
        </div>
      </div>
    </div>
  );
};

const PolicyItem: React.FC<{ label: string; value: string; dotColor: string }> = ({ label, value, dotColor }) => (
  <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
    <span style={{
      width: 8, height: 8, borderRadius: '50%', backgroundColor: dotColor,
      display: 'inline-block', flexShrink: 0, marginTop: 5,
    }} />
    <div>
      <div style={{ color: '#ccc', fontWeight: 500 }}>{label}</div>
      <div style={{ color: '#999', fontSize: 12, marginTop: 2 }}>{value}</div>
    </div>
  </div>
);

export default Credentials;
