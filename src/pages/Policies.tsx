import React, { useState } from 'react'
import type { CSSProperties } from 'react'
import { useNavigate } from 'react-router-dom'

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

type PolicyCategory = 'authentication' | 'credentials' | 'rate-limits' | 'content-safety' | 'routing' | 'agent-execution'
type AccessRuleType = 'who' | 'where'

interface PolicyVersion {
  version: number
  date: string
  description: string
  actor: string
}

interface Policy {
  id: string; name: string; description: string; category: PolicyCategory
  target: string; phase: 'design-time' | 'runtime'
  ruleCount: number; enabled: boolean; appliedTo: number; namespace: string
  versions: PolicyVersion[]
  deployment: 'production' | 'sandbox' | 'staged'
}

interface AssetAccessRule {
  id: string; name: string; description: string; type: AccessRuleType
  assetType: string; namespace: string; enabled: boolean
  config: Record<string, unknown>
}

interface RAIGuardrail {
  id: string; name: string; description: string; category: string
  severity: 'block' | 'warn' | 'log'; target: string
  appliesTo: string[]; namespace: string; enabled: boolean
  triggersToday: number; blockedToday: number; lastTriggered: string | null
}

interface PendingApproval {
  id: string; assetName: string; assetType: string; action: string
  namespace: string; requestedBy: string; ruleTriggered: string
  requestedAt: string; status: 'pending' | 'approved' | 'rejected'
}

interface PolicyAuditEntry {
  id: string
  timestamp: string
  actor: string
  action: 'created' | 'updated' | 'enabled' | 'disabled' | 'deleted' | 'rolled-back'
  policyName: string
  policyId: string
  version: number
  details: string
  previousVersion?: number
}

/* ------------------------------------------------------------------ */
/*  Mock Data                                                          */
/* ------------------------------------------------------------------ */

const _basePolicies: Omit<Policy, 'versions' | 'deployment'>[] = [
  { id: 'p1', name: 'JWT Token Validation', description: 'Validate JWT tokens on all inbound requests using RS256 signing keys from the JWKS endpoint.', category: 'authentication', target: 'all-endpoints', phase: 'runtime', ruleCount: 3, enabled: true, appliedTo: 12, namespace: 'global' },
  { id: 'p2', name: 'API Key Authentication', description: 'Require API key header (x-api-key) for service-to-service calls to model endpoints.', category: 'authentication', target: 'model-endpoints', phase: 'runtime', ruleCount: 2, enabled: true, appliedTo: 8, namespace: 'global' },
  { id: 'p3', name: 'mTLS Client Certificate', description: 'Enforce mutual TLS for agent-to-agent communication in production namespaces.', category: 'authentication', target: 'agent-endpoints', phase: 'runtime', ruleCount: 1, enabled: false, appliedTo: 3, namespace: 'production' },
  { id: 'p4', name: 'Azure Key Vault Rotation', description: 'Rotate credentials stored in Azure Key Vault every 90 days with zero-downtime swap.', category: 'credentials', target: 'all-vaults', phase: 'runtime', ruleCount: 4, enabled: true, appliedTo: 6, namespace: 'global' },
  { id: 'p5', name: 'Service Principal Scoping', description: 'Restrict service principal tokens to minimum required scopes per namespace.', category: 'credentials', target: 'service-principals', phase: 'design-time', ruleCount: 2, enabled: true, appliedTo: 9, namespace: 'global' },
  { id: 'p6', name: 'Managed Identity Binding', description: 'Bind managed identities to specific resource groups and deny cross-tenant access.', category: 'credentials', target: 'managed-identities', phase: 'runtime', ruleCount: 3, enabled: true, appliedTo: 5, namespace: 'production' },
  { id: 'p7', name: 'Token-Per-Minute Limit', description: 'Cap token consumption at 100K TPM per namespace to prevent runaway costs.', category: 'rate-limits', target: 'model-endpoints', phase: 'runtime', ruleCount: 2, enabled: true, appliedTo: 14, namespace: 'global' },
  { id: 'p8', name: 'Request Burst Control', description: 'Limit burst requests to 50 RPS per client with sliding window throttling.', category: 'rate-limits', target: 'all-endpoints', phase: 'runtime', ruleCount: 1, enabled: true, appliedTo: 12, namespace: 'global' },
  { id: 'p9', name: 'Concurrent Session Quota', description: 'Limit concurrent streaming sessions to 20 per namespace for GPT-4 class models.', category: 'rate-limits', target: 'streaming-endpoints', phase: 'runtime', ruleCount: 2, enabled: true, appliedTo: 4, namespace: 'global' },
  { id: 'p10', name: 'PII Detection & Redaction', description: 'Detect and redact personally identifiable information from prompts before forwarding to models.', category: 'content-safety', target: 'all-models', phase: 'runtime', ruleCount: 5, enabled: true, appliedTo: 10, namespace: 'global' },
  { id: 'p11', name: 'Prompt Injection Shield', description: 'Block requests containing known prompt injection patterns and jailbreak attempts.', category: 'content-safety', target: 'chat-completions', phase: 'runtime', ruleCount: 3, enabled: true, appliedTo: 8, namespace: 'global' },
  { id: 'p12', name: 'Output Content Filter', description: 'Filter model responses for harmful, violent, or inappropriate content before returning to callers.', category: 'content-safety', target: 'all-models', phase: 'runtime', ruleCount: 4, enabled: true, appliedTo: 10, namespace: 'global' },
  { id: 'p13', name: 'Semantic Router', description: 'Route requests to the optimal model backend based on prompt complexity and cost tier.', category: 'routing', target: 'chat-completions', phase: 'runtime', ruleCount: 6, enabled: true, appliedTo: 7, namespace: 'global' },
  { id: 'p14', name: 'Fallback Chain', description: 'Automatically failover to secondary model providers when primary returns 5xx or times out.', category: 'routing', target: 'all-models', phase: 'runtime', ruleCount: 3, enabled: true, appliedTo: 10, namespace: 'global' },
  { id: 'p15', name: 'Request Transform', description: 'Normalize request payloads across OpenAI, Anthropic, and Azure OpenAI formats.', category: 'routing', target: 'all-endpoints', phase: 'runtime', ruleCount: 4, enabled: true, appliedTo: 12, namespace: 'global' },
  { id: 'p16', name: 'Tool Call Validation', description: 'Validate agent tool calls against registered tool schemas before execution.', category: 'agent-execution', target: 'agent-endpoints', phase: 'runtime', ruleCount: 2, enabled: true, appliedTo: 5, namespace: 'global' },
  { id: 'p17', name: 'Agent Step Limit', description: 'Limit agent reasoning loops to 25 steps to prevent infinite chains and excessive costs.', category: 'agent-execution', target: 'agent-endpoints', phase: 'runtime', ruleCount: 1, enabled: true, appliedTo: 5, namespace: 'global' },
  { id: 'p18', name: 'Human-in-the-Loop Gate', description: 'Require human approval for agent actions classified as high-risk (payments, deletions, external calls).', category: 'agent-execution', target: 'agent-endpoints', phase: 'runtime', ruleCount: 3, enabled: false, appliedTo: 2, namespace: 'production' },
]

const policyVersionsMap: Record<string, PolicyVersion[]> = {
  p1: [
    { version: 3, date: '2025-01-10', description: 'Added RS256 key rotation support', actor: 'sarah.chen@contoso.com' },
    { version: 2, date: '2024-12-15', description: 'Switched from HS256 to RS256 signing', actor: 'james.wilson@contoso.com' },
    { version: 1, date: '2024-11-01', description: 'Initial JWT validation policy', actor: 'sarah.chen@contoso.com' },
  ],
  p2: [
    { version: 2, date: '2025-01-08', description: 'Added rate limiting per API key', actor: 'mike.jones@contoso.com' },
    { version: 1, date: '2024-10-20', description: 'Initial API key authentication', actor: 'james.wilson@contoso.com' },
  ],
  p3: [
    { version: 2, date: '2025-01-05', description: 'Extended to agent-to-agent mTLS', actor: 'priya.sharma@contoso.com' },
    { version: 1, date: '2024-11-15', description: 'Initial mTLS policy for production', actor: 'sarah.chen@contoso.com' },
  ],
  p4: [
    { version: 4, date: '2025-01-12', description: 'Reduced rotation interval from 120 to 90 days', actor: 'james.wilson@contoso.com' },
    { version: 3, date: '2024-12-20', description: 'Added zero-downtime swap mechanism', actor: 'mike.jones@contoso.com' },
    { version: 2, date: '2024-11-10', description: 'Added multi-vault support', actor: 'sarah.chen@contoso.com' },
  ],
  p5: [
    { version: 2, date: '2025-01-03', description: 'Tightened scoping rules for dev namespace', actor: 'priya.sharma@contoso.com' },
    { version: 1, date: '2024-10-15', description: 'Initial service principal scoping', actor: 'james.wilson@contoso.com' },
  ],
  p6: [
    { version: 3, date: '2025-01-09', description: 'Blocked cross-tenant access entirely', actor: 'sarah.chen@contoso.com' },
    { version: 2, date: '2024-12-01', description: 'Added resource group binding', actor: 'mike.jones@contoso.com' },
    { version: 1, date: '2024-10-25', description: 'Initial managed identity binding', actor: 'priya.sharma@contoso.com' },
  ],
  p7: [
    { version: 3, date: '2025-01-11', description: 'Increased cap from 80K to 100K TPM', actor: 'mike.jones@contoso.com' },
    { version: 2, date: '2024-12-10', description: 'Added per-namespace tracking', actor: 'james.wilson@contoso.com' },
    { version: 1, date: '2024-11-05', description: 'Initial token rate limit', actor: 'sarah.chen@contoso.com' },
  ],
  p8: [
    { version: 2, date: '2025-01-06', description: 'Switched to sliding window algorithm', actor: 'priya.sharma@contoso.com' },
    { version: 1, date: '2024-11-20', description: 'Initial burst control at 30 RPS', actor: 'mike.jones@contoso.com' },
  ],
  p9: [
    { version: 2, date: '2025-01-04', description: 'Lowered limit from 30 to 20 sessions', actor: 'sarah.chen@contoso.com' },
    { version: 1, date: '2024-12-05', description: 'Initial concurrent session quota', actor: 'james.wilson@contoso.com' },
  ],
  p10: [
    { version: 5, date: '2025-01-13', description: 'Added phone number detection pattern', actor: 'priya.sharma@contoso.com' },
    { version: 4, date: '2025-01-02', description: 'Improved SSN regex accuracy', actor: 'sarah.chen@contoso.com' },
    { version: 3, date: '2024-12-18', description: 'Added credit card detection', actor: 'mike.jones@contoso.com' },
  ],
  p11: [
    { version: 3, date: '2025-01-07', description: 'Added 15 new injection patterns from Dec audit', actor: 'james.wilson@contoso.com' },
    { version: 2, date: '2024-12-12', description: 'Added jailbreak attempt detection', actor: 'sarah.chen@contoso.com' },
    { version: 1, date: '2024-11-08', description: 'Initial prompt injection shield', actor: 'priya.sharma@contoso.com' },
  ],
  p12: [
    { version: 4, date: '2025-01-14', description: 'Tuned sensitivity thresholds to reduce false positives', actor: 'mike.jones@contoso.com' },
    { version: 3, date: '2024-12-22', description: 'Added violence content category', actor: 'sarah.chen@contoso.com' },
    { version: 2, date: '2024-11-28', description: 'Added multi-language support', actor: 'priya.sharma@contoso.com' },
  ],
  p13: [
    { version: 6, date: '2025-01-15', description: 'Added cost-aware routing for GPT-4o mini', actor: 'sarah.chen@contoso.com' },
    { version: 5, date: '2025-01-01', description: 'Improved complexity scoring algorithm', actor: 'james.wilson@contoso.com' },
    { version: 4, date: '2024-12-08', description: 'Added Anthropic backend routing', actor: 'mike.jones@contoso.com' },
  ],
  p14: [
    { version: 3, date: '2025-01-09', description: 'Added health check before failover', actor: 'priya.sharma@contoso.com' },
    { version: 2, date: '2024-12-14', description: 'Added timeout-based failover trigger', actor: 'james.wilson@contoso.com' },
    { version: 1, date: '2024-11-12', description: 'Initial fallback chain for 5xx errors', actor: 'sarah.chen@contoso.com' },
  ],
  p15: [
    { version: 4, date: '2025-01-10', description: 'Added Gemini format normalization', actor: 'mike.jones@contoso.com' },
    { version: 3, date: '2024-12-19', description: 'Added Anthropic format support', actor: 'sarah.chen@contoso.com' },
    { version: 2, date: '2024-11-25', description: 'Added Azure OpenAI format mapping', actor: 'priya.sharma@contoso.com' },
  ],
  p16: [
    { version: 2, date: '2025-01-11', description: 'Added schema versioning validation', actor: 'james.wilson@contoso.com' },
    { version: 1, date: '2024-11-30', description: 'Initial tool call schema validation', actor: 'sarah.chen@contoso.com' },
  ],
  p17: [
    { version: 2, date: '2025-01-06', description: 'Reduced limit from 50 to 25 steps', actor: 'mike.jones@contoso.com' },
    { version: 1, date: '2024-12-02', description: 'Initial agent step limiter', actor: 'priya.sharma@contoso.com' },
  ],
  p18: [
    { version: 3, date: '2025-01-08', description: 'Added payment action classification', actor: 'sarah.chen@contoso.com' },
    { version: 2, date: '2024-12-16', description: 'Added external API call detection', actor: 'james.wilson@contoso.com' },
    { version: 1, date: '2024-11-18', description: 'Initial human-in-the-loop gate', actor: 'mike.jones@contoso.com' },
  ],
}

const policyDeploymentMap: Record<string, 'production' | 'sandbox' | 'staged'> = {
  p1: 'production', p2: 'production', p3: 'sandbox', p4: 'production',
  p5: 'staged', p6: 'staged', p7: 'production', p8: 'production',
  p9: 'staged', p10: 'production', p11: 'production', p12: 'production',
  p13: 'production', p14: 'production', p15: 'production', p16: 'production',
  p17: 'production', p18: 'sandbox',
}

const policies: Policy[] = _basePolicies.map(p => ({
  ...p,
  versions: policyVersionsMap[p.id] ?? [],
  deployment: policyDeploymentMap[p.id] ?? 'production',
}))

