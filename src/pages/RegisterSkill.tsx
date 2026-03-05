import { useState } from 'react';
import { createPortal } from 'react-dom';
import type { CSSProperties } from 'react';
import InlineCredentialForm from '../components/InlineCredentialForm';
import ConnectFoundryPanel from '../components/ConnectFoundryPanel';

// --- Types ---
type SkillSource = 'promptflow' | 'semantic-kernel' | 'langchain' | 'foundry' | 'custom';
type SkillCategory = 'analytics' | 'nlp' | 'vision' | 'code' | 'data' | 'orchestration';
type AuthMethod = 'none' | 'apikey' | 'oauth2' | 'managed-identity' | 'entra-token';
type DataClassification = 'public' | 'internal' | 'confidential' | 'restricted';

interface FormData {
  source: SkillSource | null;
  // Prompt Flow
  promptFlowEndpoint: string;
  promptFlowDeployment: string;
  promptFlowProject: string;
  // Semantic Kernel
  skPluginName: string;
  skPluginUrl: string;
  skFunctions: string[];
  // LangChain
  langchainEndpoint: string;
  langchainChainType: string;
  langchainDisplayName: string;
  // Foundry
  foundryProject: string;
  foundrySkills: string[];
  // Custom
  customDisplayName: string;
  customEndpoint: string;
  customDescription: string;
  customInputSchema: string;
  customOutputSchema: string;
  // Category & Definition
  category: SkillCategory | null;
  displayName: string;
  description: string;
  version: string;
  // Model bindings
  selectedModels: string[];
  allowAllModels: boolean;
  // Tool bindings
  selectedTools: string[];
  allowAllTools: boolean;
  // Auth
  authMethod: AuthMethod;
  authApiKeyHeader: string;
  authApiKeyCredential: string;
  authOAuthTokenUrl: string;
  authOAuthClientId: string;
  authOAuthScopes: string;
  authManagedIdentityResource: string;
  authEntraTenantId: string;
  authEntraResource: string;
  // Governance
  rateLimiting: boolean;
  rateLimit: number;
  executionAuditing: boolean;
  logInputs: boolean;
  logOutputs: boolean;
  logLatency: boolean;
  dataClassification: DataClassification;
  piiScanning: boolean;
  maxExecutionTime: number;
  costTracking: boolean;
  costPerExecution: string;
  // Namespace
  namespace: string;
  visibility: 'private' | 'shared' | 'public';
  tags: string[];
  owner: string;
  approvalRequired: boolean;
}

const initialFormData: FormData = {
  source: null,
  promptFlowEndpoint: '',
  promptFlowDeployment: '',
  promptFlowProject: '',
  skPluginName: '',
  skPluginUrl: '',
  skFunctions: [],
  langchainEndpoint: '',
  langchainChainType: 'QA',
  langchainDisplayName: '',
  foundryProject: '',
  foundrySkills: ['customer-sentiment', 'doc-summarizer'],
  customDisplayName: '',
  customEndpoint: '',
  customDescription: '',
  customInputSchema: '',
  customOutputSchema: '',
  category: null,
  displayName: '',
  description: '',
  version: '1.0.0',
  selectedModels: ['gpt-4o', 'claude-3.5-sonnet'],
  allowAllModels: false,
  selectedTools: ['salesforce-crm', 'order-lookup'],
  allowAllTools: false,
  authMethod: 'none',
  authApiKeyHeader: 'Authorization',
  authApiKeyCredential: '',
  authOAuthTokenUrl: '',
  authOAuthClientId: '',
  authOAuthScopes: '',
  authManagedIdentityResource: '',
  authEntraTenantId: '',
  authEntraResource: '',
  rateLimiting: true,
  rateLimit: 60,
  executionAuditing: true,
  logInputs: true,
  logOutputs: true,
  logLatency: true,
  dataClassification: 'internal',
  piiScanning: false,
  maxExecutionTime: 30,
  costTracking: false,
  costPerExecution: '',
  namespace: '',
  visibility: 'private',
  tags: [],
  owner: 'anishta@contoso.com',
  approvalRequired: false,
};

