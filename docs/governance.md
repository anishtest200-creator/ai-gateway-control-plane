# Governance and Access Model

## Core Governance Principle

The AI Gateway enforces governance primarily through **Namespaces**, which act as the primary policy boundary.

A namespace groups:

- AI assets
- users and service identities
- credentials
- runtime policies
- observability data

Namespaces allow platform admins to define:

- who can access assets
- what assets can be used
- how workloads run
- how requests are routed and secured

---

## Governance Hierarchy

Policies follow a hierarchical model:

```
Organization
   ↓
Domain / Business Unit
   ↓
Namespace (primary governance boundary)
   ↓
Assets (Models, Tools, Agents, Workflows)
```

**Example:**

```
Contoso

Domain: Retail AI
   Namespace: retail-support
   Namespace: retail-analytics

Domain: Finance AI
   Namespace: fraud-detection
```

Each namespace manages its own:

- models
- tools
- agents
- workflows
- credentials
- runtime rules
- usage policies

---

## Namespace Responsibilities

Namespaces aggregate three core governance layers:

1. Asset organization
2. Access governance
3. Runtime policies

### 1. Asset Organization

Namespaces group related AI assets.

Supported assets include:

- Models
- Tools
- Agents
- Skills
- Workflows
- Connectors
- Triggers

**Example namespace:**

```
Namespace: retail-support

Models
   GPT-4o
   Claude 3.5

Tools
   Salesforce CRM
   Order Lookup API

Agents
   Support Agent

Workflows
   Refund Workflow
```

This structure allows developers to discover assets relevant to their workload.

### 2. Access Governance

Admins grant users access to namespaces rather than individual assets.

**Example:**

```
Namespace: retail-support

Members
   jane@company.com → AI Developer
   ops-team → Viewer

Service identities
   retail-support-runtime → Runtime access
```

**Roles:**

| Role | Description |
|------|-------------|
| Namespace Admin | Full control over namespace configuration, members, and policies |
| AI Developer | Can use assets, create workloads, and register new assets within namespace |
| Viewer | Read-only access to namespace assets and observability data |
| Service Identity | Runtime access for applications and agents |

This dramatically simplifies governance compared to resource-level permissions.

### 3. Namespace Runtime Policies

Namespaces define runtime rules that apply to all workloads within the namespace.

These policies control:

- model usage
- tool invocation
- agent execution
- request routing
- authentication
- safety enforcement

---

## Core Policy Categories

Policies fall into six categories.

### 1. Authentication Policies

Control who can access the gateway and invoke assets.

**JWT Validation:** The gateway validates JWT tokens before allowing access.

Example checks: issuer, audience, expiration, required claims.

```yaml
validate_jwt:
   issuer: https://login.microsoftonline.com
   audience: ai-gateway
   required_claims:
      - roles
```

**Microsoft Entra Token Validation:**

```yaml
validate_entra_token:
   tenant: contoso
   required_roles:
      - ai-workload-user
```

**API Identity and Service Authentication:** Applications and agents authenticate using service identities, managed identity, or API keys.

### 2. Managed Identity and Credential Policies

Agents often need credentials to access tools. The gateway manages credentials securely.

```
Tool: Salesforce

Authentication
   Managed Identity
   Credential: retail-salesforce-prod
```

Capabilities:

- managed identity authentication
- credential scoping per namespace
- secure secret storage
- no direct credential exposure to agents

### 3. Rate Limiting and Quotas

**Model Interaction Limits:**

```
Requests per minute: 120
Requests per user per minute: 20
```

**Token Consumption Quotas:**

```
Monthly quota: 2M tokens
Per user quota: 200K tokens
Alert threshold: 80%
```

**Tool Invocation Limits:**

```
Tool: Salesforce
Calls per minute: 50
Calls per user per minute: 10
```

### 4. Content Safety Policies

Enforce safety checks on prompts, model responses, tool payloads, and agent outputs.

```yaml
content_safety:
   detect_pii: true
   redact_sensitive_data: true
   block_harmful_content: true
```

Scenarios: preventing data exfiltration, blocking malicious prompts, enforcing enterprise AI safety rules.

### 5. Routing and Request Transformation Policies

**Request Forwarding:**

```yaml
forward_request:
   target: openai-gpt4
```

**HTTP Header Policies:**

```yaml
set_headers:
   x-ai-namespace: retail-support
   x-workload-id: support-agent
```

