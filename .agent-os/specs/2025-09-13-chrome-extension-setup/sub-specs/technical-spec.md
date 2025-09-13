# Technical Specification

This is the technical specification for the spec detailed in @.agent-os/specs/2025-09-13-chrome-extension-setup/spec.md

## Technical Requirements

### Project Structure
- Root-level configuration files: package.json, tsconfig.json, tailwind.config.js, vite.config.ts, .eslintrc.js, .prettierrc
- `src/` directory containing components/, pages/, background/, and content-scripts/ subdirectories
- `public/` directory for static assets and icons
- `dist/` directory for build output (git-ignored)

### Vite Configuration
- @crxjs/vite-plugin configured for Chrome Extension Manifest V3 hot reload support
- TypeScript plugin for .ts/.tsx file compilation
- PostCSS plugin for TailwindCSS processing
- Build target set to ES2020 for modern Chrome compatibility
- Dev server configured for extension development with proper CORS handling

### Chrome Extension Manifest V3
- manifest.json in root directory with version "3"
- Required permissions: "storage", "alarms", "scripting", "activeTab"
- Background service worker script declaration pointing to src/background/index.ts
- Popup action pointing to src/pages/popup/index.html
- Content security policy compatible with React and TailwindCSS

### TypeScript Configuration
- Strict mode enabled with proper Chrome extension API types (@types/chrome)
- JSX support configured for React 18.x
- Module resolution set to "node" for proper package imports
- Path mapping for clean relative imports from src/

### React Setup
- React 18.x with ReactDOM for popup interface rendering
- Entry point at src/pages/popup/index.tsx with proper HTML mount point
- Background script entry at src/background/index.ts for service worker
- Separate build outputs for popup, background, and content scripts

### TailwindCSS Configuration
- Tailwind configured to scan all TypeScript and React files in src/
- PostCSS integration for Vite processing
- Content security policy compatible utilities and no inline styles
- Base styles imported in popup CSS entry point

### Code Quality Tools
- ESLint configured for React, TypeScript, and Chrome extension development
- Prettier configured for consistent formatting with 2-space indentation
- Pre-commit hooks not included in initial setup
- Editor configuration for consistent development experience

### Git Configuration
- .gitignore excluding node_modules/, dist/, .env files, and OS-specific files
- .agent-os/ directory explicitly included for GitHub tracking
- Build artifacts and dependency directories properly excluded
- Development environment files (.vscode/, .idea/) excluded but not forced

## External Dependencies

- **@crxjs/vite-plugin** - Chrome extension development integration for Vite
  - **Justification:** Essential for hot reload and proper Manifest V3 build handling
- **@types/chrome** - TypeScript definitions for Chrome extension APIs
  - **Justification:** Required for type safety when using chrome.storage, chrome.alarms APIs
- **react** and **react-dom** - UI framework for popup interface
  - **Justification:** Specified in tech stack for modern component-based UI development
- **tailwindcss** - Utility-first CSS framework
  - **Justification:** Specified in tech stack for rapid UI styling and development
- **typescript** - Static type checking and compilation
  - **Justification:** Specified in tech stack for code quality and Chrome extension API safety
- **vite** - Build tool and development server
  - **Justification:** Specified in tech stack for fast development and hot reload support