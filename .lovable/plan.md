

# Updated README for LovaLog

Since this is a content/documentation task rather than a code implementation task, here is the full proposed `README.md`. Once approved, I'll update the file in the repo.

---

```markdown
# LovaLog

**The Backlog Manager for Lovable Builders.**

LovaLog is a Chrome Extension + Web App that helps you plan, write, and inject feature prompts directly into [Lovable](https://lovable.dev). Manage a per-project backlog of features, generate AI-powered prompts, and build faster — all from a side panel that sits right next to your builder.

> **Status:** V1 (Cloud-synced)
> **Stack:** React · Vite · TypeScript · Tailwind CSS · Shadcn UI · Supabase · Chrome Side Panel API

---

## Key Features

### 🔗 Project-Aware Backlog
LovaLog automatically detects which Lovable project you're working on by reading the browser tab URL. It switches to the matching backlog instantly — no manual context switching.

### 💉 One-Click Prompt Injection *(Extension only)*
Click **Inject** to teleport a prompt directly into Lovable's chat input. The chat field is auto-focused so you can hit Enter immediately. For prompts with attached images, a split button lets you inject **Prompt Only** or **Prompt & Image** (copies the image to your clipboard).

### 🤖 AI Prompt Generation
Turn a feature title into a detailed, code-ready prompt with one click. LovaLog scrapes your current page context, factors in your project context file, and generates a structured implementation prompt. Attach screenshots or mockups for visual-aware prompts.

### 🔀 Feature Merging
Select multiple backlog items and merge them into a single combined feature. The merged prompt aggregates all selected items, and the originals are marked as merged for traceability.

### 📋 Project Context
Paste or upload a project context document (`.txt` or `.docx`) that LovaLog feeds into every AI prompt generation. This ensures prompts are always aware of your app's architecture, decisions, and current state.

### 📊 Credit Monitor *(Extension only)*
A toolbar badge shows your real-time Lovable credit status. Background polling checks every 5 minutes so you never miss expiring daily credits.

### 🖥️ Dual-Mode Interface
- **Side Panel** (Extension): A compact, drag-and-drop backlog that sits alongside your Lovable builder.
- **Web Dashboard** ([lovalog.lovable.app](https://lovalog.lovable.app)): A full-screen master-detail view for drafting complex prompts comfortably.

### ☁️ Cloud Sync
All data (projects, features, context) is stored in Supabase and synced across devices. Sign in with your account and pick up where you left off.

---

## Installation

### Chrome Extension (Developer Mode)

1. **Clone** the repository:
   ```bash
   git clone https://github.com/your-org/lovalog.git
   cd lovalog
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Build:**
   ```bash
   npm run build
   ```

4. **Load into Chrome:**
   - Navigate to `chrome://extensions`
   - Enable **Developer Mode** (top-right toggle)
   - Click **Load Unpacked**
   - Select the `dist` folder

### Web App

Visit [lovalog.lovable.app](https://lovalog.lovable.app) — no installation needed.

---

## How to Use

1. Open your project on [lovable.dev](https://lovable.dev).
2. Click the **LovaLog** icon in your Chrome toolbar to open the side panel.
3. If a new Lovable project is detected, LovaLog will offer to create a matching backlog project automatically.
4. **Add a feature** — type a title and press Enter.
5. **Write or generate a prompt** — open the feature detail sheet to write your own prompt, paste a screenshot, or click **Generate with AI**.
6. **Inject** — click the Inject button to send the prompt straight into Lovable's chat.

---

## Project Structure

```
src/
├── components/
│   ├── heartbeat/       # Core UI: FeatureList, FeatureItem, FeatureDetailSheet,
│   │                    #   ProjectSelector, ProjectContextSheet, Header, etc.
│   ├── auth/            # AuthProvider, ProtectedRoute
│   └── ui/              # Shadcn UI primitives
├── hooks/
│   ├── useProjects.ts   # CRUD for projects & features (Supabase)
│   ├── useChromeMessaging.ts  # Extension ↔ content script bridge
│   ├── useCredits.ts    # Credit monitoring
│   ├── useGeneratePrompt.ts   # AI prompt generation
│   └── useImageUpload.ts      # Image attachment handling
├── pages/
│   ├── Dashboard.tsx    # Main app view
│   ├── Auth.tsx         # Login / signup
│   └── LandingPage.tsx  # Marketing page (web only)
├── types/
│   └── heartbeat.ts     # Core type definitions
└── lib/
    └── featureSorting.ts # Sort logic for active/completed features

public/
├── manifest.json        # Chrome Extension manifest (MV3)
├── background.js        # Service worker (side panel trigger, credit polling)
├── content.js           # Content script (project detection, prompt injection)
└── lovalog-icon.svg     # App icon

supabase/
└── functions/
    └── generate-feature-prompt/  # Edge function for AI prompt generation
```

---

## Feature Workflow

| Status    | Meaning |
|-----------|---------|
| **Next**  | The feature you're building right now (first feature defaults to this) |
| **Backlog** | Queued for later |
| **Done**  | Completed / shipped |

Features support drag-and-drop reordering, duplication, and deletion. Merged features are visually tagged with a merge icon.

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 18, TypeScript, Vite |
| UI | Tailwind CSS, Shadcn UI, Radix Primitives |
| Drag & Drop | @hello-pangea/dnd |
| Backend | Supabase (Auth, PostgreSQL, Edge Functions) |
| AI | Perplexity API (via Edge Function) |
| Extension | Chrome Manifest V3, Side Panel API |

---

## Development

```bash
# Start dev server
npm run dev

# Build for production / extension
npm run build

# Run tests
npm test
```

In development mode (outside the extension), LovaLog runs as a standard web app. Extension-only features (injection, credit monitoring) gracefully degrade — injection falls back to clipboard copy, credits show mock data.

---

## License

Private project. All rights reserved.
```

---

**What this covers vs. the old README:**
- Rebranded from "Heartbeat" to "LovaLog" throughout
- Added all current features: AI prompt generation, feature merging, project context (paste + upload), credit monitoring, cloud sync
- Updated status from "MVP / Local Mode" to "V1 (Cloud-synced)"
- Added web app URL and dual-mode description
- Updated project structure to reflect current codebase
- Added feature workflow table (Next/Backlog/Done statuses)
- Added tech stack table
- Added development section with graceful degradation notes
- Removed outdated "Local Privacy" section (now cloud-synced)

