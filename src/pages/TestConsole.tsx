import React, { useState, useCallback } from 'react';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------
interface TraceStep {
  status: 'success' | 'warning' | 'error' | 'pending';
  title: string;
  timing: string;
  details: { label: string; value: string }[];
}

// ---------------------------------------------------------------------------
// Mock data
// ---------------------------------------------------------------------------
const NAMESPACES = ['retail-support', 'finance-analytics', 'hr-automation', 'dev-sandbox'];
const ASSET_TYPES = ['Models', 'Tools', 'Agents'] as const;
type AssetType = (typeof ASSET_TYPES)[number];

const ENDPOINTS: Record<AssetType, string[]> = {
  Models: ['gpt-4o', 'claude-3.5-sonnet', 'gemini-1.5-pro', 'auto-route'],
  Tools: ['salesforce-crm', 'order-lookup', 'postgres-query'],
  Agents: ['retail-support-agent', 'finance-analyst'],
};

const DEFAULT_TRACE: TraceStep[] = [
  {
    status: 'success',
    title: 'Request Received',
    timing: '0ms',
    details: [
      { label: 'Namespace', value: 'retail-support' },
      { label: 'Consumer', value: 'app-key-retail-01' },
    ],
  },
  {
    status: 'success',
    title: 'Authentication',
    timing: '2ms',
    details: [
      { label: 'Method', value: 'API Key validated' },
      { label: 'Consumer identified', value: 'retail-frontend-app' },
    ],
  },
  {
    status: 'success',
    title: 'Policy Evaluation',
    timing: '5ms',
    details: [
      { label: 'Rate limit', value: '847/1000 requests (within quota)' },
      { label: 'Token quota', value: '2.1M/5M tokens (within quota)' },
      { label: 'Content safety', value: 'Prompt passed' },
    ],
  },
  {
    status: 'success',
    title: 'Routing Decision',
    timing: '8ms',
    details: [
      { label: 'Rule matched', value: 'GPT-4o Primary' },
      { label: 'Target', value: 'Azure OpenAI (East US)' },
      { label: 'Strategy', value: 'Primary route' },
    ],
  },
  {
    status: 'success',
    title: 'Credential Mediation',
    timing: '12ms',
    details: [
      { label: 'Credential', value: 'azure-openai-eastus (API Key)' },
      { label: 'Injected via', value: 'Authorization header' },
      { label: 'Source', value: 'Credential Store' },
    ],
  },
  {
    status: 'success',
    title: 'Upstream Call',
    timing: '847ms',
    details: [
      { label: 'Provider', value: 'Azure OpenAI' },
      { label: 'Model', value: 'gpt-4o' },
      { label: 'Tokens', value: '342 prompt / 128 completion' },
    ],
  },
  {
    status: 'success',
    title: 'Response Safety Check',
    timing: '852ms',
    details: [
      { label: 'Content safety', value: 'Response passed' },
      { label: 'PII scan', value: 'No PII detected' },
    ],
  },
  {
    status: 'success',
    title: 'Response Delivered',
    timing: '855ms',
    details: [
      { label: 'Total latency', value: '855ms' },
      { label: 'Gateway overhead', value: '8ms' },
    ],
  },
];

// Rate-limit simulation trace
const RATE_LIMIT_TRACE: TraceStep[] = [
  DEFAULT_TRACE[0],
  DEFAULT_TRACE[1],
  {
    status: 'error',
    title: 'Policy Evaluation',
    timing: '5ms',
    details: [
      { label: 'Rate limit', value: '1000/1000 requests — EXCEEDED' },
      { label: 'Token quota', value: '2.1M/5M tokens (within quota)' },
      { label: 'Action', value: 'Request rejected (429)' },
    ],
  },
];

