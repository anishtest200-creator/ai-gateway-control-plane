import React, { useState } from 'react'
import type { CSSProperties } from 'react'
import { useNavigate } from 'react-router-dom'

/* ─── palette & shared styles ─── */
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
  padding: 16,
}

/* ─── types ─── */
type ControlStatus = 'met' | 'partial' | 'not-met'

interface Control {
  id: string
  name: string
  category: string
  description: string
  evidence: string
  status: ControlStatus
  navigateTo: string
  note?: string
}

interface Framework {
  key: string
  label: string
  description: string
  controls: Control[]
}

interface ComplianceEvent {
  timestamp: string
  event: string
  controlId: string
  actor: string
  navigateTo: string
}

/* ─── mock data: frameworks ─── */
const frameworks: Framework[] = [
  {
    key: 'soc2',
    label: 'SOC 2',
    description:
      'Service Organization Control 2 — trust service criteria for security, availability, processing integrity, confidentiality, and privacy.',
    controls: [
      // Access Controls
      { id: 'CC6.1', name: 'Logical Access Security', category: 'Access Controls', description: 'Restrict logical access to information assets', evidence: 'Authentication policies, Entra ID integration', status: 'met', navigateTo: '/policies' },
      { id: 'CC6.2', name: 'User Authentication', category: 'Access Controls', description: 'Authenticate users before granting access', evidence: 'JWT validation, API key management', status: 'met', navigateTo: '/access' },
      { id: 'CC6.3', name: 'Access Authorization', category: 'Access Controls', description: 'Authorize access based on roles and responsibilities', evidence: 'RBAC, namespace isolation', status: 'met', navigateTo: '/namespaces' },
      // System Operations
      { id: 'CC7.1', name: 'Monitoring & Detection', category: 'System Operations', description: 'Monitor system components for anomalies', evidence: 'Audit logs, traffic monitoring', status: 'met', navigateTo: '/logs' },
      { id: 'CC7.2', name: 'Incident Response', category: 'System Operations', description: 'Respond to identified security incidents', evidence: 'Credential blast radius, emergency revocation', status: 'partial', navigateTo: '/credentials', note: 'Incident response runbook not fully automated' },
      { id: 'CC7.3', name: 'Change Management', category: 'System Operations', description: 'Manage changes to infrastructure and software', evidence: 'Policy versioning, staged rollout', status: 'partial', navigateTo: '/policies', note: 'Staged rollout approval workflow pending' },
      // Risk Management
      { id: 'CC3.1', name: 'Risk Assessment', category: 'Risk Management', description: 'Identify and assess risks to objectives', evidence: 'Governance score, policy coverage', status: 'met', navigateTo: '/' },
      { id: 'CC3.2', name: 'Risk Mitigation', category: 'Risk Management', description: 'Mitigate identified risks to acceptable levels', evidence: 'Content safety guardrails, rate limits', status: 'met', navigateTo: '/policies' },
      // Data Protection
      { id: 'CC6.5', name: 'Data Classification', category: 'Data Protection', description: 'Classify data based on sensitivity', evidence: 'Namespace isolation, PII detection', status: 'met', navigateTo: '/namespaces' },
      { id: 'CC6.7', name: 'Credential Management', category: 'Data Protection', description: 'Manage credentials throughout their lifecycle', evidence: 'Credential rotation, vault integration', status: 'met', navigateTo: '/credentials' },
      // Availability
      { id: 'A1.1', name: 'System Availability', category: 'Availability', description: 'Maintain system availability per commitments', evidence: 'Multi-provider failover, health monitoring', status: 'met', navigateTo: '/routing' },
      { id: 'A1.2', name: 'Recovery Objectives', category: 'Availability', description: 'Meet defined recovery time objectives', evidence: 'Failover chains, circuit breakers', status: 'met', navigateTo: '/routing' },
      // AI-Specific (extended)
      { id: 'AI-1', name: 'Model Governance', category: 'AI-Specific', description: 'Govern model registration and lifecycle', evidence: 'Asset registry, lifecycle tracking', status: 'met', navigateTo: '/assets' },
      { id: 'AI-2', name: 'Content Safety', category: 'AI-Specific', description: 'Enforce responsible AI guardrails', evidence: 'RAI guardrails, PII detection, prompt injection defense', status: 'met', navigateTo: '/policies' },
      { id: 'AI-3', name: 'Cost Controls', category: 'AI-Specific', description: 'Enforce token quotas and budget limits', evidence: 'Token quotas, budget enforcement', status: 'not-met', navigateTo: '/observability', note: 'Budget enforcement not yet configured' },
      { id: 'AI-4', name: 'Tool Governance', category: 'AI-Specific', description: 'Control tool registration and execution', evidence: 'Tool allowlists, execution auditing', status: 'met', navigateTo: '/assets' },
      { id: 'AI-5', name: 'Agent Governance', category: 'AI-Specific', description: 'Govern agent execution and tool binding', evidence: 'Agent execution limits, tool binding controls', status: 'met', navigateTo: '/assets' },
      { id: 'AI-6', name: 'Data Residency', category: 'AI-Specific', description: 'Enforce regional data residency constraints', evidence: 'Regional routing constraints', status: 'not-met', navigateTo: '/routing', note: 'Regional constraints not yet enforced' },
    ],
  },
  {
    key: 'hipaa',
    label: 'HIPAA',
    description:
      'Health Insurance Portability and Accountability Act — safeguards for protected health information (PHI) in healthcare AI workloads.',
    controls: [
      { id: '§164.312(a)', name: 'Access Control', category: 'Technical Safeguards', description: 'Implement technical policies to restrict ePHI access', evidence: 'RBAC, namespace isolation, Entra ID', status: 'met', navigateTo: '/access' },
      { id: '§164.312(b)', name: 'Audit Controls', category: 'Technical Safeguards', description: 'Record and examine information system activity', evidence: 'Audit logs, request tracing', status: 'met', navigateTo: '/logs' },
      { id: '§164.312(c)', name: 'Integrity Controls', category: 'Technical Safeguards', description: 'Protect ePHI from improper alteration or destruction', evidence: 'Policy versioning, immutable audit trail', status: 'met', navigateTo: '/policies' },
      { id: '§164.312(d)', name: 'Person Authentication', category: 'Technical Safeguards', description: 'Verify identity of persons seeking ePHI access', evidence: 'JWT validation, MFA via Entra ID', status: 'met', navigateTo: '/access' },
      { id: '§164.312(e)', name: 'Transmission Security', category: 'Technical Safeguards', description: 'Guard against unauthorized ePHI access during transmission', evidence: 'TLS enforcement, encrypted channels', status: 'met', navigateTo: '/routing' },
      { id: '§164.308(a)(1)', name: 'Risk Analysis', category: 'Administrative Safeguards', description: 'Conduct accurate risk analysis of ePHI', evidence: 'Governance score, compliance monitoring', status: 'met', navigateTo: '/' },
      { id: '§164.308(a)(3)', name: 'Workforce Security', category: 'Administrative Safeguards', description: 'Ensure workforce members have appropriate ePHI access', evidence: 'RBAC policies, credential lifecycle', status: 'met', navigateTo: '/credentials' },
      { id: '§164.308(a)(5)', name: 'Security Awareness', category: 'Administrative Safeguards', description: 'Implement security awareness and training', evidence: 'Policy documentation, governance dashboard', status: 'partial', navigateTo: '/', note: 'Training tracking not yet integrated' },
      { id: '§164.308(a)(6)', name: 'Incident Procedures', category: 'Administrative Safeguards', description: 'Implement procedures for security incidents', evidence: 'Emergency revocation, blast radius analysis', status: 'partial', navigateTo: '/credentials', note: 'Formal incident procedure documentation pending' },
      { id: '§164.310(d)', name: 'Device & Media Controls', category: 'Physical Safeguards', description: 'Govern receipt and removal of hardware and media', evidence: 'Cloud-native — N/A for gateway', status: 'not-met', navigateTo: '/routing', note: 'Physical safeguards deferred to cloud provider' },
    ],
  },
  {
    key: 'gdpr',
    label: 'GDPR',
    description:
      'General Data Protection Regulation — EU regulation governing personal data processing, consent management, and data subject rights.',
    controls: [
      { id: 'Art.5', name: 'Data Processing Principles', category: 'Core Principles', description: 'Process personal data lawfully, fairly, and transparently', evidence: 'PII detection guardrails, namespace isolation', status: 'met', navigateTo: '/policies' },
      { id: 'Art.25', name: 'Data Protection by Design', category: 'Core Principles', description: 'Implement data protection by design and default', evidence: 'Content safety policies, default-deny access', status: 'met', navigateTo: '/policies' },
      { id: 'Art.30', name: 'Records of Processing', category: 'Accountability', description: 'Maintain records of processing activities', evidence: 'Audit logs, request-level tracing', status: 'met', navigateTo: '/logs' },
      { id: 'Art.32', name: 'Security of Processing', category: 'Security', description: 'Implement appropriate technical and organizational measures', evidence: 'Encryption, access controls, credential management', status: 'met', navigateTo: '/credentials' },
      { id: 'Art.33', name: 'Breach Notification', category: 'Security', description: 'Notify supervisory authority within 72 hours of breach', evidence: 'Audit alerting, incident detection', status: 'partial', navigateTo: '/logs', note: 'Automated breach notification not configured' },
      { id: 'Art.35', name: 'Data Protection Impact Assessment', category: 'Accountability', description: 'Conduct DPIA for high-risk processing', evidence: 'Governance score, risk assessment dashboard', status: 'met', navigateTo: '/' },
      { id: 'Art.44', name: 'Cross-Border Transfers', category: 'Transfers', description: 'Ensure adequate safeguards for international transfers', evidence: 'Regional routing constraints', status: 'not-met', navigateTo: '/routing', note: 'Regional routing constraints not yet enforced' },
      { id: 'Art.17', name: 'Right to Erasure', category: 'Data Subject Rights', description: 'Enable data deletion upon request', evidence: 'Log retention policies', status: 'partial', navigateTo: '/logs', note: 'Automated erasure pipeline not implemented' },
    ],
  },
  {
    key: 'iso27001',
    label: 'ISO 27001',
    description:
      'International standard for information security management systems (ISMS) — systematic approach to managing sensitive information.',
    controls: [
      { id: 'A.5.1', name: 'Information Security Policies', category: 'Organizational Controls', description: 'Define and review information security policies', evidence: 'Policy engine, versioned rule sets', status: 'met', navigateTo: '/policies' },
      { id: 'A.6.1', name: 'Organization of Information Security', category: 'Organizational Controls', description: 'Establish management framework for security', evidence: 'Governance dashboard, role-based access', status: 'met', navigateTo: '/' },
      { id: 'A.8.1', name: 'Asset Management', category: 'Asset Management', description: 'Identify and manage information assets', evidence: 'Model/tool/agent registry', status: 'met', navigateTo: '/assets' },
      { id: 'A.8.3', name: 'Media Handling', category: 'Asset Management', description: 'Prevent unauthorized disclosure of stored information', evidence: 'Credential vault, encrypted storage', status: 'met', navigateTo: '/credentials' },
      { id: 'A.9.1', name: 'Access Control Policy', category: 'Access Control', description: 'Limit access to information and facilities', evidence: 'RBAC, namespace isolation, API key scoping', status: 'met', navigateTo: '/access' },
      { id: 'A.9.4', name: 'System Access Control', category: 'Access Control', description: 'Prevent unauthorized access to systems', evidence: 'JWT validation, Entra ID integration', status: 'met', navigateTo: '/access' },
      { id: 'A.12.1', name: 'Operational Procedures', category: 'Operations Security', description: 'Document and make available operating procedures', evidence: 'Policy documentation, change audit trail', status: 'met', navigateTo: '/policies' },
      { id: 'A.12.4', name: 'Logging & Monitoring', category: 'Operations Security', description: 'Record events and generate evidence', evidence: 'Structured audit logs, traffic analytics', status: 'met', navigateTo: '/logs' },
      { id: 'A.13.1', name: 'Network Security', category: 'Communications Security', description: 'Manage and control networks to protect information', evidence: 'TLS enforcement, route isolation', status: 'met', navigateTo: '/routing' },
      { id: 'A.14.1', name: 'Secure Development', category: 'System Development', description: 'Ensure security in development lifecycle', evidence: 'Policy-as-code, guardrail testing', status: 'partial', navigateTo: '/policies', note: 'CI/CD security integration in progress' },
      { id: 'A.16.1', name: 'Incident Management', category: 'Incident Management', description: 'Ensure consistent approach to security incidents', evidence: 'Emergency revocation, credential blast radius', status: 'partial', navigateTo: '/credentials', note: 'Formal incident management process pending' },
      { id: 'A.18.1', name: 'Compliance with Requirements', category: 'Compliance', description: 'Avoid breaches of legal and regulatory obligations', evidence: 'Compliance evidence mapping, audit reports', status: 'met', navigateTo: '/compliance' },
    ],
  },
  {
    key: 'nist-ai',
    label: 'NIST AI RMF',
    description:
      'NIST AI Risk Management Framework — voluntary framework for managing risks throughout the AI lifecycle, emphasizing trustworthiness.',
    controls: [
      { id: 'GOV-1', name: 'AI Governance Structure', category: 'Govern', description: 'Establish AI governance policies and accountability', evidence: 'Governance dashboard, policy engine', status: 'met', navigateTo: '/' },
      { id: 'GOV-2', name: 'AI Risk Tolerance', category: 'Govern', description: 'Define organizational AI risk tolerance levels', evidence: 'Governance score thresholds, alert policies', status: 'met', navigateTo: '/' },
      { id: 'MAP-1', name: 'Context Mapping', category: 'Map', description: 'Map AI system context and intended purpose', evidence: 'Asset registry metadata, namespace scoping', status: 'met', navigateTo: '/assets' },
      { id: 'MAP-2', name: 'Stakeholder Engagement', category: 'Map', description: 'Identify and engage AI system stakeholders', evidence: 'RBAC roles, access policies', status: 'partial', navigateTo: '/access', note: 'Stakeholder registry not formalized' },
      { id: 'MEA-1', name: 'Performance Measurement', category: 'Measure', description: 'Measure AI system performance and behavior', evidence: 'Traffic analytics, latency monitoring', status: 'met', navigateTo: '/observability' },
      { id: 'MEA-2', name: 'Bias & Fairness Testing', category: 'Measure', description: 'Test for bias, fairness, and equity in AI outputs', evidence: 'Content safety guardrails, RAI policies', status: 'partial', navigateTo: '/policies', note: 'Bias testing framework not yet integrated' },
      { id: 'MEA-3', name: 'Robustness Testing', category: 'Measure', description: 'Assess AI system robustness and resilience', evidence: 'Prompt injection defense, input validation', status: 'met', navigateTo: '/policies' },
      { id: 'MAN-1', name: 'Risk Response', category: 'Manage', description: 'Develop and implement AI risk responses', evidence: 'Guardrail enforcement, emergency revocation', status: 'met', navigateTo: '/credentials' },
      { id: 'MAN-2', name: 'Continuous Monitoring', category: 'Manage', description: 'Monitor AI system risks on an ongoing basis', evidence: 'Real-time observability, audit logging', status: 'met', navigateTo: '/observability' },
      { id: 'MAN-3', name: 'Incident Response for AI', category: 'Manage', description: 'Respond to AI-related incidents and failures', evidence: 'Circuit breakers, failover chains', status: 'not-met', navigateTo: '/routing', note: 'AI-specific incident playbooks not defined' },
    ],
  },
]

