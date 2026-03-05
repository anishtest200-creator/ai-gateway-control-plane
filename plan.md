# Azure AI Gateway Control Plane — Iteration Plan

> Living document for tracking prototype iterations.
> Last updated: March 2026

---

## Current State

### What's Built
- **16 console pages** with black + gold premium theme
  - **Overview** — Governance score ring, alerts, policy coverage heatmap, namespace health
  - **Traffic** — Real-time throughput, provider breakdown, policy enforcement stats
  - **Routing** — Routing rules, failover chains, load balancing, health checks
  - **Policies** — Runtime rules, access rules, safety guardrails, version history, impact simulator, staged rollout
  - **Secrets** — Credential management, blast radius analysis, emergency revocation, rotation alerts
  - **Catalog** — Tabbed Models/Tools/Agents with governance overview, source distribution
  - **Analytics** — Token analytics, cost attribution, namespace budgets, anomaly detection, chargeback
  - **Audit Log** — Request/response audit trail with search, filters, detail panel
  - **Namespaces** — Grid/detail views with members, credentials, assets, policies
  - **Access Control** — Users, service identities, API keys, access requests, audit
  - **Compliance** — 5 framework mappings (SOC2/HIPAA/GDPR/ISO27001/NIST), evidence generation
  - **Playground** — Test routing, policies, and credential mediation live
- **4 public marketing pages**
  - **Landing** — Hero, 3-column architecture diagram (Models/Tools/Agents), features, stats
  - **Pricing** — 3-tier SaaS (Developer free / Pro $99 / Enterprise custom), calculator, FAQ
  - **Docs** — Search, quickstart cards, 6-category doc index, code examples, SDK cards
  - **Demo** — 4 interactive scenarios with auto-advance, live metrics, testimonials
- **3 registration wizards** (6-step: Source → Endpoint → Configuration → Governance → Namespace → Review)
  - Register Model, Register Tool, Register Agent
- **Shell** — Top bar with "Azure AI Gateway" branding, sidebar navigation (Operations / Inventory / Insights / Administration)
- **Product documentation** — 10 docs covering architecture, governance, positioning, entity model, user flows, competitive analysis, scenarios, credential management, MVP scope, product vision

### Navigation Structure
| Section | Pages |
|---------|-------|
| Operations | Overview, Traffic, Routing, Policies, Secrets |
| Inventory | Catalog |
| Insights | Analytics, Audit Log |
| Administration | Namespaces, Access Control, Compliance, Playground |

### Design Language
- Background: `#0A0A0A` / `#161616`
- Gold accent: `#D4A843`
- Borders: `rgba(212,168,67,0.10)`
- Text: `#E8E8E8`
- Semantic: green `#4ADE80`, red `#EF4444`, amber `#F59E0B`

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
- [x] Rename nav items for clarity: Secrets, Catalog, Analytics, Audit Log, Access Control, Playground
- [x] Update all documentation (README, spec, plan)
- [x] Extract to dedicated repo for clean development

---

## Next Steps

### High Priority
- [ ] Replace mock data with API integration (or at minimum, shared mock data service)
- [ ] Add responsive breakpoints for tablet/mobile
- [ ] Add dark/light theme toggle
- [ ] Implement real authentication (Entra ID / MSAL)
- [ ] Add loading states and error boundaries to all pages
- [ ] Take screenshots for docs/README

### Medium Priority
- [ ] Extract inline styles to shared theme system (theme.ts is defined but not imported by pages)
- [ ] Add unit tests for page components
- [ ] Add E2E tests (Playwright or Cypress)
- [ ] Implement search/filter across all list views
- [ ] Add export functionality (CSV/PDF) for analytics and audit log
- [ ] Add notification system (toast/snackbar)

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
