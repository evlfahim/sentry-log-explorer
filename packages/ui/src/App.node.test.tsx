import { describe, it, expect, vi } from 'vitest';
import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

describe('App integration (node)', () => {
  it('imports FileOpenDialog and LogList', () => {
    const appPath = path.resolve(__dirname, 'App.tsx');
    const appContent = fs.readFileSync(appPath, 'utf-8');
    expect(appContent).toContain("from './components/FileOpenDialog'");
    expect(appContent).toContain("from './components/LogList'");
  });

  it('passes onFileOpen callback to FileOpenDialog', () => {
    const appPath = path.resolve(__dirname, 'App.tsx');
    const appContent = fs.readFileSync(appPath, 'utf-8');
    expect(appContent).toContain('<FileOpenDialog onFileOpen={handleFileOpen}');
  });

  it('passes filtered lines to LogList', () => {
    const appPath = path.resolve(__dirname, 'App.tsx');
    const appContent = fs.readFileSync(appPath, 'utf-8');
    expect(appContent).toContain('<LogList');
    expect(appContent).toContain('lines={filteredLines}');
  });

  it('has handleFileOpen that parses log content', () => {
    const appPath = path.resolve(__dirname, 'App.tsx');
    const appContent = fs.readFileSync(appPath, 'utf-8');
    expect(appContent).toContain('handleFileOpen');
    expect(appContent).toContain('reader.readAsText(file)');
    expect(appContent).toContain('parserRef.current.parseLine');
  });

  it('renders FileOpenDialog in the JSX', () => {
    const appPath = path.resolve(__dirname, 'App.tsx');
    const appContent = fs.readFileSync(appPath, 'utf-8');
    expect(appContent).toContain('<FileOpenDialog');
  });

  it('renders LogList in the JSX', () => {
    const appPath = path.resolve(__dirname, 'App.tsx');
    const appContent = fs.readFileSync(appPath, 'utf-8');
    expect(appContent).toContain('<LogList');
  });

  it('has a fileLoaded state that controls LogList rendering', () => {
    const appPath = path.resolve(__dirname, 'App.tsx');
    const appContent = fs.readFileSync(appPath, 'utf-8');
    expect(appContent).toContain('fileLoaded');
    expect(appContent).toContain('fileLoaded={state.fileLoaded}');
  });

  it('handles file open error state', () => {
    const appPath = path.resolve(__dirname, 'App.tsx');
    const appContent = fs.readFileSync(appPath, 'utf-8');
    expect(appContent).toContain('error');
    expect(appContent).toContain('state.error');
  });

  it('applies filters before passing to LogList', () => {
    const appPath = path.resolve(__dirname, 'App.tsx');
    const appContent = fs.readFileSync(appPath, 'utf-8');
    expect(appContent).toContain('filteredLines');
    expect(appContent).toContain('filterByLevel');
    expect(appContent).toContain('filterByTimeRange');
    expect(appContent).toContain('filterByPattern');
  });
});
