import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';
import React from 'react';

describe('minimal react2', () => {
  it('renders a simple div', () => {
    const { container } = render(React.createElement('div', { 'data-testid': 'test' }, 'Hello'));
    expect(container.querySelector('[data-testid="test"]')).toBeTruthy();
  });
});
