# Credential Management — Azure AI Gateway

## Overview

The Azure AI Gateway acts as a credential mediator between consumers (developers, agents, applications) and downstream AI assets (models, tools, agents). Developers authenticate to the gateway once using a single credential. The gateway handles all downstream credential injection transparently.

> **Core principle:** Developers never see or manage backend secrets. The gateway resolves, injects, and rotates credentials on their behalf.

---

## Architecture

```
Developer ── (API Key / JWT / Managed Identity) ──▶ Azure AI Gateway
                                                          │
                                                  ┌───────┴───────┐
                                                  │  Credential    │
                                                  │  Store         │
                                                  │  (per namespace)│
                                                  └───────┬───────┘
                                                          │
                              ┌───────────────────────────┼───────────────────────────┐
                              ▼                           ▼                           ▼
                        OpenAI API                 Salesforce API               AWS Bedrock
                      (Bearer + API Key)            (OAuth 2.0)                (AWS SigV4)
```

---

## How It Works

### 1. Developer Authentication

Developers authenticate to the gateway using one of the following methods. This is the only credential they manage.

| Method | Description |
|--------|-------------|
| API Key | Gateway-issued key scoped to namespace |
| JWT | Token validated against issuer (e.g., Entra ID) |
| Managed Identity | Azure-native identity for service-to-service calls |

### 2. Credential Store

Platform admins register backend credentials per asset. Credentials are stored encrypted and scoped to namespace and environment.

The credential store is the gateway's internal vault that maps assets to their authentication requirements.

**Storage options:**

| Option | Description |
|--------|-------------|
| Built-in encrypted store | AES-256 encrypted secrets stored in the gateway database |
| Azure Key Vault reference | Gateway resolves secrets from Key Vault at runtime |
| HashiCorp Vault reference | Gateway resolves secrets from Vault at runtime |

### 3. Credential Mediation at Runtime

When a request arrives at the gateway:

```
1. Gateway validates developer identity (API key, JWT, or managed identity)
2. Resolves target asset (model, tool, or agent)
3. Looks up registered credential for that asset in the namespace
4. Injects the correct authentication into the outbound request
5. Forwards request to the downstream endpoint
6. Strips internal credential metadata from the response
7. Logs credential usage for audit
```

The developer's request contains no backend secrets. The gateway handles all credential injection transparently.

### 4. Credential Types

The gateway supports credentials for all common AI and enterprise authentication patterns.

| Credential Type | Use Case | Example |
|----------------|----------|---------|
| API Key | Model providers, simple REST APIs | OpenAI, Anthropic, custom APIs |
| OAuth 2.0 (Client Credentials) | SaaS tools, enterprise APIs | Salesforce, ServiceNow, Dynamics |
| OAuth 2.0 (Authorization Code) | User-delegated tool access | On-behalf-of flows |
| Managed Identity | Azure-native services | Azure OpenAI, Azure SQL, Cosmos DB |
| AWS SigV4 | AWS services | Bedrock, SageMaker, S3 |
| Bearer Token | Custom APIs, A2A agents | Internal microservices, agent endpoints |
| Connection String | Databases, message queues | PostgreSQL, SQL Server, Redis |
| Key Vault Reference | Delegated secret resolution | Secrets stored externally |
| Certificate | mTLS endpoints | Enterprise APIs requiring client certificates |

---

## Credential Scoping

Credentials are scoped along three dimensions to ensure isolation and security.

### Namespace Scope

Each namespace maintains its own credential set. Credentials registered in one namespace are not visible or accessible from another.

```
Namespace: retail-support
  Credentials:
    openai-prod-key       → OpenAI API Key
    salesforce-oauth       → Salesforce OAuth Client
    azure-openai-identity  → Managed Identity

Namespace: finance-analytics
  Credentials:
    openai-prod-key       → Different OpenAI API Key
    stripe-api-key         → Stripe API Key
```

### Environment Scope

Credentials can differ per environment within a namespace.

```
Namespace: retail-support

  Sandbox:
    salesforce-oauth → sandbox OAuth token (test instance)
    openai-key       → dev API key (low quota)

  Production:
    salesforce-oauth → production OAuth token (live instance)
    openai-key       → production API key (full quota)
```

### Asset Scope

Credentials are bound to specific assets, preventing cross-asset credential leakage.

```yaml
credential_binding:
  asset: salesforce-tool
  namespace: retail-support
  environment: production
  credential: salesforce-prod-oauth
```

---

