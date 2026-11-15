import * as vscode from 'vscode';
import * as path from 'path';
import * as fs from 'fs';

/**
 * Sentry Log Explorer - VS Code Extension
 *
 * Provides a log file explorer with filtering, highlighting, and follow mode
 * via a VS Code webview panel.
 */

let panel: vscode.WebviewPanel | undefined;
let disposable: vscode.Disposable | undefined;

export function activate(context: vscode.ExtensionContext) {
  disposable = vscode.commands.registerCommand(
    'sentry-log-explorer.open',
    async () => {
      await openLogExplorer(context);
    }
  );
  context.subscriptions.push(disposable);
}

export function deactivate() {
  if (disposable) {
    disposable.dispose();
  }
}

async function openLogExplorer(context: vscode.ExtensionContext) {
  // If panel already exists, show it
  if (panel) {
    panel.reveal(vscode.ViewColumn.Two);
    return;
  }

  panel = vscode.window.createWebviewPanel(
    'sentryLogExplorer',
    'Sentry Log Explorer',
    vscode.ViewColumn.Two,
    {
      enableScripts: true,
      retainContextWhenHidden: true,
    }
  );

  // Set the HTML content for the webview
  panel.webview.html = getWebviewContent(context);

  // Handle messages from the webview
  panel.webview.onDidReceiveMessage(
    async (message) => {
      switch (message.type) {
        case 'openFile': {
          const result = await vscode.window.showOpenDialog({
            canSelectFiles: true,
            canSelectFolders: false,
            canSelectMany: false,
            filters: {
              'Log files': ['log', 'txt', 'out', 'log.txt', 'log.out'],
              'All files': ['*'],
            },
          });
          if (result && result.length > 0) {
            const fileUri = result[0];
            const content = fs.readFileSync(fileUri.fsPath, 'utf-8');
            const fileName = path.basename(fileUri.fsPath);
            panel?.webview.postMessage({
              type: 'fileLoaded',
              content,
              fileName,
            });
          }
          break;
        }

        case 'openFileFromActive': {
          // Open the currently active text document as a log file
          const activeDoc = vscode.window.activeTextEditor?.document;
          if (activeDoc) {
            const content = activeDoc.getText();
            const fileName = path.basename(activeDoc.uri.fsPath);
            panel?.webview.postMessage({
              type: 'fileLoaded',
              content,
              fileName,
            });
          }
          break;
        }

        case 'saveQuery': {
          // Save a query to the workspace state
          if (context.workspaceState) {
            const queries = context.workspaceState.get<SavedQuery[]>('savedQueries', []);
            queries.push(message.query);
            await context.workspaceState.update('savedQueries', queries);
            panel?.webview.postMessage({
              type: 'querySaved',
              query: message.query,
            });
          }
          break;
        }

        case 'loadQueries': {
          // Load saved queries from workspace state
          if (context.workspaceState) {
            const queries = context.workspaceState.get<SavedQuery[]>('savedQueries', []);
            panel?.webview.postMessage({
              type: 'queriesLoaded',
              queries,
            });
          }
          break;
        }

        case 'exportQueries': {
          // Export saved queries as JSON
          if (context.workspaceState) {
            const queries = context.workspaceState.get<SavedQuery[]>('savedQueries', []);
            const jsonStr = JSON.stringify(queries, null, 2);
            const result = await vscode.window.showSaveDialog({
              filters: { 'JSON files': ['json'] },
              defaultUri: vscode.Uri.file('saved-queries.json'),
            });
            if (result) {
              fs.writeFileSync(result.fsPath, jsonStr);
              panel?.webview.postMessage({
                type: 'queriesExported',
                path: result.fsPath,
              });
            }
          }
          break;
        }

        case 'importQueries': {
          // Import saved queries from JSON file
          const result = await vscode.window.showOpenDialog({
            canSelectFiles: true,
            canSelectFolders: false,
            canSelectMany: false,
            filters: { 'JSON files': ['json'] },
          });
          if (result && result.length > 0) {
            try {
              const content = fs.readFileSync(result[0].fsPath, 'utf-8');
              const queries = JSON.parse(content) as SavedQuery[];
              if (context.workspaceState) {
                await context.workspaceState.update('savedQueries', queries);
              }
              panel?.webview.postMessage({
                type: 'queriesImported',
                queries,
              });
            } catch (err) {
              vscode.window.showErrorMessage(
                `Failed to import queries: ${err instanceof Error ? err.message : String(err)}`
              );
            }
          }
          break;
        }

        case 'deleteQuery': {
          // Delete a saved query
          if (context.workspaceState) {
            const queries = context.workspaceState.get<SavedQuery[]>('savedQueries', []);
            const updated = queries.filter((q) => q.id !== message.queryId);
            await context.workspaceState.update('savedQueries', updated);
            panel?.webview.postMessage({
              type: 'queryDeleted',
              queryId: message.queryId,
            });
          }
          break;
        }

        case 'updateHighlightPatterns': {
          // Update highlight patterns in workspace state
          if (context.workspaceState) {
            await context.workspaceState.update('highlightPatterns', message.patterns);
          }
          break;
        }

        default:
          break;
      }
    },
    undefined,
    context.subscriptions
  );

  // Handle panel disposal
  panel.onDidDispose(
    () => {
      panel = undefined;
    },
    null,
    context.subscriptions
  );

  // Load saved queries on panel creation
  if (context.workspaceState) {
    const queries = context.workspaceState.get<SavedQuery[]>('savedQueries', []);
    panel.webview.postMessage({
      type: 'queriesLoaded',
      queries,
    });
  }
}