// --- Shared style helpers (matching RegisterAgent.tsx dark theme) ---
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
const sources: { id: SkillSource; name: string; desc: string; sub: string; icon: string; accent: string }[] = [
  { id: 'promptflow', name: 'Azure Prompt Flow', desc: 'Import from Prompt Flow deployments', sub: 'Pre-built flows from Azure AI Foundry', icon: '⚡', accent: '#4fc3f7' },
  { id: 'semantic-kernel', name: 'Semantic Kernel', desc: 'Register a Semantic Kernel plugin', sub: 'Native or remote SK plugins and functions', icon: '⬡', accent: '#ab47bc' },
  { id: 'langchain', name: 'LangChain', desc: 'Register a LangChain chain/agent', sub: 'LangServe or custom LangChain deployments', icon: '🔗', accent: '#66bb6a' },
  { id: 'foundry', name: 'Azure AI Foundry', desc: 'Import skills from Foundry', sub: 'Auto-discover skills from connected projects', icon: '◆', accent: '#4F6BED' },
  { id: 'custom', name: 'Custom', desc: 'Register any skill endpoint', sub: 'Custom REST endpoints, gRPC, or internal services', icon: '▣', accent: '#888' },
];

const skFunctionList = ['AnalyzeSentiment', 'SummarizeText', 'ExtractEntities', 'ClassifyDocument', 'TranslateText'];

const foundrySkillList: { id: string; desc: string; defaultChecked: boolean }[] = [
  { id: 'customer-sentiment', desc: 'Analyze customer sentiment from support interactions', defaultChecked: true },
  { id: 'doc-summarizer', desc: 'Summarize long documents into concise briefs', defaultChecked: true },
  { id: 'entity-extractor', desc: 'Extract named entities from unstructured text', defaultChecked: false },
  { id: 'claim-classifier', desc: 'Classify insurance claims by type and severity', defaultChecked: false },
];

const categories: { id: SkillCategory; name: string; icon: string }[] = [
  { id: 'analytics', name: 'Analytics', icon: '◉' },
  { id: 'nlp', name: 'NLP', icon: '✎' },
  { id: 'vision', name: 'Vision', icon: '👁' },
  { id: 'code', name: 'Code', icon: '⟨/⟩' },
  { id: 'data', name: 'Data', icon: '⊞' },
  { id: 'orchestration', name: 'Orchestration', icon: '⚙' },
];

