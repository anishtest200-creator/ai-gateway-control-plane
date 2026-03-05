# End-to-End User Flows — Azure AI Gateway Control Plane

> Step-by-step walkthrough of every user flow in the prototype portal.
> ✅ = working in prototype | 🔧 = partial/limited | ❌ = not implemented
> All data is mock. No real API calls or persistent state.

---

## Flow 1: First-Time Visitor → Signed-Up User

**Persona:** Visitor / Prospect

| Step | Action | Page | Result | Status |
|------|--------|------|--------|--------|
| 1 | Open `/` | Landing | Hero: "One Control Plane for Every AI Model, Tool, and Agent" | ✅ |
| 2 | Scroll down | Landing | Architecture diagram (3-column: Models / Tools / Agents), feature cards, stats | ✅ |
| 3 | Click "Pricing" in top nav | Landing → Pricing | Navigate to `/pricing` | ✅ |
| 4 | Browse 3 tiers (Developer / Pro / Enterprise) | Pricing | Cards with feature lists, price comparison | ✅ |
| 5 | Click FAQ item | Pricing | Accordion expands/collapses | ✅ |
| 6 | Click "Get Started" on Pro tier | Pricing | `onSignup()` → `isAuthenticated = true` → redirected to console | ✅ |
| 7 | See console | Overview | Layout loads with sidebar nav, governance score, alerts, heatmap | ✅ |

**What's Missing:**
- ❌ Real authentication (Entra ID / MSAL)
- ❌ Account creation form (email, password, org)
- ❌ Onboarding wizard for first-time users
- ❌ Plan selection persistence

---

## Flow 2: Admin Reviews Gateway Health

**Persona:** Platform Engineer / Admin

| Step | Action | Page | Result | Status |
|------|--------|------|--------|--------|
| 1 | Land on Overview | Overview | See governance score ring (87/100), 3 alert cards, heatmap | ✅ |
| 2 | Read alert: "Expiring credential" | Overview | Card shows severity and description | ✅ |
| 3 | Click alert card | Overview → Secrets | Navigate to `/credentials` | ✅ |
| 4 | Scan credentials table | Secrets | 10 credentials with status (active/expiring/expired) | ✅ |
| 5 | Click row for expiring credential | Secrets | Detail panel opens: blast radius, dependents, access log | ✅ |
| 6 | See 3 dependent models, 2 routes, 1 namespace | Secrets (detail) | Dependency graph displayed | ✅ |
| 7 | Click "View in Assets" | Secrets → Catalog | Navigate to `/assets` | ✅ |
| 8 | Return to Overview via sidebar | Catalog → Overview | Sidebar nav click | ✅ |
| 9 | Click timeline event | Overview | Navigate to relevant page (/logs, /policies, etc.) | ✅ |
| 10 | Click "View all" on ungoverned assets | Overview → Policies | Navigate to `/policies` | ✅ |

**What's Missing:**
- ❌ Dismiss/acknowledge alerts
- ❌ Real-time score updates
- ❌ Drill-through from heatmap cells to namespace detail

---

## Flow 3: Admin Configures Policies

**Persona:** Platform Engineer / Admin

| Step | Action | Page | Result | Status |
|------|--------|------|--------|--------|
| 1 | Click "Policies" in sidebar | → Policies | Policies page loads with Runtime tab active | ✅ |
| 2 | See 18 policies across categories | Policies | Table: Authentication, Credentials, Rate Limits, Content Safety, Routing, Agent Execution | ✅ |
| 3 | Toggle "JWT Validation" on/off | Policies | `onToggle(id)` updates state, toggle switches visually | ✅ |
| 4 | Click "View History" on a policy | Policies | Version history section expands below the policy row | ✅ |
| 5 | Click "Access Rules" tab | Policies | Tab switches to 6 access rules with toggles | ✅ |
| 6 | Toggle "Namespace Access Control" on | Policies | `toggleRule(id)` updates state | ✅ |
| 7 | Click "Guardrails" tab | Policies | Tab switches to RAI guardrails with trigger counts and toggles | ✅ |
| 8 | Toggle "PII Detection" guardrail | Policies | `toggleGuardrail(id)` updates state | ✅ |
| 9 | Click "Show Simulator" | Policies | Modal opens with policy selector dropdown and enable toggle | ✅ |
| 10 | Select policy in simulator | Policies (modal) | `setSelectedSimPolicy(id)` | ✅ |
| 11 | Toggle simulator enabled state | Policies (modal) | `setSimEnabled(!state)` | ✅ |
| 12 | Click "Close Simulator" | Policies (modal) | Modal closes | ✅ |
| 13 | Click "View in Logs" | Policies → Audit Log | Navigate to `/logs?filter=category` | ✅ |

