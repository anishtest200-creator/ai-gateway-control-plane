# Scenario Matrix — Azure AI Gateway

This document contains the full scenario inventory, organized by asset type and persona, with prioritization for the standalone AI gateway.

## Priority Levels
- **P0 (MVP Must-Have)** — Ship in Phase 1. Core value prop, competitive table stakes, or top customer ask.
- **P1 (Fast Follow)** — Ship in Phase 2. Important but can follow MVP launch.
- **P2 (Future)** — Phase 3+. Nice-to-have, enhances ecosystem.

## Prioritization Criteria
- **Customer demand** — what enterprise customers need most urgently
- **Competitive parity** — what Kong and others already offer (table stakes)
- **Differentiation** — what makes our standalone gateway unique and winning

---

## MODELS

### Admin / Platform Engineer

| # | Scenario | Status | Priority | Rationale |
|---|---------|--------|----------|-----------|
| M1 | Expose RAPI/CAPI models from Foundry, AWS Bedrock, or elsewhere | ⭐ Available (UI) | **P0** | Core value prop — multi-cloud model access is table stakes |
| M2 | Expose Anthropic models via messages API | ⌚ Roadmap | **P0** | Critical for cloud-agnostic positioning; top customer ask |
| M3 | Expose Vertex AI Gemini models | ⌚ Roadmap | **P0** | Must support all major providers day 1 |
| M4 | Unified model API across heterogeneous models | ⌚ Roadmap | **P0** | Key differentiator — single API across all providers |
| M5 | Granular token limits and quotas (per user/key/IP) | ⭐ Available (UI) | **P0** | Enterprise requirement, competitive table stakes |
| M6 | Secure access with developer-specific keys/tokens | ⭐ Available (UI) | **P0** | Fundamental security |
| M7 | Request throttling and IP filtering | ⭐ Available (UI) | **P0** | Abuse protection |
| M8 | Content safety guardrails | ⭐ Available (UI) | **P1** | Important but can use external services initially |
| M9 | Traffic splitting for A/B testing | ⭐ Available (UI) | **P1** | Valuable but not blocking MVP |
| M10 | Semantic caching for similar prompts | ⭐ Available (UI) | **P1** | Cost optimization — important but not day 1 |
| M11 | Automatic model failover (same provider) | ⭐ Available (UI) | **P0** | HA critical for production |
| M12 | Cross-provider model failover | ⭐ Available (UI) | **P0** | Major differentiator |
| M13 | Monitor usage (logs, traces, metrics, tokens/user) | ⭐ Available (UI) | **P0** | Observability non-negotiable |
| M14 | Log prompts/completions without stream interruption | ⭐ Available (UI) | **P1** | Compliance — can follow MVP |
| M19 | Register models from Foundry, Bedrock, Vertex, OpenAI, Anthropic, self-hosted | ⭐ Available (UI) | **P0** | Core registration experience |

### Developer / Agent Builder

| # | Scenario | Status | Priority | Rationale |
|---|---------|--------|----------|-----------|
| M15 | Discover models in portal + acquire credentials | ⭐ Available (UI) | **P0** | Core discovery experience |
| M16 | Consume models through unified API | ⌚ Roadmap | **P0** | Developer side of M4 |
| M17 | Discover models in GitHub Copilot CLI | ⌚ Roadmap | **P2** | Cool but not MVP |
| M18 | A/B test via traffic splitting | ⭐ Available (UI) | **P1** | Developer side of M9 |

---

## TOOLS

> **Note:** Tool governance is a key differentiator from Azure AI Foundry. While Foundry may host tools, the gateway mediates and governs tool traffic — enforcing access policies, rate limits, credential management, and execution auditing at the API boundary.

### Admin / Platform Engineer

