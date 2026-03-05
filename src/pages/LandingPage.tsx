import { useState, useEffect, type CSSProperties, type FC } from 'react';
import { useNavigate } from 'react-router-dom';

interface LandingPageProps {
  onLogin: () => void;
  onSignup: () => void;
}

/* ─── palette ─── */
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

/* ─── component ─── */
const LandingPage: FC<LandingPageProps> = ({ onLogin, onSignup }) => {
  const [hoveredFeature, setHoveredFeature] = useState<number | null>(null);
  const navigate = useNavigate();

  /* inject keyframe animation once */
  useEffect(() => {
    if (document.getElementById('ops-landing-keyframes')) return;
    const style = document.createElement('style');
    style.id = 'ops-landing-keyframes';
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
      {/* logo + badge */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <span style={{ fontSize: 22 }}>⚡</span>
        <span style={{ color: C.gold, fontWeight: 700, fontSize: 17, letterSpacing: -0.3 }}>
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

      {/* nav links */}
      <div style={{ display: 'flex', gap: 28, alignItems: 'center' }}>
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
              color: C.gray,
              cursor: 'pointer',
              transition: 'color .15s',
              fontFamily: C.font,
            }}
            onMouseEnter={(e) => (e.currentTarget.style.color = C.white)}
            onMouseLeave={(e) => (e.currentTarget.style.color = C.gray)}
          >
            {link.label}
          </span>
        ))}
      </div>

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
    </nav>
  );

  /* ── hero ── */
  const hero = (
    <section
      style={{
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        textAlign: 'center',
        padding: '120px 24px 60px',
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

      {/* badge */}
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
        ✦ Model-Agnostic · Platform-Agnostic · Production-Grade
      </div>

      <h1
        style={{
          fontSize: 60,
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
        The Control Plane for Every AI&nbsp;Model, Tool, and&nbsp;Agent in&nbsp;Production
      </h1>

      <p
        style={{
          fontSize: 19,
          color: C.gray,
          maxWidth: 720,
          margin: '24px auto 0',
          lineHeight: 1.7,
          fontFamily: C.font,
          animation: 'fadeInUp 1s ease-out',
        }}
      >
        Route, govern, secure, and observe every AI model, tool, and agent in production —
        across Azure OpenAI, Amazon Bedrock, Google Vertex, Anthropic, and any backend.
      </p>

      <div style={{ display: 'flex', gap: 16, marginTop: 40 }}>
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
          Get Started
        </button>
        <button
          style={btnOutline}
          onClick={() => navigate('/docs')}
          onMouseEnter={(e) => {
            e.currentTarget.style.borderColor = C.white;
            e.currentTarget.style.transform = 'translateY(-2px)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.borderColor = C.cardBorder;
            e.currentTarget.style.transform = 'translateY(0)';
          }}
        >
          View Documentation
        </button>
      </div>

      {/* architecture diagram */}
      <div
        style={{
          ...glassCard,
          marginTop: 56,
          padding: '32px 48px',
          maxWidth: 860,
          width: '100%',
          boxShadow: `0 0 80px ${C.gold}12, 0 0 160px ${C.goldDim}08, inset 0 1px 0 rgba(129, 140, 248, 0.10)`,
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
                  padding: '8px 26px',
                  fontSize: 13,
                  fontWeight: 600,
                  color: '#e0e0e0',
                  border: '1px solid rgba(129, 140, 248, 0.12)',
                  borderRadius: 10,
                  fontFamily: C.font,
                  background: 'linear-gradient(135deg, rgba(129, 140, 248, 0.06) 0%, rgba(129, 140, 248, 0.02) 100%)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                  boxShadow: '0 2px 8px rgba(0,0,0,0.2)',
                }}
              >
                <span style={{ fontSize: 15 }}>{c.icon}</span>
                {c.label}
              </div>
            ))}
          </div>
        </div>

        {/* connector line down */}
        <div style={{ display: 'flex', justifyContent: 'center', padding: '4px 0' }}>
          <div
            style={{
              width: 2,
              height: 22,
              background: `linear-gradient(180deg, ${C.goldDim}44 0%, ${C.gold}66 100%)`,
              borderRadius: 1,
            }}
          />
        </div>

        {/* gateway box */}
        <div
          style={{
            border: `1.5px solid ${C.gold}88`,
            borderRadius: 14,
            padding: '16px 32px',
            textAlign: 'center',
            background: `linear-gradient(180deg, ${C.gold}14 0%, ${C.gold}06 100%)`,
            boxShadow: `0 0 40px ${C.gold}22, 0 0 80px ${C.gold}0a`,
            position: 'relative',
          }}
        >
          <div
            style={{
              fontSize: 22,
              fontWeight: 800,
              color: C.gold,
              fontFamily: C.font,
              letterSpacing: '-0.3px',
            }}
          >
            AI Gateway
          </div>
          <div style={{ display: 'flex', justifyContent: 'center', gap: 16, marginTop: 8 }}>
            {['Route', 'Govern', 'Secure', 'Observe'].map((action) => (
              <span
                key={action}
                style={{
                  fontSize: 12,
                  fontWeight: 600,
                  color: C.gold,
                  padding: '4px 16px',
                  borderRadius: 20,
                  background: `${C.gold}10`,
                  border: `1px solid ${C.gold}22`,
                  fontFamily: C.font,
                }}
              >
                {action}
              </span>
            ))}
          </div>
        </div>

        {/* connector line down — splits into 3 columns */}
        <div style={{ display: 'flex', justifyContent: 'center', padding: '4px 0' }}>
          <div
            style={{
              width: 2,
              height: 14,
              background: `linear-gradient(180deg, ${C.gold}66 0%, ${C.goldDim}44 100%)`,
              borderRadius: 1,
            }}
          />
        </div>
        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 4 }}>
          <div
            style={{
              width: '90%',
              height: 1,
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
                <div
                  key={b}
                  style={{
                    padding: '6px 16px',
                    fontSize: 11,
                    fontWeight: 600,
                    color: '#E8E8E8',
                    border: '1px solid rgba(129, 140, 248, 0.10)',
                    borderRadius: 8,
                    fontFamily: C.font,
                    background: 'rgba(129, 140, 248, 0.03)',
                    boxShadow: '0 2px 8px rgba(0,0,0,0.2)',
                    width: '80%',
                  }}
                >
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
                <div
                  key={b}
                  style={{
                    padding: '6px 16px',
                    fontSize: 11,
                    fontWeight: 600,
                    color: '#E8E8E8',
                    border: '1px solid rgba(129, 140, 248, 0.10)',
                    borderRadius: 8,
                    fontFamily: C.font,
                    background: 'rgba(129, 140, 248, 0.03)',
                    boxShadow: '0 2px 8px rgba(0,0,0,0.2)',
                    width: '80%',
                  }}
                >
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
                <div
                  key={b}
                  style={{
                    padding: '6px 16px',
                    fontSize: 11,
                    fontWeight: 600,
                    color: '#E8E8E8',
                    border: '1px solid rgba(129, 140, 248, 0.10)',
                    borderRadius: 8,
                    fontFamily: C.font,
                    background: 'rgba(129, 140, 248, 0.03)',
                    boxShadow: '0 2px 8px rgba(0,0,0,0.2)',
                    width: '80%',
                  }}
                >
                  {b}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );

  /* ── stats strip ── */
  const stats = (
    <section style={{ padding: '48px 24px 64px', textAlign: 'center' }}>
      <div
        style={{
          display: 'flex',
          justifyContent: 'center',
          gap: 48,
          flexWrap: 'wrap',
          maxWidth: 1000,
          margin: '0 auto',
        }}
      >
        {[
          { value: '< 50ms', label: 'P99 Latency' },
          { value: '99.99%', label: 'Uptime SLA' },
          { value: '10B+', label: 'Tokens Governed' },
          { value: '500+', label: 'Enterprise Teams' },
        ].map((stat) => (
          <div key={stat.label} style={{ textAlign: 'center', padding: '16px 20px', minWidth: 160 }}>
            <div
              style={{
                fontSize: 40,
                fontWeight: 800,
                fontFamily: C.font,
                color: C.gold,
                lineHeight: 1.1,
              }}
            >
              {stat.value}
            </div>
            <div
              style={{
                fontSize: 13,
                color: '#888',
                marginTop: 8,
                fontFamily: C.font,
                letterSpacing: '0.5px',
                textTransform: 'uppercase',
              }}
            >
              {stat.label}
            </div>
          </div>
        ))}
      </div>
    </section>
  );

  /* ── features ── */
  const features = [
    {
      icon: '📊',
      title: 'Traffic Control',
      desc: 'Real-time traffic dashboard with throughput metrics, latency heatmaps, and live request tracing across all endpoints.',
      accent: C.gold,
    },
    {
      icon: '🔀',
      title: 'Intelligent Routing',
      desc: 'Cross-cloud routing with automatic failover, weighted load balancing, and cost-optimized model selection.',
      accent: C.goldDim,
    },
    {
      icon: '🛡️',
      title: 'Policy Enforcement',
      desc: 'Token limits, rate limiting, and content safety guardrails enforced at the gateway boundary before requests reach backends.',
      accent: C.amber,
    },
    {
      icon: '🔑',
      title: 'Credential Mediation',
      desc: 'Centralized secret management with managed identities, key rotation, and zero-trust access to downstream providers.',
      accent: C.purple,
    },
    {
      icon: '🏢',
      title: 'Namespace Governance',
      desc: 'Multi-tenant isolation with hierarchical policies, team-based access controls, and per-namespace quota management.',
      accent: C.gold,
    },
    {
      icon: '🌐',
      title: 'Cross-Platform Observability',
      desc: 'Distributed traces, unified metrics, and cost attribution across Azure, AWS, Google, and self-hosted providers.',
      accent: C.pink,
    },
  ];

  const featuresSection = (
    <section style={{ padding: '80px 24px', maxWidth: 1100, margin: '0 auto' }}>
      <h2
        style={{
          textAlign: 'center',
          fontSize: 40,
          fontWeight: 700,
          color: C.white,
          margin: '0 0 56px',
          fontFamily: C.font,
        }}
      >
        Everything you need to&nbsp;
        <span style={{ color: C.gold }}>govern AI at scale</span>
      </h2>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 24 }}>
        {features.map((f, i) => {
          const isHov = hoveredFeature === i;
          return (
            <div
              key={f.title}
              onMouseEnter={() => setHoveredFeature(i)}
              onMouseLeave={() => setHoveredFeature(null)}
              style={{
                ...glassCard,
                padding: '32px 28px',
                transition: 'transform .2s, border-color .2s, box-shadow .2s',
                transform: isHov ? 'translateY(-4px)' : 'none',
                borderColor: isHov ? `${f.accent}55` : C.cardBorder,
                boxShadow: isHov ? `0 8px 32px ${f.accent}1a` : 'none',
                cursor: 'default',
                borderTop: `2px solid ${f.accent}44`,
                position: 'relative',
                overflow: 'hidden',
              }}
            >
              {/* accent glow */}
              <div
                style={{
                  position: 'absolute',
                  top: -40,
                  left: '50%',
                  transform: 'translateX(-50%)',
                  width: 120,
                  height: 80,
                  background: `radial-gradient(ellipse, ${f.accent}15 0%, transparent 70%)`,
                  pointerEvents: 'none',
                }}
              />
              <div
                style={{
                  width: 48,
                  height: 48,
                  borderRadius: 12,
                  background: `linear-gradient(135deg, ${f.accent}20 0%, ${f.accent}08 100%)`,
                  border: `1px solid ${f.accent}22`,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: 24,
                  marginBottom: 16,
                }}
              >
                {f.icon}
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
                {f.title}
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
                {f.desc}
              </p>
            </div>
          );
        })}
      </div>
    </section>
  );

  /* ── works with ── */
  const worksWithSection = (
    <section style={{ padding: '64px 24px', textAlign: 'center' }}>
      <h2
        style={{
          fontSize: 32,
          fontWeight: 700,
          color: C.white,
          margin: '0 0 32px',
          fontFamily: C.font,
        }}
      >
        Works with any AI platform
      </h2>
      <div
        style={{
          display: 'flex',
          justifyContent: 'center',
          gap: 16,
          flexWrap: 'wrap',
          maxWidth: 800,
          margin: '0 auto',
        }}
      >
        {['Azure AI Foundry', 'AWS Bedrock', 'Google Vertex', 'OpenAI', 'Anthropic', 'Self-Hosted'].map(
          (platform) => (
            <div
              key={platform}
              style={{
                padding: '10px 24px',
                fontSize: 14,
                fontWeight: 600,
                color: C.gray,
                border: `1px solid ${C.cardBorder}`,
                borderRadius: 10,
                fontFamily: C.font,
                background: C.cardBg,
                transition: 'border-color .15s, color .15s',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = `${C.gold}55`;
                e.currentTarget.style.color = C.white;
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = C.cardBorder;
                e.currentTarget.style.color = C.gray;
              }}
            >
              {platform}
            </div>
          ),
        )}
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
        Take control of your AI workloads with enterprise-grade routing, governance, and observability.
      </p>
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
        Get Started
      </button>
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
          {[
            { label: 'Pricing', path: '/pricing' },
            { label: 'Docs', path: '/docs' },
            { label: 'Demo', path: '/demo' },
          ].map((s) => (
            <span
              key={s.label}
              onClick={() => navigate(s.path)}
              style={{
                fontSize: 13,
                color: C.gray,
                textDecoration: 'none',
                transition: 'color .15s',
                cursor: 'pointer',
              }}
              onMouseEnter={(e) => (e.currentTarget.style.color = C.white)}
              onMouseLeave={(e) => (e.currentTarget.style.color = C.gray)}
            >
              {s.label}
            </span>
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
      {stats}
      {featuresSection}
      {worksWithSection}
      {ctaBanner}
      {footer}
    </div>
  );
};

export default LandingPage;
