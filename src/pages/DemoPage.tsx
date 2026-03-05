import { useState, useEffect, useRef, type CSSProperties, type FC } from 'react';
import { useNavigate } from 'react-router-dom';

interface DemoPageProps {
  onLogin: () => void;
  onSignup: () => void;
}

/* ─── palette (matches LandingPage exactly) ─── */
const C = {
  bg: '#0A0A0A',
  bgDeep: '#050505',
  gold: '#818CF8',
  goldDim: '#6366F1',
  amber: '#F59E0B',
  purple: '#A78BFA',
  blue: '#60A5FA',
  pink: '#f472b6',
  white: '#fff',
  gray: '#b0b0b0',
  green: '#4ADE80',
  red: '#EF4444',
  cardBg: 'rgba(129, 140, 248, 0.05)',
  cardBorder: 'rgba(129, 140, 248, 0.10)',
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
  color: '#FFFFFF',
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

/* ─── scenario data ─── */
interface ScenarioStep {
  title: string;
  description: string;
  icon: string;
  status: 'success' | 'error' | 'warning' | 'info';
  detail: string;
}

interface Scenario {
  title: string;
  icon: string;
  accent: string;
  flow: { from: string; gateway: string; to: string };
  steps: ScenarioStep[];
}

const scenarios: Scenario[] = [
  {
    title: 'Route an AI Request',
    icon: '🔀',
    accent: C.gold,
    flow: { from: 'Consumer App', gateway: 'AI Gateway', to: 'Azure OpenAI' },
    steps: [
      { title: 'Request Sent', description: 'Consumer sends POST /v1/chat/completions', icon: '📤', status: 'info', detail: 'model=gpt-4o • max_tokens=2048 • temperature=0.7' },
      { title: 'Consumer Identified', description: 'Gateway authenticates via API key', icon: '🔑', status: 'success', detail: 'consumer_id: acme-prod • namespace: engineering' },
      { title: 'Route Evaluated', description: 'Routing rules select Azure OpenAI (primary)', icon: '🔀', status: 'success', detail: 'rule: model-match → backend: azure-openai-eastus2' },
      { title: 'Policies Applied', description: 'Rate limit ✓ Token budget ✓ Content safety ✓', icon: '🛡️', status: 'success', detail: 'rate: 12/60 • tokens: 847K/2M • safety: clean' },
      { title: 'Response Received', description: 'Request forwarded → 200 OK from Azure OpenAI', icon: '✅', status: 'success', detail: 'status: 200 • streaming: true • chunks: 47' },
      { title: 'Metrics Recorded', description: '1,247 tokens • 342ms latency • $0.012 cost', icon: '📊', status: 'info', detail: 'prompt: 423 tokens • completion: 824 tokens' },
    ],
  },
  {
    title: 'Automatic Failover',
    icon: '🔄',
    accent: C.amber,
    flow: { from: 'Consumer App', gateway: 'AI Gateway', to: 'Anthropic Claude' },
    steps: [
      { title: 'Request Sent', description: 'Consumer sends chat completion request', icon: '📤', status: 'info', detail: 'model=gpt-4o • priority: high • timeout: 30s' },
      { title: 'Primary Failed', description: 'Azure OpenAI → 503 Service Unavailable', icon: '❌', status: 'error', detail: 'backend: azure-openai-eastus2 • latency: 2,341ms' },
      { title: 'Failover Triggered', description: 'Auto-detecting failure, consulting failover rules', icon: '⚡', status: 'warning', detail: 'rule: on_5xx → failover_to: anthropic-claude-3' },
      { title: 'Secondary Succeeded', description: 'Anthropic Claude → 200 OK', icon: '✅', status: 'success', detail: 'backend: anthropic-claude-3 • latency: 287ms' },
      { title: 'Response Returned', description: 'Consumer receives response transparently', icon: '📥', status: 'success', detail: 'total_latency: 2,628ms • failover: true' },
      { title: 'Alert Logged', description: 'Health check scheduled for Azure OpenAI', icon: '🔔', status: 'warning', detail: 'alert: backend_degraded • next_check: 30s' },
    ],
  },
  {
    title: 'Policy Enforcement',
    icon: '🛡️',
    accent: C.red,
    flow: { from: 'Consumer App', gateway: 'AI Gateway', to: 'BLOCKED' },
    steps: [
      { title: 'Large Request Sent', description: 'Consumer sends request with 50,000 token prompt', icon: '📤', status: 'info', detail: 'prompt_tokens: 50,000 • model: gpt-4o' },
      { title: 'Token Limit Exceeded', description: 'Gateway evaluates token limit → EXCEEDS 10K limit', icon: '⚠️', status: 'error', detail: 'policy: max_prompt_tokens=10000 • actual: 50000' },
      { title: 'Content Safety Scan', description: 'Prompt injection pattern detected', icon: '🛡️', status: 'error', detail: 'threat: prompt_injection • confidence: 0.97' },
      { title: 'Request Blocked', description: 'Consumer receives 429 with policy violation detail', icon: '🚫', status: 'error', detail: 'status: 429 • reason: policy_violation' },
      { title: 'Audit Log Created', description: 'Full request context logged for compliance', icon: '📋', status: 'warning', detail: 'log_id: evt_8f3k2 • retention: 90 days' },
      { title: 'Alert Fired', description: 'Namespace admin notified of policy violation', icon: '🔔', status: 'warning', detail: 'channel: slack • recipient: ns-admin@acme.com' },
    ],
  },
  {
    title: 'Cost Governance',
    icon: '💰',
    accent: C.purple,
    flow: { from: 'Team: marketing-ai', gateway: 'AI Gateway', to: 'Budget Check' },
    steps: [
      { title: 'Budget Status', description: 'Team "marketing-ai" has $500/month budget', icon: '💰', status: 'info', detail: 'plan: pro • period: 2024-01 • limit: $500.00' },
      { title: 'Current Spend', description: 'Current month spend: $487.23 (97.4%)', icon: '📊', status: 'warning', detail: 'consumed: $487.23 • remaining: $12.77' },
      { title: 'New Request', description: 'Incoming request — estimated cost: $0.45', icon: '📤', status: 'info', detail: 'model: gpt-4o • est_tokens: 3,200 • est_cost: $0.45' },
      { title: 'Soft Limit Reached', description: 'Gateway checks budget → SOFT LIMIT reached', icon: '⚠️', status: 'warning', detail: 'threshold: 95% • current: 97.4% • action: warn' },
      { title: 'Request Allowed', description: 'Soft limit — request allowed, alert fired to admin', icon: '✅', status: 'success', detail: 'alert: budget_warning • new_spend: $487.68' },
      { title: 'Dashboard Updated', description: 'Projected overage, suggests cheaper model', icon: '💡', status: 'info', detail: 'projection: $512.40 • suggestion: switch to gpt-4o-mini' },
    ],
  },
];

/* ─── component ─── */
const DemoPage: FC<DemoPageProps> = ({ onLogin, onSignup }) => {
  const navigate = useNavigate();
  const [activeScenario, setActiveScenario] = useState(0);
  const [activeStep, setActiveStep] = useState(0);
  const [playing, setPlaying] = useState(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  /* animated counters */
  const [reqCount, setReqCount] = useState(2847);
  const [p99, setP99] = useState(127);
  const [blockRate, setBlockRate] = useState(3.2);

  /* inject keyframes */
  useEffect(() => {
    if (document.getElementById('ops-demo-keyframes')) return;
    const style = document.createElement('style');
    style.id = 'ops-demo-keyframes';
    style.textContent = `
      @keyframes fadeInUp {
        from { opacity: 0; transform: translateY(20px); }
        to { opacity: 1; transform: translateY(0); }
      }
      @keyframes shimmer {
        0% { background-position: -200% center; }
        100% { background-position: 200% center; }
      }
      @keyframes pulse {
        0%, 100% { opacity: 1; }
        50% { opacity: 0.5; }
      }
      @keyframes slideInRight {
        from { opacity: 0; transform: translateX(-24px); }
        to { opacity: 1; transform: translateX(0); }
      }
      @keyframes flowPulse {
        0% { box-shadow: 0 0 0 0 rgba(129, 140, 248, 0.4); }
        70% { box-shadow: 0 0 0 8px rgba(129, 140, 248, 0); }
        100% { box-shadow: 0 0 0 0 rgba(129, 140, 248, 0); }
      }
    `;
    document.head.appendChild(style);
  }, []);

  /* auto-advance */
  useEffect(() => {
    if (playing) {
      intervalRef.current = setInterval(() => {
        setActiveStep((prev) => {
          if (prev >= 5) {
            setPlaying(false);
            return prev;
          }
          return prev + 1;
        });
      }, 2000);
    }
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [playing]);

  /* live metrics */
  useEffect(() => {
    const id = setInterval(() => {
      setReqCount((v) => v + Math.floor(Math.random() * 5) + 1);
      setP99((v) => {
        const delta = (Math.random() - 0.5) * 8;
        return Math.max(90, Math.min(180, Math.round(v + delta)));
      });
      setBlockRate((v) => {
        const delta = (Math.random() - 0.5) * 0.3;
        return Math.max(1.5, Math.min(5.5, parseFloat((v + delta).toFixed(1))));
      });
    }, 1500);
    return () => clearInterval(id);
  }, []);

  const resetScenario = (idx: number) => {
    setPlaying(false);
    setActiveScenario(idx);
    setActiveStep(0);
  };

  const currentScenario = scenarios[activeScenario];

  const statusColor = (s: string) =>
    s === 'success' ? C.green : s === 'error' ? C.red : s === 'warning' ? C.amber : C.blue;

  /* ── nav ── */
  const nav = (
    <nav
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        zIndex: 100,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '0 48px',
        height: 64,
        background: 'rgba(10,10,10,0.85)',
        backdropFilter: 'blur(16px)',
        WebkitBackdropFilter: 'blur(16px)',
        borderBottom: '1px solid rgba(129, 140, 248, 0.06)',
        fontFamily: C.font,
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <span
          style={{ fontSize: 22, cursor: 'pointer' }}
          onClick={() => navigate('/')}
        >
          ⚡
        </span>
        <span
          style={{ color: C.gold, fontWeight: 700, fontSize: 17, letterSpacing: -0.3, cursor: 'pointer' }}
          onClick={() => navigate('/')}
        >
          Azure AI Gateway
        </span>
        <span
          style={{
            padding: '3px 10px',
            fontSize: 10,
            fontWeight: 700,
            color: C.gold,
            border: `1px solid ${C.gold}44`,
            borderRadius: 6,
            background: `${C.gold}12`,
            textTransform: 'uppercase',
            letterSpacing: '1px',
          }}
        >
          Preview
        </span>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: 28 }}>
        <div style={{ display: 'flex', gap: 24 }}>
          {[
            { label: 'Pricing', path: '/pricing' },
            { label: 'Docs', path: '/docs' },
            { label: 'Demo', path: '/demo' },
          ].map((link) => (
            <span
              key={link.label}
              onClick={() => navigate(link.path)}
              style={{
                fontSize: 14,
                fontWeight: 500,
                color: link.path === '/demo' ? C.gold : C.gray,
                cursor: 'pointer',
                transition: 'color .15s',
              }}
              onMouseEnter={(e) => (e.currentTarget.style.color = C.white)}
              onMouseLeave={(e) => (e.currentTarget.style.color = link.path === '/demo' ? C.gold : C.gray)}
            >
              {link.label}
            </span>
          ))}
        </div>

        <div style={{ width: 1, height: 20, background: C.cardBorder }} />

        <div style={{ display: 'flex', gap: 12 }}>
          <button
            onClick={onLogin}
            style={{
              padding: '8px 20px',
              fontSize: 14,
              fontWeight: 600,
              fontFamily: C.font,
              color: C.white,
              background: 'transparent',
              border: `1.5px solid ${C.cardBorder}`,
              borderRadius: 6,
              cursor: 'pointer',
              transition: 'border-color .15s',
            }}
            onMouseEnter={(e) => (e.currentTarget.style.borderColor = C.white)}
            onMouseLeave={(e) => (e.currentTarget.style.borderColor = C.cardBorder)}
          >
            Sign In
          </button>
          <button
            onClick={onSignup}
            style={{
              padding: '8px 20px',
              fontSize: 14,
              fontWeight: 600,
              fontFamily: C.font,
              color: '#FFFFFF',
              background: C.gold,
              border: 'none',
              borderRadius: 6,
              cursor: 'pointer',
              boxShadow: `0 0 16px ${C.gold}55`,
              transition: 'box-shadow .15s',
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

  /* ── hero ── */
  const hero = (
    <section
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        textAlign: 'center',
        padding: '120px 24px 48px',
        position: 'relative',
      }}
    >
      <div
        style={{
          padding: '6px 18px',
          fontSize: 11,
          fontWeight: 700,
          color: C.gold,
          border: `1px solid ${C.gold}33`,
          borderRadius: 20,
          fontFamily: C.font,
          textTransform: 'uppercase',
          letterSpacing: '2px',
          background: `${C.gold}08`,
          marginBottom: 24,
          animation: 'fadeInUp 0.6s ease-out',
        }}
      >
        ✦ Interactive Walkthrough
      </div>

      <h1
        style={{
          fontSize: 52,
          fontWeight: 800,
          lineHeight: 1.1,
          margin: 0,
          fontFamily: C.font,
          background: `linear-gradient(135deg, ${C.white} 0%, ${C.gold} 50%, ${C.goldDim} 100%)`,
          backgroundSize: '200% auto',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          maxWidth: 820,
          animation: 'fadeInUp 0.8s ease-out, shimmer 6s ease-in-out infinite',
        }}
      >
        See the Gateway in&nbsp;Action
      </h1>

      <p
        style={{
          fontSize: 19,
          color: C.gray,
          maxWidth: 680,
          margin: '24px auto 0',
          lineHeight: 1.7,
          fontFamily: C.font,
          animation: 'fadeInUp 1s ease-out',
        }}
      >
        Walk through real scenarios showing how the AI Gateway routes, governs,
        and secures your AI traffic.
      </p>
    </section>
  );

  /* ── flow visualization ── */
  const flowViz = (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 0,
        marginBottom: 32,
      }}
    >
      {/* from box */}
      <div
        style={{
          padding: '12px 24px',
          fontSize: 13,
          fontWeight: 600,
          color: '#e0e0e0',
          border: '1px solid rgba(129, 140, 248, 0.12)',
          borderRadius: 10,
          fontFamily: C.font,
          background: 'linear-gradient(135deg, rgba(129, 140, 248, 0.06) 0%, rgba(129, 140, 248, 0.02) 100%)',
          boxShadow: activeStep >= 0 ? `0 0 12px ${currentScenario.accent}22` : 'none',
          transition: 'box-shadow .4s',
          display: 'flex',
          alignItems: 'center',
          gap: 8,
        }}
      >
        <span style={{ fontSize: 15 }}>📱</span>
        {currentScenario.flow.from}
      </div>

      {/* arrow 1 */}
      <div style={{ display: 'flex', alignItems: 'center', padding: '0 4px' }}>
        <div
          style={{
            width: 48,
            height: 2,
            background: activeStep >= 1
              ? `linear-gradient(90deg, ${currentScenario.accent}66, ${currentScenario.accent})`
              : `${C.goldDim}33`,
            transition: 'background .4s',
            borderRadius: 1,
          }}
        />
        <div
          style={{
            width: 0,
            height: 0,
            borderTop: '6px solid transparent',
            borderBottom: '6px solid transparent',
            borderLeft: `8px solid ${activeStep >= 1 ? currentScenario.accent : C.goldDim + '33'}`,
            transition: 'border-left-color .4s',
          }}
        />
      </div>

      {/* gateway box */}
      <div
        style={{
          padding: '14px 28px',
          fontSize: 15,
          fontWeight: 800,
          color: C.gold,
          border: `1.5px solid ${C.gold}88`,
          borderRadius: 14,
          fontFamily: C.font,
          background: `linear-gradient(180deg, ${C.gold}14 0%, ${C.gold}06 100%)`,
          boxShadow: activeStep >= 2 ? `0 0 40px ${C.gold}22, 0 0 80px ${C.gold}0a` : 'none',
          transition: 'box-shadow .4s',
          animation: activeStep >= 2 && activeStep <= 4 ? 'flowPulse 2s infinite' : 'none',
          display: 'flex',
          alignItems: 'center',
          gap: 8,
        }}
      >
        <span style={{ fontSize: 18 }}>⚡</span>
        {currentScenario.flow.gateway}
      </div>

      {/* arrow 2 */}
      <div style={{ display: 'flex', alignItems: 'center', padding: '0 4px' }}>
        <div
          style={{
            width: 48,
            height: 2,
            background: activeStep >= 4
              ? `linear-gradient(90deg, ${currentScenario.accent}, ${currentScenario.accent}66)`
              : `${C.goldDim}33`,
            transition: 'background .4s',
            borderRadius: 1,
          }}
        />
        <div
          style={{
            width: 0,
            height: 0,
            borderTop: '6px solid transparent',
            borderBottom: '6px solid transparent',
            borderLeft: `8px solid ${activeStep >= 4 ? currentScenario.accent : C.goldDim + '33'}`,
            transition: 'border-left-color .4s',
          }}
        />
      </div>

      {/* to box */}
      <div
        style={{
          padding: '12px 24px',
          fontSize: 13,
          fontWeight: 600,
          color: activeStep >= 4 ? '#e0e0e0' : '#666',
          border: `1px solid ${activeStep >= 4 ? `${currentScenario.accent}44` : 'rgba(129, 140, 248, 0.12)'}`,
          borderRadius: 10,
          fontFamily: C.font,
          background: 'linear-gradient(135deg, rgba(129, 140, 248, 0.06) 0%, rgba(129, 140, 248, 0.02) 100%)',
          boxShadow: activeStep >= 5 ? `0 0 12px ${currentScenario.accent}22` : 'none',
          transition: 'all .4s',
          display: 'flex',
          alignItems: 'center',
          gap: 8,
        }}
      >
        <span style={{ fontSize: 15 }}>
          {currentScenario.flow.to === 'BLOCKED' ? '🚫' : '☁️'}
        </span>
        {currentScenario.flow.to}
      </div>
    </div>
  );

  /* ── interactive scenarios section ── */
  const scenarioSection = (
    <section style={{ padding: '32px 24px 80px', maxWidth: 1100, margin: '0 auto' }}>
      <h2
        style={{
          textAlign: 'center',
          fontSize: 36,
          fontWeight: 700,
          color: C.white,
          margin: '0 0 40px',
          fontFamily: C.font,
        }}
      >
        Choose a <span style={{ color: C.gold }}>Scenario</span>
      </h2>

      {/* scenario tabs */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'center',
          gap: 12,
          marginBottom: 40,
          flexWrap: 'wrap',
        }}
      >
        {scenarios.map((s, i) => (
          <button
            key={s.title}
            onClick={() => resetScenario(i)}
            style={{
              padding: '10px 22px',
              fontSize: 14,
              fontWeight: 600,
              fontFamily: C.font,
              color: activeScenario === i ? '#0A0A0A' : C.gray,
              background: activeScenario === i ? s.accent : 'transparent',
              border: `1.5px solid ${activeScenario === i ? s.accent : C.cardBorder}`,
              borderRadius: 10,
              cursor: 'pointer',
              transition: 'all .2s',
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              boxShadow: activeScenario === i ? `0 0 20px ${s.accent}44` : 'none',
            }}
          >
            <span style={{ fontSize: 16 }}>{s.icon}</span>
            {s.title}
          </button>
        ))}
      </div>

      {/* flow visualization */}
      <div
        style={{
          ...glassCard,
          padding: '32px 32px 40px',
          maxWidth: 960,
          margin: '0 auto',
          boxShadow: `0 0 80px ${C.gold}12, inset 0 1px 0 rgba(129, 140, 248, 0.10)`,
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        {/* subtle inner glow */}
        <div
          style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%,-50%)',
            width: 500,
            height: 300,
            background: `radial-gradient(ellipse, ${currentScenario.accent}0c 0%, transparent 70%)`,
            pointerEvents: 'none',
          }}
        />

        {flowViz}

        {/* play controls + progress */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 16,
            marginBottom: 28,
          }}
        >
          <button
            onClick={() => {
              if (activeStep >= 5) {
                setActiveStep(0);
                setPlaying(true);
              } else {
                setPlaying(!playing);
              }
            }}
            style={{
              width: 40,
              height: 40,
              borderRadius: '50%',
              border: `1.5px solid ${C.gold}66`,
              background: `${C.gold}15`,
              color: C.gold,
              fontSize: 16,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transition: 'all .15s',
              fontFamily: C.font,
            }}
          >
            {playing ? '⏸' : '▶'}
          </button>

          {/* step progress bar */}
          <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
            {currentScenario.steps.map((_, i) => (
              <div
                key={i}
                onClick={() => {
                  setPlaying(false);
                  setActiveStep(i);
                }}
                style={{
                  width: i <= activeStep ? 32 : 20,
                  height: 4,
                  borderRadius: 2,
                  background: i <= activeStep ? currentScenario.accent : `${C.goldDim}33`,
                  transition: 'all .3s',
                  cursor: 'pointer',
                }}
              />
            ))}
          </div>

          <span
            style={{
              fontSize: 12,
              color: C.gray,
              fontFamily: C.font,
              fontWeight: 600,
              minWidth: 40,
            }}
          >
            {activeStep + 1} / 6
          </span>

          {/* next / prev */}
          <button
            onClick={() => {
              setPlaying(false);
              setActiveStep(Math.max(0, activeStep - 1));
            }}
            disabled={activeStep === 0}
            style={{
              padding: '6px 14px',
              fontSize: 12,
              fontWeight: 600,
              fontFamily: C.font,
              color: activeStep === 0 ? '#555' : C.white,
              background: 'transparent',
              border: `1px solid ${activeStep === 0 ? '#333' : C.cardBorder}`,
              borderRadius: 6,
              cursor: activeStep === 0 ? 'default' : 'pointer',
              transition: 'all .15s',
            }}
          >
            ← Prev
          </button>
          <button
            onClick={() => {
              setPlaying(false);
              setActiveStep(Math.min(5, activeStep + 1));
            }}
            disabled={activeStep === 5}
            style={{
              padding: '6px 14px',
              fontSize: 12,
              fontWeight: 600,
              fontFamily: C.font,
              color: activeStep === 5 ? '#555' : '#0A0A0A',
              background: activeStep === 5 ? '#333' : C.gold,
              border: 'none',
              borderRadius: 6,
              cursor: activeStep === 5 ? 'default' : 'pointer',
              transition: 'all .15s',
              boxShadow: activeStep === 5 ? 'none' : `0 0 12px ${C.gold}44`,
            }}
          >
            Next →
          </button>
        </div>

        {/* step cards */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {currentScenario.steps.map((step, i) => {
            const visible = i <= activeStep;
            const isCurrent = i === activeStep;
            const sc = statusColor(step.status);
            return (
              <div
                key={`${activeScenario}-${i}`}
                style={{
                  ...glassCard,
                  padding: '16px 24px',
                  opacity: visible ? 1 : 0.15,
                  transform: visible ? 'translateX(0)' : 'translateX(-16px)',
                  transition: 'opacity .5s, transform .5s, border-color .3s, box-shadow .3s',
                  borderColor: isCurrent ? `${sc}55` : C.cardBorder,
                  borderLeft: `3px solid ${visible ? sc : '#333'}`,
                  boxShadow: isCurrent ? `0 4px 24px ${sc}1a` : 'none',
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: 16,
                  cursor: 'pointer',
                  position: 'relative',
                  overflow: 'hidden',
                  animation: isCurrent ? 'slideInRight .4s ease-out' : 'none',
                }}
                onClick={() => {
                  setPlaying(false);
                  setActiveStep(i);
                }}
              >
                {/* step number */}
                <div
                  style={{
                    minWidth: 32,
                    height: 32,
                    borderRadius: '50%',
                    background: visible ? `${sc}22` : '#1a1a1a',
                    border: `1.5px solid ${visible ? `${sc}55` : '#333'}`,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: 14,
                    fontWeight: 700,
                    color: visible ? sc : '#555',
                    fontFamily: C.font,
                    flexShrink: 0,
                    transition: 'all .4s',
                  }}
                >
                  {visible ? step.icon : i + 1}
                </div>

                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
                    <span
                      style={{
                        fontSize: 15,
                        fontWeight: 700,
                        color: visible ? C.white : '#555',
                        fontFamily: C.font,
                        transition: 'color .4s',
                      }}
                    >
                      {step.title}
                    </span>
                    {isCurrent && (
                      <span
                        style={{
                          fontSize: 9,
                          fontWeight: 700,
                          color: sc,
                          padding: '2px 8px',
                          borderRadius: 4,
                          background: `${sc}18`,
                          border: `1px solid ${sc}33`,
                          textTransform: 'uppercase',
                          letterSpacing: '1px',
                          fontFamily: C.font,
                        }}
                      >
                        Active
                      </span>
                    )}
                  </div>
                  <p
                    style={{
                      fontSize: 13,
                      color: visible ? C.gray : '#444',
                      margin: 0,
                      fontFamily: C.font,
                      lineHeight: 1.5,
                      transition: 'color .4s',
                    }}
                  >
                    {step.description}
                  </p>
                  {visible && (
                    <div
                      style={{
                        marginTop: 8,
                        padding: '6px 12px',
                        fontSize: 11,
                        fontFamily: "'SF Mono', 'Fira Code', monospace",
                        color: '#888',
                        background: 'rgba(0,0,0,0.3)',
                        borderRadius: 6,
                        border: '1px solid #1a1a1a',
                        letterSpacing: '0.3px',
                      }}
                    >
                      {step.detail}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );

  /* ── live metrics ── */
  const providerDist = [
    { name: 'Azure OpenAI', pct: 52, color: C.blue },
    { name: 'Anthropic', pct: 28, color: C.purple },
    { name: 'Google', pct: 12, color: C.green },
    { name: 'Self-hosted', pct: 8, color: C.pink },
  ];

  const metricsSection = (
    <section style={{ padding: '80px 24px', maxWidth: 1100, margin: '0 auto' }}>
      <h2
        style={{
          textAlign: 'center',
          fontSize: 36,
          fontWeight: 700,
          color: C.white,
          margin: '0 0 16px',
          fontFamily: C.font,
        }}
      >
        Live Metrics <span style={{ color: C.gold }}>Dashboard</span>
      </h2>
      <p
        style={{
          textAlign: 'center',
          fontSize: 15,
          color: C.gray,
          margin: '0 0 48px',
          fontFamily: C.font,
        }}
      >
        Simulated real-time view of gateway activity
      </p>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 20 }}>
        {/* requests processed */}
        <div
          style={{
            ...glassCard,
            padding: '28px 24px',
            textAlign: 'center',
            borderTop: `2px solid ${C.gold}44`,
            position: 'relative',
            overflow: 'hidden',
          }}
        >
          <div
            style={{
              position: 'absolute',
              top: -30,
              left: '50%',
              transform: 'translateX(-50%)',
              width: 100,
              height: 60,
              background: `radial-gradient(ellipse, ${C.gold}15 0%, transparent 70%)`,
              pointerEvents: 'none',
            }}
          />
          <div style={{ fontSize: 11, fontWeight: 700, color: '#666', textTransform: 'uppercase', letterSpacing: '1.5px', marginBottom: 10, fontFamily: C.font }}>
            Requests Processed
          </div>
          <div
            style={{
              fontSize: 36,
              fontWeight: 800,
              fontFamily: C.font,
              background: `linear-gradient(135deg, ${C.white}, ${C.gold})`,
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
            }}
          >
            {reqCount.toLocaleString()}
          </div>
          <div style={{ fontSize: 11, color: C.green, marginTop: 6, fontFamily: C.font, fontWeight: 600 }}>
            ● Live
          </div>
        </div>

        {/* p99 latency */}
        <div
          style={{
            ...glassCard,
            padding: '28px 24px',
            textAlign: 'center',
            borderTop: `2px solid ${C.blue}44`,
            position: 'relative',
            overflow: 'hidden',
          }}
        >
          <div
            style={{
              position: 'absolute',
              top: -30,
              left: '50%',
              transform: 'translateX(-50%)',
              width: 100,
              height: 60,
              background: `radial-gradient(ellipse, ${C.blue}15 0%, transparent 70%)`,
              pointerEvents: 'none',
            }}
          />
          <div style={{ fontSize: 11, fontWeight: 700, color: '#666', textTransform: 'uppercase', letterSpacing: '1.5px', marginBottom: 10, fontFamily: C.font }}>
            P99 Latency
          </div>
          <div
            style={{
              fontSize: 36,
              fontWeight: 800,
              fontFamily: C.font,
              background: `linear-gradient(135deg, ${C.white}, ${C.blue})`,
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
            }}
          >
            {p99}ms
          </div>
          <div style={{ fontSize: 11, color: C.green, marginTop: 6, fontFamily: C.font, fontWeight: 600 }}>
            ● Healthy
          </div>
        </div>

        {/* provider distribution */}
        <div
          style={{
            ...glassCard,
            padding: '28px 24px',
            borderTop: `2px solid ${C.purple}44`,
            position: 'relative',
            overflow: 'hidden',
          }}
        >
          <div
            style={{
              position: 'absolute',
              top: -30,
              left: '50%',
              transform: 'translateX(-50%)',
              width: 100,
              height: 60,
              background: `radial-gradient(ellipse, ${C.purple}15 0%, transparent 70%)`,
              pointerEvents: 'none',
            }}
          />
          <div style={{ fontSize: 11, fontWeight: 700, color: '#666', textTransform: 'uppercase', letterSpacing: '1.5px', marginBottom: 14, fontFamily: C.font }}>
            Provider Distribution
          </div>
          {providerDist.map((p) => (
            <div key={p.name} style={{ marginBottom: 8 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 3 }}>
                <span style={{ fontSize: 11, color: C.gray, fontFamily: C.font }}>{p.name}</span>
                <span style={{ fontSize: 11, color: p.color, fontFamily: C.font, fontWeight: 700 }}>{p.pct}%</span>
              </div>
              <div style={{ width: '100%', height: 4, background: '#1a1a1a', borderRadius: 2 }}>
                <div
                  style={{
                    width: `${p.pct}%`,
                    height: '100%',
                    background: p.color,
                    borderRadius: 2,
                    boxShadow: `0 0 8px ${p.color}44`,
                    transition: 'width .5s',
                  }}
                />
              </div>
            </div>
          ))}
        </div>

        {/* block rate */}
        <div
          style={{
            ...glassCard,
            padding: '28px 24px',
            textAlign: 'center',
            borderTop: `2px solid ${C.amber}44`,
            position: 'relative',
            overflow: 'hidden',
          }}
        >
          <div
            style={{
              position: 'absolute',
              top: -30,
              left: '50%',
              transform: 'translateX(-50%)',
              width: 100,
              height: 60,
              background: `radial-gradient(ellipse, ${C.amber}15 0%, transparent 70%)`,
              pointerEvents: 'none',
            }}
          />
          <div style={{ fontSize: 11, fontWeight: 700, color: '#666', textTransform: 'uppercase', letterSpacing: '1.5px', marginBottom: 10, fontFamily: C.font }}>
            Policy Block Rate
          </div>
          <div
            style={{
              fontSize: 36,
              fontWeight: 800,
              fontFamily: C.font,
              background: `linear-gradient(135deg, ${C.white}, ${C.amber})`,
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
            }}
          >
            {blockRate}%
          </div>
          <div style={{ fontSize: 11, color: C.amber, marginTop: 6, fontFamily: C.font, fontWeight: 600 }}>
            ● Enforcing
          </div>
        </div>
      </div>
    </section>
  );

  /* ── testimonials ── */
  const testimonials = [
    {
      quote: 'We reduced our AI infrastructure costs by 34% in the first month by using the gateway\'s routing optimization.',
      name: 'Sarah Chen',
      role: 'Platform Engineering Lead',
      accent: C.gold,
    },
    {
      quote: 'The policy enforcement alone saved us from two prompt injection incidents. The audit trail made compliance reporting trivial.',
      name: 'Marcus Rivera',
      role: 'CISO',
      accent: C.purple,
    },
    {
      quote: 'We were spending hours manually managing API keys across 12 AI providers. Now it\'s all centralized with automatic rotation.',
      name: 'Priya Patel',
      role: 'DevOps Lead',
      accent: C.blue,
    },
  ];

  const testimonialsSection = (
    <section style={{ padding: '80px 24px', maxWidth: 1100, margin: '0 auto' }}>
      <h2
        style={{
          textAlign: 'center',
          fontSize: 36,
          fontWeight: 700,
          color: C.white,
          margin: '0 0 48px',
          fontFamily: C.font,
        }}
      >
        What Teams Are <span style={{ color: C.gold }}>Saying</span>
      </h2>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 24 }}>
        {testimonials.map((t) => (
          <div
            key={t.name}
            style={{
              ...glassCard,
              padding: '32px 28px',
              borderTop: `2px solid ${t.accent}44`,
              position: 'relative',
              overflow: 'hidden',
              transition: 'transform .2s, box-shadow .2s',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'translateY(-4px)';
              e.currentTarget.style.boxShadow = `0 8px 32px ${t.accent}1a`;
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = 'none';
            }}
          >
            <div
              style={{
                position: 'absolute',
                top: -40,
                left: '50%',
                transform: 'translateX(-50%)',
                width: 120,
                height: 80,
                background: `radial-gradient(ellipse, ${t.accent}15 0%, transparent 70%)`,
                pointerEvents: 'none',
              }}
            />
            <div style={{ fontSize: 28, marginBottom: 16, opacity: 0.3, color: t.accent }}>"</div>
            <p
              style={{
                fontSize: 14,
                color: C.gray,
                lineHeight: 1.8,
                margin: '0 0 24px',
                fontFamily: C.font,
                fontStyle: 'italic',
              }}
            >
              {t.quote}
            </p>
            <div>
              <div style={{ fontSize: 14, fontWeight: 700, color: C.white, fontFamily: C.font }}>
                {t.name}
              </div>
              <div style={{ fontSize: 12, color: '#666', fontFamily: C.font, marginTop: 2 }}>
                {t.role}
              </div>
            </div>
          </div>
        ))}
      </div>
    </section>
  );

  /* ── before / after comparison ── */
  const withoutItems = [
    '❌ Direct API calls to each provider',
    '❌ No centralized rate limiting',
    '❌ Manual key rotation across teams',
    '❌ No visibility into AI spend',
    '❌ No content safety enforcement',
    '❌ Scattered audit logs',
  ];

  const withItems = [
    '✅ Single endpoint for all AI providers',
    '✅ Gateway-enforced rate limits and quotas',
    '✅ Centralized credential management with auto-rotation',
    '✅ Real-time cost dashboards with per-team attribution',
    '✅ Built-in content safety and prompt injection detection',
    '✅ Complete audit trail for compliance',
  ];

  const comparisonSection = (
    <section style={{ padding: '80px 24px', maxWidth: 1100, margin: '0 auto' }}>
      <h2
        style={{
          textAlign: 'center',
          fontSize: 36,
          fontWeight: 700,
          color: C.white,
          margin: '0 0 48px',
          fontFamily: C.font,
        }}
      >
        Before vs After <span style={{ color: C.gold }}>AI Gateway</span>
      </h2>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 32, maxWidth: 960, margin: '0 auto' }}>
        {/* without */}
        <div
          style={{
            ...glassCard,
            padding: '32px 28px',
            borderTop: `2px solid ${C.red}44`,
            position: 'relative',
            overflow: 'hidden',
          }}
        >
          <div
            style={{
              position: 'absolute',
              top: -30,
              left: '50%',
              transform: 'translateX(-50%)',
              width: 120,
              height: 80,
              background: `radial-gradient(ellipse, ${C.red}12 0%, transparent 70%)`,
              pointerEvents: 'none',
            }}
          />
          <h3
            style={{
              fontSize: 18,
              fontWeight: 700,
              color: C.red,
              margin: '0 0 20px',
              fontFamily: C.font,
            }}
          >
            Without AI Gateway
          </h3>
          {withoutItems.map((item) => (
            <div
              key={item}
              style={{
                fontSize: 14,
                color: C.gray,
                fontFamily: C.font,
                lineHeight: 1.6,
                padding: '8px 0',
                borderBottom: '1px solid #1a1a1a',
              }}
            >
              {item}
            </div>
          ))}
        </div>

        {/* with */}
        <div
          style={{
            ...glassCard,
            padding: '32px 28px',
            borderTop: `2px solid ${C.green}44`,
            position: 'relative',
            overflow: 'hidden',
          }}
        >
          <div
            style={{
              position: 'absolute',
              top: -30,
              left: '50%',
              transform: 'translateX(-50%)',
              width: 120,
              height: 80,
              background: `radial-gradient(ellipse, ${C.green}12 0%, transparent 70%)`,
              pointerEvents: 'none',
            }}
          />
          <h3
            style={{
              fontSize: 18,
              fontWeight: 700,
              color: C.green,
              margin: '0 0 20px',
              fontFamily: C.font,
            }}
          >
            With AI Gateway
          </h3>
          {withItems.map((item) => (
            <div
              key={item}
              style={{
                fontSize: 14,
                color: C.gray,
                fontFamily: C.font,
                lineHeight: 1.6,
                padding: '8px 0',
                borderBottom: '1px solid #1a1a1a',
              }}
            >
              {item}
            </div>
          ))}
        </div>
      </div>
    </section>
  );

  /* ── CTA banner ── */
  const ctaBanner = (
    <section
      style={{
        margin: '64px 24px',
        padding: '72px 24px',
        borderRadius: 24,
        textAlign: 'center',
        background: `linear-gradient(135deg, ${C.gold}33 0%, ${C.goldDim}33 100%)`,
        border: `1px solid ${C.cardBorder}`,
        maxWidth: 1100,
        marginLeft: 'auto',
        marginRight: 'auto',
      }}
    >
      <h2
        style={{
          fontSize: 36,
          fontWeight: 700,
          color: C.white,
          margin: '0 0 16px',
          fontFamily: C.font,
        }}
      >
        Ready to take control of your AI traffic?
      </h2>
      <p style={{ fontSize: 17, color: C.gray, margin: '0 0 36px', fontFamily: C.font }}>
        Start routing, governing, and securing your AI workloads in minutes.
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
          onClick={() => navigate('/pricing')}
          style={btnOutline}
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

  /* ── footer ── */
  const footer = (
    <footer style={{ background: C.bgDeep, padding: '40px 48px', fontFamily: C.font }}>
      <div
        style={{
          maxWidth: 1100,
          margin: '0 auto',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: 16,
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
              style={{
                fontSize: 13,
                color: C.gray,
                textDecoration: 'none',
                transition: 'color .15s',
              }}
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
        background: C.bg,
        color: C.white,
        minHeight: '100vh',
        fontFamily: C.font,
        scrollBehavior: 'smooth',
        overflowX: 'hidden',
      }}
    >
      {nav}
      {hero}
      {scenarioSection}
      {metricsSection}
      {testimonialsSection}
      {comparisonSection}
      {ctaBanner}
      {footer}
    </div>
  );
};

export default DemoPage;
