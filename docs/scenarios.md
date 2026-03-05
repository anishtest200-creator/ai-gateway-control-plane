# User Scenarios — Azure AI Gateway Control Plane

This document catalogs every user scenario in the AI Gateway Control Plane portal — the control plane for every AI model, tool, and agent in production. It covers what is **built**, what is **partially implemented**, and what is **missing** in the current prototype. The portal features a black + soft indigo (#818CF8) premium theme and uses mock data throughout.

---

## Personas

### Platform Engineer / Admin

- **Primary user.** Configures routing, policies, credentials, namespaces, and access control.
- **Uses:** Overview, Assets, Credentials, Routing, Policies, Metrics, Audit Log, Namespaces, Access Control, Test Console

### AI Developer / Agent Builder

- **Secondary user.** Discovers approved assets, registers new ones, tests in the console.
- **Uses:** Assets, Test Console, Metrics

### Security / Compliance Officer

- **Tertiary user.** Audits activity, reviews access controls, monitors governance.
- **Uses:** Audit Log, Access Control, Credentials, Policies, Namespaces

### Visitor / Prospect

- **Unauthenticated user.** Evaluates the product before signing up.
- **Uses:** Landing Page, Pricing, Docs, Demo

---

## Scenario Matrix

**Status legend:**

| Symbol | Meaning |
|--------|---------|
| ✅ Built (UI) | Interactive UI exists in prototype with mock data |
| 🔧 Partial | Page exists but interaction is limited or static |
| ❌ Missing | Not yet built |

---

### Category: Product Evaluation (Visitor)

| ID | Scenario | Persona | Page(s) | Status | Notes |
|----|----------|---------|---------|--------|-------|
| V1 | View product overview and value proposition | Visitor | Landing Page | ✅ Built (UI) | Hero section, feature highlights, CTA |
| V2 | Explore pricing tiers and compare plans | Visitor | Pricing | ✅ Built (UI) | 3 tiers, FAQ accordion, competitive comparison |
| V3 | Read documentation and quickstart guides | Visitor | Docs | ✅ Built (UI) | Search, quickstart cards, code examples |
| V4 | Try interactive product demo | Visitor | Demo | ✅ Built (UI) | 4 scenarios, auto-advance, live metrics |
| V5 | Sign up / create account | Visitor | Auth | ✅ Built (UI) | Mock auth — sets `isAuthenticated=true`, no real auth |
| V6 | Login to existing account | Visitor | Auth | ✅ Built (UI) | Mock auth |

---

### Category: Gateway Overview (Admin)

| ID | Scenario | Persona | Page(s) | Status | Notes |
|----|----------|---------|---------|--------|-------|
| A1 | View gateway health at a glance | Admin | Overview | ✅ Built (UI) | Gateway health hero, key metrics, attention needed |
| A2 | See key metrics across the gateway | Admin | Overview | ✅ Built (UI) | Six stat cards: requests, tokens, models, policies, cost, alerts |
| A3 | Respond to attention alerts | Admin | Overview | ✅ Built (UI) | Prioritized action items with navigation links |
| A4 | View recent activity | Admin | Overview | ✅ Built (UI) | Activity feed with event descriptions |
| A5 | Quick-start common tasks | Admin | Overview | ✅ Built (UI) | Quick Start buttons: Test Console, Assets, Routing, Credentials, Metrics, Audit Log |

---

### Category: Traffic Monitoring (Admin)

| ID | Scenario | Persona | Page(s) | Status | Notes |
|----|----------|---------|---------|--------|-------|
| T1 | View real-time request volume | Admin | Traffic | 🔧 Partial | Static mock data, no real-time updates |
| T2 | Monitor latency across providers | Admin | Traffic | 🔧 Partial | Displays mock latency stats |
| T3 | Track policy enforcement actions | Admin | Traffic | 🔧 Partial | Static enforcement chart |
| T4 | View top namespaces by traffic | Admin | Traffic | 🔧 Partial | Static table, no drill-through |
| T5 | Filter traffic by time range | Admin | Traffic | ❌ Missing | No time range picker |
| T6 | Export traffic reports | Admin | Traffic | ❌ Missing | No export functionality |

---

### Category: Routing Configuration (Admin)

| ID | Scenario | Persona | Page(s) | Status | Notes |
|----|----------|---------|---------|--------|-------|
| R1 | View existing routing rules | Admin | Routing | ✅ Built (UI) | Table with 6 rules |
| R2 | Filter rules by provider | Admin | Routing | ✅ Built (UI) | Provider dropdown filter works |
| R3 | Add new routing rule | Admin | Routing | ❌ Missing | Button exists but no handler |
| R4 | Import routing rules | Admin | Routing | ❌ Missing | Button exists but no handler |
| R5 | View failover chains | Admin | Routing | ✅ Built (UI) | 3 failover chains with health indicators |
| R6 | View load balancing strategy | Admin | Routing | 🔧 Partial | Static display of weighted round robin |
| R7 | Configure health checks | Admin | Routing | ❌ Missing | Display only, not editable |
| R8 | Edit/delete routing rules | Admin | Routing | ❌ Missing | No edit or delete actions |

---

### Category: Policy Management (Admin)

| ID | Scenario | Persona | Page(s) | Status | Notes |
|----|----------|---------|---------|--------|-------|
| P1 | View all runtime policies | Admin | Policies | ✅ Built (UI) | Runtime tab with 18 policies |
| P2 | Enable/disable individual policies | Admin | Policies | ✅ Built (UI) | Toggle switches work with state |
| P3 | View policy version history | Admin | Policies | ✅ Built (UI) | Expandable version history per policy |
| P4 | Simulate policy impact | Admin | Policies | ✅ Built (UI) | Simulator modal with policy selector and enable toggle |
| P5 | View access rules | Admin | Policies | ✅ Built (UI) | Access Rules tab with 6 rules and toggles |
| P6 | Configure RAI guardrails | Admin | Policies | ✅ Built (UI) | Guardrails tab with toggles |
| P7 | View pending policy approvals | Admin | Policies | 🔧 Partial | Displays 4 pending items, no approve/reject action |
| P8 | Create new policy | Admin | Policies | ❌ Missing | No creation workflow |
| P9 | Edit existing policy | Admin | Policies | ❌ Missing | No edit capability |
| P10 | Delete policy | Admin | Policies | ❌ Missing | No delete capability |
| P11 | View policy audit trail | Admin | Policies | 🔧 Partial | Static audit entries |
| P12 | Navigate from policy to audit log | Admin | Policies | ✅ Built (UI) | "View in Logs" links navigate to `/logs` |

---

### Category: Credential / Secret Management (Admin)

| ID | Scenario | Persona | Page(s) | Status | Notes |
|----|----------|---------|---------|--------|-------|
| S1 | View all credentials | Admin | Credentials | ✅ Built (UI) | Table with 10 credentials |
| S2 | View credential detail | Admin | Credentials | ✅ Built (UI) | Click row opens detail panel |
| S3 | View credential blast radius | Admin | Credentials | ✅ Built (UI) | Detail shows dependent assets, routes, namespaces |
| S4 | View expiring/expired credentials | Admin | Credentials | ✅ Built (UI) | Health alerts with status indicators |
| S5 | View credential access log | Admin | Credentials | ✅ Built (UI) | Detail shows 8 recent access log entries |
| S6 | Navigate to dependent assets | Admin | Credentials | ✅ Built (UI) | Detail links navigate to `/assets`, `/routing`, `/logs` |
| S7 | Add new credential | Admin | Credentials | ❌ Missing | No creation workflow |
| S8 | Rotate credential | Admin | Credentials | ❌ Missing | No rotation action |
| S9 | Revoke credential (emergency) | Admin | Credentials | ❌ Missing | No revocation action |
| S10 | Edit credential scope | Admin | Credentials | ❌ Missing | No edit capability |

---

### Category: Asset Management (Admin / Developer)

| ID | Scenario | Persona | Page(s) | Status | Notes |
|----|----------|---------|---------|--------|-------|
| C1 | View all models | Admin, Developer | Assets | ✅ Built (UI) | Models tab, 32 models |
| C2 | View all tools | Admin, Developer | Assets | ✅ Built (UI) | Tools tab, 24 tools |
| C3 | View all agents | Admin, Developer | Assets | ✅ Built (UI) | Agents tab, 8 agents |
| C4 | View governance overview | Admin, Developer | Assets | ✅ Built (UI) | 4 stat cards: total, governed, partial, ungoverned |
| C5 | View source distribution | Admin, Developer | Assets | ✅ Built (UI) | 7 source pills |
| C6 | Register new model | Admin | RegisterModel | ✅ Built (UI) | 6-step wizard, 6 source types |
| C7 | Register new tool | Admin | RegisterTool | ✅ Built (UI) | 6-step wizard, 3 tool types, 4 sources |
| C8 | Register new agent | Admin | RegisterAgent | ✅ Built (UI) | 6-step wizard, 6 agent sources |
| C9 | Search/filter assets | Admin, Developer | Assets | ❌ Missing | No search bar or filter controls on catalog |
| C10 | Edit existing asset | Admin | Assets | ❌ Missing | No edit workflow |
| C11 | Delete/decommission asset | Admin | Assets | ❌ Missing | No delete or decommission action |
| C12 | View asset detail | Admin, Developer | Assets | ❌ Missing | No detail panel/page for individual assets |

---

### Category: Analytics (Admin)

| ID | Scenario | Persona | Page(s) | Status | Notes |
|----|----------|---------|---------|--------|-------|
| AN1 | View token usage metrics | Admin | Analytics | 🔧 Partial | Mock cost/token data |
| AN2 | View cost attribution by namespace | Admin | Analytics | 🔧 Partial | Mock namespace breakdown |
| AN3 | Set namespace budgets | Admin | Analytics | 🔧 Partial | Budget UI exists but may not be interactive |
| AN4 | Detect anomalies | Admin | Analytics | 🔧 Partial | Anomaly detection display |
| AN5 | Export analytics reports | Admin | Analytics | ❌ Missing | No export functionality |
| AN6 | Filter by time range | Admin | Analytics | ❌ Missing | No date range picker |
| AN7 | View chargeback reports | Admin | Analytics | 🔧 Partial | Chargeback section present |

---

### Category: Audit Log (Admin / Security)

| ID | Scenario | Persona | Page(s) | Status | Notes |
|----|----------|---------|---------|--------|-------|
| L1 | View audit trail | Admin, Security | Audit Log | ✅ Built (UI) | Table with entries |
| L2 | Search log entries | Admin, Security | Audit Log | ✅ Built (UI) | Search input |
| L3 | Filter by asset type | Admin, Security | Audit Log | ✅ Built (UI) | Asset type filter |
| L4 | Filter by severity/status | Admin, Security | Audit Log | ✅ Built (UI) | Status filter |
| L5 | Filter by date range | Admin, Security | Audit Log | ✅ Built (UI) | Date/time filter |
| L6 | View log entry detail | Admin, Security | Audit Log | 🔧 Partial | May have detail panel |
| L7 | Export audit log | Admin, Security | Audit Log | ❌ Missing | No export functionality |

---

### Category: Namespace Management (Admin)

| ID | Scenario | Persona | Page(s) | Status | Notes |
|----|----------|---------|---------|--------|-------|
| N1 | View all namespaces | Admin | Namespaces | ✅ Built (UI) | Grid with 6 namespaces |
| N2 | View namespace detail | Admin | Namespaces | ✅ Built (UI) | Click to expand detail |
| N3 | View namespace members | Admin | Namespaces | ✅ Built (UI) | Members tab in detail |
| N4 | View namespace credentials | Admin | Namespaces | ✅ Built (UI) | Credentials tab |
| N5 | View namespace assets | Admin | Namespaces | ✅ Built (UI) | Assets tab |
| N6 | View namespace policies | Admin | Namespaces | ✅ Built (UI) | Policies tab |
| N7 | Create new namespace | Admin | Namespaces | ❌ Missing | No creation workflow |
| N8 | Edit namespace settings | Admin | Namespaces | ❌ Missing | No edit capability |
| N9 | Delete namespace | Admin | Namespaces | ❌ Missing | No delete action |

---

### Category: Access Control (Admin / Security)

| ID | Scenario | Persona | Page(s) | Status | Notes |
|----|----------|---------|---------|--------|-------|
| AC1 | View pending access requests | Admin, Security | Access Control | ✅ Built (UI) | Pending requests tab |
| AC2 | Approve/reject access requests | Admin, Security | Access Control | ✅ Built (UI) | Approve/reject buttons work |
| AC3 | View access control matrix | Admin, Security | Access Control | ✅ Built (UI) | Matrix tab |
| AC4 | Manage identity permissions | Admin, Security | Access Control | ✅ Built (UI) | Role/permission toggles |
| AC5 | View authentication methods | Admin, Security | Access Control | ✅ Built (UI) | Auth method pills |
| AC6 | Create new access policy | Admin, Security | Access Control | ❌ Missing | No creation workflow |
| AC7 | Invite user | Admin | Access Control | ❌ Missing | No invite action |
| AC8 | Remove user access | Admin | Access Control | ❌ Missing | No removal action |

---

### Category: Compliance (Security)

| ID | Scenario | Persona | Page(s) | Status | Notes |
|----|----------|---------|---------|--------|-------|
| CO1 | View compliance frameworks | Security | Compliance | ✅ Built (UI) | Framework tabs |
| CO2 | View controls per framework | Security | Compliance | ✅ Built (UI) | Control rows |
| CO3 | View control evidence | Security | Compliance | ✅ Built (UI) | Evidence mapping |
| CO4 | Generate compliance report | Security | Compliance | ❌ Missing | Evidence generation mentioned but no export |
| CO5 | Navigate from control to relevant page | Security | Compliance | ✅ Built (UI) | Links to policies/logs/assets |

---

### Category: Playground (Developer / Admin)

| ID | Scenario | Persona | Page(s) | Status | Notes |
|----|----------|---------|---------|--------|-------|
| PG1 | Select namespace | Developer, Admin | Playground | ✅ Built (UI) | Namespace dropdown |
| PG2 | Select asset type | Developer, Admin | Playground | ✅ Built (UI) | Model/tool/agent radio |
| PG3 | Select specific endpoint | Developer, Admin | Playground | ✅ Built (UI) | Endpoint dropdown |
| PG4 | Edit request payload | Developer, Admin | Playground | ✅ Built (UI) | JSON textarea |
| PG5 | Send test request | Developer, Admin | Playground | ✅ Built (UI) | Send button triggers mock execution |
| PG6 | View execution trace | Developer, Admin | Playground | ✅ Built (UI) | Collapsible trace steps |
| PG7 | View response | Developer, Admin | Playground | ✅ Built (UI) | Response panel |
| PG8 | Save/load test scenarios | Developer, Admin | Playground | ❌ Missing | No save/load functionality |
| PG9 | Compare responses across models | Developer, Admin | Playground | ❌ Missing | No comparison view |

---

### Category: Asset Registration Wizards (Admin)

| ID | Scenario | Persona | Page(s) | Status | Notes |
|----|----------|---------|---------|--------|-------|
| RW1 | Register model from Azure AI Foundry (auto-discover) | Admin | RegisterModel | ✅ Built (UI) | Foundry source with project/model selection |
| RW2 | Register model from AWS Bedrock | Admin | RegisterModel | ✅ Built (UI) | Bedrock source |
| RW3 | Register model from Google Vertex | Admin | RegisterModel | ✅ Built (UI) | Vertex source |
| RW4 | Register model from OpenAI | Admin | RegisterModel | ✅ Built (UI) | OpenAI source |
| RW5 | Register model from Anthropic | Admin | RegisterModel | ✅ Built (UI) | Anthropic source |
| RW6 | Register self-hosted model | Admin | RegisterModel | ✅ Built (UI) | Custom source |
| RW7 | Configure model routing priority | Admin | RegisterModel | ✅ Built (UI) | Priority selector |
| RW8 | Configure model failover chain | Admin | RegisterModel | ✅ Built (UI) | Failover dropdowns |
| RW9 | Set model policies during registration | Admin | RegisterModel | ✅ Built (UI) | Policy toggles with thresholds |
| RW10 | Register MCP server tool | Admin | RegisterTool | ✅ Built (UI) | MCP External source |
| RW11 | Import tool from Foundry | Admin | RegisterTool | ✅ Built (UI) | MCP Foundry source |
| RW12 | Register REST API tool | Admin | RegisterTool | ✅ Built (UI) | REST Manual/OpenAPI source |
| RW13 | Convert REST API to MCP | Admin | RegisterTool | ✅ Built (UI) | Convert source |
| RW14 | Register SaaS connector | Admin | RegisterTool | ✅ Built (UI) | SaaS source |
| RW15 | Register Foundry Agent Service agent | Admin | RegisterAgent | ✅ Built (UI) | Foundry source |
| RW16 | Register Bedrock agent | Admin | RegisterAgent | ✅ Built (UI) | Bedrock source |
| RW17 | Register Vertex AI agent | Admin | RegisterAgent | ✅ Built (UI) | Vertex source |
| RW18 | Register A2A protocol agent | Admin | RegisterAgent | ✅ Built (UI) | A2A source with metadata fetch |
| RW19 | Register custom agent | Admin | RegisterAgent | ✅ Built (UI) | RAPI and Custom sources |
| RW20 | Configure agent model/tool bindings | Admin | RegisterAgent | ✅ Built (UI) | Model/tool multi-select or "Allow All" |

---

### Category: Navigation & Authentication

| ID | Scenario | Persona | Page(s) | Status | Notes |
|----|----------|---------|---------|--------|-------|
| NAV1 | Navigate between console pages via sidebar | All | Layout | ✅ Built (UI) | 12 nav items |
| NAV2 | Return to landing page from console | All | Layout | ✅ Built (UI) | Brand click triggers sign out → landing |
| NAV3 | Navigate to Pricing/Docs/Demo from landing | Visitor | Landing Page | ✅ Built (UI) | Nav links |
| NAV4 | Cross-page navigation from alerts/links | Admin | Multiple | ✅ Built (UI) | Overview alerts → relevant pages, Secrets → Assets/Routing/Logs |
| NAV5 | View page title and subtitle | All | Layout | ✅ Built (UI) | Dynamic page titles |
| NAV6 | Open profile menu | All | Layout | ✅ Built (UI) | Profile dropdown |
| NAV7 | Sign out | All | Layout | ✅ Built (UI) | Sign out button in profile dropdown |
| NAV8 | Real authentication (Entra ID) | All | Auth | ❌ Missing | Mock auth only |
| NAV9 | Notification center | All | Layout | ❌ Missing | Badge shows "3" but no notification panel |
| NAV10 | Settings page | All | Settings | ❌ Missing | Button exists, no handler |
| NAV11 | Docs/API Reference/Support/Feedback links | All | Layout | ❌ Missing | Sidebar footer buttons have no handlers |

---

## Summary Statistics

| Status | Count |
|--------|-------|
| ✅ Built (UI) | ~75 |
| 🔧 Partial | ~15 |
| ❌ Missing | ~30 |
| **Total scenarios** | **~120** |

---

## Top Missing Capabilities (Priority Order)

1. **CRUD operations** — Can view most entities but cannot create, edit, or delete (except via registration wizards for new assets)
2. **Real authentication** — No Entra ID / MSAL integration
3. **Search and filtering** — Missing across Catalog, Traffic, and most list views
4. **Export / reporting** — No CSV/PDF export for analytics, audit log, or compliance
5. **Real-time data** — All pages show static mock data
6. **Time range filtering** — No date range pickers on Traffic or Analytics
7. **Notifications** — Badge shows count but no notification panel
8. **Settings** — No settings/preferences page
9. **Asset detail views** — Can see assets in tables but no dedicated detail page per asset
10. **Responsive design** — Desktop-only layout
