# Sentry Log Explorer

A modular, high-performance log explorer with a shared TypeScript core, delivering instant analysis of multi-gigabyte logs via a VS Code extension, desktop app, and extensible API.

## Features

- **Byte-offset indexing** for instant open of multi-GB files without full load
- **Async filtering** by log level, time range, and regex patterns
- **Configurable pattern highlighting** with color coding and regex groups
- **Follow mode** with auto-scroll, pause, and tail-fallback
- **Saved queries** with JSON import/export and recent history
- **Virtual scrolling UI** for smooth rendering of large datasets
- **Shared core library** enabling VS Code, Desktop, and CLI wrappers

## Architecture

```
sentry-log-explorer/
├── packages/
│   ├── core/          # Shared TypeScript library (indexer, parser, filter, highlighter, follow, queries)
│   ├── ui/            # React UI shell with virtual scrolling
│   ├── desktop/       # Tauri-based standalone desktop application
│   └── plugin/        # VS Code extension with Webview bridge
├── package.json       # Root monorepo manifest (npm workspaces)
└── README.md
```

## Prerequisites

- **Node.js** 22+ and **npm** 9+
- **Rust** (for desktop build) — install via [rustup](https://rustup.rs/)
- **Tauri CLI** — `npm install -g @tauri-apps/cli` (or use npx)
- **VS Code** 1.85+ (for the extension)

## Quick Start

### 1. Install dependencies

```bash
npm install
```

### 2. Run the UI in development mode

```bash
cd packages/ui
npm run dev
```

The React dev server starts on `http://localhost:5173`. Open it in a browser to use the log explorer interactively.

### 3. Build the UI

```bash
cd packages/ui
npm run build
```

### 4. Run tests

```bash
# Run all tests across every package
npm test

# Run core library tests (Jest)
cd packages/core
npm test

# Run UI tests (Vitest)
cd packages/ui
npm test
```

### 5. Build the core library

```bash
cd packages/core
npm run build
```

This compiles TypeScript to `packages/core/dist/`.

## Desktop App (Tauri)

The desktop app wraps the UI in a Tauri container for a standalone native application.

### Run in development mode

```bash
cd packages/desktop
npm run tauri:dev
```

This launches the Vite dev server and opens the Tauri window. The app binary runs on a display server; headless environments will fail GTK initialization (expected).

### Build the desktop app

```bash
cd packages/desktop
npm run tauri:build
```

The built binary is placed in `packages/desktop/src-tauri/target/release/`.

### Generate an app icon

```bash
cd packages/desktop
npm run tauri:icon
```

## VS Code Extension

The VS Code extension provides a log explorer panel via a Webview, sharing 95% of logic with the desktop app.

### Install the extension locally

```bash
cd packages/plugin
npm install
npm run compile
npm run package
```

This produces `packages/plugin/sentry-log-explorer-1.0.0.vsix`.

### Load the extension in VS Code

1. Open VS Code.
2. Press `Ctrl+Shift+P` (or `Cmd+Shift+P` on macOS).
3. Type **"Extensions: Install from VSIX…"**.
4. Select `packages/plugin/sentry-log-explorer-1.0.0.vsix`.

### Use the extension

- Press `Ctrl+Shift+P` → **"Sentry Log Explorer: Open Log Explorer"** to open the explorer panel.
- Click **"Open File"** in the panel to load a log file.
- Use the **filter bar** to filter by log level, time range, and regex patterns.
- Toggle **follow mode** for auto-scroll to the latest lines.
- Manage **saved queries** via the saved queries panel (save, load, export, import, delete).

### Extension commands

| Command | Description |
|---|---|
| `sentry-log-explorer.open` | Open the Log Explorer panel |

### Extension settings

| Setting | Type | Default | Description |
|---|---|---|---|
| `sentryLogExplorer.followMode` | boolean | `false` | Enable follow mode (auto-scroll to latest lines) |
| `sentryLogExplorer.highlightPatterns` | array | See below | Regex patterns for highlighting log lines |

**Default highlight patterns:**

```json
[
  { "pattern": "ERROR|FATAL|CRITICAL", "color": "#ff0000", "fontWeight": "bold" },
  { "pattern": "WARN|WARNING",        "color": "#ff8800", "fontWeight": "bold" },
  { "pattern": "INFO",                 "color": "#00aa00" },
  { "pattern": "DEBUG|TRACE",          "color": "#888888" }
]
```

### Extension Webview bridge

The extension communicates with the Webview UI via message passing:

**Extension → Webview:**

| Message Type | Payload | Description |
|---|---|---|
| `fileLoaded` | `{ content, fileName }` | Send file content to the UI |
| `querySaved` | `{ query }` | Notify that a query was saved |
| `queriesLoaded` | `{ queries }` | Send saved queries on panel open |
| `queriesExported` | `{ path }` | Notify export completed |
| `queriesImported` | `{ queries }` | Notify import completed |
| `queryDeleted` | `{ queryId }` | Notify a query was deleted |

**Webview → Extension:**

| Message Type | Payload | Description |
|---|---|---|
| `openFile` | `{}` | Open a file picker dialog |
| `openFileFromActive` | `{}` | Open the currently active editor as a log file |
| `saveQuery` | `{ query }` | Save a query to workspace state |
| `loadQueries` | `{}` | Load saved queries from workspace state |
| `exportQueries` | `{}` | Export queries to a JSON file |
| `importQueries` | `{}` | Import queries from a JSON file |
| `deleteQuery` | `{ queryId }` | Delete a saved query |
| `updateHighlightPatterns` | `{ patterns }` | Update highlight patterns in workspace state |

## Core Library API

The `core` package exports a clean API for programmatic log analysis.

### FileIndexer

```typescript
import { FileIndexer } from 'core';

const indexer = new FileIndexer();
const stats = await indexer.index('path/to/large.log');
const lines = indexer.getLines(0, 100); // byte-range query
```

### LogParser

```typescript
import { LogParser, LogLevel } from 'core';

const parser = new LogParser();
const parsed = parser.parseLine('2024-01-15 10:30:00 ERROR Something failed', 1);

const filtered = parser.filterByLevel(parsedLines, LogLevel.ERROR);
const timeFiltered = parser.filterByTimeRange(parsedLines, new Date('2024-01-01'), new Date('2024-01-31'));
const patternFiltered = parser.filterByPattern(parsedLines, /error|fail/i);
```

### PatternHighlighter

```typescript
import { PatternHighlighter, DEFAULT_HIGHLIGHT_PATTERNS } from 'core';

const highlighter = new PatternHighlighter(DEFAULT_HIGHLIGHT_PATTERNS);
const highlighted = highlighter.highlight('ERROR: something broke');
// Returns { segments: [{ text, color, fontWeight, ... }], matched: true }
```

### FollowMode

```typescript
import { FollowMode } from 'core';

const follow = new FollowMode({
  onNewLine: (line) => console.log(line),
  onPaused: () => console.log('paused'),
  onResumed: () => console.log('resumed'),
});

follow.start();
follow.pause();
follow.resume();
follow.stop();
```

### SavedQueriesManager

```typescript
import { SavedQueriesManager } from 'core';

const manager = new SavedQueriesManager({ storagePath: '/tmp/queries.json' });
await manager.saveQuery({ name: 'Errors only', filterLevel: 'ERROR' });
const queries = await manager.getQueries();
await manager.exportQueries('queries.json');
await manager.importQueries('queries.json');
```

## Project Structure

| Package | Description |
|---|---|
| `packages/core` | Shared TypeScript library — indexer, parser, filter engine, highlighter, follow mode, saved queries |
| `packages/ui` | React UI shell — FileOpenDialog, LogList, FilterBar, FollowModeToggle, SavedQueriesPanel |
| `packages/desktop` | Tauri desktop app — wraps the UI in a native container |
| `packages/plugin` | VS Code extension — Webview bridge, command registration, workspace state management |

## License

ISC
