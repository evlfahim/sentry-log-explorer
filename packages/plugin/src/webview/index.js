/**
 * Sentry Log Explorer Webview Script
 *
 * Handles UI logic and communicates with the VS Code extension host
 * via postMessage.
 */

/* eslint-disable no-undef */
(function () {
  'use strict';

  // --- State ---
  const state = {
    lines: [],
    rawLines: [],
    fileLoaded: false,
    fileName: '',
    filterLevel: '',
    filterTimeStart: '',
    filterTimeEnd: '',
    filterPattern: '',
    highlightPatterns: [],
    savedQueries: [],
    followMode: false,
    followPaused: false,
    scrollTop: 0,
    isLoading: false,
    error: null,
  };

  // --- Constants ---
  const ROW_HEIGHT = 24;
  const BUFFER_SIZE = 20;
  const DEFAULT_VIEWPORT_HEIGHT = 600;

  // --- DOM References ---
  let dom = {};

  function cacheDom() {
    dom = {
      root: document.getElementById('root'),
      fileName: document.getElementById('fileName'),
      openFileBtn: document.getElementById('openFileBtn'),
      openActiveBtn: document.getElementById('openActiveBtn'),
      followToggle: document.getElementById('followToggle'),
      saveQueryBtn: document.getElementById('saveQueryBtn'),
      exportQueryBtn: document.getElementById('exportQueryBtn'),
      importQueryBtn: document.getElementById('importQueryBtn'),
      levelFilter: document.getElementById('levelFilter'),
      timeStart: document.getElementById('timeStart'),
      timeEnd: document.getElementById('timeEnd'),
      patternFilter: document.getElementById('patternFilter'),
      clearFiltersBtn: document.getElementById('clearFiltersBtn'),
      highlightPattern: document.getElementById('highlightPattern'),
      highlightColor: document.getElementById('highlightColor'),
      addHighlightBtn: document.getElementById('addHighlightBtn'),
      highlightPatternsList: document.getElementById('highlightPatterns'),
      savedQueriesPanel: document.getElementById('savedQueriesPanel'),
      savedQueriesList: document.getElementById('savedQueriesList'),
      errorBanner: document.getElementById('errorBanner'),
      loadingIndicator: document.getElementById('loadingIndicator'),
      logListContainer: document.getElementById('logListContainer'),
      logListViewport: document.getElementById('logListViewport'),
      logListContent: document.getElementById('logListContent'),
      logListEmpty: document.getElementById('logListEmpty'),
      logListNoLines: document.getElementById('logListNoLines'),
      logListFooter: document.getElementById('logListFooter'),
    };
  }

  // --- VS Code Bridge ---
  function postMessage(message) {
    if (typeof acquireVsCodeApi !== 'undefined') {
      window.acquireVsCodeApi().postMessage(message);
    }
  }

  function handleMessage(event) {
    const message = event.data;
    if (!message) return;

    switch (message.type) {
      case 'fileLoaded':
        handleFileLoaded(message.content, message.fileName);
        break;
      case 'querySaved':
        handleQuerySaved(message.query);
        break;
      case 'queriesLoaded':
        handleQueriesLoaded(message.queries);
        break;
      case 'queriesExported':
        handleQueriesExported(message.path);
        break;
      case 'queriesImported':
        handleQueriesImported(message.queries);
        break;
      case 'queryDeleted':
        handleQueryDeleted(message.queryId);
        break;
      default:
        break;
    }
  }

  // --- File Handling ---
  function handleFileLoaded(content, fileName) {
    state.isLoading = true;
    render();

    // Process in next tick to allow UI update
    setTimeout(() => {
      try {
        const rawLines = content.split(/\r?\n/);
        // Remove trailing empty line from trailing newline
        if (rawLines.length > 0 && rawLines[rawLines.length - 1] === '') {
          rawLines.pop();
        }

        const parsed = rawLines.map((line, i) => parseLogLine(line, i + 1));

        state.lines = parsed;
        state.rawLines = rawLines;
        state.fileLoaded = true;
        state.fileName = fileName;
        state.isLoading = false;
        state.error = null;
        state.scrollTop = 0;
      } catch (err) {
        state.isLoading = false;
        state.error = err instanceof Error ? err.message : 'Failed to read file';
      }
      render();
    }, 0);
  }

  function parseLogLine(line, lineNumber) {
    const result = {
      lineNumber,
      message: line,
      level: '',
      rawTimestamp: '',
    };

    // Try to extract timestamp: patterns like "2024-01-15 10:30:45" or "[2024-01-15 10:30:45]"
    const timestampMatch = line.match(
      /(\d{4}-\d{2}-\d{2}[T ]\d{2}:\d{2}:\d{2}(?:\.\d+)?(?:[+-]\d{2}:?\d{2}|Z)?)/
    );
    if (timestampMatch) {
      result.rawTimestamp = timestampMatch[1];
    }

    // Try to extract log level
    const levelMatch = line.match(
      /\b(TRACE|DEBUG|INFO|WARN|WARNING|ERROR|FATAL|CRITICAL)\b/i
    );
    if (levelMatch) {
      result.level = levelMatch[1].toUpperCase();
      if (result.level === 'WARNING') {
        result.level = 'WARN';
      }
    }

    return result;
  }

  // --- Filtering ---
  function getFilteredLines() {
    let result = state.lines;

    if (state.filterLevel && state.filterLevel !== '') {
      result = result.filter((line) => line.level === state.filterLevel);
    }

    if (state.filterTimeStart || state.filterTimeEnd) {
      const start = state.filterTimeStart ? new Date(state.filterTimeStart) : null;
      const end = state.filterTimeEnd ? new Date(state.filterTimeEnd) : null;
      if (start && end) {
        result = result.filter((line) => {
          if (!line.rawTimestamp) return false;
          const ts = new Date(line.rawTimestamp);
          return ts >= start && ts <= end;
        });
      }
    }

    if (state.filterPattern) {
      try {
        const regex = new RegExp(state.filterPattern, 'i');
        result = result.filter((line) => regex.test(line.message));
      } catch {
        // Invalid regex, skip
      }
    }

    return result;
  }

  // --- Highlighting ---
  function getHighlightedSegments(line, patterns) {
    if (!patterns || patterns.length === 0) {
      return [{ text: line.message, isMatch: false, color: null }];
    }

    // Find all matches across all patterns
    const matches = [];
    for (const pattern of patterns) {
      try {
        const regex = new RegExp(pattern.pattern, 'gi');
        let m;
        while ((m = regex.exec(line.message)) !== null) {
          matches.push({
            start: m.index,
            end: m.index + m[0].length,
            color: pattern,
            text: m[0],
          });
        }
      } catch {
        // Invalid regex, skip
      }
    }

    if (matches.length === 0) {
      return [{ text: line.message, isMatch: false, color: null }];
    }

    // Sort by start position
    matches.sort((a, b) => a.start - b.start);

    // Merge overlapping matches (keep the first one)
    const merged = [matches[0]];
    for (let i = 1; i < matches.length; i++) {
      const last = merged[merged.length - 1];
      if (matches[i].start < last.end) {
        // Overlapping, skip
        continue;
      }
      merged.push(matches[i]);
    }

    // Build segments
    const segments = [];
    let pos = 0;
    for (const match of merged) {
      if (match.start > pos) {
        segments.push({
          text: line.message.substring(pos, match.start),
          isMatch: false,
          color: null,
        });
      }
      segments.push({
        text: match.text,
        isMatch: true,
        color: match.color,
      });
      pos = match.end;
    }
    if (pos < line.message.length) {
      segments.push({
        text: line.message.substring(pos),
        isMatch: false,
        color: null,
      });
    }

    return segments;
  }

  // --- Saved Queries ---
  function handleQuerySaved(query) {
    const idx = state.savedQueries.findIndex((q) => q.id === query.id);
    if (idx >= 0) {
      state.savedQueries[idx] = query;
    } else {
      state.savedQueries.push(query);
    }
    render();
  }

  function handleQueriesLoaded(queries) {
    state.savedQueries = queries || [];
    render();
  }

  function handleQueriesExported(path) {
    // Could show a success message
    console.log('Queries exported to:', path);
  }

  function handleQueriesImported(queries) {
    state.savedQueries = queries || [];
    render();
  }

  function handleQueryDeleted(queryId) {
    state.savedQueries = state.savedQueries.filter((q) => q.id !== queryId);
    render();
  }

  function saveCurrentQuery() {
    const name = prompt('Enter query name:', 'Query ' + (state.savedQueries.length + 1));
    if (!name) return;

    const query = {
      id: 'q_' + Date.now() + '_' + Math.random().toString(36).substring(2, 8),
      name,
      filterLevel: state.filterLevel,
      filterTimeStart: state.filterTimeStart,
      filterTimeEnd: state.filterTimeEnd,
      filterPattern: state.filterPattern,
      highlightPatterns: state.highlightPatterns,
      createdAt: Date.now(),
      usageCount: 0,
    };

    postMessage({ type: 'saveQuery', query });
  }

  function loadQuery(query) {
    state.filterLevel = query.filterLevel || '';
    state.filterTimeStart = query.filterTimeStart || '';
    state.filterTimeEnd = query.filterTimeEnd || '';
    state.filterPattern = query.filterPattern || '';
    state.highlightPatterns = query.highlightPatterns || [];

    // Update UI
    dom.levelFilter.value = state.filterLevel;
    dom.timeStart.value = state.filterTimeStart;
    dom.timeEnd.value = state.filterTimeEnd;
    dom.patternFilter.value = state.filterPattern;

    render();
  }

  function deleteQuery(queryId) {
    postMessage({ type: 'deleteQuery', queryId });
  }

  // --- Follow Mode ---
  function toggleFollowMode() {
    state.followMode = !state.followMode;
    if (state.followMode) {
      state.followPaused = false;
    }
    render();
  }

  function togglePauseResume() {
    if (state.followMode) {
      state.followPaused = !state.followPaused;
    }
    render();
  }

  function scrollToBottom() {
    if (state.followMode && !state.followPaused && dom.logListContainer) {
      dom.logListContainer.scrollTop = dom.logListContainer.scrollHeight;
    }
  }

  // --- Rendering ---
  function render() {
    // File name
    dom.fileName.textContent = state.fileName;

    // Loading
    dom.loadingIndicator.style.display = state.isLoading ? 'block' : 'none';

    // Error
    if (state.error) {
      dom.errorBanner.textContent = state.error;
      dom.errorBanner.style.display = 'block';
    } else {
      dom.errorBanner.style.display = 'none';
    }

    // Log list visibility
    if (!state.fileLoaded) {
      dom.logListEmpty.style.display = 'block';
      dom.logListContainer.style.display = 'none';
      return;
    }

    dom.logListEmpty.style.display = 'none';
    dom.logListContainer.style.display = 'block';

    // Get filtered lines
    const filteredLines = getFilteredLines();

    // Virtual scrolling
    const totalHeight = filteredLines.length * ROW_HEIGHT;
    const viewportHeight =
      dom.logListContainer.clientHeight || DEFAULT_VIEWPORT_HEIGHT;
    const startIndex = Math.max(
      0,
      Math.floor(state.scrollTop / ROW_HEIGHT) - BUFFER_SIZE
    );
    const endIndex = Math.min(
      filteredLines.length,
      Math.ceil((state.scrollTop + viewportHeight) / ROW_HEIGHT) + BUFFER_SIZE
    );
    const visibleLines = filteredLines.slice(startIndex, endIndex);
    const offsetY = startIndex * ROW_HEIGHT;

    // Render viewport
    dom.logListViewport.style.height = totalHeight + 'px';
    dom.logListContent.style.transform = `translateY(${offsetY}px)`;

    let html = '';
    for (let i = 0; i < visibleLines.length; i++) {
      const line = visibleLines[i];
      const actualIndex = startIndex + i;
      const segments = getHighlightedSegments(line, state.highlightPatterns);

      let contentHtml = '';
      for (const segment of segments) {
        if (segment.isMatch && segment.color) {
          const style = `color:${segment.color.color};`;
          if (segment.color.fontWeight) {
            style += `font-weight:${segment.color.fontWeight};`;
          }
          if (segment.color.fontStyle) {
            style += `font-style:${segment.color.fontStyle};`;
          }
          if (segment.color.backgroundColor) {
            style += `background-color:${segment.color.backgroundColor};`;
          }
          contentHtml += `<span class="log-row-highlight" style="${style}">${escapeHtml(
            segment.text
          )}</span>`;
        } else {
          contentHtml += escapeHtml(segment.text);
        }
      }

      let levelHtml = '';
      if (line.level) {
        const levelColor = getLevelColor(line.level);
        levelHtml = `<span class="log-row-level" style="color:${levelColor}">${line.level}</span>`;
      }

      let timestampHtml = '';
      if (line.rawTimestamp) {
        timestampHtml = `<span class="log-row-timestamp">${escapeHtml(line.rawTimestamp)}</span>`;
      }

      html += `<div class="log-row" data-line="${line.lineNumber}">`;
      html += `<span class="log-row-number">${line.lineNumber}</span>`;
      html += timestampHtml;
      html += levelHtml;
      html += `<span class="log-row-content">${contentHtml}</span>`;
      html += `</div>`;
    }

    dom.logListContent.innerHTML = html;

    // No lines message
    if (filteredLines.length === 0) {
      dom.logListNoLines.textContent =
        state.rawLines.length === 0
          ? 'File is empty.'
          : 'No lines match the current filters.';
      dom.logListNoLines.style.display = 'block';
    } else {
      dom.logListNoLines.style.display = 'none';
    }

    // Footer
    dom.logListFooter.textContent = `Showing ${filteredLines.length} of ${state.rawLines.length} lines`;

    // Follow mode auto-scroll
    scrollToBottom();

    // Render saved queries
    renderSavedQueries();

    // Render highlight patterns
    renderHighlightPatterns();

    // Update follow toggle
    updateFollowToggle();
  }

  function escapeHtml(text) {
    return text
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

  function getLevelColor(level) {
    const colors = {
      TRACE: '#888888',
      DEBUG: '#569cd6',
      INFO: '#4ec9b0',
      WARN: '#cca700',
      ERROR: '#f44747',
      FATAL: '#ff0000',
      CRITICAL: '#ff0000',
    };
    return colors[level] || '#d4d4d4';
  }

  function renderSavedQueries() {
    if (!dom.savedQueriesList) return;

    if (state.savedQueries.length === 0) {
      dom.savedQueriesList.innerHTML =
        '<span style="color:#888888;font-size:11px;">No saved queries</span>';
      return;
    }

    // Sort by usage count descending, then by creation date descending
    const sorted = [...state.savedQueries].sort((a, b) => {
      if (b.usageCount !== a.usageCount) return b.usageCount - a.usageCount;
      return b.createdAt - a.createdAt;
    });

    let html = '';
    for (const query of sorted) {
      html += `<div class="saved-query-tag" data-query-id="${query.id}">`;
      html += `<span class="name">${escapeHtml(query.name)}</span>`;
      html += `<span class="remove" data-delete="${query.id}">×</span>`;
      html += `</div>`;
    }
    dom.savedQueriesList.innerHTML = html;
  }

  function renderHighlightPatterns() {
    if (!dom.highlightPatternsList) return;

    let html = '';
    for (let i = 0; i < state.highlightPatterns.length; i++) {
      const p = state.highlightPatterns[i];
      html += `<div class="highlight-pattern-tag">`;
      html += `<span style="color:${p.color}">●</span>`;
      html += `<span>${escapeHtml(p.pattern)}</span>`;
      html += `<span class="remove" data-remove-highlight="${i}">×</span>`;
      html += `</div>`;
    }
    dom.highlightPatternsList.innerHTML = html;
  }

  function updateFollowToggle() {
    if (!dom.followToggle) return;

    dom.followToggle.classList.remove('btn-active');

    if (state.followMode) {
      if (state.followPaused) {
        dom.followToggle.textContent = '⏸ Pause';
        dom.followToggle.classList.add('btn-active');
      } else {
        dom.followToggle.textContent = '🔴 Follow';
        dom.followToggle.classList.add('btn-active');
      }
    } else {
      dom.followToggle.textContent = '⚪ Follow';
    }
  }

  // --- Event Handlers ---
  function bindEvents() {
    // Open file
    dom.openFileBtn.addEventListener('click', () => {
      postMessage({ type: 'openFile' });
    });

    // Open active document
    dom.openActiveBtn.addEventListener('click', () => {
      postMessage({ type: 'openFileFromActive' });
    });

    // Follow mode toggle
    dom.followToggle.addEventListener('click', () => {
      if (state.followMode && !state.followPaused) {
        // Currently following, pause
        togglePauseResume();
      } else if (state.followMode && state.followPaused) {
        // Currently paused, resume
        togglePauseResume();
      } else {
        // Not following, start following
        toggleFollowMode();
      }
    });

    // Save query
    dom.saveQueryBtn.addEventListener('click', saveCurrentQuery);

    // Export queries
    dom.exportQueryBtn.addEventListener('click', () => {
      postMessage({ type: 'exportQueries' });
    });

    // Import queries
    dom.importQueryBtn.addEventListener('click', () => {
      postMessage({ type: 'importQueries' });
    });

    // Level filter
    dom.levelFilter.addEventListener('change', () => {
      state.filterLevel = dom.levelFilter.value;
      render();
    });

    // Time start
    dom.timeStart.addEventListener('change', () => {
      state.filterTimeStart = dom.timeStart.value;
      render();
    });

    // Time end
    dom.timeEnd.addEventListener('change', () => {
      state.filterTimeEnd = dom.timeEnd.value;
      render();
    });

    // Pattern filter
    dom.patternFilter.addEventListener('input', () => {
      state.filterPattern = dom.patternFilter.value;
      render();
    });

    // Clear filters
    dom.clearFiltersBtn.addEventListener('click', () => {
      state.filterLevel = '';
      state.filterTimeStart = '';
      state.filterTimeEnd = '';
      state.filterPattern = '';
      dom.levelFilter.value = '';
      dom.timeStart.value = '';
      dom.timeEnd.value = '';
      dom.patternFilter.value = '';
      render();
    });

    // Add highlight pattern
    dom.addHighlightBtn.addEventListener('click', () => {
      const pattern = dom.highlightPattern.value.trim();
      const color = dom.highlightColor.value;
      if (!pattern) return;

      state.highlightPatterns.push({
        pattern,
        color,
        fontWeight: 'bold',
      });

      dom.highlightPattern.value = '';
      postMessage({
        type: 'updateHighlightPatterns',
        patterns: state.highlightPatterns,
      });
      render();
    });

    // Scroll handler
    dom.logListContainer.addEventListener('scroll', (e) => {
      state.scrollTop = e.currentTarget.scrollTop;
      render();
    });

    // Delegate events for saved queries and highlight patterns
    dom.savedQueriesList.addEventListener('click', (e) => {
      const tag = e.target.closest('.saved-query-tag');
      if (tag) {
        const queryId = tag.getAttribute('data-query-id');
        const query = state.savedQueries.find((q) => q.id === queryId);
        if (query) {
          loadQuery(query);
        }
        return;
      }

      const removeBtn = e.target.closest('.remove');
      if (removeBtn) {
        const queryId = removeBtn.getAttribute('data-delete');
        if (queryId) {
          deleteQuery(queryId);
        }
      }
    });

    dom.highlightPatternsList.addEventListener('click', (e) => {
      const removeBtn = e.target.closest('.remove');
      if (removeBtn) {
        const idx = parseInt(removeBtn.getAttribute('data-remove-highlight'), 10);
        if (!isNaN(idx)) {
          state.highlightPatterns.splice(idx, 1);
          postMessage({
            type: 'updateHighlightPatterns',
            patterns: state.highlightPatterns,
          });
          render();
        }
      }
    });
  }

  // --- Init ---
  function init() {
    cacheDom();
    bindEvents();

    // Listen for messages from extension host
    window.addEventListener('message', handleMessage);

    // Initial render
    render();
  }

  // Start when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
