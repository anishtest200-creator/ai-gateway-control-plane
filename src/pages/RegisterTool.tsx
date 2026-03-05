import { useState } from 'react';
import { createPortal } from 'react-dom';
import type { CSSProperties } from 'react';

// --- Types ---
type ToolType = 'mcp' | 'rest' | 'saas';
type ToolSource = 'foundry' | 'openapi' | 'external' | 'convert';
type AuthMethod = 'none' | 'apikey' | 'oauth2' | 'managed-identity' | 'entra-token' | 'custom-header';
type DataClassification = 'public' | 'internal' | 'confidential' | 'restricted';

interface ManualEndpoint {
  method: string;
  path: string;
  description: string;
}

interface FormData {
  // Step 1
  toolType: ToolType | null;
  toolSource: ToolSource | null;
  // MCP External
  mcpUrl: string;
  mcpTransport: string;
  mcpDisplayName: string;
  mcpDescription: string;
  mcpTools: string[];
  // MCP Foundry
  foundryProject: string;
  foundryMcpServers: string[];
  // REST OpenAPI
  openapiSpecUrl: string;
  openapiSpecText: string;
  openapiEndpoints: string[];
  openapiBaseUrl: string;
  // REST Manual
  restDisplayName: string;
  restBaseUrl: string;
  restDescription: string;
  restEndpoints: ManualEndpoint[];
  // SaaS
  saasConnector: string;
  saasInstanceUrl: string;
  saasScopes: string[];
  // Convert
  convertSourceApi: string;
  convertSpecUrl: string;
  convertMcpName: string;
  convertAutoDescriptions: boolean;
  // Step 3: Auth
  authMethod: AuthMethod;
  apiKeyHeader: string;
  apiKeyFormat: string;
  apiKeyCredential: string;
  oauthTokenUrl: string;
  oauthClientId: string;
  oauthScopes: string;
  oauthGrantType: string;
  managedIdentityResourceUri: string;
  managedIdentityType: string;
  entraTokenTenantId: string;
  entraTokenAppId: string;
  entraTokenResourceUri: string;
  customHeaderName: string;
  customHeaderCredential: string;
  // Step 4: Policies
  rateLimiting: boolean;
  rateLimit: number;
  toolAllowlist: boolean;
  allowedConsumers: string[];
  executionAuditing: boolean;
  logInputs: boolean;
  logOutputs: boolean;
  logTiming: boolean;
  networkRestrictions: boolean;
  allowedDomains: string[];
  dataClassification: DataClassification;
  piiScanning: boolean;
  timeout: number;
  // Step 5: Namespace
  namespace: string;
  visibility: 'private' | 'shared' | 'public';
  tags: string[];
  owner: string;
  approvalRequired: boolean;
}

