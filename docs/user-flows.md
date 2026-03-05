# User Flows — Azure AI Gateway Portal

> **Purpose:** Step-by-step user flow specs for every key scenario in the AI Gateway portal.
> These flows describe the governance configuration experience in the AI Gateway Control Plane portal.
> They cover both the **Admin / Platform Engineer** and **Developer / Agent Builder** personas
> and serve as the product spec for the mock implementation.
>
> **Portal pages referenced:**
> _Existing:_ Overview, Playground, Catalog, Models, Tools, MCP Servers, Agents, Namespaces, Policies (Runtime Rules / Design-Time Rules / Safety Guardrails), Audit Log
> _New:_ **Analytics** (token consumption observability), **Consumers** (per-user/per-app auth & quotas)
> _Enhanced:_ **Models** (Routing tab, Failover tab)

---

## Summary Table

| # | Scenario | Admin Flow(s) | Developer Flow(s) | Pages Touched |
|---|----------|---------------|-------------------|---------------|
| S1 | Token Consumption Observability | S1-A | S1-D | Analytics, Overview, Consumers |
| S2 | Per-User/Per-App Auth, Quotas & Enforcement | S2-A | S2-D | Consumers, Catalog, Logs |
| S3 | Model Routing & Load Balancing | S3-A | S3-D | Models → Routing tab, Catalog |
| S4 | High Availability & Resilience | S4-A | S4-D | Models → Failover tab, Catalog |
| S5 | Centralized Gateway for Enterprise Governance | S5-A | S5-D | Catalog, Namespaces, Policies, Consumers, Analytics, Overview |
| P0-MR | Model Registration (M1–M4) | P0-MR-A | — | Models, Namespaces, Policies |
| P0-TO | Tool & MCP Onboarding (T1–T3) | P0-TO-A | — | Tools, MCP Servers, Catalog |
| P0-AE | Agent Exposure (A1) | P0-AE-A | — | Agents, Models, Tools, Catalog |
| P0-CD | Catalog Discovery (T19, M15) | — | P0-CD-D | Catalog |
| P0-PE | Policy Enforcement (T12–T14) | P0-PE-A | — | Policies, Logs |

---

## Persona Definitions

| Persona | Role | Goals |
|---------|------|-------|
| **Admin / Platform Engineer** | Manages the gateway, registers assets, sets policies, monitors usage | Full CRUD on all entities; enterprise-wide visibility; governance & compliance |
| **Developer / Agent Builder** | Consumes models, tools, and agents through the gateway | Discover assets, obtain credentials, build with APIs, monitor own usage |

---

## S1 — Token Consumption Observability

### S1-A: Enterprise Token Usage Dashboard (Admin)

**Persona:** Admin / Platform Engineer
**Pages touched:** Analytics, Consumers
**Precondition:** Models are registered, consumers are active, telemetry is flowing.

**Steps:**

1. Admin clicks **Analytics** in the sidebar (Observability section).
2. System displays the **Analytics** page with an enterprise-wide token usage dashboard.
   - Hero metrics row: _Total Tokens (24 h)_, _Total Requests_, _Estimated Cost_, _Active Consumers_.
   - Time-range toggle in the top-right: **24 h** | **7 d** | **30 d** (default 24 h).
3. Admin toggles to **7 d** to view the weekly trend.
4. System re-renders all charts and tables for the 7-day window.
5. Admin uses the **Filter bar** (below the hero metrics) to narrow by:
   - _Model_ (multi-select dropdown, e.g. `gpt-4o`, `claude-3.5-sonnet`)
   - _Consumer_ (search-as-you-type, matches users and apps)
   - _Namespace_ (dropdown populated from Namespaces entity)
   - _Subscription / Deployment_ (dropdown populated from model deployments)
6. System updates the dashboard to reflect the active filters.
7. Admin scrolls to the **Top Consumers** table showing columns: _Consumer Name_, _Type (User / App)_, _Namespace_, _Tokens (Prompt + Completion)_, _Requests_, _Est. Cost_.
   - Table is sorted by total tokens descending. Pagination: 25 rows per page.
8. Admin clicks a consumer row (e.g. `order-processing-svc`).
9. System navigates to a **Consumer Detail — Usage** view showing:
   - Per-model token breakdown (stacked bar chart).
   - Request history timeline (line chart, 1 h granularity for 24 h, 6 h for 7 d, 1 d for 30 d).
   - Cost estimate table by model.
   - Quota utilisation gauge (if quotas are set).
10. Admin clicks **Set Budget Alert** button in the top-right of the consumer detail view.
11. System opens a dialog:
    - _Alert Name_ (text input, e.g. "order-processing daily alert")
    - _Threshold Type_: Token Count / Estimated Cost
    - _Threshold Value_ (number input)
    - _Time Window_: Per Hour / Per Day / Per Month
    - _Notification Channel_: Email / Webhook URL
12. Admin fills in the form and clicks **Save Alert**.
13. System confirms: "Budget alert created. You will be notified when `order-processing-svc` exceeds 500 K tokens/day."

**Outcome:** Admin has enterprise-wide visibility into token consumption, can drill down to any consumer, and has proactive budget alerts configured.

---

### S1-D: Personal Usage Widget (Developer)

**Persona:** Developer / Agent Builder
**Pages touched:** Overview, Analytics
**Precondition:** Developer is authenticated; at least one model request has been made under their consumer identity.

**Steps:**

1. Developer lands on the **Overview** (home page).
2. System displays a **My Usage** widget card in the dashboard grid showing:
   - _Tokens Used Today_: e.g. 42,350 / 100,000 (progress bar).
   - _Requests Today_: e.g. 128.
   - _Top Model_: e.g. `gpt-4o` (65 %).
