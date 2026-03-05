import { useState } from 'react';
import { createPortal } from 'react-dom';
import type { CSSProperties } from 'react';
import InlineCredentialForm from '../components/InlineCredentialForm';
import ConnectFoundryPanel from '../components/ConnectFoundryPanel';

// --- Types ---
type AgentSource = 'foundry' | 'bedrock' | 'vertex' | 'a2a' | 'rapi' | 'custom';

interface FormData {
  source: AgentSource | null;
  // Foundry
  foundryProject: string;
  foundryAgents: string[];
  // Bedrock
  awsRegion: string;
  bedrockAgentId: string;
  bedrockAgentAlias: string;
  bedrockDisplayName: string;
  bedrockCredential: string;
  // Vertex
  gcpProject: string;
  vertexAgentId: string;
  vertexRegion: string;
  vertexDisplayName: string;
  vertexCredential: string;
  // A2A
  a2aCardUrl: string;
  a2aFetched: boolean;
  a2aName: string;
  a2aDescription: string;
  a2aCapabilities: string[];
  a2aInputModes: string[];
  a2aOutputModes: string[];
  // RAPI
  rapiEndpoint: string;
  rapiDisplayName: string;
  rapiDescription: string;
  rapiApiSpec: string;
  // Custom
  customDisplayName: string;
  customEndpoint: string;
  customProtocol: string;
  customDescription: string;
  // Model bindings
  selectedModels: string[];
  allowAllModels: boolean;
  // Tool bindings
  selectedTools: string[];
  allowAllTools: boolean;
  // A2A bindings
  enableA2A: boolean;
  allowedTargetAgents: string[];
  // Governance
  rateLimit: number;
  tokenQuota: number;
  contentSafety: boolean;
  contentSafetyLevel: string;
  promptScanning: boolean;
  responseScanning: boolean;
  toolPayloadScanning: boolean;
  toolInvocationLimit: number;
  maxSessionDuration: number;
  maxTurnsPerSession: number;
  auditLogging: boolean;
  logReasoningTraces: boolean;
  logToolInvocations: boolean;
  logModelCalls: boolean;
  failoverOnModel: string;
  failoverOnTool: string;
  // Namespace
  namespace: string;
  visibility: 'private' | 'shared';
  tags: string[];
  owner: string;
  requireApproval: boolean;
  // Authentication
  authMethod: 'apikey' | 'oauth2' | 'managed-identity' | 'entra-token' | 'none';
  authApiKeyHeader: string;
  authApiKeyCredential: string;
  authOAuthTokenUrl: string;
  authOAuthClientId: string;
  authOAuthScopes: string;
  authOAuthGrantType: string;
  authManagedIdentityType: string;
  authManagedIdentityResource: string;
  authEntraTenantId: string;
  authEntraResource: string;
}

const initialFormData: FormData = {
  source: null,
  foundryProject: '',
  foundryAgents: ['retail-support-agent', 'order-tracking-agent'],
  awsRegion: 'us-east-1',
  bedrockAgentId: '',
  bedrockAgentAlias: 'latest',
  bedrockDisplayName: '',
  bedrockCredential: '',
  gcpProject: '',
  vertexAgentId: '',
  vertexRegion: 'us-central1',
  vertexDisplayName: '',
  vertexCredential: '',
  a2aCardUrl: '',
  a2aFetched: false,
  a2aName: '',
  a2aDescription: '',
  a2aCapabilities: [],
  a2aInputModes: [],
  a2aOutputModes: [],
  rapiEndpoint: '',
  rapiDisplayName: '',
  rapiDescription: '',
  rapiApiSpec: '',
  customDisplayName: '',
  customEndpoint: '',
  customProtocol: 'HTTP',
  customDescription: '',
  selectedModels: ['gpt-4o', 'claude-3.5-sonnet'],
  allowAllModels: false,
  selectedTools: ['salesforce-crm', 'order-lookup'],
  allowAllTools: false,
  enableA2A: false,
  allowedTargetAgents: [],
  rateLimit: 120,
  tokenQuota: 500000,
  contentSafety: false,
  contentSafetyLevel: 'Medium',
  promptScanning: true,
  responseScanning: true,
  toolPayloadScanning: true,
  toolInvocationLimit: 50,
  maxSessionDuration: 300,
  maxTurnsPerSession: 20,
  auditLogging: true,
  logReasoningTraces: true,
  logToolInvocations: true,
  logModelCalls: true,
  failoverOnModel: 'failover',
  failoverOnTool: 'skip',
  namespace: '',
  visibility: 'private',
  tags: [],
  owner: 'anishta@contoso.com',
  requireApproval: false,
  authMethod: 'apikey',
  authApiKeyHeader: 'Authorization',
  authApiKeyCredential: '',
  authOAuthTokenUrl: '',
  authOAuthClientId: '',
  authOAuthScopes: '',
  authOAuthGrantType: 'client_credentials',
  authManagedIdentityType: 'system-assigned',
  authManagedIdentityResource: '',
  authEntraTenantId: '',
  authEntraResource: '',
};

// --- Shared style helpers (matching Assets.tsx / RegisterModel.tsx dark theme) ---
const badge = (bg: string, fg: string): CSSProperties => ({
  display: 'inline-block',
  padding: '2px 8px',
  borderRadius: 4,
  fontSize: 11,
  fontWeight: 600,
  backgroundColor: bg,
  color: fg,
  marginRight: 4,
});

// --- Styles ---
const overlay: CSSProperties = {
  position: 'fixed',
  inset: 0,
  backgroundColor: 'rgba(0,0,0,0.75)',
  backdropFilter: 'blur(8px)',
  zIndex: 1000,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  fontFamily: 'inherit',
};

const modal: CSSProperties = {
  width: '90vw',
  maxWidth: 860,
  maxHeight: '90vh',
  backgroundColor: '#161616',
  border: '1px solid #333',
  borderRadius: 12,
  display: 'flex',
  flexDirection: 'column',
  overflow: 'hidden',
};

const headerBar: CSSProperties = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  padding: '16px 24px',
  borderBottom: '1px solid #2a2a2a',
};

const closeBtn: CSSProperties = {
  background: 'none',
  border: 'none',
  color: '#888',
  fontSize: 20,
  cursor: 'pointer',
  padding: '4px 8px',
  borderRadius: 4,
  lineHeight: 1,
};

const stepBarWrap: CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  gap: 0,
  padding: '16px 24px 12px',
};

const stepDot = (state: 'completed' | 'active' | 'upcoming'): CSSProperties => ({
  width: 28,
  height: 28,
  borderRadius: '50%',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  fontSize: 12,
  fontWeight: 700,
  backgroundColor:
    state === 'completed' ? 'rgba(14,147,73,0.25)' :
    state === 'active' ? 'rgba(96,205,255,0.2)' : '#1e1e1e',
  color:
    state === 'completed' ? '#4caf50' :
    state === 'active' ? '#60cdff' : '#666',
  border: `2px solid ${
    state === 'completed' ? '#4caf50' :
    state === 'active' ? '#60cdff' : '#333'
  }`,
  flexShrink: 0,
});