// Failover simulation trace
const FAILOVER_TRACE: TraceStep[] = [
  DEFAULT_TRACE[0],
  DEFAULT_TRACE[1],
  DEFAULT_TRACE[2],
  DEFAULT_TRACE[3],
  DEFAULT_TRACE[4],
  {
    status: 'warning',
    title: 'Upstream Call — Failed',
    timing: '3012ms',
    details: [
      { label: 'Provider', value: 'Azure OpenAI (East US)' },
      { label: 'Error', value: '503 Service Unavailable' },
      { label: 'Action', value: 'Triggering failover...' },
    ],
  },
  {
    status: 'success',
    title: 'Failover Routing',
    timing: '3015ms',
    details: [
      { label: 'Fallback target', value: 'Azure OpenAI (West US)' },
      { label: 'Credential', value: 'azure-openai-westus (API Key)' },
      { label: 'Strategy', value: 'Automatic failover' },
    ],
  },
  {
    status: 'success',
    title: 'Upstream Call — Retry',
    timing: '3892ms',
    details: [
      { label: 'Provider', value: 'Azure OpenAI (West US)' },
      { label: 'Model', value: 'gpt-4o' },
      { label: 'Tokens', value: '342 prompt / 128 completion' },
    ],
  },
  {
    status: 'success',
    title: 'Response Delivered',
    timing: '3900ms',
    details: [
      { label: 'Total latency', value: '3900ms' },
      { label: 'Gateway overhead', value: '15ms (includes failover)' },
    ],
  },
];

