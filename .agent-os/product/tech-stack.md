# Technical Stack

## Core Technology Stack

- **application_framework:** Chrome Extension Manifest V3
- **database_system:** chrome.storage.local
- **javascript_framework:** React 18.x
- **import_strategy:** node
- **css_framework:** TailwindCSS 3.x
- **ui_component_library:** React + Headless UI
- **fonts_provider:** Google Fonts
- **icon_library:** Heroicons
- **application_hosting:** Chrome Web Store
- **database_hosting:** Local Chrome Storage API
- **asset_hosting:** Extension Bundle
- **deployment_solution:** Chrome Web Store Developer Dashboard
- **code_repository_url:** https://github.com/toos/resvi

## Development Tools

- **Build System:** Vite 5.x with @crxjs/vite-plugin
- **Language:** TypeScript 5.x
- **Package Manager:** npm
- **Testing Framework:** Playwright (E2E), Vitest (Unit)
- **Code Quality:** ESLint, Prettier
- **Version Control:** Git

## Chrome Extension Specific

- **Manifest Version:** V3
- **Background Script:** Service Worker
- **Content Scripts:** DOM manipulation and automation
- **Storage API:** chrome.storage.local for configuration persistence
- **Alarms API:** chrome.alarms for precise timing execution
- **Tabs API:** chrome.tabs for campaign URL management
- **Permissions:** activeTab, storage, alarms, scripting

## Architecture

- **Popup UI:** React-based configuration interface
- **Background Service:** Campaign scheduling and execution coordination
- **Content Scripts:** Zalando Lounge DOM automation and product interaction
- **Storage Layer:** Chrome local storage for user configurations and campaign history