const accessRules: AssetAccessRule[] = [
  { id: 'ar1', name: 'Model Invoke RBAC', description: 'Only users with AI-Developer or ML-Engineer role can invoke GPT-4 class models.', type: 'who', assetType: 'Model', namespace: 'global', enabled: true, config: { identities: ['AI-Developer', 'ML-Engineer', 'Admin'] } },
  { id: 'ar2', name: 'Tool Execute Permissions', description: 'Restrict tool execution to service principals and managed identities only.', type: 'who', assetType: 'Tool', namespace: 'global', enabled: true, config: { identities: ['ServicePrincipal', 'ManagedIdentity'] } },
  { id: 'ar3', name: 'Agent Operator Role', description: 'Only Agent-Operator and Admin roles can invoke or configure production agents.', type: 'who', assetType: 'Agent', namespace: 'global', enabled: true, config: { identities: ['Agent-Operator', 'Admin'] } },
  { id: 'ar4', name: 'Read-Only Analyst Access', description: 'Analyst role can query models but cannot modify configurations or deploy.', type: 'who', assetType: 'Model', namespace: 'global', enabled: true, config: { identities: ['Analyst'] } },
  { id: 'ar5', name: 'Internal Domain Only', description: 'Restrict all model invocations to identities from @contoso.com domain.', type: 'who', assetType: 'All', namespace: 'global', enabled: true, config: { identities: ['contoso.com', 'contoso.onmicrosoft.com'] } },
  { id: 'ar6', name: 'Cross-Namespace Model Import', description: 'Allow staging namespace to import and use models from production.', type: 'where', assetType: 'Namespace', namespace: 'global', enabled: true, config: { assignedAssets: ['staging', 'production'] } },
  { id: 'ar7', name: 'Agent Sharing Policy', description: 'Restrict agent access to approved partner and production namespaces only.', type: 'where', assetType: 'Agent', namespace: 'global', enabled: true, config: { assignedAssets: ['Support Summarizer', 'Financial Analyst Agent'] } },
  { id: 'ar8', name: 'Sandbox Isolation', description: 'Sandbox namespace cannot access production or staging assets.', type: 'where', assetType: 'Namespace', namespace: 'global', enabled: true, config: { assignedAssets: ['sandbox', 'dev-sandbox'] } },
  { id: 'ar9', name: 'Tool Catalog Sharing', description: 'Control which tools are discoverable and executable across namespaces.', type: 'where', assetType: 'Tool', namespace: 'global', enabled: true, config: { assignedAssets: ['Content Moderator', 'CRM Lookup Tool', 'Jira Issue Tracker'] } },
]

const guardrails: RAIGuardrail[] = [
  { id: 'g1', name: 'Hate Speech Detection', description: 'Block prompts and responses containing hate speech, slurs, or discriminatory language.', category: 'content-safety', severity: 'block', target: 'all-models', appliesTo: ['gpt-4o', 'gpt-4-turbo', 'claude-3-opus'], namespace: 'global', enabled: true, triggersToday: 23, blockedToday: 23, lastTriggered: '2 min ago' },
  { id: 'g2', name: 'PII Leakage Prevention', description: 'Detect and redact SSNs, credit card numbers, and email addresses from model outputs.', category: 'privacy', severity: 'block', target: 'all-models', appliesTo: ['gpt-4o', 'gpt-4-turbo', 'claude-3-opus', 'gemini-pro'], namespace: 'global', enabled: true, triggersToday: 8, blockedToday: 8, lastTriggered: '15 min ago' },
  { id: 'g3', name: 'Prompt Injection Detection', description: 'Warn when prompt injection patterns are detected in user input.', category: 'security', severity: 'warn', target: 'chat-completions', appliesTo: ['gpt-4o', 'gpt-4-turbo'], namespace: 'global', enabled: true, triggersToday: 45, blockedToday: 0, lastTriggered: '1 min ago' },
  { id: 'g4', name: 'Copyright Content Filter', description: 'Log when model outputs potentially copyrighted content for review.', category: 'compliance', severity: 'log', target: 'all-models', appliesTo: ['gpt-4o', 'claude-3-opus'], namespace: 'global', enabled: true, triggersToday: 12, blockedToday: 0, lastTriggered: '30 min ago' },
  { id: 'g5', name: 'Self-Harm Content Block', description: 'Block any content related to self-harm or suicide with immediate escalation.', category: 'content-safety', severity: 'block', target: 'all-models', appliesTo: ['gpt-4o', 'gpt-4-turbo', 'claude-3-opus', 'gemini-pro'], namespace: 'global', enabled: true, triggersToday: 2, blockedToday: 2, lastTriggered: '3 hr ago' },
  { id: 'g6', name: 'Agent Action Audit', description: 'Log all high-risk agent actions (external API calls, file writes, payment processing).', category: 'agent-safety', severity: 'log', target: 'agent-endpoints', appliesTo: ['support-agent', 'billing-agent', 'data-pipeline-agent'], namespace: 'production', enabled: true, triggersToday: 156, blockedToday: 0, lastTriggered: 'Just now' },
]

const pendingApprovals: PendingApproval[] = [
  { id: 'pa1', assetName: 'GPT-4 Turbo', assetType: 'Model', action: 'Request Access', namespace: 'dev-team-alpha', requestedBy: 'sarah.chen@contoso.com', ruleTriggered: 'Premium Model Approval', requestedAt: '2 hours ago', status: 'pending' },
  { id: 'pa2', assetName: 'Billing Agent v2', assetType: 'Agent', action: 'Deploy to Production', namespace: 'production', requestedBy: 'james.wilson@contoso.com', ruleTriggered: 'Agent Deploy Approval', requestedAt: '5 hours ago', status: 'pending' },
  { id: 'pa3', assetName: 'Claude 3 Opus', assetType: 'Model', action: 'Request Access', namespace: 'research', requestedBy: 'priya.sharma@contoso.com', ruleTriggered: 'Premium Model Approval', requestedAt: '1 day ago', status: 'pending' },
  { id: 'pa4', assetName: 'Customer Data Tool', assetType: 'Tool', action: 'Cross-Namespace Import', namespace: 'analytics', requestedBy: 'mike.jones@contoso.com', ruleTriggered: 'Agent Sharing Policy', requestedAt: '2 days ago', status: 'pending' },
]

const auditTrailEntries: PolicyAuditEntry[] = [
  { id: 'au1', timestamp: '2025-01-15T14:32:00Z', actor: 'sarah.chen@contoso.com', action: 'updated', policyName: 'Semantic Router', policyId: 'p13', version: 6, details: 'Added cost-aware routing for GPT-4o mini to reduce inference costs by 40%' },
  { id: 'au2', timestamp: '2025-01-15T11:15:00Z', actor: 'mike.jones@contoso.com', action: 'updated', policyName: 'Output Content Filter', policyId: 'p12', version: 4, details: 'Tuned sensitivity thresholds — reduced false positive rate from 2.3% to 0.8%' },
  { id: 'au3', timestamp: '2025-01-14T16:45:00Z', actor: 'priya.sharma@contoso.com', action: 'enabled', policyName: 'PII Detection & Redaction', policyId: 'p10', version: 5, details: 'Re-enabled after phone number pattern was validated in staging' },
  { id: 'au4', timestamp: '2025-01-13T09:20:00Z', actor: 'james.wilson@contoso.com', action: 'rolled-back', policyName: 'Request Burst Control', policyId: 'p8', version: 1, details: 'Rolled back sliding window algorithm due to latency spike in production', previousVersion: 2 },
  { id: 'au5', timestamp: '2025-01-12T13:55:00Z', actor: 'sarah.chen@contoso.com', action: 'disabled', policyName: 'mTLS Client Certificate', policyId: 'p3', version: 2, details: 'Temporarily disabled for agent migration — certificate renewal pending' },
  { id: 'au6', timestamp: '2025-01-11T10:30:00Z', actor: 'mike.jones@contoso.com', action: 'updated', policyName: 'Token-Per-Minute Limit', policyId: 'p7', version: 3, details: 'Increased global TPM cap from 80K to 100K based on capacity planning review' },
  { id: 'au7', timestamp: '2025-01-10T17:10:00Z', actor: 'james.wilson@contoso.com', action: 'created', policyName: 'Tool Call Validation v2', policyId: 'p16', version: 2, details: 'Added schema versioning validation to support backward-compatible tool updates' },
  { id: 'au8', timestamp: '2025-01-09T08:45:00Z', actor: 'priya.sharma@contoso.com', action: 'updated', policyName: 'Fallback Chain', policyId: 'p14', version: 3, details: 'Added health check probe before triggering failover to reduce unnecessary switches' },
  { id: 'au9', timestamp: '2025-01-08T15:20:00Z', actor: 'sarah.chen@contoso.com', action: 'deleted', policyName: 'Legacy API Key v1', policyId: 'p_legacy', version: 1, details: 'Removed deprecated v1 API key policy — all consumers migrated to v2' },
  { id: 'au10', timestamp: '2025-01-08T11:00:00Z', actor: 'mike.jones@contoso.com', action: 'rolled-back', policyName: 'Agent Step Limit', policyId: 'p17', version: 1, details: 'Rolled back step limit reduction — some legitimate workflows need 30+ steps', previousVersion: 2 },
]

/* ------------------------------------------------------------------ */
/*  Design tokens                                                      */
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

const tabBar: CSSProperties = {
  display: 'flex', gap: 4, backgroundColor: '#161616',
  borderRadius: 8, padding: 4, width: 'fit-content',
}

const tabBase: CSSProperties = {
  padding: '7px 20px', borderRadius: 6, border: 'none',
  cursor: 'pointer', fontSize: 13, fontWeight: 600,
  fontFamily: 'inherit', transition: 'all 0.15s',
}

const tabActive: CSSProperties = {
  ...tabBase, backgroundColor: 'rgba(129, 140, 248, 0.15)', color: '#818CF8',
}

const tabInactive: CSSProperties = {
  ...tabBase, backgroundColor: 'transparent', color: '#999',
}

/* ------------------------------------------------------------------ */
/*  Config maps                                                        */
/* ------------------------------------------------------------------ */

const categoryConfig: Record<PolicyCategory, { label: string; color: string; bg: string; icon: string }> = {
  'authentication': { label: 'Authentication', color: '#818CF8', bg: 'rgba(129, 140, 248, 0.15)', icon: '🔑' },
  'credentials': { label: 'Credentials', color: '#c084fc', bg: '#2d1a4d', icon: '🔒' },
  'rate-limits': { label: 'Rate Limits & Quotas', color: '#fbbf24', bg: '#3d2800', icon: '⏱' },
  'content-safety': { label: 'Content Safety', color: '#f87171', bg: '#3d1a1a', icon: '🛡' },
  'routing': { label: 'Routing & Transformation', color: '#4ade80', bg: '#1a3a2a', icon: '🔀' },
  'agent-execution': { label: 'Agent Execution', color: '#38bdf8', bg: '#1a2d3d', icon: '🤖' },
}

const accessRuleConfig: Record<AccessRuleType, { label: string; color: string; bg: string; icon: string; desc: string }> = {
  'who': { label: 'Who Can Access', color: '#c084fc', bg: '#2d1a4d', icon: '🔑', desc: 'Control access by roles, groups, service principals, or domains' },
  'where': { label: 'Where It\'s Accessible', color: '#4ade80', bg: '#1a3a2a', icon: '🛡', desc: 'Define which assets are accessible — assign specific models, tools, agents, or namespaces' },
}

const severityConfig: Record<'block' | 'warn' | 'log', { color: string; bg: string; label: string }> = {
  block: { color: '#f87171', bg: '#3d1a1a', label: '🛑 Block' },
  warn: { color: '#fbbf24', bg: '#3d2800', label: '⚠️ Warn' },
  log: { color: '#a78bfa', bg: '#1e1a3d', label: '📝 Log' },
}


/* ------------------------------------------------------------------ */
/*  Template Libraries                                                  */
/* ------------------------------------------------------------------ */

interface AccessRuleTemplate {
  icon: string; name: string; description: string; tags: string[]
  prefill: {
    type: AccessRuleType; description: string
    assetType?: string; identities?: string
  }
}

interface RuntimeRuleTemplate {
  icon: string; name: string; description: string; tags: string[]
  prefill: { category: PolicyCategory; description: string; enforcement: string; threshold?: string }
}

interface GuardrailTemplate {
  icon: string; name: string; description: string; tags: string[]
  prefill: { category: PolicyCategory; description: string; enforcement: string; threshold: string }
}

const accessRuleTemplates: AccessRuleTemplate[] = [
  { icon: '🏢', name: 'Restrict to Internal Identities', description: 'Only internal roles and domains can access assets', tags: ['rbac', 'identity'], prefill: { type: 'who', description: 'Only internal roles and domains can access assets', identities: 'Internal-User, contoso.com' } },
  { icon: '🔐', name: 'Production Model RBAC', description: 'Require ML-Engineer or Admin role for production models', tags: ['rbac', 'production'], prefill: { type: 'who', description: 'Require ML-Engineer or Admin role for production models', assetType: 'Model', identities: 'ML-Engineer, Admin' } },
  { icon: '⚙️', name: 'Service Principal Only', description: 'Restrict to service principals and managed identities', tags: ['service-principal', 'identity'], prefill: { type: 'who', description: 'Restrict to service principals and managed identities', identities: 'ServicePrincipal, ManagedIdentity' } },
  { icon: '🔒', name: 'Sandbox Isolation', description: 'Prevent sandbox from accessing production assets', tags: ['namespace', 'isolation'], prefill: { type: 'where', description: 'Prevent sandbox from accessing production assets', assetType: 'Namespace' } },
  { icon: '🔄', name: 'Cross-Environment Promotion', description: 'Control which assets can move between environments', tags: ['cross-environment', 'promotion'], prefill: { type: 'where', description: 'Control which assets can move between environments', assetType: 'All' } },
  { icon: '🤝', name: 'Partner Asset Access', description: 'Define which assets partner namespaces can access', tags: ['partner', 'access'], prefill: { type: 'where', description: 'Define which assets partner namespaces can access', assetType: 'All' } },
]

