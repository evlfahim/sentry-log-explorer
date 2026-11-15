/**
 * Vitest setup: the DOM itself comes from vitest's built-in `jsdom` environment
 * (see vitest.config.ts). Here we only register the jest-dom matchers
 * (toBeInTheDocument, toHaveAttribute, ...) and unmount rendered trees between tests.
 */
import '@testing-library/jest-dom/vitest';
import { afterEach } from 'vitest';
import { cleanup } from '@testing-library/react';

afterEach(() => {
  cleanup();
});