**URL and Endpoint Routing:**

```yaml
routing_policy:
   primary:
      model: gpt-4o
      region: eastus
   fallback:
      model: claude-3.5
```

Supports: cross-region failover, multi-provider routing, PTU → PAYGO fallback.

### 6. Agent Execution Policies

Control how agents behave during runtime.

```yaml
execution_policy:
   max_tool_calls_per_run: 20
   max_runtime_seconds: 60
   max_iterations: 8
```

These limits prevent runaway agent loops.

---

## Environment Scoping

Namespaces support multiple environments:

- Sandbox
- Development
- Production

Policies may differ between environments:

- **Sandbox:** Any model allowed, token limits relaxed
- **Production:** Only approved models, strict token quotas

---

## Observability by Namespace

All telemetry is aggregated by namespace.

Example metrics:

```
Namespace: retail-support

Token usage:     1.8M tokens / month
Tool calls:      Salesforce: 22K
Agent runs:      12K executions
```

---

## Admin Access UX

The governance experience in the portal is organized across two sidebar sections:

```
Govern
   ├ Namespaces
   │      ├ Members
   │      ├ Assets
   │      ├ Policies
   │      ├ Credentials
   │      ├ Budget Rules (scope, threshold, enforcement actions)
   │      └ Observability
   └ Access Control
          ├ Users
          ├ Service Identities
          ├ API Keys
          ├ Access Requests
          └ Audit
```

---

## MVP Governance Capabilities

| Category | Capability |
|----------|-----------|
| Authentication | JWT validation |
| Authentication | Entra token validation |
| Credentials | Managed identity for tools |
| Rate limits | Model request limits |
| Quotas | Token consumption quotas |
| Rate limits | Tool invocation limits |
| Safety | Content safety checks |
| Routing | Model routing + fallback |
| Transformation | HTTP header manipulation |
| Gateway | Request forwarding |
| Agent runtime | Execution limits |

---

# Asset Governance Model

## Goal

Define which AI assets exist, how they are organized, and who can access or operate them — with namespaces as the core boundary.

Governance is:

- **Namespace-centric**: Namespaces are the primary access boundary
- **Role-based**: Simple roles (Platform Admin, Namespace Admin, AI Developer, Viewer, Service Identity)
- **Policy-driven**: Policies cascade from organization → namespace → asset
- **Simple enough for AI developers**: Minimal configuration for common workflows

---

## Core Asset Types

The gateway governs **six primary asset types**.

### 1. Models

LLM or AI inference endpoints from: Azure OpenAI, OpenAI, Anthropic, Bedrock, Vertex, custom deployments.

Key governance controls: allowed namespaces, token quotas, rate limits, routing rules, region restrictions.

### 2. Tools

External capabilities agents can invoke: REST APIs, SaaS integrations, databases, MCP tools, enterprise services.

Key governance controls: namespace access, invocation limits, authentication credentials, network restrictions, audit logging.

### 3. Agents

Reasoning systems that orchestrate models and tools: customer support agent, ticket triage agent, analytics agent.

Key governance controls: allowed tools, allowed models, execution limits, namespace membership.

### 4. Workflows / Skills

Reusable automation patterns combining models and tools: refund workflow, document analysis, incident triage.

Key governance controls: namespace visibility, execution permissions, tool access inheritance.

### 5. Connectors

Integration configurations used by tools: Salesforce connector, ServiceNow connector, SQL connector.

Key governance controls: credential scoping, namespace access, environment restrictions.

### 6. Credentials

Secrets used for tool access: API keys, OAuth tokens, managed identities, Key Vault references.

Key governance controls: namespace scope, rotation policies, restricted visibility.

---

## Asset Visibility Levels

```
Private       → Only visible to the asset owner
Namespace     → Visible to all members of the namespace
Organization  → Visible across all namespaces
Public        → Visible to all (optional)
```

| Asset | Example Visibility |
|-------|--------------------|
| Payment Gateway | Private |
| Salesforce Tool | Namespace |
| GPT-4o | Organization |
| Weather API | Public |

---

## Asset Lifecycle

Assets follow a governed lifecycle:

```
Registered → Approved → Published → Deprecated
```

| State | Description |
|-------|-------------|
| Registered | Asset created, pending review |
| Approved | Reviewed and approved, not yet in catalog |
| Published | Live in the catalog, available for use |
| Deprecated | Marked for removal, still functional |

---

