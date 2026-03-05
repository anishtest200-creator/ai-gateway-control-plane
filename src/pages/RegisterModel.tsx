import { useState } from 'react';
import { createPortal } from 'react-dom';
import type { CSSProperties } from 'react';
import InlineCredentialForm from '../components/InlineCredentialForm';

// --- Types ---
type Source = 'foundry' | 'bedrock' | 'vertex' | 'openai' | 'anthropic' | 'custom';
type Priority = 'primary' | 'failover' | 'loadbalance';

interface FormData {
  source: Source | null;
  // Foundry
  foundryProject: string;
  foundryModels: string[];
  // Bedrock
  awsRegion: string;
  bedrockModelId: string;
  bedrockDisplayName: string;
  bedrockCredential: string;
  // Vertex
  gcpProjectId: string;
  vertexRegion: string;
  vertexModel: string;
  vertexCredential: string;
  // OpenAI
  openaiModel: string;
  openaiBaseUrl: string;
  openaiCredential: string;
  // Anthropic
  anthropicModel: string;
  anthropicBaseUrl: string;
  anthropicCredential: string;
  // Custom
  customDisplayName: string;
  customBaseUrl: string;
  customModelId: string;
  customApiFormat: string;
  customCredential: string;
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
  // Routing
  priority: Priority;
  failoverFrom: string;
  loadBalanceWeight: number;
  healthCheck: boolean;
  healthCheckInterval: string;
  // Policies
  rateLimiting: boolean;
  rateLimit: number;
  tokenQuota: boolean;
  tokenQuotaLimit: number;
  contentSafety: boolean;
  contentSafetyLevel: string;
  promptScanning: boolean;
  responseScanning: boolean;
  piiDetection: boolean;
  accessControl: boolean;
  allowedConsumers: string[];
  auditLogging: boolean;
  logPrompts: boolean;
  logResponses: boolean;
  logTokens: boolean;
  costTracking: boolean;
  costPerPrompt: string;
  costPerCompletion: string;
  // Namespace
  namespace: string;
  visibility: 'private' | 'shared';
  tags: string[];
  owner: string;
}

const initialFormData: FormData = {
  source: null,
  foundryProject: '',
  foundryModels: [],
  awsRegion: 'us-east-1',
  bedrockModelId: '',
  bedrockDisplayName: '',
  bedrockCredential: '',
  gcpProjectId: '',
  vertexRegion: 'us-central1',
  vertexModel: 'gemini-1.5-pro',
  vertexCredential: '',
  openaiModel: 'gpt-4o',
  openaiBaseUrl: 'https://api.openai.com/v1',
  openaiCredential: '',
  anthropicModel: 'claude-3.5-sonnet',
  anthropicBaseUrl: 'https://api.anthropic.com',
  anthropicCredential: '',
  customDisplayName: '',
  customBaseUrl: '',
  customModelId: '',
  customApiFormat: 'openai-compatible',
  customCredential: '',
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
  priority: 'primary',
  failoverFrom: '',
  loadBalanceWeight: 50,
  healthCheck: true,
  healthCheckInterval: '30s',
  rateLimiting: true,
  rateLimit: 100,
  tokenQuota: false,
  tokenQuotaLimit: 1000000,
  contentSafety: false,
  contentSafetyLevel: 'Medium',
  promptScanning: true,
  responseScanning: true,
  piiDetection: true,
  accessControl: false,
  allowedConsumers: [],
  auditLogging: true,
  logPrompts: true,
  logResponses: true,
  logTokens: true,
  costTracking: true,
  costPerPrompt: '0.005',
  costPerCompletion: '0.015',
  namespace: '',
  visibility: 'private',
  tags: [],
  owner: 'anishta@contoso.com',
};

// --- Shared style helpers (matching Assets.tsx dark theme) ---
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
  backgroundColor: '#60cdff',
  color: '#000',
  fontSize: 13,
  fontWeight: 600,
  cursor: 'pointer',
  fontFamily: 'inherit',
};

