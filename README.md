# Azure AI Gateway

**The Control Plane for AI Traffic**

Azure AI Gateway is a governance-first control plane for managing AI traffic across providers in production environments. It gives platform engineers, operations teams, and security teams a single pane of glass over every model, tool, and agent — whether running on Azure AI Foundry, AWS Bedrock, Google Vertex, OpenAI, Anthropic, or self-hosted infrastructure.

The portal uses a **black and soft indigo** premium design language — modern, enterprise-grade, and universally appealing.

---

## Public Pages

Before authentication, visitors see a set of marketing and onboarding pages:

| Page | Path | Description |
|------|------|-------------|
| **Landing** | `/` | Hero section ("One Control Plane for Every AI Model, Tool, and Agent"), architecture diagram, feature highlights, and live stats |
| **Pricing** | `/pricing` | Three-tier SaaS pricing — Developer (free), Pro ($99/mo), Enterprise (custom) |
| **Docs** | `/docs` | Documentation hub with search, quickstart cards, and code examples |
| **Demo** | `/demo` | Interactive guided walkthrough with four animated scenarios |

---

## Portal Navigation

After login the sidebar is organized into four sections:

### Configure

| Page | Path | Description |
|------|------|-------------|
| **Assets** | `/assets` | Registered models, tools, and agents |
| **Credentials** | `/credentials` | API keys, managed identities, and secret rotation |
| **Routing** | `/routing` | Multi-provider rules, failover chains, and load balancing |
| **Policies** | `/policies` | Token limits, rate limits, and content safety guardrails |

### Monitor

| Page | Path | Description |
|------|------|-------------|
| **Metrics** | `/observability` | Traffic stats, cost attribution, and budget tracking (3 tabs: Traffic, Cost, Budgets) |
| **Audit Log** | `/logs` | Complete request and response audit trail |

### Govern

| Page | Path | Description |
|------|------|-------------|
| **Namespaces** | `/namespaces` | Team boundaries, quotas, budget rules, and isolation policies |
| **Access Control** | `/access` | Roles, permissions, and identity management |

### Tools

| Page | Path | Description |
|------|------|-------------|
| **Test Console** | `/test-console` | Test routing rules and policy enforcement live |

---

## Advanced Features

### Overview Dashboard
Developer-first landing page with Quick Start shortcuts, gateway health hero, key metrics, attention-needed alerts, recent activity, and top models table.

### Policy Lifecycle
Version history, impact simulator, staged rollout, and full audit trail for every policy change. AI-powered policy composition.

### Cost Governance
Namespace-level budget rules, anomaly detection, and chargeback reports for cost attribution across teams. Budget configuration in Namespaces, budget monitoring in Metrics.

### Credential Blast Radius
Dependency graph showing which models, tools, and agents rely on each credential, with emergency revocation.

### Metrics
Three-tab analytics: Traffic (request stats, throughput, provider distribution), Cost (spend analysis, cost-by-model, chargeback), Budgets (allocation tracking, burn rates, alerts).

---

## Registration Wizards

Three six-step wizards for onboarding assets from any platform. Each follows a consistent flow: **Source → Endpoint → Configuration → Governance → Namespace → Review**.

### Register Model
Sources: Azure AI Foundry (auto-discover), AWS Bedrock, Google Vertex, OpenAI, Anthropic, Self-Hosted.

### Register Tool
Sources: MCP Servers, REST APIs, SaaS Connectors.

### Register Agent
Sources: Foundry Agent Service, AWS Bedrock Agents, Google Vertex AI Agents, A2A Protocol, Custom Endpoints.

---

## Tech Stack

- **React 19** + TypeScript
- **Fluent UI v9** (icons only)
- **Vite 7** bundler
- **React Router 7** client-side routing
- Inline `CSSProperties` dark theme (no external CSS framework)

---

## Getting Started

### Prerequisites

- Node.js 20+
- npm 9+

### Development

```bash
npm install
npm run dev          # http://localhost:5173
```

### Production Build

```bash
npm run build        # Output in /dist
```

### Deploy to Vercel

The repo includes `vercel.json` for SPA routing.

---

## Related

- **[standalone-ai-gateway](https://github.com/anishta_microsoft/standalone-ai-gateway)** — AI Gateway Studio portal and runtime engine