// Unsafe content simulation trace
const UNSAFE_TRACE: TraceStep[] = [
  DEFAULT_TRACE[0],
  DEFAULT_TRACE[1],
  {
    status: 'error',
    title: 'Policy Evaluation',
    timing: '5ms',
    details: [
      { label: 'Rate limit', value: '847/1000 requests (within quota)' },
      { label: 'Token quota', value: '2.1M/5M tokens (within quota)' },
      { label: 'Content safety', value: 'BLOCKED — Unsafe content detected' },
      { label: 'Category', value: 'Prompt injection attempt' },
    ],
  },
];

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------
const styles: Record<string, React.CSSProperties> = {
  page: {
    display: 'flex',
    flexDirection: 'column',
    height: 'calc(100vh - 110px)',
    color: '#e0e0e0',
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
  },
  header: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '12px 20px',
    borderBottom: '1px solid rgba(129, 140, 248, 0.10)',
    flexShrink: 0,
  },
  headerLeft: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
  },
  headerTitle: {
    fontSize: '16px',
    fontWeight: 600,
    color: '#fff',
    margin: 0,
  },
  badge: {
    backgroundColor: 'rgba(129, 140, 248, 0.15)',
    color: '#818CF8',
    borderRadius: '12px',
    padding: '2px 10px',
    fontSize: '11px',
    fontWeight: 600,
    border: '1px solid #818CF8',
  },
  columns: {
    display: 'grid',
    gridTemplateColumns: '30% 40% 30%',
    flex: 1,
    minHeight: 0,
  },
  // Left column
  leftPanel: {
    backgroundColor: '#0A0A0A',
    borderRight: '1px solid rgba(129, 140, 248, 0.10)',
    padding: '16px',
    overflowY: 'auto',
    display: 'flex',
    flexDirection: 'column',
    gap: '14px',
  },
  panelTitle: {
    fontSize: '13px',
    fontWeight: 600,
    color: '#fff',
    textTransform: 'uppercase' as const,
    letterSpacing: '0.5px',
    margin: '0 0 4px 0',
  },
  fieldGroup: {
    display: 'flex',
    flexDirection: 'column',
    gap: '4px',
  },
  label: {
    fontSize: '11px',
    fontWeight: 600,
    color: '#888',
    textTransform: 'uppercase' as const,
    letterSpacing: '0.5px',
  },
  select: {
    backgroundColor: '#161616',
    color: '#e0e0e0',
    border: '1px solid rgba(129, 140, 248, 0.10)',
    borderRadius: '6px',
    padding: '8px 10px',
    fontSize: '13px',
    outline: 'none',
    cursor: 'pointer',
    width: '100%',
    boxSizing: 'border-box' as const,
  },
  input: {
    backgroundColor: '#161616',
    color: '#e0e0e0',
    border: '1px solid rgba(129, 140, 248, 0.10)',
    borderRadius: '6px',
    padding: '8px 10px',
    fontSize: '13px',
    outline: 'none',
    width: '100%',
    boxSizing: 'border-box' as const,
    fontFamily: '"Cascadia Code", "Fira Code", monospace',
  },
  textarea: {
    backgroundColor: '#161616',
    color: '#e0e0e0',
    border: '1px solid rgba(129, 140, 248, 0.10)',
    borderRadius: '6px',
    padding: '8px 10px',
    fontSize: '13px',
    outline: 'none',
    width: '100%',
    boxSizing: 'border-box' as const,
    resize: 'vertical' as const,
    minHeight: '80px',
    fontFamily: 'inherit',
  },
  toggleRow: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '6px 0',
  },
  toggleLabel: {
    fontSize: '12px',
    color: '#E8E8E8',
  },
  toggle: {
    width: '36px',
    height: '20px',
    borderRadius: '10px',
    border: 'none',
    cursor: 'pointer',
    position: 'relative' as const,
    transition: 'background-color 0.2s',
  },
  checkboxRow: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    padding: '3px 0',
  },
  checkbox: {
    accentColor: '#818CF8',
    width: '14px',
    height: '14px',
    cursor: 'pointer',
  },
  checkboxLabel: {
    fontSize: '12px',
    color: '#bbb',
    cursor: 'pointer',
  },
  sendButton: {
    backgroundColor: '#818CF8',
    color: '#FFFFFF',
    border: 'none',
    borderRadius: '8px',
    padding: '10px 16px',
    fontSize: '13px',
    fontWeight: 600,
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '8px',
    width: '100%',
    transition: 'background-color 0.15s',
  },
  divider: {
    border: 'none',
    borderTop: '1px solid rgba(129, 140, 248, 0.10)',
    margin: '4px 0',
  },
  // Center column
  centerPanel: {
    backgroundColor: '#111',
    overflowY: 'auto',
    display: 'flex',
    flexDirection: 'column',
  },
  centerHeader: {
    padding: '12px 16px',
    borderBottom: '1px solid rgba(129, 140, 248, 0.10)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    flexShrink: 0,
    backgroundColor: '#0A0A0A',
  },
  traceContainer: {
    padding: '16px',
    display: 'flex',
    flexDirection: 'column',
    gap: '0',
    flex: 1,
  },
  traceStep: {
    display: 'flex',
    gap: '12px',
    position: 'relative' as const,
  },
  traceTimeline: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    width: '28px',
    flexShrink: 0,
  },
  traceIcon: {
    width: '28px',
    height: '28px',
    borderRadius: '50%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '14px',
    flexShrink: 0,
    zIndex: 1,
  },
  traceLine: {
    width: '2px',
    flex: 1,
    backgroundColor: 'rgba(129, 140, 248, 0.10)',
    minHeight: '12px',
  },
  traceContent: {
    flex: 1,
    paddingBottom: '16px',
  },
  traceTitle: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    marginBottom: '6px',
  },
  traceTitleText: {
    fontSize: '13px',
    fontWeight: 600,
    color: '#fff',
  },
  traceTiming: {
    fontSize: '11px',
    color: '#666',
    fontFamily: '"Cascadia Code", "Fira Code", monospace',
  },
  traceDetails: {
    backgroundColor: '#1a1a1a',
    borderRadius: '8px',
    padding: '10px 12px',
    display: 'flex',
    flexDirection: 'column',
    gap: '4px',
    border: '1px solid #1A1A1A',
  },
  traceDetailRow: {
    display: 'flex',
    gap: '8px',
    fontSize: '12px',
    lineHeight: '18px',
  },
  traceDetailLabel: {
    color: '#777',
    minWidth: '120px',
    flexShrink: 0,
  },
  traceDetailValue: {
    color: '#E8E8E8',
  },
  // Right column
  rightPanel: {
    backgroundColor: '#0A0A0A',
    borderLeft: '1px solid rgba(129, 140, 248, 0.10)',
    padding: '16px',
    overflowY: 'auto',
    display: 'flex',
    flexDirection: 'column',
    gap: '14px',
  },
  card: {
    backgroundColor: '#1a1a1a',
    borderRadius: '8px',
    border: '1px solid #1A1A1A',
    padding: '14px',
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
  },
  cardTitle: {
    fontSize: '12px',
    fontWeight: 600,
    color: '#fff',
    textTransform: 'uppercase' as const,
    letterSpacing: '0.5px',
    marginBottom: '4px',
  },
  cardRow: {
    display: 'flex',
    justifyContent: 'space-between',
    fontSize: '12px',
    lineHeight: '20px',
  },
  cardLabel: {
    color: '#777',
  },
  cardValue: {
    color: '#E8E8E8',
    fontFamily: '"Cascadia Code", "Fira Code", monospace',
    fontSize: '11px',
  },
  statusPass: {
    color: '#4ADE80',
  },
  statusFail: {
    color: '#EF4444',
  },
  metricsGrid: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: '10px',
  },
  metricBox: {
    backgroundColor: '#161616',
    borderRadius: '6px',
    padding: '10px',
    textAlign: 'center' as const,
    boxShadow: '0 2px 8px rgba(0,0,0,0.35), 0 1px 3px rgba(0,0,0,0.25)',
  },
  metricValue: {
    fontSize: '18px',
    fontWeight: 700,
    color: '#fff',
    fontFamily: '"Cascadia Code", "Fira Code", monospace',
  },
  metricLabel: {
    fontSize: '10px',
    color: '#777',
    textTransform: 'uppercase' as const,
    letterSpacing: '0.5px',
    marginTop: '2px',
  },
};

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
function statusIcon(s: TraceStep['status']): string {
  switch (s) {
    case 'success': return '✓';
    case 'warning': return '⚠';
    case 'error':   return '✗';
    case 'pending':
    default:        return '○';
  }
}

