import React, { useState, useEffect, type CSSProperties, type FC } from 'react';
import { useNavigate } from 'react-router-dom';

interface DocsPageProps {
  onLogin: () => void;
  onSignup: () => void;
}

/* ─── palette (matches LandingPage) ─── */
const C = {
  bg: '#0A0A0A', bgDeep: '#050505', gold: '#D4A843', goldDim: '#B8923A',
  amber: '#F59E0B', purple: '#A78BFA', blue: '#60A5FA', pink: '#f472b6',
  white: '#fff', gray: '#b0b0b0', green: '#4ADE80',
  cardBg: 'rgba(212, 168, 67, 0.05)', cardBorder: 'rgba(212, 168, 67, 0.10)',
  font: "'Segoe UI', system-ui, -apple-system, sans-serif",
};

/* ─── reusable style factories ─── */
const glassCard: CSSProperties = {
  background: C.cardBg,
  border: `1px solid ${C.cardBorder}`,
  borderRadius: 16,
  backdropFilter: 'blur(12px)',
  WebkitBackdropFilter: 'blur(12px)',
};

const btnSolid: CSSProperties = {
  padding: '14px 32px',
  fontSize: 16,
  fontWeight: 600,
  fontFamily: C.font,
  color: '#0A0A0A',
  background: C.gold,
  border: 'none',
  borderRadius: 8,
  cursor: 'pointer',
  boxShadow: `0 0 24px ${C.gold}66`,
  transition: 'transform .15s, box-shadow .15s',
};

const btnOutline: CSSProperties = {
  ...btnSolid,
  color: C.white,
  background: 'transparent',
  border: `1.5px solid ${C.cardBorder}`,
  boxShadow: 'none',
};

/* ─── data ─── */

const quickStartCards = [
  {
    icon: '🚀', title: '5-Minute Quickstart',
    desc: 'Deploy the gateway and route your first AI request.',
    steps: ['Install', 'Configure', 'Route', 'Verify'],
    btn: 'Get Started', accent: C.gold,
  },
  {
    icon: '🔧', title: 'Configuration Guide',
    desc: 'Set up routing rules, policies, credentials, and namespaces.',
    steps: ['azure.yaml', 'Environment Vars', 'Provider Setup', 'Validation'],
    btn: 'Read Guide', accent: C.amber,
  },
  {
    icon: '📡', title: 'API Reference',
    desc: 'Complete REST API for gateway management.',
    steps: ['Routes', 'Policies', 'Credentials', 'Namespaces'],
    btn: 'Explore API', accent: C.purple,
  },
];

interface DocTopic { icon: string; title: string; desc: string }

interface DocCategory { category: string; accent: string; topics: DocTopic[] }

const docCategories: DocCategory[] = [
  {
    category: 'Getting Started', accent: C.gold,
    topics: [
      { icon: '⚡', title: 'Quickstart Guide', desc: 'Deploy and route your first request in 5 minutes' },
      { icon: '🏗️', title: 'Architecture Overview', desc: 'How the gateway sits between consumers and providers' },
      { icon: '📐', title: 'Concepts', desc: 'Namespaces, policies, credentials, assets, routing rules' },
      { icon: '🔐', title: 'Authentication', desc: 'Setting up Entra ID, API keys, managed identities' },
    ],
  },
  {
    category: 'Routing & Traffic', accent: C.blue,
    topics: [
      { icon: '🔀', title: 'Routing Rules', desc: 'Configure provider routing, failover chains, weighted load balancing' },
      { icon: '🔄', title: 'Model Fallback', desc: 'Automatic failover when primary providers are unavailable' },
      { icon: '💾', title: 'Prompt Caching', desc: 'Reduce costs and latency with intelligent prompt caching' },
      { icon: '⚖️', title: 'Traffic Splitting', desc: 'A/B test models with percentage-based traffic splits' },
    ],
  },
  {
    category: 'Governance & Policies', accent: C.amber,
    topics: [
      { icon: '📝', title: 'Policy Authoring', desc: 'Create token limits, rate limits, and content safety rules' },
      { icon: '🔃', title: 'Policy Lifecycle', desc: 'Version, test, stage, and roll back policies safely' },
      { icon: '🏢', title: 'Namespace Governance', desc: 'Multi-tenant isolation with hierarchical policies' },
      { icon: '✅', title: 'Compliance', desc: 'SOC 2, HIPAA, GDPR evidence generation' },
    ],
  },
  {
    category: 'Security & Access', accent: C.pink,
    topics: [
      { icon: '🔑', title: 'Credential Management', desc: 'Managed identities, API key rotation, secret storage' },
      { icon: '🛡️', title: 'RBAC Configuration', desc: 'Role-based access control with Entra ID integration' },
      { icon: '🚫', title: 'Content Safety', desc: 'Prompt injection detection, PII filtering, toxicity guardrails' },
      { icon: '📋', title: 'Audit Logging', desc: 'Complete request/response audit trail' },
    ],
  },
  {
    category: 'Observability', accent: C.green,
    topics: [
      { icon: '📊', title: 'Metrics & Dashboards', desc: 'Token usage, latency, throughput, error rates' },
      { icon: '💰', title: 'Cost Attribution', desc: 'Per-namespace, per-consumer cost tracking and chargeback' },
      { icon: '🔍', title: 'Distributed Tracing', desc: 'End-to-end request tracing across providers' },
      { icon: '🔔', title: 'Alerting', desc: 'Budget alerts, anomaly detection, SLA monitoring' },
    ],
  },
  {
    category: 'Integration Guides', accent: C.purple,
    topics: [
      { icon: '☁️', title: 'Azure AI Foundry', desc: 'Use gateway alongside Foundry deployments' },
      { icon: '🟠', title: 'AWS Bedrock', desc: 'Route Bedrock model traffic through the gateway' },
      { icon: '🔵', title: 'Google Vertex AI', desc: 'Govern Vertex AI model access' },
      { icon: '🟢', title: 'OpenAI Direct', desc: 'Proxy OpenAI API calls with governance' },
      { icon: '🦜', title: 'LangChain / LlamaIndex', desc: 'Integrate with popular agent frameworks' },
      { icon: '🔌', title: 'MCP Servers', desc: 'Register and govern MCP tool servers' },
    ],
  },
];