const btnSecondary: CSSProperties = {
  ...btnPrimary,
  backgroundColor: '#2a2a2a',
  color: '#ccc',
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
  color: '#ccc',
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

// --- Sources config ---
const sources: { id: Source; name: string; desc: string; sub: string; icon: string; accent: string }[] = [
  { id: 'foundry', name: 'Azure AI Foundry', desc: 'Import from your Foundry project', sub: 'Auto-discover models from connected Foundry projects', icon: '◆', accent: '#4fc3f7' },
  { id: 'bedrock', name: 'AWS Bedrock', desc: 'Register a Bedrock model endpoint', sub: 'Claude, Titan, Llama, Mistral via Bedrock', icon: '▲', accent: '#ff9800' },
  { id: 'vertex', name: 'Google Vertex AI', desc: 'Register a Vertex AI endpoint', sub: 'Gemini, PaLM via Vertex AI', icon: '▷', accent: '#66bb6a' },
  { id: 'openai', name: 'OpenAI', desc: 'Register an OpenAI API model', sub: 'Direct OpenAI API access', icon: '◎', accent: '#e0e0e0' },
  { id: 'anthropic', name: 'Anthropic', desc: 'Register an Anthropic API model', sub: 'Direct Anthropic Messages API', icon: '◈', accent: '#ffb74d' },
  { id: 'custom', name: 'Self-Hosted / Custom', desc: 'Register any OpenAI-compatible endpoint', sub: 'vLLM, Ollama, TGI, or any compatible API', icon: '▣', accent: '#888' },
];

const credentialOptions = ['prod-azure-key', 'dev-azure-key', 'bedrock-iam-role', 'gcp-service-acct', 'openai-org-key', 'anthropic-team-key'];
const existingModels = ['gpt-4o (East US)', 'gpt-4o-mini (East US)', 'claude-3.5-sonnet', 'gemini-1.5-pro'];
const consumers = ['retail-support-agent', 'finance-analyst', 'hr-assistant', 'dev-copilot', 'data-pipeline', 'qa-bot'];
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
function RegisterModel({ onClose, onComplete }: { onClose: () => void; onComplete: () => void }) {
  const [step, setStep] = useState(1);
  const [form, setForm] = useState<FormData>(initialFormData);
  const [tagInput, setTagInput] = useState('');
  const [showInlineCred, setShowInlineCred] = useState<string | null>(null);
  const [dynamicCredentials, setDynamicCredentials] = useState<string[]>([]);
  const allCredentialOptions = [...credentialOptions, ...dynamicCredentials];

  const totalSteps = 7;
  const canNext = (): boolean => {
    if (step === 1) return form.source !== null;
    if (step === 2) {
      if (form.source === 'foundry') return form.foundryProject !== '' && form.foundryModels.length > 0;
      if (form.source === 'bedrock') return form.bedrockModelId !== '' && form.bedrockDisplayName !== '';
      if (form.source === 'vertex') return form.gcpProjectId !== '';
      if (form.source === 'openai') return form.openaiCredential !== '';
      if (form.source === 'anthropic') return form.anthropicCredential !== '';
      if (form.source === 'custom') return form.customDisplayName !== '' && form.customBaseUrl !== '';
    }
    if (step === 3) return form.authMethod !== 'none' ? (form.authMethod === 'apikey' ? form.authApiKeyCredential !== '' : true) : true;
    if (step === 6) return form.namespace !== '';
    return true;
  };

  const set = <K extends keyof FormData>(key: K, val: FormData[K]) =>
    setForm((prev) => ({ ...prev, [key]: val }));

  const toggleArrayItem = (key: 'foundryModels' | 'allowedConsumers', item: string) => {
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

  const stepLabels = ['Source', 'Endpoint', 'Auth', 'Routing', 'Governance', 'Namespace', 'Review'];

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

  // Step 1
  const renderSourceStep = () => (
    <>
      <div style={title}>Where is this model hosted?</div>
      <div style={subtitle}>Select the provider or platform where the model is already running</div>
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

  // Step 2
  const renderEndpointStep = () => {
    const credSelect = (key: 'bedrockCredential' | 'vertexCredential' | 'openaiCredential' | 'anthropicCredential' | 'customCredential', allowNone = false) => (
      <div style={fieldGroup}>
        <label style={label}>Credential</label>
        <select style={select} value={form[key]} onChange={(e) => {
          const val = e.target.value;
          if (val === '__new') { setShowInlineCred(key); } else { set(key, val); }
        }}>
          <option value="">Select credential…</option>
          {allowNone && <option value="none">None</option>}
          {allCredentialOptions.map((c) => <option key={c} value={c}>{c}</option>)}
          <option value="__new">+ Add new credential</option>
        </select>
        {showInlineCred === key && (
          <InlineCredentialForm
            onSave={(name) => { setDynamicCredentials(prev => [...prev, name]); set(key, name); setShowInlineCred(null); }}
            onCancel={() => { set(key, '' as FormData[typeof key]); setShowInlineCred(null); }}
          />
        )}
      </div>
    );

    return (
      <>
        <div style={title}>Configure model endpoint</div>
        <div style={subtitle}>
          Provide connection details for the existing model — the gateway will proxy traffic through this endpoint
        </div>

        {form.source === 'foundry' && (
          <>
            <div style={fieldGroup}>
              <label style={label}>Foundry Project</label>
              <select style={select} value={form.foundryProject} onChange={(e) => set('foundryProject', e.target.value)}>
                <option value="">Select Foundry project…</option>
                <option value="contoso-ai-prod">contoso-ai-prod</option>
                <option value="contoso-ai-dev">contoso-ai-dev</option>
                <option value="retail-ai">retail-ai</option>
              </select>
            </div>
            {form.foundryProject && (
              <div style={fieldGroup}>
                <label style={label}>Discovered Models</label>
                <div style={{ backgroundColor: '#1a1a1a', border: '1px solid #333', borderRadius: 6, padding: 8 }}>
                  {['gpt-4o (East US)', 'gpt-4o-mini (East US)', 'gpt-4o (West US)'].map((m) => (
                    <label key={m} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '6px 8px', cursor: 'pointer', color: '#ccc', fontSize: 13 }}>
                      <input
                        type="checkbox"
                        checked={form.foundryModels.includes(m)}
                        onChange={() => toggleArrayItem('foundryModels', m)}
                      />
                      {m}
                    </label>
                  ))}
                </div>
              </div>
            )}
          </>
        )}

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
              <label style={label}>Model ID</label>
              <input style={input} placeholder="anthropic.claude-3-sonnet-20240229-v1:0" value={form.bedrockModelId} onChange={(e) => set('bedrockModelId', e.target.value)} />
            </div>
            <div style={fieldGroup}>
              <label style={label}>Display Name</label>
              <input style={input} value={form.bedrockDisplayName} onChange={(e) => set('bedrockDisplayName', e.target.value)} />
            </div>
            {credSelect('bedrockCredential')}
          </>
        )}

        {form.source === 'vertex' && (
          <>
            <div style={fieldGroup}>
              <label style={label}>GCP Project ID</label>
              <input style={input} placeholder="my-gcp-project-id" value={form.gcpProjectId} onChange={(e) => set('gcpProjectId', e.target.value)} />
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
              <label style={label}>Model</label>
              <select style={select} value={form.vertexModel} onChange={(e) => set('vertexModel', e.target.value)}>
                <option value="gemini-1.5-pro">gemini-1.5-pro</option>
                <option value="gemini-1.5-flash">gemini-1.5-flash</option>
                <option value="gemini-1.0-pro">gemini-1.0-pro</option>
              </select>
            </div>
            {credSelect('vertexCredential')}
          </>
        )}

        {form.source === 'openai' && (
          <>
            <div style={fieldGroup}>
              <label style={label}>Model</label>
              <select style={select} value={form.openaiModel} onChange={(e) => set('openaiModel', e.target.value)}>
                {['gpt-4o', 'gpt-4o-mini', 'gpt-4-turbo', 'gpt-3.5-turbo', 'o1-preview', 'o1-mini'].map((m) => (
                  <option key={m} value={m}>{m}</option>
                ))}
              </select>
            </div>
            <div style={fieldGroup}>
              <label style={label}>API Base URL</label>
              <input style={input} value={form.openaiBaseUrl} onChange={(e) => set('openaiBaseUrl', e.target.value)} />
            </div>
            {credSelect('openaiCredential')}
          </>
        )}

        {form.source === 'anthropic' && (
          <>
            <div style={fieldGroup}>
              <label style={label}>Model</label>
              <select style={select} value={form.anthropicModel} onChange={(e) => set('anthropicModel', e.target.value)}>
                {['claude-3.5-sonnet', 'claude-3-opus', 'claude-3-haiku', 'claude-3.5-haiku'].map((m) => (
                  <option key={m} value={m}>{m}</option>
                ))}
              </select>
            </div>
            <div style={fieldGroup}>
              <label style={label}>API Base URL</label>
              <input style={input} value={form.anthropicBaseUrl} onChange={(e) => set('anthropicBaseUrl', e.target.value)} />
            </div>
            {credSelect('anthropicCredential')}
          </>
        )}

        {form.source === 'custom' && (
          <>
            <div style={fieldGroup}>
              <label style={label}>Display Name</label>
              <input style={input} value={form.customDisplayName} onChange={(e) => set('customDisplayName', e.target.value)} />
            </div>
            <div style={fieldGroup}>
              <label style={label}>API Base URL</label>
              <input style={input} placeholder="https://my-vllm.internal:8000/v1" value={form.customBaseUrl} onChange={(e) => set('customBaseUrl', e.target.value)} />
            </div>
            <div style={fieldGroup}>
              <label style={label}>Model ID</label>
              <input style={input} value={form.customModelId} onChange={(e) => set('customModelId', e.target.value)} />
            </div>
            <div style={fieldGroup}>
              <label style={label}>API Format</label>
              <select style={select} value={form.customApiFormat} onChange={(e) => set('customApiFormat', e.target.value)}>
                <option value="openai-compatible">OpenAI-compatible</option>
                <option value="custom">Custom</option>
              </select>
            </div>
            {credSelect('customCredential', true)}
          </>
        )}
      </>
    );
  };

  // Step 3 — Authentication
  const authMethodLabels: Record<FormData['authMethod'], string> = {
    apikey: 'API Key',
    oauth2: 'OAuth 2.0',
    'managed-identity': 'Managed Identity',
    'entra-token': 'Entra ID Token',
    none: 'None',
  };

  const renderAuthStep = () => (
    <>
      <div style={title}>Configure authentication</div>
      <div style={subtitle}>Define how the gateway authenticates with the upstream model endpoint</div>

      <div style={fieldGroup}>
        <label style={label}>Auth Method</label>
        <select style={select} value={form.authMethod} onChange={(e) => set('authMethod', e.target.value as FormData['authMethod'])}>
          <option value="apikey">API Key</option>
          <option value="oauth2">OAuth 2.0</option>
          <option value="managed-identity">Managed Identity</option>
          <option value="entra-token">Entra ID Token</option>
          <option value="none">None</option>
        </select>
      </div>

      {form.authMethod === 'apikey' && (
        <>
          <div style={fieldGroup}>
            <label style={label}>Header Name</label>
            <input style={input} value={form.authApiKeyHeader} onChange={(e) => set('authApiKeyHeader', e.target.value)} placeholder="Authorization" />
          </div>
          <div style={fieldGroup}>
            <label style={label}>Credential</label>
            <select style={select} value={form.authApiKeyCredential} onChange={(e) => {
              const val = e.target.value;
              if (val === '__new') { setShowInlineCred('authApiKeyCredential'); } else { set('authApiKeyCredential', val); }
            }}>
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

      {form.authMethod === 'oauth2' && (
        <>
          <div style={fieldGroup}>
            <label style={label}>Token URL</label>
            <input style={input} value={form.authOAuthTokenUrl} onChange={(e) => set('authOAuthTokenUrl', e.target.value)} placeholder="https://login.microsoftonline.com/{tenant}/oauth2/v2.0/token" />
          </div>
          <div style={fieldGroup}>
            <label style={label}>Client ID Credential</label>
            <select style={select} value={form.authOAuthClientId} onChange={(e) => {
              const val = e.target.value;
              if (val === '__new') { setShowInlineCred('authOAuthClientId'); } else { set('authOAuthClientId', val); }
            }}>
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
            <input style={input} value={form.authOAuthScopes} onChange={(e) => set('authOAuthScopes', e.target.value)} placeholder="https://cognitiveservices.azure.com/.default" />
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
            <input style={input} value={form.authManagedIdentityResource} onChange={(e) => set('authManagedIdentityResource', e.target.value)} placeholder="https://cognitiveservices.azure.com" />
          </div>
        </>
      )}

      {form.authMethod === 'entra-token' && (
        <>
          <div style={fieldGroup}>
            <label style={label}>Tenant ID</label>
            <input style={input} value={form.authEntraTenantId} onChange={(e) => set('authEntraTenantId', e.target.value)} placeholder="xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx" />
          </div>
          <div style={fieldGroup}>
            <label style={label}>Resource / Audience</label>
            <input style={input} value={form.authEntraResource} onChange={(e) => set('authEntraResource', e.target.value)} placeholder="https://cognitiveservices.azure.com" />
          </div>
        </>
      )}

      {form.authMethod === 'none' && (
        <div style={{ backgroundColor: '#1a1a1a', border: '1px solid #333', borderRadius: 8, padding: '14px 18px', color: '#888', fontSize: 13 }}>
          No authentication will be configured. The gateway will forward requests to the upstream endpoint without injecting any credentials.
        </div>
      )}

      <div style={{ marginTop: 20, backgroundColor: 'rgba(96,205,255,0.06)', border: '1px solid rgba(96,205,255,0.2)', borderRadius: 8, padding: '12px 16px', fontSize: 13, color: '#8dd6ff' }}>
        🔒 Credential mediation — The gateway will inject credentials on every request. Consumers never see the upstream credentials.
      </div>
    </>
  );

  // Step 4
  const renderRoutingStep = () => (
    <>
      <div style={title}>Configure routing rules</div>
      <div style={subtitle}>Define how the gateway routes traffic to this model endpoint</div>

      <div style={fieldGroup}>
        <label style={label}>Priority</label>
        <select style={select} value={form.priority} onChange={(e) => set('priority', e.target.value as Priority)}>
          <option value="primary">Primary</option>
          <option value="failover">Failover</option>
          <option value="loadbalance">Load Balance</option>
        </select>
      </div>

      {form.priority === 'failover' && (
        <div style={fieldGroup}>
          <label style={label}>Failover From</label>
          <select style={select} value={form.failoverFrom} onChange={(e) => set('failoverFrom', e.target.value)}>
            <option value="">Select primary model…</option>
            {existingModels.map((m) => <option key={m} value={m}>{m}</option>)}
          </select>
        </div>
      )}

      {form.priority === 'loadbalance' && (
        <div style={fieldGroup}>
          <label style={label}>Weight — {form.loadBalanceWeight}%</label>
          <input
            type="range"
            min={0}
            max={100}
            value={form.loadBalanceWeight}
            onChange={(e) => set('loadBalanceWeight', Number(e.target.value))}
            style={{ width: '100%', accentColor: '#60cdff' }}
          />
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: '#666' }}>
            <span>0%</span><span>100%</span>
          </div>
        </div>
      )}

      <div style={{ ...fieldGroup, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <div style={{ fontSize: 13, fontWeight: 600, color: '#e0e0e0' }}>Health Check</div>
          <div style={{ fontSize: 12, color: '#888' }}>Periodically verify endpoint availability</div>
        </div>
        <ToggleButton on={form.healthCheck} onToggle={() => set('healthCheck', !form.healthCheck)} />
      </div>

      {form.healthCheck && (
        <div style={fieldGroup}>
          <label style={label}>Health Check Interval</label>
          <select style={select} value={form.healthCheckInterval} onChange={(e) => set('healthCheckInterval', e.target.value)}>
            <option value="15s">15 seconds</option>
            <option value="30s">30 seconds</option>
            <option value="60s">60 seconds</option>
          </select>
        </div>
      )}
    </>
  );

  // Step 4
  const renderPoliciesStep = () => (
    <>
      <div style={title}>Apply governance policies</div>
      <div style={subtitle}>Configure the policies that will govern traffic to this model</div>

      {/* Rate Limiting */}
      <div style={policyCard(form.rateLimiting)}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <div style={{ fontSize: 14, fontWeight: 600, color: '#fff' }}>Rate Limiting</div>
            <div style={{ fontSize: 12, color: '#888' }}>Limit requests per minute per consumer</div>
          </div>
          <ToggleButton on={form.rateLimiting} onToggle={() => set('rateLimiting', !form.rateLimiting)} />
        </div>
        {form.rateLimiting && (
          <div style={{ marginTop: 12 }}>
            <label style={label}>Requests per minute</label>
            <input style={{ ...input, width: 120 }} type="number" value={form.rateLimit} onChange={(e) => set('rateLimit', Number(e.target.value))} />
          </div>
        )}
      </div>

      {/* Token Quota */}
      <div style={policyCard(form.tokenQuota)}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <div style={{ fontSize: 14, fontWeight: 600, color: '#fff' }}>Token Quota</div>
            <div style={{ fontSize: 12, color: '#888' }}>Daily token consumption limit</div>
          </div>
          <ToggleButton on={form.tokenQuota} onToggle={() => set('tokenQuota', !form.tokenQuota)} />
        </div>
        {form.tokenQuota && (
          <div style={{ marginTop: 12 }}>
            <label style={label}>Tokens per day</label>
            <input style={{ ...input, width: 160 }} type="number" value={form.tokenQuotaLimit} onChange={(e) => set('tokenQuotaLimit', Number(e.target.value))} />
          </div>
        )}
      </div>

      {/* Content Safety */}
      <div style={policyCard(form.contentSafety)}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <div style={{ fontSize: 14, fontWeight: 600, color: '#fff' }}>Content Safety</div>
            <div style={{ fontSize: 12, color: '#888' }}>Scan prompts and responses for harmful content</div>
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
              <option value="Custom">Custom</option>
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
              <input type="checkbox" checked={form.piiDetection} onChange={() => set('piiDetection', !form.piiDetection)} />
              PII detection
            </div>
          </div>
        )}
      </div>

      {/* Access Control */}
      <div style={policyCard(form.accessControl)}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <div style={{ fontSize: 14, fontWeight: 600, color: '#fff' }}>Access Control</div>
            <div style={{ fontSize: 12, color: '#888' }}>Restrict which consumers can access this model</div>
          </div>
          <ToggleButton on={form.accessControl} onToggle={() => set('accessControl', !form.accessControl)} />
        </div>
        {form.accessControl && (
          <div style={{ marginTop: 12 }}>
            <label style={label}>Allowed Consumers</label>
            <div style={{ backgroundColor: '#1a1a1a', border: '1px solid #333', borderRadius: 6, padding: 8, maxHeight: 150, overflowY: 'auto' }}>
              {consumers.map((c) => (
                <label key={c} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '4px 8px', cursor: 'pointer', color: '#ccc', fontSize: 13 }}>
                  <input type="checkbox" checked={form.allowedConsumers.includes(c)} onChange={() => toggleArrayItem('allowedConsumers', c)} />
                  {c}
                </label>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Audit Logging */}
      <div style={policyCard(form.auditLogging)}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <div style={{ fontSize: 14, fontWeight: 600, color: '#fff' }}>Audit Logging</div>
            <div style={{ fontSize: 12, color: '#888' }}>Log all requests for compliance and debugging</div>
          </div>
          <ToggleButton on={form.auditLogging} onToggle={() => set('auditLogging', !form.auditLogging)} />
        </div>
        {form.auditLogging && (
          <div style={{ marginTop: 8 }}>
            <div style={checkRow}>
              <input type="checkbox" checked={form.logPrompts} onChange={() => set('logPrompts', !form.logPrompts)} />
              Log prompts
            </div>
            <div style={checkRow}>
              <input type="checkbox" checked={form.logResponses} onChange={() => set('logResponses', !form.logResponses)} />
              Log responses
            </div>
            <div style={checkRow}>
              <input type="checkbox" checked={form.logTokens} onChange={() => set('logTokens', !form.logTokens)} />
              Log tokens
            </div>
          </div>
        )}
      </div>

      {/* Cost Tracking */}
      <div style={policyCard(form.costTracking)}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <div style={{ fontSize: 14, fontWeight: 600, color: '#fff' }}>Cost Tracking</div>
            <div style={{ fontSize: 12, color: '#888' }}>Track per-request cost based on token usage</div>
          </div>
          <ToggleButton on={form.costTracking} onToggle={() => set('costTracking', !form.costTracking)} />
        </div>
        {form.costTracking && (
          <div style={{ marginTop: 12, display: 'flex', gap: 16 }}>
            <div style={{ flex: 1 }}>
              <label style={label}>Cost per 1K prompt tokens ($)</label>
              <input style={input} value={form.costPerPrompt} onChange={(e) => set('costPerPrompt', e.target.value)} />
            </div>
            <div style={{ flex: 1 }}>
              <label style={label}>Cost per 1K completion tokens ($)</label>
              <input style={input} value={form.costPerCompletion} onChange={(e) => set('costPerCompletion', e.target.value)} />
            </div>
          </div>
        )}
      </div>
    </>
  );

  // Step 5
  const renderNamespaceStep = () => (
    <>
      <div style={title}>Assign to namespace</div>
      <div style={subtitle}>Organize this model within a governance namespace</div>

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
            <label key={v} style={{ display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer', color: '#ccc', fontSize: 13 }}>
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
    </>
  );

  // Step 6
  const getModelDisplay = (): string => {
    if (form.source === 'foundry') return form.foundryModels.join(', ') || '—';
    if (form.source === 'bedrock') return form.bedrockDisplayName || form.bedrockModelId || '—';
    if (form.source === 'vertex') return form.vertexModel;
    if (form.source === 'openai') return form.openaiModel;
    if (form.source === 'anthropic') return form.anthropicModel;
    if (form.source === 'custom') return form.customDisplayName || '—';
    return '—';
  };

  const getEndpointDisplay = (): string => {
    if (form.source === 'foundry') return `Foundry: ${form.foundryProject}`;
    if (form.source === 'bedrock') return `Bedrock: ${form.awsRegion}`;
    if (form.source === 'vertex') return `Vertex: ${form.vertexRegion}`;
    if (form.source === 'openai') return form.openaiBaseUrl;
    if (form.source === 'anthropic') return form.anthropicBaseUrl;
    if (form.source === 'custom') return form.customBaseUrl || '—';
    return '—';
  };

  const enabledPolicies = [
    form.rateLimiting && 'Rate Limiting',
    form.tokenQuota && 'Token Quota',
    form.contentSafety && 'Content Safety',
    form.accessControl && 'Access Control',
    form.auditLogging && 'Audit Logging',
    form.costTracking && 'Cost Tracking',
  ].filter(Boolean) as string[];

  const sourceName = sources.find((s) => s.id === form.source)?.name ?? '—';

  const renderReviewStep = () => (
    <>
      <div style={title}>Review registration</div>
      <div style={subtitle}>Confirm the details below to register this model for governance</div>

      <div style={reviewSection}>
        <div style={reviewLabel}>Source &amp; Model</div>
        <div style={reviewValue}>
          <span style={badge('rgba(96,205,255,0.1)', '#60cdff')}>{sourceName}</span>
          <span style={{ marginLeft: 8 }}>{getModelDisplay()}</span>
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
          <span style={badge('rgba(96,205,255,0.1)', '#60cdff')}>{authMethodLabels[form.authMethod]}</span>
          {form.authMethod === 'apikey' && form.authApiKeyCredential && (
            <span style={{ marginLeft: 8, color: '#aaa', fontSize: 12 }}>Header: {form.authApiKeyHeader} · Credential: {form.authApiKeyCredential}</span>
          )}
          {form.authMethod === 'oauth2' && (
            <span style={{ marginLeft: 8, color: '#aaa', fontSize: 12 }}>Grant: {form.authOAuthGrantType}{form.authOAuthTokenUrl ? ` · ${form.authOAuthTokenUrl}` : ''}</span>
          )}
          {form.authMethod === 'managed-identity' && (
            <span style={{ marginLeft: 8, color: '#aaa', fontSize: 12 }}>{form.authManagedIdentityType}{form.authManagedIdentityResource ? ` · ${form.authManagedIdentityResource}` : ''}</span>
          )}
          {form.authMethod === 'entra-token' && (
            <span style={{ marginLeft: 8, color: '#aaa', fontSize: 12 }}>Tenant: {form.authEntraTenantId || '—'}{form.authEntraResource ? ` · ${form.authEntraResource}` : ''}</span>
          )}
        </div>
      </div>

      <div style={reviewSection}>
        <div style={reviewLabel}>Routing</div>
        <div style={reviewValue}>
          <span style={badge(
            form.priority === 'primary' ? 'rgba(96,205,255,0.1)' : 'rgba(255,183,77,0.12)',
            form.priority === 'primary' ? '#60cdff' : '#ffb74d',
          )}>
            {form.priority === 'loadbalance' ? `Load Balance (${form.loadBalanceWeight}%)` : form.priority.charAt(0).toUpperCase() + form.priority.slice(1)}
          </span>
          {form.priority === 'failover' && form.failoverFrom && (
            <span style={{ marginLeft: 8, color: '#aaa', fontSize: 12 }}>from {form.failoverFrom}</span>
          )}
          {form.healthCheck && <span style={{ ...badge('rgba(14,147,73,0.15)', '#4caf50'), marginLeft: 8 }}>Health check {form.healthCheckInterval}</span>}
        </div>
      </div>

      <div style={reviewSection}>
        <div style={reviewLabel}>Policies Enabled ({enabledPolicies.length})</div>
        <div style={reviewValue}>
          {enabledPolicies.map((p) => <span key={p} style={badge('rgba(96,205,255,0.1)', '#60cdff')}>{p}</span>)}
          {enabledPolicies.length === 0 && <span style={{ color: '#666' }}>None</span>}
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
          <div style={{ fontSize: 15, fontWeight: 700, color: '#e0e0e0' }}>Register Model for Governance</div>
          <button style={closeBtn} onClick={onClose} title="Close">✕</button>
        </div>

        {/* Step bar */}
        {renderStepBar()}

        {/* Body */}
        <div style={body}>
          {step === 1 && renderSourceStep()}
          {step === 2 && renderEndpointStep()}
          {step === 3 && renderAuthStep()}
          {step === 4 && renderRoutingStep()}
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
              Register Model
            </button>
          )}
        </div>
      </div>
    </div>,
    document.body
  );
}

export default RegisterModel;
