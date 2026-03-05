# Architecture — Azure AI Gateway

## High-Level Architecture

```mermaid
graph TB
    subgraph "Consumers"
        DEV["👩‍💻 Developers"]
        AGENT["🤖 AI Agents"]
        APP["📱 Applications"]
    end

    subgraph "Azure AI Gateway"
        direction TB

        subgraph "Control Plane"
            PORTAL["Unified Portal<br/>(gateway.azure.com)"]
            CAT["Catalog &<br/>Discovery Engine"]
            GOV_DT["Design-Time<br/>Governance"]
            TENANT["Tenant &<br/>Identity Management"]
        end

        subgraph "Data Plane (Runtime)"
            PROXY["Gateway Proxy<br/>& Router"]
            POLICY["Policy Engine<br/>(Runtime)"]
            FAILOVER["Failover &<br/>Load Balancer"]
            CACHE["Semantic<br/>Cache"]
            OBS["Observability<br/>(OTel)"]
        end
    end

    subgraph "Backend Ecosystem"
        subgraph "Models"
            AOAI["Azure OpenAI"]
            OAI["OpenAI"]
            ANT["Anthropic"]
            GEM["Google Vertex AI"]
            BED["AWS Bedrock"]
            CUSTOM_M["Custom Models"]
        end

        subgraph "Tools & MCP"
            MCP_EXT["External MCP Servers"]
            MCP_HOSTED["Hosted MCP Servers"]
            REST["REST APIs"]
            SAAS["SaaS Connectors"]
        end

        subgraph "Agents"
            A2A_AGENTS["A2A Agents"]
            RAPI_AGENTS["RAPI Agents"]
            FOUNDRY["Foundry Agents"]
        end
    end

    DEV --> PORTAL
    DEV --> PROXY
    AGENT --> PROXY
    APP --> PROXY

    PORTAL --> CAT
    PORTAL --> GOV_DT
    PORTAL --> TENANT

    PROXY --> POLICY
    PROXY --> FAILOVER
    PROXY --> CACHE
    PROXY --> OBS

    FAILOVER --> AOAI
    FAILOVER --> OAI
    FAILOVER --> ANT
    FAILOVER --> GEM
    FAILOVER --> BED
    FAILOVER --> CUSTOM_M

    PROXY --> MCP_EXT
    PROXY --> MCP_HOSTED
    PROXY --> REST
    PROXY --> SAAS

    PROXY --> A2A_AGENTS
    PROXY --> RAPI_AGENTS
    PROXY --> FOUNDRY
```

## Component Descriptions

### Control Plane
| Component | Responsibility |
|-----------|---------------|
| **Unified Portal** | Single UI for all gateway operations — discover, register, configure, monitor |
| **Catalog & Discovery** | Asset registry for models, tools, MCP servers, skills, agents. Search, filter, team visibility |
| **Design-Time Governance** | Schema validation, registration policies, approval workflows |
| **Tenant & Identity** | Multi-tenant isolation, RBAC, API key management, team structures |

### Data Plane (Runtime)
| Component | Responsibility |
|-----------|---------------|
| **Gateway Proxy & Router** | Request mediation, protocol translation, model routing |
| **Policy Engine** | Runtime policy evaluation — rate limits, token quotas, access control, IP filtering |
| **Failover & Load Balancer** | Automatic failover across deployments and providers, traffic splitting |
| **Semantic Cache** | Cache responses for semantically similar prompts to reduce cost |
| **Observability** | OpenTelemetry logs, traces, metrics — per-user token tracking, prompt logging |

## Multi-Tenant Data Model

```mermaid
erDiagram
    Tenant ||--o{ Team : has
    Tenant ||--o{ Model : owns
    Tenant ||--o{ Tool : owns
    Tenant ||--o{ MCPServer : owns
    Tenant ||--o{ Skill : owns
    Tenant ||--o{ Agent : owns
    Tenant ||--o{ Policy : owns
    Tenant ||--o{ Product : owns

    Team ||--o{ Tool : "owns/accesses"
    Team ||--o{ Skill : "owns/accesses"

    Agent }o--o{ Model : consumes
    Agent }o--o{ Tool : consumes
    Agent }o--o{ Skill : consumes
    Agent }o--o{ MCPServer : consumes

    MCPServer ||--o{ MCPToolDefinition : exposes
    MCPServer |o--o| Tool : "converted from"

    Skill }o--o{ Tool : "composed of"

    Product }o--o{ Model : bundles
    Product }o--o{ Tool : bundles
    Product }o--o{ Skill : bundles
    Product }o--o{ Agent : bundles

    Policy }o--o{ Model : "governs"
    Policy }o--o{ Tool : "governs"
    Policy }o--o{ Agent : "governs"
    Policy }o--o{ MCPServer : "governs"
```

## Request Flow

```mermaid
sequenceDiagram
    participant C as Client
    participant GW as Gateway Proxy
    participant PE as Policy Engine
    participant FB as Failover/LB
    participant M as Model Provider
    participant OB as Observability

    C->>GW: Request (model/tool/agent)
    GW->>PE: Evaluate policies
    PE-->>GW: Allow / Deny

    alt Denied
        GW-->>C: 429/403 (policy violation)
    else Allowed
        GW->>FB: Route to backend
        FB->>M: Forward request

        alt Backend fails
            FB->>M: Failover to next target
            M-->>FB: Response
        else Success
            M-->>FB: Response
        end

        FB-->>GW: Response
        GW->>OB: Log metrics, traces
        GW-->>C: Response
    end
```
