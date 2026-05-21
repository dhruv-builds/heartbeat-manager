
# Plan: Kinetic Landing + Full Migration to Lovable Cloud

Two parallel tracks. Track 1 ships fast (visual). Track 2 is the bigger lift (backend cutover).

---

## Track 1 — Playful & Kinetic Landing Page

### Vision
Land the message in **3 seconds**: "LovaLog is a sidekick Chrome extension for Lovable that captures backlog ideas, writes prompts for you, and injects them straight into Lovable — so you stop wasting credits on vague prompts."

### Tech additions
- `framer-motion` (already implicit via shadcn? confirm — install if missing)
- `@react-three/fiber` only if we go 3D (we won't, keeping it lightweight)
- Native `IntersectionObserver` + Framer Motion's `useScroll`, `useTransform`, `useInView`

### Scroll narrative (sections, in order)

1. **Hero — Kinetic headline**
   - Animated text "Build better. Waste nothing." with per-word stagger
   - Floating extension UI mockup that tilts on mouse move (parallax)
   - Gradient mesh background that drifts slowly + reacts to scroll
   - Sticky scroll indicator

2. **"What is LovaLog?" — 3-step scrollytelling**
   - Pinned section. As user scrolls, 3 phases play out:
     - **Phase A:** A blank Lovable chat → idea bubble pops up → captured into LovaLog backlog (card flies into sidebar)
     - **Phase B:** Backlog card → "✨ Generate with AI" → prompt text types itself in
     - **Phase C:** Prompt card → injects into Lovable chat (slide animation across screen)
   - Uses Framer Motion `useScroll` with `scrollYProgress` driving each phase

3. **Pain points — Horizontal scroll carousel**
   - 3 pain cards that horizontally scroll-snap as user vertically scrolls (classic scroll-jack pattern)
   - Each card has a kinetic icon (flame flickers, brain pulses, clock ticks)

4. **Features grid — Bento layout w/ hover micro-interactions**
   - Replace current 2x2 grid with asymmetric bento (one big "AI Prompt Engineer" tile + smaller tiles)
   - Each tile has its own micro-animation on hover (sparkle trail, inject arrow shoots, credits counter ticks down)

5. **Live demo strip — Auto-playing extension UI**
   - Looping fake interaction: type → generate → inject. Built as Framer Motion sequence, no video file
   - Scrubs with scroll position

6. **Credit-saver counter**
   - "Stop wasting credits on vague prompts" with a counter animating from 47% → 12% wasted credits as user scrolls past
   - Uses `useMotionValue` + `animate`

7. **Final CTA — Magnetic button**
   - Button that subtly follows cursor when nearby
   - Confetti or sparkle burst on hover

### Performance guardrails
- All scroll animations behind `useReducedMotion()` check (respect OS prefs)
- `will-change` only during animation, removed after
- Lazy-load heavy sections below the fold
- Keep hero image, drop blob blur radius on mobile

### Files touched
- `src/pages/LandingPage.tsx` — restructure
- New: `src/components/landing/HeroKinetic.tsx`
- New: `src/components/landing/ScrollytellingHow.tsx`
- New: `src/components/landing/PainCarousel.tsx`
- New: `src/components/landing/BentoFeatures.tsx`
- New: `src/components/landing/DemoStrip.tsx`
- New: `src/components/landing/MagneticCTA.tsx`
- `package.json` — add `framer-motion` if missing

---

## Track 2 — Migrate External Supabase → Lovable Cloud + Switch AI

This is a full backend cutover. Doing it right means: stand up new backend in parallel, migrate data, swap clients, ship new extension version, then sunset old.

### Phase A — Provision Lovable Cloud schema

Lovable Cloud is already attached to this project (project ref `ycltllrtspdnyhtahhhv`) but unused — all real data lives in the external `sacnvqqjrrrzdkifsxyp`.

Apply migrations to Lovable Cloud recreating current schema:
- `profiles` (id, user_id, display_name, avatar_url)
- `projects` (lovable_project_id, lovable_project_url, context_content, context_file_name, context_updated_at, user_id)
- `features` (project_id, title, prompt, status enum [backlog|next|done], is_merged, order, image_url, user_id)
- `user_roles` + `app_role` enum + `has_role()` SECURITY DEFINER function
- Storage bucket `feature-images` (public) with RLS

All tables get RLS scoping rows to `auth.uid() = user_id`.

### Phase B — Data export & import

You (the user) export from current external Supabase:
1. Database: pg_dump or table-by-table CSV via Supabase dashboard
2. Storage: download `feature-images` bucket
3. Auth users: Supabase dashboard → Authentication → Users → export

I import into Lovable Cloud:
1. Run import migrations inserting data
2. Re-upload images to new `feature-images` bucket
3. **Auth users caveat:** Supabase doesn't expose password hashes to other instances. Options:
   - **Email users:** send password-reset emails so they set a new password on first login (recommended)
   - **Google OAuth users:** seamless — they re-auth with Google, same email = same identity
   - I'll create matching auth.users rows preserving UUIDs so foreign keys still resolve

### Phase C — Swap Supabase client

Replace hardcoded external credentials in `src/integrations/supabase/client.ts` with auto-managed Lovable Cloud env vars:

```text
URL  → import.meta.env.VITE_SUPABASE_URL
KEY  → import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY
```

Remove the hardcoded override (memory note `supabase-config-override` becomes obsolete and gets updated).

### Phase D — Switch AI from Perplexity → Lovable AI

Rewrite `supabase/functions/generate-feature-prompt/index.ts`:
- Drop `PERPLEXITY_API_KEY` dependency
- Use Lovable AI Gateway with `LOVABLE_API_KEY` (already provisioned)
- Default model: `google/gemini-3-flash-preview` (supports multimodal image input for screenshot references)
- Keep same input/output shape so `useGeneratePrompt.ts` needs no changes
- Handle 429 (rate limit) and 402 (credits exhausted) gracefully

After swap, the `PERPLEXITY_API_KEY` secret can be deleted.

### Phase E — Ship new Chrome extension version

- Bump `manifest.json` version (e.g., `1.0.0` → `2.0.0` — major because backend changes)
- Rebuild extension bundle pointing to new Lovable Cloud URL
- Update Google OAuth redirect URL in Google Cloud Console to new project's auth callback
- Re-package zip, upload to Chrome Web Store
- Users get auto-update within ~24h; first launch will require re-login

### Phase F — Sunset old Supabase

After 2-week dual-run window:
- Confirm zero traffic to old project
- Pause old Supabase project
- Update CHANGELOG.md with v2.0 migration entry

### Risks & open items
- **Google OAuth redirect:** new Lovable Cloud project = new callback URL; you'll need to add it to the Google Cloud OAuth client
- **Password reset flow:** email users will get reset emails — needs custom email template
- **Extension review:** Chrome Web Store may re-review (1-3 days)
- **Image URLs in DB:** old `feature_image` URLs point to old Supabase storage; need rewriting during import

### Order of operations (recommended)
```text
Week 1: Track 1 landing redesign (ship independently, no backend risk)
Week 2: Track 2 Phase A+D (Cloud schema + AI swap, both behind feature flag)
Week 3: Phase B (data migration) on a staging branch
Week 4: Phase C+E (client swap + extension release)
Week 6: Phase F (sunset)
```

---

## What I need from you to start

1. **Track 1:** Approve → I build the kinetic landing page immediately (no backend deps).
2. **Track 2:** Confirm you can do these things on your side when needed:
   - Export data from old Supabase
   - Add new OAuth redirect URL in Google Cloud Console
   - Upload new extension version to Chrome Web Store
3. Should I start with **Track 1 only** now and queue Track 2 for after, or run both in this session (Track 2 will need multiple back-and-forths for the data export step)?