const stepLine = (done: boolean): CSSProperties => ({
  width: 40,
  height: 2,
  backgroundColor: done ? '#4caf50' : '#333',
  margin: '0 4px',
  flexShrink: 0,
});

const body: CSSProperties = {
  flex: 1,
  overflowY: 'auto',
  padding: '20px 24px 24px',
};

const footer: CSSProperties = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  padding: '16px 24px',
  borderTop: '1px solid #2a2a2a',
};

const btnPrimary: CSSProperties = {
  padding: '8px 24px',
  borderRadius: 6,
  border: 'none',
  backgroundColor: '#818CF8',
  color: '#FFFFFF',
  fontSize: 13,
  fontWeight: 600,
  cursor: 'pointer',
  fontFamily: 'inherit',
};

const btnSecondary: CSSProperties = {
  ...btnPrimary,
  backgroundColor: 'transparent',
  color: '#E8E8E8',
  border: '1px solid rgba(129, 140, 248, 0.12)',
};

const title: CSSProperties = {
  fontSize: 18,
  fontWeight: 700,
  color: '#fff',
  marginBottom: 4,
};

const subtitle: CSSProperties = {
  fontSize: 13,
  color: '#888',
  marginBottom: 20,
};

const label: CSSProperties = {
  display: 'block',
  fontSize: 12,
  fontWeight: 600,
  color: '#aaa',
  marginBottom: 6,
  textTransform: 'uppercase',
  letterSpacing: 0.3,
};

const input: CSSProperties = {
  width: '100%',
  padding: '8px 12px',
  borderRadius: 6,
  border: '1px solid #333',
  backgroundColor: '#1a1a1a',
  color: '#e0e0e0',
  fontSize: 13,
  fontFamily: 'inherit',
  outline: 'none',
  boxSizing: 'border-box',
};

const textarea: CSSProperties = {
  ...input,
  minHeight: 72,
  resize: 'vertical' as const,
};

const select: CSSProperties = { ...input, appearance: 'auto' as const };

const fieldGroup: CSSProperties = { marginBottom: 16 };

const sourceCardStyle = (accent: string, selected: boolean): CSSProperties => ({
  backgroundColor: selected ? 'rgba(96,205,255,0.06)' : 'rgba(255,255,255,0.02)',
  border: selected ? `1px solid ${accent}` : '1px solid #333',
  borderTop: `3px solid ${accent}`,
  borderRadius: 8,
  padding: '16px 18px',
  cursor: 'pointer',
  transition: 'all 0.15s',
  backdropFilter: 'blur(4px)',
});

const policyCard = (enabled: boolean): CSSProperties => ({
  backgroundColor: enabled ? 'rgba(96,205,255,0.04)' : 'rgba(255,255,255,0.02)',
  border: enabled ? '1px solid rgba(96,205,255,0.2)' : '1px solid #333',
  borderRadius: 8,
  padding: '14px 18px',
  marginBottom: 10,
});

const toggle = (on: boolean): CSSProperties => ({
  width: 36,
  height: 20,
  borderRadius: 10,
  backgroundColor: on ? '#60cdff' : '#444',
  position: 'relative',
  cursor: 'pointer',
  border: 'none',
  padding: 0,
  flexShrink: 0,
  transition: 'background-color 0.15s',
});

const toggleDot = (on: boolean): CSSProperties => ({
  width: 14,
  height: 14,
  borderRadius: '50%',
  backgroundColor: '#fff',
  position: 'absolute',
  top: 3,
  left: on ? 19 : 3,
  transition: 'left 0.15s',
});

const checkRow: CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: 8,
  fontSize: 13,
  color: '#E8E8E8',
  marginTop: 8,
};

const tagStyle: CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  gap: 4,
  padding: '2px 10px',
  borderRadius: 4,
  fontSize: 12,
  backgroundColor: 'rgba(96,205,255,0.1)',
  color: '#60cdff',
  marginRight: 6,
  marginBottom: 4,
};

const reviewSection: CSSProperties = {
  backgroundColor: '#1a1a1a',
  border: '1px solid #333',
  borderRadius: 8,
  padding: '14px 18px',
  marginBottom: 12,
};

const reviewLabel: CSSProperties = {
  fontSize: 11,
  fontWeight: 600,
  color: '#888',
  textTransform: 'uppercase',
  letterSpacing: 0.3,
  marginBottom: 6,
};

const reviewValue: CSSProperties = { fontSize: 13, color: '#e0e0e0' };

const infoBox: CSSProperties = {
  backgroundColor: 'rgba(96,205,255,0.06)',
  border: '1px solid rgba(96,205,255,0.2)',
  borderRadius: 8,
  padding: '12px 16px',
  fontSize: 12,
  color: '#9cdcfe',
  marginBottom: 16,
  lineHeight: 1.5,
};

const sectionTitle: CSSProperties = {
  fontSize: 14,
  fontWeight: 600,
  color: '#e0e0e0',
  marginBottom: 6,
};

const sectionSub: CSSProperties = {
  fontSize: 12,
  color: '#888',
  marginBottom: 12,
};

// --- Data ---
const sources: { id: AgentSource; name: string; desc: string; sub: string; icon: string; accent: string }[] = [
  { id: 'foundry', name: 'Azure AI Foundry Agent Service', desc: 'Import agents from Foundry', sub: 'Auto-discover agents from connected Foundry projects', icon: '◆', accent: '#4fc3f7' },
  { id: 'bedrock', name: 'AWS Bedrock Agents', desc: 'Register a Bedrock agent endpoint', sub: 'Agents built with Amazon Bedrock Agent Service', icon: '▲', accent: '#ff9800' },
  { id: 'vertex', name: 'Google Vertex AI Agents', desc: 'Register a Vertex AI agent', sub: 'Agents built with Vertex AI Agent Builder', icon: '▷', accent: '#66bb6a' },
  { id: 'a2a', name: 'A2A Protocol', desc: 'Register an Agent-to-Agent protocol endpoint', sub: 'Any agent supporting the A2A communication standard', icon: '⬡', accent: '#26c6da' },
  { id: 'rapi', name: 'RAPI (REST Agent Protocol)', desc: 'Register a REST-based agent', sub: 'Agents exposing a standard REST API interface', icon: '◎', accent: '#ab47bc' },
  { id: 'custom', name: 'Custom Agent', desc: 'Register any agent endpoint', sub: 'Custom protocols, internal agents, or third-party agent platforms', icon: '▣', accent: '#888' },
];

const credentialOptions = ['prod-azure-key', 'dev-azure-key', 'bedrock-iam-role', 'gcp-service-acct'];

