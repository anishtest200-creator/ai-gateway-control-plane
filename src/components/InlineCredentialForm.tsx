import { useState } from 'react';
import type { CSSProperties } from 'react';

interface InlineCredentialFormProps {
  onSave: (credentialName: string) => void;
  onCancel: () => void;
}

const formWrap: CSSProperties = {
  backgroundColor: '#1a1a1a',
  border: '1px solid rgba(212,168,67,0.25)',
  borderRadius: 8,
  padding: 16,
  marginTop: 8,
};

const fieldGroup: CSSProperties = { marginBottom: 12 };
const labelStyle: CSSProperties = { color: '#999', fontSize: 12, marginBottom: 4, display: 'block' };
const inputStyle: CSSProperties = {
  width: '100%', backgroundColor: '#0F0F0F', border: '1px solid rgba(212,168,67,0.15)',
  color: '#E8E8E8', padding: '8px 12px', borderRadius: 6, fontSize: 13, fontFamily: 'inherit',
  boxSizing: 'border-box' as const,
};
const selectStyle: CSSProperties = {
  ...inputStyle, cursor: 'pointer',
};
const row: CSSProperties = { display: 'flex', gap: 10 };

const namespaces = ['retail-support', 'finance-analytics', 'customer-ops', 'hr-automation', 'dev-sandbox', 'Global'];

export default function InlineCredentialForm({ onSave, onCancel }: InlineCredentialFormProps) {
  const [name, setName] = useState('');
  const [type, setType] = useState('API Key');
  const [provider, setProvider] = useState('');
  const [namespace, setNamespace] = useState('retail-support');
  const [expires, setExpires] = useState('');

  const canSave = name.trim() !== '' && provider.trim() !== '';

  return (
    <div style={formWrap}>
      <div style={{ fontSize: 13, fontWeight: 600, color: '#D4A843', marginBottom: 12, display: 'flex', alignItems: 'center', gap: 6 }}>
        🔑 Create New Credential
      </div>

      <div style={row}>
        <div style={{ ...fieldGroup, flex: 1 }}>
          <label style={labelStyle}>Credential Name</label>
          <input style={inputStyle} placeholder="e.g. azure-openai-prod-key" value={name} onChange={e => setName(e.target.value)} />
        </div>
        <div style={{ ...fieldGroup, flex: 1 }}>
          <label style={labelStyle}>Type</label>
          <select style={selectStyle} value={type} onChange={e => setType(e.target.value)}>
            <option>API Key</option>
            <option>OAuth 2.0</option>
            <option>Managed Identity</option>
            <option>Service Account</option>
            <option>IAM Role</option>
            <option>Connection String</option>
          </select>
        </div>
      </div>

      <div style={row}>
        <div style={{ ...fieldGroup, flex: 1 }}>
          <label style={labelStyle}>Provider / Target</label>
          <input style={inputStyle} placeholder="e.g. Azure OpenAI (East US)" value={provider} onChange={e => setProvider(e.target.value)} />
        </div>
        <div style={{ ...fieldGroup, flex: 1 }}>
          <label style={labelStyle}>Namespace</label>
          <select style={selectStyle} value={namespace} onChange={e => setNamespace(e.target.value)}>
            {namespaces.map(ns => <option key={ns} value={ns}>{ns}</option>)}
          </select>
        </div>
      </div>

      <div style={fieldGroup}>
        <label style={labelStyle}>Expires</label>
        <input type="date" style={inputStyle} value={expires} onChange={e => setExpires(e.target.value)} />
      </div>

      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 4 }}>
        <button
          onClick={onCancel}
          style={{ backgroundColor: 'transparent', color: '#ccc', border: '1px solid rgba(212,168,67,0.10)', borderRadius: 6, padding: '6px 14px', fontSize: 12, cursor: 'pointer', fontFamily: 'inherit' }}
        >
          Cancel
        </button>
        <button
          onClick={() => canSave && onSave(name.trim())}
          style={{
            backgroundColor: canSave ? '#D4A843' : '#555', color: canSave ? '#0A0A0A' : '#999',
            border: 'none', borderRadius: 6, padding: '6px 14px', fontSize: 12, fontWeight: 600,
            cursor: canSave ? 'pointer' : 'not-allowed', fontFamily: 'inherit',
          }}
        >
          Create & Use
        </button>
      </div>
    </div>
  );
}