**What's Missing:**
- ❌ Create new policy
- ❌ Edit policy (modify thresholds, conditions)
- ❌ Delete policy
- ❌ Approve/reject pending approvals (displayed but no action buttons)
- ❌ Simulator doesn't show simulated impact results
- ❌ Policy staged rollout (described in UI but not interactive)

---

## Flow 4: Admin Manages Secrets

**Persona:** Platform Engineer / Admin

| Step | Action | Page | Result | Status |
|------|--------|------|--------|--------|
| 1 | Click "Secrets" in sidebar | → Secrets | Credentials table (10 rows) with type breakdown chart | ✅ |
| 2 | See 3 health alerts (expiring, expired) | Secrets | Alert cards with severity indicators | ✅ |
| 3 | Click alert card | Secrets | Detail panel opens for that credential | ✅ |
| 4 | Click credential row in table | Secrets | Detail panel opens: type, status, expiry, scope | ✅ |
| 5 | View blast radius | Secrets (detail) | Dependent assets, routes, namespaces listed | ✅ |
| 6 | See 24h request count | Secrets (detail) | Static metric display | ✅ |
| 7 | View 8 recent access log entries | Secrets (detail) | Timestamped entries with user, action, result | ✅ |
| 8 | Click "View in Routing" | Secrets → Routing | Navigate to `/routing` | ✅ |
| 9 | Click "View in Audit Log" | Secrets → Audit Log | Navigate to `/logs` | ✅ |
| 10 | Close detail panel | Secrets | `setSelectedCredential(null)`, panel closes | ✅ |

**What's Missing:**
- ❌ Add new credential
- ❌ Rotate credential
- ❌ Emergency revoke
- ❌ Edit scope (namespace, environment)
- ❌ Search/filter credentials table

---

## Flow 5: Admin Registers a New Model (Full Wizard)

**Persona:** Platform Engineer / Admin

| Step | Action | Page | Result | Status |
|------|--------|------|--------|--------|
| 1 | Click "Catalog" in sidebar | → Catalog | Catalog page with Models tab active, 32 models | ✅ |
| 2 | Click "+ Register Model" button | Catalog | RegisterModel modal opens | ✅ |
| **Step 1: Source** | | | | |
| 3 | See 6 source options (radio buttons) | Modal | Azure AI Foundry, AWS Bedrock, Google Vertex, OpenAI, Anthropic, Self-Hosted | ✅ |
| 4 | Select "Azure AI Foundry" | Modal | Form fields update for Foundry source | ✅ |
| 5 | Select project from dropdown | Modal | Project list populates (mock data) | ✅ |
| 6 | Select models from multi-select | Modal | Choose one or more models | ✅ |
| 7 | Click "Next" | Modal | Validation → advance to Step 2 | ✅ |
| **Step 2: Endpoint** | | | | |
| 8 | See auto-populated endpoint details | Modal | URL and deployment name from Foundry selection | ✅ |
| 9 | Select credential for authentication | Modal | Credential dropdown (mock list) | ✅ |
| 10 | Click "Next" | Modal | Advance to Step 3 | ✅ |
| **Step 3: Configuration** | | | | |
| 11 | Set routing priority | Modal | Priority selector (1-10) | ✅ |
| 12 | Configure failover chain | Modal | Dropdown for backup model sequence | ✅ |
| 13 | Set load balance weight | Modal | Weight slider/input | ✅ |
| 14 | Toggle health check on/off | Modal | Health check config appears/hides | ✅ |
| 15 | Click "Next" | Modal | Advance to Step 4 | ✅ |
| **Step 4: Governance** | | | | |
| 16 | Toggle "Rate Limiting" on | Modal | Threshold input fields appear | ✅ |
| 17 | Set requests/minute threshold | Modal | Numeric input | ✅ |
| 18 | Toggle "Token Quota" on | Modal | Token limit fields appear | ✅ |
| 19 | Toggle "Content Safety" on | Modal | Safety level selector appears | ✅ |
| 20 | Click "Next" | Modal | Advance to Step 5 | ✅ |
| **Step 5: Namespace** | | | | |
| 21 | Select target namespace | Modal | Namespace dropdown | ✅ |
| 22 | Click "Next" | Modal | Advance to Step 6 | ✅ |
| **Step 6: Review** | | | | |
| 23 | Review all selections | Modal | Summary of source, endpoint, config, policies, namespace | ✅ |
| 24 | Click "Complete" | Modal | `onComplete()` fires, modal closes | ✅ |
| 25 | Back on Catalog page | Catalog | Models tab (mock data unchanged — no persistence) | 🔧 |

