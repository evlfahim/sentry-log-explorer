import { describe, it, expect, beforeEach } from 'vitest';
import { createRoot } from 'react-dom/client';

describe('react-dom basic', () => {
  let container: HTMLDivElement;
  let root: ReturnType<typeof createRoot>;

  beforeEach(() => {
    container = document.createElement('div');
    document.body.appendChild(container);
    root = createRoot(container);
  });

  it('renders a div', async () => {
    root.render(<div>Hello</div>);
    // React 18 renders synchronously in tests
    expect(container.textContent).toBe('Hello');
  });

  it('renders a component', async () => {
    function Greeting() {
      return <div>Hello World</div>;
    }
    root.render(<Greeting />);
    expect(container.textContent).toBe('Hello World');
  });
});