| # | Scenario | Status | Priority | Rationale |
|---|---------|--------|----------|-----------|
| T1 | Onboard externally hosted MCP endpoints | ⭐ Available (UI) | **P0** | MCP is the protocol moment |
| T2 | Convert OpenAPI APIs to MCP (no code) | ⭐ Available (UI) | **P0** | Massive differentiator |
| T3 | Register tools in enterprise catalog | ⭐ Available (UI) | **P0** | Core catalog value |
| T4 | Public and private catalog collections | ⭐ Available (UI) | **P0** | Multi-tenant must-have |
| T5 | Skills as first-class catalog entities | ⌚ Roadmap | **P1** | Skills follow tools |
| T6 | Bundle tools/skills/models into Products | ⌚ Roadmap | **P1** | Composition — fast follow |
| T7 | Team-based tool visibility | ⭐ Available (UI) | **P0** | RBAC enterprise requirement |
| T8 | Auth for tool access (OAuth, API keys, Entra ID) | ⭐ Available (UI) | **P0** | Security must-have |
| T9 | Secure backend credential management | ⭐ Available (UI) | **P0** | Enterprise must-have |
| T10 | Approval workflows for asset onboarding | ⌚ Roadmap | **P1** | Governance workflow |
| T11 | Delegated access (On-Behalf-Of) | ⌚ Roadmap | **P1** | Advanced auth |
| T12 | Policy-based access control | ⭐ Available (UI) | **P0** | Runtime governance core |
| T13 | Throttling, quotas, IP filtering for tools | ⭐ Available (UI) | **P0** | Same protection as models |
| T14 | Consistent governance across APIs and MCP | ⌚ Roadmap | **P0** | Unified governance selling point |
| T15 | Granular governance at tool level | ⌚ Roadmap | **P1** | Per-MCP-server is fine for MVP |
| T16 | Tool usage monitoring (logs, metrics, perf) | ⭐ Available (UI) | **P0** | Observability must-have |
| T17 | MCP observability with deeper analytics | ⌚ Roadmap | **P1** | Enhanced — fast follow |
| T18 | Correlate tool usage with agent workflows | ⌚ Roadmap | **P2** | Advanced analytics |
| T28+ | Register tools from Foundry, OpenAPI, MCP, SaaS with governance wizard | ⭐ Available (UI) | **P0** | Core registration experience |

### Developer / Agent Builder

| # | Scenario | Status | Priority | Rationale |
|---|---------|--------|----------|-----------|
| T19 | Discover tools through governed catalogs | ⭐ Available (UI) | **P0** | Core discovery |
| T20 | Access only team-approved tools | ⭐ Available (UI) | **P0** | RBAC must-have |
| T21 | Intent-based tool discovery at design time | ⌚ Roadmap | **P1** | Compelling but not MVP |
| T22 | Discover skills alongside tools | ⌚ Roadmap | **P1** | Follows T5 |
| T23 | Discover bundled capabilities | ⌚ Roadmap | **P2** | Follows T6 |
| T24 | Add APIs/MCP servers with familiar auth | ⭐ Available (UI) | **P0** | Frictionless onboarding |
| T25 | Standardized endpoints with built-in governance | ⭐ Available (UI) | **P0** | Value prop |
| T26 | Consistent tool usage across workflows | ⭐ Available (UI) | **P0** | Consistency must-have |
| T27 | Combine APIs & MCP servers behind one endpoint | ⌚ Roadmap | **P0** | Aggregation differentiator |
| T28 | Tools with structured resources and guided flows | ⌚ Roadmap | **P1** | Rich capabilities |

---

## AGENTS

> **Note:** The gateway does not build or host agents — it governs agent traffic in production. These scenarios cover routing, authentication, observability, and safety enforcement for agents built and deployed through platforms like Azure AI Foundry, AWS Bedrock, or custom infrastructure.

### Admin / Platform Engineer

| # | Scenario | Status | Priority | Rationale |
|---|---------|--------|----------|-----------|
| A1 | Route and govern RAPI/A2A agent traffic | ⭐ Available (UI) | **P0** | Agent traffic governance is core differentiator |
| A2 | Sync agents from Vertex AI and AWS Bedrock | ⌚ Roadmap | **P1** | Multi-cloud — fast follow |
| A3 | Monitor agent calls with OpenTelemetry | ⭐ Available (UI) | **P0** | Observability must-have |
| A4 | Content safety for RAPI agents | ⭐ Available (UI) | **P1** | Safety — follows M8 |
| A5 | Content safety for A2A and MCP agents | ⌚ Roadmap | **P1** | Same as A4 |
| A6 | Per-user throttling and IP filtering | ⭐ Available (UI) | **P0** | Abuse protection |
| A7 | Secure agent access with keys/tokens | ⭐ Available (UI) | **P0** | Security must-have |
| A8 | Automatic agent failover | ⭐ Available (UI) | **P0** | HA must-have |
| A9+ | Register agents from Foundry, Bedrock, Vertex, A2A, RAPI with binding governance | ⭐ Available (UI) | **P0** | Core registration experience |

### Developer / Agent Builder

| # | Scenario | Status | Priority | Rationale |
|---|---------|--------|----------|-----------|
| A9 | Discover agents in portal or GitHub CLI | ⌚ Roadmap | **P1** | Discovery — fast follow |

---

## Summary by Priority

| Priority | Models | Tools | Agents | Total |
|----------|--------|-------|--------|-------|
| **P0 (MVP)** | 10 | 14 | 5 | **29** |
| **P1 (Fast Follow)** | 4 | 8 | 4 | **16** |
| **P2 (Future)** | 1 | 2 | 0 | **3** |