3. Developer clicks the **View Details →** link on the widget.
4. System navigates to a **My Usage** detail page (scoped view within Analytics).
5. System shows:
   - Per-model token breakdown (doughnut chart + table: _Model_, _Prompt Tokens_, _Completion Tokens_, _Total_, _% of Quota_).
   - Remaining quota bar per rate-limit dimension (TPM, daily tokens, RPM).
   - Projected consumption line (extrapolation based on current burn rate vs. quota ceiling).
6. Developer hovers over the projected consumption line; tooltip shows: "At current rate you will exhaust your daily quota by 4:30 PM."
7. Developer optionally clicks a model row to see individual request log (timestamp, tokens, latency, status).

**Outcome:** Developer understands their personal consumption, remaining quota, and whether they are on track to hit limits — all without needing admin access.

---

## S2 — Per-User / Per-App Authentication, Quotas & Enforcement

### S2-A: Consumer Management (Admin)

**Persona:** Admin / Platform Engineer
**Pages touched:** Consumers, Logs
**Precondition:** At least one namespace exists.

**Steps:**

1. Admin clicks **Consumers** in the sidebar (Organization section, new page).
2. System displays the **Consumers** list page:
   - Search bar + filters: _Type_ (User / App / All), _Namespace_, _Status_ (Active / Suspended / Revoked).
   - Table columns: _Name_, _Type_, _Auth Method_, _Namespace_, _Quota (TPM)_, _Usage (24 h)_, _Status_, _Created_.
