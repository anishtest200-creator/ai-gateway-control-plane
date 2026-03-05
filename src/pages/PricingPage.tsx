import { useState, useEffect, type CSSProperties, type FC } from 'react';
import { useNavigate } from 'react-router-dom';

interface PricingPageProps {
  onLogin: () => void;
  onSignup: () => void;
}

/* ─── palette (matches LandingPage) ─── */
const C = {
  bg: '#0A0A0A',
  bgDeep: '#050505',
  gold: '#D4A843',
  goldDim: '#B8923A',
  amber: '#F59E0B',
  purple: '#A78BFA',
  blue: '#60A5FA',
  pink: '#f472b6',
  white: '#fff',
  gray: '#b0b0b0',
  cardBg: 'rgba(212, 168, 67, 0.05)',
  cardBorder: 'rgba(212, 168, 67, 0.10)',
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
const tiers = [
  {
    name: 'Developer',
    price: 'Free',
    priceSub: 'forever',
    bestFor: 'experimentation and prototypes',
    features: [
      '100K AI requests/month',
      'Basic routing rules',
      'Rate limiting',
      'Request logging',
      '1 namespace',
      'Community support',
    ],
    cta: 'Start Free',
    highlighted: false,
  },
  {
    name: 'Pro',
    price: '$99',
    priceSub: '/month',
    bestFor: 'production AI applications',
    features: [
      '5M AI requests/month',
      'Advanced routing with fallback & failover',
      'Content safety guardrails',
      'Cost dashboards & attribution',
      'Prompt caching',
      'Up to 10 namespaces',
      'Priority support',
    ],
    overage: '$1.00 per additional 1M requests',
    cta: 'Start Pro Trial',
    highlighted: true,
  },
  {
    name: 'Enterprise',
    price: 'Custom',
    priceSub: '',
    bestFor: 'organizations running AI at scale',
    features: [
      'Unlimited AI requests',
      'Advanced governance policies',
      'RBAC with Entra ID / SSO',
      'Full audit logging & compliance',
      'Multi-region routing',
      'Private deployments (VNet)',
      'SOC 2 / HIPAA / GDPR compliance',
      'Dedicated support + SLA',
    ],
    cta: 'Contact Sales',
    highlighted: false,
  },
];

const usageRows = [
  { metric: 'AI requests/month', free: '100K', pro: '5M', enterprise: 'Unlimited' },
  { metric: 'Policy evaluations', free: 'Included', pro: 'Included', enterprise: 'Included' },
  { metric: 'Prompt cache reads', free: '–', pro: '1M included', enterprise: 'Unlimited' },
  { metric: 'Prompt cache writes', free: '–', pro: '500K included', enterprise: 'Unlimited' },
  { metric: 'Audit log retention', free: '7 days', pro: '30 days', enterprise: '1 year+' },
  { metric: 'Namespaces', free: '1', pro: '10', enterprise: 'Unlimited' },
  { metric: 'Team members', free: '1', pro: '10', enterprise: 'Unlimited' },
];

const enterpriseCards = [
  { icon: '🛡️', title: 'Runtime Policy Enforcement', desc: 'Enforce token limits, rate limits, and content safety at the gateway boundary', accent: C.gold },
  { icon: '🔀', title: 'Model Routing Strategies', desc: 'A/B testing, canary deployments, cost-optimized routing across providers', accent: C.goldDim },
  { icon: '💰', title: 'AI Cost Control', desc: 'Budget alerts, spend caps, chargeback reporting by team and namespace', accent: C.amber },
  { icon: '🔧', title: 'Tool & Agent Governance', desc: 'Control which tools and agents can access which models through the gateway', accent: C.purple },
  { icon: '📋', title: 'Audit & Compliance', desc: 'Complete audit trail, SOC 2/HIPAA/GDPR evidence generation', accent: C.blue },
  { icon: '🏢', title: 'Multi-Tenant Isolation', desc: 'Namespace-based isolation with independent policies, quotas, and credentials', accent: C.pink },
];

const comparisonRows = [
  { feature: 'Traffic routing', gateway: true, platform: false },
  { feature: 'Policy enforcement', gateway: true, platform: false },
  { feature: 'Cost governance', gateway: true, platform: false },
  { feature: 'Multi-provider support', gateway: true, platform: false },
  { feature: 'Audit logs', gateway: true, platform: true },
  { feature: 'Model training', gateway: false, platform: true },
  { feature: 'Agent building', gateway: false, platform: true },
  { feature: 'Prompt engineering', gateway: false, platform: true },
];

const faqItems = [
  {
    q: 'Do you charge for model tokens?',
    a: 'No. You pay your AI providers (OpenAI, Anthropic, Azure, Google) directly for model usage. AI Gateway only charges for infrastructure capabilities — routing, governance, observability, and security.',
  },
  {
    q: 'Can I use this with Azure AI Foundry?',
    a: 'Absolutely. AI Gateway works alongside development platforms like Azure AI Foundry, AWS Bedrock, and Google Vertex. We sit between your application and those providers, adding routing, governance, and observability without replacing any of them.',
  },
  {
    q: 'What happens if I exceed my plan limits?',
    a: 'On the Pro plan, additional requests are billed at $1.00 per 1M requests — simple and predictable. On the Free plan, requests are throttled once you hit 100K/month. You can upgrade at any time with no downtime.',
  },
  {
    q: 'How does prompt caching work?',
    a: 'The gateway caches responses at the routing layer based on configurable cache keys. When an identical prompt is received, it serves the cached response instantly — reducing latency, cost, and redundant provider calls.',
  },
  {
    q: 'Is there a free trial for Pro?',
    a: 'Yes! Every new account gets a 14-day Pro trial with full access to all Pro features. No credit card required. After the trial, you can continue on the Free plan or upgrade to Pro.',
  },
  {
    q: 'Can I self-host the gateway?',
    a: 'Enterprise plan includes private deployment options, including VNet injection and self-hosted configurations. Contact our sales team for architecture guidance tailored to your infrastructure requirements.',
  },
];

/* ─── calculator helpers ─── */
const REQUEST_MARKS = [100_000, 500_000, 1_000_000, 5_000_000, 10_000_000, 25_000_000, 50_000_000, 100_000_000];
const NS_MARKS = [1, 5, 10, 25, 50];

function formatNum(n: number): string {
  if (n >= 1_000_000_000) return `${(n / 1_000_000_000).toFixed(1)}B`;
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(n % 1_000_000 === 0 ? 0 : 1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(0)}K`;
  return `${n}`;
}

function recommend(requests: number, namespaces: number): { tier: string; cost: string } {
  if (requests <= 100_000 && namespaces <= 1) return { tier: 'Developer', cost: 'Free' };
  if (requests <= 5_000_000 && namespaces <= 10) {
    return { tier: 'Pro', cost: '$99/mo' };
  }
  if (requests > 5_000_000 && namespaces <= 10) {
    const overage = Math.ceil((requests - 5_000_000) / 1_000_000);
    const cost = 99 + overage;
    return { tier: 'Pro', cost: `~$${cost}/mo` };
  }
  return { tier: 'Enterprise', cost: 'Custom' };
}

/* ─── component ─── */
const PricingPage: FC<PricingPageProps> = ({ onLogin, onSignup }) => {
  const navigate = useNavigate();
  const [hoveredCard, setHoveredCard] = useState<number | null>(null);
  const [hoveredEntCard, setHoveredEntCard] = useState<number | null>(null);
  const [openFaq, setOpenFaq] = useState<number | null>(null);
  const [calcRequests, setCalcRequests] = useState(3);
  const [calcNs, setCalcNs] = useState(1);

  /* inject keyframe animation once */
  useEffect(() => {
    if (document.getElementById('ops-pricing-keyframes')) return;
    const style = document.createElement('style');
    style.id = 'ops-pricing-keyframes';
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
      input[type="range"]::-webkit-slider-thumb {
        -webkit-appearance: none; appearance: none;
        width: 20px; height: 20px; border-radius: 50%;
        background: ${C.gold}; cursor: pointer;
        box-shadow: 0 0 12px ${C.gold}88;
        border: 2px solid ${C.white};
      }
      input[type="range"]::-moz-range-thumb {
        width: 20px; height: 20px; border-radius: 50%;
        background: ${C.gold}; cursor: pointer;
        box-shadow: 0 0 12px ${C.gold}88;
        border: 2px solid ${C.white};
      }
    `;
    document.head.appendChild(style);
  }, []);

  const rec = recommend(REQUEST_MARKS[calcRequests], NS_MARKS[calcNs]);

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
        borderBottom: '1px solid rgba(212, 168, 67, 0.06)',
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
        {/* nav links */}
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
                color: link.path === '/pricing' ? C.gold : C.gray,
                cursor: 'pointer',
                transition: 'color .15s',
              }}
              onMouseEnter={(e) => (e.currentTarget.style.color = C.white)}
              onMouseLeave={(e) => (e.currentTarget.style.color = link.path === '/pricing' ? C.gold : C.gray)}
            >
              {link.label}
            </span>
          ))}
        </div>

        <div style={{ width: 1, height: 20, background: C.cardBorder }} />

        {/* auth buttons */}
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
              color: '#0A0A0A',
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

  /* ── 1. hero ── */
  const hero = (
    <section
      style={{
        minHeight: '40vh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        textAlign: 'center',
        padding: '100px 24px 32px',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      {/* animated gradient orbs */}
      <div
        style={{
          position: 'absolute',
          top: '20%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          width: 700,
          height: 700,
          background: `radial-gradient(circle, ${C.gold}22 0%, ${C.goldDim}08 40%, transparent 70%)`,
          pointerEvents: 'none',
          animation: 'orbFloat 8s ease-in-out infinite',
          filter: 'blur(40px)',
        }}
      />
      <div
        style={{
          position: 'absolute',
          top: '30%',
          left: '45%',
          transform: 'translate(-50%, -50%)',
          width: 500,
          height: 500,
          background: `radial-gradient(circle, ${C.goldDim}18 0%, ${C.gold}08 40%, transparent 70%)`,
          pointerEvents: 'none',
          animation: 'orbFloat2 10s ease-in-out infinite',
          filter: 'blur(60px)',
        }}
      />

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
        ✦ Pricing
      </div>

      <h1
        style={{
          fontSize: 52,
          fontWeight: 800,
          lineHeight: 1.15,
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
        Simple, predictable pricing for the AI&nbsp;Control&nbsp;Plane
      </h1>

      <p
        style={{
          fontSize: 18,
          color: C.gray,
          maxWidth: 680,
          margin: '24px auto 0',
          lineHeight: 1.7,
          fontFamily: C.font,
          animation: 'fadeInUp 1s ease-out',
        }}
      >
        Pay for gateway infrastructure, not model tokens. You keep your existing AI provider
        relationships — we handle routing, governance, and observability.
      </p>
    </section>
  );

  /* ── 2. pricing tiers ── */
  const pricingTiers = (
    <section style={{ padding: '0 24px 80px', maxWidth: 1100, margin: '0 auto' }}>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 24, alignItems: 'stretch' }}>
        {tiers.map((t, i) => {
          const isHl = t.highlighted;
          const isHov = hoveredCard === i;
          return (
            <div
              key={t.name}
              onMouseEnter={() => setHoveredCard(i)}
              onMouseLeave={() => setHoveredCard(null)}
              style={{
                ...glassCard,
                padding: '36px 28px 32px',
                position: 'relative',
                overflow: 'hidden',
                display: 'flex',
                flexDirection: 'column',
                transition: 'transform .2s, border-color .2s, box-shadow .2s',
                transform: isHl
                  ? isHov ? 'scale(1.04)' : 'scale(1.02)'
                  : isHov ? 'translateY(-4px)' : 'none',
                borderColor: isHl ? `${C.gold}55` : isHov ? `${C.gold}33` : C.cardBorder,
                boxShadow: isHl
                  ? `0 0 60px ${C.gold}22, 0 0 120px ${C.gold}0a`
                  : isHov ? `0 8px 32px ${C.gold}1a` : 'none',
                borderTop: isHl ? `2px solid ${C.gold}` : `2px solid ${C.cardBorder}`,
              }}
            >
              {/* accent glow for highlighted */}
              {isHl && (
                <div
                  style={{
                    position: 'absolute',
                    top: -60,
                    left: '50%',
                    transform: 'translateX(-50%)',
                    width: 200,
                    height: 120,
                    background: `radial-gradient(ellipse, ${C.gold}18 0%, transparent 70%)`,
                    pointerEvents: 'none',
                  }}
                />
              )}

              {/* "Most Popular" badge */}
              {isHl && (
                <div
                  style={{
                    position: 'absolute',
                    top: 16,
                    right: 16,
                    padding: '4px 12px',
                    fontSize: 10,
                    fontWeight: 700,
                    color: '#0A0A0A',
                    background: C.gold,
                    borderRadius: 20,
                    textTransform: 'uppercase',
                    letterSpacing: '1px',
                    fontFamily: C.font,
                  }}
                >
                  Most Popular
                </div>
              )}

              <div style={{ fontSize: 11, fontWeight: 600, color: C.gray, textTransform: 'uppercase', letterSpacing: '1.5px', fontFamily: C.font, marginBottom: 8 }}>
                {t.name}
              </div>

              <div style={{ display: 'flex', alignItems: 'baseline', gap: 4, marginBottom: 4 }}>
                <span
                  style={{
                    fontSize: t.price === 'Custom' ? 36 : 44,
                    fontWeight: 800,
                    fontFamily: C.font,
                    color: isHl ? C.gold : C.white,
                  }}
                >
                  {t.price}
                </span>
                {t.priceSub && (
                  <span style={{ fontSize: 15, color: C.gray, fontFamily: C.font }}>
                    {t.priceSub}
                  </span>
                )}
              </div>

              <p style={{ fontSize: 13, color: '#888', margin: '0 0 20px', fontFamily: C.font, lineHeight: 1.5 }}>
                Best for {t.bestFor}
              </p>

              <div style={{ flex: 1, marginBottom: 24 }}>
                {t.features.map((f) => (
                  <div
                    key={f}
                    style={{
                      display: 'flex',
                      alignItems: 'flex-start',
                      gap: 10,
                      marginBottom: 10,
                      fontSize: 13.5,
                      color: '#ccc',
                      fontFamily: C.font,
                      lineHeight: 1.5,
                    }}
                  >
                    <span style={{ color: C.gold, fontSize: 14, marginTop: 1, flexShrink: 0 }}>✓</span>
                    {f}
                  </div>
                ))}
                {t.overage && (
                  <div
                    style={{
                      marginTop: 12,
                      padding: '8px 12px',
                      fontSize: 12,
                      color: C.gray,
                      background: `${C.gold}08`,
                      border: `1px solid ${C.gold}15`,
                      borderRadius: 8,
                      fontFamily: C.font,
                    }}
                  >
                    Overage: {t.overage}
                  </div>
                )}
              </div>

              <button
                onClick={onSignup}
                style={isHl ? { ...btnSolid, width: '100%' } : { ...btnOutline, width: '100%' }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'translateY(-2px)';
                  if (isHl) e.currentTarget.style.boxShadow = `0 0 36px ${C.gold}88`;
                  else e.currentTarget.style.borderColor = C.white;
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'translateY(0)';
                  if (isHl) e.currentTarget.style.boxShadow = `0 0 24px ${C.gold}66`;
                  else e.currentTarget.style.borderColor = C.cardBorder;
                }}
              >
                {t.cta}
              </button>
            </div>
          );
        })}
      </div>
    </section>
  );

  /* ── 3. token explainer ── */
  const tokenExplainer = (
    <section style={{ padding: '80px 24px', maxWidth: 1000, margin: '0 auto' }}>
      <h2
        style={{
          textAlign: 'center',
          fontSize: 36,
          fontWeight: 700,
          color: C.white,
          margin: '0 0 12px',
          fontFamily: C.font,
        }}
      >
        You don't pay us for{' '}
        <span style={{ color: C.gold }}>tokens</span>
      </h2>
      <p
        style={{
          textAlign: 'center',
          fontSize: 16,
          color: C.gray,
          margin: '0 auto 48px',
          maxWidth: 600,
          lineHeight: 1.7,
          fontFamily: C.font,
        }}
      >
        AI Gateway is additive infrastructure — it sits between your app and your providers
        without replacing any billing relationships.
      </p>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr auto 1fr', gap: 0, alignItems: 'stretch' }}>
        {/* LEFT — what you pay us */}
        <div
          style={{
            ...glassCard,
            padding: '32px 28px',
            borderTop: `2px solid ${C.gold}66`,
          }}
        >
          <div
            style={{
              fontSize: 11,
              fontWeight: 700,
              color: C.gold,
              textTransform: 'uppercase',
              letterSpacing: '1.5px',
              marginBottom: 16,
              fontFamily: C.font,
            }}
          >
            What you pay us
          </div>
          <div style={{ fontSize: 14, color: '#bbb', fontFamily: C.font, lineHeight: 1.7 }}>
            Gateway infrastructure capabilities:
          </div>
          <div style={{ marginTop: 16 }}>
            {['Intelligent routing & failover', 'Policy enforcement', 'Cost dashboards & attribution', 'Prompt caching', 'Observability & audit logs', 'Multi-tenant governance'].map((item) => (
              <div
                key={item}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 10,
                  marginBottom: 10,
                  fontSize: 13.5,
                  color: '#ddd',
                  fontFamily: C.font,
                }}
              >
                <span style={{ color: C.gold, fontSize: 13 }}>●</span>
                {item}
              </div>
            ))}
          </div>
        </div>

        {/* divider */}
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '0 24px',
          }}
        >
          <div
            style={{
              width: 2,
              flex: 1,
              background: `linear-gradient(180deg, transparent 0%, ${C.cardBorder} 30%, ${C.cardBorder} 70%, transparent 100%)`,
            }}
          />
          <div
            style={{
              padding: '8px 14px',
              fontSize: 11,
              fontWeight: 700,
              color: C.gray,
              border: `1px solid ${C.cardBorder}`,
              borderRadius: 20,
              fontFamily: C.font,
              background: C.bg,
              margin: '12px 0',
              whiteSpace: 'nowrap',
            }}
          >
            SEPARATE
          </div>
          <div
            style={{
              width: 2,
              flex: 1,
              background: `linear-gradient(180deg, transparent 0%, ${C.cardBorder} 30%, ${C.cardBorder} 70%, transparent 100%)`,
            }}
          />
        </div>

        {/* RIGHT — what you pay providers */}
        <div
          style={{
            ...glassCard,
            padding: '32px 28px',
            borderTop: `2px solid ${C.blue}66`,
          }}
        >
          <div
            style={{
              fontSize: 11,
              fontWeight: 700,
              color: C.blue,
              textTransform: 'uppercase',
              letterSpacing: '1.5px',
              marginBottom: 16,
              fontFamily: C.font,
            }}
          >
            What you pay providers
          </div>
          <div style={{ fontSize: 14, color: '#bbb', fontFamily: C.font, lineHeight: 1.7 }}>
            Model inference tokens directly:
          </div>
          <div style={{ marginTop: 16 }}>
            {[
              { name: 'OpenAI', color: '#10a37f' },
              { name: 'Anthropic', color: '#d4a27f' },
              { name: 'Azure OpenAI', color: C.blue },
              { name: 'Google Vertex', color: '#4285f4' },
              { name: 'AWS Bedrock', color: '#ff9900' },
              { name: 'Self-hosted models', color: C.purple },
            ].map((provider) => (
              <div
                key={provider.name}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 10,
                  marginBottom: 10,
                  fontSize: 13.5,
                  color: '#ddd',
                  fontFamily: C.font,
                }}
              >
                <span style={{ color: provider.color, fontSize: 13 }}>●</span>
                {provider.name}
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );

  /* ── 4. usage table ── */
  const usageTable = (
    <section style={{ padding: '80px 24px', maxWidth: 900, margin: '0 auto' }}>
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
        Compare plans in <span style={{ color: C.gold }}>detail</span>
      </h2>

      <div
        style={{
          ...glassCard,
          overflow: 'hidden',
          padding: 0,
        }}
      >
        <table
          style={{
            width: '100%',
            borderCollapse: 'collapse',
            fontFamily: C.font,
          }}
        >
          <thead>
            <tr>
              {['Metric', 'Free', 'Pro', 'Enterprise'].map((h, i) => (
                <th
                  key={h}
                  style={{
                    padding: '16px 20px',
                    fontSize: 12,
                    fontWeight: 700,
                    color: h === 'Pro' ? C.gold : C.gray,
                    textTransform: 'uppercase',
                    letterSpacing: '1.5px',
                    textAlign: i === 0 ? 'left' : 'center',
                    borderBottom: `1px solid ${C.cardBorder}`,
                    background: `${C.gold}06`,
                  }}
                >
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {usageRows.map((row, ri) => (
              <tr key={row.metric}>
                <td
                  style={{
                    padding: '14px 20px',
                    fontSize: 14,
                    color: '#ddd',
                    borderBottom: ri < usageRows.length - 1 ? `1px solid ${C.cardBorder}` : 'none',
                  }}
                >
                  {row.metric}
                </td>
                {[row.free, row.pro, row.enterprise].map((val, ci) => (
                  <td
                    key={ci}
                    style={{
                      padding: '14px 20px',
                      fontSize: 14,
                      fontWeight: val === 'Unlimited' || val === 'Included' ? 600 : 400,
                      color: ci === 1 ? C.gold : val === 'Unlimited' ? C.white : '#bbb',
                      textAlign: 'center',
                      borderBottom: ri < usageRows.length - 1 ? `1px solid ${C.cardBorder}` : 'none',
                    }}
                  >
                    {val}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );

  /* ── 5. calculator ── */
  const sliderTrack: CSSProperties = {
    width: '100%',
    height: 6,
    borderRadius: 3,
    appearance: 'none' as CSSProperties['appearance'],
    WebkitAppearance: 'none',
    background: `linear-gradient(90deg, ${C.gold}44, ${C.gold}22)`,
    outline: 'none',
    cursor: 'pointer',
  };

  const calculator = (
    <section style={{ padding: '80px 24px', maxWidth: 700, margin: '0 auto' }}>
      <h2
        style={{
          textAlign: 'center',
          fontSize: 36,
          fontWeight: 700,
          color: C.white,
          margin: '0 0 12px',
          fontFamily: C.font,
        }}
      >
        Estimate your <span style={{ color: C.gold }}>cost</span>
      </h2>
      <p
        style={{
          textAlign: 'center',
          fontSize: 16,
          color: C.gray,
          margin: '0 auto 48px',
          maxWidth: 500,
          fontFamily: C.font,
        }}
      >
        Drag the sliders to see which plan fits your usage.
      </p>

      <div
        style={{
          ...glassCard,
          padding: '36px 32px',
          boxShadow: `0 0 60px ${C.gold}0c`,
        }}
      >
        {/* requests slider */}
        <div style={{ marginBottom: 32 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12 }}>
            <span style={{ fontSize: 14, color: '#ccc', fontFamily: C.font }}>AI Requests / month</span>
            <span style={{ fontSize: 16, fontWeight: 700, color: C.gold, fontFamily: C.font }}>
              {formatNum(REQUEST_MARKS[calcRequests])}
            </span>
          </div>
          <input
            type="range"
            min={0}
            max={REQUEST_MARKS.length - 1}
            value={calcRequests}
            onChange={(e) => setCalcRequests(Number(e.target.value))}
            style={sliderTrack}
          />
          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 6 }}>
            <span style={{ fontSize: 11, color: '#666', fontFamily: C.font }}>100K</span>
            <span style={{ fontSize: 11, color: '#666', fontFamily: C.font }}>100M</span>
          </div>
        </div>

        {/* namespaces slider */}
        <div style={{ marginBottom: 36 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12 }}>
            <span style={{ fontSize: 14, color: '#ccc', fontFamily: C.font }}>Namespaces</span>
            <span style={{ fontSize: 16, fontWeight: 700, color: C.gold, fontFamily: C.font }}>
              {NS_MARKS[calcNs]}{calcNs === NS_MARKS.length - 1 ? '+' : ''}
            </span>
          </div>
          <input
            type="range"
            min={0}
            max={NS_MARKS.length - 1}
            value={calcNs}
            onChange={(e) => setCalcNs(Number(e.target.value))}
            style={sliderTrack}
          />
          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 6 }}>
            <span style={{ fontSize: 11, color: '#666', fontFamily: C.font }}>1</span>
            <span style={{ fontSize: 11, color: '#666', fontFamily: C.font }}>50+</span>
          </div>
        </div>

        {/* result */}
        <div
          style={{
            background: `linear-gradient(135deg, ${C.gold}14 0%, ${C.gold}06 100%)`,
            border: `1px solid ${C.gold}33`,
            borderRadius: 12,
            padding: '24px 28px',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}
        >
          <div>
            <div style={{ fontSize: 12, color: C.gray, fontFamily: C.font, textTransform: 'uppercase', letterSpacing: '1px', marginBottom: 4 }}>
              Recommended plan
            </div>
            <div style={{ fontSize: 24, fontWeight: 800, color: C.white, fontFamily: C.font }}>
              {rec.tier}
            </div>
          </div>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: 12, color: C.gray, fontFamily: C.font, textTransform: 'uppercase', letterSpacing: '1px', marginBottom: 4 }}>
              Estimated cost
            </div>
            <div
              style={{
                fontSize: 28,
                fontWeight: 800,
                fontFamily: C.font,
                background: `linear-gradient(135deg, ${C.white}, ${C.gold})`,
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
              }}
            >
              {rec.cost}
            </div>
          </div>
        </div>
      </div>
    </section>
  );

  /* ── 6. enterprise governance ── */
  const governanceSection = (
    <section style={{ padding: '80px 24px', maxWidth: 1100, margin: '0 auto' }}>
      <h2
        style={{
          textAlign: 'center',
          fontSize: 36,
          fontWeight: 700,
          color: C.white,
          margin: '0 0 12px',
          fontFamily: C.font,
        }}
      >
        Enterprise-grade <span style={{ color: C.gold }}>governance</span>
      </h2>
      <p
        style={{
          textAlign: 'center',
          fontSize: 16,
          color: C.gray,
          margin: '0 auto 48px',
          maxWidth: 600,
          fontFamily: C.font,
        }}
      >
        Production AI demands operational control. Every plan builds toward full governance.
      </p>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 24 }}>
        {enterpriseCards.map((c, i) => {
          const isHov = hoveredEntCard === i;
          return (
            <div
              key={c.title}
              onMouseEnter={() => setHoveredEntCard(i)}
              onMouseLeave={() => setHoveredEntCard(null)}
              style={{
                ...glassCard,
                padding: '32px 28px',
                transition: 'transform .2s, border-color .2s, box-shadow .2s',
                transform: isHov ? 'translateY(-4px)' : 'none',
                borderColor: isHov ? `${c.accent}55` : C.cardBorder,
                boxShadow: isHov ? `0 8px 32px ${c.accent}1a` : 'none',
                cursor: 'default',
                borderTop: `2px solid ${c.accent}44`,
                position: 'relative',
                overflow: 'hidden',
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
                  background: `radial-gradient(ellipse, ${c.accent}15 0%, transparent 70%)`,
                  pointerEvents: 'none',
                }}
              />
              <div
                style={{
                  width: 48,
                  height: 48,
                  borderRadius: 12,
                  background: `linear-gradient(135deg, ${c.accent}20 0%, ${c.accent}08 100%)`,
                  border: `1px solid ${c.accent}22`,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: 24,
                  marginBottom: 16,
                }}
              >
                {c.icon}
              </div>
              <h3
                style={{
                  fontSize: 17,
                  fontWeight: 700,
                  color: C.white,
                  margin: '0 0 8px',
                  fontFamily: C.font,
                }}
              >
                {c.title}
              </h3>
              <p
                style={{
                  fontSize: 13.5,
                  color: '#999',
                  lineHeight: 1.7,
                  margin: 0,
                  fontFamily: C.font,
                }}
              >
                {c.desc}
              </p>
            </div>
          );
        })}
      </div>
    </section>
  );

  /* ── 7. competitive positioning ── */
  const competitiveSection = (
    <section style={{ padding: '80px 24px', maxWidth: 800, margin: '0 auto' }}>
      <h2
        style={{
          textAlign: 'center',
          fontSize: 36,
          fontWeight: 700,
          color: C.white,
          margin: '0 0 12px',
          fontFamily: C.font,
        }}
      >
        Gateway vs. <span style={{ color: C.gold }}>Development Platform</span>
      </h2>
      <p
        style={{
          textAlign: 'center',
          fontSize: 15,
          color: C.gray,
          margin: '0 auto 48px',
          maxWidth: 560,
          lineHeight: 1.7,
          fontFamily: C.font,
        }}
      >
        We govern AI traffic. Development platforms build AI apps. Use both.
      </p>

      <div style={{ ...glassCard, overflow: 'hidden', padding: 0 }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontFamily: C.font }}>
          <thead>
            <tr>
              {['Capability', 'AI Gateway', 'AI Dev Platforms'].map((h, i) => (
                <th
                  key={h}
                  style={{
                    padding: '16px 20px',
                    fontSize: 12,
                    fontWeight: 700,
                    color: i === 1 ? C.gold : C.gray,
                    textTransform: 'uppercase',
                    letterSpacing: '1.5px',
                    textAlign: i === 0 ? 'left' : 'center',
                    borderBottom: `1px solid ${C.cardBorder}`,
                    background: `${C.gold}06`,
                  }}
                >
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {comparisonRows.map((row, ri) => (
              <tr key={row.feature}>
                <td
                  style={{
                    padding: '14px 20px',
                    fontSize: 14,
                    color: '#ddd',
                    borderBottom: ri < comparisonRows.length - 1 ? `1px solid ${C.cardBorder}` : 'none',
                  }}
                >
                  {row.feature}
                </td>
                {[row.gateway, row.platform].map((val, ci) => (
                  <td
                    key={ci}
                    style={{
                      padding: '14px 20px',
                      fontSize: 16,
                      textAlign: 'center',
                      borderBottom: ri < comparisonRows.length - 1 ? `1px solid ${C.cardBorder}` : 'none',
                      color: val ? (ci === 0 ? C.gold : '#78d97e') : '#555',
                    }}
                  >
                    {val ? '✓' : '✗'}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );

  /* ── 8. FAQ ── */
  const faqSection = (
    <section style={{ padding: '80px 24px', maxWidth: 750, margin: '0 auto' }}>
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
        Frequently asked <span style={{ color: C.gold }}>questions</span>
      </h2>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        {faqItems.map((faq, i) => {
          const isOpen = openFaq === i;
          return (
            <div
              key={i}
              style={{
                ...glassCard,
                padding: 0,
                overflow: 'hidden',
                borderColor: isOpen ? `${C.gold}33` : C.cardBorder,
                transition: 'border-color .2s',
              }}
            >
              <button
                onClick={() => setOpenFaq(isOpen ? null : i)}
                style={{
                  width: '100%',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  padding: '20px 24px',
                  background: 'transparent',
                  border: 'none',
                  cursor: 'pointer',
                  fontFamily: C.font,
                  textAlign: 'left',
                }}
              >
                <span style={{ fontSize: 15, fontWeight: 600, color: C.white }}>
                  {faq.q}
                </span>
                <span
                  style={{
                    fontSize: 18,
                    color: C.gold,
                    transition: 'transform .2s',
                    transform: isOpen ? 'rotate(45deg)' : 'rotate(0deg)',
                    flexShrink: 0,
                    marginLeft: 16,
                  }}
                >
                  +
                </span>
              </button>
              {isOpen && (
                <div
                  style={{
                    padding: '0 24px 20px',
                    fontSize: 14,
                    color: C.gray,
                    lineHeight: 1.75,
                    fontFamily: C.font,
                  }}
                >
                  {faq.a}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </section>
  );

  /* ── 9. CTA banner ── */
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
        Start governing your AI traffic today
      </h2>
      <p style={{ fontSize: 17, color: C.gray, margin: '0 0 36px', fontFamily: C.font }}>
        From prototypes to production — the control plane that scales with you.
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
          onClick={() => alert('Contact sales@azure-ai-gateway.com for Enterprise pricing')}
          onMouseEnter={(e) => {
            e.currentTarget.style.borderColor = C.white;
            e.currentTarget.style.transform = 'translateY(-2px)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.borderColor = C.cardBorder;
            e.currentTarget.style.transform = 'translateY(0)';
          }}
        >
          Talk to Sales
        </button>
      </div>
    </section>
  );

  /* ── 10. footer ── */
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
          {[
            { label: 'Pricing', path: '/pricing' },
            { label: 'Docs', path: '/docs' },
            { label: 'Demo', path: '/demo' },
            { label: 'GitHub', path: '#github' },
            { label: 'Support', path: '#support' },
          ].map((link) => (
            <a
              key={link.label}
              href={link.path.startsWith('#') ? link.path : undefined}
              onClick={
                link.path.startsWith('/')
                  ? (e) => {
                      e.preventDefault();
                      navigate(link.path);
                    }
                  : undefined
              }
              style={{
                fontSize: 13,
                color: C.gray,
                textDecoration: 'none',
                cursor: 'pointer',
                transition: 'color .15s',
              }}
              onMouseEnter={(e) => (e.currentTarget.style.color = C.white)}
              onMouseLeave={(e) => (e.currentTarget.style.color = C.gray)}
            >
              {link.label}
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
      {pricingTiers}
      {tokenExplainer}
      {usageTable}
      {calculator}
      {governanceSection}
      {competitiveSection}
      {faqSection}
      {ctaBanner}
      {footer}
    </div>
  );
};

export default PricingPage;
