# Azure AI Gateway — Product Specification

> Consolidated product specification. Edit this document to drive prototype changes.
> Last updated: March 2026

---

## 1. Product Definition

### What It Is
Azure AI Gateway is the **control plane for every AI model, tool, and agent in production** — a multi-tenant platform that enables organizations to securely route, govern, and observe AI workloads across any combination of AI providers.

### What It Is Not
- Not a model hosting/training platform (that's Azure AI Foundry)
- Not an agent builder or workflow designer (that's Foundry)
- Not a traditional API gateway with AI plugins bolted on (that's APIM/Kong)
- Not a lightweight model proxy (that's LiteLLM)

### Core Value Proposition
"The control plane for every AI model, tool, and agent in production — across Azure OpenAI, Amazon Bedrock, Google Vertex, Anthropic, and any backend."

### Four Pillars
| Pillar | What It Does |
|--------|-------------|
| **Route** | Intelligent multi-provider routing with failover, load balancing, cost optimization |
| **Govern** | Namespace-based multi-tenant governance with policies, quotas, access control |
| **Secure** | Credential mediation, content safety, authentication, tool access enforcement |
| **Observe** | Cross-platform traces, token analytics, cost attribution, audit logging |

---

## 2. Target Users

### Primary: Platform Engineers / AI Operations
- Configure routing rules and failover chains
- Define namespaces, policies, and credential scopes
- Monitor traffic, costs, and policy enforcement
- Manage multi-tenant access control

### Secondary: AI Developers / Agent Builders
- Discover approved models and tools through governed catalogs
- Connect through standardized endpoints with built-in auth
- Test workloads in the Test Console
- No need to manage provider credentials

### Tertiary: Security / Compliance Teams
- Enforce content safety at the gateway boundary
- Audit all AI traffic (prompts, responses, tool calls)
- Manage credential lifecycle and rotation
- Ensure PII detection and redaction

---

## 3. Entity Model

### Hierarchy
```
Organization
  └── Domain (optional grouping)
       └── Namespace (primary governance boundary)
            ├── Models
            ├── Tools
            ├── Agents
            ├── Policies
            ├── Credentials
            └── Consumers
```

### First-Class Entities

#### Models
AI models registered from any provider. A model entity contains:
- **Provider**: Azure OpenAI, OpenAI, Anthropic, Google Vertex, AWS Bedrock, Self-Hosted
- **Endpoint**: Provider-specific URL and deployment name
- **Capabilities**: Chat, completion, embedding, image, audio, vision, function-calling
- **Routing metadata**: Region, priority, cost tier, health status
- **Policies**: Token quotas, rate limits, content safety rules
- **Failover**: Ordered list of backup models (can cross providers and regions)

#### Tools
External capabilities that agents can invoke:
- **Types**: REST API, MCP Server, SaaS Connector, Database, GraphQL, gRPC
- **Endpoint**: URL + authentication method
- **Governance**: Allowlists, rate limits, execution auditing, namespace access
- **Credential binding**: Which credential to use for upstream auth
- **Sub-types**: APIs, MCP Servers, Connectors, Triggers

#### Agents
AI agents whose traffic flows through the gateway:
- **Protocol**: RAPI, A2A, Custom
- **Bindings**: Which models and tools the agent can access
- **Policies**: Token limits, tool access restrictions, safety rules, execution limits (max tool calls, max runtime, max iterations)
- **Routing**: Primary endpoint + failover configuration

#### Namespaces
Primary governance boundary grouping related assets:
- **Assets**: Models, tools, agents registered within this namespace
- **Policies**: Inherited + namespace-specific rules (cascade: Organization → Namespace → Asset)
- **Credentials**: Scoped to this namespace, isolated from other namespaces
- **Consumers**: Who can access this namespace's assets
- **Observability**: Metrics aggregated at namespace level
- **Environments**: Sandbox, Development, Production (policies may differ per environment)
- **Types**: `managed` (admin-created) or `personal` (developer-created)

#### Policies
Rules enforced at the gateway:
- **Rate limiting**: Requests per minute/hour/day by consumer
- **Token quotas**: Max tokens per period by consumer/namespace
- **Content safety**: Prompt/response filtering rules
- **Access control**: Which consumers can access which assets
- **IP filtering**: Allowlist/blocklist by source IP
- **Routing rules**: Model selection, failover, load balancing
- **Agent execution**: Max tool calls per run, max runtime seconds, max iterations

#### Credentials
Secrets managed by the gateway for upstream access:
- **Types**: API Key, OAuth 2.0 (Client Credentials), OAuth 2.0 (Authorization Code), Managed Identity, Service Account, AWS SigV4, IAM Role, Connection String, Entra Token, mTLS Certificate, Bearer Token, Key Vault Reference, Custom Header
- **Scope**: Global, namespace, asset-specific, or environment-specific
- **Lifecycle**: Created → Active → Expiring → Expired → Rotated
- **Mediation**: Gateway injects credentials into upstream requests — consumers never see them
- **Storage**: Built-in encrypted store (AES-256), Azure Key Vault reference, or HashiCorp Vault reference

#### Consumers
Applications, developers, or agents that call the gateway:
- **Identity**: API key, JWT, Entra token, Managed Identity
- **Permissions**: Which namespaces and assets they can access
- **Quotas**: Per-consumer rate limits and token budgets

#### Asset Registration Flows

All assets are registered through governance-first wizards with a consistent 6-step flow:

| Step | Purpose | Key Decisions |
|------|---------|---------------|
| 1. Source | Where the asset is hosted | Foundry, Bedrock, Vertex, OpenAI, Anthropic, Self-Hosted, External |
| 2. Endpoint | Configure connection details | URL, region, credentials, protocol (varies by source) |
| 3. Configuration | Asset-specific settings | Routing (models), Auth (tools), Bindings (agents) |
| 4. Governance | Apply policies | Rate limits, token quotas, content safety, audit logging, access control |
| 5. Namespace | Organizational assignment | Namespace, visibility, tags, ownership, approval requirements |
| 6. Review | Confirm and register | Summary of all settings before registration |

**Source-specific registration:**

**Models** support 6 sources:
- Azure AI Foundry — auto-discover from connected projects
- AWS Bedrock — register by region + model ID
- Google Vertex — register by project + region + model
- OpenAI — select model + configure API base
- Anthropic — select model + configure API base
- Self-Hosted — any OpenAI-compatible endpoint (vLLM, Ollama, TGI)

**Tools** support 4 types × 4 sources:
- Types: MCP Server, REST API, SaaS Connector
- Sources: Foundry import, OpenAPI import, External endpoint, API→MCP conversion
- API→MCP conversion is a gateway-exclusive capability — converts REST APIs to MCP protocol with zero code

**Agents** support 6 sources:
- Azure AI Foundry Agent Service — auto-discover from projects
- AWS Bedrock Agents — register by region + agent ID
- Google Vertex AI Agents — register by project + agent ID
- A2A Protocol — register via agent card URL
- RAPI (REST Agent Protocol) — register REST-based agents
- Custom — any agent endpoint with HTTP, gRPC, or WebSocket protocol

**Agent bindings** (Step 3 for agents) declare what models and tools the agent can access through the gateway. These bindings are enforced at runtime — even if the agent attempts unauthorized access, the gateway blocks it.

---

## 4. Architecture

### Request Flow
```
Consumer → Gateway Ingress → Authentication → Policy Evaluation → Routing Decision → Credential Injection → Upstream Call → Response Safety Check → Response Delivery → Observability Logging
```

### Components

#### Control Plane
- **Asset Registry**: Register, update, deprecate models/tools/agents with governed lifecycle (Registered → Approved → Published → Deprecated)
- **Governance Engine**: Namespace management, policy CRUD, access rules, approval workflows
- **Credential Manager**: Credential management, rotation, scope resolution, expiry monitoring
- **Identity Service**: Consumer authentication, RBAC (Platform Admin, Namespace Admin, AI Developer, Viewer, Service Identity)

#### Data Plane
- **Intelligent Router**: Multi-provider routing, failover, load balancing, cost-aware selection
- **Policy Engine**: Runtime enforcement of rate limits, quotas, safety, access control, agent execution limits
- **Credential Mediator**: Resolve and inject credentials per request (asset-specific → namespace → global fallback)
- **Semantic Cache**: Cache responses for semantically similar prompts to reduce cost (P1)
- **Observability Pipeline**: OpenTelemetry-based trace generation, metric collection, log aggregation

### Supported Backends
| Provider | Models | Tools | Agents |
|----------|--------|-------|--------|
| Azure OpenAI | ✓ | — | — |
| OpenAI | ✓ | — | — |
| Anthropic | ✓ | — | — |
| Google Vertex AI | ✓ | — | — |
| AWS Bedrock | ✓ | — | — |
| Self-Hosted / Custom | ✓ | — | — |
| REST APIs | — | ✓ | — |
| MCP Servers | — | ✓ | — |
| SaaS (Salesforce, ServiceNow, etc.) | — | ✓ | — |
| Databases | — | ✓ | — |
| RAPI/A2A Agents | — | — | ✓ |
| Foundry Agents | — | — | ✓ |

---

## 5. Portal Experience

### Azure AI Gateway Control Plane
Governance-first portal for platform engineers, operations teams, and security teams. Modern black + soft indigo (#818CF8) design language.

**Public Pages:**
| Page | Path | Description |
|------|------|-------------|
| Landing | `/` | Hero, architecture diagram, feature highlights, stats |
| Pricing | `/pricing` | 3-tier SaaS — Developer (free), Pro ($99/mo), Enterprise (custom) |
| Docs | `/docs` | Documentation hub with search, quickstart cards, code examples |
| Demo | `/demo` | Interactive guided walkthrough with 4 animated scenarios |

**Console Navigation:**
| Section | Pages |
|---------|-------|
| Configure | Assets, Credentials, Routing, Policies |
| Monitor | Metrics (Traffic / Cost / Budgets tabs), Audit Log |
| Govern | Namespaces, Access Control |
| Tools | Test Console |

**Key Interactions:**
- Developer-first Overview with Quick Start shortcuts, gateway health, key metrics, and attention alerts
- Monitor real-time traffic, cost attribution, and budget tracking across 3 Metrics tabs
- Configure routing rules and failover chains
- Manage credentials, rotation policies, blast radius analysis, and expiry alerts
- **Register models** from Azure AI Foundry, Amazon Bedrock, Google Vertex, OpenAI, Anthropic, or self-hosted endpoints
- **Register tools** — MCP servers, REST APIs, SaaS connectors; import from Foundry or OpenAPI
- **Register agents** from Foundry Agent Service, Bedrock, Vertex, or custom A2A endpoints with model/tool binding governance
- View governance status across all assets (fully governed, partially governed, ungoverned)
- Configure namespace-level budget rules (scope, threshold, enforcement actions)
- Cost governance with anomaly detection and chargeback reports

**Advanced Features:**
- Policy lifecycle: version history, impact simulator, staged rollout, audit trail
- Credential blast radius: dependency graph showing which assets rely on each credential
- 6-step registration wizards (Source → Endpoint → Configuration → Governance → Namespace → Review)

**Tech Stack:**
- React 19 + TypeScript
- Fluent UI v9 (icons only)
- Vite 7 bundler
- React Router 7 client-side routing
- Inline CSSProperties dark theme (no external CSS framework)

See the [AI Gateway Studio](https://github.com/anishta_microsoft/standalone-ai-gateway) for the companion developer-focused portal.

---

## 6. API Surface (Planned)

### Gateway Proxy API (Data Plane)
```
POST   /v1/chat/completions          — Proxied model request (OpenAI-compatible)
POST   /v1/embeddings                — Proxied embedding request
POST   /v1/tools/{toolId}/invoke     — Proxied tool invocation
POST   /v1/agents/{agentId}/run      — Proxied agent request
```

### Management API (Control Plane)
```
# Models
GET    /api/models                    — List registered models
POST   /api/models                    — Register a model
GET    /api/models/{id}               — Get model details
PUT    /api/models/{id}               — Update model config
DELETE /api/models/{id}               — Remove model

# Tools
GET    /api/tools                     — List registered tools
POST   /api/tools                     — Register a tool
POST   /api/tools/convert             — Convert OpenAPI → MCP
GET    /api/tools/{id}                — Get tool details

# Agents
GET    /api/agents                    — List registered agents
POST   /api/agents                    — Register an agent
GET    /api/agents/{id}               — Get agent details

# Namespaces
GET    /api/namespaces                — List namespaces
POST   /api/namespaces                — Create namespace
GET    /api/namespaces/{id}           — Get namespace details

# Policies
GET    /api/policies                  — List policies
POST   /api/policies                  — Create policy
PUT    /api/policies/{id}             — Update policy

# Credentials
GET    /api/credentials               — List credentials (metadata only)
POST   /api/credentials               — Store credential
DELETE /api/credentials/{id}          — Remove credential
POST   /api/credentials/{id}/rotate   — Rotate credential

# Consumers
GET    /api/consumers                 — List consumers
POST   /api/consumers                 — Register consumer
POST   /api/consumers/{id}/keys       — Issue API key

# Observability
GET    /api/metrics                   — Get traffic metrics
GET    /api/traces                    — Get distributed traces
GET    /api/logs                      — Get audit logs
```

---

## 7. Routing Specification

### Routing Strategies
| Strategy | Description |
|----------|-------------|
| **Priority** | Route to highest-priority healthy endpoint |
| **Failover** | Try endpoints in order until one succeeds |
| **Round Robin** | Distribute evenly across endpoints |
| **Weighted** | Distribute by configured weights |
| **Cost-Aware** | Prefer cheapest endpoint that meets capability requirements |
| **Latency-Aware** | Prefer lowest-latency endpoint |
| **PTU → PAYGO Fallback** | Use provisioned throughput first, fall back to pay-as-you-go |

### Failover Triggers
- HTTP 429 (Rate Limited) → try next endpoint
- HTTP 5xx (Server Error) → try next endpoint
- Timeout (configurable, default 30s) → try next endpoint
- Health check failure → remove from rotation

### Health Checks
- Interval: configurable (default 30s)
- Method: lightweight probe to provider endpoint
- Unhealthy threshold: 3 consecutive failures
- Recovery: auto-restore after 2 successful checks

### Cross-Provider Failover
The gateway supports failover chains that span providers (e.g., Azure OpenAI GPT-4o → OpenAI GPT-4o → Anthropic Claude 3.5). Each link in the chain resolves its own credential from the credential store — consumers are unaware of the failover.

---

## 8. Policy Specification

### Rate Limiting
- **Scope**: Per-consumer, per-namespace, per-model, per-tool, global
- **Windows**: Per-second, per-minute, per-hour, per-day
- **Action on exceed**: Return 429 with retry-after header
- **Burst**: Allow configurable burst above sustained rate

### Token Quotas
- **Scope**: Per-consumer, per-namespace
- **Tracking**: Prompt tokens + completion tokens
- **Period**: Rolling window (hourly, daily, monthly)
- **Action on exceed**: Return 429 with quota reset time
- **Alerts**: Configurable threshold alerts (e.g., 80% utilization)

### Content Safety
- **Prompt scanning**: Check input for harmful content, prompt injection, jailbreak attempts
- **Response scanning**: Check output for harmful content, PII
- **Action**: Block request/response with 400 and safety violation details
- **Configurable**: Enable/disable per namespace, adjust sensitivity
- **Provider-independent**: Enforced at the gateway boundary, not delegated to upstream providers

### Access Control
- **Model**: RBAC with roles (Platform Admin, Namespace Admin, AI Developer, Viewer, Service Identity)
- **Scope**: Organization, namespace, asset level
- **Consumer mapping**: API key → consumer → roles → permissions
- **Policy cascade**: Organization → Namespace → Asset → Agent

### Six Core Access Policy Types
| Policy | Purpose |
|--------|---------|
| Asset Visibility Policy | Who can see an asset in the catalog (private / namespace / organization / public) |
| Namespace Access Policy | Which namespaces can import and use an asset |
| Identity Access Policy | Which users or services can invoke an asset |
| Usage Requirement Policy | Conditions required before an asset can be used |
| Asset Approval Policy | Whether an asset requires admin approval before usage |
| Credential Scope Policy | Which credentials can be used with assets and where |

### Agent Execution Policies
- **Max tool calls per run**: Prevent runaway agent loops
- **Max runtime seconds**: Enforce execution time limits
- **Max iterations**: Cap reasoning loops

### Tool Governance
- **Tool Allowlist**: Only approved consumers can invoke specific tools
- **Execution Auditing**: Log all tool inputs, outputs, and timing
- **Outbound Network Restrictions**: Limit which domains tools can reach
- **Data Classification**: Public, Internal, Confidential, Restricted (auto-enables PII scanning for Confidential+)
- **Invocation Timeout**: Max execution time per tool call (default 30s)

### Agent Session Governance
- **Tool Invocation Limits**: Max tool calls per agent session (default 50)
- **Session Duration**: Max time for a single agent session (default 300s)
- **Turn Limits**: Max conversational turns per session (default 20)
- **Model/Tool Binding Enforcement**: Agent can only access models and tools declared during registration
- **Failover Behavior**: Configurable per agent — retry, failover, skip, or abort on model/tool failure

---

## 9. Credential Mediation Specification

### Flow
1. Consumer authenticates to gateway (API key / JWT / Entra token / Managed Identity)
2. Gateway resolves consumer identity and namespace
3. Gateway looks up credential for target asset in credential store
4. Gateway injects credential into upstream request
5. Consumer never sees the upstream credential
6. Gateway strips internal credential metadata from the response
7. Credential usage is logged for audit

### Credential Resolution Order
1. Asset-specific credential (if configured)
2. Namespace-scoped credential for the provider
3. Global credential for the provider
4. Fail with 401 if no credential found

### Supported Credential Types
| Type | Injection Method | Rotation |
|------|-----------------|----------|
| API Key | Authorization header or query param | Manual or scheduled |
| OAuth 2.0 (Client Credentials) | Bearer token (auto-refresh) | Token refresh flow |
| OAuth 2.0 (Authorization Code) | Bearer token (delegated/OBO) | Token refresh flow |
| Managed Identity | Azure token exchange | Automatic |
| AWS SigV4 | AWS Signature V4 signing | Automatic |
| Service Account | JSON key file | Manual |
| IAM Role | AWS STS assume-role | Automatic |
| Connection String | Backend-specific | Manual |
| Entra Token | Bearer token | Automatic |
| mTLS Certificate | Client certificate | Manual or ACME |
| Bearer Token | Authorization header | Manual |
| Key Vault Reference | Resolved at runtime | Automatic (via Key Vault) |
| Custom Header | Configurable header | Manual |

### Credential Scoping Dimensions
| Dimension | Description |
|-----------|-------------|
| **Namespace** | Each namespace maintains its own isolated credential set |
| **Environment** | Credentials can differ per environment (sandbox vs. production) |
| **Asset** | Credentials are bound to specific assets, preventing cross-asset leakage |

### Security Controls
- All credentials encrypted at rest (AES-256)
- All credential transmission over TLS
- Credentials never logged or included in traces
- Only namespace admins can register or view credentials
- Developers and service identities can use but not view credentials
- Rotation is non-disruptive (grace period for old credentials)
- Expiry monitoring with configurable alerts

---

## 10. Observability Specification

### Metrics
| Metric | Dimensions | Aggregation |
|--------|-----------|-------------|
| Request count | namespace, model, consumer, status | Counter |
| Request latency | namespace, model, consumer | Histogram (p50, p95, p99) |
| Token usage | namespace, model, consumer, type (prompt/completion) | Counter |
| Estimated cost | namespace, model, consumer | Counter (USD) |
| Policy actions | namespace, policy, action (pass/block/limit) | Counter |
| Credential usage | namespace, credential, target | Counter |
| Upstream errors | namespace, provider, error_type | Counter |
| Tool invocations | namespace, tool, consumer | Counter |
| Agent executions | namespace, agent, consumer | Counter |

### Traces
Each request generates an OpenTelemetry trace with spans:
- `gateway.ingress` — request received
- `gateway.auth` — consumer authentication
- `gateway.policy` — policy evaluation
- `gateway.route` — routing decision
- `gateway.credential` — credential resolution
- `gateway.upstream` — call to provider
- `gateway.safety` — response safety check
- `gateway.egress` — response delivered

### Logs
Structured JSON logs for every request:
```json
{
  "timestamp": "...",
  "requestId": "...",
  "namespace": "retail-support",
  "consumer": "app-key-retail-01",
  "model": "gpt-4o",
  "provider": "azure-openai",
  "region": "eastus",
  "promptTokens": 342,
  "completionTokens": 128,
  "latencyMs": 855,
  "gatewayOverheadMs": 8,
  "status": 200,
  "policies": ["rate-limit:pass", "safety:pass"],
  "routing": "primary"
}
```

### Metrics Dashboard
Enterprise-wide observability with three tabs:
- Hero metrics: Total Tokens, Total Requests, Estimated Cost, Active Consumers
- Time-range toggle: 24h / 7d / 30d
- Filters: Model, Consumer, Namespace, Deployment
- Top Consumers table with drill-down to per-consumer detail
- Budget alerts: configurable thresholds (token count or cost) with email/webhook notification

---

## 11. Competitive Positioning

### vs Azure AI Foundry
Foundry **builds** AI. Gateway **operates** AI. Use both together — Gateway sits in front of Foundry as the governance and traffic layer. Foundry is Azure-native; Gateway is cloud-agnostic.

### vs Azure APIM AI Gateway
APIM requires full API Management deployment. Gateway is standalone, AI-native, faster to innovate, purpose-built UX. APIM fragments AI across APIM, API Center, and Foundry — Gateway is unified.

### vs LiteLLM / Portkey
They focus on model routing and observability. Gateway adds tool governance, namespace isolation, credential mediation, content safety, and agent workload support.

### vs Kong / Cloudflare
They bolt AI onto traditional API gateways. Gateway is AI-native from the ground up with first-class asset model, namespace governance, and compound AI workload support.

### Competitive Matrix
| Capability | LiteLLM | Portkey | Kong / Cloudflare | **AI Gateway** |
|---|---|---|---|---|
| Model routing | ✓ | ✓ | ✓ | ✓ |
| Token observability | Limited | ✓ | Limited | ✓ |
| Multi-provider models | ✓ | ✓ | Limited | ✓ |
| Tool governance | ✗ | Limited | Limited | ✓ |
| Agent workloads | ✗ | ✗ | ✗ | ✓ |
| Namespace governance | ✗ | ✗ | ✗ | ✓ |
| Content safety | ✗ | Limited | ✗ | ✓ |
| Managed identity | ✗ | ✗ | ✗ | ✓ |
| Credential mediation | ✗ | Limited | ✗ | ✓ |

---

## 12. Scenario Priorities

### P0 — MVP (Phase 1): 29 scenarios
| Area | Key Scenarios |
|------|--------------|
| **Models** | Multi-provider model gateway, unified API, cross-provider failover, token quotas, rate limits, observability, secure access |
| **Tools** | MCP onboarding, OpenAPI→MCP conversion, tool catalog, namespace visibility, auth/credential management, policy enforcement, monitoring |
| **Agents** | Route/govern RAPI/A2A traffic, OpenTelemetry monitoring, throttling, secure access, failover |

### P1 — Fast Follow (Phase 2): 16 scenarios
| Area | Key Scenarios |
|------|--------------|
| **Models** | Content safety guardrails, A/B traffic splitting, semantic caching, prompt/completion logging |
| **Tools** | Skills as first-class entities, product bundles, approval workflows, delegated access (OBO), granular per-tool governance, enhanced MCP observability |
| **Agents** | Multi-cloud agent sync, content safety for A2A/MCP agents, agent discovery |

### P2 — Future (Phase 3): 3 scenarios
- GitHub Copilot CLI integration for model/tool discovery
- Bundled capability discovery
- Tool-agent-prompt correlation analytics

---

## 13. Open Questions

_Track decisions that need resolution here._

- [ ] Should Skills and Workflows remain in Studio portal or be removed to avoid Foundry overlap?
- [ ] What is the deployment model — single binary, microservices, or serverless functions?
- [ ] Should the gateway support WebSocket/streaming natively or only HTTP?
- [ ] How do we handle multi-region gateway deployments (active-active vs active-passive)?
- [ ] What database backend for credential store and configuration (SQLite for dev, Cosmos/Postgres for prod)?
- [ ] Should the portal support self-service namespace creation or admin-only?
- [ ] How should sandbox environments differ from production (relaxed policies, separate credentials)?
- [ ] What is the approval workflow for external APIs and SaaS connectors?

---

## Changelog

| Date | Change | Author |
|------|--------|--------|
| March 2026 | Initial spec created from product vision, positioning, entity model, architecture, governance, credential management, scenarios, competitive analysis, and user flows | — |
| March 2026 | Extracted to dedicated repo (ai-gateway-control-plane). Updated portal section for control plane context. 12 console pages and 4 public pages built. Rebranded to soft indigo (#818CF8). Restructured nav into Configure / Monitor / Govern / Tools. | — |
