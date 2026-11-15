import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import React from 'react';

describe('minimal react', () => {
  it('renders a simple div', () => {
    render(<div data-testid="test">Hello</div>);
    expect(screen.getByTestId('test')).toBeInTheDocument();
  });
});