/* ─── mock data: compliance events ─── */
const complianceEvents: ComplianceEvent[] = [
  { timestamp: '2025-03-15 14:32', event: 'Policy change audited — rate-limit rule updated', controlId: 'CC7.3', actor: 'ops-admin@contoso.com', navigateTo: '/policies' },
  { timestamp: '2025-03-15 11:18', event: 'Credential rotated per CC6.7 — Azure OpenAI key', controlId: 'CC6.7', actor: 'vault-rotation-svc', navigateTo: '/credentials' },
  { timestamp: '2025-03-14 16:45', event: 'Access review completed — namespace permissions verified', controlId: 'CC6.3', actor: 'sec-reviewer@contoso.com', navigateTo: '/namespaces' },
  { timestamp: '2025-03-14 09:22', event: 'Content safety guardrail triggered — PII detected and blocked', controlId: 'AI-2', actor: 'system', navigateTo: '/policies' },
  { timestamp: '2025-03-13 17:10', event: 'New model registered — compliance metadata captured', controlId: 'AI-1', actor: 'ml-eng@contoso.com', navigateTo: '/assets' },
  { timestamp: '2025-03-13 10:05', event: 'Failover chain validated — health check passed', controlId: 'A1.1', actor: 'health-monitor-svc', navigateTo: '/routing' },
  { timestamp: '2025-03-12 14:55', event: 'Agent execution limit enforced — tool binding audited', controlId: 'AI-5', actor: 'system', navigateTo: '/assets' },
  { timestamp: '2025-03-12 08:30', event: 'Governance score recalculated — improved to 78%', controlId: 'CC3.1', actor: 'system', navigateTo: '/' },
]