**What's Missing:**
- ❌ New model doesn't appear in table (no state persistence)
- ❌ Form validation errors (required fields)
- ❌ Backend API call to persist registration
- ❌ Duplicate detection

---

## Flow 6: Admin Registers a New Tool (Full Wizard)

**Persona:** Platform Engineer / Admin

| Step | Action | Page | Result | Status |
|------|--------|------|--------|--------|
| 1 | Click "Tools" tab in Catalog | Catalog | 24 tools displayed | ✅ |
| 2 | Click "+ Register Tool" | Catalog | RegisterTool modal opens | ✅ |
| 3 | Select tool type: MCP / REST / SaaS | Modal (Step 1) | Form fields update per type | ✅ |
| 4 | Select source: Foundry / OpenAPI / External / Convert | Modal (Step 1) | Source-specific fields appear | ✅ |
| 5 | Fill source-specific fields (URL, spec, name) | Modal (Step 1) | Form state updates | ✅ |
| 6 | Click "Next" → Endpoint configuration | Modal (Step 2) | Endpoint, transport, tools multi-select | ✅ |
| 7 | Select auth method (6 options) | Modal (Step 3) | Auth config fields appear | ✅ |
| 8 | Set namespace and data classification | Modal (Step 4) | Dropdowns | ✅ |
| 9 | Review and click "Complete" | Modal (Step 5-6) | Modal closes | ✅ |

