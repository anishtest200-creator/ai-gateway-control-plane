# MVP Scope — Azure AI Gateway

## Phase 1 — MVP (End of March 2026)

### Objective
Launch a functional standalone AI Gateway that demonstrates core value across the top customer scenarios for models, tools, and agents.

### Portal Experience

This repository contains the **Azure AI Gateway Control Plane** — the control plane for every AI model, tool, and agent in production. Features a modern black + soft indigo design with 12 console pages and 4 public marketing pages. Navigation: **Configure** (Assets, Credentials, Routing, Policies), **Monitor** (Metrics, Audit Log), **Govern** (Namespaces, Access Control), **Tools** (Test Console).

See [standalone-ai-gateway](https://github.com/anishta_microsoft/standalone-ai-gateway) for the companion AI Gateway Studio portal.

### P0 Scenarios (27 total)

#### Models (10 P0 scenarios)
| ID | Scenario | Why P0 |
|----|---------|--------|
| M1 | Register models from Foundry, AWS Bedrock, elsewhere | Core value prop |
| M2 | Expose Anthropic models via messages API | Cloud-agnostic positioning |
| M3 | Expose Vertex AI Gemini models | Must support all major providers |
| M4 | Unified model API across heterogeneous models | Key differentiator |
| M5 | Granular token limits and quotas | Enterprise requirement |
| M6 | Developer-specific keys/tokens for auth | Fundamental security |
| M7 | Request throttling and IP filtering | Abuse protection |
| M11 | Automatic model failover (same provider) | HA for production |
| M12 | Cross-provider model failover | Major differentiator |
| M13 | Usage monitoring (logs, traces, metrics, tokens/user) | Enterprise observability |

#### Tools (14 P0 scenarios)
| ID | Scenario | Why P0 |
|----|---------|--------|
| T1 | Onboard externally hosted MCP endpoints | MCP is the protocol moment |
| T2 | Convert OpenAPI APIs to MCP endpoints (no code) | Massive differentiator |
| T3 | Register tools in enterprise catalog | Core catalog value |
| T4 | Public and private catalog collections | Multi-tenant must-have |
| T7 | Team-based tool visibility (RBAC) | Enterprise requirement |
| T8 | Auth for tool access (OAuth, API keys, Entra ID) | Security must-have |
| T9 | Secure backend credential management | No dev secret handling |
| T12 | Policy-based access control for tools | Runtime governance core |
| T13 | Throttling, quotas, IP filtering for tools | Same protection as models |
| T14 | Consistent governance across APIs and MCP | Unified governance selling point |
| T16 | Tool usage monitoring | Observability must-have |
| T19 | Developer discovery through catalogs | Core discovery |
| T20 | Team-scoped tool access | RBAC must-have |
| T24-T27 | Standardized tool connection, consistent usage, MCP aggregation | Core developer experience |

#### Agents (5 P0 scenarios)
| ID | Scenario | Why P0 |
|----|---------|--------|
| A1 | Expose RAPI/A2A agents | Agent-first world |
| A3 | OpenTelemetry monitoring for agents | Observability must-have |
| A6 | Per-user throttling for agents | Abuse protection |
| A7 | Secure agent access | Security must-have |
| A8 | Automatic agent failover | HA must-have |

### MVP Architecture Requirements
- Multi-tenant gateway (leveraging APIM backend)
- Governance-first portal with 12 console pages and 4 public pages
- Serverless deployment model
- OpenTelemetry-based observability
- Cross-provider model routing and failover

### Success Criteria
1. ✅ Can register and route to models from 3+ providers (Azure OpenAI, Anthropic, Gemini)
2. ✅ Can convert an OpenAPI spec to an MCP server with zero code
3. ✅ Can enforce token quotas, rate limits, and access control
4. ✅ Can demonstrate cross-provider failover (Azure OpenAI → Anthropic)
5. ✅ Can show multi-tenant catalog with team-based discovery
6. ✅ Demo-ready for customer showcases