/* ─── mock data: trend ─── */
const trendData = [
  { month: 'Oct', score: 62 },
  { month: 'Nov', score: 68 },
  { month: 'Dec', score: 72 },
  { month: 'Jan', score: 75 },
  { month: 'Feb', score: 78 },
  { month: 'Mar', score: 78 },
]

/* ─── helpers ─── */
const statusMeta: Record<ControlStatus, { label: string; icon: string; color: string }> = {
  met: { label: 'Met', icon: '✅', color: colors.green },
  partial: { label: 'Partial', icon: '⚠️', color: colors.amber },
  'not-met': { label: 'Not Met', icon: '❌', color: colors.red },
}

const barColor = (score: number) =>
  score >= 75 ? colors.green : score >= 60 ? colors.amber : colors.red

const computeScore = (controls: Control[]) => {
  const met = controls.filter((c) => c.status === 'met').length
  const partial = controls.filter((c) => c.status === 'partial').length
  const notMet = controls.filter((c) => c.status === 'not-met').length
  const pct = Math.round((met / controls.length) * 100)
  return { met, partial, notMet, total: controls.length, pct }
}

/* ─── component ─── */
const Compliance: React.FC = () => {
  const navigate = useNavigate()
  const [activeFramework, setActiveFramework] = useState('soc2')
  const [hoveredRow, setHoveredRow] = useState<string | null>(null)
  const [hoveredEvent, setHoveredEvent] = useState<number | null>(null)

  const fw = frameworks.find((f) => f.key === activeFramework)!
  const score = computeScore(fw.controls)

  // group controls by category
  const categories = fw.controls.reduce<Record<string, Control[]>>((acc, c) => {
    ;(acc[c.category] ??= []).push(c)
    return acc
  }, {})

  /* ── render ── */
  return (
    <div style={{ padding: 32, maxWidth: 1280, margin: '0 auto' }}>
      {/* ── Header ── */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24 }}>
        <div>
          <h1 style={{ fontSize: 28, fontWeight: 700, color: colors.text, margin: 0 }}>
            Compliance &amp; Evidence
          </h1>
          <p style={{ color: colors.textMuted, marginTop: 4, fontSize: 14 }}>
            Map governance controls to compliance frameworks and generate audit evidence
          </p>
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          <button
            style={{
              padding: '8px 18px',
              borderRadius: 6,
              border: 'none',
              backgroundColor: colors.gold,
              color: '#0A0A0A',
              fontWeight: 600,
              fontSize: 13,
              cursor: 'pointer',
            }}
          >
            Generate Evidence Pack
          </button>
          <button
            style={{
              padding: '8px 18px',
              borderRadius: 6,
              border: `1px solid ${colors.border}`,
              backgroundColor: 'transparent',
              color: colors.textMuted,
              fontWeight: 600,
              fontSize: 13,
              cursor: 'pointer',
            }}
          >
            Export Report
          </button>
        </div>
      </div>

      {/* ── Framework Tabs ── */}
      <div style={{ display: 'flex', gap: 6, marginBottom: 16 }}>
        {frameworks.map((f) => (
          <button
            key={f.key}
            onClick={() => setActiveFramework(f.key)}
            style={{
              padding: '7px 16px',
              borderRadius: 6,
              border: activeFramework === f.key ? `1px solid ${colors.gold}` : `1px solid ${colors.border}`,
              backgroundColor: activeFramework === f.key ? 'rgba(212, 168, 67, 0.15)' : 'transparent',
              color: activeFramework === f.key ? colors.gold : colors.textMuted,
              fontWeight: 600,
              fontSize: 13,
              cursor: 'pointer',
            }}
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* ── Framework description ── */}
      <div style={{ ...card, marginBottom: 24, padding: '12px 16px' }}>
        <span style={{ color: colors.textMuted, fontSize: 13 }}>{fw.description}</span>
      </div>

      {/* ── Score ── */}
      <div style={{ ...card, marginBottom: 24 }}>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 12, marginBottom: 12 }}>
          <span style={{ fontSize: 32, fontWeight: 700, color: colors.text }}>
            {score.met}/{score.total}
          </span>
          <span style={{ color: colors.textMuted, fontSize: 14 }}>controls met</span>
          <span style={{ fontSize: 22, fontWeight: 600, color: barColor(score.pct), marginLeft: 'auto' }}>
            {score.pct}%
          </span>
        </div>

        {/* progress bar */}
        <div style={{ width: '100%', height: 8, backgroundColor: 'rgba(212, 168, 67, 0.06)', borderRadius: 4, overflow: 'hidden', marginBottom: 14 }}>
          <div style={{ width: `${score.pct}%`, height: '100%', backgroundColor: barColor(score.pct), borderRadius: 4, transition: 'width 0.3s' }} />
        </div>

        <div style={{ display: 'flex', gap: 24 }}>
          <span style={{ color: colors.green, fontSize: 13, fontWeight: 600 }}>✅ Met ({score.met})</span>
          <span style={{ color: colors.amber, fontSize: 13, fontWeight: 600 }}>⚠️ Partial ({score.partial})</span>
          <span style={{ color: colors.red, fontSize: 13, fontWeight: 600 }}>❌ Not Met ({score.notMet})</span>
        </div>
      </div>

      {/* ── Control Mapping Table ── */}
      <h2 style={{ fontSize: 18, fontWeight: 600, color: colors.text, marginBottom: 14 }}>
        Control Mapping — {fw.label}
      </h2>

      {Object.entries(categories).map(([cat, controls]) => (
        <div key={cat} style={{ marginBottom: 20 }}>
          <div
            style={{
              fontSize: 11,
              fontWeight: 700,
              textTransform: 'uppercase',
              letterSpacing: 0.6,
              color: colors.textDim,
              marginBottom: 8,
              paddingLeft: 4,
            }}
          >
            {cat}
          </div>

          <div style={{ ...card, padding: 0, overflow: 'hidden' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ borderBottom: `1px solid ${colors.border}` }}>
                  {['Control', 'Description', 'Evidence', 'Status', ''].map((h) => (
                    <th
                      key={h}
                      style={{
                        textAlign: 'left',
                        padding: '10px 14px',
                        fontSize: 11,
                        fontWeight: 600,
                        textTransform: 'uppercase',
                        letterSpacing: 0.4,
                        color: colors.textDim,
                      }}
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {controls.map((c) => {
                  const meta = statusMeta[c.status]
                  const isHovered = hoveredRow === c.id
                  return (
                    <tr
                      key={c.id}
                      onMouseEnter={() => setHoveredRow(c.id)}
                      onMouseLeave={() => setHoveredRow(null)}
                      style={{
                        borderBottom: `1px solid ${colors.border}`,
                        backgroundColor: isHovered ? 'rgba(212, 168, 67, 0.04)' : 'transparent',
                        transition: 'background-color 0.15s',
                      }}
                    >
                      <td style={{ padding: '10px 14px', whiteSpace: 'nowrap' }}>
                        <span style={{ fontWeight: 700, color: colors.text, fontSize: 13 }}>{c.id}</span>
                        <br />
                        <span style={{ color: colors.textMuted, fontSize: 12 }}>{c.name}</span>
                      </td>
                      <td style={{ padding: '10px 14px', color: colors.textMuted, fontSize: 12, maxWidth: 240 }}>
                        {c.description}
                      </td>
                      <td style={{ padding: '10px 14px', color: colors.text, fontSize: 12, maxWidth: 260 }}>
                        {c.evidence}
                      </td>
                      <td style={{ padding: '10px 14px' }}>
                        <span
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: 5,
                            padding: '3px 10px',
                            borderRadius: 12,
                            fontSize: 12,
                            fontWeight: 600,
                            color: meta.color,
                            backgroundColor: `${meta.color}18`,
                          }}
                        >
                          {meta.icon} {meta.label}
                        </span>
                        {c.note && (
                          <div style={{ fontSize: 11, color: colors.amber, marginTop: 4, maxWidth: 200 }}>
                            {c.note}
                          </div>
                        )}
                      </td>
                      <td style={{ padding: '10px 14px', textAlign: 'right' }}>
                        <span
                          onClick={() => navigate(c.navigateTo)}
                          style={{ color: colors.gold, fontSize: 12, cursor: 'pointer', whiteSpace: 'nowrap' }}
                        >
                          View Evidence →
                        </span>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      ))}

      {/* ── Evidence Timeline ── */}
      <h2 style={{ fontSize: 18, fontWeight: 600, color: colors.text, marginTop: 32, marginBottom: 14 }}>
        Recent Compliance Events
      </h2>

      <div style={{ ...card, padding: 0, overflow: 'hidden', marginBottom: 32 }}>
        {complianceEvents.map((ev, idx) => {
          const isHovered = hoveredEvent === idx
          return (
            <div
              key={idx}
              onClick={() => navigate(ev.navigateTo)}
              onMouseEnter={() => setHoveredEvent(idx)}
              onMouseLeave={() => setHoveredEvent(null)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 16,
                padding: '11px 16px',
                borderBottom: idx < complianceEvents.length - 1 ? `1px solid ${colors.border}` : 'none',
                cursor: 'pointer',
                backgroundColor: isHovered ? 'rgba(212, 168, 67, 0.04)' : 'transparent',
                transition: 'background-color 0.15s',
              }}
            >
              {/* timeline dot + line */}
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: 12 }}>
                <div style={{ width: 8, height: 8, borderRadius: '50%', backgroundColor: colors.gold }} />
                {idx < complianceEvents.length - 1 && (
                  <div style={{ width: 1, height: 22, backgroundColor: colors.border, marginTop: 2 }} />
                )}
              </div>

              <span style={{ color: colors.textDim, fontSize: 12, minWidth: 130, flexShrink: 0 }}>
                {ev.timestamp}
              </span>
              <span style={{ color: colors.text, fontSize: 13, flex: 1 }}>{ev.event}</span>
              <span
                style={{
                  fontSize: 11,
                  fontWeight: 600,
                  color: colors.purple,
                  backgroundColor: 'rgba(139,92,246,0.12)',
                  padding: '2px 8px',
                  borderRadius: 10,
                  whiteSpace: 'nowrap',
                }}
              >
                {ev.controlId}
              </span>
              <span style={{ color: colors.textMuted, fontSize: 12, minWidth: 160, textAlign: 'right' }}>
                {ev.actor}
              </span>
            </div>
          )
        })}
      </div>

      {/* ── Compliance Score Trend ── */}
      <h2 style={{ fontSize: 18, fontWeight: 600, color: colors.text, marginBottom: 14 }}>
        Compliance Score Trend
      </h2>

      <div style={{ ...card, marginBottom: 32 }}>
        <div style={{ display: 'flex', alignItems: 'flex-end', gap: 16, height: 140 }}>
          {trendData.map((d) => (
            <div key={d.month} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
              <span style={{ fontSize: 13, fontWeight: 600, color: barColor(d.score) }}>{d.score}%</span>
              <div
                style={{
                  width: '100%',
                  maxWidth: 60,
                  height: `${d.score}%`,
                  backgroundColor: barColor(d.score),
                  borderRadius: '4px 4px 0 0',
                  opacity: 0.85,
                  transition: 'height 0.3s',
                }}
              />
              <span style={{ fontSize: 12, color: colors.textMuted }}>{d.month}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

export default Compliance
