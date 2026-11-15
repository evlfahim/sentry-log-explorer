# sentry-log-explorer

> A modular, high-performance log explorer with a shared TypeScript core, delivering instant analysis of multi-gigabyte logs via a VS Code plugin, desktop app, and extensible API.

Task: Log file explorer for huge logs: fast open, filter by level and time, highlight patterns, follow mode, saved queries; later a VS Code plugin #plugin #desktop

## Why it is better than what exists
- Monolithic TUIs or heavy web apps that couple UI and logic, making reuse difficult
- Tools lacking saved queries or advanced pattern highlighting beyond basic grep
- Slow parsers that load entire files into memory, causing lag on huge logs
- Lack of a unified codebase for plugin and desktop targets, forcing duplication

## Features
- Byte-offset indexing for instant open of multi-GB files without full load
- Async filtering by log level, time range, and regex patterns
- Configurable pattern highlighting with color coding and regex groups
- Follow mode with auto-scroll, pause, and tail-fallback
- Saved queries with JSON import/export and recent history
- Virtual scrolling UI for smooth rendering of large datasets
- Shared core library enabling VS Code, Desktop, and CLI wrappers

## Stack
TypeScript, Node.js, React, Tauri, VS Code Extension API

## Becoming a plugin
Core library exports a clean API; VS Code extension consumes core via Webview, sharing 95% of logic with Desktop app via monorepo.

## Steps
- [x] 1. Initialize monorepo structure with core, UI, desktop, and plugin packages. `mkdir -p packages/{core,ui,desktop,plugin} && npm init -y`
- [x] 2. Implement file indexer using `fs.createReadStream` and byte-offset caching for instant open. `cd packages/core && npm test -- --grep "indexer"`
- [x] 3. Add log parser to extract levels and timestamps from raw lines. `cd packages/core && npm test -- --grep "parser"`
- [x] 4. Build filter engine supporting level, time range, and regex matching. `cd packages/core && npm test -- --grep "filter"`
- [x] 5. Implement pattern highlighter with configurable regex groups and colors. `cd packages/core && npm test -- --grep "highlight"`
- [x] 6. Develop follow mode logic with tail-fallback and pause state. `cd packages/core && npm test -- --grep "follow"`
- [x] 7. Create saved queries manager with JSON persistence and history. `cd packages/core && npm test -- --grep "queries"`
- [x] 8. Build React UI shell with virtual scrolling and core integration. `cd packages/ui && npm run dev && curl -s localhost:5173 | grep -q "div"`
- [ ] 9. Add file open dialog and log list rendering. `cd packages/ui && npm run test -- --grep "open-file"`
- [ ] 10. Implement filter bar with level toggles and time picker. `cd packages/ui && npm run test -- --grep "filters"`
- [ ] 11. Integrate pattern highlighter into log rows. `cd packages/ui && npm run test -- --grep "highlight-ui"`
- [ ] 12. Add saved queries panel with load and export actions. `cd packages/ui && npm run test -- --grep "queries-ui"`
- [ ] 13. Wire follow mode toggle and auto-scroll behavior. `cd packages/ui && npm run test -- --grep "follow-ui"`
- [ ] 14. Wrap UI in Tauri for standalone desktop application. `cd packages/desktop && npm run tauri dev && pgrep -f tauri`
- [ ] 15. Configure VS Code extension manifest and Webview bridge. `cd packages/plugin && npm run package && ls -l *.vsix`
- [ ] 16. Write README with run instructions and plugin integration guide. `cat README.md | grep -q "VS Code" && cat README.md | grep -q "npm run"`
