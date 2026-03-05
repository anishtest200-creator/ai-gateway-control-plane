# Azure AI Gateway — Strategic Positioning

> **Foundry builds AI. The Gateway operates AI.**

---

## 1. Executive Summary

Azure AI Gateway is the **operations and governance layer** for AI workloads in production. It sits between consumers — applications, agents, and developers — and AI backends — Azure AI Foundry, AWS Bedrock, Google Vertex AI, OpenAI, and self-hosted models. The Gateway does not build, train, or deploy models. It routes, governs, secures, and observes AI traffic at the enterprise boundary. Organizations use it to enforce consistent policies, manage credentials, control costs, and gain cross-platform observability over every AI interaction — regardless of which platforms or providers their teams have chosen.

---

## 2. What Is Azure AI Gateway?

Azure AI Gateway is the **production operations layer for enterprise AI**. It provides:

- **Cloud-agnostic traffic mediation** — Route requests to any AI provider (Azure OpenAI, Bedrock, Vertex, self-hosted) through a single, governed entry point.
- **Enterprise governance at the API boundary** — Enforce token quotas, content safety policies, and audit logging before traffic ever reaches a model.
- **Credential mediation** — Centralize secrets and provider credentials so that applications and developers never manage them directly.
- **Multi-tenant namespace isolation** — Allocate capacity, enforce policies, and attribute costs per team, project, or business unit.
- **Cross-platform observability** — Trace AI traffic end-to-end across providers, with unified dashboards for latency, cost, and usage.

**What it is not:**

- It is **not** a model catalog. It does not host or index thousands of models for discovery.
- It is **not** an agent builder. It does not provide tools for authoring agent logic or workflows.
- It is **not** a training platform. It does not fine-tune, evaluate, or benchmark models.

The Gateway operates what others build.

---

## 3. What Is Microsoft Foundry?

Microsoft Foundry (Azure AI Foundry) is the **AI development and deployment platform**. It provides:

- **Model catalog** — Access to 11,000+ models from Microsoft, OpenAI, Meta, Mistral, and the open-source community.
- **Agent builder** — Visual and code-first tools for building AI agents with grounding, tool use, and memory.
- **Workflow designer** — Orchestrate multi-step AI pipelines with prompt flows and evaluation loops.
- **Training and fine-tuning** — Customize models on proprietary data with managed compute.
- **Evaluation** — Benchmark model quality, safety, and groundedness before deployment.

Foundry is **Azure-native**. It is where teams go to build, train, evaluate, and deploy AI applications on Microsoft's cloud.

---

## 4. How They Work Together

Foundry and the AI Gateway are **complementary, not competitive**. Foundry is where AI gets built. The Gateway is where AI gets operated.

| Concern | Foundry | AI Gateway |
| --- | --- | --- |
| Build models | ✓ | ✗ |
| Train / fine-tune | ✓ | ✗ |
| Deploy models | ✓ | ✗ |
| Build agents | ✓ | ✗ |
| Route AI traffic | ✗ | ✓ |
| Cross-cloud governance | ✗ | ✓ |
| Token quota enforcement | Basic | ✓ Full |
| Tool traffic governance | ✗ | ✓ |
| Credential mediation | ✗ | ✓ |
| Multi-tenant namespaces | ✗ | ✓ |
| Content safety at boundary | Basic | ✓ Full |
| Cost attribution by team | ✗ | ✓ |
| Observability (traces) | Per-model | Cross-platform |

The typical enterprise pattern: teams build in Foundry, then register their deployments in the Gateway for production traffic. The Gateway adds the governance, routing, and observability that production workloads demand — without requiring changes to the models or agents themselves.

---

## 5. Who Is It For?

**Primary audiences:**

- **Platform engineering teams** — who build and maintain the internal AI infrastructure
- **AI operations teams** — who manage production AI workloads at scale
- **Security and compliance teams** — who enforce policies across all AI usage

**Secondary audience:**

- **AI developers** — who consume governed endpoints to build applications

### Persona-Specific Elevator Pitches

**CTO:**
"Unified governance over all AI spending and risk, regardless of which platforms your teams use."

**Platform Engineer:**
"One control plane to route, govern, and observe AI traffic across all providers."

**Security / Compliance:**
"Enforce content safety, credential mediation, and audit logging at the AI boundary — not inside each app."

**AI Developer:**
"Discover approved models and tools, connect through governed endpoints, no credential management needed."

---

## 6. Portal Experience

The Azure AI Gateway is operated through two complementary portals, each serving a distinct role.

### AI Gateway Control Plane — Governance Portal

The **AI Gateway Control Plane** is the governance-first portal for platform engineers, operations teams, and security teams. It provides:

- **Operations-first interface** — Traffic dashboards, routing rules, policy management, credential configuration, and compliance monitoring.
- **Enterprise governance at scale** — Namespace isolation, access control, token quotas, audit logging, and policy enforcement across all registered AI assets.
- **Registry-centric** — Assets are shown as "what's registered for production governance," not "what's available to build with." This is a governance and operations view.

The Control Plane portal is organized into four sections — **Operations** (Overview, Traffic, Routing, Policies), **Inventory** (Catalog), **Insights** (Analytics, Audit Log), and **Administration** (Namespaces, Access Control, Secrets, Compliance) — plus a Playground for interactive testing.

### AI Gateway Studio — Developer Portal

The [AI Gateway Studio](https://github.com/anishta_microsoft/standalone-ai-gateway) serves as the developer-facing portal. It provides the full-featured experience for asset catalogs, interactive playground, model/tool/agent management, and self-contained operation without dependency on Foundry or any other AI development platform. Organizations that use the Gateway as their primary AI platform interact through the Studio.

---

## 7. Five Reasons You Need an AI Gateway Even If You Have Foundry

### 1. Cross-Cloud Traffic

Foundry is Azure-only. The Gateway governs traffic to **any** provider — Azure OpenAI, AWS Bedrock, Google Vertex AI, Anthropic, Cohere, and self-hosted models. If your organization uses more than one AI provider, you need a governance layer that spans all of them.

### 2. Production Governance

Foundry governs what you **build**. The Gateway governs what **runs**. Development-time guardrails are necessary but insufficient. Production traffic needs runtime enforcement of token limits, content safety, rate limiting, and audit logging — applied consistently at the API boundary.

### 3. Multi-Team Cost Control

Namespace-based token quotas and cost attribution give finance and platform teams visibility into AI spending **per team, per project, per business unit**. Foundry tracks costs per deployment. The Gateway tracks costs per consumer — a fundamentally different and complementary view.

### 4. Tool Traffic Security

AI agents call external tools — APIs, databases, third-party services. That tool traffic needs governance at the boundary: authentication, authorization, rate limiting, and logging. The Gateway provides this layer so that each agent does not need to implement it independently.

### 5. Credential Mediation

Centralizing secrets management means applications and developers never touch provider credentials directly. The Gateway mediates authentication to backend providers, rotates credentials on schedule, and enforces least-privilege access — reducing the blast radius of any single compromise.

---

## 8. Strategic Positioning Statement

Azure AI Gateway is the operations layer for enterprise AI. It enables organizations to securely route, govern, and observe AI workloads across any combination of AI platforms — from Azure AI Foundry to AWS Bedrock to self-hosted models. While Foundry provides the tools to build AI applications, the Gateway provides the infrastructure to operate them safely at enterprise scale.

**Foundry builds AI. The Gateway operates AI.**