## Policy Attachment Points

Policies can be applied at:

| Scope | Example |
|-------|---------|
| Organization | Global model restrictions, content safety |
| Namespace | Token quotas, tool access control |
| Asset | Tool rate limits, model region restrictions |
| Agent | Execution limits, tool allow-lists |

Policies cascade downward: Organization → Namespace → Asset → Agent.

---

## Governance Examples

### Example 1 — Model Governance

```
Namespace: retail-support

Allowed models: GPT-4o, Claude 3.5
Token quota: 2M / month
Visibility: organization
Lifecycle: published
```

### Example 2 — Tool Governance

```
Tool: Salesforce CRM

Allowed namespaces: retail-support
Rate limit: 50 calls/min
Visibility: namespace
Lifecycle: published
```

### Example 3 — Agent Governance

```
Agent: Support Agent

Allowed tools: Salesforce, Order Lookup API
Execution limits: max tool calls: 20, max runtime: 60s
Visibility: organization
Lifecycle: published
```

---

## Design Principles

1. **Namespaces define the governance boundary**
2. **Assets are reusable but controlled**
3. **Access is role-based**
4. **Policies enforce runtime safety**
5. **Developers can build workloads without complex configuration**

---

## Asset Access Rules

Asset access is controlled through **six core policy types** that determine which assets exist, who can see them, and who can use them.

### Policy Types

| Policy | Purpose |
| --- | --- |
| Asset Visibility Policy | Who can see an asset in the catalog |
| Namespace Access Policy | Which namespaces can import and use an asset |
| Identity Access Policy | Which users or services can invoke an asset |
| Usage Requirement Policy | Conditions required before an asset can be used |
| Asset Approval Policy | Whether an asset requires admin approval before usage |
| Credential Scope Policy | Which credentials can be used with assets and where |

---

### 1. Asset Visibility Policy

Controls who can discover or see an asset in the catalog.

Visibility levels:

```
Private        — only the owner can see it
Namespace      — visible within allowed namespaces
Organization   — visible across all namespaces
Public         — publicly discoverable (optional)
```

Example:

```yaml
visibility_policy:
  asset: salesforce-tool
  visibility: namespace
  allowed_namespaces:
    - retail-support
```

---

### 2. Namespace Access Policy

Controls which namespaces can import and use an asset.

```yaml
namespace_access_policy:
  asset: gpt4o
  allowed_namespaces:
    - retail-support
    - retail-analytics
```

Assets are **never usable unless explicitly allowed in a namespace**.

---

### 3. Identity Access Policy

Controls which users or service identities can invoke the asset.

Identities include: users, groups, service identities, AI keys.

```yaml
identity_access_policy:
  asset: salesforce-tool
  allowed_roles:
    - ai-developer
    - namespace-admin
```

Service identity example:

```yaml
identity_access_policy:
  asset: support-agent
  allowed_service_identities:
    - support-agent-runtime
```

---

### 4. Usage Requirement Policy

Defines conditions required before an asset can be used.

```yaml
usage_requirements:
  asset: gpt4o
  requirements:
    - content_safety_enabled
    - token_quota_defined
```

Tool example:

```yaml
usage_requirements:
  asset: salesforce-tool
  requirements:
    - oauth_credential_required
    - namespace_admin_approval
```

---

### 5. Asset Approval Policy

Controls whether an asset requires admin approval before usage.

```yaml
approval_policy:
  asset: external-tool
  approval_required: true
  approver_role: platform-admin
```

Useful for external APIs, SaaS connectors, and risky tools.

---

### 6. Credential Scope Policy

Controls which credentials can be used with assets.

```yaml
credential_policy:
  asset: salesforce-tool
  allowed_credentials:
    - salesforce-prod
```

Credentials are scoped to: Organization, Namespace, or Environment.

---

### Asset Access Governance Flow

```
Admin registers asset
     ↓
Sets visibility policy
     ↓
Defines allowed namespaces
     ↓
Defines identity access
     ↓
Sets usage requirements
     ↓
Configures credentials
     ↓
Approves asset (if required)
     ↓
Namespaces import asset
     ↓
Developers use asset
```

---

### Key Principles

1. **Assets are never usable unless explicitly allowed in a namespace**
2. **Assets are discoverable but controlled**
3. **Users inherit permissions through namespaces**
4. **Assets require explicit approval for sensitive use**
5. **Credentials are never exposed directly**