const credentialOptions = ['prod-azure-key', 'dev-azure-key', 'bedrock-iam-role', 'gcp-service-acct'];

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
function RegisterSkill({ onClose, onComplete }: { onClose: () => void; onComplete: () => void }) {
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
    if (step === 2) return form.category !== null && form.displayName !== '';
    if (step === 3) return true;
    if (step === 4) return true;
    if (step === 5) return true;
    if (step === 6) return form.namespace !== '';
    return true;
  };

  const set = <K extends keyof FormData>(key: K, val: FormData[K]) =>
    setForm((prev) => ({ ...prev, [key]: val }));

  const toggleArrayItem = (key: 'skFunctions' | 'foundrySkills' | 'selectedModels' | 'selectedTools', item: string) => {
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

  const stepLabels = ['Source', 'Definition', 'Bindings', 'Auth', 'Governance', 'Namespace', 'Review'];

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

  // Step 1 — Source Selection
  const renderSourceStep = () => (
    <>
      <div style={title}>Where is this skill hosted?</div>
      <div style={subtitle}>Select the framework or platform of the skill you want to register for gateway governance</div>
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

  // Step 2 — Definition
  const renderDefinitionStep = () => (
    <>
      <div style={title}>Define your skill</div>
      <div style={subtitle}>Provide source-specific configuration and skill metadata</div>

      {/* Prompt Flow */}
      {form.source === 'promptflow' && (
        <>
          <div style={fieldGroup}>
            <label style={label}>Endpoint URL</label>
            <input style={input} placeholder="https://my-flow.eastus.inference.ml.azure.com" value={form.promptFlowEndpoint} onChange={(e) => set('promptFlowEndpoint', e.target.value)} />
          </div>
          <div style={fieldGroup}>
            <label style={label}>Deployment Name</label>
            <input style={input} placeholder="my-flow-deployment" value={form.promptFlowDeployment} onChange={(e) => set('promptFlowDeployment', e.target.value)} />
          </div>
          <div style={fieldGroup}>
            <label style={label}>Project Name</label>
            <input style={input} placeholder="contoso-ai-prod" value={form.promptFlowProject} onChange={(e) => set('promptFlowProject', e.target.value)} />
          </div>
          <div style={infoBox}>
            ⚡ Prompt Flow skills are imported as managed endpoints — the gateway will proxy traffic and apply governance policies automatically.
          </div>
        </>
      )}

      {/* Semantic Kernel */}
      {form.source === 'semantic-kernel' && (
        <>
          <div style={fieldGroup}>
            <label style={label}>Plugin Name</label>
            <input style={input} placeholder="TextAnalyticsPlugin" value={form.skPluginName} onChange={(e) => set('skPluginName', e.target.value)} />
          </div>
          <div style={fieldGroup}>
            <label style={label}>Plugin URL</label>
            <input style={input} placeholder="https://my-sk-service.azurewebsites.net/plugins" value={form.skPluginUrl} onChange={(e) => set('skPluginUrl', e.target.value)} />
          </div>
          <div style={fieldGroup}>
            <label style={label}>Functions</label>
            <div style={{ backgroundColor: '#1a1a1a', border: '1px solid #333', borderRadius: 6, padding: 8 }}>
              {skFunctionList.map((fn) => (
                <label key={fn} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '6px 8px', cursor: 'pointer', color: '#E8E8E8', fontSize: 13 }}>
                  <input
                    type="checkbox"
                    checked={form.skFunctions.includes(fn)}
                    onChange={() => toggleArrayItem('skFunctions', fn)}
                  />
                  <span style={{ fontWeight: 600, color: '#fff' }}>{fn}</span>
                </label>
              ))}
            </div>
          </div>
        </>
      )}

      {/* LangChain */}
      {form.source === 'langchain' && (
        <>
          <div style={fieldGroup}>
            <label style={label}>Endpoint</label>
            <input style={input} placeholder="https://my-langserve.azurewebsites.net" value={form.langchainEndpoint} onChange={(e) => set('langchainEndpoint', e.target.value)} />
          </div>
          <div style={fieldGroup}>
            <label style={label}>Chain Type</label>
            <select style={select} value={form.langchainChainType} onChange={(e) => set('langchainChainType', e.target.value)}>
              <option value="QA">QA</option>
              <option value="Summarization">Summarization</option>
              <option value="Extraction">Extraction</option>
              <option value="Classification">Classification</option>
              <option value="Custom">Custom</option>
            </select>
          </div>
          <div style={fieldGroup}>
            <label style={label}>Display Name</label>
            <input style={input} placeholder="My LangChain Skill" value={form.langchainDisplayName} onChange={(e) => set('langchainDisplayName', e.target.value)} />
          </div>
        </>
      )}

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
              <label style={label}>Auto-discovered Skills</label>
              <div style={{ backgroundColor: '#1a1a1a', border: '1px solid #333', borderRadius: 6, padding: 8 }}>
                {foundrySkillList.map((s) => (
                  <label key={s.id} style={{ display: 'flex', alignItems: 'flex-start', gap: 8, padding: '8px 8px', cursor: 'pointer', color: '#E8E8E8', fontSize: 13 }}>
                    <input
                      type="checkbox"
                      checked={form.foundrySkills.includes(s.id)}
                      onChange={() => toggleArrayItem('foundrySkills', s.id)}
                      style={{ marginTop: 2 }}
                    />
                    <div>
                      <div style={{ fontWeight: 600, color: '#fff' }}>{s.id}</div>
                      <div style={{ fontSize: 11, color: '#888', marginTop: 2 }}>{s.desc}</div>
                    </div>
                  </label>
                ))}
              </div>
            </div>
          )}
          <div style={infoBox}>
            ℹ Import mode: <strong>Register for traffic governance</strong> — these skills will be registered in the gateway registry so all traffic can be governed, monitored, and policy-enforced.
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
            <input style={input} placeholder="https://my-skill.internal:8080" value={form.customEndpoint} onChange={(e) => set('customEndpoint', e.target.value)} />
          </div>
          <div style={fieldGroup}>
            <label style={label}>Description</label>
            <textarea style={textarea} value={form.customDescription} onChange={(e) => set('customDescription', e.target.value)} />
          </div>
          <div style={fieldGroup}>
            <label style={label}>Input Schema (JSON)</label>
            <textarea style={textarea} placeholder='{"type": "object", "properties": {...}}' value={form.customInputSchema} onChange={(e) => set('customInputSchema', e.target.value)} />
          </div>
          <div style={fieldGroup}>
            <label style={label}>Output Schema (JSON)</label>
            <textarea style={textarea} placeholder='{"type": "object", "properties": {...}}' value={form.customOutputSchema} onChange={(e) => set('customOutputSchema', e.target.value)} />
          </div>
        </>
      )}

      {/* Divider */}
      <div style={{ borderTop: '1px solid #333', margin: '20px 0' }} />

      {/* Category Selection */}
      <div style={fieldGroup}>
        <label style={label}>Category</label>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10 }}>
          {categories.map((c) => (
            <div
              key={c.id}
              style={{
                backgroundColor: form.category === c.id ? 'rgba(96,205,255,0.06)' : 'rgba(255,255,255,0.02)',
                border: form.category === c.id ? '1px solid #60cdff' : '1px solid #333',
                borderRadius: 8,
                padding: '12px 14px',
                cursor: 'pointer',
                textAlign: 'center',
                transition: 'all 0.15s',
              }}
              onClick={() => set('category', c.id)}
            >
              <div style={{ fontSize: 20, marginBottom: 4, color: form.category === c.id ? '#60cdff' : '#888' }}>{c.icon}</div>
              <div style={{ fontSize: 12, fontWeight: 600, color: form.category === c.id ? '#fff' : '#aaa' }}>{c.name}</div>
            </div>
          ))}
        </div>
      </div>

      <div style={fieldGroup}>
        <label style={label}>Display Name</label>
        <input style={input} placeholder="Customer Sentiment Analysis" value={form.displayName} onChange={(e) => set('displayName', e.target.value)} />
      </div>

      <div style={fieldGroup}>
        <label style={label}>Description</label>
        <textarea style={textarea} placeholder="Describe what this skill does…" value={form.description} onChange={(e) => set('description', e.target.value)} />
      </div>

      <div style={fieldGroup}>
        <label style={label}>Version</label>
        <input style={{ ...input, width: 140 }} placeholder="1.0.0" value={form.version} onChange={(e) => set('version', e.target.value)} />
      </div>
    </>
  );

  // Step 3 — Bindings (Model & Tool)
  const renderBindingsStep = () => (
    <>
      <div style={title}>Declare model and tool access</div>
      <div style={subtitle}>Define what this skill is allowed to access through the gateway</div>

      {/* Model Bindings */}
      <div style={{ marginBottom: 24 }}>
        <div style={sectionTitle}>Model Bindings</div>
        <div style={sectionSub}>Which models can this skill access through the gateway?</div>
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
          <span style={{ fontSize: 13, color: '#E8E8E8' }}>Allow all gateway models</span>
          <ToggleButton on={form.allowAllModels} onToggle={() => set('allowAllModels', !form.allowAllModels)} />
        </div>
      </div>

      {/* Tool Bindings */}
      <div style={{ marginBottom: 24 }}>
        <div style={sectionTitle}>Tool Bindings</div>
        <div style={sectionSub}>Which tools can this skill invoke through the gateway?</div>
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
          <span style={{ fontSize: 13, color: '#E8E8E8' }}>Allow all gateway tools</span>
          <ToggleButton on={form.allowAllTools} onToggle={() => set('allowAllTools', !form.allowAllTools)} />
        </div>
      </div>

      <div style={infoBox}>
        🔒 These bindings are enforced at the gateway. Even if the skill attempts to call an unauthorized model or tool, the gateway will block the request.
      </div>
    </>
  );

  // Step 4 — Authentication
  const renderAuthStep = () => {
    const authMethods: { value: FormData['authMethod']; label: string }[] = [
      { value: 'none', label: 'None' },
      { value: 'apikey', label: 'API Key' },
      { value: 'oauth2', label: 'OAuth 2.0' },
      { value: 'managed-identity', label: 'Managed Identity' },
      { value: 'entra-token', label: 'Entra ID Token' },
    ];

    return (
      <>
        <div style={title}>Configure authentication</div>
        <div style={subtitle}>Define how the gateway authenticates with the upstream skill endpoint</div>

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
          </>
        )}

        {/* Managed Identity */}
        {form.authMethod === 'managed-identity' && (
          <>
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
            No authentication will be configured. The skill endpoint must accept unauthenticated requests.
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

  // Step 5 — Governance
  const renderGovernanceStep = () => (
    <>
      <div style={title}>Apply governance policies</div>
      <div style={subtitle}>Configure the policies that will govern this skill's execution through the gateway</div>

      {/* Rate Limiting */}
      <div style={policyCard(form.rateLimiting)}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <div style={{ fontSize: 14, fontWeight: 600, color: '#fff' }}>Rate Limiting</div>
            <div style={{ fontSize: 12, color: '#888' }}>Limit skill execution requests per minute</div>
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

      {/* Execution Auditing */}
      <div style={policyCard(form.executionAuditing)}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <div style={{ fontSize: 14, fontWeight: 600, color: '#fff' }}>Execution Auditing</div>
            <div style={{ fontSize: 12, color: '#888' }}>Log all skill execution activity for compliance and debugging</div>
          </div>
          <ToggleButton on={form.executionAuditing} onToggle={() => set('executionAuditing', !form.executionAuditing)} />
        </div>
        {form.executionAuditing && (
          <div style={{ marginTop: 8 }}>
            <div style={checkRow}>
              <input type="checkbox" checked={form.logInputs} onChange={() => set('logInputs', !form.logInputs)} />
              Log inputs
            </div>
            <div style={checkRow}>
              <input type="checkbox" checked={form.logOutputs} onChange={() => set('logOutputs', !form.logOutputs)} />
              Log outputs
            </div>
            <div style={checkRow}>
              <input type="checkbox" checked={form.logLatency} onChange={() => set('logLatency', !form.logLatency)} />
              Log latency
            </div>
          </div>
        )}
      </div>

      {/* Data Classification */}
      <div style={policyCard(true)}>
        <div>
          <div style={{ fontSize: 14, fontWeight: 600, color: '#fff' }}>Data Classification</div>
          <div style={{ fontSize: 12, color: '#888' }}>Classify the data sensitivity level for this skill</div>
        </div>
        <div style={{ marginTop: 12 }}>
          <select style={{ ...select, width: 200 }} value={form.dataClassification} onChange={(e) => set('dataClassification', e.target.value as DataClassification)}>
            <option value="public">Public</option>
            <option value="internal">Internal</option>
            <option value="confidential">Confidential</option>
            <option value="restricted">Restricted</option>
          </select>
        </div>
      </div>

      {/* PII Scanning */}
      <div style={policyCard(form.piiScanning)}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <div style={{ fontSize: 14, fontWeight: 600, color: '#fff' }}>PII Scanning</div>
            <div style={{ fontSize: 12, color: '#888' }}>Scan skill inputs and outputs for personally identifiable information</div>
          </div>
          <ToggleButton on={form.piiScanning} onToggle={() => set('piiScanning', !form.piiScanning)} />
        </div>
      </div>

      {/* Execution Timeout */}
      <div style={policyCard(true)}>
        <div>
          <div style={{ fontSize: 14, fontWeight: 600, color: '#fff' }}>Execution Timeout</div>
          <div style={{ fontSize: 12, color: '#888' }}>Maximum time a skill execution is allowed to run</div>
        </div>
        <div style={{ marginTop: 12 }}>
          <label style={label}>Timeout (seconds)</label>
          <input style={{ ...input, width: 120 }} type="number" value={form.maxExecutionTime} onChange={(e) => set('maxExecutionTime', Number(e.target.value))} />
        </div>
      </div>

      {/* Cost Tracking */}
      <div style={policyCard(form.costTracking)}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <div style={{ fontSize: 14, fontWeight: 600, color: '#fff' }}>Cost Tracking</div>
            <div style={{ fontSize: 12, color: '#888' }}>Track cost per skill execution for budgeting and chargeback</div>
          </div>
          <ToggleButton on={form.costTracking} onToggle={() => set('costTracking', !form.costTracking)} />
        </div>
        {form.costTracking && (
          <div style={{ marginTop: 12 }}>
            <label style={label}>Cost per execution ($)</label>
            <input style={{ ...input, width: 160 }} placeholder="0.005" value={form.costPerExecution} onChange={(e) => set('costPerExecution', e.target.value)} />
          </div>
        )}
      </div>
    </>
  );

  // Step 6 — Namespace
  const renderNamespaceStep = () => (
    <>
      <div style={title}>Assign to namespace</div>
      <div style={subtitle}>Organize this skill within a governance namespace</div>

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
          {([['private', 'Private to namespace'], ['shared', 'Shared across organization'], ['public', 'Public']] as const).map(([v, lbl]) => (
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
        <ToggleButton on={form.approvalRequired} onToggle={() => set('approvalRequired', !form.approvalRequired)} />
      </div>
    </>
  );

  // Step 7 — Review
  const sourceName = sources.find((s) => s.id === form.source)?.name ?? '—';
  const categoryName = categories.find((c) => c.id === form.category)?.name ?? '—';

  const getSkillDisplay = (): string => {
    if (form.source === 'promptflow') return form.promptFlowDeployment || form.promptFlowEndpoint || '—';
    if (form.source === 'semantic-kernel') return form.skPluginName || '—';
    if (form.source === 'langchain') return form.langchainDisplayName || '—';
    if (form.source === 'foundry') return form.foundrySkills.join(', ') || '—';
    if (form.source === 'custom') return form.customDisplayName || '—';
    return '—';
  };

  const modelCount = form.allowAllModels ? 'All gateway models' : `${form.selectedModels.length} selected`;
  const toolCount = form.allowAllTools ? 'All gateway tools' : `${form.selectedTools.length} selected`;

  const enabledPolicies = [
    form.rateLimiting && 'Rate Limiting',
    form.executionAuditing && 'Execution Auditing',
    'Data Classification',
    form.piiScanning && 'PII Scanning',
    'Execution Timeout',
    form.costTracking && 'Cost Tracking',
  ].filter(Boolean) as string[];

  const renderReviewStep = () => (
    <>
      <div style={title}>Review &amp; Register</div>
      <div style={subtitle}>Confirm the details below to register this skill for governance</div>

      <div style={reviewSection}>
        <div style={reviewLabel}>Source</div>
        <div style={reviewValue}>
          <span style={badge('rgba(96,205,255,0.1)', '#60cdff')}>{sourceName}</span>
          <span style={{ marginLeft: 8 }}>{getSkillDisplay()}</span>
        </div>
      </div>

      <div style={reviewSection}>
        <div style={reviewLabel}>Category</div>
        <div style={reviewValue}>
          <span style={badge('rgba(96,205,255,0.1)', '#60cdff')}>{categoryName}</span>
        </div>
      </div>

      <div style={reviewSection}>
        <div style={reviewLabel}>Display Name &amp; Version</div>
        <div style={reviewValue}>
          <span style={{ fontWeight: 600 }}>{form.displayName || '—'}</span>
          {form.version && <span style={{ ...badge('rgba(255,183,77,0.12)', '#ffb74d'), marginLeft: 8 }}>v{form.version}</span>}
        </div>
        {form.description && (
          <div style={{ fontSize: 12, color: '#aaa', marginTop: 6 }}>{form.description}</div>
        )}
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
        <div style={reviewLabel}>Authentication</div>
        <div style={reviewValue}>
          <span style={badge('rgba(96,205,255,0.1)', '#60cdff')}>
            {form.authMethod === 'apikey' ? 'API Key' : form.authMethod === 'oauth2' ? 'OAuth 2.0' : form.authMethod === 'managed-identity' ? 'Managed Identity' : form.authMethod === 'entra-token' ? 'Entra ID Token' : 'None'}
          </span>
          {form.authMethod === 'apikey' && form.authApiKeyCredential && (
            <span style={{ marginLeft: 8, color: '#aaa', fontSize: 12 }}>Header: {form.authApiKeyHeader}, Credential: {form.authApiKeyCredential}</span>
          )}
          {form.authMethod === 'oauth2' && form.authOAuthTokenUrl && (
            <span style={{ marginLeft: 8, color: '#aaa', fontSize: 12 }}>Token URL: {form.authOAuthTokenUrl}</span>
          )}
          {form.authMethod === 'managed-identity' && form.authManagedIdentityResource && (
            <span style={{ marginLeft: 8, color: '#aaa', fontSize: 12 }}>Resource: {form.authManagedIdentityResource}</span>
          )}
          {form.authMethod === 'entra-token' && form.authEntraTenantId && (
            <span style={{ marginLeft: 8, color: '#aaa', fontSize: 12 }}>Tenant: {form.authEntraTenantId}</span>
          )}
        </div>
      </div>

      <div style={reviewSection}>
        <div style={reviewLabel}>Policies Enabled ({enabledPolicies.length})</div>
        <div style={reviewValue}>
          {enabledPolicies.map((p) => <span key={p} style={badge('rgba(96,205,255,0.1)', '#60cdff')}>{p}</span>)}
        </div>
        <div style={{ marginTop: 8, fontSize: 12, color: '#aaa' }}>
          Data Classification: <span style={badge(
            form.dataClassification === 'restricted' ? 'rgba(244,67,54,0.12)' :
            form.dataClassification === 'confidential' ? 'rgba(255,183,77,0.12)' :
            'rgba(96,205,255,0.1)',
            form.dataClassification === 'restricted' ? '#ef5350' :
            form.dataClassification === 'confidential' ? '#ffb74d' :
            '#60cdff',
          )}>{form.dataClassification}</span>
        </div>
      </div>

      <div style={reviewSection}>
        <div style={reviewLabel}>Namespace</div>
        <div style={reviewValue}>
          <span style={{ fontFamily: 'monospace', fontSize: 12, color: '#9cdcfe' }}>{form.namespace || '—'}</span>
          <span style={{ ...badge(
            form.visibility === 'public' ? 'rgba(76,175,80,0.12)' :
            form.visibility === 'shared' ? 'rgba(255,183,77,0.12)' :
            'rgba(96,205,255,0.1)',
            form.visibility === 'public' ? '#4caf50' :
            form.visibility === 'shared' ? '#ffb74d' :
            '#60cdff',
          ), marginLeft: 8 }}>
            {form.visibility === 'public' ? 'Public' : form.visibility === 'shared' ? 'Shared' : 'Private'}
          </span>
        </div>
        {form.tags.length > 0 && (
          <div style={{ marginTop: 8 }}>
            {form.tags.map((t) => <span key={t} style={tagStyle}>{t}</span>)}
          </div>
        )}
        {form.owner && (
          <div style={{ marginTop: 6, fontSize: 12, color: '#aaa' }}>Owner: {form.owner}</div>
        )}
      </div>
    </>
  );

  return createPortal(
    <div style={overlay} onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div style={modal}>
        {/* Header */}
        <div style={headerBar}>
          <div style={{ fontSize: 15, fontWeight: 700, color: '#e0e0e0' }}>Register Skill for Governance</div>
          <button style={closeBtn} onClick={onClose} title="Close">✕</button>
        </div>

        {/* Step bar */}
        {renderStepBar()}

        {/* Body */}
        <div style={body}>
          {step === 1 && renderSourceStep()}
          {step === 2 && renderDefinitionStep()}
          {step === 3 && renderBindingsStep()}
          {step === 4 && renderAuthStep()}
          {step === 5 && renderGovernanceStep()}
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
              Register Skill
            </button>
          )}
        </div>
      </div>
    </div>,
    document.body
  );
}

export default RegisterSkill;