**What's Missing:**
- ❌ No persistence (tool doesn't appear in table)
- ❌ OpenAPI spec parsing (paste/URL → auto-discover endpoints)
- ❌ REST-to-MCP conversion preview

---

## Flow 7: Admin Registers a New Agent (Full Wizard)

**Persona:** Platform Engineer / Admin

| Step | Action | Page | Result | Status |
|------|--------|------|--------|--------|
| 1 | Click "Agents" tab in Catalog | Catalog | 8 agents displayed | ✅ |
| 2 | Click "+ Register Agent" | Catalog | RegisterAgent modal opens | ✅ |
| 3 | Select source (6 options) | Modal (Step 1) | Foundry, Bedrock, Vertex, A2A, RAPI, Custom | ✅ |
| 4 | Fill source fields | Modal (Step 1) | Source-specific form | ✅ |
| 5 | (A2A only) Click "Fetch A2A Metadata" | Modal (Step 1) | `fetchA2AMetadata(url)` → populates name, desc, capabilities | ✅ |
| 6 | Configure model bindings | Modal (Step 2) | Multi-select models or "Allow All" toggle | ✅ |
| 7 | Configure tool bindings | Modal (Step 2) | Multi-select tools or "Allow All" toggle | ✅ |
| 8 | Set governance policies | Modal (Step 3) | Policy toggles with thresholds | ✅ |
| 9 | Select namespace | Modal (Step 4) | Namespace dropdown | ✅ |
| 10 | Review and complete | Modal (Step 5-6) | Modal closes | ✅ |

**What's Missing:**
- ❌ No persistence
- ❌ A2A metadata fetch is mock (no real HTTP call)

---

## Flow 8: Admin Manages Namespaces

**Persona:** Platform Engineer / Admin

| Step | Action | Page | Result | Status |
|------|--------|------|--------|--------|
| 1 | Click "Namespaces" in sidebar | → Namespaces | Grid with 6 namespaces | ✅ |
| 2 | See namespace cards with governance scores | Namespaces | Environment, score, asset count, members | ✅ |
| 3 | Click namespace card | Namespaces | Detail view expands | ✅ |
| 4 | View "Members" tab | Namespaces (detail) | Member list with roles | ✅ |
| 5 | View "Credentials" tab | Namespaces (detail) | Credentials scoped to namespace | ✅ |
| 6 | View "Assets" tab | Namespaces (detail) | Models, tools, agents in namespace | ✅ |
| 7 | View "Policies" tab | Namespaces (detail) | Applied policies | ✅ |

**What's Missing:**
- ❌ Create new namespace
- ❌ Edit namespace settings (quotas, environment)
- ❌ Delete namespace
- ❌ Add/remove members
- ❌ Assign policies to namespace

---

## Flow 9: Security Officer Reviews Compliance

**Persona:** Security / Compliance Officer

| Step | Action | Page | Result | Status |
|------|--------|------|--------|--------|
| 1 | Click "Compliance" in sidebar | → Compliance | Compliance page with framework tabs | ✅ |
| 2 | Switch between frameworks (SOC 2, HIPAA, GDPR, ISO 27001, NIST) | Compliance | Tab content updates with controls | ✅ |
| 3 | View controls per framework | Compliance | Control rows with status: met / partial / not-met | ✅ |
| 4 | View evidence for a control | Compliance | Evidence mapping displayed | ✅ |
| 5 | Click evidence link to Policies | Compliance → Policies | Navigate to related policy | ✅ |

**What's Missing:**
- ❌ Export compliance report (PDF/CSV)
- ❌ Generate evidence artifacts
- ❌ Mark controls as reviewed/attested
- ❌ Upload external evidence documents

---

## Flow 10: Admin Reviews Access Control

**Persona:** Platform Engineer / Admin

| Step | Action | Page | Result | Status |
|------|--------|------|--------|--------|
| 1 | Click "Access Control" in sidebar | → Access Control | Page with tabs for different access views | ✅ |
| 2 | View pending access requests | Access Control | Request list with user, resource, justification | ✅ |
| 3 | Click "Approve" on a request | Access Control | `updateRequestStatus(id, 'approved')` | ✅ |
| 4 | Click "Reject" on a request | Access Control | `updateRequestStatus(id, 'rejected')` | ✅ |
| 5 | View access control matrix | Access Control | Matrix tab shows user-resource permissions | ✅ |
| 6 | Toggle permission for a user | Access Control | `togglePermission(user, role)` | ✅ |
| 7 | View authentication method badges | Access Control | API Key, Entra ID, OAuth 2.0, Managed Identity pills | ✅ |

**What's Missing:**
- ❌ Create new access policy
- ❌ Invite new user
- ❌ Remove user access
- ❌ Configure authentication methods
- ❌ Service identity management (CRUD)

---

## Flow 11: Developer Uses Playground

**Persona:** AI Developer / Agent Builder

| Step | Action | Page | Result | Status |
|------|--------|------|--------|--------|
| 1 | Click "Playground" in sidebar | → Playground | Playground with namespace selector, asset type, endpoint | ✅ |
| 2 | Select namespace from dropdown | Playground | `setSelectedNamespace(ns)` — 4 namespaces available | ✅ |
| 3 | Select asset type (Model / Tool / Agent) | Playground | Radio buttons → `setAssetType(type)` | ✅ |
| 4 | Select specific endpoint from dropdown | Playground | `setSelectedEndpoint(endpoint)` — 2-3 options per type | ✅ |
| 5 | Edit JSON request payload in textarea | Playground | `setRequestPayload(text)` | ✅ |
| 6 | Click "Send Request" | Playground | `executeRequest()` → mock trace generated | ✅ |
| 7 | View execution trace | Playground | Trace steps: auth → routing → policy → execution → response | ✅ |
| 8 | Click trace step to expand | Playground | Collapsible section shows timing, details, status | ✅ |
| 9 | View response panel | Playground | Mock response JSON displayed | ✅ |

**What's Missing:**
- ❌ Save/load test scenarios
- ❌ Compare responses across models (A/B)
- ❌ Request history
- ❌ Real API execution (all results are mock)
- ❌ cURL export

---

## Flow 12: Admin Analyzes Usage

**Persona:** Platform Engineer / Admin

| Step | Action | Page | Result | Status |
|------|--------|------|--------|--------|
| 1 | Click "Analytics" in sidebar | → Analytics | Analytics dashboard with token/cost metrics | 🔧 |
| 2 | View token usage by model | Analytics | Chart/table with mock token data | 🔧 |
| 3 | View cost attribution by namespace | Analytics | Namespace cost breakdown | 🔧 |
| 4 | View budget status | Analytics | Budget vs actual per namespace | 🔧 |
| 5 | View anomaly detection | Analytics | Anomaly alerts display | 🔧 |
| 6 | View chargeback report | Analytics | Cost allocation table | 🔧 |

**What's Missing:**
- ❌ Time range picker
- ❌ Export reports (CSV/PDF)
- ❌ Interactive chart drill-down
- ❌ Budget threshold editing
- ❌ Real usage data

---

## Flow 13: Admin Reviews Audit Log

**Persona:** Platform Engineer / Admin

| Step | Action | Page | Result | Status |
|------|--------|------|--------|--------|
| 1 | Click "Audit Log" in sidebar | → Audit Log | Log table with entries | ✅ |
| 2 | Type in search box | Audit Log | `onChange` filters entries by keyword | ✅ |
| 3 | Select asset type filter | Audit Log | Filter by model/tool/agent/mcp-server | ✅ |
| 4 | Select severity/status filter | Audit Log | Filter by status code range | ✅ |
| 5 | Set date range filter | Audit Log | Filter by timestamp | ✅ |
| 6 | View log entry details | Audit Log | Detail panel or inline expansion | 🔧 |

**What's Missing:**
- ❌ Export audit log (CSV/PDF)
- ❌ Bookmark/flag entries
- ❌ Cross-link to asset detail from log entry
- ❌ Real log data

---

## Flow 14: Visitor Explores Documentation

**Persona:** Visitor / Prospect

| Step | Action | Page | Result | Status |
|------|--------|------|--------|--------|
| 1 | Click "Docs" in landing page nav | Landing → Docs | Navigate to `/docs` | ✅ |
| 2 | Type in search bar | Docs | Search input updates (filtering may be limited) | 🔧 |
| 3 | Browse quickstart cards | Docs | 4 quickstart cards with descriptions | ✅ |
| 4 | Browse 6-category doc index | Docs | Getting Started, Models, Tools, Agents, Governance, API Reference | ✅ |
| 5 | View tabbed code examples | Docs | cURL / Python / TypeScript tabs | ✅ |
| 6 | View SDK cards | Docs | SDK options with descriptions | ✅ |
| 7 | View architecture diagram | Docs | 3-column diagram matching landing page | ✅ |
| 8 | Click "Get Started" | Docs | `onSignup()` → authenticated → console | ✅ |

**What's Missing:**
- ❌ Actual documentation content (links are static)
- ❌ Search returns results
- ❌ Linked doc detail pages

---

## Flow 15: Visitor Tries Interactive Demo

**Persona:** Visitor / Prospect

| Step | Action | Page | Result | Status |
|------|--------|------|--------|--------|
| 1 | Click "Demo" in landing page nav | Landing → Demo | Navigate to `/demo` | ✅ |
| 2 | Watch Scenario 1 auto-advance | Demo | Animated metrics, step-by-step walkthrough | ✅ |
| 3 | Scenario 2 auto-advances | Demo | Different scenario with live metrics | ✅ |
| 4 | Scenario 3 auto-advances | Demo | Third scenario | ✅ |
| 5 | Scenario 4 auto-advances | Demo | Fourth scenario | ✅ |
| 6 | Read testimonials | Demo | Customer quotes displayed | ✅ |
| 7 | View before/after comparison | Demo | Side-by-side visualization | ✅ |
| 8 | Click "Get Started" | Demo | `onSignup()` → authenticated → console | ✅ |

**What's Missing:**
- ❌ Manual scenario selection (auto-advance only)
- ❌ Pause/replay controls
- ❌ Interactive playground within demo

---

## Flow 16: Console Navigation & Shell

**Persona:** All authenticated users

| Step | Action | Page | Result | Status |
|------|--------|------|--------|--------|
| 1 | View top bar | Layout | "Azure AI Gateway" brand, notification badge, profile | ✅ |
| 2 | Click profile button | Layout | Dropdown with Settings and Sign Out | ✅ |
| 3 | Click "Sign Out" | Layout → Landing | `onSignOut()` → `isAuthenticated = false` → landing page | ✅ |
| 4 | Click sidebar nav item | Layout | Navigate to selected page, active item highlighted | ✅ |
| 5 | See page title and subtitle | Layout | Dynamic based on current route | ✅ |
| 6 | Click "Azure AI Gateway" brand | Layout → Landing | `onSignOut()` → returns to landing page | ✅ |
| 7 | Click notification bell | Layout | Nothing happens | ❌ |
| 8 | Click settings gear | Layout | Nothing happens | ❌ |
| 9 | Click sidebar footer links (Docs, API Ref, Support, Feedback) | Layout | Nothing happens | ❌ |

**What's Missing:**
- ❌ Notification panel
- ❌ Settings/preferences page
- ❌ External links for Docs, API Reference, Support, Feedback
- ❌ Breadcrumb navigation
- ❌ Brand click should go to landing without signing out

---

## Gap Summary

### Fully Working Flows (end-to-end)
1. Visitor → sign up → console ✅
2. Admin reviews health → navigates to alerts ✅
3. Policy toggle on/off → view history → simulate → view logs ✅
4. Credential inspection → blast radius → navigate to dependents ✅
5. Register model (6-step wizard) ✅
6. Register tool (6-step wizard) ✅
7. Register agent (6-step wizard) ✅
8. Playground: select → send → view trace ✅
9. Compliance: switch frameworks → view controls → navigate to evidence ✅
10. Access control: approve/reject requests → toggle permissions ✅

### Partially Working Flows
11. Analytics — displays data but no interactivity beyond viewing
12. Audit log — search/filter works but detail view is limited
13. Namespaces — view and drill into detail but no CRUD

### Top Gaps to Close

| Priority | Gap | Impact |
|----------|-----|--------|
| **P0** | No real authentication (Entra ID / MSAL) | Cannot demo to customers with real login |
| **P0** | No CRUD for core entities (policies, credentials, namespaces) | Can only view, not manage |
| **P0** | Registration wizards don't persist (no state or API) | Demo-only, not functional |
| **P1** | No search/filter on Catalog, Traffic | Hard to find assets in large deployments |
| **P1** | No time range pickers on Traffic, Analytics | Cannot analyze trends |
| **P1** | No export (CSV/PDF) on Analytics, Audit Log, Compliance | Cannot share reports |
| **P1** | Notification panel not implemented | Badge shows "3" but nothing opens |
| **P2** | No asset detail pages | Can see tables but not drill into individual model/tool/agent |
| **P2** | Settings page not implemented | No preferences, theme toggle |
| **P2** | Sidebar footer links dead | Docs, API Ref, Support, Feedback go nowhere |
| **P2** | Brand click signs out instead of going to dashboard | Unexpected UX |
