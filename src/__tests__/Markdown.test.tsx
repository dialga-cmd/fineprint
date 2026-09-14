import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { Markdown } from '@/components/Markdown';

describe('Markdown', () => {
  it('renders plain text', () => {
    render(<Markdown content="Hello world" />);
    expect(screen.getByText('Hello world')).toBeInTheDocument();
  });

  it('renders bold text', () => {
    render(<Markdown content="**bold text**" />);
    expect(screen.getByText('bold text')).toBeInTheDocument();
  });

  it('renders lists', () => {
    render(<Markdown content={'- Item 1\n- Item 2'} />);
    expect(screen.getByText('Item 1')).toBeInTheDocument();
    expect(screen.getByText('Item 2')).toBeInTheDocument();
  });

  it('renders code blocks', () => {
    render(<Markdown content="`inline code`" />);
    expect(screen.getByText('inline code')).toBeInTheDocument();
  });

  it('renders links', () => {
    render(<Markdown content="[click here](https://example.com)" />);
    expect(screen.getByText('click here')).toHaveAttribute('href', 'https://example.com');
  });
});