const codeExamples: { tab: string; lang: string; code: string }[] = [
  {
    tab: 'cURL', lang: 'bash',
    code: `curl -X POST https://gateway.example.com/v1/chat/completions \\
  -H "Authorization: Bearer $GATEWAY_KEY" \\
  -H "X-Namespace: production" \\
  -d '{
    "model": "gpt-4o",
    "messages": [{"role": "user", "content": "Hello"}]
  }'`,
  },
  {
    tab: 'Python', lang: 'python',
    code: `import openai

client = openai.OpenAI(
    base_url="https://gateway.example.com/v1",
    api_key=GATEWAY_KEY,
    default_headers={"X-Namespace": "production"}
)

response = client.chat.completions.create(
    model="gpt-4o",
    messages=[{"role": "user", "content": "Hello"}]
)`,
  },
  {
    tab: 'TypeScript', lang: 'typescript',
    code: `import OpenAI from 'openai';

const client = new OpenAI({
  baseURL: 'https://gateway.example.com/v1',
  apiKey: GATEWAY_KEY,
  defaultHeaders: { 'X-Namespace': 'production' },
});

const response = await client.chat.completions.create({
  model: 'gpt-4o',
  messages: [{ role: 'user', content: 'Hello' }],
});`,
  },
];

const sdkCards = [
  { icon: '🐍', title: 'Python SDK', cmd: 'pip install ai-gateway', accent: C.green },
  { icon: '📘', title: 'TypeScript SDK', cmd: 'npm install @azure/ai-gateway', accent: C.blue },
  { icon: '⌨️', title: 'CLI Tool', cmd: 'brew install ai-gateway-cli', accent: C.gold },
  { icon: '🏗️', title: 'Terraform Provider', cmd: 'terraform-provider-aigateway', accent: C.purple },
  { icon: '⚙️', title: 'GitHub Actions', cmd: 'CI/CD integration for policy-as-code', accent: C.amber },
  { icon: '💡', title: 'VS Code Extension', cmd: 'IntelliSense for gateway configuration', accent: C.pink },
];

const communityLinks = [
  { icon: '💬', title: 'GitHub Discussions', desc: 'Ask questions, share patterns', accent: C.gold },
  { icon: '🎮', title: 'Discord Community', desc: 'Real-time help from the community', accent: C.purple },
  { icon: '🏢', title: 'Enterprise Support', desc: 'Dedicated support for Enterprise customers', accent: C.amber },
  { icon: '📚', title: 'Stack Overflow', desc: 'Tag: azure-ai-gateway', accent: C.blue },
];

/* ─── syntax highlight helpers ─── */
const highlightCode = (code: string, lang: string): React.ReactElement[] => {
  const keywords = lang === 'python'
    ? ['import', 'from', 'def', 'class', 'return', 'await', 'async']
    : lang === 'typescript'
      ? ['import', 'from', 'const', 'let', 'await', 'async', 'export', 'default', 'new']
      : ['curl'];

  return code.split('\n').map((line, li) => {
    const parts: React.ReactElement[] = [];
    let remaining = line;
    let key = 0;

    // Handle comments
    const commentIdx = lang === 'bash' ? remaining.indexOf('#') : -1;
    if (commentIdx >= 0) {
      const before = remaining.slice(0, commentIdx);
      const comment = remaining.slice(commentIdx);
      parts.push(<span key={key++}>{before}</span>);
      parts.push(<span key={key++} style={{ color: '#666' }}>{comment}</span>);
      return <div key={li} style={{ minHeight: '1.4em' }}>{parts}</div>;
    }

    // Handle strings
    const stringRegex = /("(?:[^"\\]|\\.)*"|'(?:[^'\\]|\\.)*')/g;
    let match: RegExpExecArray | null;
    let lastIdx = 0;

    while ((match = stringRegex.exec(remaining)) !== null) {
      const before = remaining.slice(lastIdx, match.index);
      // Keywords in the "before" segment
      const tokenized = tokenizeKeywords(before, keywords, key);
      parts.push(...tokenized.elements);
      key = tokenized.nextKey;
      parts.push(<span key={key++} style={{ color: C.gold }}>{match[0]}</span>);
      lastIdx = match.index + match[0].length;
    }
    const tail = remaining.slice(lastIdx);
    const tokenized = tokenizeKeywords(tail, keywords, key);
    parts.push(...tokenized.elements);
    key = tokenized.nextKey;

    return <div key={li} style={{ minHeight: '1.4em' }}>{parts}</div>;
  });
};

