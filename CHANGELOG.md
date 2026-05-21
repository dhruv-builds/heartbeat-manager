# Changelog

## v2.0 — 2026-05-21 (Current)
- **Migrated backend to Lovable Cloud** (managed Supabase). External instance deprecated.
- **Switched AI prompt generation from Perplexity to Lovable AI Gateway** (default model `google/gemini-3-flash-preview`). No external API key required.
- New landing page: kinetic scroll-driven design with Framer Motion (pinned scrollytelling, bento features, animated credit counter, magnetic CTA).
- Auth: managed Google OAuth + email/password with HIBP leaked-password protection enabled.
- Storage bucket `feature-images` re-provisioned with per-user RLS.
- Chrome extension bumped to `v2.0.0`. **Existing users will need to sign up fresh** — no data migration from the old backend.

## v1.0 — 2026-03-08 (Current)
- Persistent `is_merged` flag (database-backed merged status)
- New LovaLog SVG icon across extension and web
- Merge button always visible (no minimum task count)
- Updated footer copy
- Updated README with full feature documentation

## v0.5 — 2026-02-17
- Smart Load button (extension navigates tab, web opens new tab, hidden when URL matches)
- Background credit polling via chrome.alarms (5-min interval)
- Event-driven credit check on Lovable tab load
- Prompt submission sets credits to "unknown" with 3s delayed re-check
- Redesigned context button ("Add Context" CTA when empty, dot indicator when active)
- Web dashboard gains Load button and context CTA

## v0.4 — Initial Cloud Release
- Migrated from localStorage to Supabase (Auth, PostgreSQL, Storage)
- AI prompt generation via Perplexity API edge function
- Feature merging (select + combine multiple backlog items)
- Project context upload (.txt / .docx) for AI-enriched prompts
- One-click prompt injection into Lovable chat
- Image attachment support (screenshots/mockups)
- Dual auth: Google OAuth (extension) + email/password (web)
- Web dashboard at lovalog.lovable.app
- Landing page with marketing content

## v0.1 — Heartbeat MVP
- Chrome Extension side panel (Manifest V3)
- Project-aware backlog (auto-detects Lovable project from tab URL)
- Feature CRUD with drag-and-drop reordering
- Manual prompt writing and injection
- All data stored in localStorage
