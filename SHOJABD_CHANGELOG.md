# ShojaBD Changelog & Operational Status

_Last updated: 2026-02-24 (Asia/Dhaka)_

## 1) Platform + Infrastructure

- Cloudflare Worker deployed at: `https://shojabd.dalalocd.workers.dev`
- Domain/site in active iteration: `shojabd.com`
- Core Worker APIs added for lead gate and order workflow.

## 2) Lead Intake + Qualification

### Implemented
- Form-first lead flow on website (instead of raw WhatsApp entry).
- Structured lead fields (name, phone, company, service, budget, timeline, area, time, notes).
- Backend-issued signed lead reference: `Ref: SHJ-...`
- Verification endpoint:
  - `POST/GET /api/lead/verify`
- Lead creation endpoint:
  - `POST /api/lead/create`

### Behavior
- Valid `Ref: SHJ-...` => qualified handling.
- Missing/invalid ref => short form-completion redirect response.

## 3) WhatsApp Channel

### Implemented
- WhatsApp channel reset and relinked.
- Pairing/approval issues resolved during setup.
- ShojaBD payment flow policy saved:
  - bKash number: `01313399918`
  - Manual confirmation by Saad before marking payment received.

### Operational rule
- EN/BN support enabled for client communication.
- Service tone policy: polite, clear, fast.

## 4) Website UX + Branding

### Implemented
- CTA simplification: removed extra form-entry buttons.
- Retained clean single booking flow from homepage.
- Mobile optimization pass #1 and #2:
  - responsive header/navigation
  - mobile-friendly form fields
  - progress indicator
  - quick service selection chips
- Logo assets created and deployed:
  - wordmark + WhatsApp DP versions
  - PNG and SVG variants
- Header logo integrated (duplicate hero logo removed)
- Favicon set

## 5) Analytics + SEO

### Implemented
- GA4 integrated with Measurement ID: `G-NE0FQY6KBB`
- Search Console linked to GA4
- SEO foundations added:
  - canonical tags
  - OG/Twitter metadata
  - LocalBusiness schema
  - `robots.txt`
  - `sitemap.xml`
- Event instrumentation added:
  - `view_page`
  - `click_whatsapp_cta`
  - `lead_form_started`
  - `lead_form_submitted`
  - `lead_submit_error`
  - `whatsapp_opened_with_ref`

## 6) Facebook + Outreach Setup

### Implemented
- Browser Relay issues diagnosed/fixed.
- ShojaBD Facebook Page created and configured.
- Page connected to WhatsApp number.
- Business Suite tab attached and available.

### Approved outreach policy
- Provider onboarding model: per-qualified-lead (Model A)
- Intro incentive: first referral/lead free
- Daily outreach execution approved with controlled cadence

## 7) Order Portal + Billing Workflow (Supabase-backed)

### Supabase
- Project created and SQL schema/function blocks executed successfully.
- Workflow test passed with receipt generation.

### Worker APIs implemented
- `POST /api/orders/create`
- `POST /api/orders/provider-done`
- `POST /api/orders/client-confirm`
- `POST /api/orders/payment-confirm`
- `POST /api/orders/status`
- `GET /o/:token` (tokenized client/provider action portal)

### Current logic
- Provider submits itemized completion
- Client confirms completion
- Invoice issued
- Dual payment confirmation required (client + provider)
- Receipt issued after dual confirmation

## 8) Remaining In-Progress Work

1. Branded invoice/receipt document rendering (production format)
2. End-to-end WhatsApp message automation on each workflow state change
3. Provider outreach tracking ledger population from Facebook activities
4. Security hardening follow-up: rotate exposed Cloudflare/Supabase keys

## 10) 2026-02-26 — Dual Funnel + Websites Phase 2

### Implemented
- Added second vertical on ShojaBD for website building:
  - New page: `websites.html`
  - Homepage split CTA now routes to either home services or website requests
- Added separate websites lead intake flow:
  - `POST /api/websites/lead-create`
  - New lead reference prefix: `WEB-...`
- Updated websites package section with clearer offer stack and pricing anchors.
- Business package now explicitly includes **e-commerce / online shopping setup**.
- Added websites process section (Submit brief → Get proposal → Launch fast).

### Impact
- ShojaBD now supports two monetization tracks under one brand:
  1) Home services lead routing
  2) Small business website builds
- Clearer package positioning should improve conversion and sales conversations.

## 9) Operational Notes

- Daily Telegram ShojaBD performance report cron configured (morning, Asia/Dhaka).
- Communication language rule updated:
  - Bangla messages should remain Bangla (no unnecessary mixed terms).

---

## Update Protocol (for autonomous maintenance)

For every meaningful ShojaBD change, append:
- Date/time
- What changed
- Why it changed
- Impact
- Next action

This file is the single running operational log for ShojaBD execution.
