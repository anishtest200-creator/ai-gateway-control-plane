# Azure AI Gateway Control Plane — Iteration Plan

> Living document for tracking prototype iterations.
> Last updated: March 2026

---

## Current State

### What's Built
- **12 console pages** with black + soft indigo premium theme (#818CF8)
  - **Overview** — Developer-first landing: Quick Start buttons, gateway health hero, key metrics, attention needed, recent activity, top models
  - **Assets** — Tabbed Models/Tools/Agents with governance overview, source distribution, registration wizards
  - **Credentials** — Credential management, blast radius analysis, emergency revocation, rotation alerts
  - **Routing** — Routing rules, failover chains, load balancing, health checks
  - **Policies** — Runtime rules, access rules, safety guardrails, AI compose, version history, impact simulator, staged rollout
  - **Metrics** — Three tabs: Traffic (throughput, provider distribution), Cost (spend, chargeback), Budgets (allocation, burn rates)
  - **Audit Log** — Request/response audit trail with search, filters, detail panel
  - **Namespaces** — Grid/detail views with members, credentials, assets, policies, budget rules configuration
  - **Access Control** — Users, service identities, API keys, access requests, audit
  - **Test Console** — Test routing, policies, and credential mediation live
- **4 public marketing pages**
  - **Landing** — Hero, 3-column architecture diagram (Models/Tools/Agents), features, stats
  - **Pricing** — 3-tier SaaS (Developer free / Pro $99 / Enterprise custom), calculator, FAQ
  - **Docs** — Search, quickstart cards, 6-category doc index, code examples, SDK cards
  - **Demo** — 4 interactive scenarios with auto-advance, live metrics, testimonials
- **3 registration wizards** (6-step: Source → Endpoint → Configuration → Governance → Namespace → Review)
  - Register Model, Register Tool, Register Agent
- **Shell** — Top bar with "Azure AI Gateway" branding, sidebar navigation (Configure / Monitor / Govern / Tools)
- **Product documentation** — 10 docs covering architecture, governance, positioning, entity model, user flows, competitive analysis, scenarios, credential management, MVP scope, product vision

### Navigation Structure
| Section | Pages |
|---------|-------|
| Configure | Assets, Credentials, Routing, Policies |
| Monitor | Metrics, Audit Log |
| Govern | Namespaces, Access Control |
| Tools | Test Console |

### Design Language
- Background: `#0A0A0A` / `#161616`
- Indigo accent: `#818CF8` (bright: `#A5B4FC`, dim: `#6366F1`)
- Borders: `rgba(129, 140, 248, 0.12)`
- Text: `#E8E8E8`
- Semantic: green `#4ADE80`, red `#EF4444`, amber `#F59E0B`
- Cards: raised surface with box-shadow
- Buttons: indigo bg + white text (standardized across all pages)

---

## Completed Work

- [x] Port features from studio portal into console tabs
- [x] Build governance lifecycle (dashboard, compliance, policy lifecycle, cost governance, credential blast radius)
- [x] Apply black + gold premium theme across all pages
- [x] Remove "Operations Console" / "Gateway Ops" terminology
- [x] Build Pricing page (3-tier SaaS, calculator, FAQ, competitive positioning)
- [x] Build Docs page (search, quickstart, code examples, SDK cards, architecture diagram)
- [x] Build Demo page (4 interactive scenarios, live metrics, testimonials)
- [x] Wire all CTAs to navigate to console
- [x] Fix scroll on marketing pages
- [x] Make brand clickable to return to landing page
- [x] Replace "Open Console" with "Get Started"
- [x] Remove redundant sidebar branding
- [x] Rename nav items: Assets, Credentials, Routing, Policies, Metrics, Audit Log, Namespaces, Access Control, Test Console
- [x] Restructure nav into Configure / Monitor / Govern / Tools
- [x] Streamline Metrics into 3 clean tabs: Traffic, Cost, Budgets
- [x] Add budget rules configuration to Namespaces (scope, threshold, enforcement actions)
- [x] Rebuild Overview as developer-first landing page (Quick Start, Health Hero, Key Metrics, Attention Needed, Activity, Top Models)
- [x] Rebrand from gold (#D4A843) to soft indigo (#818CF8) — modern, enterprise-grade palette
- [x] Add raised surface shadow to all cards and panels
- [x] Standardize all button styles (indigo bg + white text, consistent padding/radius)
- [x] Remove maxWidth constraints for full-width layouts
- [x] AI-powered policy composition (natural language → policy)
- [x] Update all documentation (README, spec, plan, docs/)
- [x] Extract to dedicated repo for clean development

---

## Next Steps

### High Priority
- [ ] Replace mock data with API integration (or at minimum, shared mock data service)
- [ ] Add responsive breakpoints for tablet/mobile
- [ ] Implement real authentication (Entra ID / MSAL)
- [ ] Add loading states and error boundaries to all pages
- [ ] Take screenshots for docs/README

### Medium Priority
- [ ] Add unit tests for page components
- [ ] Add E2E tests (Playwright or Cypress)
- [ ] Implement search/filter across all list views
- [ ] Add export functionality (CSV/PDF) for analytics and audit log
- [ ] Add dark/light theme toggle

### Low Priority
- [ ] Internationalization (i18n)
- [ ] Keyboard navigation and accessibility audit
- [ ] Performance optimization (code splitting, lazy loading)
- [ ] PWA support
- [ ] Add Storybook for component documentation

---

## Related

- **[standalone-ai-gateway](https://github.com/anishta_microsoft/standalone-ai-gateway)** — AI Gateway Studio portal and runtime engine
- **[Product Specification](spec.md)** — Full product spec
- **[Architecture](docs/architecture.md)** — System architecture
- **[Positioning](docs/positioning.md)** — Foundry relationship and market differentiation
