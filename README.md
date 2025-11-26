# Cloud-Based IDE & Compiler (VS Code Clone)

## 1. Project Vision
**Goal:** Build a comprehensive web-based Integrated Development Environment (IDE) that mirrors the local development experience. Users should be able to write, edit, compile, and execute code in the cloud with results displayed instantly, similar to Programiz but with the feature richness of VS Code.

## 2. Core Architecture
* **Platform:** Web-based with Electron capabilities (Local Fallback).
* **Editor Engine:** Monaco Editor (implied by "VS Code-like" and "Monaco" context).
* **Execution Engine:** * **Primary:** Piston API (Cloud execution).
    * **Secondary:** Local execution fallback (for offline or local-only runs).
* **Database:** Firebase Firestore (User profiles, settings, projects).
* **Authentication:** Firebase Auth (Email/Pass, Google, GitHub).

---

## 3. Feature Specifications

### 3.1 Authentication & User Profiles
* **Sign Up/Login:** Support for Email/Password credential flow.
* **Social Auth:** Integration with Google and GitHub providers.
* **User Profiles:** * Customizable profile page.
    * Syncing of saved projects and settings across devices.
    * Global settings controlled directly from the user profile.

### 3.2 Editor Interface & UX
* **Visual Style:** * Modern, minimal interface with resizable split-view panels.
    * Top navigation bar (minimal design).
    * **Theming:** * Native Dark/Light mode toggle on the top bar.
        * Advanced theme support (Solarized, Monokai, etc.) saved to user preferences.
        * High-contrast light mode optimization (foreground/background/accent tuning).
    * **Responsiveness:** Fully responsive UI for various screen sizes.
* **Window Controls:** Full-screen button on the top bar.

### 3.3 Coding Experience (IntelliSense)
* **Syntax Highlighting:** Integrated via libraries (Prism.js/Highlight.js) or Monaco native.
* **IntelliSense:** * VS Code-style auto-completion and code suggestions.
    * On-hover documentation for functions, variables, and types.
    * Real-time error markers (linting) and diagnostics (ESLint integration).
* **Productivity Tools:**
    * **Command Palette:** `Ctrl+Shift+P` menu for quick actions (Format, Run, File Sync).
    * **Code Snippets:** Shortcuts for common blocks (e.g., `console.log`, `print`).
    * **Bracket Logic:** Auto-completion and pair colorization for brackets.
    * **Multi-Cursor:** Support for simultaneous editing at multiple locations.

### 3.4 File System & Project Management
* **Explorer:** Sidebar file tree supporting folders, subfolders, and CRUD operations.
* **File Operations:** Create, Rename, Duplicate, Delete.
* **Supported Types:** Standard languages plus `.gitignore`, `Dockerfile`, `README.md`.
* **Project Dashboard:** * View all saved projects.
    * Search and filter projects by name, language, or date.
    * **Import/Export:** Export projects as `.zip` files.

### 3.5 Code Execution & Runtime
* **Run Controls:** * Prominent "RUN" button with keyboard shortcut.
    * Input box for runtime user arguments (stdin).
* **Output Console:** * Display stdout, stderr, and stack traces clearly.
    * Show execution time and memory usage metrics.
    * Console history for past outputs.
* **Execution Logic:** * Use **Piston API** for multi-language support.
    * Implement **Local Fallback** logic if the API fails or for local-only execution.
    * *Constraint:* No dependence on Gemini services for code execution results.

### 3.6 Collaboration & Sharing
* **Sharing:** * Generate unique public links for specific files or entire projects.
    * Options for Read-Only vs. Editable access.
* **Real-Time Collab:** Live cursor tracking and in-editor chat for active collaborators.

### 3.7 Plugins & Extensions
* **Marketplace:** Functional plugin system mimicking the VS Code Marketplace.
* **Management:** Install/Uninstall plugins.
* **Settings Sync:** Save plugin configurations to the database; option to export settings.

### 3.8 Admin & Analytics
* **Dashboard:** Admin view for user management and platform monitoring.
* **Metrics:** Track run requests, project counts, and language popularity.

---

## 4. Current Task List (Backlog)

### 🔴 High Priority / Bugs
1.  **Cursor Fix:** Resolve mismatch/misplacement of cursor execution point, especially after snippet insertion.
2.  **Firebase Error:** Fix `Uncaught TypeError` related to module specifiers (`@/services/firebaseService`).
3.  **Error Handling:** Improve feedback for Piston API failures or local runtime errors (show specific causes/suggestions).

### 🟡 Enhancement Requests
1.  **Button Functionality:** Ensure Edit, Duplicate, and "+" buttons function exactly like VS Code.
2.  **Plugin Expansion:** Fix placeholder plugins; ensure full list is visible/installable.
3.  **Default State:** Start new projects with a single `main` file.
4.  **Notifications:** Add "Cloud Save" toast notification at the bottom right.
5.  **Multi-Terminal:** Support for multiple terminal instances.

---

## 5. Storage Strategy
* **Primary:** Firestore (Cloud storage for code/settings).
* **Local:** `localStorage` (Session caching and offline capability).