const foundryAgentList: { id: string; desc: string; defaultChecked: boolean }[] = [
  { id: 'retail-support-agent', desc: 'Customer support agent using GPT-4o + Salesforce tools', defaultChecked: true },
  { id: 'order-tracking-agent', desc: 'Order status lookup agent', defaultChecked: true },
  { id: 'internal-qa-agent', desc: 'QA testing agent (dev only)', defaultChecked: false },
];

const gatewayModels: { id: string; detail: string; role: string }[] = [
  { id: 'gpt-4o', detail: 'Azure OpenAI, East US', role: 'Primary' },
  { id: 'claude-3.5-sonnet', detail: 'Anthropic', role: 'Failover' },
  { id: 'gpt-4o-mini', detail: 'Azure OpenAI, East US', role: '' },
  { id: 'gemini-1.5-pro', detail: 'Google Vertex', role: '' },
  { id: 'llama-3.1-70b', detail: 'AWS Bedrock', role: '' },
];

const gatewayTools: { id: string; type: string; namespace: string }[] = [
  { id: 'salesforce-crm', type: 'REST API', namespace: 'retail-support' },
  { id: 'order-lookup', type: 'MCP Server', namespace: 'retail-support' },
  { id: 'jira-tickets', type: 'REST API', namespace: 'dev-sandbox' },
  { id: 'postgres-query', type: 'MCP Server', namespace: 'finance-analytics' },
];

const registeredAgents = ['retail-support-agent', 'finance-analyst', 'hr-assistant', 'dev-copilot'];
const namespaces = ['retail-support', 'finance-analytics', 'hr-automation', 'dev-sandbox'];

// --- Toggle Button Component ---
function ToggleButton({ on, onToggle }: { on: boolean; onToggle: () => void }) {
  return (
    <button style={toggle(on)} onClick={onToggle} type="button" aria-label="Toggle">
      <span style={toggleDot(on)} />
    </button>
  );
}

