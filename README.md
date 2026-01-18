**Heartbeat ❤️**

**The Product Management Sidebar for Lovable Builders.**

Heartbeat is a Chrome Extension designed to bridge the gap between planning features and building them in Lovable. It allows you to manage a sequential backlog of feature prompts ("Pulses") and inject them directly into the Lovable chat interface with a single click.

        Status: MVP / V1 (Local Mode)
        Stack: React, Vite, Shadcn UI, Chrome Side Panel API

**🚀 Key Features**

1. Context-Aware Backlog
Heartbeat automatically detects which Lovable project you are working on (e.g., "Daily Compass") and switches to the corresponding backlog. No manual context switching required.

2. The "Pulse" Workflow
Instead of managing prompts in disjointed Notion docs or Google Sheets:

Create Features: Define a feature title and its detailed prompt spec ("Pulse").

Inject: Click the Inject button to teleport the prompt directly into the Lovable chat input.

Auto-Focus: The chat input is automatically focused, letting you hit Enter immediately to start the build.

3. Responsive Dashboard
Sidebar Mode: A compact, drag-and-drop list that sits alongside your builder.

Dashboard Mode: Open the extension in full-screen (Desktop) for a master-detail view to draft complex prompts comfortably.

4. Local Privacy
All data is stored in your browser's localStorage. No external databases, no cloud sync (yet). Your ideas stay on your machine.

**🛠 Installation (Developer Mode)**

Since this is a private tool, you install it as an "Unpacked Extension":

Clone or Download this repository.

Install Dependencies:

          npm install
  
Build the Extension:

          npm run build
  
This will create a dist/ folder.

Load into Chrome:

Go to chrome://extensions

Enable Developer Mode (top right toggle).

Click Load Unpacked.

Select the dist folder from this project.

**📖 How to Use**

Open your project in Lovable.dev.

Click the Heartbeat icon in your Chrome toolbar (or open the Side Panel).

Accept the Prompt: "New Project Detected: [Your App Name]".

Add a Feature: Type a name (e.g., "User Auth") and the Prompt Spec.

Build: When ready, click the Inject button (arrow icon) on the card.

**🏗 Project Structure**

/src: React application logic (Sidebar UI, Context Providers).

/public: Chrome-specific assets (manifest.json, content.js, icons).

content.js: The bridge script that reads the Lovable project name and handles text injection.

