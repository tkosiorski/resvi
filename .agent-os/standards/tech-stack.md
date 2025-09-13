# Tech Stack

## Context

Global tech stack defaults for Agent OS projects, overridable in project-specific `.agent-os/product/tech-stack.md`.

- Extension Framework: Chrome Extension Manifest V3
    - Language: TypeScript 5.0+
    - UI Framework: React 18+ (Popup/Options)
    - Build Tool: Vite 5.0+
    - Bundler Plugin: @crxjs/vite-plugin
    - Package Manager: npm
    - Node Version: 22 LTS
    - CSS Framework: TailwindCSS 4.0+
    - UI Components: Headless UI (lightweight for extension)
    - Icons: Lucide React components
    - Storage: chrome.storage.local API
    - Background: Service Worker (Manifest V3)
    - Content Script: Vanilla TypeScript + DOM manipulation
    - Timing: chrome.alarms API + performance.now()
    - Development: Chrome Developer Mode
    - Testing: Playwright (E2E automation testing)
    - Build Target: Chrome Extension (.crx)
    - Distribution: Chrome Web Store (future)
    - Version Control: Git
    - CI/CD: GitHub Actions (extension build/test)
    - Performance: Native DOM access, no external dependencies