function getWebviewContent(context: vscode.ExtensionContext): string {
  // Get the URI of the bundled webview JS
  const onDiskPath = vscode.Uri.joinPath(
    context.extensionUri,
    'dist',
    'webview',
    'index.html'
  );

  try {
    const htmlContent = fs.readFileSync(onDiskPath.fsPath, 'utf-8');
    return htmlContent;
  } catch {
    // Fallback: generate HTML with inline scripts if build hasn't run yet
    return getFallbackWebviewContent(context);
  }
}

function getFallbackWebviewContent(context: vscode.ExtensionContext): string {
  const stylesUri = panel
    ? panel.webview.asWebviewUri(
        vscode.Uri.joinPath(context.extensionUri, 'dist', 'webview', 'index.css')
      )
    : vscode.Uri.parse('');

  const scriptUri = panel
    ? panel.webview.asWebviewUri(
        vscode.Uri.joinPath(context.extensionUri, 'dist', 'webview', 'index.js')
      )
    : vscode.Uri.parse('');

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta http-equiv="Content-Security-Policy" content="default-src 'none'; style-src ${panel?.webview.cspSource || "'unsafe-inline'"}; script-src ${panel?.webview.cspSource || "'unsafe-inline'"}; img-src ${panel?.webview.cspSource || "'unsafe-inline'"} data:; font-src ${panel?.webview.cspSource || "'unsafe-inline'"};">
  <title>Sentry Log Explorer</title>
  <style>
    body { margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif; background: #1e1e1e; color: #d4d4d4; }
    #root { width: 100%; height: 100vh; display: flex; flex-direction: column; }
  </style>
</head>
<body>
  <div id="root"></div>
  <script src="${scriptUri}"></script>
</body>
</html>`;
}

// Type definitions for saved queries
interface SavedQuery {
  id: string;
  name: string;
  filterLevel: string;
  filterTimeStart: string;
  filterTimeEnd: string;
  filterPattern: string;
  highlightPatterns: HighlightPattern[];
  createdAt: number;
  usageCount: number;
}

interface HighlightPattern {
  pattern: string;
  color: string;
  fontWeight?: string;
  fontStyle?: string;
  backgroundColor?: string;
}