3. Admin clicks **+ Create Consumer** button.
4. System opens a **Create Consumer** panel (side panel):
   - **Name** (text input, required).
   - **Type** (radio: User / Application).
   - **Namespace** (dropdown, required — scopes the consumer's access).
   - **Description** (optional textarea).
5. Admin fills in: Name = `order-processing-svc`, Type = Application, Namespace = `platform-team`.
6. Admin proceeds to the **Authentication** section of the panel:
   - **Auth Method** (radio): _API Key_ | _Entra ID (Service Principal)_ | _OAuth 2.0 Client Credentials_.
   - If **API Key**: System shows "An API key will be generated upon creation."
   - If **Entra ID**: Fields for _Tenant ID_, _Client ID_.
   - If **OAuth 2.0**: Fields for _Token Endpoint_, _Client ID_, _Allowed Scopes_.
7. Admin selects **API Key**.
8. Admin proceeds to the **Quotas** section of the panel:
   - _Tokens Per Minute (TPM)_ (number input, blank = unlimited).
   - _Daily Token Limit_ (number input, blank = unlimited).
   - _Requests Per Minute (RPM)_ (number input, blank = unlimited).
   - _Enforcement Action_ (dropdown): Throttle (429) / Block / Log Only.
9. Admin sets: TPM = 80,000; Daily Token Limit = 1,000,000; RPM = 200; Enforcement = Throttle (429).
10. Admin clicks **Create**.
11. System creates the consumer and shows the **API Key** in a one-time modal:
    - "Copy this key now — it will not be shown again."
    - _Key_: `sg-xxxxxxxxxxxxxxxxxxxx` (masked after 4 chars, copy button).
    - _Key ID_: `key-abc123` (for reference in logs).
12. Admin copies the key and clicks **Done**.
13. System returns to the Consumers list; the new consumer appears with Status = Active.

**Viewing Enforcement Log:**

14. Admin clicks on `order-processing-svc` in the list.
15. System shows the **Consumer Detail** page with tabs: _Overview_ | _Usage_ | _Enforcement_ | _Keys_.
16. Admin clicks the **Enforcement** tab.
17. System shows a table of enforcement events:
    - Columns: _Timestamp_, _Event Type_ (429 Throttled / Blocked / Warning), _Rule_ (TPM / Daily / RPM), _Requested Tokens_, _Limit_, _Model_, _Request ID_.
    - Filters: date range, event type.
18. Admin reviews the last 24 h of 429 events.

**Revoking / Rotating Keys:**

19. Admin clicks the **Keys** tab.
20. System shows a table of API keys: _Key ID_, _Key Prefix_ (first 8 chars), _Created_, _Last Used_, _Status_.
21. Admin clicks **Rotate** on the active key.
22. System opens a confirmation dialog: "This will generate a new key and schedule the current key for revocation in 24 h (grace period). Continue?"
23. Admin confirms.
24. System generates and displays the new key (one-time modal). Old key shows Status = "Revoking (expires in 24 h)".

**Outcome:** Admin has full lifecycle management of consumers — creation, credential issuance, quota configuration, enforcement monitoring, and key rotation.

---

### S2-D: Request Access & View Own Quota (Developer)

**Persona:** Developer / Agent Builder
**Pages touched:** Catalog, Overview
**Precondition:** Developer is authenticated; a model exists in the Catalog.

**Steps:**

1. Developer navigates to **Catalog**.
2. Developer finds a model card, e.g. `gpt-4o (Azure OpenAI)`, and clicks it.
3. System shows the **Catalog Detail** page with tabs: _Overview_ | _Endpoints_ | _Policies_ | _Try It_.
4. Developer sees an **Access** section in Overview:
   - If not yet a consumer: button shows **Request Access**.
   - If already a consumer: shows assigned credentials and quota summary.
5. Developer clicks **Request Access**.
6. System shows a dialog:
   - _Use Case_ (text input, required — brief description of intended use).
   - _Requested Quota Tier_ (dropdown): Standard / High / Custom.
   - _Namespace_ (auto-populated if developer belongs to one, or dropdown).
7. Developer fills in: Use Case = "Order processing microservice needs GPT-4o for entity extraction", Tier = Standard.
8. Developer clicks **Submit Request**.
9. System confirms: "Access request submitted. You will be notified when approved."
   (If auto-approval is enabled for the namespace, system immediately provisions credentials.)
10. Upon approval, developer receives notification (in-app + email).
11. Developer navigates to **Catalog** → model detail → **Endpoints** tab.
12. System shows:
    - _Gateway Endpoint URL_: `https://gateway.example.com/v1/chat/completions`
    - _API Key_: `sg-xxxx…` (copy button; shown only once on first view, thereafter masked).
    - _Quota_: TPM = 20,000 / Daily = 200,000 / RPM = 60.
13. Developer clicks **View My Enforcement Events** link.
14. System shows a filtered view of enforcement events (only the developer's own consumer), same schema as S2-A step 17 but scoped to their identity.

**Outcome:** Developer discovers a model, requests access, receives credentials and quota info, and can monitor their own enforcement events — all self-service.

---

## S3 — Model Routing & Load Balancing

### S3-A: Configure Routing Strategy (Admin)

**Persona:** Admin / Platform Engineer
**Pages touched:** Models
**Precondition:** A model (e.g. `gpt-4o`) has been registered with multiple deployments (regions/SKUs).

**Steps:**

1. Admin navigates to **Models** page.
2. System shows the models list table: _Name_, _Provider_, _Deployments_, _Status_, _Namespace_.
3. Admin clicks on `gpt-4o`.
4. System shows the **Model Detail** page with tabs: _Overview_ | **Routing** | **Failover** | _Policies_ | _Usage_.
5. Admin clicks the **Routing** tab.
6. System shows:
   - **Deployments Table**: list of all registered deployments for this model.
     - Columns: _Deployment Name_, _Region_, _Provider_, _SKU (PTU / PAYGO)_, _Weight_, _Status_, _Avg Latency (p50/p99)_, _RPM (current)_.
     - Example rows:
       - `gpt4o-eastus-ptu` | East US | Azure OpenAI | PTU (150 K) | 60 % | ● Healthy | 120 ms / 450 ms | 1,240
       - `gpt4o-westus-paygo` | West US | Azure OpenAI | PAYGO | 25 % | ● Healthy | 180 ms / 680 ms | 430
       - `gpt4o-sweden-paygo` | Sweden Central | Azure OpenAI | PAYGO | 15 % | ● Healthy | 210 ms / 720 ms | 180
7. Admin clicks **Edit Strategy** button.
8. System opens the **Routing Configuration** panel:
   - **Load Balancing Strategy** (radio):
     - _Round Robin_ — equal distribution across healthy deployments.
     - _Weighted_ — distribute by weight percentages (must sum to 100 %).
     - _Latency-Based_ — route to lowest-latency healthy deployment.
     - _Priority_ — ordered preference list; use next only if prior is unhealthy.
   - Current selection: **Weighted**.
9. Admin adjusts weights: East US PTU → 70 %, West US PAYGO → 20 %, Sweden → 10 %.
10. Admin scrolls to the **PTU Spillover** section:
    - _Enable PTU → PAYGO spillover_: toggle (currently ON).
    - _Spillover threshold_: "When PTU utilization exceeds **90 %**, route overflow to PAYGO deployments."
    - _PAYGO spillover targets_ (ordered list): 1. West US PAYGO, 2. Sweden Central PAYGO.
11. Admin adjusts the spillover threshold from 90 % to 85 %.
12. Admin clicks **Save**.
13. System validates that weights sum to 100 % and saves the configuration.
14. System confirms: "Routing strategy updated for `gpt-4o`."
15. Admin scrolls down to the **Request Distribution** chart (live):
    - Stacked area chart showing requests per deployment over time.
    - Latency overlay (line per deployment).
    - Time range toggle: 1 h | 6 h | 24 h.
16. Admin toggles to **24 h** to review the distribution since the last change.

**Outcome:** Admin has configured weighted load balancing with PTU spillover and can observe real-time request distribution.

---

### S3-D: Transparent Unified Endpoint (Developer)

**Persona:** Developer / Agent Builder
**Pages touched:** Catalog
**Precondition:** Developer has consumer credentials for a model.

**Steps:**

1. Developer navigates to **Catalog**.
2. Developer clicks on `gpt-4o`.
3. System shows the model detail page. The **Endpoints** tab displays:
   - _Gateway Endpoint_: `https://gateway.example.com/v1/chat/completions` (single URL).
   - _Note_: "Requests are automatically routed across multiple deployments for optimal performance and availability."
4. Developer copies the endpoint and uses it in their application.
5. Routing, load balancing, and spillover happen transparently at the gateway layer.

**Outcome:** Developer consumes a single endpoint; routing complexity is fully abstracted by the gateway.

---

## S4 — High Availability & Resilience

### S4-A: Configure Failover Chain (Admin)

**Persona:** Admin / Platform Engineer
**Pages touched:** Models
**Precondition:** A model has multiple deployments (possibly across providers).

**Steps:**

1. Admin navigates to **Models** → clicks on `gpt-4o` → clicks the **Failover** tab.
2. System shows the **Failover Configuration** view:
   - **Failover Chain** (visual ordered list with drag-and-drop reordering):
     | Priority | Deployment | Provider | Region | Health | Last Check |
     |----------|-----------|----------|--------|--------|------------|
     | 1 (Primary) | `gpt4o-eastus-ptu` | Azure OpenAI | East US | ● Healthy | 12 s ago |
     | 2 (Secondary) | `gpt4o-westus-paygo` | Azure OpenAI | West US | ● Healthy | 12 s ago |
     | 3 (Tertiary) | `claude-3.5-sonnet-useast1` | Anthropic | us-east-1 | ● Healthy | 12 s ago |
   - Status indicators: ● Healthy (green) | ● Degraded (yellow) | ● Unhealthy (red).
3. Admin clicks **Edit Failover Settings**.
4. System shows the configuration panel:
   - **Health Check Configuration:**
     - _Check Interval_: 15 s / 30 s / 60 s (dropdown, default 30 s).
     - _Unhealthy Threshold_: consecutive failures before marking unhealthy (number, default 3).
     - _Healthy Threshold_: consecutive successes before marking healthy again (number, default 2).
     - _Check Method_: Synthetic Probe (lightweight test request) / Passive (infer from live traffic errors).
   - **Failover Behaviour:**
     - _Automatic failover_: toggle (ON).
     - _Failback on recovery_: toggle (ON) — automatically return traffic to higher-priority deployment when it recovers.
     - _Cross-provider failover_: toggle (ON) — allow failover to a different provider (e.g., Azure OpenAI → Anthropic).
     - _Cross-provider model mapping_: when failing to a different provider's model, map request format automatically.
5. Admin sets: Check Interval = 15 s, Unhealthy Threshold = 2, Failback = ON.
6. Admin clicks **Save**.
7. System confirms: "Failover configuration updated for `gpt-4o`."

**Viewing Failover Event History:**

8. Admin scrolls to the **Failover Event History** section.
9. System shows a timeline / table:
   - Columns: _Timestamp_, _Event_ (Failover Triggered / Failback Completed / Manual Override), _From Deployment_, _To Deployment_, _Reason_ (Health check failed / 5xx spike / Manual), _Duration_.
   - Example: "2025-07-14 09:23:14 — Failover Triggered — `gpt4o-eastus-ptu` → `gpt4o-westus-paygo` — Reason: 2 consecutive health check failures — Duration: 4 m 12 s."
10. Admin reviews the history to assess the frequency and impact of failover events.

**Manual Failover Test:**

11. Admin clicks **Test Failover** button.
12. System opens a confirmation dialog: "This will temporarily mark `gpt4o-eastus-ptu` (Primary) as unhealthy and trigger failover to `gpt4o-westus-paygo` (Secondary). Traffic will shift for 60 seconds, then the primary will be restored. Proceed?"
13. Admin clicks **Confirm**.
14. System executes the test. A live status banner appears: "⚡ Failover test in progress — traffic routed to `gpt4o-westus-paygo`."
15. After 60 seconds, system restores primary and shows: "✓ Failover test complete. Primary restored. See event history for details."

**Outcome:** Admin has a fully configured failover chain (including cross-provider), can review event history, and can validate failover behaviour with a manual test.

---

### S4-D: Model Health Visibility (Developer)

**Persona:** Developer / Agent Builder
**Pages touched:** Catalog
**Precondition:** Developer is browsing the catalog.

**Steps:**

1. Developer navigates to **Catalog**.
2. Each model card displays a health badge:
   - ● **Active** (green) — all deployments healthy.
   - ● **Degraded** (yellow) — operating on a secondary/tertiary deployment.
   - ● **Unavailable** (red) — all deployments unhealthy.
3. Developer sees `gpt-4o` showing ● **Degraded**.
4. Developer clicks on the model card.
5. System shows the detail page. A banner at the top reads: "This model is currently operating on a secondary deployment (West US). Performance may differ from normal. The primary deployment (East US) is recovering."
6. Failover and recovery are otherwise transparent to the developer.

**Outcome:** Developer is informed of degraded status but does not need to take action; failover is handled by the gateway.

---

## S5 — Centralized Gateway for Enterprise Governance

### S5-A: Single Pane of Glass (Admin)

**Persona:** Admin / Platform Engineer
**Pages touched:** Overview, Catalog, Namespaces, Policies, Consumers, Analytics
**Precondition:** The gateway is set up with models, tools, agents, namespaces, and consumers.

**Steps:**

1. Admin lands on the **Overview**.
2. System shows enterprise-wide summary widgets:
   - _Total Assets_: Models (12), Tools (34), MCP Servers (8), Agents (5).
   - _Active Consumers_: 47 users, 23 apps.
   - _Requests (24 h)_: 1.2 M.
   - _Policy Violations (24 h)_: 14 (link to Logs).
   - _Estimated Cost (MTD)_: $12,400.
3. Admin clicks **Catalog** to review all approved assets.
4. System shows the unified catalog: Models, Tools, MCP Servers, Agents — all searchable and filterable.
   - Filter by: _Type_ (Model / Tool / MCP Server / Agent), _Namespace_, _Provider_, _Status_, _Tag_.
5. Admin clicks **Namespaces** to review team structure.
6. System shows namespace list: _Name_, _Owner_, _Members_, _Assets_, _Policies Applied_.
7. Admin clicks **Policies** to review governance posture.
8. System shows three tabs:
   - **Runtime Rules**: Rate limits, ACLs, IP filters, token limits, circuit breakers.
   - **Design-Time Rules**: Model registration approval, tool onboarding checklists, naming conventions.
   - **Safety Guardrails**: Content safety filters, PII detection, prompt injection protection.
9. Admin clicks **Consumers** to review access control.
10. System shows all consumers with quota utilisation and status.
11. Admin clicks **Analytics** to review usage trends.
12. System shows the enterprise token usage dashboard (as described in S1-A).

**Outcome:** Admin uses a single portal to govern all AI assets, access control, policies, and usage — the "single pane of glass" for enterprise AI.

---

### S5-D: Governed Self-Service (Developer)

**Persona:** Developer / Agent Builder
**Pages touched:** Overview, Catalog, Namespaces
**Precondition:** Developer is authenticated and belongs to a namespace.

**Steps:**

1. Developer lands on **Overview**.
2. System shows a personalised view:
   - _My Namespace_: `backend-team` — 3 models, 5 tools available.
   - _My Usage_ widget (as described in S1-D).
   - _Recent Activity_: last 5 API calls with status.
3. Developer clicks **Catalog** to discover available assets.
4. System shows the catalog filtered to assets visible within the developer's namespace (plus globally shared assets).
5. Developer clicks on an asset to view details.
6. System shows: description, endpoint, policies applied, usage guidelines, and the **Request Access** flow (if not already authorized, see S2-D).
7. Developer copies the governed endpoint and integrates into their application.
8. All requests flow through the gateway and are subject to the policies, quotas, and guardrails configured by the admin — seamlessly.

**Outcome:** Developer has self-service access to governed AI assets scoped to their namespace, with built-in compliance and guardrails.

---

## P0-MR — Model Registration (M1–M4)

### P0-MR-A: Register a Model from a Cloud Provider

**Persona:** Admin / Platform Engineer
**Pages touched:** Models, Namespaces, Policies
**Precondition:** At least one namespace exists.

**Steps:**

1. Admin navigates to **Models** page.
2. Admin clicks **+ Register Model**.
3. System opens a multi-step **Register Model** wizard.

**Step 1 — Provider & Connection:**

4. Admin selects a provider:
   - _Azure OpenAI_ | _OpenAI_ | _Anthropic_ | _Google Vertex AI_ | _AWS Bedrock_ | _Custom (OpenAI-compatible)_.
5. Admin selects **Azure OpenAI**.
6. System shows provider-specific fields:
   - _Deployment Name_ (text, e.g. `gpt4o-eastus-ptu`).
   - _Endpoint URL_ (text, e.g. `https://myoai.openai.azure.com/`).
   - _API Version_ (dropdown, e.g. `2024-12-01-preview`).
   - _Authentication_:
     - _API Key_ (text input, stored encrypted).
     - _Managed Identity_ (toggle — uses gateway's identity).
   - _Region_ (text, e.g. `eastus`).
   - _SKU_ (radio: PTU / PAYGO). If PTU, also: _PTU Capacity_ (number).
7. Admin fills in the connection details and clicks **Test Connection**.
8. System sends a lightweight probe request and shows: "✓ Connection successful. Model: gpt-4o, Version: 2024-08-06."

**Step 2 — Model Metadata:**

9. System pre-fills metadata from the provider probe:
   - _Display Name_: `GPT-4o (East US PTU)`.
   - _Model Family_: `gpt-4o`.
   - _Capabilities_ (checkboxes): Chat Completion ✓, Function Calling ✓, Vision ✓, Streaming ✓.
   - _Context Window_: 128,000 tokens.
   - _Max Output Tokens_: 16,384.
   - _Tags_ (chip input): `production`, `gpt-4o`, `azure`.
10. Admin adjusts the Display Name to `GPT-4o` and adds tag `tier-1`.

**Step 3 — Namespace & Visibility:**

11. Admin assigns the model to a namespace: `platform-team` (dropdown).
12. Admin sets visibility:
    - _Namespace Only_ — only members of `platform-team` see it.
    - _Cross-Namespace (selected namespaces)_ — choose which namespaces can see it.
    - _Global_ — visible to all namespaces.
13. Admin selects **Global**.

**Step 4 — Policies (optional):**

14. System shows a list of existing policies that can be attached:
    - e.g. `rate-limit-standard` (100 RPM), `content-safety-moderate`, `pii-filter`.
15. Admin attaches `rate-limit-standard` and `content-safety-moderate`.

**Step 5 — Review & Create:**

16. System shows a summary of all configuration.
17. Admin clicks **Register**.
18. System creates the model record, applies policies, and shows: "✓ Model `GPT-4o` registered and available in the Catalog."
19. System returns to the Models list; the new model appears.

**Adding Additional Deployments (M2–M4):**

20. Admin clicks on `GPT-4o` → **Routing** tab → **+ Add Deployment**.
21. Admin repeats steps 5–8 for additional providers/regions (e.g., Anthropic `claude-3.5-sonnet` as a cross-provider failover, or Azure OpenAI West US PAYGO).
22. System adds the deployment to the routing table.

**Outcome:** Admin has registered a model (or model family) with one or more deployments across providers/regions, assigned it to a namespace, and applied initial policies.

---

## P0-TO — Tool & MCP Onboarding (T1–T3)

### P0-TO-A1: Onboard an External MCP Server

**Persona:** Admin / Platform Engineer
**Pages touched:** MCP Servers, Catalog
**Precondition:** An external MCP-compliant server is running and accessible.

**Steps:**

1. Admin navigates to **MCP Servers** page.
2. Admin clicks **+ Register MCP Server**.
3. System shows the **Register MCP Server** form:
   - _Name_ (text, e.g. `weather-mcp`).
   - _Endpoint URL_ (text, e.g. `https://weather-mcp.example.com/sse`).
   - _Transport_ (radio): SSE | Streamable HTTP | Stdio (not applicable for external).
   - _Authentication_ (radio): None | API Key | OAuth 2.0 | Custom Header.
   - _Description_ (textarea).
   - _Tags_ (chip input).
4. Admin fills in the details and selects Authentication = API Key.
5. System shows: _Header Name_ (default `Authorization`), _Key Value_ (password input).
6. Admin enters the key and clicks **Test Connection**.
7. System probes the MCP server's `tools/list` method and shows: "✓ Connected. 4 tools discovered: `get_weather`, `get_forecast`, `get_alerts`, `get_historical`."
8. System shows a preview table of discovered tools with: _Tool Name_, _Description_, _Parameters_.
9. Admin reviews and clicks **Register**.
10. System creates the MCP Server record and its associated tools.
11. System confirms: "✓ MCP Server `weather-mcp` registered with 4 tools. Available in the Catalog."

**Outcome:** Admin has onboarded an external MCP server; its tools are discoverable in the Catalog.

---

### P0-TO-A2: Convert OpenAPI Spec to MCP (No Code)

**Persona:** Admin / Platform Engineer
**Pages touched:** Tools, MCP Servers, Catalog
**Precondition:** An OpenAPI specification (JSON or YAML) is available for an existing REST API.

**Steps:**

1. Admin navigates to **Tools** page.
2. Admin clicks **+ Add Tool** → selects **Import from OpenAPI**.
3. System shows the **OpenAPI Import** wizard:

**Step 1 — Specification:**

4. Admin provides the spec:
   - _Upload file_ (drag & drop or browse, `.json` / `.yaml`).
   - _OR Fetch from URL_ (text input, e.g. `https://api.example.com/openapi.json`).
5. Admin pastes a URL and clicks **Fetch**.
6. System downloads and parses the spec. Shows:
   - _API Title_: `Order Management API`.
   - _Version_: `2.1.0`.
   - _Endpoints discovered_: 12.

**Step 2 — Select Operations:**

7. System shows a table of all operations in the spec:
   - Columns: ☑ (select), _Method_, _Path_, _Operation ID_, _Summary_.
   - All are checked by default.
8. Admin unchecks 4 internal/admin endpoints, leaving 8 selected.

**Step 3 — MCP Mapping:**

9. System shows the automatic mapping:
   - Each selected operation becomes an MCP tool.
   - _Tool Name_ (auto-generated from operationId, editable).
   - _Description_ (from OpenAPI summary).
   - _Parameters_ (from OpenAPI request schema, JSON Schema format).
10. Admin renames `createOrder` to `create_order` for consistency.

**Step 4 — Authentication:**

11. Admin configures how the gateway authenticates to the upstream API:
    - _Auth Method_: None | API Key | OAuth 2.0 Client Credentials | Bearer Token.
12. Admin selects **OAuth 2.0 Client Credentials** and fills in: _Token URL_, _Client ID_, _Client Secret_, _Scope_.

**Step 5 — Review & Create:**

13. System shows a summary: "8 tools will be created from the Order Management API, exposed via a managed MCP server."
14. Admin clicks **Create**.
15. System:
    - Creates a managed MCP Server (`order-management-mcp`).
    - Creates 8 Tool records linked to the MCP server.
    - Registers all in the Catalog.
16. System confirms: "✓ 8 tools created from `Order Management API`. Managed MCP Server `order-management-mcp` is live."

**Outcome:** Admin has converted an OpenAPI specification into MCP tools without writing any code; they are live and discoverable.

---

## P0-AE — Agent Exposure (A1)

### P0-AE-A: Register and Expose an Agent

**Persona:** Admin / Platform Engineer
**Pages touched:** Agents, Models, Tools, Catalog
**Precondition:** Models and tools are registered.

**Steps:**

1. Admin navigates to **Agents** page.
2. Admin clicks **+ Register Agent**.
3. System opens the **Register Agent** wizard.

**Step 1 — Agent Identity:**

4. Admin fills in:
   - _Name_ (text, e.g. `order-assistant`).
   - _Protocol_ (radio): RAPI | A2A | Custom.
   - _Description_ (textarea): "Handles order inquiries, modifications, and status checks."
   - _Tags_ (chip input): `orders`, `customer-support`.
5. Admin selects **A2A** protocol.

**Step 2 — Upstream Endpoint:**

6. System shows:
   - _Agent Endpoint URL_ (text, e.g. `https://agents.internal.example.com/order-assistant`).
   - _Authentication_: None | API Key | OAuth 2.0 | Managed Identity.
7. Admin enters the endpoint and selects API Key auth.
8. Admin clicks **Test Connection**.
9. System probes the agent and shows: "✓ Connected. Agent capabilities: chat, function_calling."

**Step 3 — Connect Model & Tools:**

10. System shows:
    - _Model_ (dropdown of registered models): Admin selects `GPT-4o`.
    - _Tools_ (multi-select of registered tools): Admin selects `create_order`, `get_order_status`, `modify_order`.
    - _MCP Servers_ (multi-select): Admin optionally adds `weather-mcp` for location-aware delivery estimates.
11. Admin makes selections.

**Step 4 — Gateway Exposure:**

12. System shows:
    - _Expose via Gateway_ (toggle, ON by default).
    - _Gateway Path_: `/agents/order-assistant` (auto-generated, editable).
    - _Namespace_: `customer-support` (dropdown).
    - _Visibility_: Global / Namespace Only / Selected Namespaces.
13. Admin keeps defaults and sets Visibility = Global.

**Step 5 — Policies (optional):**

14. Admin attaches policies: `rate-limit-standard`, `content-safety-strict`.

**Step 6 — Review & Create:**

15. System shows a summary of the agent configuration.
16. Admin clicks **Register**.
17. System creates the agent record, configures the gateway route, and shows: "✓ Agent `order-assistant` registered and exposed at `/agents/order-assistant`."
18. The agent appears in the Catalog alongside models and tools.

**Outcome:** Admin has registered an agent, connected it to a model and tools, and exposed it through the gateway with policies applied.

---

## P0-CD — Catalog Discovery (T19, M15)

### P0-CD-D: Discover Assets in the Catalog

**Persona:** Developer / Agent Builder
**Pages touched:** Catalog
**Precondition:** Developer is authenticated and belongs to a namespace.

**Steps:**

1. Developer navigates to **Catalog**.
2. System shows the unified catalog page with a search bar and asset cards.
3. Developer types `order` in the search bar.
4. System filters in real time, showing assets matching "order" in name, description, or tags.
5. Developer uses the **Filter Panel** (left sidebar or top bar):
   - _Type_: ☑ Model ☑ Tool ☑ Agent ☐ MCP Server (checkboxes).
   - _Namespace_: dropdown (shows own namespace + global).
   - _Provider_: checkboxes (Azure OpenAI, Anthropic, etc.).
   - _Tags_: chip-based filter.
   - _Status_: Active / Degraded / All.
6. Developer checks only **Tool** and **Agent** types.
7. System shows:
   - Tool: `create_order` — "Create a new order in the system."
   - Tool: `get_order_status` — "Retrieve the current status of an order."
   - Tool: `modify_order` — "Modify an existing order."
   - Agent: `order-assistant` — "Handles order inquiries, modifications, and status checks."
8. Developer clicks on `order-assistant`.
9. System shows the **Asset Detail** page:
   - **Overview** tab: Description, protocol (A2A), connected model, connected tools, namespace, tags, owner, created date.
   - **Endpoints** tab: Gateway URL, auth requirements, example request/response (code snippet in cURL, Python, TypeScript).
   - **Policies** tab: Applied policies (rate limit, content safety) — so developer knows the constraints.
   - **Try It** tab: Interactive playground to send a test request directly from the portal.
10. Developer clicks the **Try It** tab.
11. System shows an inline playground with a message input and a **Send** button.
12. Developer types: "What is the status of order #12345?" and clicks **Send**.
13. System sends the request through the gateway and displays the agent's response in real time (streamed).
14. Developer is satisfied and copies the endpoint from the **Endpoints** tab.

**Outcome:** Developer discovered relevant assets via search and filters, reviewed details, tested interactively, and obtained the endpoint for integration.

---

## P0-PE — Policy Enforcement (T12–T14)

### P0-PE-A: Create and Apply Runtime Policies

**Persona:** Admin / Platform Engineer
**Pages touched:** Policies, Models, Tools, Agents, Logs
**Precondition:** Assets (models, tools, agents) are registered.

**Steps:**

**Creating a Runtime Rule — Rate Limit:**

1. Admin navigates to **Policies** → **Runtime Rules** tab.
2. System shows a list of existing runtime rules: _Name_, _Type_, _Scope_, _Assets Applied_, _Status_ (Enabled / Disabled).
3. Admin clicks **+ Create Rule**.
4. System shows the **Create Runtime Rule** form:
   - _Name_ (text, e.g. `rate-limit-high-tier`).
   - _Type_ (dropdown): Rate Limit | ACL (Access Control List) | IP Filter | Token Limit | Circuit Breaker | Custom.
5. Admin selects **Rate Limit**.
6. System shows rate limit configuration:
   - _Requests Per Minute (RPM)_: 200.
   - _Tokens Per Minute (TPM)_: 100,000.
   - _Burst Allowance_: 20 % (allows brief spikes above limit).
   - _Enforcement Action_ (dropdown): Throttle (429) | Block (403) | Log Only.
   - _Scope_ (radio): Per Consumer | Per Namespace | Global.
7. Admin fills in: RPM = 200, TPM = 100,000, Burst = 10 %, Enforcement = Throttle (429), Scope = Per Consumer.
8. Admin clicks **Save Rule**.
9. System creates the rule and returns to the list. Status = Enabled.

**Creating a Runtime Rule — ACL:**

10. Admin clicks **+ Create Rule** again.
11. Admin selects Type = **ACL**.
12. System shows ACL configuration:
    - _Allowed Consumers_ (multi-select or consumer group).
    - _Denied Consumers_ (multi-select).
    - _Action for Denied_: Block (403) | Log Only.
13. Admin adds consumer group `external-partners` to Denied and sets Action = Block (403).
14. Admin names it `block-external-partners` and saves.

**Creating a Runtime Rule — IP Filter:**

15. Admin clicks **+ Create Rule** again.
16. Admin selects Type = **IP Filter**.
17. System shows IP filter configuration:
    - _Mode_ (radio): Allow List | Deny List.
    - _IP Ranges_ (textarea, CIDR notation, one per line).
18. Admin selects Allow List and enters: `10.0.0.0/8`, `172.16.0.0/12`.
19. Admin names it `internal-only-ip` and saves.

**Applying Policies to Assets:**

20. Admin navigates to **Models** → clicks on `GPT-4o` → **Policies** tab.
21. System shows currently applied policies and a **+ Attach Policy** button.
22. Admin clicks **+ Attach Policy**.
23. System opens a dialog listing all available policies (runtime + design-time + RAI) not yet attached.
24. Admin selects `rate-limit-high-tier` and `internal-only-ip`.
25. Admin clicks **Attach**.
26. System applies the policies and confirms: "2 policies attached to `GPT-4o`."

(Admin repeats for Tools and Agents as needed.)

**Monitoring Enforcement in Logs:**

27. Admin navigates to **Logs**.
28. System shows the logs page with filters:
    - _Time Range_: Last 1 h / 6 h / 24 h / Custom.
    - _Level_: All | Info | Warning | Error.
    - _Policy_: dropdown of policy names.
    - _Asset_: dropdown of models/tools/agents.
    - _Consumer_: search input.
    - _Status Code_: text input (e.g. `429`, `403`).
29. Admin filters by: Policy = `rate-limit-high-tier`, Status Code = `429`, Time Range = Last 24 h.
30. System shows matching log entries:
    - Columns: _Timestamp_, _Consumer_, _Asset_, _Policy_, _Action_ (Throttled / Blocked), _Request ID_, _Details_.
31. Admin clicks a log entry to expand details:
    - _Request method & path_.
    - _Consumer identity_.
    - _Tokens requested vs. limit_.
    - _RPM at time of request vs. limit_.
    - _Gateway decision_: Throttled (429) — consumer exceeded 200 RPM.

**Outcome:** Admin has created multiple runtime policy types, applied them to assets, and can monitor enforcement in real time through the Logs page.

---

## Cross-Reference: Scenario IDs to Flows

| Scenario ID | Description | Flow Reference |
|-------------|-------------|---------------|
| M1 | Multi-cloud model access (Azure OpenAI) | P0-MR-A (Step 5: Azure OpenAI) |
| M2 | Multi-cloud model access (Anthropic) | P0-MR-A (Step 20–22) |
| M3 | Multi-cloud model access (Vertex AI) | P0-MR-A (Step 4: Vertex AI) |
| M4 | Multi-cloud model access (Custom) | P0-MR-A (Step 4: Custom) |
| M5 | Unified API abstraction | S3-D (single endpoint) |
| M6 | Token limit enforcement | S2-A (Quotas), P0-PE-A (Token Limit rule) |
| M7 | Consumer auth & identification | S2-A (Consumer creation + auth methods) |
| M11 | Rate limiting & throttling | P0-PE-A (Rate Limit rule) |
| M12 | Failover & resilience | S4-A |
| M13 | Per-model observability | S1-A (per-model breakdown) |
| M15 | Model discovery in catalog | P0-CD-D |
| T1 | MCP endpoint onboarding | P0-TO-A1 |
| T2 | OpenAPI → MCP conversion | P0-TO-A2 |
| T3 | Hosted MCP server | P0-TO-A1 (variant) |
| T12 | Runtime rule: rate limit | P0-PE-A (Steps 3–9) |
| T13 | Runtime rule: ACL | P0-PE-A (Steps 10–14) |
| T14 | Runtime rule: IP filter | P0-PE-A (Steps 15–19) |
| T19 | Tool discovery in catalog | P0-CD-D |
| A1 | Agent exposure via gateway | P0-AE-A |

---

## Page Inventory (Post-Enhancement)

| Page | Section | Persona | New / Enhanced | Purpose |
|------|---------|---------|----------------|---------|
| Overview | — | Both | Enhanced | Summary widgets; personal usage for devs |
| Playground | — | Developer | Existing | Interactive testing |
| Catalog | Discovery | Both | Existing | Unified asset discovery, search, filters, detail views |
| Models | AI Assets | Admin | **Enhanced** | Model list + Routing tab + Failover tab |
| Tools | AI Assets | Admin | Existing | Tool management, OpenAPI import |
| MCP Servers | AI Assets | Admin | Existing | MCP server registration |
| Agents | AI Assets | Admin | Existing | Agent registration & exposure |
| Namespaces | Organization | Admin | Existing | Team/project scoping |
| **Consumers** | Organization | Both | **New** | Consumer CRUD, auth, quotas, keys, enforcement log |
| Policies | Governance | Admin | Existing | Runtime Rules, Design-Time Rules, Safety Guardrails |
| Audit Log | Observability | Admin | Existing | Request logs, policy enforcement audit |
| **Analytics** | Observability | Both | **New** | Token consumption dashboard, filters, budget alerts |

---

## Navigation Changes

The sidebar navigation should be updated to include the new pages:

```
Overview
Playground
─── Discovery ───
Catalog
─── AI Assets ───
Models
Tools
MCP Servers
Agents
─── Organization ───
Namespaces
Consumers          ← NEW
─── Governance ───
Policies
─── Observability ───
Analytics          ← NEW
Audit Log
```

---

## Data Flow Summary

```
Developer                Admin
   │                       │
   ▼                       ▼
Catalog ◄─── registers ── Models / Tools / MCP Servers / Agents
   │                       │
   ▼                       ▼
Request Access        Consumers (auth, quotas)
   │                       │
   ▼                       ▼
Gateway Endpoint      Policies (runtime rules, RAI)
   │                       │
   ▼                       ▼
API Calls ──────► Gateway Proxy ──────► Backend (Model/Tool/Agent)
                     │        │
                     ▼        ▼
                  Logs    Analytics
                  (Admin)  (Both)
```

---

## Appendix: UI Component Patterns

All flows should use consistent Fluent UI v9 patterns:

| Pattern | Component | Usage |
|---------|-----------|-------|
| List pages | `DataGrid` + toolbar + filters | Models, Tools, Consumers, Policies |
| Detail pages | `TabList` with tab panels | Model Detail (Overview/Routing/Failover/Policies/Usage) |
| Creation wizards | Multi-step side panel or dialog | Register Model, Create Consumer, Register Agent |
| Status indicators | `Badge` with color variants | ● Healthy / ● Degraded / ● Unhealthy |
| Metric cards | `Card` with large number + sparkline | Overview widgets, Analytics hero metrics |
| Charts | Recharts or similar | Time series (area/line), breakdowns (doughnut/bar) |
| Filters | `Combobox`, `Dropdown`, `SearchBox` | Consistent filter bar across list/analytics pages |
| Confirmations | `Dialog` | Destructive actions (revoke key, test failover) |
| One-time secrets | `Dialog` with copy button + warning | API key display on creation |