const runtimeRuleTemplates: RuntimeRuleTemplate[] = [
  { icon: '⏱', name: 'Standard Rate Limit', description: '100 requests per minute per consumer', tags: ['rate-limit', 'throttle'], prefill: { category: 'rate-limits', description: '100 requests per minute per consumer', enforcement: 'Enforce', threshold: '100' } },
  { icon: '💰', name: 'Token Budget Cap', description: 'Limit token consumption to 50K TPM', tags: ['token', 'budget'], prefill: { category: 'rate-limits', description: 'Limit token consumption to 50K TPM', enforcement: 'Enforce', threshold: '50000' } },
  { icon: '🔑', name: 'API Key Authentication', description: 'Require API key header on all requests', tags: ['api-key', 'auth'], prefill: { category: 'authentication', description: 'Require API key header on all requests', enforcement: 'Enforce' } },
  { icon: '⏳', name: 'Request Timeout', description: '30-second timeout for all model endpoints', tags: ['timeout', 'routing'], prefill: { category: 'routing', description: '30-second timeout for all model endpoints', enforcement: 'Enforce', threshold: '30' } },
  { icon: '🔌', name: 'Circuit Breaker', description: 'Open circuit after 5 consecutive failures', tags: ['circuit-breaker', 'resilience'], prefill: { category: 'routing', description: 'Open circuit after 5 consecutive failures', enforcement: 'Enforce', threshold: '5' } },
  { icon: '📋', name: 'Audit Mode', description: 'Log all requests without enforcement', tags: ['audit', 'logging'], prefill: { category: 'authentication', description: 'Log all requests without enforcement', enforcement: 'Audit' } },
]

const guardrailTemplates: GuardrailTemplate[] = [
  { icon: '🛡', name: 'Block Hate Speech', description: 'Detect and block hate speech, slurs, discriminatory language', tags: ['hate-speech', 'content-safety'], prefill: { category: 'content-safety', description: 'Detect and block hate speech, slurs, discriminatory language', enforcement: 'block', threshold: 'all-models' } },
  { icon: '🔒', name: 'PII Detection & Redaction', description: 'Detect SSNs, credit cards, emails in outputs', tags: ['pii', 'privacy'], prefill: { category: 'content-safety', description: 'Detect SSNs, credit cards, emails in outputs', enforcement: 'block', threshold: 'all-models' } },
  { icon: '🔑', name: 'Prompt Injection Shield', description: 'Detect and warn on prompt injection patterns', tags: ['injection', 'security'], prefill: { category: 'authentication', description: 'Detect and warn on prompt injection patterns', enforcement: 'warn', threshold: 'chat-completions' } },
  { icon: '📋', name: 'Copyright Content Filter', description: 'Log when outputs contain potentially copyrighted content', tags: ['copyright', 'compliance'], prefill: { category: 'content-safety', description: 'Log when outputs contain potentially copyrighted content', enforcement: 'log', threshold: 'all-models' } },
  { icon: '🤖', name: 'Agent Action Audit', description: 'Log all high-risk agent actions (API calls, payments)', tags: ['agent', 'audit'], prefill: { category: 'agent-execution', description: 'Log all high-risk agent actions (API calls, payments)', enforcement: 'log', threshold: 'agent-endpoints' } },
  { icon: '🚨', name: 'Self-Harm Content Block', description: 'Block self-harm content with immediate escalation', tags: ['self-harm', 'safety'], prefill: { category: 'content-safety', description: 'Block self-harm content with immediate escalation', enforcement: 'block', threshold: 'all-models' } },
]

/* ------------------------------------------------------------------ */
/*  Helpers                                                            */
/* ------------------------------------------------------------------ */

const Toggle: React.FC<{ enabled: boolean; onToggle: () => void }> = ({ enabled, onToggle }) => (
  <span
    onClick={onToggle}
    style={{
      display: 'inline-flex', alignItems: 'center', width: 36, height: 20,
      borderRadius: 10, backgroundColor: enabled ? 'rgba(74,222,128,0.25)' : 'rgba(129, 140, 248, 0.10)',
      cursor: 'pointer', padding: 2, transition: 'background-color 0.15s', flexShrink: 0,
    }}
  >
    <span style={{
      width: 16, height: 16, borderRadius: '50%',
      backgroundColor: enabled ? colors.green : '#555',
      transition: 'all 0.15s',
      marginLeft: enabled ? 16 : 0,
    }} />
  </span>
)

/* ------------------------------------------------------------------ */
/*  Main component                                                     */
/* ------------------------------------------------------------------ */

type TabKey = 'runtime' | 'access' | 'guardrails' | 'audit' | 'approvals'