// --- Main Component ---
function RegisterAgent({ onClose, onComplete }: { onClose: () => void; onComplete: () => void }) {
  const [step, setStep] = useState(1);
  const [form, setForm] = useState<FormData>(initialFormData);
  const [tagInput, setTagInput] = useState('');
  const [showInlineCred, setShowInlineCred] = useState<string | null>(null);
  const [dynamicCredentials, setDynamicCredentials] = useState<string[]>([]);
  const allCredentialOptions = [...credentialOptions, ...dynamicCredentials];
  const [connectedFoundryProjects, setConnectedFoundryProjects] = useState<string[]>(['contoso-ai-prod', 'retail-ai']);

  const totalSteps = 7;
  const canNext = (): boolean => {
    if (step === 1) return form.source !== null;
    if (step === 2) {
      if (form.source === 'foundry') return form.foundryProject !== '' && form.foundryAgents.length > 0;
      if (form.source === 'bedrock') return form.bedrockAgentId !== '' && form.bedrockDisplayName !== '';
      if (form.source === 'vertex') return form.gcpProject !== '' && form.vertexAgentId !== '';
      if (form.source === 'a2a') return form.a2aCardUrl !== '' && form.a2aFetched;
      if (form.source === 'rapi') return form.rapiEndpoint !== '' && form.rapiDisplayName !== '';
      if (form.source === 'custom') return form.customDisplayName !== '' && form.customEndpoint !== '';
    }
    if (step === 3) return true;
    if (step === 6) return form.namespace !== '';
    return true;
  };

  const set = <K extends keyof FormData>(key: K, val: FormData[K]) =>
    setForm((prev) => ({ ...prev, [key]: val }));

  const toggleArrayItem = (key: 'foundryAgents' | 'selectedModels' | 'selectedTools' | 'allowedTargetAgents', item: string) => {
    setForm((prev) => {
      const arr = prev[key] as string[];
      return { ...prev, [key]: arr.includes(item) ? arr.filter((x) => x !== item) : [...arr, item] };
    });
  };

  const addTag = () => {
    const t = tagInput.trim();
    if (t && !form.tags.includes(t)) {
      set('tags', [...form.tags, t]);
      setTagInput('');
    }
  };

  const simulateFetchAgentCard = () => {
    set('a2aFetched', true);
    setForm((prev) => ({
      ...prev,
      a2aFetched: true,
      a2aName: 'external-planning-agent',
      a2aDescription: 'Multi-step planning agent with tool-use and reasoning capabilities',
      a2aCapabilities: ['Streaming', 'Multi-turn', 'Tool use'],
      a2aInputModes: ['text/plain', 'application/json'],
      a2aOutputModes: ['text/plain', 'application/json'],
    }));
  };

  const stepLabels = ['Source', 'Endpoint', 'Auth', 'Bindings', 'Governance', 'Namespace', 'Review'];

  // --- Render helpers ---
  const renderStepBar = () => (
    <div style={stepBarWrap}>
      {stepLabels.map((lbl, i) => {
        const n = i + 1;
        const state = n < step ? 'completed' : n === step ? 'active' : 'upcoming';
        return (
          <div key={n} style={{ display: 'flex', alignItems: 'center' }}>
            {i > 0 && <div style={stepLine(n <= step)} />}
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
              <div style={stepDot(state)}>
                {state === 'completed' ? '✓' : n}
              </div>
              <span style={{ fontSize: 10, color: state === 'active' ? '#60cdff' : '#666', whiteSpace: 'nowrap' }}>
                {lbl}
              </span>
            </div>
          </div>
        );
      })}
    </div>
  );

  // Step 1 — Source & Protocol
  const renderSourceStep = () => (
    <>
      <div style={title}>Where is this agent hosted?</div>
      <div style={subtitle}>Select the platform or protocol of the agent you want to register for gateway governance</div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12 }}>
        {sources.map((s) => (
          <div
            key={s.id}
            style={sourceCardStyle(s.accent, form.source === s.id)}
            onClick={() => set('source', s.id)}
            onMouseEnter={(e) => { (e.currentTarget as HTMLDivElement).style.borderColor = s.accent; }}
            onMouseLeave={(e) => {
              if (form.source !== s.id) (e.currentTarget as HTMLDivElement).style.borderColor = '#333';
            }}
          >
            <div style={{ fontSize: 24, marginBottom: 8, color: s.accent }}>{s.icon}</div>
            <div style={{ fontSize: 14, fontWeight: 600, color: '#fff', marginBottom: 4 }}>{s.name}</div>
            <div style={{ fontSize: 12, color: '#aaa', marginBottom: 6 }}>{s.desc}</div>
            <div style={{ fontSize: 11, color: '#666' }}>{s.sub}</div>
          </div>
        ))}
      </div>
    </>
  );

  // Step 2 — Configure Endpoint
  const renderEndpointStep = () => {
    return (
      <>
        <div style={title}>Configure agent endpoint</div>
        <div style={subtitle}>
          Provide connection details for the existing agent — the gateway will mediate traffic to this endpoint
        </div>

        {/* Foundry */}
        {form.source === 'foundry' && (
          <>
            <ConnectFoundryPanel
              connectedProjects={connectedFoundryProjects}
              selectedProject={form.foundryProject}
              onSelectProject={(p) => set('foundryProject', p)}
              onConnectProject={(p) => setConnectedFoundryProjects((prev) => [...prev, p])}
            />
            {form.foundryProject && (
              <div style={fieldGroup}>
                <label style={label}>Auto-discovered Agents</label>
                <div style={{ backgroundColor: '#1a1a1a', border: '1px solid #333', borderRadius: 6, padding: 8 }}>
                  {foundryAgentList.map((a) => (
                    <label key={a.id} style={{ display: 'flex', alignItems: 'flex-start', gap: 8, padding: '8px 8px', cursor: 'pointer', color: '#E8E8E8', fontSize: 13 }}>
                      <input
                        type="checkbox"
                        checked={form.foundryAgents.includes(a.id)}
                        onChange={() => toggleArrayItem('foundryAgents', a.id)}
                        style={{ marginTop: 2 }}
                      />
                      <div>
                        <div style={{ fontWeight: 600, color: '#fff' }}>{a.id}</div>
                        <div style={{ fontSize: 11, color: '#888', marginTop: 2 }}>{a.desc}</div>
                      </div>
                    </label>
                  ))}
                </div>
              </div>
            )}
            <div style={infoBox}>
              ℹ Import mode: <strong>Register for traffic governance</strong> — these agents will be registered in the gateway registry so all traffic can be governed, monitored, and policy-enforced.
            </div>
          </>
        )}

        {/* Bedrock */}
        {form.source === 'bedrock' && (
          <>
            <div style={fieldGroup}>
              <label style={label}>AWS Region</label>
              <select style={select} value={form.awsRegion} onChange={(e) => set('awsRegion', e.target.value)}>
                <option value="us-east-1">us-east-1</option>
                <option value="us-west-2">us-west-2</option>
                <option value="eu-west-1">eu-west-1</option>
              </select>
            </div>
            <div style={fieldGroup}>
              <label style={label}>Agent ID</label>
              <input style={input} placeholder="ABCDE12345" value={form.bedrockAgentId} onChange={(e) => set('bedrockAgentId', e.target.value)} />
            </div>
            <div style={fieldGroup}>
              <label style={label}>Agent Alias</label>
              <input style={input} placeholder="latest" value={form.bedrockAgentAlias} onChange={(e) => set('bedrockAgentAlias', e.target.value)} />
            </div>
            <div style={fieldGroup}>
              <label style={label}>Display Name</label>
              <input style={input} value={form.bedrockDisplayName} onChange={(e) => set('bedrockDisplayName', e.target.value)} />
            </div>
          </>
        )}

        {/* Vertex */}
        {form.source === 'vertex' && (
          <>
            <div style={fieldGroup}>
              <label style={label}>GCP Project</label>
              <input style={input} placeholder="my-gcp-project-id" value={form.gcpProject} onChange={(e) => set('gcpProject', e.target.value)} />
            </div>
            <div style={fieldGroup}>
              <label style={label}>Agent ID</label>
              <input style={input} placeholder="agent-abc-123" value={form.vertexAgentId} onChange={(e) => set('vertexAgentId', e.target.value)} />
            </div>
            <div style={fieldGroup}>
              <label style={label}>Region</label>
              <select style={select} value={form.vertexRegion} onChange={(e) => set('vertexRegion', e.target.value)}>
                <option value="us-central1">us-central1</option>
                <option value="europe-west4">europe-west4</option>
                <option value="asia-southeast1">asia-southeast1</option>
              </select>
            </div>
            <div style={fieldGroup}>
              <label style={label}>Display Name</label>
              <input style={input} value={form.vertexDisplayName} onChange={(e) => set('vertexDisplayName', e.target.value)} />
            </div>
          </>
        )}

        {/* A2A */}
        {form.source === 'a2a' && (
          <>
            <div style={fieldGroup}>
              <label style={label}>Agent Card URL</label>
              <div style={{ display: 'flex', gap: 8 }}>
                <input
                  style={{ ...input, flex: 1 }}
                  placeholder="https://agent.example.com/.well-known/agent.json"
                  value={form.a2aCardUrl}
                  onChange={(e) => { set('a2aCardUrl', e.target.value); set('a2aFetched', false); }}
                />
                <button
                  type="button"
                  style={{ ...btnPrimary, padding: '8px 16px', whiteSpace: 'nowrap' }}
                  onClick={simulateFetchAgentCard}
                  disabled={!form.a2aCardUrl}
                >
                  Fetch Agent Card
                </button>
              </div>
            </div>
            {form.a2aFetched && (
              <div style={{ backgroundColor: '#1a1a1a', border: '1px solid #333', borderRadius: 8, padding: 16 }}>
                <div style={{ fontSize: 13, fontWeight: 600, color: '#4caf50', marginBottom: 12 }}>✓ Agent card discovered</div>
                <div style={{ display: 'grid', gridTemplateColumns: '120px 1fr', gap: '8px 12px', fontSize: 13 }}>
                  <span style={{ color: '#888' }}>Name:</span>
                  <span style={{ color: '#fff', fontWeight: 600 }}>{form.a2aName}</span>
                  <span style={{ color: '#888' }}>Description:</span>
                  <span style={{ color: '#E8E8E8' }}>{form.a2aDescription}</span>
                  <span style={{ color: '#888' }}>Capabilities:</span>
                  <span>{form.a2aCapabilities.map((c) => <span key={c} style={badge('rgba(96,205,255,0.1)', '#60cdff')}>{c}</span>)}</span>
                  <span style={{ color: '#888' }}>Input modes:</span>
                  <span style={{ color: '#E8E8E8', fontFamily: 'monospace', fontSize: 12 }}>{form.a2aInputModes.join(', ')}</span>
                  <span style={{ color: '#888' }}>Output modes:</span>
                  <span style={{ color: '#E8E8E8', fontFamily: 'monospace', fontSize: 12 }}>{form.a2aOutputModes.join(', ')}</span>
                </div>
              </div>
            )}
          </>
        )}

        {/* RAPI */}
        {form.source === 'rapi' && (
          <>
            <div style={fieldGroup}>
              <label style={label}>Endpoint URL</label>
              <input style={input} placeholder="https://agents.internal/my-agent" value={form.rapiEndpoint} onChange={(e) => set('rapiEndpoint', e.target.value)} />
            </div>
            <div style={fieldGroup}>
              <label style={label}>Display Name</label>
              <input style={input} value={form.rapiDisplayName} onChange={(e) => set('rapiDisplayName', e.target.value)} />
            </div>
            <div style={fieldGroup}>
              <label style={label}>Description</label>
              <textarea style={textarea} value={form.rapiDescription} onChange={(e) => set('rapiDescription', e.target.value)} />
            </div>
            <div style={fieldGroup}>
              <label style={label}>API Spec (optional)</label>
              <input style={input} type="file" />
            </div>
          </>
        )}

        {/* Custom */}
        {form.source === 'custom' && (
          <>
            <div style={fieldGroup}>
              <label style={label}>Display Name</label>
              <input style={input} value={form.customDisplayName} onChange={(e) => set('customDisplayName', e.target.value)} />
            </div>
            <div style={fieldGroup}>
              <label style={label}>Endpoint URL</label>
              <input style={input} placeholder="https://my-agent.internal:8080" value={form.customEndpoint} onChange={(e) => set('customEndpoint', e.target.value)} />
            </div>
            <div style={fieldGroup}>
              <label style={label}>Protocol</label>
              <select style={select} value={form.customProtocol} onChange={(e) => set('customProtocol', e.target.value)}>
                <option value="HTTP">HTTP</option>
                <option value="gRPC">gRPC</option>
                <option value="WebSocket">WebSocket</option>
              </select>
            </div>
            <div style={fieldGroup}>
              <label style={label}>Description</label>
              <textarea style={textarea} value={form.customDescription} onChange={(e) => set('customDescription', e.target.value)} />
            </div>
          </>
        )}
      </>
    );
  };

  // Step 3 — Authentication
  const renderAuthStep = () => {
    const authMethods: { value: FormData['authMethod']; label: string }[] = [
      { value: 'apikey', label: 'API Key' },
      { value: 'oauth2', label: 'OAuth 2.0' },
      { value: 'managed-identity', label: 'Managed Identity' },
      { value: 'entra-token', label: 'Entra ID Token' },
      { value: 'none', label: 'None' },
    ];

    return (
      <>
        <div style={title}>Configure authentication</div>
        <div style={subtitle}>Define how the gateway authenticates with the upstream agent endpoint</div>

        <div style={fieldGroup}>
          <label style={label}>Auth Method</label>
          <select style={select} value={form.authMethod} onChange={(e) => set('authMethod', e.target.value as FormData['authMethod'])}>
            {authMethods.map((m) => (
              <option key={m.value} value={m.value}>{m.label}</option>
            ))}
          </select>
        </div>

        {/* API Key */}
        {form.authMethod === 'apikey' && (
          <>
            <div style={fieldGroup}>
              <label style={label}>Header Name</label>
              <input style={input} placeholder="Authorization" value={form.authApiKeyHeader} onChange={(e) => set('authApiKeyHeader', e.target.value)} />
            </div>
            <div style={fieldGroup}>
              <label style={label}>Credential</label>
              <select style={select} value={form.authApiKeyCredential} onChange={(e) => { if (e.target.value === '__new') { setShowInlineCred('authApiKeyCredential'); } else { set('authApiKeyCredential', e.target.value); } }}>
                <option value="">Select credential…</option>
                {allCredentialOptions.map((c) => <option key={c} value={c}>{c}</option>)}
                <option value="__new">+ Create new credential</option>
              </select>
              {showInlineCred === 'authApiKeyCredential' && (
                <InlineCredentialForm
                  onSave={(name) => { setDynamicCredentials(prev => [...prev, name]); set('authApiKeyCredential', name); setShowInlineCred(null); }}
                  onCancel={() => { set('authApiKeyCredential', ''); setShowInlineCred(null); }}
                />
              )}
            </div>
          </>
        )}

        {/* OAuth 2.0 */}
        {form.authMethod === 'oauth2' && (
          <>
            <div style={fieldGroup}>
              <label style={label}>Token URL</label>
              <input style={input} placeholder="https://login.microsoftonline.com/{tenant}/oauth2/v2.0/token" value={form.authOAuthTokenUrl} onChange={(e) => set('authOAuthTokenUrl', e.target.value)} />
            </div>
            <div style={fieldGroup}>
              <label style={label}>Client ID Credential</label>
              <select style={select} value={form.authOAuthClientId} onChange={(e) => { if (e.target.value === '__new') { setShowInlineCred('authOAuthClientId'); } else { set('authOAuthClientId', e.target.value); } }}>
                <option value="">Select credential…</option>
                {allCredentialOptions.map((c) => <option key={c} value={c}>{c}</option>)}
                <option value="__new">+ Create new credential</option>
              </select>
              {showInlineCred === 'authOAuthClientId' && (
                <InlineCredentialForm
                  onSave={(name) => { setDynamicCredentials(prev => [...prev, name]); set('authOAuthClientId', name); setShowInlineCred(null); }}
                  onCancel={() => { set('authOAuthClientId', ''); setShowInlineCred(null); }}
                />
              )}
            </div>
            <div style={fieldGroup}>
              <label style={label}>Scopes</label>
              <input style={input} placeholder="api://my-app/.default" value={form.authOAuthScopes} onChange={(e) => set('authOAuthScopes', e.target.value)} />
            </div>
            <div style={fieldGroup}>
              <label style={label}>Grant Type</label>
              <select style={select} value={form.authOAuthGrantType} onChange={(e) => set('authOAuthGrantType', e.target.value)}>
                <option value="client_credentials">client_credentials</option>
                <option value="authorization_code">authorization_code</option>
              </select>
            </div>
          </>
        )}

        {/* Managed Identity */}
        {form.authMethod === 'managed-identity' && (
          <>
            <div style={fieldGroup}>
              <label style={label}>Identity Type</label>
              <select style={select} value={form.authManagedIdentityType} onChange={(e) => set('authManagedIdentityType', e.target.value)}>
                <option value="system-assigned">System-assigned</option>
                <option value="user-assigned">User-assigned</option>
              </select>
            </div>
            <div style={fieldGroup}>
              <label style={label}>Resource / Audience</label>
              <input style={input} placeholder="https://management.azure.com/" value={form.authManagedIdentityResource} onChange={(e) => set('authManagedIdentityResource', e.target.value)} />
            </div>
          </>
        )}

        {/* Entra ID Token */}
        {form.authMethod === 'entra-token' && (
          <>
            <div style={fieldGroup}>
              <label style={label}>Tenant ID</label>
              <input style={input} placeholder="xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx" value={form.authEntraTenantId} onChange={(e) => set('authEntraTenantId', e.target.value)} />
            </div>
            <div style={fieldGroup}>
              <label style={label}>Resource / Audience</label>
              <input style={input} placeholder="api://my-application" value={form.authEntraResource} onChange={(e) => set('authEntraResource', e.target.value)} />
            </div>
          </>
        )}

        {/* None */}
        {form.authMethod === 'none' && (
          <div style={{ backgroundColor: 'rgba(255,255,255,0.02)', border: '1px solid #333', borderRadius: 8, padding: '14px 18px', fontSize: 13, color: '#aaa' }}>
            No authentication will be configured. The agent endpoint must accept unauthenticated requests.
          </div>
        )}

        {form.authMethod !== 'none' && (
          <div style={{ backgroundColor: 'rgba(96,205,255,0.06)', border: '1px solid rgba(96,205,255,0.15)', borderRadius: 6, padding: '10px 14px', fontSize: 12, color: '#9cdcfe', marginTop: 16, lineHeight: 1.5 }}>
            🔒 Credential mediation — The gateway will inject credentials on every request. Consumers never see the upstream credentials.
          </div>
        )}
      </>
    );
  };

  // Step 4 — Model & Tool Bindings
  const renderBindingsStep = () => (
    <>
      <div style={title}>Declare model and tool access</div>
      <div style={subtitle}>Define what this agent is allowed to access through the gateway</div>

      {/* Model Access */}
      <div style={{ marginBottom: 24 }}>
        <div style={sectionTitle}>Model Access</div>
        <div style={sectionSub}>Which models can this agent access through the gateway?</div>
        <div style={{ backgroundColor: '#1a1a1a', border: '1px solid #333', borderRadius: 6, padding: 8, marginBottom: 8 }}>
          {gatewayModels.map((m) => (
            <label key={m.id} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '6px 8px', cursor: 'pointer', color: '#E8E8E8', fontSize: 13 }}>
              <input
                type="checkbox"
                checked={form.allowAllModels || form.selectedModels.includes(m.id)}
                disabled={form.allowAllModels}
                onChange={() => toggleArrayItem('selectedModels', m.id)}
              />
              <span style={{ fontWeight: 600, color: '#fff' }}>{m.id}</span>
              <span style={{ color: '#888', fontSize: 12 }}>({m.detail})</span>
              {m.role && <span style={badge(
                m.role === 'Primary' ? 'rgba(96,205,255,0.1)' : 'rgba(255,183,77,0.12)',
                m.role === 'Primary' ? '#60cdff' : '#ffb74d',
              )}>{m.role}</span>}
            </label>
          ))}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '6px 0' }}>
          <span style={{ fontSize: 13, color: '#E8E8E8' }}>Allow all models in namespace</span>
          <ToggleButton on={form.allowAllModels} onToggle={() => set('allowAllModels', !form.allowAllModels)} />
        </div>
      </div>

      {/* Tool Access */}
      <div style={{ marginBottom: 24 }}>
        <div style={sectionTitle}>Tool Access</div>
        <div style={sectionSub}>Which tools can this agent invoke through the gateway?</div>
        <div style={{ backgroundColor: '#1a1a1a', border: '1px solid #333', borderRadius: 6, padding: 8, marginBottom: 8 }}>
          {gatewayTools.map((t) => (
            <label key={t.id} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '6px 8px', cursor: 'pointer', color: '#E8E8E8', fontSize: 13 }}>
              <input
                type="checkbox"
                checked={form.allowAllTools || form.selectedTools.includes(t.id)}
                disabled={form.allowAllTools}
                onChange={() => toggleArrayItem('selectedTools', t.id)}
              />
              <span style={{ fontWeight: 600, color: '#fff' }}>{t.id}</span>
              <span style={{ color: '#888', fontSize: 12 }}>({t.type}, {t.namespace})</span>
            </label>
          ))}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '6px 0' }}>
          <span style={{ fontSize: 13, color: '#E8E8E8' }}>Allow all tools in namespace</span>
          <ToggleButton on={form.allowAllTools} onToggle={() => set('allowAllTools', !form.allowAllTools)} />
        </div>
      </div>

      {/* Agent-to-Agent Access */}
      <div style={{ marginBottom: 16 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
          <div>
            <div style={sectionTitle}>Agent-to-Agent Access</div>
            <div style={sectionSub}>Can this agent communicate with other registered agents?</div>
          </div>
          <ToggleButton on={form.enableA2A} onToggle={() => set('enableA2A', !form.enableA2A)} />
        </div>
        {form.enableA2A && (
          <div style={{ backgroundColor: '#1a1a1a', border: '1px solid #333', borderRadius: 6, padding: 8 }}>
            {registeredAgents.map((a) => (
              <label key={a} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '6px 8px', cursor: 'pointer', color: '#E8E8E8', fontSize: 13 }}>
                <input
                  type="checkbox"
                  checked={form.allowedTargetAgents.includes(a)}
                  onChange={() => toggleArrayItem('allowedTargetAgents', a)}
                />
                {a}
              </label>
            ))}
          </div>
        )}
      </div>

      <div style={infoBox}>
        🔒 These bindings are enforced at the gateway. Even if the agent attempts to call an unauthorized model or tool, the gateway will block the request.
      </div>
    </>
  );

  // Step 5 — Governance Policies
  const renderPoliciesStep = () => (
    <>
      <div style={title}>Apply governance policies</div>
      <div style={subtitle}>Configure the policies that will govern this agent's traffic through the gateway</div>

      {/* Rate Limiting */}
      <div style={policyCard(true)}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <div style={{ fontSize: 14, fontWeight: 600, color: '#fff' }}>Rate Limiting</div>
            <div style={{ fontSize: 12, color: '#888' }}>Limit agent requests per minute</div>
          </div>
        </div>
        <div style={{ marginTop: 12 }}>
          <label style={label}>Requests per minute</label>
          <input style={{ ...input, width: 120 }} type="number" value={form.rateLimit} onChange={(e) => set('rateLimit', Number(e.target.value))} />
        </div>
      </div>

      {/* Token Quota */}
      <div style={policyCard(true)}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <div style={{ fontSize: 14, fontWeight: 600, color: '#fff' }}>Token Quota</div>
            <div style={{ fontSize: 12, color: '#888' }}>Daily token consumption across all model calls</div>
          </div>
        </div>
        <div style={{ marginTop: 12 }}>
          <label style={label}>Tokens per day</label>
          <input style={{ ...input, width: 160 }} type="number" value={form.tokenQuota} onChange={(e) => set('tokenQuota', Number(e.target.value))} />
        </div>
      </div>

      {/* Content Safety */}
      <div style={policyCard(form.contentSafety)}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <div style={{ fontSize: 14, fontWeight: 600, color: '#fff' }}>Content Safety</div>
            <div style={{ fontSize: 12, color: '#888' }}>Scan agent traffic for harmful content</div>
          </div>
          <ToggleButton on={form.contentSafety} onToggle={() => set('contentSafety', !form.contentSafety)} />
        </div>
        {form.contentSafety && (
          <div style={{ marginTop: 12 }}>
            <label style={label}>Safety Level</label>
            <select style={{ ...select, width: 160, marginBottom: 8 }} value={form.contentSafetyLevel} onChange={(e) => set('contentSafetyLevel', e.target.value)}>
              <option value="Low">Low</option>
              <option value="Medium">Medium</option>
              <option value="High">High</option>
            </select>
            <div style={checkRow}>
              <input type="checkbox" checked={form.promptScanning} onChange={() => set('promptScanning', !form.promptScanning)} />
              Prompt scanning
            </div>
            <div style={checkRow}>
              <input type="checkbox" checked={form.responseScanning} onChange={() => set('responseScanning', !form.responseScanning)} />
              Response scanning
            </div>
            <div style={checkRow}>
              <input type="checkbox" checked={form.toolPayloadScanning} onChange={() => set('toolPayloadScanning', !form.toolPayloadScanning)} />
              Tool payload scanning
            </div>
          </div>
        )}
      </div>

      {/* Tool Invocation Limits */}
      <div style={policyCard(true)}>
        <div>
          <div style={{ fontSize: 14, fontWeight: 600, color: '#fff' }}>Tool Invocation Limits</div>
          <div style={{ fontSize: 12, color: '#888' }}>Maximum tool calls per session</div>
        </div>
        <div style={{ marginTop: 12 }}>
          <input style={{ ...input, width: 120 }} type="number" value={form.toolInvocationLimit} onChange={(e) => set('toolInvocationLimit', Number(e.target.value))} />
        </div>
      </div>

      {/* Session Governance */}
      <div style={policyCard(true)}>
        <div>
          <div style={{ fontSize: 14, fontWeight: 600, color: '#fff' }}>Session Governance</div>
          <div style={{ fontSize: 12, color: '#888' }}>Control session duration and turn limits</div>
        </div>
        <div style={{ marginTop: 12, display: 'flex', gap: 16 }}>
          <div style={{ flex: 1 }}>
            <label style={label}>Max session duration (seconds)</label>
            <input style={input} type="number" value={form.maxSessionDuration} onChange={(e) => set('maxSessionDuration', Number(e.target.value))} />
          </div>
          <div style={{ flex: 1 }}>
            <label style={label}>Max turns per session</label>
            <input style={input} type="number" value={form.maxTurnsPerSession} onChange={(e) => set('maxTurnsPerSession', Number(e.target.value))} />
          </div>
        </div>
      </div>

      {/* Audit Logging */}
      <div style={policyCard(form.auditLogging)}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <div style={{ fontSize: 14, fontWeight: 600, color: '#fff' }}>Audit Logging</div>
            <div style={{ fontSize: 12, color: '#888' }}>Log all agent activity for compliance and debugging</div>
          </div>
          <ToggleButton on={form.auditLogging} onToggle={() => set('auditLogging', !form.auditLogging)} />
        </div>
        {form.auditLogging && (
          <div style={{ marginTop: 8 }}>
            <div style={checkRow}>
              <input type="checkbox" checked={form.logReasoningTraces} onChange={() => set('logReasoningTraces', !form.logReasoningTraces)} />
              Log agent reasoning traces
            </div>
            <div style={checkRow}>
              <input type="checkbox" checked={form.logToolInvocations} onChange={() => set('logToolInvocations', !form.logToolInvocations)} />
              Log tool invocations
            </div>
            <div style={checkRow}>
              <input type="checkbox" checked={form.logModelCalls} onChange={() => set('logModelCalls', !form.logModelCalls)} />
              Log model calls
            </div>
          </div>
        )}
      </div>

      {/* Failover Policy */}
      <div style={policyCard(true)}>
        <div>
          <div style={{ fontSize: 14, fontWeight: 600, color: '#fff' }}>Failover Policy</div>
          <div style={{ fontSize: 12, color: '#888' }}>Define behavior when downstream calls fail</div>
        </div>
        <div style={{ marginTop: 12, display: 'flex', gap: 16 }}>
          <div style={{ flex: 1 }}>
            <label style={label}>On model failure</label>
            <select style={select} value={form.failoverOnModel} onChange={(e) => set('failoverOnModel', e.target.value)}>
              <option value="retry">Retry</option>
              <option value="failover">Failover to next</option>
              <option value="abort">Abort</option>
            </select>
          </div>
          <div style={{ flex: 1 }}>
            <label style={label}>On tool failure</label>
            <select style={select} value={form.failoverOnTool} onChange={(e) => set('failoverOnTool', e.target.value)}>
              <option value="retry">Retry</option>
              <option value="skip">Skip</option>
              <option value="abort">Abort</option>
            </select>
          </div>
        </div>
      </div>
    </>
  );

  // Step 6 — Namespace
  const renderNamespaceStep = () => (
    <>
      <div style={title}>Assign to namespace</div>
      <div style={subtitle}>Organize this agent within a governance namespace</div>

      <div style={fieldGroup}>
        <label style={label}>Namespace</label>
        <select style={select} value={form.namespace} onChange={(e) => set('namespace', e.target.value)}>
          <option value="">Select namespace…</option>
          {namespaces.map((n) => <option key={n} value={n}>{n}</option>)}
          <option value="__new">+ Create new namespace</option>
        </select>
      </div>

      <div style={fieldGroup}>
        <label style={label}>Visibility</label>
        <div style={{ display: 'flex', gap: 16 }}>
          {([['private', 'Private to namespace'], ['shared', 'Shared across organization']] as const).map(([v, lbl]) => (
            <label key={v} style={{ display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer', color: '#E8E8E8', fontSize: 13 }}>
              <input type="radio" name="visibility" checked={form.visibility === v} onChange={() => set('visibility', v)} />
              {lbl}
            </label>
          ))}
        </div>
      </div>

      <div style={fieldGroup}>
        <label style={label}>Tags</label>
        <div style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
          <input
            style={{ ...input, flex: 1 }}
            placeholder="Add a tag…"
            value={tagInput}
            onChange={(e) => setTagInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addTag())}
          />
          <button type="button" style={{ ...btnSecondary, padding: '8px 14px' }} onClick={addTag}>Add</button>
        </div>
        <div>
          {form.tags.map((t) => (
            <span key={t} style={tagStyle}>
              {t}
              <span style={{ cursor: 'pointer', marginLeft: 2 }} onClick={() => set('tags', form.tags.filter((x) => x !== t))}>×</span>
            </span>
          ))}
        </div>
      </div>

      <div style={fieldGroup}>
        <label style={label}>Owner</label>
        <input style={input} value={form.owner} onChange={(e) => set('owner', e.target.value)} />
      </div>

      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', ...fieldGroup }}>
        <div>
          <div style={{ fontSize: 13, fontWeight: 600, color: '#e0e0e0' }}>Require Approval</div>
          <div style={{ fontSize: 12, color: '#888' }}>Registration must be approved by a namespace admin</div>
        </div>
        <ToggleButton on={form.requireApproval} onToggle={() => set('requireApproval', !form.requireApproval)} />
      </div>
    </>
  );

  // Step 7 — Review
  const sourceName = sources.find((s) => s.id === form.source)?.name ?? '—';

  const getAgentDisplay = (): string => {
    if (form.source === 'foundry') return form.foundryAgents.join(', ') || '—';
    if (form.source === 'bedrock') return form.bedrockDisplayName || form.bedrockAgentId || '—';
    if (form.source === 'vertex') return form.vertexDisplayName || form.vertexAgentId || '—';
    if (form.source === 'a2a') return form.a2aName || '—';
    if (form.source === 'rapi') return form.rapiDisplayName || '—';
    if (form.source === 'custom') return form.customDisplayName || '—';
    return '—';
  };

  const getEndpointDisplay = (): string => {
    if (form.source === 'foundry') return `Foundry: ${form.foundryProject}`;
    if (form.source === 'bedrock') return `Bedrock: ${form.awsRegion} / ${form.bedrockAgentId}`;
    if (form.source === 'vertex') return `Vertex: ${form.vertexRegion} / ${form.vertexAgentId}`;
    if (form.source === 'a2a') return form.a2aCardUrl || '—';
    if (form.source === 'rapi') return form.rapiEndpoint || '—';
    if (form.source === 'custom') return form.customEndpoint || '—';
    return '—';
  };

  const modelCount = form.allowAllModels ? 'All in namespace' : `${form.selectedModels.length} selected`;
  const toolCount = form.allowAllTools ? 'All in namespace' : `${form.selectedTools.length} selected`;

  const enabledPolicies = [
    'Rate Limiting',
    'Token Quota',
    form.contentSafety && 'Content Safety',
    'Tool Invocation Limits',
    'Session Governance',
    form.auditLogging && 'Audit Logging',
    'Failover Policy',
  ].filter(Boolean) as string[];

  const renderReviewStep = () => (
    <>
      <div style={title}>Review &amp; Register</div>
      <div style={subtitle}>Confirm the details below to register this agent for governance</div>

      <div style={reviewSection}>
        <div style={reviewLabel}>Source &amp; Agent</div>
        <div style={reviewValue}>
          <span style={badge('rgba(96,205,255,0.1)', '#60cdff')}>{sourceName}</span>
          <span style={{ marginLeft: 8 }}>{getAgentDisplay()}</span>
        </div>
      </div>

      <div style={reviewSection}>
        <div style={reviewLabel}>Endpoint</div>
        <div style={{ ...reviewValue, fontFamily: 'monospace', fontSize: 12, color: '#9cdcfe' }}>
          {getEndpointDisplay()}
        </div>
      </div>

      <div style={reviewSection}>
        <div style={reviewLabel}>Authentication</div>
        <div style={reviewValue}>
          <span style={badge('rgba(96,205,255,0.1)', '#60cdff')}>
            {form.authMethod === 'apikey' ? 'API Key' : form.authMethod === 'oauth2' ? 'OAuth 2.0' : form.authMethod === 'managed-identity' ? 'Managed Identity' : form.authMethod === 'entra-token' ? 'Entra ID Token' : 'None'}
          </span>
          {form.authMethod === 'apikey' && form.authApiKeyCredential && (
            <span style={{ marginLeft: 8, color: '#aaa', fontSize: 12 }}>Header: {form.authApiKeyHeader}, Credential: {form.authApiKeyCredential}</span>
          )}
          {form.authMethod === 'oauth2' && form.authOAuthTokenUrl && (
            <span style={{ marginLeft: 8, color: '#aaa', fontSize: 12 }}>Grant: {form.authOAuthGrantType}</span>
          )}
          {form.authMethod === 'managed-identity' && (
            <span style={{ marginLeft: 8, color: '#aaa', fontSize: 12 }}>{form.authManagedIdentityType}</span>
          )}
          {form.authMethod === 'entra-token' && form.authEntraTenantId && (
            <span style={{ marginLeft: 8, color: '#aaa', fontSize: 12 }}>Tenant: {form.authEntraTenantId}</span>
          )}
        </div>
      </div>

      <div style={reviewSection}>
        <div style={reviewLabel}>Model Bindings</div>
        <div style={reviewValue}>
          <span style={badge('rgba(96,205,255,0.1)', '#60cdff')}>{modelCount}</span>
          {!form.allowAllModels && form.selectedModels.length > 0 && (
            <span style={{ marginLeft: 8, color: '#aaa', fontSize: 12 }}>{form.selectedModels.join(', ')}</span>
          )}
        </div>
      </div>

      <div style={reviewSection}>
        <div style={reviewLabel}>Tool Bindings</div>
        <div style={reviewValue}>
          <span style={badge('rgba(96,205,255,0.1)', '#60cdff')}>{toolCount}</span>
          {!form.allowAllTools && form.selectedTools.length > 0 && (
            <span style={{ marginLeft: 8, color: '#aaa', fontSize: 12 }}>{form.selectedTools.join(', ')}</span>
          )}
        </div>
      </div>

      <div style={reviewSection}>
        <div style={reviewLabel}>Policies Enabled ({enabledPolicies.length})</div>
        <div style={reviewValue}>
          {enabledPolicies.map((p) => <span key={p} style={badge('rgba(96,205,255,0.1)', '#60cdff')}>{p}</span>)}
        </div>
      </div>

      <div style={reviewSection}>
        <div style={reviewLabel}>Namespace</div>
        <div style={reviewValue}>
          <span style={{ fontFamily: 'monospace', fontSize: 12, color: '#9cdcfe' }}>{form.namespace || '—'}</span>
          <span style={{ ...badge(form.visibility === 'shared' ? 'rgba(255,183,77,0.12)' : 'rgba(96,205,255,0.1)', form.visibility === 'shared' ? '#ffb74d' : '#60cdff'), marginLeft: 8 }}>
            {form.visibility === 'shared' ? 'Shared' : 'Private'}
          </span>
        </div>
        {form.tags.length > 0 && (
          <div style={{ marginTop: 8 }}>
            {form.tags.map((t) => <span key={t} style={tagStyle}>{t}</span>)}
          </div>
        )}
      </div>
    </>
  );

  return createPortal(
    <div style={overlay} onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div style={modal}>
        {/* Header */}
        <div style={headerBar}>
          <div style={{ fontSize: 15, fontWeight: 700, color: '#e0e0e0' }}>Register Agent for Governance</div>
          <button style={closeBtn} onClick={onClose} title="Close">✕</button>
        </div>

        {/* Step bar */}
        {renderStepBar()}

        {/* Body */}
        <div style={body}>
          {step === 1 && renderSourceStep()}
          {step === 2 && renderEndpointStep()}
          {step === 3 && renderAuthStep()}
          {step === 4 && renderBindingsStep()}
          {step === 5 && renderPoliciesStep()}
          {step === 6 && renderNamespaceStep()}
          {step === 7 && renderReviewStep()}
        </div>

        {/* Footer */}
        <div style={footer}>
          <button
            style={btnSecondary}
            onClick={() => step === 1 ? onClose() : setStep(step - 1)}
          >
            {step === 1 ? 'Cancel' : 'Back'}
          </button>
          {step < totalSteps ? (
            <button
              style={{ ...btnPrimary, opacity: canNext() ? 1 : 0.4, cursor: canNext() ? 'pointer' : 'not-allowed' }}
              disabled={!canNext()}
              onClick={() => canNext() && setStep(step + 1)}
            >
              Next
            </button>
          ) : (
            <button style={btnPrimary} onClick={onComplete}>
              Register Agent
            </button>
          )}
        </div>
      </div>
    </div>,
    document.body
  );
}

export default RegisterAgent;
