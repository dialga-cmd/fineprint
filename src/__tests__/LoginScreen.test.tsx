import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { LoginScreen } from '@/components/LoginScreen';

vi.mock('next/font/google', () => ({
  Fraunces: () => ({ variable: '--font-display', className: '' }),
  Instrument_Sans: () => ({ variable: '--font-sans', className: '' }),
  IBM_Plex_Mono: () => ({ variable: '--font-mono', className: '' }),
}));

describe('LoginScreen', () => {
  const defaultProps = {
    onSignIn: vi.fn(),
    loading: false,
  };

  it('renders the app name', () => {
    render(<LoginScreen {...defaultProps} />);
    expect(screen.getByText('Fine')).toBeInTheDocument();
    expect(screen.getByText('Print')).toBeInTheDocument();
  });

  it('renders sign-in button', () => {
    render(<LoginScreen {...defaultProps} />);
    expect(screen.getByRole('button', { name: /continue with google/i })).toBeInTheDocument();
  });

  it('calls onSignIn when button is clicked', async () => {
    const onSignIn = vi.fn();
    render(<LoginScreen {...defaultProps} onSignIn={onSignIn} />);
    const btn = screen.getByRole('button', { name: /continue with google/i });
    btn.click();
    expect(onSignIn).toHaveBeenCalledOnce();
  });

  it('shows loading spinner when loading', () => {
    render(<LoginScreen {...defaultProps} loading={true} />);
    const btn = screen.getByRole('button', { name: /continue with google/i });
    expect(btn).toBeDisabled();
  });

  it('renders feature cards', () => {
    render(<LoginScreen {...defaultProps} />);
    expect(screen.getByText('Compare')).toBeInTheDocument();
    expect(screen.getByText('Risk scan')).toBeInTheDocument();
    expect(screen.getByText('Checklists')).toBeInTheDocument();
    expect(screen.getByText('Ask anything')).toBeInTheDocument();
  });

  it('renders disclaimer', () => {
    render(<LoginScreen {...defaultProps} />);
    expect(screen.getByText(/not legal advice/i)).toBeInTheDocument();
  });
});