const initialFormData: FormData = {
  toolType: null,
  toolSource: null,
  mcpUrl: '',
  mcpTransport: 'sse',
  mcpDisplayName: '',
  mcpDescription: '',
  mcpTools: ['get_customer', 'create_order'],
  foundryProject: '',
  foundryMcpServers: [],
  openapiSpecUrl: '',
  openapiSpecText: '',
  openapiEndpoints: ['GET /customers/{id}', 'POST /orders', 'GET /orders/{id}/status'],
  openapiBaseUrl: '',
  restDisplayName: '',
  restBaseUrl: '',
  restDescription: '',
  restEndpoints: [{ method: 'GET', path: '', description: '' }],
  saasConnector: '',
  saasInstanceUrl: '',
  saasScopes: [],
  convertSourceApi: '',
  convertSpecUrl: '',
  convertMcpName: '',
  convertAutoDescriptions: true,
  authMethod: 'none',
  apiKeyHeader: 'Authorization',
  apiKeyFormat: 'Bearer',
  apiKeyCredential: '',
  oauthTokenUrl: '',
  oauthClientId: '',
  oauthScopes: '',
  oauthGrantType: 'client_credentials',
  managedIdentityResourceUri: '',
  managedIdentityType: 'system',
  entraTokenTenantId: '',
  entraTokenAppId: '',
  entraTokenResourceUri: '',
  customHeaderName: '',
  customHeaderCredential: '',
  rateLimiting: true,
  rateLimit: 60,
  toolAllowlist: false,
  allowedConsumers: [],
  executionAuditing: true,
  logInputs: true,
  logOutputs: true,
  logTiming: true,
  networkRestrictions: false,
  allowedDomains: [],
  dataClassification: 'internal',
  piiScanning: false,
  timeout: 30,
  namespace: '',
  visibility: 'private',
  tags: [],
  owner: 'anishta@contoso.com',
  approvalRequired: false,
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

const bodyStyle: CSSProperties = {
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

const textarea: CSSProperties = {
  ...input,
  minHeight: 80,
  resize: 'vertical' as const,
  fontFamily: 'inherit',
};

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

const toggleStyle = (on: boolean): CSSProperties => ({
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

const infoBox: CSSProperties = {
  backgroundColor: 'rgba(96,205,255,0.06)',
  border: '1px solid rgba(96,205,255,0.15)',
  borderRadius: 8,
  padding: '12px 16px',
  fontSize: 12,
  color: '#8dd8ff',
  marginTop: 16,
};

// --- Config data ---
const toolTypes: { id: ToolType; name: string; desc: string; sub: string; icon: string; accent: string }[] = [
  { id: 'mcp', name: 'MCP Server', desc: 'Model Context Protocol endpoint', sub: 'Agents discover and invoke tools via MCP protocol', icon: '⬡', accent: '#4fc3f7' },
  { id: 'rest', name: 'REST API', desc: 'Standard HTTP/REST endpoint', sub: 'Register any REST API as a governed tool', icon: '⬢', accent: '#66bb6a' },
  { id: 'saas', name: 'SaaS Connector', desc: 'Pre-built SaaS integration', sub: 'Salesforce, ServiceNow, Jira, and more', icon: '◈', accent: '#b388ff' },
];

const toolSources: { id: ToolSource; name: string; desc: string; exclusive?: boolean }[] = [
  { id: 'foundry', name: 'Import from Foundry', desc: 'Import tools registered in your Foundry project' },
  { id: 'openapi', name: 'Import from OpenAPI', desc: 'Generate from OpenAPI/Swagger specification' },
  { id: 'external', name: 'External Endpoint', desc: 'Register an existing endpoint manually' },
  { id: 'convert', name: 'Convert API → MCP', desc: 'Convert a REST API to MCP protocol', exclusive: true },
];

const mcpToolsMock = [
  { name: 'get_customer', desc: 'Retrieve customer details by ID' },
  { name: 'create_order', desc: 'Create a new order for a customer' },
  { name: 'delete_order', desc: 'Delete an existing order' },
  { name: 'list_products', desc: 'List available products' },
];

const openapiEndpointsMock = [
  { id: 'GET /customers/{id}', method: 'GET', path: '/customers/{id}', desc: 'Get customer details' },
  { id: 'POST /orders', method: 'POST', path: '/orders', desc: 'Create order' },
  { id: 'GET /orders/{id}/status', method: 'GET', path: '/orders/{id}/status', desc: 'Check order status' },
  { id: 'DELETE /orders/{id}', method: 'DELETE', path: '/orders/{id}', desc: 'Cancel order' },
];

const saasConnectors = [
  { id: 'salesforce', name: 'Salesforce', icon: '☁', sub: 'CRM' },
  { id: 'servicenow', name: 'ServiceNow', icon: '⚙', sub: 'ITSM' },
  { id: 'jira', name: 'Jira', icon: '◆', sub: 'Project' },
  { id: 'confluence', name: 'Confluence', icon: '📄', sub: 'Docs' },
  { id: 'slack', name: 'Slack', icon: '💬', sub: 'Chat' },
  { id: 'github', name: 'GitHub', icon: '⌥', sub: 'Code' },
  { id: 'sharepoint', name: 'SharePoint', icon: '📁', sub: 'Files' },
  { id: 'custom', name: 'Custom', icon: '🔧', sub: 'Other' },
];

const saasScopes: Record<string, string[]> = {
  salesforce: ['Read Contacts', 'Write Contacts', 'Read Opportunities', 'Write Opportunities', 'Read Cases', 'Execute Reports'],
  servicenow: ['Read Incidents', 'Create Incidents', 'Update Incidents', 'Read CMDB', 'Read Knowledge'],
  jira: ['Read Issues', 'Create Issues', 'Update Issues', 'Read Projects', 'Manage Sprints'],
  confluence: ['Read Pages', 'Create Pages', 'Read Spaces', 'Search Content'],
  slack: ['Read Messages', 'Post Messages', 'Read Channels', 'Manage Channels'],
  github: ['Read Repos', 'Read Issues', 'Create Issues', 'Read PRs', 'Create PRs'],
  sharepoint: ['Read Files', 'Write Files', 'Read Lists', 'Write Lists'],
  custom: ['Read', 'Write', 'Admin'],
};

const convertPreviewTools = [
  { name: 'getCustomerById', desc: 'Retrieve customer details by ID', method: 'GET', path: '/customers/{id}' },
  { name: 'createOrder', desc: 'Create a new order', method: 'POST', path: '/orders' },
  { name: 'getOrderStatus', desc: 'Check order status', method: 'GET', path: '/orders/{id}/status' },
];

const credentialOptions = ['prod-api-key', 'dev-api-key', 'oauth-salesforce', 'oauth-servicenow', 'managed-identity-prod'];
const consumers = ['retail-support-agent', 'finance-analyst', 'hr-assistant', 'dev-copilot', 'data-pipeline', 'qa-bot'];
const namespaces = ['retail-support', 'finance-analytics', 'hr-automation', 'dev-sandbox'];
const existingRestApis = ['salesforce-crm', 'order-lookup-rest', 'weather-api', 'jira-tickets'];

// --- Toggle Component ---
function ToggleButton({ on, onToggle }: { on: boolean; onToggle: () => void }) {
  return (
    <button style={toggleStyle(on)} onClick={onToggle} type="button" aria-label="Toggle">
      <span style={toggleDot(on)} />
    </button>
  );
}

// --- Main Component ---
function RegisterTool({ onClose, onComplete }: { onClose: () => void; onComplete: () => void }) {
  const [step, setStep] = useState(1);
  const [form, setForm] = useState<FormData>(initialFormData);
  const [tagInput, setTagInput] = useState('');
  const [domainInput, setDomainInput] = useState('');

  const totalSteps = 6;

  const canNext = (): boolean => {
    if (step === 1) return form.toolType !== null && form.toolSource !== null;
    if (step === 2) {
      if (form.toolType === 'mcp' && form.toolSource === 'external') return form.mcpUrl !== '' && form.mcpDisplayName !== '';
      if (form.toolType === 'mcp' && form.toolSource === 'foundry') return form.foundryProject !== '' && form.foundryMcpServers.length > 0;
      if (form.toolType === 'rest' && form.toolSource === 'openapi') return form.openapiEndpoints.length > 0;
      if (form.toolType === 'rest' && form.toolSource === 'external') return form.restDisplayName !== '' && form.restBaseUrl !== '';
      if (form.toolType === 'saas') return form.saasConnector !== '' && form.saasInstanceUrl !== '';
      if (form.toolSource === 'convert') return form.convertMcpName !== '';
    }
    if (step === 5) return form.namespace !== '';
    return true;
  };

  const set = <K extends keyof FormData>(key: K, val: FormData[K]) =>
    setForm((prev) => ({ ...prev, [key]: val }));

  const toggleArrayItem = (key: 'mcpTools' | 'foundryMcpServers' | 'openapiEndpoints' | 'allowedConsumers' | 'saasScopes' | 'allowedDomains', item: string) => {
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

  const addDomain = () => {
    const d = domainInput.trim();
    if (d && !form.allowedDomains.includes(d)) {
      set('allowedDomains', [...form.allowedDomains, d]);
      setDomainInput('');
    }
  };

  const addEndpointRow = () => {
    set('restEndpoints', [...form.restEndpoints, { method: 'GET', path: '', description: '' }]);
  };

  const updateEndpointRow = (idx: number, field: keyof ManualEndpoint, value: string) => {
    const updated = form.restEndpoints.map((ep, i) => i === idx ? { ...ep, [field]: value } : ep);
    set('restEndpoints', updated);
  };

  const removeEndpointRow = (idx: number) => {
    set('restEndpoints', form.restEndpoints.filter((_, i) => i !== idx));
  };

  const stepLabels = ['Type', 'Endpoint', 'Auth', 'Governance', 'Namespace', 'Review'];

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

  // Step 1: Select Tool Type & Source
  const renderTypeStep = () => (
    <>
      <div style={title}>What type of tool are you registering?</div>
      <div style={subtitle}>Register an existing tool so the gateway can mediate access, govern usage, and audit invocations</div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12, marginBottom: 24 }}>
        {toolTypes.map((t) => (
          <div
            key={t.id}
            style={sourceCardStyle(t.accent, form.toolType === t.id)}
            onClick={() => { set('toolType', t.id); set('toolSource', null); }}
            onMouseEnter={(e) => { (e.currentTarget as HTMLDivElement).style.borderColor = t.accent; }}
            onMouseLeave={(e) => {
              if (form.toolType !== t.id) (e.currentTarget as HTMLDivElement).style.borderColor = '#333';
            }}
          >
            <div style={{ fontSize: 24, marginBottom: 8, color: t.accent }}>{t.icon}</div>
            <div style={{ fontSize: 14, fontWeight: 600, color: '#fff', marginBottom: 4 }}>{t.name}</div>
            <div style={{ fontSize: 12, color: '#aaa', marginBottom: 6 }}>{t.desc}</div>
            <div style={{ fontSize: 11, color: '#666' }}>{t.sub}</div>
          </div>
        ))}
      </div>

      {form.toolType && (
        <>
          <label style={{ ...label, marginBottom: 10 }}>Registration Source</label>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 10 }}>
            {toolSources.map((s) => (
              <div
                key={s.id}
                style={{
                  ...sourceCardStyle('#60cdff', form.toolSource === s.id),
                  borderTop: form.toolSource === s.id ? '3px solid #60cdff' : '3px solid #333',
                  position: 'relative' as const,
                }}
                onClick={() => set('toolSource', s.id)}
              >
                <div style={{ fontSize: 13, fontWeight: 600, color: '#fff', marginBottom: 4 }}>
                  {s.name}
                  {s.exclusive && (
                    <span style={{ ...badge('rgba(255,183,77,0.15)', '#ffb74d'), marginLeft: 8, fontSize: 10 }}>
                      ★ Gateway Exclusive
                    </span>
                  )}
                </div>
                <div style={{ fontSize: 12, color: '#888' }}>{s.desc}</div>
              </div>
            ))}
          </div>
        </>
      )}
    </>
  );

  // Step 2: Configure Endpoint
  const renderEndpointStep = () => {
    const key = `${form.toolType}-${form.toolSource}`;

    return (
      <>
        <div style={title}>Configure endpoint</div>
        <div style={subtitle}>Provide connection details for the existing tool — the gateway will mediate all access through this endpoint</div>

        {/* MCP — External */}
        {key === 'mcp-external' && (
          <>
            <div style={fieldGroup}>
              <label style={label}>MCP Server URL</label>
              <input style={input} placeholder="https://mcp.myservice.com/sse" value={form.mcpUrl} onChange={(e) => set('mcpUrl', e.target.value)} />
            </div>
            <div style={fieldGroup}>
              <label style={label}>Transport</label>
              <select style={select} value={form.mcpTransport} onChange={(e) => set('mcpTransport', e.target.value)}>
                <option value="sse">SSE</option>
                <option value="websocket">WebSocket</option>
                <option value="stdio">Stdio</option>
              </select>
            </div>
            <div style={fieldGroup}>
              <label style={label}>Display Name</label>
              <input style={input} value={form.mcpDisplayName} onChange={(e) => set('mcpDisplayName', e.target.value)} />
            </div>
            <div style={fieldGroup}>
              <label style={label}>Description</label>
              <textarea style={textarea} value={form.mcpDescription} onChange={(e) => set('mcpDescription', e.target.value)} placeholder="Describe what this MCP server provides…" />
            </div>
            <div style={fieldGroup}>
              <label style={label}>Available Tools (auto-discovered)</label>
              <div style={{ backgroundColor: '#1a1a1a', border: '1px solid #333', borderRadius: 6, padding: 8 }}>
                {mcpToolsMock.map((t) => (
                  <label key={t.name} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '6px 8px', cursor: 'pointer', color: '#ccc', fontSize: 13 }}>
                    <input type="checkbox" checked={form.mcpTools.includes(t.name)} onChange={() => toggleArrayItem('mcpTools', t.name)} />
                    <span style={{ fontFamily: 'monospace', color: '#9cdcfe' }}>{t.name}</span>
                    <span style={{ color: '#666', fontSize: 11 }}>— {t.desc}</span>
                  </label>
                ))}
              </div>
            </div>
          </>
        )}

        {/* MCP — Foundry */}
        {key === 'mcp-foundry' && (
          <>
            <div style={fieldGroup}>
              <label style={label}>Foundry Project</label>
              <select style={select} value={form.foundryProject} onChange={(e) => set('foundryProject', e.target.value)}>
                <option value="">Select Foundry project…</option>
                <option value="contoso-ai-prod">contoso-ai-prod</option>
                <option value="retail-ai">retail-ai</option>
              </select>
            </div>
            {form.foundryProject && (
              <div style={fieldGroup}>
                <label style={label}>Available MCP Servers</label>
                <div style={{ backgroundColor: '#1a1a1a', border: '1px solid #333', borderRadius: 6, padding: 8 }}>
                  {['order-management-mcp', 'customer-lookup-mcp', 'inventory-mcp'].map((s) => (
                    <label key={s} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '6px 8px', cursor: 'pointer', color: '#ccc', fontSize: 13 }}>
                      <input type="checkbox" checked={form.foundryMcpServers.includes(s)} onChange={() => toggleArrayItem('foundryMcpServers', s)} />
                      <span style={{ fontFamily: 'monospace', color: '#9cdcfe' }}>{s}</span>
                    </label>
                  ))}
                </div>
              </div>
            )}
          </>
        )}

        {/* REST — OpenAPI */}
        {key === 'rest-openapi' && (
          <>
            <div style={fieldGroup}>
              <label style={label}>OpenAPI Spec URL</label>
              <input style={input} placeholder="https://api.myservice.com/openapi.yaml" value={form.openapiSpecUrl} onChange={(e) => set('openapiSpecUrl', e.target.value)} />
            </div>
            <div style={fieldGroup}>
              <label style={label}>Or paste specification</label>
              <textarea
                style={{ ...textarea, minHeight: 100, fontFamily: 'monospace', fontSize: 12 }}
                placeholder={'openapi: "3.0.0"\ninfo:\n  title: My API\n  version: "1.0"\npaths:\n  /customers/{id}:\n    get:\n      summary: Get customer'}
                value={form.openapiSpecText}
                onChange={(e) => set('openapiSpecText', e.target.value)}
              />
            </div>
            <div style={fieldGroup}>
              <label style={label}>Discovered Endpoints</label>
              <div style={{ backgroundColor: '#1a1a1a', border: '1px solid #333', borderRadius: 6, padding: 8 }}>
                {openapiEndpointsMock.map((ep) => (
                  <label key={ep.id} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '6px 8px', cursor: 'pointer', color: '#ccc', fontSize: 13 }}>
                    <input type="checkbox" checked={form.openapiEndpoints.includes(ep.id)} onChange={() => toggleArrayItem('openapiEndpoints', ep.id)} />
                    <span style={badge(
                      ep.method === 'GET' ? 'rgba(96,205,255,0.1)' :
                      ep.method === 'POST' ? 'rgba(14,147,73,0.15)' :
                      ep.method === 'DELETE' ? 'rgba(211,52,56,0.15)' : 'rgba(255,183,77,0.12)',
                      ep.method === 'GET' ? '#60cdff' :
                      ep.method === 'POST' ? '#4caf50' :
                      ep.method === 'DELETE' ? '#ef5350' : '#ffb74d',
                    )}>{ep.method}</span>
                    <span style={{ fontFamily: 'monospace', color: '#9cdcfe', fontSize: 12 }}>{ep.path}</span>
                    <span style={{ color: '#666', fontSize: 11 }}>— {ep.desc}</span>
                  </label>
                ))}
              </div>
            </div>
            <div style={fieldGroup}>
              <label style={label}>Base URL Override</label>
              <input style={input} placeholder="https://api.myservice.com/v2" value={form.openapiBaseUrl} onChange={(e) => set('openapiBaseUrl', e.target.value)} />
            </div>
          </>
        )}

        {/* REST — Manual */}
        {key === 'rest-external' && (
          <>
            <div style={fieldGroup}>
              <label style={label}>Display Name</label>
              <input style={input} value={form.restDisplayName} onChange={(e) => set('restDisplayName', e.target.value)} />
            </div>
            <div style={fieldGroup}>
              <label style={label}>Base URL</label>
              <input style={input} placeholder="https://api.myservice.com/v2" value={form.restBaseUrl} onChange={(e) => set('restBaseUrl', e.target.value)} />
            </div>
            <div style={fieldGroup}>
              <label style={label}>Description</label>
              <textarea style={textarea} value={form.restDescription} onChange={(e) => set('restDescription', e.target.value)} placeholder="Describe this API…" />
            </div>
            <div style={fieldGroup}>
              <label style={label}>Endpoints to Register</label>
              {form.restEndpoints.map((ep, idx) => (
                <div key={idx} style={{ display: 'flex', gap: 8, marginBottom: 8, alignItems: 'center' }}>
                  <select
                    style={{ ...select, width: 100, flexShrink: 0 }}
                    value={ep.method}
                    onChange={(e) => updateEndpointRow(idx, 'method', e.target.value)}
                  >
                    <option value="GET">GET</option>
                    <option value="POST">POST</option>
                    <option value="PUT">PUT</option>
                    <option value="DELETE">DELETE</option>
                  </select>
                  <input style={{ ...input, flex: 1 }} placeholder="/path/{id}" value={ep.path} onChange={(e) => updateEndpointRow(idx, 'path', e.target.value)} />
                  <input style={{ ...input, flex: 1 }} placeholder="Description" value={ep.description} onChange={(e) => updateEndpointRow(idx, 'description', e.target.value)} />
                  {form.restEndpoints.length > 1 && (
                    <button type="button" style={{ ...closeBtn, fontSize: 14, padding: '2px 6px' }} onClick={() => removeEndpointRow(idx)}>✕</button>
                  )}
                </div>
              ))}
              <button type="button" style={{ ...btnSecondary, padding: '6px 14px', fontSize: 12 }} onClick={addEndpointRow}>+ Add endpoint</button>
            </div>
          </>
        )}

        {/* SaaS Connector */}
        {form.toolType === 'saas' && !form.saasConnector && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 10 }}>
            {saasConnectors.map((c) => (
              <div
                key={c.id}
                style={sourceCardStyle('#b388ff', form.saasConnector === c.id)}
                onClick={() => set('saasConnector', c.id)}
              >
                <div style={{ fontSize: 24, marginBottom: 6 }}>{c.icon}</div>
                <div style={{ fontSize: 13, fontWeight: 600, color: '#fff', marginBottom: 2 }}>{c.name}</div>
                <div style={{ fontSize: 11, color: '#888' }}>{c.sub}</div>
              </div>
            ))}
          </div>
        )}

        {form.toolType === 'saas' && form.saasConnector && (
          <>
            <div style={{ marginBottom: 16 }}>
              <span style={badge('rgba(179,136,255,0.15)', '#b388ff')}>
                {saasConnectors.find((c) => c.id === form.saasConnector)?.name}
              </span>
              <button type="button" style={{ background: 'none', border: 'none', color: '#888', fontSize: 12, cursor: 'pointer', marginLeft: 8 }} onClick={() => set('saasConnector', '')}>
                Change
              </button>
            </div>
            <div style={fieldGroup}>
              <label style={label}>Instance URL</label>
              <input
                style={input}
                placeholder={form.saasConnector === 'salesforce' ? 'mycompany.salesforce.com' : form.saasConnector === 'servicenow' ? 'mycompany.service-now.com' : 'instance.example.com'}
                value={form.saasInstanceUrl}
                onChange={(e) => set('saasInstanceUrl', e.target.value)}
              />
            </div>
            <div style={fieldGroup}>
              <label style={label}>Scope — Available Operations</label>
              <div style={{ backgroundColor: '#1a1a1a', border: '1px solid #333', borderRadius: 6, padding: 8, maxHeight: 180, overflowY: 'auto' }}>
                {(saasScopes[form.saasConnector] || []).map((s) => (
                  <label key={s} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '4px 8px', cursor: 'pointer', color: '#ccc', fontSize: 13 }}>
                    <input type="checkbox" checked={form.saasScopes.includes(s)} onChange={() => toggleArrayItem('saasScopes', s)} />
                    {s}
                  </label>
                ))}
              </div>
            </div>
          </>
        )}

        {/* Convert API → MCP */}
        {form.toolSource === 'convert' && (
          <>
            <div style={fieldGroup}>
              <label style={label}>Source API</label>
              <select style={select} value={form.convertSourceApi} onChange={(e) => set('convertSourceApi', e.target.value)}>
                <option value="">Select existing REST API or enter new…</option>
                {existingRestApis.map((a) => <option key={a} value={a}>{a}</option>)}
                <option value="__new">+ Register new API</option>
              </select>
            </div>
            <div style={fieldGroup}>
              <label style={label}>OpenAPI Spec URL</label>
              <input style={input} placeholder="https://api.myservice.com/openapi.yaml" value={form.convertSpecUrl} onChange={(e) => set('convertSpecUrl', e.target.value)} />
            </div>
            <div style={fieldGroup}>
              <label style={label}>MCP Server Name</label>
              <input style={input} placeholder="my-service-mcp" value={form.convertMcpName} onChange={(e) => set('convertMcpName', e.target.value)} />
            </div>
            <div style={{ ...fieldGroup, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div>
                <div style={{ fontSize: 13, fontWeight: 600, color: '#e0e0e0' }}>Auto-generate tool descriptions</div>
                <div style={{ fontSize: 12, color: '#888' }}>Use AI to generate semantic descriptions for each tool</div>
              </div>
              <ToggleButton on={form.convertAutoDescriptions} onToggle={() => set('convertAutoDescriptions', !form.convertAutoDescriptions)} />
            </div>
            {form.convertMcpName && (
              <div style={fieldGroup}>
                <label style={label}>Preview — Generated MCP Tools</label>
                <div style={{ backgroundColor: '#1a1a1a', border: '1px solid #333', borderRadius: 6, padding: 12 }}>
                  {convertPreviewTools.map((t) => (
                    <div key={t.name} style={{ padding: '6px 0', borderBottom: '1px solid #262626' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 2 }}>
                        <span style={{ fontFamily: 'monospace', color: '#9cdcfe', fontSize: 12 }}>{t.name}</span>
                        <span style={badge('rgba(96,205,255,0.1)', '#60cdff')}>{t.method}</span>
                        <span style={{ fontFamily: 'monospace', color: '#666', fontSize: 11 }}>{t.path}</span>
                      </div>
                      <div style={{ fontSize: 11, color: '#888', paddingLeft: 2 }}>{t.desc}</div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </>
        )}

        {/* Generic fallback for unhandled combos (foundry for rest/saas) */}
        {form.toolType === 'rest' && form.toolSource === 'foundry' && (
          <>
            <div style={fieldGroup}>
              <label style={label}>Foundry Project</label>
              <select style={select} value={form.foundryProject} onChange={(e) => set('foundryProject', e.target.value)}>
                <option value="">Select Foundry project…</option>
                <option value="contoso-ai-prod">contoso-ai-prod</option>
                <option value="retail-ai">retail-ai</option>
              </select>
            </div>
            <div style={infoBox}>Import from Foundry will discover REST API tools registered in your project and add them to the governed catalog.</div>
          </>
        )}
      </>
    );
  };

  // Step 3: Authentication
  const renderAuthStep = () => (
    <>
      <div style={title}>Configure authentication</div>
      <div style={subtitle}>Define how the gateway authenticates with the upstream tool endpoint</div>

      <div style={fieldGroup}>
        <label style={label}>Auth Method</label>
        <select style={select} value={form.authMethod} onChange={(e) => set('authMethod', e.target.value as AuthMethod)}>
          <option value="none">None</option>
          <option value="apikey">API Key</option>
          <option value="oauth2">OAuth 2.0</option>
          <option value="managed-identity">Managed Identity</option>
          <option value="entra-token">Entra Token</option>
          <option value="custom-header">Custom Header</option>
        </select>
      </div>

      {form.authMethod === 'apikey' && (
        <>
          <div style={fieldGroup}>
            <label style={label}>Header Name</label>
            <input style={input} value={form.apiKeyHeader} onChange={(e) => set('apiKeyHeader', e.target.value)} />
          </div>
          <div style={fieldGroup}>
            <label style={label}>Key Format</label>
            <select style={select} value={form.apiKeyFormat} onChange={(e) => set('apiKeyFormat', e.target.value)}>
              <option value="Bearer">Bearer</option>
              <option value="Basic">Basic</option>
              <option value="Raw">Raw</option>
            </select>
          </div>
          <div style={fieldGroup}>
            <label style={label}>Credential</label>
            <select style={select} value={form.apiKeyCredential} onChange={(e) => set('apiKeyCredential', e.target.value)}>
              <option value="">Select existing credential…</option>
              {credentialOptions.map((c) => <option key={c} value={c}>{c}</option>)}
              <option value="__new">+ Create new credential</option>
            </select>
          </div>
        </>
      )}

      {form.authMethod === 'oauth2' && (
        <>
          <div style={fieldGroup}>
            <label style={label}>Token URL</label>
            <input style={input} placeholder="https://login.microsoftonline.com/{tenant}/oauth2/v2.0/token" value={form.oauthTokenUrl} onChange={(e) => set('oauthTokenUrl', e.target.value)} />
          </div>
          <div style={fieldGroup}>
            <label style={label}>Client ID (from credential store)</label>
            <select style={select} value={form.oauthClientId} onChange={(e) => set('oauthClientId', e.target.value)}>
              <option value="">Select credential…</option>
              {credentialOptions.map((c) => <option key={c} value={c}>{c}</option>)}
              <option value="__new">+ Create new credential</option>
            </select>
          </div>
          <div style={fieldGroup}>
            <label style={label}>Scopes</label>
            <input style={input} placeholder="api://my-api/.default" value={form.oauthScopes} onChange={(e) => set('oauthScopes', e.target.value)} />
          </div>
          <div style={fieldGroup}>
            <label style={label}>Grant Type</label>
            <select style={select} value={form.oauthGrantType} onChange={(e) => set('oauthGrantType', e.target.value)}>
              <option value="client_credentials">client_credentials</option>
              <option value="authorization_code">authorization_code</option>
            </select>
          </div>
        </>
      )}

      {form.authMethod === 'managed-identity' && (
        <>
          <div style={fieldGroup}>
            <label style={label}>Resource URI</label>
            <input style={input} placeholder="https://management.azure.com/" value={form.managedIdentityResourceUri} onChange={(e) => set('managedIdentityResourceUri', e.target.value)} />
          </div>
          <div style={fieldGroup}>
            <label style={label}>Managed Identity Type</label>
            <select style={select} value={form.managedIdentityType} onChange={(e) => set('managedIdentityType', e.target.value)}>
              <option value="system">System-assigned</option>
              <option value="user">User-assigned</option>
            </select>
          </div>
        </>
      )}

      {form.authMethod === 'entra-token' && (
        <>
          <div style={fieldGroup}>
            <label style={label}>Tenant ID</label>
            <input style={input} placeholder="00000000-0000-0000-0000-000000000000" value={form.entraTokenTenantId} onChange={(e) => set('entraTokenTenantId', e.target.value)} />
          </div>
          <div style={fieldGroup}>
            <label style={label}>App ID</label>
            <input style={input} value={form.entraTokenAppId} onChange={(e) => set('entraTokenAppId', e.target.value)} />
          </div>
          <div style={fieldGroup}>
            <label style={label}>Resource URI</label>
            <input style={input} placeholder="api://my-app" value={form.entraTokenResourceUri} onChange={(e) => set('entraTokenResourceUri', e.target.value)} />
          </div>
        </>
      )}

      {form.authMethod === 'custom-header' && (
        <>
          <div style={fieldGroup}>
            <label style={label}>Header Name</label>
            <input style={input} placeholder="X-Custom-Auth" value={form.customHeaderName} onChange={(e) => set('customHeaderName', e.target.value)} />
          </div>
          <div style={fieldGroup}>
            <label style={label}>Credential Reference</label>
            <select style={select} value={form.customHeaderCredential} onChange={(e) => set('customHeaderCredential', e.target.value)}>
              <option value="">Select credential…</option>
              {credentialOptions.map((c) => <option key={c} value={c}>{c}</option>)}
              <option value="__new">+ Create new credential</option>
            </select>
          </div>
        </>
      )}

      {form.authMethod !== 'none' && (
        <div style={infoBox}>
          🔒 <strong>Credential mediation</strong> — The gateway will inject credentials on every request. Consumers never see the upstream credentials.
        </div>
      )}
    </>
  );

  // Step 4: Governance Policies
  const renderPoliciesStep = () => (
    <>
      <div style={title}>Apply governance policies</div>
      <div style={subtitle}>Configure the policies that will govern invocations of this tool</div>

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

      {/* Tool Allowlist */}
      <div style={policyCard(form.toolAllowlist)}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <div style={{ fontSize: 14, fontWeight: 600, color: '#fff' }}>Tool Allowlist</div>
            <div style={{ fontSize: 12, color: '#888' }}>Only approved consumers can invoke this tool</div>
          </div>
          <ToggleButton on={form.toolAllowlist} onToggle={() => set('toolAllowlist', !form.toolAllowlist)} />
        </div>
        {form.toolAllowlist && (
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

      {/* Execution Auditing */}
      <div style={policyCard(form.executionAuditing)}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <div style={{ fontSize: 14, fontWeight: 600, color: '#fff' }}>Execution Auditing</div>
            <div style={{ fontSize: 12, color: '#888' }}>Log all tool invocations for compliance and debugging</div>
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
              <input type="checkbox" checked={form.logTiming} onChange={() => set('logTiming', !form.logTiming)} />
              Log timing
            </div>
          </div>
        )}
      </div>

      {/* Outbound Network Restrictions */}
      <div style={policyCard(form.networkRestrictions)}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <div style={{ fontSize: 14, fontWeight: 600, color: '#fff' }}>Outbound Network Restrictions</div>
            <div style={{ fontSize: 12, color: '#888' }}>Restrict outbound domains this tool can reach</div>
          </div>
          <ToggleButton on={form.networkRestrictions} onToggle={() => set('networkRestrictions', !form.networkRestrictions)} />
        </div>
        {form.networkRestrictions && (
          <div style={{ marginTop: 12 }}>
            <label style={label}>Allowed Domains</label>
            <div style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
              <input
                style={{ ...input, flex: 1 }}
                placeholder="*.salesforce.com"
                value={domainInput}
                onChange={(e) => setDomainInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addDomain())}
              />
              <button type="button" style={{ ...btnSecondary, padding: '8px 14px' }} onClick={addDomain}>Add</button>
            </div>
            <div>
              {form.allowedDomains.map((d) => (
                <span key={d} style={tagStyle}>
                  {d}
                  <span style={{ cursor: 'pointer', marginLeft: 2 }} onClick={() => set('allowedDomains', form.allowedDomains.filter((x) => x !== d))}>×</span>
                </span>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Data Classification */}
      <div style={policyCard(true)}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
          <div>
            <div style={{ fontSize: 14, fontWeight: 600, color: '#fff' }}>Data Classification</div>
            <div style={{ fontSize: 12, color: '#888' }}>Classify the sensitivity of data this tool accesses</div>
          </div>
        </div>
        <select style={{ ...select, width: 200, marginBottom: 8 }} value={form.dataClassification} onChange={(e) => {
          const val = e.target.value as DataClassification;
          set('dataClassification', val);
          if (val === 'confidential' || val === 'restricted') set('piiScanning', true);
        }}>
          <option value="public">Public</option>
          <option value="internal">Internal</option>
          <option value="confidential">Confidential</option>
          <option value="restricted">Restricted</option>
        </select>
        {(form.dataClassification === 'confidential' || form.dataClassification === 'restricted') && (
          <div style={{ ...infoBox, marginTop: 8, marginBottom: 0 }}>
            🔍 PII scanning auto-enabled for {form.dataClassification} data classification
          </div>
        )}
      </div>

      {/* Timeout */}
      <div style={policyCard(true)}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <div style={{ fontSize: 14, fontWeight: 600, color: '#fff' }}>Timeout</div>
            <div style={{ fontSize: 12, color: '#888' }}>Maximum execution time for each invocation</div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <input style={{ ...input, width: 80, textAlign: 'right' }} type="number" value={form.timeout} onChange={(e) => set('timeout', Number(e.target.value))} />
            <span style={{ color: '#888', fontSize: 13 }}>seconds</span>
          </div>
        </div>
      </div>
    </>
  );

  // Step 5: Namespace
  const renderNamespaceStep = () => (
    <>
      <div style={title}>Assign to namespace</div>
      <div style={subtitle}>Organize this tool within a governance namespace</div>

      <div style={fieldGroup}>
        <label style={label}>Namespace</label>
        <select style={select} value={form.namespace} onChange={(e) => {
          set('namespace', e.target.value);
          if (e.target.value === 'retail-support' || e.target.value === 'finance-analytics') {
            set('approvalRequired', true);
          }
        }}>
          <option value="">Select namespace…</option>
          {namespaces.map((n) => <option key={n} value={n}>{n}</option>)}
          <option value="__new">+ Create new namespace</option>
        </select>
      </div>

      <div style={fieldGroup}>
        <label style={label}>Visibility</label>
        <div style={{ display: 'flex', gap: 16 }}>
          {([['private', 'Private to namespace'], ['shared', 'Shared across organization'], ['public', 'Public']] as const).map(([v, lbl]) => (
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

      <div style={{ ...fieldGroup, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <div style={{ fontSize: 13, fontWeight: 600, color: '#e0e0e0' }}>Approval Required</div>
          <div style={{ fontSize: 12, color: '#888' }}>Require admin approval before consumers can invoke this tool</div>
        </div>
        <ToggleButton on={form.approvalRequired} onToggle={() => set('approvalRequired', !form.approvalRequired)} />
      </div>
    </>
  );

  // Step 6: Review
  const getToolTypeLabel = () => toolTypes.find((t) => t.id === form.toolType)?.name ?? '—';
  const getSourceLabel = () => toolSources.find((s) => s.id === form.toolSource)?.name ?? '—';
  const getToolDisplay = (): string => {
    if (form.toolType === 'mcp' && form.toolSource === 'external') return form.mcpDisplayName || '—';
    if (form.toolType === 'mcp' && form.toolSource === 'foundry') return form.foundryMcpServers.join(', ') || '—';
    if (form.toolType === 'rest' && form.toolSource === 'openapi') return `${form.openapiEndpoints.length} endpoints`;
    if (form.toolType === 'rest' && form.toolSource === 'external') return form.restDisplayName || '—';
    if (form.toolType === 'saas') return saasConnectors.find((c) => c.id === form.saasConnector)?.name ?? '—';
    if (form.toolSource === 'convert') return form.convertMcpName || '—';
    return '—';
  };

  const getEndpointDisplay = (): string => {
    if (form.toolType === 'mcp' && form.toolSource === 'external') return form.mcpUrl || '—';
    if (form.toolType === 'mcp' && form.toolSource === 'foundry') return `Foundry: ${form.foundryProject}`;
    if (form.toolType === 'rest' && form.toolSource === 'openapi') return form.openapiBaseUrl || form.openapiSpecUrl || '—';
    if (form.toolType === 'rest' && form.toolSource === 'external') return form.restBaseUrl || '—';
    if (form.toolType === 'saas') return form.saasInstanceUrl || '—';
    if (form.toolSource === 'convert') return form.convertSpecUrl || form.convertSourceApi || '—';
    return '—';
  };

  const authLabels: Record<AuthMethod, string> = {
    'none': 'None',
    'apikey': 'API Key',
    'oauth2': 'OAuth 2.0',
    'managed-identity': 'Managed Identity',
    'entra-token': 'Entra Token',
    'custom-header': 'Custom Header',
  };

  const enabledPolicies = [
    form.rateLimiting && `Rate Limiting (${form.rateLimit}/min)`,
    form.toolAllowlist && 'Tool Allowlist',
    form.executionAuditing && 'Execution Auditing',
    form.networkRestrictions && 'Network Restrictions',
    `Data: ${form.dataClassification.charAt(0).toUpperCase() + form.dataClassification.slice(1)}`,
    (form.dataClassification === 'confidential' || form.dataClassification === 'restricted') && 'PII Scanning',
    `Timeout: ${form.timeout}s`,
  ].filter(Boolean) as string[];

  const renderReviewStep = () => (
    <>
      <div style={title}>Review registration</div>
      <div style={subtitle}>Confirm the details below to add this tool to the governed catalog</div>

      <div style={reviewSection}>
        <div style={reviewLabel}>Tool Type &amp; Source</div>
        <div style={reviewValue}>
          <span style={badge(
            form.toolType === 'mcp' ? 'rgba(79,195,247,0.15)' :
            form.toolType === 'rest' ? 'rgba(102,187,106,0.15)' : 'rgba(179,136,255,0.15)',
            form.toolType === 'mcp' ? '#4fc3f7' :
            form.toolType === 'rest' ? '#66bb6a' : '#b388ff',
          )}>{getToolTypeLabel()}</span>
          <span style={badge('rgba(96,205,255,0.1)', '#60cdff')}>{getSourceLabel()}</span>
          <span style={{ marginLeft: 8 }}>{getToolDisplay()}</span>
        </div>
      </div>

      <div style={reviewSection}>
        <div style={reviewLabel}>Endpoint</div>
        <div style={{ ...reviewValue, fontFamily: 'monospace', fontSize: 12, color: '#9cdcfe' }}>
          {getEndpointDisplay()}
        </div>
        {form.toolType === 'mcp' && form.toolSource === 'external' && (
          <div style={{ marginTop: 4 }}>
            <span style={{ fontSize: 11, color: '#888' }}>Transport: </span>
            <span style={badge('rgba(96,205,255,0.1)', '#60cdff')}>{form.mcpTransport.toUpperCase()}</span>
            <span style={{ fontSize: 11, color: '#888', marginLeft: 12 }}>Tools: </span>
            <span style={{ fontSize: 12, color: '#ccc' }}>{form.mcpTools.join(', ')}</span>
          </div>
        )}
      </div>

      <div style={reviewSection}>
        <div style={reviewLabel}>Authentication</div>
        <div style={reviewValue}>
          <span style={badge('rgba(96,205,255,0.1)', '#60cdff')}>{authLabels[form.authMethod]}</span>
          {form.authMethod === 'oauth2' && form.oauthGrantType && (
            <span style={{ marginLeft: 8, color: '#aaa', fontSize: 12 }}>({form.oauthGrantType})</span>
          )}
        </div>
      </div>

      <div style={reviewSection}>
        <div style={reviewLabel}>Governance Policies ({enabledPolicies.length})</div>
        <div style={reviewValue}>
          {enabledPolicies.map((p) => <span key={p} style={badge('rgba(96,205,255,0.1)', '#60cdff')}>{p}</span>)}
        </div>
      </div>

      <div style={reviewSection}>
        <div style={reviewLabel}>Namespace</div>
        <div style={reviewValue}>
          <span style={{ fontFamily: 'monospace', fontSize: 12, color: '#9cdcfe' }}>{form.namespace || '—'}</span>
          <span style={{
            ...badge(
              form.visibility === 'shared' ? 'rgba(255,183,77,0.12)' :
              form.visibility === 'public' ? 'rgba(14,147,73,0.15)' : 'rgba(96,205,255,0.1)',
              form.visibility === 'shared' ? '#ffb74d' :
              form.visibility === 'public' ? '#4caf50' : '#60cdff',
            ),
            marginLeft: 8,
          }}>
            {form.visibility.charAt(0).toUpperCase() + form.visibility.slice(1)}
          </span>
          {form.approvalRequired && (
            <span style={{ ...badge('rgba(255,183,77,0.12)', '#ffb74d'), marginLeft: 4 }}>Approval required</span>
          )}
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
          <div style={{ fontSize: 15, fontWeight: 700, color: '#e0e0e0' }}>Register Tool for Governance</div>
          <button style={closeBtn} onClick={onClose} title="Close">✕</button>
        </div>

        {/* Step bar */}
        {renderStepBar()}

        {/* Body */}
        <div style={bodyStyle}>
          {step === 1 && renderTypeStep()}
          {step === 2 && renderEndpointStep()}
          {step === 3 && renderAuthStep()}
          {step === 4 && renderPoliciesStep()}
          {step === 5 && renderNamespaceStep()}
          {step === 6 && renderReviewStep()}
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
              Register Tool
            </button>
          )}
        </div>
      </div>
    </div>,
    document.body
  );
}

export default RegisterTool;