const tokenizeKeywords = (
  text: string,
  keywords: string[],
  startKey: number,
): { elements: React.ReactElement[]; nextKey: number } => {
  const elements: React.ReactElement[] = [];
  let k = startKey;
  if (!text) return { elements, nextKey: k };

  // Split on word boundaries and check each token
  const regex = /(\b\w+\b)/g;
  let lastIdx = 0;
  let match: RegExpExecArray | null;

  while ((match = regex.exec(text)) !== null) {
    if (match.index > lastIdx) {
      elements.push(<span key={k++}>{text.slice(lastIdx, match.index)}</span>);
    }
    if (keywords.includes(match[0])) {
      elements.push(<span key={k++} style={{ color: C.purple }}>{match[0]}</span>);
    } else {
      elements.push(<span key={k++}>{match[0]}</span>);
    }
    lastIdx = match.index + match[0].length;
  }
  if (lastIdx < text.length) {
    elements.push(<span key={k++}>{text.slice(lastIdx)}</span>);
  }
  return { elements, nextKey: k };
};

/* ─── component ─── */
const DocsPage: FC<DocsPageProps> = ({ onLogin, onSignup }) => {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState(0);
  const [hoveredCard, setHoveredCard] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  /* inject keyframes */
  useEffect(() => {
    if (document.getElementById('docs-page-keyframes')) return;
    const style = document.createElement('style');
    style.id = 'docs-page-keyframes';
    style.textContent = `
      @keyframes orbFloat {
        0%, 100% { transform: translate(-50%, -50%) scale(1); }
        33% { transform: translate(-45%, -55%) scale(1.05); }
        66% { transform: translate(-55%, -48%) scale(0.97); }
      }
      @keyframes orbFloat2 {
        0%, 100% { transform: translate(-50%, -50%) scale(1); }
        33% { transform: translate(-55%, -45%) scale(1.08); }
        66% { transform: translate(-42%, -52%) scale(0.95); }
      }
      @keyframes fadeInUp {
        from { opacity: 0; transform: translateY(20px); }
        to { opacity: 1; transform: translateY(0); }
      }
      @keyframes shimmer {
        0% { background-position: -200% center; }
        100% { background-position: 200% center; }
      }
    `;
    document.head.appendChild(style);
  }, []);

  const handleCopy = () => {
    navigator.clipboard.writeText(codeExamples[activeTab].code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const filteredCategories = docCategories.filter((cat) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    if (cat.category.toLowerCase().includes(q)) return true;
    return cat.topics.some(
      (t) => t.title.toLowerCase().includes(q) || t.desc.toLowerCase().includes(q),
    );
  });

  const navLinks = [
    { label: 'Home', path: '/' },
    { label: 'Pricing', path: '/pricing' },
    { label: 'Docs', path: '/docs' },
    { label: 'Demo', path: '/demo' },
  ];

  /* ── nav ── */
  const navBar = (
    <nav
      style={{
        position: 'fixed', top: 0, left: 0, right: 0, zIndex: 100,
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '0 48px', height: 64,
        background: 'rgba(10,10,10,0.85)',
        backdropFilter: 'blur(16px)', WebkitBackdropFilter: 'blur(16px)',
        borderBottom: '1px solid rgba(212, 168, 67, 0.06)',
        fontFamily: C.font,
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <span
          style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer' }}
          onClick={() => navigate('/')}
        >
          <span style={{ fontSize: 22 }}>⚡</span>
          <span style={{ color: C.gold, fontWeight: 700, fontSize: 17, letterSpacing: -0.3 }}>
            Azure AI Gateway
          </span>
        </span>
        <span
          style={{
            padding: '3px 10px', fontSize: 10, fontWeight: 700, color: C.gold,
            border: `1px solid ${C.gold}44`, borderRadius: 6,
            background: `${C.gold}12`, textTransform: 'uppercase', letterSpacing: '1px',
          }}
        >
          Preview
        </span>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: 32 }}>
        <div style={{ display: 'flex', gap: 24 }}>
          {navLinks.map((link) => (
            <span
              key={link.label}
              onClick={() => navigate(link.path)}
              style={{
                fontSize: 14, fontWeight: 500, color: link.path === '/docs' ? C.gold : C.gray,
                cursor: 'pointer', transition: 'color .15s', fontFamily: C.font,
              }}
              onMouseEnter={(e) => (e.currentTarget.style.color = C.white)}
              onMouseLeave={(e) => (e.currentTarget.style.color = link.path === '/docs' ? C.gold : C.gray)}
            >
              {link.label}
            </span>
          ))}
        </div>

        <div style={{ display: 'flex', gap: 12 }}>
          <button
            onClick={onLogin}
            style={{
              padding: '8px 20px', fontSize: 14, fontWeight: 600, fontFamily: C.font,
              color: C.white, background: 'transparent',
              border: `1.5px solid ${C.cardBorder}`, borderRadius: 6,
              cursor: 'pointer', transition: 'border-color .15s',
            }}
            onMouseEnter={(e) => (e.currentTarget.style.borderColor = C.white)}
            onMouseLeave={(e) => (e.currentTarget.style.borderColor = C.cardBorder)}
          >
            Sign In
          </button>
          <button
            onClick={onSignup}
            style={{
              padding: '8px 20px', fontSize: 14, fontWeight: 600, fontFamily: C.font,
              color: '#0A0A0A', background: C.gold, border: 'none', borderRadius: 6,
              cursor: 'pointer', boxShadow: `0 0 16px ${C.gold}55`, transition: 'box-shadow .15s',
            }}
            onMouseEnter={(e) => (e.currentTarget.style.boxShadow = `0 0 28px ${C.gold}99`)}
            onMouseLeave={(e) => (e.currentTarget.style.boxShadow = `0 0 16px ${C.gold}55`)}
          >
            Get Started
          </button>
        </div>
      </div>
    </nav>
  );

  /* ── 1. hero ── */
  const hero = (
    <section
      style={{
        minHeight: '40vh', display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center', textAlign: 'center',
        padding: '100px 24px 32px', position: 'relative', overflow: 'hidden',
      }}
    >
      <div
        style={{
          position: 'absolute', top: '30%', left: '50%',
          transform: 'translate(-50%, -50%)', width: 700, height: 700,
          background: `radial-gradient(circle, ${C.gold}22 0%, ${C.goldDim}08 40%, transparent 70%)`,
          pointerEvents: 'none', animation: 'orbFloat 8s ease-in-out infinite', filter: 'blur(40px)',
        }}
      />
      <div
        style={{
          position: 'absolute', top: '40%', left: '45%',
          transform: 'translate(-50%, -50%)', width: 500, height: 500,
          background: `radial-gradient(circle, ${C.goldDim}18 0%, ${C.gold}08 40%, transparent 70%)`,
          pointerEvents: 'none', animation: 'orbFloat2 10s ease-in-out infinite', filter: 'blur(60px)',
        }}
      />

      <div
        style={{
          padding: '6px 18px', fontSize: 11, fontWeight: 700, color: C.gold,
          border: `1px solid ${C.gold}33`, borderRadius: 20, fontFamily: C.font,
          textTransform: 'uppercase', letterSpacing: '2px', background: `${C.gold}08`,
          marginBottom: 24, animation: 'fadeInUp 0.6s ease-out',
        }}
      >
        ✦ Developer Docs
      </div>

      <h1
        style={{
          fontSize: 56, fontWeight: 800, lineHeight: 1.1, margin: 0, fontFamily: C.font,
          background: `linear-gradient(135deg, ${C.white} 0%, ${C.gold} 50%, ${C.goldDim} 100%)`,
          backgroundSize: '200% auto',
          WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
          maxWidth: 820, animation: 'fadeInUp 0.8s ease-out, shimmer 6s ease-in-out infinite',
        }}
      >
        Documentation
      </h1>

      <p
        style={{
          fontSize: 19, color: C.gray, maxWidth: 680, margin: '24px auto 0',
          lineHeight: 1.7, fontFamily: C.font, animation: 'fadeInUp 1s ease-out',
        }}
      >
        Everything you need to deploy, configure, and govern AI traffic through the gateway.
      </p>

      {/* search bar */}
      <div
        style={{
          marginTop: 28, position: 'relative', maxWidth: 560, width: '100%',
          animation: 'fadeInUp 1.2s ease-out',
        }}
      >
        <div
          style={{
            position: 'absolute', left: 18, top: '50%', transform: 'translateY(-50%)',
            fontSize: 18, pointerEvents: 'none', opacity: 0.5,
          }}
        >
          🔍
        </div>
        <input
          type="text"
          placeholder="Search documentation..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          style={{
            width: '100%', padding: '16px 20px 16px 48px',
            fontSize: 16, fontFamily: C.font, color: C.white,
            background: C.cardBg, border: `1px solid ${C.cardBorder}`,
            borderRadius: 12, outline: 'none',
            backdropFilter: 'blur(12px)', WebkitBackdropFilter: 'blur(12px)',
            boxShadow: `0 0 40px ${C.gold}08`,
            transition: 'border-color .2s, box-shadow .2s',
            boxSizing: 'border-box',
          }}
          onFocus={(e) => {
            e.currentTarget.style.borderColor = `${C.gold}55`;
            e.currentTarget.style.boxShadow = `0 0 40px ${C.gold}18`;
          }}
          onBlur={(e) => {
            e.currentTarget.style.borderColor = C.cardBorder;
            e.currentTarget.style.boxShadow = `0 0 40px ${C.gold}08`;
          }}
        />
      </div>
    </section>
  );

  /* ── 2. quick start cards ── */
  const quickStart = (
    <section style={{ padding: '0 24px 80px', maxWidth: 1100, margin: '0 auto' }}>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 24 }}>
        {quickStartCards.map((card) => {
          const isHov = hoveredCard === `qs-${card.title}`;
          return (
            <div
              key={card.title}
              onMouseEnter={() => setHoveredCard(`qs-${card.title}`)}
              onMouseLeave={() => setHoveredCard(null)}
              style={{
                ...glassCard, padding: '32px 28px',
                transition: 'transform .2s, border-color .2s, box-shadow .2s',
                transform: isHov ? 'translateY(-4px)' : 'none',
                borderColor: isHov ? `${card.accent}55` : C.cardBorder,
                boxShadow: isHov ? `0 8px 32px ${card.accent}1a` : 'none',
                cursor: 'pointer', borderTop: `2px solid ${card.accent}44`,
                position: 'relative', overflow: 'hidden',
              }}
            >
              <div
                style={{
                  position: 'absolute', top: -40, left: '50%', transform: 'translateX(-50%)',
                  width: 120, height: 80,
                  background: `radial-gradient(ellipse, ${card.accent}15 0%, transparent 70%)`,
                  pointerEvents: 'none',
                }}
              />
              <div
                style={{
                  width: 48, height: 48, borderRadius: 12,
                  background: `linear-gradient(135deg, ${card.accent}20 0%, ${card.accent}08 100%)`,
                  border: `1px solid ${card.accent}22`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 24, marginBottom: 16,
                }}
              >
                {card.icon}
              </div>
              <h3 style={{ fontSize: 18, fontWeight: 700, color: C.white, margin: '0 0 8px', fontFamily: C.font }}>
                {card.title}
              </h3>
              <p style={{ fontSize: 14, color: '#999', lineHeight: 1.7, margin: '0 0 16px', fontFamily: C.font }}>
                {card.desc}
              </p>
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 20 }}>
                {card.steps.map((step, i) => (
                  <span key={step} style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                    <span
                      style={{
                        fontSize: 11, fontWeight: 600, color: card.accent,
                        padding: '3px 10px', borderRadius: 20,
                        background: `${card.accent}10`, border: `1px solid ${card.accent}22`,
                        fontFamily: C.font,
                      }}
                    >
                      {step}
                    </span>
                    {i < card.steps.length - 1 && (
                      <span style={{ color: '#444', fontSize: 12 }}>→</span>
                    )}
                  </span>
                ))}
              </div>
              <button
                onClick={onSignup}
                style={{
                  padding: '10px 24px', fontSize: 13, fontWeight: 600, fontFamily: C.font,
                  color: '#0A0A0A', background: card.accent, border: 'none',
                  borderRadius: 6, cursor: 'pointer', transition: 'box-shadow .15s',
                  boxShadow: `0 0 16px ${card.accent}44`,
                }}
                onMouseEnter={(e) => (e.currentTarget.style.boxShadow = `0 0 28px ${card.accent}88`)}
                onMouseLeave={(e) => (e.currentTarget.style.boxShadow = `0 0 16px ${card.accent}44`)}
              >
                {card.btn}
              </button>
            </div>
          );
        })}
      </div>
    </section>
  );

  /* ── 3. documentation categories ── */
  const docsSection = (
    <section style={{ padding: '40px 24px 80px', maxWidth: 1100, margin: '0 auto' }}>
      <h2
        style={{
          textAlign: 'center', fontSize: 40, fontWeight: 700, color: C.white,
          margin: '0 0 16px', fontFamily: C.font,
        }}
      >
        Browse by <span style={{ color: C.gold }}>Topic</span>
      </h2>
      <p
        style={{
          textAlign: 'center', fontSize: 17, color: C.gray, margin: '0 auto 48px',
          maxWidth: 600, fontFamily: C.font, lineHeight: 1.7,
        }}
      >
        Comprehensive guides organized by topic to help you master every aspect of the AI Gateway.
      </p>

      {filteredCategories.length === 0 && (
        <div style={{ textAlign: 'center', padding: '60px 0', color: '#666', fontFamily: C.font, fontSize: 16 }}>
          No documentation matches "{searchQuery}". Try a different search term.
        </div>
      )}

      <div style={{ display: 'flex', flexDirection: 'column', gap: 48 }}>
        {filteredCategories.map((cat) => (
          <div key={cat.category}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
              <div
                style={{
                  width: 4, height: 24, borderRadius: 2,
                  background: `linear-gradient(180deg, ${cat.accent}, ${cat.accent}44)`,
                }}
              />
              <h3 style={{ fontSize: 22, fontWeight: 700, color: C.white, margin: 0, fontFamily: C.font }}>
                {cat.category}
              </h3>
            </div>

            <div
              style={{
                display: 'grid',
                gridTemplateColumns: cat.topics.length > 4 ? 'repeat(3, 1fr)' : 'repeat(4, 1fr)',
                gap: 16,
              }}
            >
              {cat.topics.map((topic) => {
                const isHov = hoveredCard === `${cat.category}-${topic.title}`;
                return (
                  <div
                    key={topic.title}
                    onMouseEnter={() => setHoveredCard(`${cat.category}-${topic.title}`)}
                    onMouseLeave={() => setHoveredCard(null)}
                    style={{
                      ...glassCard, padding: '20px',
                      transition: 'transform .2s, border-color .2s, box-shadow .2s',
                      transform: isHov ? 'translateY(-3px)' : 'none',
                      borderColor: isHov ? `${cat.accent}44` : C.cardBorder,
                      boxShadow: isHov ? `0 6px 24px ${cat.accent}12` : 'none',
                      cursor: 'pointer',
                    }}
                  >
                    <div style={{ fontSize: 22, marginBottom: 10 }}>{topic.icon}</div>
                    <h4 style={{ fontSize: 14, fontWeight: 700, color: C.white, margin: '0 0 6px', fontFamily: C.font }}>
                      {topic.title}
                    </h4>
                    <p style={{ fontSize: 12.5, color: '#888', lineHeight: 1.6, margin: 0, fontFamily: C.font }}>
                      {topic.desc}
                    </p>
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </section>
  );

  /* ── 4. code examples ── */
  const codeSection = (
    <section style={{ padding: '40px 24px 80px', maxWidth: 900, margin: '0 auto' }}>
      <h2
        style={{
          textAlign: 'center', fontSize: 36, fontWeight: 700, color: C.white,
          margin: '0 0 12px', fontFamily: C.font,
        }}
      >
        Start in <span style={{ color: C.gold }}>seconds</span>
      </h2>
      <p
        style={{
          textAlign: 'center', fontSize: 16, color: C.gray, margin: '0 auto 36px',
          fontFamily: C.font, maxWidth: 520,
        }}
      >
        Drop-in replacement for OpenAI SDK — just change the base URL.
      </p>

      <div
        style={{
          ...glassCard, overflow: 'hidden',
          boxShadow: `0 0 60px ${C.gold}08, inset 0 1px 0 rgba(212, 168, 67, 0.08)`,
        }}
      >
        {/* tabs */}
        <div
          style={{
            display: 'flex', borderBottom: `1px solid ${C.cardBorder}`,
            background: 'rgba(0,0,0,0.3)',
          }}
        >
          {codeExamples.map((ex, i) => (
            <button
              key={ex.tab}
              onClick={() => { setActiveTab(i); setCopied(false); }}
              style={{
                padding: '14px 28px', fontSize: 14, fontWeight: 600, fontFamily: C.font,
                color: activeTab === i ? C.gold : '#666', background: 'transparent',
                border: 'none', cursor: 'pointer', transition: 'color .15s',
                borderBottom: activeTab === i ? `2px solid ${C.gold}` : '2px solid transparent',
              }}
              onMouseEnter={(e) => { if (activeTab !== i) e.currentTarget.style.color = '#aaa'; }}
              onMouseLeave={(e) => { if (activeTab !== i) e.currentTarget.style.color = '#666'; }}
            >
              {ex.tab}
            </button>
          ))}
          <div style={{ flex: 1 }} />
          <button
            onClick={handleCopy}
            style={{
              padding: '10px 20px', fontSize: 12, fontWeight: 600, fontFamily: C.font,
              color: copied ? C.green : '#888', background: 'transparent',
              border: `1px solid ${copied ? `${C.green}44` : 'rgba(255,255,255,0.08)'}`,
              borderRadius: 6, cursor: 'pointer', margin: '8px 12px',
              transition: 'color .2s, border-color .2s',
            }}
          >
            {copied ? '✓ Copied' : '📋 Copy'}
          </button>
        </div>

        {/* code body */}
        <div
          style={{
            padding: '24px 28px', background: '#111', fontFamily: 'Consolas, Monaco, monospace',
            fontSize: 13.5, lineHeight: 1.6, color: '#e0e0e0', overflowX: 'auto',
          }}
        >
          {highlightCode(codeExamples[activeTab].code, codeExamples[activeTab].lang)}
        </div>
      </div>
    </section>
  );

  /* ── 5. architecture diagram ── */
  const archSection = (
    <section style={{ padding: '40px 24px 80px', maxWidth: 900, margin: '0 auto' }}>
      <h2
        style={{
          textAlign: 'center', fontSize: 36, fontWeight: 700, color: C.white,
          margin: '0 0 12px', fontFamily: C.font,
        }}
      >
        How it <span style={{ color: C.gold }}>works</span>
      </h2>
      <p
        style={{
          textAlign: 'center', fontSize: 16, color: C.gray, margin: '0 auto 36px',
          fontFamily: C.font, maxWidth: 520,
        }}
      >
        The gateway sits between your applications and AI providers.
      </p>

      <div
        style={{
          ...glassCard, padding: '32px 48px', maxWidth: 860, width: '100%', margin: '0 auto',
          boxShadow: `0 0 80px ${C.gold}12, 0 0 160px ${C.goldDim}08, inset 0 1px 0 rgba(212, 168, 67, 0.10)`,
          position: 'relative', overflow: 'hidden',
        }}
      >
        <div
          style={{
            position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%,-50%)',
            width: 500, height: 300,
            background: `radial-gradient(ellipse, ${C.gold}0c 0%, transparent 70%)`,
            pointerEvents: 'none',
          }}
        />

        {/* top row */}
        <div style={{ position: 'relative', textAlign: 'center', marginBottom: 6 }}>
          <div style={{ display: 'flex', justifyContent: 'center', gap: 14 }}>
            {[
              { label: 'Applications', icon: '📱' },
              { label: 'Agents', icon: '🤖' },
              { label: 'Workflows', icon: '⚡' },
            ].map((c) => (
              <div
                key={c.label}
                style={{
                  padding: '8px 26px', fontSize: 13, fontWeight: 600, color: '#e0e0e0',
                  border: '1px solid rgba(212, 168, 67, 0.12)', borderRadius: 10, fontFamily: C.font,
                  background: 'linear-gradient(135deg, rgba(212, 168, 67, 0.06) 0%, rgba(212, 168, 67, 0.02) 100%)',
                  display: 'flex', alignItems: 'center', gap: 8, boxShadow: '0 2px 8px rgba(0,0,0,0.2)',
                }}
              >
                <span style={{ fontSize: 15 }}>{c.icon}</span>
                {c.label}
              </div>
            ))}
          </div>
        </div>

        {/* connector */}
        <div style={{ display: 'flex', justifyContent: 'center', padding: '4px 0' }}>
          <div
            style={{
              width: 2, height: 22,
              background: `linear-gradient(180deg, ${C.goldDim}44 0%, ${C.gold}66 100%)`,
              borderRadius: 1,
            }}
          />
        </div>

        {/* gateway box */}
        <div
          style={{
            border: `1.5px solid ${C.gold}88`, borderRadius: 14, padding: '16px 32px',
            textAlign: 'center',
            background: `linear-gradient(180deg, ${C.gold}14 0%, ${C.gold}06 100%)`,
            boxShadow: `0 0 40px ${C.gold}22, 0 0 80px ${C.gold}0a`,
            position: 'relative',
          }}
        >
          <div style={{ fontSize: 22, fontWeight: 800, color: C.gold, fontFamily: C.font, letterSpacing: '-0.3px' }}>
            AI Gateway
          </div>
          <div style={{ display: 'flex', justifyContent: 'center', gap: 16, marginTop: 8 }}>
            {['Route', 'Govern', 'Secure', 'Observe'].map((action) => (
              <span
                key={action}
                style={{
                  fontSize: 12, fontWeight: 600, color: C.gold, padding: '4px 16px',
                  borderRadius: 20, background: `${C.gold}10`, border: `1px solid ${C.gold}22`,
                  fontFamily: C.font,
                }}
              >
                {action}
              </span>
            ))}
          </div>
        </div>

        {/* connector down — splits into 3 columns */}
        <div style={{ display: 'flex', justifyContent: 'center', padding: '4px 0' }}>
          <div
            style={{
              width: 2, height: 14,
              background: `linear-gradient(180deg, ${C.gold}66 0%, ${C.goldDim}44 100%)`,
              borderRadius: 1,
            }}
          />
        </div>
        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 4 }}>
          <div
            style={{
              width: '90%', height: 1,
              background: `linear-gradient(90deg, transparent 0%, ${C.goldDim}33 10%, ${C.goldDim}33 90%, transparent 100%)`,
            }}
          />
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', marginBottom: 4 }}>
          {[0, 1, 2].map((i) => (
            <div key={i} style={{ display: 'flex', justifyContent: 'center' }}>
              <div style={{ width: 2, height: 10, background: `${C.goldDim}33`, borderRadius: 1 }} />
            </div>
          ))}
        </div>

        {/* bottom row — three asset categories */}
        <div style={{ position: 'relative', display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12 }}>
          {/* Models column */}
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: 10, fontWeight: 700, color: '#666', textTransform: 'uppercase', letterSpacing: '2px', marginBottom: 8, fontFamily: C.font }}>
              Models
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6, alignItems: 'center' }}>
              {['OpenAI', 'Anthropic', 'Azure OpenAI', 'Google Gemini', 'Self-Hosted'].map((b) => (
                <div key={b} style={{ padding: '6px 16px', fontSize: 11, fontWeight: 600, color: '#ccc', border: '1px solid rgba(212, 168, 67, 0.10)', borderRadius: 8, fontFamily: C.font, background: 'rgba(212, 168, 67, 0.03)', boxShadow: '0 2px 8px rgba(0,0,0,0.2)', width: '80%' }}>
                  {b}
                </div>
              ))}
            </div>
          </div>
          {/* Tools column */}
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: 10, fontWeight: 700, color: '#666', textTransform: 'uppercase', letterSpacing: '2px', marginBottom: 8, fontFamily: C.font }}>
              Tools
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6, alignItems: 'center' }}>
              {['MCP Servers', 'REST APIs', 'SaaS Connectors', 'OpenAPI Endpoints'].map((b) => (
                <div key={b} style={{ padding: '6px 16px', fontSize: 11, fontWeight: 600, color: '#ccc', border: '1px solid rgba(212, 168, 67, 0.10)', borderRadius: 8, fontFamily: C.font, background: 'rgba(212, 168, 67, 0.03)', boxShadow: '0 2px 8px rgba(0,0,0,0.2)', width: '80%' }}>
                  {b}
                </div>
              ))}
            </div>
          </div>
          {/* Agents column */}
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: 10, fontWeight: 700, color: '#666', textTransform: 'uppercase', letterSpacing: '2px', marginBottom: 8, fontFamily: C.font }}>
              Agents
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6, alignItems: 'center' }}>
              {['LangChain', 'Foundry Agents', 'A2A Protocol', 'Custom Agents'].map((b) => (
                <div key={b} style={{ padding: '6px 16px', fontSize: 11, fontWeight: 600, color: '#ccc', border: '1px solid rgba(212, 168, 67, 0.10)', borderRadius: 8, fontFamily: C.font, background: 'rgba(212, 168, 67, 0.03)', boxShadow: '0 2px 8px rgba(0,0,0,0.2)', width: '80%' }}>
                  {b}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );

  /* ── 6. SDKs & tools ── */
  const sdksSection = (
    <section style={{ padding: '40px 24px 80px', maxWidth: 1100, margin: '0 auto' }}>
      <h2
        style={{
          textAlign: 'center', fontSize: 36, fontWeight: 700, color: C.white,
          margin: '0 0 12px', fontFamily: C.font,
        }}
      >
        SDKs & <span style={{ color: C.gold }}>Tools</span>
      </h2>
      <p
        style={{
          textAlign: 'center', fontSize: 16, color: C.gray, margin: '0 auto 40px',
          fontFamily: C.font, maxWidth: 500,
        }}
      >
        First-class integrations for your preferred language and workflow.
      </p>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 20 }}>
        {sdkCards.map((sdk) => {
          const isHov = hoveredCard === `sdk-${sdk.title}`;
          return (
            <div
              key={sdk.title}
              onMouseEnter={() => setHoveredCard(`sdk-${sdk.title}`)}
              onMouseLeave={() => setHoveredCard(null)}
              style={{
                ...glassCard, padding: '24px',
                transition: 'transform .2s, border-color .2s, box-shadow .2s',
                transform: isHov ? 'translateY(-3px)' : 'none',
                borderColor: isHov ? `${sdk.accent}44` : C.cardBorder,
                boxShadow: isHov ? `0 6px 24px ${sdk.accent}12` : 'none',
                cursor: 'pointer',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
                <span style={{ fontSize: 24 }}>{sdk.icon}</span>
                <span style={{ fontSize: 16, fontWeight: 700, color: C.white, fontFamily: C.font }}>
                  {sdk.title}
                </span>
              </div>
              <div
                style={{
                  padding: '8px 14px', borderRadius: 8, background: '#111',
                  fontFamily: 'Consolas, Monaco, monospace', fontSize: 12.5,
                  color: sdk.accent, border: '1px solid rgba(255,255,255,0.06)',
                }}
              >
                {sdk.cmd}
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );

  /* ── 7. community & support ── */
  const communitySection = (
    <section style={{ padding: '40px 24px 80px', maxWidth: 900, margin: '0 auto' }}>
      <h2
        style={{
          textAlign: 'center', fontSize: 36, fontWeight: 700, color: C.white,
          margin: '0 0 12px', fontFamily: C.font,
        }}
      >
        Community & <span style={{ color: C.gold }}>Support</span>
      </h2>
      <p
        style={{
          textAlign: 'center', fontSize: 16, color: C.gray, margin: '0 auto 40px',
          fontFamily: C.font, maxWidth: 480,
        }}
      >
        Get help from the community and our team.
      </p>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16 }}>
        {communityLinks.map((link) => {
          const isHov = hoveredCard === `comm-${link.title}`;
          return (
            <div
              key={link.title}
              onMouseEnter={() => setHoveredCard(`comm-${link.title}`)}
              onMouseLeave={() => setHoveredCard(null)}
              style={{
                ...glassCard, padding: '24px 20px', textAlign: 'center',
                transition: 'transform .2s, border-color .2s, box-shadow .2s',
                transform: isHov ? 'translateY(-3px)' : 'none',
                borderColor: isHov ? `${link.accent}44` : C.cardBorder,
                boxShadow: isHov ? `0 6px 24px ${link.accent}12` : 'none',
                cursor: 'pointer',
              }}
            >
              <div style={{ fontSize: 28, marginBottom: 12 }}>{link.icon}</div>
              <h4 style={{ fontSize: 14, fontWeight: 700, color: C.white, margin: '0 0 6px', fontFamily: C.font }}>
                {link.title}
              </h4>
              <p style={{ fontSize: 12.5, color: '#888', lineHeight: 1.5, margin: 0, fontFamily: C.font }}>
                {link.desc}
              </p>
            </div>
          );
        })}
      </div>
    </section>
  );

  /* ── 8. CTA banner ── */
  const ctaBanner = (
    <section
      style={{
        margin: '64px 24px', padding: '72px 24px', borderRadius: 24, textAlign: 'center',
        background: `linear-gradient(135deg, ${C.gold}33 0%, ${C.goldDim}33 100%)`,
        border: `1px solid ${C.cardBorder}`, maxWidth: 1100, marginLeft: 'auto', marginRight: 'auto',
      }}
    >
      <h2 style={{ fontSize: 36, fontWeight: 700, color: C.white, margin: '0 0 16px', fontFamily: C.font }}>
        Ready to get started?
      </h2>
      <p style={{ fontSize: 17, color: C.gray, margin: '0 0 36px', fontFamily: C.font }}>
        Deploy the AI Gateway and take control of your AI workloads in minutes.
      </p>
      <div style={{ display: 'flex', gap: 16, justifyContent: 'center' }}>
        <button
          onClick={onSignup}
          style={btnSolid}
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = 'translateY(-2px)';
            e.currentTarget.style.boxShadow = `0 0 36px ${C.gold}88`;
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = 'translateY(0)';
            e.currentTarget.style.boxShadow = `0 0 24px ${C.gold}66`;
          }}
        >
          Start Free
        </button>
        <button
          style={btnOutline}
          onClick={() => navigate('/pricing')}
          onMouseEnter={(e) => {
            e.currentTarget.style.borderColor = C.white;
            e.currentTarget.style.transform = 'translateY(-2px)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.borderColor = C.cardBorder;
            e.currentTarget.style.transform = 'translateY(0)';
          }}
        >
          View Pricing
        </button>
      </div>
    </section>
  );

  /* ── 9. footer ── */
  const footer = (
    <footer style={{ background: C.bgDeep, padding: '40px 48px', fontFamily: C.font }}>
      <div
        style={{
          maxWidth: 1100, margin: '0 auto', display: 'flex',
          justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 16,
        }}
      >
        <span style={{ fontSize: 13, color: C.gray, opacity: 0.6 }}>
          Azure AI Gateway
        </span>
        <div style={{ display: 'flex', gap: 24 }}>
          {['Docs', 'GitHub', 'Support'].map((s) => (
            <a
              key={s}
              href={`#${s.toLowerCase()}`}
              style={{ fontSize: 13, color: C.gray, textDecoration: 'none', transition: 'color .15s' }}
              onMouseEnter={(e) => (e.currentTarget.style.color = C.white)}
              onMouseLeave={(e) => (e.currentTarget.style.color = C.gray)}
            >
              {s}
            </a>
          ))}
        </div>
      </div>
    </footer>
  );

  /* ── page shell ── */
  return (
    <div
      style={{
        background: C.bg, color: C.white, minHeight: '100vh',
        fontFamily: C.font, scrollBehavior: 'smooth', overflowX: 'hidden', overflowY: 'auto',
      }}
    >
      {navBar}
      {hero}
      {quickStart}
      {docsSection}
      {codeSection}
      {archSection}
      {sdksSection}
      {communitySection}
      {ctaBanner}
      {footer}
    </div>
  );
};

export default DocsPage;