function statusColor(s: TraceStep['status']): string {
  switch (s) {
    case 'success': return '#4ADE80';
    case 'warning': return '#F59E0B';
    case 'error':   return '#EF4444';
    case 'pending':
    default:        return '#555';
  }
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------
const TestConsole: React.FC = () => {
  const [namespace, setNamespace] = useState(NAMESPACES[0]);
  const [assetType, setAssetType] = useState<AssetType>('Models');
  const [endpoint, setEndpoint] = useState(ENDPOINTS.Models[0]);
  const [apiKey, setApiKey] = useState('sk-test-retail-01-abcdef1234567890');
  const [useManagedIdentity, setUseManagedIdentity] = useState(false);
  const [prompt, setPrompt] = useState('Summarize the latest customer support tickets');
  const [simRateLimit, setSimRateLimit] = useState(false);
  const [simFailover, setSimFailover] = useState(false);
  const [simUnsafe, setSimUnsafe] = useState(false);
  const [trace, setTrace] = useState<TraceStep[]>(DEFAULT_TRACE);
  const [isRunning, setIsRunning] = useState(false);

  const handleAssetTypeChange = useCallback((val: AssetType) => {
    setAssetType(val);
    setEndpoint(ENDPOINTS[val][0]);
  }, []);

  const handleSend = useCallback(() => {
    setIsRunning(true);

    // Pick the right trace based on simulation flags
    let targetTrace = DEFAULT_TRACE;
    if (simUnsafe)     targetTrace = UNSAFE_TRACE;
    else if (simRateLimit) targetTrace = RATE_LIMIT_TRACE;
    else if (simFailover)  targetTrace = FAILOVER_TRACE;

    // Animate steps appearing one by one
    setTrace([]);
    targetTrace.forEach((step, idx) => {
      setTimeout(() => {
        setTrace(prev => [...prev, step]);
        if (idx === targetTrace.length - 1) {
          setIsRunning(false);
        }
      }, (idx + 1) * 250);
    });
  }, [simRateLimit, simFailover, simUnsafe]);

  // Derive inspector data from the final trace
  const hasError = trace.some(s => s.status === 'error');
  const isFailover = trace.some(s => s.title === 'Failover Routing');

  return (
    <div style={styles.page}>
      {/* Header */}
      <div style={styles.header}>
        <div style={styles.headerLeft}>
          <h2 style={styles.headerTitle}>Test Console</h2>
          <span style={styles.badge}>TESTING</span>
        </div>
        <span style={{ fontSize: '12px', color: '#666' }}>
          Test routing, policies, and credential mediation
        </span>
      </div>

      {/* 3 Columns */}
      <div style={styles.columns}>
        {/* ---- LEFT COLUMN ---- */}
        <div style={styles.leftPanel}>
          <p style={styles.panelTitle}>Test Request</p>

          <div style={styles.fieldGroup}>
            <label style={styles.label}>Namespace</label>
            <select
              style={styles.select}
              value={namespace}
              onChange={e => setNamespace(e.target.value)}
            >
              {NAMESPACES.map(ns => (
                <option key={ns} value={ns}>{ns}</option>
              ))}
            </select>
          </div>

          <div style={styles.fieldGroup}>
            <label style={styles.label}>Target Asset</label>
            <select
              style={styles.select}
              value={assetType}
              onChange={e => handleAssetTypeChange(e.target.value as AssetType)}
            >
              {ASSET_TYPES.map(t => (
                <option key={t} value={t}>{t}</option>
              ))}
            </select>
          </div>

          <div style={styles.fieldGroup}>
            <label style={styles.label}>Endpoint</label>
            <select
              style={styles.select}
              value={endpoint}
              onChange={e => setEndpoint(e.target.value)}
            >
              {ENDPOINTS[assetType].map(ep => (
                <option key={ep} value={ep}>{ep}</option>
              ))}
            </select>
          </div>

          <hr style={styles.divider} />

          {/* Consumer Identity */}
          <div style={styles.fieldGroup}>
            <label style={styles.label}>Consumer Identity</label>
            <div style={styles.toggleRow}>
              <span style={styles.toggleLabel}>Use Managed Identity</span>
              <button
                style={{
                  ...styles.toggle,
                  backgroundColor: useManagedIdentity ? '#818CF8' : '#333',
                }}
                onClick={() => setUseManagedIdentity(!useManagedIdentity)}
                aria-label="Toggle managed identity"
              >
                <span
                  style={{
                    position: 'absolute',
                    top: '2px',
                    left: useManagedIdentity ? '18px' : '2px',
                    width: '16px',
                    height: '16px',
                    borderRadius: '50%',
                    backgroundColor: '#fff',
                    transition: 'left 0.2s',
                  }}
                />
              </button>
            </div>
            {!useManagedIdentity && (
              <input
                style={styles.input}
                value={apiKey}
                onChange={e => setApiKey(e.target.value)}
                placeholder="API Key"
              />
            )}
            {useManagedIdentity && (
              <div style={{
                backgroundColor: 'rgba(129, 140, 248, 0.08)',
                border: '1px solid rgba(129, 140, 248, 0.15)',
                borderRadius: '6px',
                padding: '8px 10px',
                fontSize: '12px',
                color: '#4ADE80',
              }}>
                ✓ Using system-assigned managed identity
              </div>
            )}
          </div>

          <hr style={styles.divider} />

          {/* Prompt */}
          <div style={styles.fieldGroup}>
            <label style={styles.label}>Test Prompt</label>
            <textarea
              style={styles.textarea}
              value={prompt}
              onChange={e => setPrompt(e.target.value)}
            />
          </div>

          {/* Send button */}
          <button
            style={{
              ...styles.sendButton,
              opacity: isRunning ? 0.6 : 1,
              cursor: isRunning ? 'not-allowed' : 'pointer',
            }}
            onClick={handleSend}
            disabled={isRunning}
          >
            {isRunning ? '⏳ Running...' : '▶ Send Test Request'}
          </button>

          <hr style={styles.divider} />

          {/* Options */}
          <div style={styles.fieldGroup}>
            <label style={styles.label}>Simulation Options</label>
            <div style={styles.checkboxRow}>
              <input
                type="checkbox"
                style={styles.checkbox}
                id="sim-rate"
                checked={simRateLimit}
                onChange={e => setSimRateLimit(e.target.checked)}
              />
              <label style={styles.checkboxLabel} htmlFor="sim-rate">
                Simulate rate limit
              </label>
            </div>
            <div style={styles.checkboxRow}>
              <input
                type="checkbox"
                style={styles.checkbox}
                id="sim-failover"
                checked={simFailover}
                onChange={e => setSimFailover(e.target.checked)}
              />
              <label style={styles.checkboxLabel} htmlFor="sim-failover">
                Simulate failover
              </label>
            </div>
            <div style={styles.checkboxRow}>
              <input
                type="checkbox"
                style={styles.checkbox}
                id="sim-unsafe"
                checked={simUnsafe}
                onChange={e => setSimUnsafe(e.target.checked)}
              />
              <label style={styles.checkboxLabel} htmlFor="sim-unsafe">
                Include unsafe content
              </label>
            </div>
          </div>
        </div>

        {/* ---- CENTER COLUMN ---- */}
        <div style={styles.centerPanel}>
          <div style={styles.centerHeader}>
            <div style={styles.headerLeft}>
              <span style={{ fontSize: '13px', fontWeight: 600, color: '#fff' }}>
                Gateway Execution Trace
              </span>
              {trace.length > 0 && (
                <span style={{
                  fontSize: '11px',
                  color: hasError ? '#EF4444' : '#4ADE80',
                  fontFamily: '"Cascadia Code", monospace',
                }}>
                  {hasError ? '● BLOCKED' : isFailover ? '● COMPLETED (failover)' : '● COMPLETED'}
                </span>
              )}
            </div>
            {trace.length > 0 && !isRunning && (
              <span style={{
                fontSize: '11px',
                color: '#666',
                fontFamily: '"Cascadia Code", monospace',
              }}>
                {trace.length} steps
              </span>
            )}
          </div>

          <div style={styles.traceContainer}>
            {trace.length === 0 && !isRunning && (
              <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flex: 1,
                color: '#555',
                fontSize: '13px',
              }}>
                Click "Send Test Request" to see the gateway execution trace
              </div>
            )}
            {trace.map((step, idx) => (
              <div key={idx} style={styles.traceStep}>
                {/* Timeline */}
                <div style={styles.traceTimeline}>
                  <div style={{
                    ...styles.traceIcon,
                    backgroundColor: statusColor(step.status) + '20',
                    color: statusColor(step.status),
                    border: `2px solid ${statusColor(step.status)}`,
                    fontWeight: 700,
                    fontSize: '13px',
                  }}>
                    {statusIcon(step.status)}
                  </div>
                  {idx < trace.length - 1 && <div style={styles.traceLine} />}
                </div>
                {/* Content */}
                <div style={styles.traceContent}>
                  <div style={styles.traceTitle}>
                    <span style={styles.traceTitleText}>{step.title}</span>
                    <span style={styles.traceTiming}>{step.timing}</span>
                  </div>
                  <div style={styles.traceDetails}>
                    {step.details.map((d, di) => (
                      <div key={di} style={styles.traceDetailRow}>
                        <span style={styles.traceDetailLabel}>{d.label}:</span>
                        <span style={{
                          ...styles.traceDetailValue,
                          color: d.value.includes('EXCEEDED') || d.value.includes('BLOCKED')
                            ? '#EF4444'
                            : d.value.includes('passed') || d.value.includes('within quota')
                              ? '#4ADE80'
                              : '#ccc',
                        }}>
                          {d.value}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* ---- RIGHT COLUMN ---- */}
        <div style={styles.rightPanel}>
          <p style={styles.panelTitle}>Request Details</p>

          {/* Routing Card */}
          <div style={styles.card}>
            <div style={styles.cardTitle}>Routing</div>
            <div style={styles.cardRow}>
              <span style={styles.cardLabel}>Rule</span>
              <span style={styles.cardValue}>GPT-4o Primary</span>
            </div>
            <div style={styles.cardRow}>
              <span style={styles.cardLabel}>Provider</span>
              <span style={styles.cardValue}>Azure OpenAI</span>
            </div>
            <div style={styles.cardRow}>
              <span style={styles.cardLabel}>Region</span>
              <span style={styles.cardValue}>East US</span>
            </div>
            <div style={styles.cardRow}>
              <span style={styles.cardLabel}>Failover available</span>
              <span style={{ ...styles.cardValue, ...styles.statusPass }}>
                Yes (West US, OpenAI Direct)
              </span>
            </div>
          </div>

          {/* Policies Applied Card */}
          <div style={styles.card}>
            <div style={styles.cardTitle}>Policies Applied</div>
            <div style={styles.cardRow}>
              <span style={styles.cardLabel}>Rate Limit</span>
              <span style={{
                ...styles.cardValue,
                color: hasError && trace.some(s => s.title === 'Policy Evaluation' && s.status === 'error' && s.details.some(d => d.value.includes('EXCEEDED')))
                  ? '#EF4444' : '#4ADE80',
              }}>
                {hasError && trace.some(s => s.details.some(d => d.value.includes('EXCEEDED')))
                  ? '✗ Exceeded (1000/1000)'
                  : '✓ Passed (847/1000)'}
              </span>
            </div>
            <div style={styles.cardRow}>
              <span style={styles.cardLabel}>Token Quota</span>
              <span style={{ ...styles.cardValue, ...styles.statusPass }}>✓ Passed (2.1M/5M)</span>
            </div>
            <div style={styles.cardRow}>
              <span style={styles.cardLabel}>Content Safety</span>
              <span style={{
                ...styles.cardValue,
                color: hasError && trace.some(s => s.details.some(d => d.value.includes('BLOCKED')))
                  ? '#EF4444' : '#4ADE80',
              }}>
                {hasError && trace.some(s => s.details.some(d => d.value.includes('BLOCKED')))
                  ? '✗ Blocked'
                  : '✓ Passed'}
              </span>
            </div>
            <div style={styles.cardRow}>
              <span style={styles.cardLabel}>IP Filter</span>
              <span style={{ ...styles.cardValue, ...styles.statusPass }}>✓ Passed</span>
            </div>
          </div>

          {/* Credentials Card */}
          <div style={styles.card}>
            <div style={styles.cardTitle}>Credentials</div>
            <div style={styles.cardRow}>
              <span style={styles.cardLabel}>Type</span>
              <span style={styles.cardValue}>
                {useManagedIdentity ? 'Managed Identity' : 'API Key'}
              </span>
            </div>
            <div style={styles.cardRow}>
              <span style={styles.cardLabel}>Name</span>
              <span style={styles.cardValue}>azure-openai-eastus</span>
            </div>
            <div style={styles.cardRow}>
              <span style={styles.cardLabel}>Scope</span>
              <span style={styles.cardValue}>{namespace}</span>
            </div>
            <div style={styles.cardRow}>
              <span style={styles.cardLabel}>Mediated</span>
              <span style={{ ...styles.cardValue, ...styles.statusPass }}>
                Yes (app never sees key)
              </span>
            </div>
          </div>

          {/* Metrics Card */}
          <div style={styles.card}>
            <div style={styles.cardTitle}>Metrics</div>
            <div style={styles.metricsGrid}>
              <div style={styles.metricBox}>
                <div style={styles.metricValue}>
                  {hasError ? '—' : isFailover ? '3.9s' : '855ms'}
                </div>
                <div style={styles.metricLabel}>Total Latency</div>
              </div>
              <div style={styles.metricBox}>
                <div style={styles.metricValue}>
                  {hasError ? '—' : isFailover ? '15ms' : '8ms'}
                </div>
                <div style={styles.metricLabel}>Gateway Overhead</div>
              </div>
              <div style={styles.metricBox}>
                <div style={styles.metricValue}>
                  {hasError ? '—' : '470'}
                </div>
                <div style={styles.metricLabel}>Tokens Used</div>
              </div>
              <div style={styles.metricBox}>
                <div style={styles.metricValue}>
                  {hasError ? '—' : '$0.0047'}
                </div>
                <div style={styles.metricLabel}>Est. Cost</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TestConsole;
