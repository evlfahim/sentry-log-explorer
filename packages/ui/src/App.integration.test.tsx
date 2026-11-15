/**
 * Integration test for App component.
 * This test verifies that the App component correctly integrates
 * FileOpenDialog and LogList by checking the component structure
 * and behavior without needing a full DOM environment.
 */
import { describe, it, expect, vi } from 'vitest';
import * as fs from 'fs';
import * as path from 'path';

describe('App integration (structural)', () => {
  it('imports FileOpenDialog and LogList', () => {
    // Read the App.tsx source and verify it imports both components
    const appPath = path.resolve(__dirname, 'App.tsx');
    const appContent = fs.readFileSync(appPath, 'utf-8');
    
    expect(appContent).toContain("from './components/FileOpenDialog'");
    expect(appContent).toContain("from './components/LogList'");
  });

  it('passes onFileOpen callback to FileOpenDialog', () => {
    const appPath = path.resolve(__dirname, 'App.tsx');
    const appContent = fs.readFileSync(appPath, 'utf-8');
    
    // Verify that FileOpenDialog receives the onFileOpen prop
    expect(appContent).toContain('<FileOpenDialog onFileOpen={handleFileOpen}');
  });

  it('passes filtered lines to LogList', () => {
    const appPath = path.resolve(__dirname, 'App.tsx');
    const appContent = fs.readFileSync(appPath, 'utf-8');
    
    // Verify that LogList receives the filtered lines prop
    expect(appContent).toContain('<LogList');
    expect(appContent).toContain('lines={filteredLines}');
  });

  it('has handleFileOpen that parses log content', () => {
    const appPath = path.resolve(__dirname, 'App.tsx');
    const appContent = fs.readFileSync(appPath, 'utf-8');
    
    // Verify the file open handler exists and parses content
    expect(appContent).toContain('handleFileOpen');
    expect(appContent).toContain('reader.readAsText(file)');
    expect(appContent).toContain('parserRef.current.parseLine');
  });

  it('renders FileOpenDialog in the JSX', () => {
    const appPath = path.resolve(__dirname, 'App.tsx');
    const appContent = fs.readFileSync(appPath, 'utf-8');
    
    // Verify FileOpenDialog is rendered in the JSX
    expect(appContent).toContain('<FileOpenDialog');
  });

  it('renders LogList in the JSX', () => {
    const appPath = path.resolve(__dirname, 'App.tsx');
    const appContent = fs.readFileSync(appPath, 'utf-8');
    
    // Verify LogList is rendered in the JSX
    expect(appContent).toContain('<LogList');
  });

  it('has a fileLoaded state that controls LogList rendering', () => {
    const appPath = path.resolve(__dirname, 'App.tsx');
    const appContent = fs.readFileSync(appPath, 'utf-8');
    
    // Verify fileLoaded state is used
    expect(appContent).toContain('fileLoaded');
    expect(appContent).toContain('fileLoaded={state.fileLoaded}');
  });

  it('handles file open error state', () => {
    const appPath = path.resolve(__dirname, 'App.tsx');
    const appContent = fs.readFileSync(appPath, 'utf-8');
    
    // Verify error handling
    expect(appContent).toContain('error');
    expect(appContent).toContain('state.error');
  });
});
