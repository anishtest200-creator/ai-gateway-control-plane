import { useState } from 'react';
import type { CSSProperties } from 'react';

interface ConnectFoundryPanelProps {
  connectedProjects: string[];
  selectedProject: string;
  onSelectProject: (project: string) => void;
  onConnectProject: (project: string) => void;
}

const fieldGroup: CSSProperties = { marginBottom: 12 };
const labelStyle: CSSProperties = { color: '#999', fontSize: 12, marginBottom: 4, display: 'block' };
const inputStyle: CSSProperties = {
  width: '100%', backgroundColor: '#0F0F0F', border: '1px solid rgba(129, 140, 248,0.15)',
  color: '#E8E8E8', padding: '8px 12px', borderRadius: 6, fontSize: 13, fontFamily: 'inherit',
  boxSizing: 'border-box' as const,
};
const selectStyle: CSSProperties = { ...inputStyle, cursor: 'pointer' };

export default function ConnectFoundryPanel({
  connectedProjects,
  selectedProject,
  onSelectProject,
  onConnectProject,
}: ConnectFoundryPanelProps) {
  const [showConnect, setShowConnect] = useState(false);
  const [connectForm, setConnectForm] = useState({
    projectName: '',
    subscriptionId: '',
    resourceGroup: '',
  });
  const [connecting, setConnecting] = useState(false);
  const [connected, setConnected] = useState(false);

  const canConnect = connectForm.projectName.trim() !== '' && connectForm.subscriptionId.trim() !== '';

  const handleConnect = () => {
    setConnecting(true);
    // Simulate connection delay
    setTimeout(() => {
      setConnecting(false);
      setConnected(true);
      onConnectProject(connectForm.projectName.trim());
      onSelectProject(connectForm.projectName.trim());
      setTimeout(() => {
        setShowConnect(false);
        setConnected(false);
        setConnectForm({ projectName: '', subscriptionId: '', resourceGroup: '' });
      }, 1500);
    }, 1500);
  };

  return (
    <div style={fieldGroup}>
      <label style={labelStyle}>Foundry Project</label>
      <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
        <select
          style={{ ...selectStyle, flex: 1 }}
          value={selectedProject}
          onChange={(e) => {
            if (e.target.value === '__connect') {
              setShowConnect(true);
            } else {
              onSelectProject(e.target.value);
            }
          }}
        >
          <option value="">Select connected project…</option>
          {connectedProjects.map((p) => (
            <option key={p} value={p}>{p}</option>
          ))}
          <option value="__connect">+ Connect new Foundry project</option>
        </select>
      </div>

      {connectedProjects.length === 0 && !showConnect && (
        <div style={{
          marginTop: 8, padding: '12px 14px', borderRadius: 6,
          backgroundColor: 'rgba(129, 140, 248,0.06)', border: '1px solid rgba(129, 140, 248,0.15)',
        }}>
          <div style={{ fontSize: 12, color: '#818CF8', fontWeight: 600, marginBottom: 4 }}>No Foundry projects connected</div>
          <div style={{ fontSize: 11, color: '#999' }}>
            Connect an Azure AI Foundry project to discover and import assets into the gateway.
          </div>
          <button
            onClick={() => setShowConnect(true)}
            style={{
              marginTop: 8, backgroundColor: '#818CF8', color: '#FFFFFF', border: 'none',
              borderRadius: 6, padding: '6px 14px', fontSize: 12, fontWeight: 600,
              cursor: 'pointer', fontFamily: 'inherit',
            }}
          >
            Connect Foundry Project
          </button>
        </div>
      )}

      {showConnect && (
        <div style={{
          marginTop: 8, padding: 16, borderRadius: 8,
          backgroundColor: '#1a1a1a', border: '1px solid rgba(129, 140, 248,0.25)',
        }}>
          <div style={{ fontSize: 13, fontWeight: 600, color: '#818CF8', marginBottom: 12, display: 'flex', alignItems: 'center', gap: 6 }}>
            ◆ Connect Azure AI Foundry Project
          </div>

          <div style={fieldGroup}>
            <label style={labelStyle}>Project Name</label>
            <input
              style={inputStyle}
              placeholder="e.g. contoso-ai-prod"
              value={connectForm.projectName}
              onChange={(e) => setConnectForm((f) => ({ ...f, projectName: e.target.value }))}
            />
          </div>

          <div style={{ display: 'flex', gap: 10 }}>
            <div style={{ ...fieldGroup, flex: 1 }}>
              <label style={labelStyle}>Subscription ID</label>
              <input
                style={inputStyle}
                placeholder="00000000-0000-0000-0000-000000000000"
                value={connectForm.subscriptionId}
                onChange={(e) => setConnectForm((f) => ({ ...f, subscriptionId: e.target.value }))}
              />
            </div>
            <div style={{ ...fieldGroup, flex: 1 }}>
              <label style={labelStyle}>Resource Group</label>
              <input
                style={inputStyle}
                placeholder="rg-ai-prod"
                value={connectForm.resourceGroup}
                onChange={(e) => setConnectForm((f) => ({ ...f, resourceGroup: e.target.value }))}
              />
            </div>
          </div>

          <div style={{
            padding: '8px 12px', borderRadius: 6, fontSize: 11, color: '#999',
            backgroundColor: 'rgba(96,205,255,0.06)', border: '1px solid rgba(96,205,255,0.10)',
            marginBottom: 12,
          }}>
            🔗 The gateway will use Managed Identity to authenticate with Foundry. Ensure the gateway's identity has <strong style={{ color: '#60cdff' }}>Cognitive Services User</strong> role on the Foundry resource.
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
            <button
              onClick={() => { setShowConnect(false); setConnectForm({ projectName: '', subscriptionId: '', resourceGroup: '' }); }}
              style={{
                backgroundColor: 'transparent', color: '#ccc', border: '1px solid rgba(129, 140, 248,0.10)',
                borderRadius: 6, padding: '6px 14px', fontSize: 12, cursor: 'pointer', fontFamily: 'inherit',
              }}
            >
              Cancel
            </button>
            <button
              onClick={() => canConnect && !connecting && handleConnect()}
              style={{
                backgroundColor: connected ? '#4ADE80' : canConnect && !connecting ? '#818CF8' : '#555',
                color: connected ? '#0A0A0A' : canConnect ? '#0A0A0A' : '#999',
                border: 'none', borderRadius: 6, padding: '6px 14px', fontSize: 12, fontWeight: 600,
                cursor: canConnect && !connecting ? 'pointer' : 'not-allowed', fontFamily: 'inherit',
                minWidth: 120,
              }}
            >
              {connecting ? 'Connecting…' : connected ? '✓ Connected!' : 'Connect & Discover'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