const Policies: React.FC = () => {
  const navigate = useNavigate()
  const [activeTab, setActiveTab] = useState<TabKey>('access')
  const [policyStates, setPolicyStates] = useState<Record<string, boolean>>(
    () => Object.fromEntries(policies.map(p => [p.id, p.enabled]))
  )
  const [ruleStates, setRuleStates] = useState<Record<string, boolean>>(
    () => Object.fromEntries(accessRules.map(r => [r.id, r.enabled]))
  )
  const [guardrailStates, setGuardrailStates] = useState<Record<string, boolean>>(
    () => Object.fromEntries(guardrails.map(g => [g.id, g.enabled]))
  )
  const [hoveredRow, setHoveredRow] = useState<string | null>(null)
  const [expandedVersions, setExpandedVersions] = useState<Record<string, boolean>>({})
  const [showCreateFlow, setShowCreateFlow] = useState(false)
  const [createFlowCategory, setCreateFlowCategory] = useState<null | 'access' | 'runtime' | 'guardrail'>(null)
  const [policyList, setPolicyList] = useState<Policy[]>(policies)
  const [approvalList, setApprovalList] = useState<PendingApproval[]>(pendingApprovals)
  const [policyFormData, setPolicyFormData] = useState({ name: '', category: 'authentication' as PolicyCategory, description: '', enforcement: 'Enforce', threshold: '', target: 'all' })

  // Dual-path creation flow state
  const [createFlowMethod, setCreateFlowMethod] = useState<null | 'library' | 'ai'>(null)
  const [aiComposeInput, setAiComposeInput] = useState('')
  const [aiCompiling, setAiCompiling] = useState(false)
  const [aiCompiled, setAiCompiled] = useState(false)
  const [templateSelected, setTemplateSelected] = useState(false)

  // Access Rule creation state
  const [accessRuleStep, setAccessRuleStep] = useState(1)
  const [accessRuleList, setAccessRuleList] = useState<AssetAccessRule[]>(accessRules)
  const [accessRuleForm, setAccessRuleForm] = useState<{
    name: string; type: AccessRuleType; description: string;
    assetType: string; identities: string;
  }>({ name: '', type: 'who', description: '', assetType: 'Model', identities: '' })
  const [accessRuleAssignments, setAccessRuleAssignments] = useState<Record<string, boolean>>({})

  // Policy (runtime/guardrail) 2-step creation state
  const [policyFormStep, setPolicyFormStep] = useState(1)
  const [policyAssignments, setPolicyAssignments] = useState<Record<string, boolean>>({})

  const allAssets = [
    { name: 'GPT-4o', type: 'Model', namespace: 'retail-support' },
    { name: 'GPT-4o-mini', type: 'Model', namespace: 'retail-support' },
    { name: 'Claude 3.5 Sonnet', type: 'Model', namespace: 'finance-analytics' },
    { name: 'Gemini 1.5 Pro', type: 'Model', namespace: 'finance-analytics' },
    { name: 'Claude 3 (Bedrock)', type: 'Model', namespace: 'customer-ops' },
    { name: 'Support Summarizer', type: 'Agent', namespace: 'retail-support' },
    { name: 'Financial Analyst Agent', type: 'Agent', namespace: 'finance-analytics' },
    { name: 'Sprint Planning Agent', type: 'Agent', namespace: 'dev-sandbox' },
    { name: 'Content Moderator', type: 'Tool', namespace: 'retail-support' },
    { name: 'CRM Lookup Tool', type: 'Tool', namespace: 'retail-support' },
    { name: 'Jira Issue Tracker', type: 'Tool', namespace: 'dev-sandbox' },
    { name: 'HR Database Connector', type: 'Tool', namespace: 'hr-automation' },
    { name: 'retail-support', type: 'Namespace', namespace: 'retail-support' },
    { name: 'finance-analytics', type: 'Namespace', namespace: 'finance-analytics' },
    { name: 'customer-ops', type: 'Namespace', namespace: 'customer-ops' },
    { name: 'hr-automation', type: 'Namespace', namespace: 'hr-automation' },
    { name: 'dev-sandbox', type: 'Namespace', namespace: 'dev-sandbox' },
    { name: 'production', type: 'Namespace', namespace: 'production' },
    { name: 'staging', type: 'Namespace', namespace: 'staging' },
    { name: 'sandbox', type: 'Namespace', namespace: 'sandbox' },
    { name: 'partners', type: 'Namespace', namespace: 'partners' },
  ]


  const handleCreateAccessRule = () => {
    const f = accessRuleForm
    const configMap: Record<AccessRuleType, Record<string, unknown>> = {
      'who': { identities: f.identities.split(',').map(s => s.trim()).filter(Boolean) },
      'where': {},
    }
    const assigned = Object.entries(accessRuleAssignments).filter(([, v]) => v).map(([k]) => k)
    const newRule: AssetAccessRule = {
      id: 'ar' + Date.now(), name: f.name, description: f.description, type: f.type,
      assetType: f.assetType, namespace: 'global',
      enabled: true, config: { ...configMap[f.type], assignedAssets: assigned },
    }
    setAccessRuleList(prev => [...prev, newRule])
    setRuleStates(s => ({ ...s, [newRule.id]: true }))
    setShowCreateFlow(false)
    setCreateFlowCategory(null)
    resetCreateFlowState()
    setAccessRuleStep(1)
    setAccessRuleForm({ name: '', type: 'who', description: '', assetType: 'Model', identities: '' })
    setAccessRuleAssignments({})
  }

  const handleCreatePolicy = () => {
    const newId = 'p' + Date.now()
    const assigned = Object.entries(policyAssignments).filter(([, v]) => v).map(([k]) => k)
    const newPolicy: Policy = {
      id: newId,
      name: policyFormData.name,
      description: policyFormData.description,
      category: policyFormData.category,
      target: policyFormData.target,
      phase: 'runtime',
      ruleCount: 1,
      enabled: true,
      appliedTo: assigned.length || 0,
      namespace: 'global',
      versions: [{ version: 1, date: new Date().toISOString().split('T')[0], description: 'Initial version', actor: 'current-user' }],
      deployment: 'sandbox',
    }
    setPolicyList(prev => [...prev, newPolicy])
    setPolicyStates(s => ({ ...s, [newId]: true }))
    setShowCreateFlow(false)
    setCreateFlowCategory(null)
    resetCreateFlowState()
    setPolicyFormData({ name: '', category: 'authentication', description: '', enforcement: 'Enforce', threshold: '', target: 'all' })
    setPolicyFormStep(1)
    setPolicyAssignments({})
  }

  const handleApproval = (id: string, _action: 'approved' | 'rejected') => {
    setApprovalList(prev => prev.filter(a => a.id !== id))
  }

  const togglePolicy = (id: string) => setPolicyStates(s => ({ ...s, [id]: !s[id] }))
  const toggleRule = (id: string) => setRuleStates(s => ({ ...s, [id]: !s[id] }))
  const toggleGuardrail = (id: string) => setGuardrailStates(s => ({ ...s, [id]: !s[id] }))

  const enabledPolicies = policyList.filter(p => policyStates[p.id]).length
  const enabledGuardrails = guardrails.filter(g => guardrailStates[g.id]).length

  const toggleVersionHistory = (id: string) => setExpandedVersions(s => ({ ...s, [id]: !s[id] }))

  const handleFormBack = () => {
    if (createFlowMethod === 'library') {
      setTemplateSelected(false)
    } else if (createFlowMethod === 'ai') {
      setAiCompiled(false)
    } else {
      setCreateFlowMethod(null)
    }
  }

  const handleAICompile = () => {
    setAiCompiling(true)
    setTimeout(() => {
      const input = aiComposeInput.toLowerCase()

      if (createFlowCategory === 'access') {
        let type: AccessRuleType = 'who'
        let name = 'AI-Generated Access Rule'
        const description = aiComposeInput
        let assetType = 'Model'
        let identities = ''

        if (input.includes('namespace') || input.includes('staging') || input.includes('sandbox') || input.includes('import') || input.includes('cross-environment') || input.includes('accessible')) {
          type = 'where'
          name = 'Asset Access Scope'
          if (input.includes('namespace')) assetType = 'Namespace'
          else assetType = 'All'
        } else {
          type = 'who'
          if (input.includes('engineer') || input.includes('admin') || input.includes('role')) {
            const parts: string[] = []
            if (input.includes('engineer')) parts.push('ML-Engineer')
            if (input.includes('admin')) parts.push('Admin')
            if (parts.length === 0) parts.push('AI-Developer')
            identities = parts.join(', ')
            name = 'Role-Based Access Rule'
          } else if (input.includes('service principal') || input.includes('managed identity')) {
            identities = 'ServicePrincipal, ManagedIdentity'
            name = 'Service Identity Rule'
          } else if (input.includes('internal') || input.includes('domain') || input.includes('contoso')) {
            identities = 'Internal-User, contoso.com'
            name = 'Internal Access Rule'
          } else {
            identities = 'AI-Developer'
            name = 'Custom Access Rule'
          }
          if (input.includes('agent')) assetType = 'Agent'
          else if (input.includes('tool')) assetType = 'Tool'
          else if (input.includes('namespace')) assetType = 'Namespace'
        }

        setAccessRuleForm(f => ({ ...f, name, type, description, assetType, identities }))
      } else if (createFlowCategory === 'runtime') {
        let category: PolicyCategory = 'authentication'
        let enforcement = 'Enforce'
        let threshold = ''
        let name = 'AI-Generated Runtime Rule'
        const description = aiComposeInput

        if (input.includes('rate limit') || input.includes('per minute') || input.includes('rpm')) {
          category = 'rate-limits'
          const match = input.match(/(\d+)/)
          if (match) threshold = match[1]
          name = 'Custom Rate Limit'
        } else if (input.includes('token') || input.includes('tpm')) {
          category = 'rate-limits'
          const match = input.match(/(\d+)/)
          if (match) threshold = match[1]
          name = 'Token Budget Policy'
        } else if (input.includes('api key') || input.includes('auth')) {
          category = 'authentication'
          name = 'Custom Auth Rule'
        } else if (input.includes('timeout')) {
          category = 'routing'
          const match = input.match(/(\d+)/)
          if (match) threshold = match[1]
          name = 'Request Timeout Rule'
        } else if (input.includes('circuit') || input.includes('breaker')) {
          category = 'routing'
          const match = input.match(/(\d+)/)
          if (match) threshold = match[1]
          name = 'Circuit Breaker Rule'
        } else if (input.includes('agent') || input.includes('tool call')) {
          category = 'agent-execution'
          name = 'Agent Execution Rule'
        }

        if (input.includes('audit') || input.includes('log only')) enforcement = 'Audit'
        if (input.includes('block') || input.includes('enforce')) enforcement = 'Enforce'

        setPolicyFormData({ name, category, description, enforcement, threshold, target: 'all' })
      } else if (createFlowCategory === 'guardrail') {
        let category: PolicyCategory = 'content-safety'
        let enforcement = 'block'
        let target = 'model-endpoints'
        let name = 'AI-Generated Guardrail'
        const description = aiComposeInput

        if (input.includes('pii') || input.includes('personal') || input.includes('redact') || input.includes('ssn') || input.includes('credit card')) {
          name = 'PII Detection Rule'
          enforcement = 'block'
        } else if (input.includes('hate') || input.includes('discriminat') || input.includes('slur')) {
          name = 'Hate Speech Filter'
          enforcement = 'block'
        } else if (input.includes('injection') || input.includes('jailbreak')) {
          category = 'authentication'
          name = 'Prompt Injection Guard'
          enforcement = 'warn'
          target = 'model-endpoints'
        } else if (input.includes('copyright') || input.includes('intellectual property')) {
          name = 'Copyright Content Filter'
          enforcement = 'log'
        } else if (input.includes('self-harm') || input.includes('suicide')) {
          name = 'Self-Harm Content Block'
          enforcement = 'block'
        } else if (input.includes('agent') || input.includes('action') || input.includes('payment')) {
          category = 'agent-execution'
          name = 'Agent Action Monitor'
          enforcement = 'log'
          target = 'agent-endpoints'
        }

        if (input.includes('block')) enforcement = 'block'
        else if (input.includes('warn')) enforcement = 'warn'
        else if (input.includes('log') || input.includes('audit')) enforcement = 'log'

        if (input.includes('agent-endpoint') || (input.includes('agent') && input.includes('endpoint'))) target = 'agent-endpoints'
        else if (input.includes('tool')) target = 'tool-endpoints'
        else if (input.includes('namespace')) target = 'namespaces'

        setPolicyFormData({ name, category, description, enforcement, threshold: '', target })
      }

      setAiCompiling(false)
      setAiCompiled(true)
    }, 1500)
  }

  const resetCreateFlowState = () => {
    setCreateFlowMethod(null)
    setAiComposeInput('')
    setAiCompiling(false)
    setAiCompiled(false)
    setTemplateSelected(false)
    setPolicyFormStep(1)
    setPolicyAssignments({})
  }

  /* ---- Tab: Runtime Rules ---- */
  const renderRuntimeRules = () => {
    const categories = Object.keys(categoryConfig) as PolicyCategory[]
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
        {categories.map(cat => {
          const cfg = categoryConfig[cat]
          const items = policyList.filter(p => p.category === cat)
          if (items.length === 0) return null
          return (
            <div key={cat}>
              {/* Category header */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
                <span style={{
                  width: 32, height: 32, borderRadius: 8, backgroundColor: cfg.bg,
                  display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontSize: 16,
                }}>{cfg.icon}</span>
                <span style={{ color: cfg.color, fontWeight: 600, fontSize: 14 }}>{cfg.label}</span>
                <span style={badge(cfg.bg, cfg.color)}>{items.length}</span>
              </div>
              {/* Policy cards */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {items.map(p => (
                  <div
                    key={p.id}
                    onMouseEnter={() => setHoveredRow(p.id)}
                    onMouseLeave={() => setHoveredRow(null)}
                    style={{
                      ...card,
                      display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 16,
                      backgroundColor: hoveredRow === p.id ? '#1A1A1A' : colors.card,
                      transition: 'background-color 0.15s',
                    }}
                  >
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', marginBottom: 4 }}>
                        <span style={{ color: '#fff', fontWeight: 600, fontSize: 13 }}>{p.name}</span>
                        <span style={badge(colors.goldMuted, colors.gold)}>{p.target}</span>
                        {p.namespace !== 'global' && (
                          <span style={badge('rgba(139,92,246,0.15)', '#a78bfa')}>{p.namespace}</span>
                        )}
                      </div>
                      <div style={{ color: colors.textMuted, fontSize: 12, marginBottom: 8, lineHeight: 1.4 }}>{p.description}</div>
                      {/* Version History */}
                      {p.versions.length > 0 && (
                        <div style={{ borderTop: `1px solid ${colors.border}`, paddingTop: 6, marginTop: 4 }}>
                          <span
                            onClick={() => toggleVersionHistory(p.id)}
                            style={{ fontSize: 11, color: colors.gold, cursor: 'pointer', userSelect: 'none' }}
                          >
                            📋 v{p.versions[0].version} — {p.versions[0].date} {expandedVersions[p.id] ? '▾' : '▸'}
                          </span>
                          {expandedVersions[p.id] && (
                            <div style={{ marginTop: 8, display: 'flex', flexDirection: 'column', gap: 6 }}>
                              {p.versions.map((v, vi) => (
                                <div key={v.version} style={{
                                  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                                  padding: '6px 10px', borderRadius: 6,
                                  backgroundColor: vi === 0 ? 'rgba(129, 140, 248, 0.06)' : 'rgba(129, 140, 248, 0.04)',
                                  fontSize: 11,
                                }}>
                                  <div style={{ flex: 1, minWidth: 0 }}>
                                    <span style={{ color: '#fff', fontWeight: 600 }}>v{v.version}</span>
                                    <span style={{ color: colors.textDim, marginLeft: 8 }}>{v.date}</span>
                                    <span style={{ color: colors.textDim, marginLeft: 8 }}>by {v.actor.split('@')[0]}</span>
                                    <div style={{ color: colors.textMuted, marginTop: 2 }}>{v.description}</div>
                                  </div>
                                  {vi > 0 && (
                                    <button style={{
                                      padding: '3px 10px', borderRadius: 4, backgroundColor: 'transparent',
                                      border: `1px solid ${colors.border}`, color: colors.textMuted, fontSize: 10,
                                      fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit', marginLeft: 8,
                                      whiteSpace: 'nowrap',
                                    }} onClick={() => alert(`Rolled back to ${v.version}`)}>↩ Rollback</button>
                                  )}
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                    <Toggle enabled={policyStates[p.id]} onToggle={() => togglePolicy(p.id)} />
                  </div>
                ))}
              </div>
            </div>
          )
        })}
      </div>
    )
  }

  /* ---- Tab: Asset Access Rules ---- */
  const renderAccessRules = () => {
    const types = Object.keys(accessRuleConfig) as AccessRuleType[]
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
        {types.map(ruleType => {
          const cfg = accessRuleConfig[ruleType]
          const items = accessRuleList.filter(r => r.type === ruleType)
          if (items.length === 0) return null
          return (
            <div key={ruleType}>
              {/* Type header */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
                <span style={{
                  width: 32, height: 32, borderRadius: 8, backgroundColor: cfg.bg,
                  display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontSize: 16,
                }}>{cfg.icon}</span>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span style={{ color: cfg.color, fontWeight: 600, fontSize: 14 }}>{cfg.label}</span>
                    <span style={badge(cfg.bg, cfg.color)}>{items.length}</span>
                  </div>
                  <div style={{ color: colors.textDim, fontSize: 11 }}>{cfg.desc}</div>
                </div>
              </div>
              {/* Rule cards */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 8 }}>
                {items.map(r => (
                  <div
                    key={r.id}
                    onMouseEnter={() => setHoveredRow(r.id)}
                    onMouseLeave={() => setHoveredRow(null)}
                    style={{
                      ...card,
                      display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 16,
                      backgroundColor: hoveredRow === r.id ? '#1A1A1A' : colors.card,
                      transition: 'background-color 0.15s',
                    }}
                  >
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', marginBottom: 4 }}>
                        <span style={{ color: '#fff', fontWeight: 600, fontSize: 13 }}>{r.name}</span>
                        <span style={badge(colors.goldMuted, colors.gold)}>{r.assetType}</span>
                      </div>
                      <div style={{ color: colors.textMuted, fontSize: 12, marginBottom: 8, lineHeight: 1.4 }}>{r.description}</div>
                      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', fontSize: 11 }}>
                        {renderConfigDetails(r)}
                      </div>
                    </div>
                    <Toggle enabled={ruleStates[r.id]} onToggle={() => toggleRule(r.id)} />
                  </div>
                ))}
              </div>
            </div>
          )
        })}
      </div>
    )
  }

  const renderConfigDetails = (rule: AssetAccessRule) => {
    const cfg = rule.config
    const detailStyle: CSSProperties = { color: colors.textDim, fontSize: 11 }

    switch (rule.type) {
      case 'who':
        return (
          <span style={detailStyle}>
            Identities:{' '}
            {(cfg.identities as string[]).map(id => (
              <span key={id} style={badge('rgba(192,132,252,0.12)', '#c084fc')}>{id}</span>
            ))}
          </span>
        )
      case 'where': {
        const assigned = (cfg.assignedAssets as string[] | undefined) ?? []
        return (
          <span style={detailStyle}>
            Applies to:{' '}
            {assigned.length > 0
              ? assigned.map(a => <span key={a} style={badge('rgba(74,222,128,0.12)', '#4ade80')}>{a}</span>)
              : <span style={{ color: '#888' }}>all assets (no specific assignment)</span>
            }
          </span>
        )
      }
      default:
        return null
    }
  }

  /* ---- Tab: Safety Guardrails ---- */
  const renderGuardrails = () => {
    const guardrailCategoryIcons: Record<string, { icon: string; color: string; bg: string }> = {
      'content-safety': { icon: '🛡', color: '#f87171', bg: '#3d1a1a' },
      'privacy': { icon: '🔒', color: '#c084fc', bg: '#2d1a4d' },
      'security': { icon: '🔑', color: '#fbbf24', bg: '#3d2800' },
      'compliance': { icon: '📋', color: '#38bdf8', bg: '#1a2d3d' },
      'agent-safety': { icon: '🤖', color: '#4ade80', bg: '#1a3a2a' },
    }

    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {guardrails.map(g => {
          const catCfg = guardrailCategoryIcons[g.category] ?? { icon: '📌', color: '#999', bg: '#2a2a2a' }
          const sevCfg = severityConfig[g.severity]
          return (
            <div
              key={g.id}
              onMouseEnter={() => setHoveredRow(g.id)}
              onMouseLeave={() => setHoveredRow(null)}
              style={{
                ...card,
                display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 16,
                backgroundColor: hoveredRow === g.id ? '#1A1A1A' : colors.card,
                transition: 'background-color 0.15s',
              }}
            >
              <div style={{ flex: 1, minWidth: 0 }}>
                {/* Header row */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', marginBottom: 4 }}>
                  <span style={{
                    width: 24, height: 24, borderRadius: 6, backgroundColor: catCfg.bg,
                    display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontSize: 13,
                  }}>{catCfg.icon}</span>
                  <span style={{ color: '#fff', fontWeight: 600, fontSize: 13 }}>{g.name}</span>
                  <span style={badge(catCfg.bg, catCfg.color)}>{g.category}</span>
                  <span style={badge(sevCfg.bg, sevCfg.color)}>{sevCfg.label}</span>
                  <span style={badge(colors.goldMuted, colors.gold)}>{g.target}</span>
                  {g.namespace !== 'global' && (
                    <span style={badge('rgba(139,92,246,0.15)', '#a78bfa')}>{g.namespace}</span>
                  )}
                </div>
                {/* Description */}
                <div style={{ color: colors.textMuted, fontSize: 12, marginBottom: 8, lineHeight: 1.4 }}>{g.description}</div>
                {/* Stats row */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                  {g.appliesTo.map(model => (
                    <span key={model} style={badge('rgba(129, 140, 248, 0.06)', colors.textMuted)}>{model}</span>
                  ))}
                  <span style={{ color: colors.textDim, fontSize: 11 }}>·</span>
                  <span
                    onClick={() => navigate('/logs?filter=' + g.category)}
                    style={{ fontSize: 11, color: g.triggersToday > 0 ? colors.amber : colors.textDim, cursor: 'pointer', textDecoration: 'none' }}
                    onMouseEnter={e => { (e.target as HTMLElement).style.textDecoration = 'underline' }}
                    onMouseLeave={e => { (e.target as HTMLElement).style.textDecoration = 'none' }}
                  >
                    ⚡ {g.triggersToday} trigger{g.triggersToday !== 1 ? 's' : ''} today
                  </span>
                  <span
                    onClick={() => navigate('/logs?filter=' + g.category)}
                    style={{ fontSize: 11, color: g.blockedToday > 0 ? colors.red : colors.textDim, cursor: 'pointer', textDecoration: 'none' }}
                    onMouseEnter={e => { (e.target as HTMLElement).style.textDecoration = 'underline' }}
                    onMouseLeave={e => { (e.target as HTMLElement).style.textDecoration = 'none' }}
                  >
                    🚫 {g.blockedToday} blocked
                  </span>
                  {g.lastTriggered && (
                    <span style={{ fontSize: 11, color: colors.textDim }}>Last: {g.lastTriggered}</span>
                  )}
                </div>
              </div>
              <Toggle enabled={guardrailStates[g.id]} onToggle={() => toggleGuardrail(g.id)} />
            </div>
          )
        })}
      </div>
    )
  }

  /* ---- Tab: Audit Trail ---- */
  const renderAuditTrail = () => {
    const actionBadgeConfig: Record<PolicyAuditEntry['action'], { color: string; bg: string; label: string }> = {
      created: { color: colors.green, bg: 'rgba(16,185,129,0.15)', label: 'Created' },
      updated: { color: colors.gold, bg: colors.goldMuted, label: 'Updated' },
      enabled: { color: colors.green, bg: 'rgba(16,185,129,0.15)', label: 'Enabled' },
      disabled: { color: colors.amber, bg: 'rgba(245,158,11,0.12)', label: 'Disabled' },
      deleted: { color: colors.red, bg: 'rgba(239,68,68,0.15)', label: 'Deleted' },
      'rolled-back': { color: colors.purple, bg: 'rgba(139,92,246,0.15)', label: 'Rolled Back' },
    }

    const relativeTime = (iso: string): string => {
      const now = new Date()
      const then = new Date(iso)
      const diffMs = now.getTime() - then.getTime()
      const diffMin = Math.floor(diffMs / 60000)
      if (diffMin < 60) return `${diffMin}m ago`
      const diffHr = Math.floor(diffMin / 60)
      if (diffHr < 24) return `${diffHr}h ago`
      const diffDay = Math.floor(diffHr / 24)
      return `${diffDay}d ago`
    }

    return (
      <div style={{ ...card, padding: 0, overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
          <thead>
            <tr style={{ borderBottom: '1px solid rgba(129, 140, 248, 0.10)', color: '#999', textAlign: 'left' }}>
              <th style={{ padding: '10px 16px', fontWeight: 600, fontSize: 12, whiteSpace: 'nowrap' }}>Time</th>
              <th style={{ padding: '10px 16px', fontWeight: 600, fontSize: 12, whiteSpace: 'nowrap' }}>Action</th>
              <th style={{ padding: '10px 16px', fontWeight: 600, fontSize: 12, whiteSpace: 'nowrap' }}>Policy</th>
              <th style={{ padding: '10px 16px', fontWeight: 600, fontSize: 12, whiteSpace: 'nowrap' }}>Version</th>
              <th style={{ padding: '10px 16px', fontWeight: 600, fontSize: 12 }}>Details</th>
              <th style={{ padding: '10px 16px', fontWeight: 600, fontSize: 12, whiteSpace: 'nowrap' }}>Actor</th>
            </tr>
          </thead>
          <tbody>
            {auditTrailEntries.map((entry, i) => {
              const aCfg = actionBadgeConfig[entry.action]
              return (
                <tr
                  key={entry.id}
                  onMouseEnter={() => setHoveredRow(`audit-${i}`)}
                  onMouseLeave={() => setHoveredRow(null)}
                  style={{
                    borderBottom: '1px solid rgba(129, 140, 248, 0.10)',
                    backgroundColor: hoveredRow === `audit-${i}` ? '#1A1A1A' : 'transparent',
                    transition: 'background-color 0.15s',
                  }}
                >
                  <td style={{ padding: '10px 16px', color: colors.textDim, fontSize: 12, whiteSpace: 'nowrap' }} title={new Date(entry.timestamp).toLocaleString()}>{relativeTime(entry.timestamp)}</td>
                  <td style={{ padding: '10px 16px' }}>
                    <span style={badge(aCfg.bg, aCfg.color)}>{aCfg.label}</span>
                  </td>
                  <td style={{ padding: '10px 16px', fontWeight: 500, color: colors.gold, whiteSpace: 'nowrap' }}>{entry.policyName}</td>
                  <td style={{ padding: '10px 16px' }}>
                    <span style={badge('rgba(129, 140, 248, 0.06)', colors.textMuted)}>v{entry.version}</span>
                  </td>
                  <td style={{ padding: '10px 16px', color: colors.textMuted, fontSize: 12, lineHeight: 1.4 }}>
                    {entry.details}
                    {entry.action === 'rolled-back' && entry.previousVersion != null && (
                      <span style={{ color: colors.purple, fontStyle: 'italic', marginLeft: 6 }}>↩ v{entry.previousVersion} → v{entry.version}</span>
                    )}
                  </td>
                  <td style={{ padding: '10px 16px', color: colors.textDim, fontSize: 12, whiteSpace: 'nowrap' }}>{entry.actor.split('@')[0]}</td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    )
  }

  /* ---- Pending Approvals section ---- */
  const renderApprovals = () => (
    <div style={{ ...card, padding: 0, overflow: 'hidden' }}>
      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
        <thead>
          <tr style={{ borderBottom: '1px solid rgba(129, 140, 248, 0.10)', color: '#999', textAlign: 'left' }}>
            <th style={{ padding: '10px 16px', fontWeight: 600, fontSize: 12, whiteSpace: 'nowrap' }}>Asset</th>
            <th style={{ padding: '10px 16px', fontWeight: 600, fontSize: 12, whiteSpace: 'nowrap' }}>Type</th>
            <th style={{ padding: '10px 16px', fontWeight: 600, fontSize: 12, whiteSpace: 'nowrap' }}>Action</th>
            <th style={{ padding: '10px 16px', fontWeight: 600, fontSize: 12, whiteSpace: 'nowrap' }}>Namespace</th>
            <th style={{ padding: '10px 16px', fontWeight: 600, fontSize: 12, whiteSpace: 'nowrap' }}>Requested By</th>
            <th style={{ padding: '10px 16px', fontWeight: 600, fontSize: 12, whiteSpace: 'nowrap' }}>Rule</th>
            <th style={{ padding: '10px 16px', fontWeight: 600, fontSize: 12, whiteSpace: 'nowrap' }}>Requested</th>
            <th style={{ padding: '10px 16px', fontWeight: 600, fontSize: 12, whiteSpace: 'nowrap' }}>Actions</th>
          </tr>
        </thead>
        <tbody>
          {approvalList.map((a, i) => (
            <tr
              key={a.id}
              onMouseEnter={() => setHoveredRow(`approval-${i}`)}
              onMouseLeave={() => setHoveredRow(null)}
              style={{
                borderBottom: '1px solid rgba(129, 140, 248, 0.10)',
                backgroundColor: hoveredRow === `approval-${i}` ? '#1A1A1A' : 'transparent',
                transition: 'background-color 0.15s',
              }}
            >
              <td style={{ padding: '10px 16px', fontWeight: 500, color: colors.gold }}>{a.assetName}</td>
              <td style={{ padding: '10px 16px' }}>
                <span style={badge(colors.goldMuted, colors.gold)}>{a.assetType}</span>
              </td>
              <td style={{ padding: '10px 16px', color: colors.text }}>{a.action}</td>
              <td style={{ padding: '10px 16px' }}>
                <span style={badge('rgba(139,92,246,0.15)', '#a78bfa')}>{a.namespace}</span>
              </td>
              <td style={{ padding: '10px 16px', color: colors.textMuted, fontSize: 12 }}>{a.requestedBy}</td>
              <td style={{ padding: '10px 16px', color: colors.textDim, fontSize: 12 }}>{a.ruleTriggered}</td>
              <td style={{ padding: '10px 16px', color: colors.textDim, fontSize: 12 }}>{a.requestedAt}</td>
              <td style={{ padding: '10px 16px' }}>
                <div style={{ display: 'flex', gap: 6 }}>
                  <button
                    onClick={() => handleApproval(a.id, 'approved')}
                    style={{
                    padding: '4px 12px', borderRadius: 4, border: 'none',
                    backgroundColor: 'rgba(74,222,128,0.15)', color: '#4ADE80', fontSize: 11,
                    fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit',
                  }}>Approve</button>
                  <button
                    onClick={() => handleApproval(a.id, 'rejected')}
                    style={{
                    padding: '4px 12px', borderRadius: 4, backgroundColor: 'transparent',
                    border: '1px solid rgba(239,68,68,0.3)', color: '#EF4444', fontSize: 11,
                    fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit',
                  }}>Reject</button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )

  /* ---- Render ---- */
  const tabs: { key: TabKey; label: string; badge?: number }[] = [
    { key: 'access', label: 'Asset Access Rules' },
    { key: 'runtime', label: 'Runtime Rules' },
    { key: 'guardrails', label: 'Safety Guardrails' },
    { key: 'audit', label: 'Audit Trail' },
    { key: 'approvals', label: 'Approvals', badge: approvalList.length },
  ]

  return (
    <div style={{ padding: 24, display: 'flex', flexDirection: 'column', gap: 20 }}>
      {/* Header — stat cards + create button (matches Access page) */}
      <div style={{ display: 'flex', gap: 14, alignItems: 'stretch' }}>
        {[
          { value: enabledPolicies, label: 'Runtime Rules', color: colors.gold },
          { value: accessRuleList.filter(r => ruleStates[r.id]).length, label: 'Access Rules', color: colors.purple },
          { value: enabledGuardrails, label: 'Guardrails', color: colors.green },
          { value: approvalList.length, label: 'Pending', color: colors.amber },
        ].map((s) => (
          <div key={s.label} style={{ backgroundColor: colors.card, border: `1px solid ${colors.border}`, borderRadius: 8, padding: 16, flex: 1, display: 'flex', flexDirection: 'column', gap: 4 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <span style={{ width: 8, height: 8, borderRadius: '50%', backgroundColor: s.color, display: 'inline-block', flexShrink: 0 }} />
              <span style={{ color: colors.textMuted, fontSize: 12 }}>{s.label}</span>
            </div>
            <span style={{ color: '#fff', fontSize: 28, fontWeight: 700, lineHeight: 1.1 }}>{s.value}</span>
          </div>
        ))}
        <button onClick={() => { setShowCreateFlow(true); setCreateFlowCategory(null); setCreateFlowMethod(null); setAiComposeInput(''); setAiCompiling(false); setAiCompiled(false); setTemplateSelected(false) }} style={{ backgroundColor: '#818CF8', color: '#FFFFFF', border: 'none', borderRadius: 6, padding: '8px 18px', fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit', whiteSpace: 'nowrap', alignSelf: 'center' }}>✚ Create Policy</button>
      </div>

      {/* Tabs */}
      <div style={tabBar}>
        {tabs.map(t => (
          <button
            key={t.key}
            onClick={() => setActiveTab(t.key)}
            style={activeTab === t.key ? tabActive : tabInactive}
          >
            {t.label}
            {t.badge != null && t.badge > 0 && (
              <span style={{ marginLeft: 6, padding: '1px 7px', borderRadius: 10, fontSize: 10, fontWeight: 700, backgroundColor: 'rgba(245,158,11,0.2)', color: '#F59E0B' }}>{t.badge}</span>
            )}
          </button>
        ))}
      </div>

      {/* Tab content */}
      {activeTab === 'runtime' && renderRuntimeRules()}
      {activeTab === 'access' && renderAccessRules()}
      {activeTab === 'guardrails' && renderGuardrails()}
      {activeTab === 'audit' && renderAuditTrail()}
      {activeTab === 'approvals' && renderApprovals()}

      {/* Unified Create Policy Modal */}
      {showCreateFlow && (() => {
        const showFormStep = createFlowCategory !== null && createFlowMethod !== null && (
          (createFlowMethod === 'library' && templateSelected) ||
          (createFlowMethod === 'ai' && aiCompiled)
        )
        const isLibraryView = createFlowCategory !== null && createFlowMethod === 'library' && !templateSelected
        return (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <div style={{ backgroundColor: '#1A1A1A', borderTop: '3px solid #818CF8', borderRadius: 8, padding: 24, width: '100%', maxWidth: isLibraryView ? 640 : 560, border: '1px solid rgba(129, 140, 248, 0.10)', transition: 'max-width 0.2s' }}>
            <style>{`@keyframes aiPulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.4; } }`}</style>

            {/* Step 1: Category picker */}
            {createFlowCategory === null && (
              <>
                <h3 style={{ color: '#fff', fontSize: 16, fontWeight: 600, margin: '0 0 4px' }}>Create Policy</h3>
                <p style={{ color: '#888', fontSize: 12, margin: '0 0 20px' }}>Choose a policy type to get started.</p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  {([
                    { key: 'access' as const, icon: '🔑', label: 'Asset Access Rule', desc: 'Control who can access assets by roles, namespaces, or domains', color: '#c084fc', bg: '#2d1a4d' },
                    { key: 'runtime' as const, icon: '⚙️', label: 'Runtime Rule', desc: 'Authentication, rate limits, routing, and execution policies', color: '#818CF8', bg: 'rgba(129, 140, 248,0.15)' },
                    { key: 'guardrail' as const, icon: '🛡', label: 'Safety Guardrail', desc: 'Content safety, PII detection, prompt injection shields', color: '#f87171', bg: '#3d1a1a' },
                  ]).map(cat => (
                    <button
                      key={cat.key}
                      onClick={() => setCreateFlowCategory(cat.key)}
                      style={{
                        display: 'flex', alignItems: 'center', gap: 14, padding: '14px 16px', borderRadius: 8,
                        backgroundColor: 'transparent', border: `1px solid rgba(129, 140, 248,0.10)`,
                        cursor: 'pointer', fontFamily: 'inherit', textAlign: 'left', transition: 'all 0.15s',
                      }}
                      onMouseEnter={e => { e.currentTarget.style.backgroundColor = cat.bg; e.currentTarget.style.borderColor = cat.color }}
                      onMouseLeave={e => { e.currentTarget.style.backgroundColor = 'transparent'; e.currentTarget.style.borderColor = 'rgba(129, 140, 248,0.10)' }}
                    >
                      <span style={{ width: 40, height: 40, borderRadius: 10, backgroundColor: cat.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20, flexShrink: 0 }}>{cat.icon}</span>
                      <div>
                        <div style={{ color: '#fff', fontWeight: 600, fontSize: 14 }}>{cat.label}</div>
                        <div style={{ color: '#888', fontSize: 12, marginTop: 2 }}>{cat.desc}</div>
                      </div>
                      <span style={{ marginLeft: 'auto', color: '#555', fontSize: 16 }}>→</span>
                    </button>
                  ))}
                </div>
                <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 20 }}>
                  <button onClick={() => setShowCreateFlow(false)} style={{ backgroundColor: 'transparent', color: '#ccc', border: '1px solid rgba(129, 140, 248, 0.10)', borderRadius: 6, padding: '8px 18px', fontSize: 13, fontWeight: 500, cursor: 'pointer', fontFamily: 'inherit' }}>Cancel</button>
                </div>
              </>
            )}

            {/* Step 2: Method picker (Library / AI) */}
            {createFlowCategory !== null && createFlowMethod === null && (
              <>
                <h3 style={{ color: '#fff', fontSize: 16, fontWeight: 600, margin: '0 0 4px' }}>
                  {createFlowCategory === 'access' ? 'Create Access Rule' : createFlowCategory === 'runtime' ? 'Create Runtime Rule' : 'Create Guardrail'}
                </h3>
                <p style={{ color: '#888', fontSize: 12, margin: '0 0 20px' }}>How would you like to create this policy?</p>
                <div style={{ display: 'flex', gap: 12 }}>
                  {([
                    { key: 'library' as const, icon: '📚', label: 'From Library', desc: 'Choose from pre-built policy templates', color: colors.gold, bg: colors.goldMuted },
                    { key: 'ai' as const, icon: '✨', label: 'Describe with AI', desc: 'Describe what you need in plain English', color: colors.purple, bg: 'rgba(167,139,250,0.15)' },
                  ]).map(method => (
                    <button
                      key={method.key}
                      onClick={() => setCreateFlowMethod(method.key)}
                      style={{
                        flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8,
                        padding: '20px 16px', borderRadius: 8, backgroundColor: 'transparent',
                        border: '1px solid rgba(129, 140, 248,0.10)', cursor: 'pointer',
                        fontFamily: 'inherit', textAlign: 'center', transition: 'all 0.15s',
                      }}
                      onMouseEnter={e => { e.currentTarget.style.backgroundColor = method.bg; e.currentTarget.style.borderColor = method.color }}
                      onMouseLeave={e => { e.currentTarget.style.backgroundColor = 'transparent'; e.currentTarget.style.borderColor = 'rgba(129, 140, 248,0.10)' }}
                    >
                      <span style={{ fontSize: 28 }}>{method.icon}</span>
                      <div style={{ color: '#fff', fontWeight: 600, fontSize: 14 }}>{method.label}</div>
                      <div style={{ color: '#888', fontSize: 12 }}>{method.desc}</div>
                    </button>
                  ))}
                </div>
                <div style={{ display: 'flex', justifyContent: 'flex-start', marginTop: 20 }}>
                  <button onClick={() => setCreateFlowCategory(null)} style={{ backgroundColor: 'transparent', color: '#ccc', border: '1px solid rgba(129, 140, 248, 0.10)', borderRadius: 6, padding: '8px 18px', fontSize: 13, fontWeight: 500, cursor: 'pointer', fontFamily: 'inherit' }}>← Back</button>
                </div>
              </>
            )}

            {/* Step 3a: Library grid */}
            {createFlowCategory !== null && createFlowMethod === 'library' && !templateSelected && (() => {
              const templates = createFlowCategory === 'access' ? accessRuleTemplates
                : createFlowCategory === 'runtime' ? runtimeRuleTemplates
                : guardrailTemplates
              const categoryColor = createFlowCategory === 'access' ? '#c084fc'
                : createFlowCategory === 'runtime' ? colors.gold
                : '#f87171'
              return (
                <>
                  <h3 style={{ color: '#fff', fontSize: 16, fontWeight: 600, margin: '0 0 4px' }}>Policy Templates</h3>
                  <p style={{ color: '#888', fontSize: 12, margin: '0 0 16px' }}>Select a template to customize</p>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, maxHeight: 400, overflowY: 'auto', paddingRight: 4 }}>
                    {templates.map((t, idx) => (
                      <button
                        key={idx}
                        onClick={() => {
                          if (createFlowCategory === 'access') {
                            const at = t as AccessRuleTemplate
                            setAccessRuleForm(f => ({
                              ...f, name: at.name, type: at.prefill.type,
                              description: at.prefill.description,
                              assetType: at.prefill.assetType ?? f.assetType,
                              identities: at.prefill.identities ?? '',
                            }))
                          } else if (createFlowCategory === 'guardrail') {
                            const gt = t as GuardrailTemplate
                            const targetMap: Record<string, string> = {
                              'all-models': 'model-endpoints', 'chat-completions': 'model-endpoints',
                              'agent-endpoints': 'agent-endpoints', 'all-endpoints': 'all',
                            }
                            setPolicyFormData(f => ({
                              ...f, name: gt.name, category: gt.prefill.category,
                              description: gt.prefill.description,
                              enforcement: gt.prefill.enforcement,
                              target: targetMap[gt.prefill.threshold] ?? 'all',
                              threshold: '',
                            }))
                          } else {
                            const rt = t as RuntimeRuleTemplate
                            setPolicyFormData(f => ({
                              ...f, name: rt.name, category: rt.prefill.category,
                              description: rt.prefill.description,
                              enforcement: rt.prefill.enforcement,
                              threshold: rt.prefill.threshold ?? '',
                              target: 'all',
                            }))
                          }
                          setTemplateSelected(true)
                        }}
                        style={{
                          display: 'flex', flexDirection: 'column', gap: 6, padding: '12px 14px',
                          borderRadius: 8, backgroundColor: '#0F0F0F',
                          border: '1px solid rgba(129, 140, 248,0.10)', cursor: 'pointer',
                          fontFamily: 'inherit', textAlign: 'left', transition: 'all 0.15s',
                        }}
                        onMouseEnter={e => { e.currentTarget.style.borderColor = categoryColor; e.currentTarget.style.backgroundColor = '#161616' }}
                        onMouseLeave={e => { e.currentTarget.style.borderColor = 'rgba(129, 140, 248,0.10)'; e.currentTarget.style.backgroundColor = '#0F0F0F' }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <span style={{ fontSize: 18 }}>{t.icon}</span>
                          <span style={{ color: '#fff', fontWeight: 600, fontSize: 13, lineHeight: 1.3 }}>{t.name}</span>
                        </div>
                        <div style={{ color: '#999', fontSize: 11, lineHeight: 1.4 }}>{t.description}</div>
                        <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap', marginTop: 2 }}>
                          {t.tags.map(tag => (
                            <span key={tag} style={{ display: 'inline-block', padding: '2px 6px', borderRadius: 4, fontSize: 10, fontWeight: 600, backgroundColor: 'rgba(129, 140, 248,0.08)', color: '#888' }}>{tag}</span>
                          ))}
                        </div>
                      </button>
                    ))}
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'flex-start', marginTop: 16 }}>
                    <button onClick={() => setCreateFlowMethod(null)} style={{ backgroundColor: 'transparent', color: '#ccc', border: '1px solid rgba(129, 140, 248, 0.10)', borderRadius: 6, padding: '8px 18px', fontSize: 13, fontWeight: 500, cursor: 'pointer', fontFamily: 'inherit' }}>← Back</button>
                  </div>
                </>
              )
            })()}

            {/* Step 3b: AI Compose */}
            {createFlowCategory !== null && createFlowMethod === 'ai' && !aiCompiled && (
              <>
                <h3 style={{ color: '#fff', fontSize: 16, fontWeight: 600, margin: '0 0 4px' }}>✨ Describe Your Policy</h3>
                <p style={{ color: '#888', fontSize: 12, margin: '0 0 16px' }}>Describe what you need in plain English and we'll compile it into a structured policy.</p>
                <textarea
                  value={aiComposeInput}
                  onChange={e => setAiComposeInput(e.target.value)}
                  rows={5}
                  placeholder={
                    createFlowCategory === 'access'
                      ? 'e.g. Only ML engineers and admins should be able to invoke production models...'
                      : createFlowCategory === 'runtime'
                        ? 'e.g. Rate limit all API calls to 100 requests per minute per consumer...'
                        : 'e.g. Block any prompts or responses containing hate speech or discriminatory language...'
                  }
                  disabled={aiCompiling}
                  style={{
                    width: '100%', backgroundColor: '#0F0F0F',
                    border: '1px solid rgba(167,139,250,0.25)', color: '#E8E8E8',
                    padding: '12px 14px', borderRadius: 8, fontSize: 13,
                    fontFamily: 'inherit', resize: 'vertical' as const,
                    boxSizing: 'border-box' as const, lineHeight: 1.5,
                    opacity: aiCompiling ? 0.5 : 1,
                  }}
                />
                {aiCompiling && (
                  <div style={{
                    display: 'flex', alignItems: 'center', gap: 10,
                    padding: '12px 16px', borderRadius: 8, marginTop: 12,
                    backgroundColor: 'rgba(167,139,250,0.08)',
                    border: '1px solid rgba(167,139,250,0.15)',
                  }}>
                    <span style={{ animation: 'aiPulse 1s ease-in-out infinite', display: 'inline-block', fontSize: 16 }}>✨</span>
                    <span style={{ color: colors.purple, fontSize: 13, fontWeight: 500 }}>Compiling your policy...</span>
                  </div>
                )}
                <div style={{ display: 'flex', justifyContent: 'space-between', gap: 10, marginTop: 16 }}>
                  <button
                    onClick={() => { setCreateFlowMethod(null); setAiComposeInput('') }}
                    disabled={aiCompiling}
                    style={{ backgroundColor: 'transparent', color: '#ccc', border: '1px solid rgba(129, 140, 248, 0.10)', borderRadius: 6, padding: '8px 18px', fontSize: 13, fontWeight: 500, cursor: aiCompiling ? 'not-allowed' : 'pointer', fontFamily: 'inherit', opacity: aiCompiling ? 0.5 : 1 }}
                  >← Back</button>
                  <button
                    onClick={handleAICompile}
                    disabled={!aiComposeInput.trim() || aiCompiling}
                    style={{
                      backgroundColor: (!aiComposeInput.trim() || aiCompiling) ? '#444' : colors.purple,
                      color: (!aiComposeInput.trim() || aiCompiling) ? '#888' : '#fff',
                      border: 'none', borderRadius: 6, padding: '8px 20px',
                      fontSize: 13, fontWeight: 600,
                      cursor: (!aiComposeInput.trim() || aiCompiling) ? 'not-allowed' : 'pointer',
                      fontFamily: 'inherit',
                    }}
                  >✨ Compile Policy</button>
                </div>
              </>
            )}

            {/* Step 4: Review forms (pre-filled from library or AI) */}

            {/* AI-compiled notice */}
            {showFormStep && aiCompiled && (
              <div style={{
                display: 'flex', alignItems: 'center', gap: 8,
                padding: '8px 14px', borderRadius: 6, marginBottom: 16,
                backgroundColor: 'rgba(167,139,250,0.08)',
                border: '1px solid rgba(167,139,250,0.12)',
              }}>
                <span style={{ fontSize: 14 }}>✨</span>
                <span style={{ color: colors.purple, fontSize: 12, fontWeight: 500 }}>AI-compiled — review before saving</span>
              </div>
            )}

            {/* Runtime Rule form (2-step) */}
            {createFlowCategory === 'runtime' && showFormStep && (
              <>
                {/* Step indicator */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 20 }}>
                  {['Define', 'Assign'].map((label, idx) => {
                    const step = idx + 1
                    const active = policyFormStep === step
                    const done = policyFormStep > step
                    return (
                      <React.Fragment key={label}>
                        {idx > 0 && <div style={{ flex: 1, height: 1, backgroundColor: done ? '#818CF8' : 'rgba(129, 140, 248,0.15)' }} />}
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                          <span style={{
                            width: 22, height: 22, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center',
                            fontSize: 11, fontWeight: 600,
                            backgroundColor: active ? '#818CF8' : done ? 'rgba(129, 140, 248,0.25)' : '#1E1E1E',
                            color: active ? '#0A0A0A' : done ? '#818CF8' : '#666',
                            border: active ? 'none' : '1px solid rgba(129, 140, 248,0.15)',
                          }}>{done ? '✓' : step}</span>
                          <span style={{ fontSize: 12, color: active ? '#fff' : '#888', fontWeight: active ? 600 : 400 }}>{label}</span>
                        </div>
                      </React.Fragment>
                    )
                  })}
                </div>

                {policyFormStep === 1 && (
                  <>
                    <h3 style={{ color: '#fff', fontSize: 16, fontWeight: 600, margin: '0 0 16px' }}>
                      {aiCompiled || templateSelected ? 'Review Runtime Rule' : 'Create Runtime Rule'}
                    </h3>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                      <div>
                        <label style={{ color: '#999', fontSize: 12, marginBottom: 4, display: 'block' }}>Policy Name</label>
                        <input value={policyFormData.name} onChange={e => setPolicyFormData(f => ({ ...f, name: e.target.value }))} style={{ width: '100%', backgroundColor: '#0F0F0F', border: '1px solid rgba(129, 140, 248,0.15)', color: '#E8E8E8', padding: '8px 12px', borderRadius: 6, fontSize: 13, fontFamily: 'inherit', boxSizing: 'border-box' as const }} />
                      </div>
                      <div>
                        <label style={{ color: '#999', fontSize: 12, marginBottom: 4, display: 'block' }}>
                          Category
                          {(templateSelected || aiCompiled) && <span style={{ color: '#888', fontSize: 11, marginLeft: 6 }}>{aiCompiled ? '(from AI)' : '(from template)'}</span>}
                        </label>
                        <select value={policyFormData.category} onChange={e => setPolicyFormData(f => ({ ...f, category: e.target.value as PolicyCategory }))} disabled={templateSelected || aiCompiled} style={{ width: '100%', backgroundColor: '#0F0F0F', border: '1px solid rgba(129, 140, 248,0.15)', color: '#E8E8E8', padding: '8px 12px', borderRadius: 6, fontSize: 13, fontFamily: 'inherit', ...((templateSelected || aiCompiled) ? { opacity: 0.6, cursor: 'not-allowed' } : {}) }}>
                          <option value="authentication">Authentication</option>
                          <option value="rate-limits">Rate Limits</option>
                          <option value="content-safety">Content Safety</option>
                          <option value="routing">Routing</option>
                          <option value="agent-execution">Agent Execution</option>
                          <option value="credentials">Credentials</option>
                        </select>
                      </div>
                      <div>
                        <label style={{ color: '#999', fontSize: 12, marginBottom: 4, display: 'block' }}>Description</label>
                        <textarea value={policyFormData.description} onChange={e => setPolicyFormData(f => ({ ...f, description: e.target.value }))} rows={3} style={{ width: '100%', backgroundColor: '#0F0F0F', border: '1px solid rgba(129, 140, 248,0.15)', color: '#E8E8E8', padding: '8px 12px', borderRadius: 6, fontSize: 13, fontFamily: 'inherit', resize: 'vertical' as const, boxSizing: 'border-box' as const }} />
                      </div>
                      <div>
                        <label style={{ color: '#999', fontSize: 12, marginBottom: 4, display: 'block' }}>Enforcement</label>
                        <select value={policyFormData.enforcement} onChange={e => setPolicyFormData(f => ({ ...f, enforcement: e.target.value }))} style={{ width: '100%', backgroundColor: '#0F0F0F', border: '1px solid rgba(129, 140, 248,0.15)', color: '#E8E8E8', padding: '8px 12px', borderRadius: 6, fontSize: 13, fontFamily: 'inherit' }}>
                          <option>Enforce</option>
                          <option>Audit</option>
                          <option>Disabled</option>
                        </select>
                      </div>
                      <div>
                        <label style={{ color: '#999', fontSize: 12, marginBottom: 4, display: 'block' }}>Target</label>
                        <select value={policyFormData.target} onChange={e => setPolicyFormData(f => ({ ...f, target: e.target.value }))} style={{ width: '100%', backgroundColor: '#0F0F0F', border: '1px solid rgba(129, 140, 248,0.15)', color: '#E8E8E8', padding: '8px 12px', borderRadius: 6, fontSize: 13, fontFamily: 'inherit' }}>
                          <option value="model-endpoints">Model Endpoints</option>
                          <option value="tool-endpoints">Tool Endpoints</option>
                          <option value="agent-endpoints">Agent Endpoints</option>
                          <option value="namespaces">Namespaces</option>
                          <option value="all">All</option>
                        </select>
                      </div>
                      <div>
                        <label style={{ color: '#999', fontSize: 12, marginBottom: 4, display: 'block' }}>Threshold (optional)</label>
                        <input type="number" value={policyFormData.threshold} onChange={e => setPolicyFormData(f => ({ ...f, threshold: e.target.value }))} style={{ width: '100%', backgroundColor: '#0F0F0F', border: '1px solid rgba(129, 140, 248,0.15)', color: '#E8E8E8', padding: '8px 12px', borderRadius: 6, fontSize: 13, fontFamily: 'inherit', boxSizing: 'border-box' as const }} />
                      </div>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', gap: 10, marginTop: 20 }}>
                      <button onClick={() => { handleFormBack(); setPolicyFormStep(1) }} style={{ backgroundColor: 'transparent', color: '#ccc', border: '1px solid rgba(129, 140, 248, 0.10)', borderRadius: 6, padding: '8px 18px', fontSize: 13, fontWeight: 500, cursor: 'pointer', fontFamily: 'inherit' }}>← Back</button>
                      <button disabled={!policyFormData.name} onClick={() => setPolicyFormStep(2)} style={{
                        backgroundColor: !policyFormData.name ? '#555' : '#818CF8', color: !policyFormData.name ? '#999' : '#0A0A0A',
                        border: 'none', borderRadius: 6, padding: '8px 18px', fontSize: 13, fontWeight: 600, cursor: !policyFormData.name ? 'not-allowed' : 'pointer', fontFamily: 'inherit',
                      }}>Next: Assign →</button>
                    </div>
                  </>
                )}

                {policyFormStep === 2 && (() => {
                  const typeEmojis: Record<string, string> = { Model: '🧠', Agent: '🤖', Tool: '🔧', Namespace: '🗂' }
                  const assetTypes = ['Model', 'Agent', 'Tool', 'Namespace']
                  const targetTypeMap: Record<string, string> = { 'model-endpoints': 'Model', 'tool-endpoints': 'Tool', 'agent-endpoints': 'Agent', 'namespaces': 'Namespace' }
                  const filteredAssets = policyFormData.target === 'all'
                    ? allAssets
                    : allAssets.filter(a => a.type === targetTypeMap[policyFormData.target])
                  const assignedCount = Object.values(policyAssignments).filter(Boolean).length
                  return (
                    <>
                      <h3 style={{ color: '#fff', fontSize: 16, fontWeight: 600, margin: '0 0 4px' }}>Assign to Assets</h3>
                      <p style={{ color: '#888', fontSize: 12, margin: '0 0 16px' }}>
                        Select which {policyFormData.target === 'all' ? 'assets' : targetTypeMap[policyFormData.target]?.toLowerCase() + 's'} this rule applies to, or skip to apply globally.
                      </p>
                      <div style={{ maxHeight: 300, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 14, paddingRight: 4 }}>
                        {assetTypes.map(aType => {
                          const items = filteredAssets.filter(a => a.type === aType)
                          if (items.length === 0) return null
                          const checkedCount = items.filter(a => policyAssignments[a.name]).length
                          return (
                            <div key={aType}>
                              <div style={{ fontSize: 12, color: '#888', fontWeight: 600, marginBottom: 6, textTransform: 'uppercase', letterSpacing: 0.5 }}>
                                {typeEmojis[aType]} {aType}s ({checkedCount}/{items.length})
                              </div>
                              <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                                {items.map(a => {
                                  const checked = !!policyAssignments[a.name]
                                  return (
                                    <label key={a.name} style={{
                                      display: 'flex', alignItems: 'center', gap: 10, padding: '6px 10px', borderRadius: 6,
                                      backgroundColor: checked ? 'rgba(129, 140, 248,0.08)' : 'transparent',
                                      border: '1px solid ' + (checked ? 'rgba(129, 140, 248,0.25)' : 'rgba(129, 140, 248,0.06)'),
                                      cursor: 'pointer', transition: 'all 0.15s',
                                    }}>
                                      <input type="checkbox" checked={checked} onChange={() => setPolicyAssignments(prev => ({ ...prev, [a.name]: !prev[a.name] }))} style={{ accentColor: '#818CF8' }} />
                                      <span style={{ fontSize: 13, color: '#E8E8E8', flex: 1 }}>{a.name}</span>
                                      <span style={{ fontSize: 11, color: '#666' }}>{a.namespace}</span>
                                    </label>
                                  )
                                })}
                              </div>
                            </div>
                          )
                        })}
                        {filteredAssets.length === 0 && (
                          <div style={{ textAlign: 'center', color: '#666', fontSize: 13, padding: 20 }}>No matching assets</div>
                        )}
                      </div>
                      {assignedCount > 0 && (
                        <div style={{ marginTop: 12, padding: '8px 12px', backgroundColor: 'rgba(129, 140, 248,0.06)', borderRadius: 6, fontSize: 12, color: '#818CF8' }}>
                          {assignedCount} asset{assignedCount !== 1 ? 's' : ''} selected
                        </div>
                      )}
                      <div style={{ display: 'flex', justifyContent: 'space-between', gap: 10, marginTop: 20 }}>
                        <button onClick={() => setPolicyFormStep(1)} style={{ backgroundColor: 'transparent', color: '#ccc', border: '1px solid rgba(129, 140, 248, 0.10)', borderRadius: 6, padding: '8px 18px', fontSize: 13, fontWeight: 500, cursor: 'pointer', fontFamily: 'inherit' }}>← Back</button>
                        <div style={{ display: 'flex', gap: 10 }}>
                          <button onClick={() => { setPolicyAssignments({}); handleCreatePolicy() }} style={{ backgroundColor: 'transparent', color: '#ccc', border: '1px solid rgba(129, 140, 248, 0.10)', borderRadius: 6, padding: '8px 18px', fontSize: 13, fontWeight: 500, cursor: 'pointer', fontFamily: 'inherit' }}>Skip (apply globally)</button>
                          <button onClick={handleCreatePolicy} style={{ backgroundColor: '#818CF8', color: '#FFFFFF', border: 'none', borderRadius: 6, padding: '8px 18px', fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}>
                            {assignedCount > 0 ? `Create & Assign (${assignedCount})` : 'Create Runtime Rule'}
                          </button>
                        </div>
                      </div>
                    </>
                  )
                })()}
              </>
            )}

            {/* Guardrail form (2-step) */}
            {createFlowCategory === 'guardrail' && showFormStep && (
              <>
                {/* Step indicator */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 20 }}>
                  {['Define', 'Assign'].map((label, idx) => {
                    const step = idx + 1
                    const active = policyFormStep === step
                    const done = policyFormStep > step
                    return (
                      <React.Fragment key={label}>
                        {idx > 0 && <div style={{ flex: 1, height: 1, backgroundColor: done ? '#818CF8' : 'rgba(129, 140, 248,0.15)' }} />}
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                          <span style={{
                            width: 22, height: 22, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center',
                            fontSize: 11, fontWeight: 600,
                            backgroundColor: active ? '#818CF8' : done ? 'rgba(129, 140, 248,0.25)' : '#1E1E1E',
                            color: active ? '#0A0A0A' : done ? '#818CF8' : '#666',
                            border: active ? 'none' : '1px solid rgba(129, 140, 248,0.15)',
                          }}>{done ? '✓' : step}</span>
                          <span style={{ fontSize: 12, color: active ? '#fff' : '#888', fontWeight: active ? 600 : 400 }}>{label}</span>
                        </div>
                      </React.Fragment>
                    )
                  })}
                </div>

                {policyFormStep === 1 && (
                  <>
                    <h3 style={{ color: '#fff', fontSize: 16, fontWeight: 600, margin: '0 0 16px' }}>
                      {aiCompiled || templateSelected ? 'Review Safety Guardrail' : 'Create Safety Guardrail'}
                    </h3>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                      <div>
                        <label style={{ color: '#999', fontSize: 12, marginBottom: 4, display: 'block' }}>Guardrail Name</label>
                        <input value={policyFormData.name} onChange={e => setPolicyFormData(f => ({ ...f, name: e.target.value }))} placeholder="e.g. Custom PII Filter" style={{ width: '100%', backgroundColor: '#0F0F0F', border: '1px solid rgba(129, 140, 248,0.15)', color: '#E8E8E8', padding: '8px 12px', borderRadius: 6, fontSize: 13, fontFamily: 'inherit', boxSizing: 'border-box' as const }} />
                      </div>
                      <div>
                        <label style={{ color: '#999', fontSize: 12, marginBottom: 4, display: 'block' }}>
                          Category
                          {(templateSelected || aiCompiled) && <span style={{ color: '#888', fontSize: 11, marginLeft: 6 }}>{aiCompiled ? '(from AI)' : '(from template)'}</span>}
                        </label>
                        <select value={policyFormData.category} onChange={e => setPolicyFormData(f => ({ ...f, category: e.target.value as PolicyCategory }))} disabled={templateSelected || aiCompiled} style={{ width: '100%', backgroundColor: '#0F0F0F', border: '1px solid rgba(129, 140, 248,0.15)', color: '#E8E8E8', padding: '8px 12px', borderRadius: 6, fontSize: 13, fontFamily: 'inherit', ...((templateSelected || aiCompiled) ? { opacity: 0.6, cursor: 'not-allowed' } : {}) }}>
                          <option value="content-safety">Content Safety</option>
                          <option value="authentication">Security</option>
                          <option value="agent-execution">Agent Safety</option>
                        </select>
                      </div>
                      <div>
                        <label style={{ color: '#999', fontSize: 12, marginBottom: 4, display: 'block' }}>Description</label>
                        <textarea value={policyFormData.description} onChange={e => setPolicyFormData(f => ({ ...f, description: e.target.value }))} rows={2} placeholder="Describe what this guardrail detects or blocks..." style={{ width: '100%', backgroundColor: '#0F0F0F', border: '1px solid rgba(129, 140, 248,0.15)', color: '#E8E8E8', padding: '8px 12px', borderRadius: 6, fontSize: 13, fontFamily: 'inherit', resize: 'vertical' as const, boxSizing: 'border-box' as const }} />
                      </div>
                      <div>
                        <label style={{ color: '#999', fontSize: 12, marginBottom: 4, display: 'block' }}>Severity</label>
                        <select value={policyFormData.enforcement} onChange={e => setPolicyFormData(f => ({ ...f, enforcement: e.target.value }))} style={{ width: '100%', backgroundColor: '#0F0F0F', border: '1px solid rgba(129, 140, 248,0.15)', color: '#E8E8E8', padding: '8px 12px', borderRadius: 6, fontSize: 13, fontFamily: 'inherit' }}>
                          <option value="block">🛑 Block — prevent request/response</option>
                          <option value="warn">⚠️ Warn — flag but allow through</option>
                          <option value="log">📝 Log — record for audit only</option>
                        </select>
                      </div>
                      <div>
                        <label style={{ color: '#999', fontSize: 12, marginBottom: 4, display: 'block' }}>Target</label>
                        <select value={policyFormData.target} onChange={e => setPolicyFormData(f => ({ ...f, target: e.target.value }))} style={{ width: '100%', backgroundColor: '#0F0F0F', border: '1px solid rgba(129, 140, 248,0.15)', color: '#E8E8E8', padding: '8px 12px', borderRadius: 6, fontSize: 13, fontFamily: 'inherit' }}>
                          <option value="model-endpoints">Model Endpoints</option>
                          <option value="tool-endpoints">Tool Endpoints</option>
                          <option value="agent-endpoints">Agent Endpoints</option>
                          <option value="namespaces">Namespaces</option>
                          <option value="all">All</option>
                        </select>
                      </div>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', gap: 10, marginTop: 20 }}>
                      <button onClick={() => { handleFormBack(); setPolicyFormStep(1) }} style={{ backgroundColor: 'transparent', color: '#ccc', border: '1px solid rgba(129, 140, 248, 0.10)', borderRadius: 6, padding: '8px 18px', fontSize: 13, fontWeight: 500, cursor: 'pointer', fontFamily: 'inherit' }}>← Back</button>
                      <button disabled={!policyFormData.name} onClick={() => setPolicyFormStep(2)} style={{
                        backgroundColor: !policyFormData.name ? '#555' : '#818CF8', color: !policyFormData.name ? '#999' : '#0A0A0A',
                        border: 'none', borderRadius: 6, padding: '8px 18px', fontSize: 13, fontWeight: 600, cursor: !policyFormData.name ? 'not-allowed' : 'pointer', fontFamily: 'inherit',
                      }}>Next: Assign →</button>
                    </div>
                  </>
                )}

                {policyFormStep === 2 && (() => {
                  const typeEmojis: Record<string, string> = { Model: '🧠', Agent: '🤖', Tool: '🔧', Namespace: '🗂' }
                  const assetTypes = ['Model', 'Agent', 'Tool', 'Namespace']
                  const targetTypeMap: Record<string, string> = { 'model-endpoints': 'Model', 'tool-endpoints': 'Tool', 'agent-endpoints': 'Agent', 'namespaces': 'Namespace' }
                  const filteredAssets = policyFormData.target === 'all'
                    ? allAssets
                    : allAssets.filter(a => a.type === targetTypeMap[policyFormData.target])
                  const assignedCount = Object.values(policyAssignments).filter(Boolean).length
                  return (
                    <>
                      <h3 style={{ color: '#fff', fontSize: 16, fontWeight: 600, margin: '0 0 4px' }}>Assign to Assets</h3>
                      <p style={{ color: '#888', fontSize: 12, margin: '0 0 16px' }}>
                        Select which {policyFormData.target === 'all' ? 'assets' : targetTypeMap[policyFormData.target]?.toLowerCase() + 's'} this guardrail applies to, or skip to apply globally.
                      </p>
                      <div style={{ maxHeight: 300, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 14, paddingRight: 4 }}>
                        {assetTypes.map(aType => {
                          const items = filteredAssets.filter(a => a.type === aType)
                          if (items.length === 0) return null
                          const checkedCount = items.filter(a => policyAssignments[a.name]).length
                          return (
                            <div key={aType}>
                              <div style={{ fontSize: 12, color: '#888', fontWeight: 600, marginBottom: 6, textTransform: 'uppercase', letterSpacing: 0.5 }}>
                                {typeEmojis[aType]} {aType}s ({checkedCount}/{items.length})
                              </div>
                              <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                                {items.map(a => {
                                  const checked = !!policyAssignments[a.name]
                                  return (
                                    <label key={a.name} style={{
                                      display: 'flex', alignItems: 'center', gap: 10, padding: '6px 10px', borderRadius: 6,
                                      backgroundColor: checked ? 'rgba(129, 140, 248,0.08)' : 'transparent',
                                      border: '1px solid ' + (checked ? 'rgba(129, 140, 248,0.25)' : 'rgba(129, 140, 248,0.06)'),
                                      cursor: 'pointer', transition: 'all 0.15s',
                                    }}>
                                      <input type="checkbox" checked={checked} onChange={() => setPolicyAssignments(prev => ({ ...prev, [a.name]: !prev[a.name] }))} style={{ accentColor: '#818CF8' }} />
                                      <span style={{ fontSize: 13, color: '#E8E8E8', flex: 1 }}>{a.name}</span>
                                      <span style={{ fontSize: 11, color: '#666' }}>{a.namespace}</span>
                                    </label>
                                  )
                                })}
                              </div>
                            </div>
                          )
                        })}
                        {filteredAssets.length === 0 && (
                          <div style={{ textAlign: 'center', color: '#666', fontSize: 13, padding: 20 }}>No matching assets</div>
                        )}
                      </div>
                      {assignedCount > 0 && (
                        <div style={{ marginTop: 12, padding: '8px 12px', backgroundColor: 'rgba(129, 140, 248,0.06)', borderRadius: 6, fontSize: 12, color: '#818CF8' }}>
                          {assignedCount} asset{assignedCount !== 1 ? 's' : ''} selected
                        </div>
                      )}
                      <div style={{ display: 'flex', justifyContent: 'space-between', gap: 10, marginTop: 20 }}>
                        <button onClick={() => setPolicyFormStep(1)} style={{ backgroundColor: 'transparent', color: '#ccc', border: '1px solid rgba(129, 140, 248, 0.10)', borderRadius: 6, padding: '8px 18px', fontSize: 13, fontWeight: 500, cursor: 'pointer', fontFamily: 'inherit' }}>← Back</button>
                        <div style={{ display: 'flex', gap: 10 }}>
                          <button onClick={() => { setPolicyAssignments({}); handleCreatePolicy() }} style={{ backgroundColor: 'transparent', color: '#ccc', border: '1px solid rgba(129, 140, 248, 0.10)', borderRadius: 6, padding: '8px 18px', fontSize: 13, fontWeight: 500, cursor: 'pointer', fontFamily: 'inherit' }}>Skip (apply globally)</button>
                          <button onClick={handleCreatePolicy} style={{ backgroundColor: '#818CF8', color: '#FFFFFF', border: 'none', borderRadius: 6, padding: '8px 18px', fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}>
                            {assignedCount > 0 ? `Create & Assign (${assignedCount})` : 'Create Guardrail'}
                          </button>
                        </div>
                      </div>
                    </>
                  )
                })()}
              </>
            )}

            {/* Access Rule form (2-step) */}
            {createFlowCategory === 'access' && showFormStep && (
              <>
                {/* Step indicator */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 20 }}>
                  {['Define Rule', 'Assign'].map((label, idx) => {
                    const step = idx + 1
                    const active = accessRuleStep === step
                    const done = accessRuleStep > step
                    return (
                      <React.Fragment key={label}>
                        {idx > 0 && <div style={{ flex: 1, height: 1, backgroundColor: done ? '#818CF8' : 'rgba(129, 140, 248,0.15)' }} />}
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                          <span style={{
                            width: 22, height: 22, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center',
                            fontSize: 11, fontWeight: 600,
                            backgroundColor: active ? '#818CF8' : done ? 'rgba(129, 140, 248,0.25)' : '#1E1E1E',
                            color: active ? '#0A0A0A' : done ? '#818CF8' : '#666',
                            border: active ? 'none' : '1px solid rgba(129, 140, 248,0.15)',
                          }}>{done ? '✓' : step}</span>
                          <span style={{ fontSize: 12, color: active ? '#fff' : '#888', fontWeight: active ? 600 : 400 }}>{label}</span>
                        </div>
                      </React.Fragment>
                    )
                  })}
                </div>

                {accessRuleStep === 1 && (
                  <>
                    <h3 style={{ color: '#fff', fontSize: 16, fontWeight: 600, margin: '0 0 16px' }}>
                      {aiCompiled || templateSelected ? 'Review Access Rule' : 'Define Access Rule'}
                    </h3>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                      <div>
                        <label style={{ color: '#999', fontSize: 12, marginBottom: 4, display: 'block' }}>Rule Name</label>
                        <input value={accessRuleForm.name} onChange={e => setAccessRuleForm(f => ({ ...f, name: e.target.value }))} placeholder="e.g. Production Model RBAC" style={{ width: '100%', backgroundColor: '#0F0F0F', border: '1px solid rgba(129, 140, 248,0.15)', color: '#E8E8E8', padding: '8px 12px', borderRadius: 6, fontSize: 13, fontFamily: 'inherit', boxSizing: 'border-box' as const }} />
                      </div>
                      <div>
                        <label style={{ color: '#999', fontSize: 12, marginBottom: 4, display: 'block' }}>Rule Type</label>
                        <div style={{ display: 'flex', gap: 8 }}>
                          {(Object.entries(accessRuleConfig) as [AccessRuleType, typeof accessRuleConfig[AccessRuleType]][]).map(([key, cfg]) => (
                            <button key={key} onClick={() => setAccessRuleForm(f => ({ ...f, type: key }))} style={{
                              flex: 1, padding: '10px 8px', borderRadius: 6, border: `1px solid ${accessRuleForm.type === key ? cfg.color : 'rgba(129, 140, 248,0.10)'}`,
                              backgroundColor: accessRuleForm.type === key ? cfg.bg : 'transparent', cursor: 'pointer',
                              display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4, fontFamily: 'inherit',
                            }}>
                              <span style={{ fontSize: 18 }}>{cfg.icon}</span>
                              <span style={{ fontSize: 11, fontWeight: 600, color: accessRuleForm.type === key ? cfg.color : '#999' }}>{cfg.label}</span>
                            </button>
                          ))}
                        </div>
                      </div>
                      <div>
                        <label style={{ color: '#999', fontSize: 12, marginBottom: 4, display: 'block' }}>Policy Intent <span style={{ color: '#666' }}>(describe the rule's purpose — may be used by AI policy engine)</span></label>
                        <textarea value={accessRuleForm.description} onChange={e => setAccessRuleForm(f => ({ ...f, description: e.target.value }))} rows={2} placeholder={accessRuleForm.type === 'who' ? 'e.g. Only ML engineers and admins can invoke production GPT-4 models' : 'e.g. Staging can import models from production but not from sandbox'} style={{ width: '100%', backgroundColor: '#0F0F0F', border: '1px solid rgba(129, 140, 248,0.15)', color: '#E8E8E8', padding: '8px 12px', borderRadius: 6, fontSize: 13, fontFamily: 'inherit', resize: 'vertical' as const, boxSizing: 'border-box' as const }} />
                      </div>
                      {/* Type-specific fields */}
                      <div>
                        <label style={{ color: '#999', fontSize: 12, marginBottom: 4, display: 'block' }}>Asset Type</label>
                        <select value={accessRuleForm.assetType} onChange={e => setAccessRuleForm(f => ({ ...f, assetType: e.target.value }))} style={{ width: '100%', backgroundColor: '#0F0F0F', border: '1px solid rgba(129, 140, 248,0.15)', color: '#E8E8E8', padding: '8px 12px', borderRadius: 6, fontSize: 13, fontFamily: 'inherit' }}>
                          <option>Model</option><option>Tool</option><option>Agent</option><option>Namespace</option><option>All</option>
                        </select>
                      </div>
                      {accessRuleForm.type === 'who' && (
                        <div>
                          <label style={{ color: '#999', fontSize: 12, marginBottom: 4, display: 'block' }}>Allowed Identities <span style={{ color: '#666' }}>(roles, groups, service principals, domains — comma-separated)</span></label>
                          <input value={accessRuleForm.identities} onChange={e => setAccessRuleForm(f => ({ ...f, identities: e.target.value }))} placeholder="e.g. AI-Developer, ML-Engineer, contoso.com" style={{ width: '100%', backgroundColor: '#0F0F0F', border: '1px solid rgba(129, 140, 248,0.15)', color: '#E8E8E8', padding: '8px 12px', borderRadius: 6, fontSize: 13, fontFamily: 'inherit', boxSizing: 'border-box' as const }} />
                          {accessRuleForm.identities && <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap', marginTop: 6 }}>{accessRuleForm.identities.split(',').map(r => r.trim()).filter(Boolean).map(r => <span key={r} style={badge('rgba(192,132,252,0.12)', '#c084fc')}>{r}</span>)}</div>}
                        </div>
                      )}
                      {accessRuleForm.type === 'where' && (
                        <div style={{ padding: '10px 12px', backgroundColor: 'rgba(74,222,128,0.06)', borderRadius: 6, border: '1px solid rgba(74,222,128,0.12)' }}>
                          <span style={{ fontSize: 12, color: '#4ade80' }}>💡 You'll assign specific assets this rule applies to in the next step.</span>
                        </div>
                      )}
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', gap: 10, marginTop: 20 }}>
                      <button onClick={() => { handleFormBack(); setAccessRuleStep(1) }} style={{ backgroundColor: 'transparent', color: '#ccc', border: '1px solid rgba(129, 140, 248, 0.10)', borderRadius: 6, padding: '8px 18px', fontSize: 13, fontWeight: 500, cursor: 'pointer', fontFamily: 'inherit' }}>← Back</button>
                      <button disabled={!accessRuleForm.name} onClick={() => setAccessRuleStep(2)} style={{
                        backgroundColor: !accessRuleForm.name ? '#555' : '#818CF8', color: !accessRuleForm.name ? '#999' : '#0A0A0A',
                        border: 'none', borderRadius: 6, padding: '8px 18px', fontSize: 13, fontWeight: 600, cursor: !accessRuleForm.name ? 'not-allowed' : 'pointer', fontFamily: 'inherit',
                      }}>Next: Assign →</button>
                    </div>
                  </>
                )}

                {accessRuleStep === 2 && (() => {
                  const typeEmojis: Record<string, string> = { Model: '🧠', Agent: '🤖', Tool: '🔧', Namespace: '🗂' }
                  const assetTypes = ['Model', 'Agent', 'Tool', 'Namespace']
                  const filteredAssets = allAssets.filter(a =>
                    accessRuleForm.assetType === 'All' || a.type === accessRuleForm.assetType
                  )
                  const assignedCount = Object.values(accessRuleAssignments).filter(Boolean).length
                  return (
                    <>
                      <h3 style={{ color: '#fff', fontSize: 16, fontWeight: 600, margin: '0 0 4px' }}>Assign to Assets</h3>
                      <p style={{ color: '#888', fontSize: 12, margin: '0 0 16px' }}>
                        Select which {accessRuleForm.assetType === 'All' ? 'assets' : accessRuleForm.assetType.toLowerCase() + 's'} this rule applies to, or skip to apply to all matching assets.
                      </p>
                      <div style={{ maxHeight: 300, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 14, paddingRight: 4 }}>
                        {assetTypes.map(aType => {
                          const items = filteredAssets.filter(a => a.type === aType)
                          if (items.length === 0) return null
                          const checkedCount = items.filter(a => accessRuleAssignments[a.name]).length
                          return (
                            <div key={aType}>
                              <div style={{ fontSize: 12, color: '#888', fontWeight: 600, marginBottom: 6, textTransform: 'uppercase', letterSpacing: 0.5 }}>
                                {typeEmojis[aType]} {aType}s ({checkedCount}/{items.length})
                              </div>
                              <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                                {items.map(a => {
                                  const checked = !!accessRuleAssignments[a.name]
                                  return (
                                    <label key={a.name} style={{
                                      display: 'flex', alignItems: 'center', gap: 10, padding: '6px 10px', borderRadius: 6,
                                      backgroundColor: checked ? 'rgba(129, 140, 248,0.08)' : 'transparent',
                                      border: '1px solid ' + (checked ? 'rgba(129, 140, 248,0.25)' : 'rgba(129, 140, 248,0.06)'),
                                      cursor: 'pointer', transition: 'all 0.15s',
                                    }}>
                                      <input type="checkbox" checked={checked} onChange={() => setAccessRuleAssignments(prev => ({ ...prev, [a.name]: !prev[a.name] }))} style={{ accentColor: '#818CF8' }} />
                                      <span style={{ fontSize: 13, color: '#E8E8E8', flex: 1 }}>{a.name}</span>
                                      <span style={{ fontSize: 11, color: '#666' }}>{a.namespace}</span>
                                    </label>
                                  )
                                })}
                              </div>
                            </div>
                          )
                        })}
                        {filteredAssets.length === 0 && (
                          <div style={{ textAlign: 'center', color: '#666', fontSize: 13, padding: 20 }}>No matching assets in this namespace</div>
                        )}
                      </div>
                      {assignedCount > 0 && (
                        <div style={{ marginTop: 12, padding: '8px 12px', backgroundColor: 'rgba(129, 140, 248,0.06)', borderRadius: 6, fontSize: 12, color: '#818CF8' }}>
                          {assignedCount} asset{assignedCount !== 1 ? 's' : ''} selected
                        </div>
                      )}
                      <div style={{ display: 'flex', justifyContent: 'space-between', gap: 10, marginTop: 20 }}>
                        <button onClick={() => setAccessRuleStep(1)} style={{ backgroundColor: 'transparent', color: '#ccc', border: '1px solid rgba(129, 140, 248, 0.10)', borderRadius: 6, padding: '8px 18px', fontSize: 13, fontWeight: 500, cursor: 'pointer', fontFamily: 'inherit' }}>← Back</button>
                        <div style={{ display: 'flex', gap: 10 }}>
                          <button onClick={() => { setAccessRuleAssignments({}); handleCreateAccessRule() }} style={{ backgroundColor: 'transparent', color: '#ccc', border: '1px solid rgba(129, 140, 248, 0.10)', borderRadius: 6, padding: '8px 18px', fontSize: 13, fontWeight: 500, cursor: 'pointer', fontFamily: 'inherit' }}>Skip (apply to all)</button>
                          <button onClick={handleCreateAccessRule} style={{ backgroundColor: '#818CF8', color: '#FFFFFF', border: 'none', borderRadius: 6, padding: '8px 18px', fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}>
                            {assignedCount > 0 ? `Create & Assign (${assignedCount})` : 'Create Rule'}
                          </button>
                        </div>
                      </div>
                    </>
                  )
                })()}
              </>
            )}

          </div>
        </div>
        )
      })()}

    </div>
  )
}

export default Policies