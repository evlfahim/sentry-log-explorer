import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';

describe('testing library basic', () => {
  it('renders a simple div', () => {
    render(<div>Hello</div>);
    expect(screen.getByText('Hello')).toBeInTheDocument();
  });
});