## Credential Lifecycle

### Registration

Admins register credentials through the portal or API.

```yaml
credential:
  name: openai-prod-key
  type: api_key
  namespace: retail-support
  environment: production
  value: <encrypted>
  bound_assets:
    - gpt-4o
    - gpt-4o-mini
  rotation_policy:
    auto_rotate: false
    expiry_alert_days: 30
```

### Rotation

Credentials can be rotated without disrupting consumers.

```
1. Admin registers new credential version
2. Gateway begins using new credential for new requests
3. Old credential remains valid during grace period
4. Old credential is retired after grace period
5. Audit log records rotation event
```

### Expiry Monitoring

The gateway monitors credential expiry and alerts admins.

```
Credential: salesforce-prod-oauth
Status: Active
Expires: 2026-04-15
Alert: 30 days before expiry
Action: Notify namespace admins
```

---

## Security Controls

### Encryption

- All credentials encrypted at rest (AES-256)
- All credential transmission over TLS
- Credentials never logged or included in traces

### Access Control

- Only namespace admins can register or view credentials
- Developers cannot read credential values
- Service identities can use credentials but not view them
- Credential access logged in audit trail

### Isolation

- Credentials are strictly namespace-scoped
- No cross-namespace credential access
- Environment isolation (sandbox credentials cannot access production)

### Audit

Every credential operation is logged:

```
Event: credential_used
Timestamp: 2026-03-04T04:00:00Z
Namespace: retail-support
Asset: salesforce-tool
Identity: support-agent-runtime
Credential: salesforce-prod-oauth
Target: https://api.salesforce.com
```

---

## Example Flows

### Model Request Flow

```
Developer sends:
  POST /v1/chat/completions
  Authorization: Bearer <gateway-api-key>
  Body: { "model": "gpt-4o", "messages": [...] }

Gateway:
  1. Validates gateway API key → identifies developer in retail-support namespace
  2. Resolves model "gpt-4o" → target: api.openai.com
  3. Looks up credential: openai-prod-key (type: api_key)
  4. Forwards request:
     POST https://api.openai.com/v1/chat/completions
     Authorization: Bearer <openai-api-key>
  5. Returns response to developer (no credential metadata)
```

### Tool Invocation Flow

```
Agent sends:
  POST /v1/tools/salesforce/invoke
  Authorization: Bearer <service-identity-token>
  Body: { "operation": "createCase", "data": {...} }

Gateway:
  1. Validates service identity → retail-support namespace
  2. Resolves tool "salesforce" → target: api.salesforce.com
  3. Looks up credential: salesforce-prod-oauth (type: oauth2)
  4. Exchanges client credentials for access token (if expired)
  5. Forwards request:
     POST https://api.salesforce.com/services/data/v58.0/sobjects/Case
     Authorization: Bearer <salesforce-access-token>
  6. Returns response to agent
```

### Cross-Provider Model Failover

```
Agent sends:
  POST /v1/chat/completions
  Body: { "model": "gpt-4o", "messages": [...] }

Gateway:
  1. Resolves primary: gpt-4o → api.openai.com (credential: openai-key)
  2. Forwards with openai-key → 429 Rate Limited
  3. Resolves fallback: claude-3.5 → api.anthropic.com (credential: anthropic-key)
  4. Forwards with anthropic-key → 200 OK
  5. Returns response (developer unaware of failover)
```

---

## MVP Credential Store Requirements

| Requirement | Priority |
|-------------|----------|
| Encrypted storage for API keys and secrets | P0 |
| Namespace-scoped credential isolation | P0 |
| Environment-aware credential resolution | P0 |
| OAuth 2.0 client credentials flow | P0 |
| Managed identity support (Azure) | P0 |
| Key Vault integration | P0 |
| Credential binding to assets | P0 |
| Audit logging for credential access | P0 |
| Expiry monitoring and alerts | P1 |
| Automatic credential rotation | P1 |
| AWS SigV4 support | P1 |
| Certificate-based authentication | P1 |
| On-behalf-of (delegated) flows | P1 |

---

## Design Principles

1. **Developers never touch backend secrets** — the gateway is the only system that holds and injects credentials
2. **Namespace isolation is absolute** — credentials cannot leak across namespace boundaries
3. **Credentials are bound to assets** — a credential registered for Salesforce cannot be used for a different tool
4. **All credential access is audited** — every use, rotation, and access attempt is logged
5. **Rotation is non-disruptive** — credential updates never cause downtime for consumers
