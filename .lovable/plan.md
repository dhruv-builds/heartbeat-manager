
# Track 2 (Revised): Fresh Start on Lovable Cloud

No data export/import. Existing external Supabase project becomes deprecated; everyone signs up fresh on Lovable Cloud.

---

## Phase A — Provision Lovable Cloud schema

Apply a single migration to Lovable Cloud (`ycltllrtspdnyhtahhhv`) recreating the schema currently used in your external instance:

**Tables**
- `profiles` — user_id, display_name, avatar_url
- `projects` — user_id, name, lovable_project_id, lovable_project_url, context_content, context_file_name, context_updated_at
- `features` — project_id, user_id, title, prompt, status (enum: `backlog` | `next` | `done`), is_merged, order, image_url
- `user_roles` + `app_role` enum + `has_role()` SECURITY DEFINER (per Lovable security pattern)

**Storage**
- Bucket `feature-images` (public) with RLS allowing authenticated users to upload to their own folder

**Triggers**
- `update_updated_at_column()` on `profiles`, `projects`, `features`
- `handle_new_user()` trigger on `auth.users` → auto-creates a `profiles` row

**RLS**
- All tables scoped to `auth.uid() = user_id`

---

## Phase B — Switch AI from Perplexity → Lovable AI

Rewrite `supabase/functions/generate-feature-prompt/index.ts`:
- Drop `PERPLEXITY_API_KEY` dependency
- Call Lovable AI Gateway with `LOVABLE_API_KEY` (already provisioned)
- Model: `google/gemini-3-flash-preview` (multimodal — supports the screenshot/image reference flow)
- Preserve current response shape (`choices[0].message.content`) so `useGeneratePrompt.ts` keeps working without changes
- Surface 429 (rate limit) and 402 (credits exhausted) properly
- Add CORS via `npm:@supabase/supabase-js@2/cors`
- After deploy + verified, you can delete the `PERPLEXITY_API_KEY` secret

---

## Phase C — Swap Supabase client to Lovable Cloud

Replace hardcoded external credentials in `src/integrations/supabase/client.ts` with the auto-managed Lovable Cloud env vars:

```text
URL → import.meta.env.VITE_SUPABASE_URL
KEY → import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY
```

Remove the manual override comment. Update the `supabase-config-override` memory to reflect that we now use the managed instance.

Confirm `src/integrations/supabase/types.ts` regenerates automatically from the new schema (it does — it's auto-managed).

---

## Phase D — Authentication

Configure Lovable Cloud auth to mirror your existing setup:
- **Email/password** enabled (no auto-confirm — users verify their email)
- **Google OAuth** enabled via `configure_social_auth` (uses Lovable's managed Google OAuth — no Google Cloud Console setup needed for the web app)

**Chrome extension OAuth caveat:** the extension uses `chrome.identity.launchWebAuthFlow` with the `chrome.identity.getRedirectURL()` callback. With the new Lovable Cloud auth URL, this redirect must be added to the OAuth provider's allowed redirect list. Lovable Cloud's managed Google OAuth works out of the box for web; for the extension's specific redirect URL we'll need to verify after deploy and possibly fall back to a custom Google OAuth client. Will test post-deploy.

---

## Phase E — Update Chrome extension

- Bump `public/manifest.json` version to `2.0.0`
- Extension bundle picks up the new Supabase URL automatically from env at build time
- Verify `public/background.js` and `public/content.js` don't have any hardcoded URLs from old Supabase (audit during implementation)
- Repackage zip → you upload to Chrome Web Store

---

## Phase F — Sunset external Supabase

After verifying the new flow end-to-end:
- Update `README.md` + `CHANGELOG.md` with v2.0 entry
- You can pause/delete the old `sacnvqqjrrrzdkifsxyp` Supabase project on your own time

---

## Order of execution in this session

1. Run migration (Phase A) — I'll show the SQL for approval first
2. Swap Supabase client (Phase C)
3. Rewrite edge function (Phase B) + deploy
4. Configure auth (Phase D)
5. Bump extension manifest + audit hardcoded URLs (Phase E)
6. Update docs (Phase F)

You'll see one approval prompt for the migration, then everything else flows.

## Risks / open items

- **OAuth redirect for extension:** may need manual config after deploy if managed Google OAuth doesn't accept the chrome-extension:// callback. Will test and adjust.
- **First-time users only:** existing extension users will see "no projects" on first launch and need to recreate. Expected and acceptable since you said fresh start.
- **Edge function deploy:** Lovable handles automatically — no manual step.

Ready to execute. Approve to start.
