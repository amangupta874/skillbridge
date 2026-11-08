import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import Button from './Button.jsx';
import Input from './Input.jsx';
import ErrorBanner from './ErrorBanner.jsx';
import EmptyState from './EmptyState.jsx';
import Spinner from './Spinner.jsx';

describe('Shared UI Components', () => {
  describe('Button', () => {
    it('renders with children and handles click', () => {
      const handleClick = vi.fn();
      render(<Button onClick={handleClick}>Click Me</Button>);

      const btn = screen.getByRole('button', { name: 'Click Me' });
      fireEvent.click(btn);
      expect(handleClick).toHaveBeenCalledTimes(1);
    });

    it('disables button and shows spinner when loading', () => {
      render(<Button loading>Submit</Button>);
      const btn = screen.getByRole('button', { name: /submit/i });
      expect(btn).toBeDisabled();
      expect(screen.getByRole('status', { name: /loading/i })).toBeInTheDocument();
    });
  });

  describe('Input', () => {
    it('links label and input with id/htmlFor and renders hint and error', () => {
      render(
        <Input
          id="email-field"
          name="email"
          label="Email Address"
          hint="We will not share your email"
          error="Email is required"
        />,
      );

      const input = screen.getByLabelText(/Email Address/i);
      expect(input).toBeInTheDocument();
      expect(input).toHaveAttribute('id', 'email-field');
      expect(screen.getByText('We will not share your email')).toBeInTheDocument();
      expect(screen.getByRole('alert')).toHaveTextContent('Email is required');
      expect(input).toHaveAttribute('aria-invalid', 'true');
    });
  });

  describe('ErrorBanner', () => {
    it('renders error message and handles retry button', () => {
      const handleRetry = vi.fn();
      render(<ErrorBanner error={{ message: 'Network timeout' }} onRetry={handleRetry} />);

      expect(screen.getByRole('alert')).toHaveTextContent('Network timeout');
      const retryBtn = screen.getByRole('button', { name: 'Retry' });
      fireEvent.click(retryBtn);
      expect(handleRetry).toHaveBeenCalledTimes(1);
    });

    it('renders nothing when error is null', () => {
      const { container } = render(<ErrorBanner error={null} />);
      expect(container.firstChild).toBeNull();
    });
  });

  describe('EmptyState', () => {
    it('renders title, description and calls onAction when clicked', () => {
      const handleAction = vi.fn();
      render(
        <EmptyState
          title="No projects found"
          description="Try adjusting your filters"
          actionLabel="Clear filters"
          onAction={handleAction}
        />,
      );

      expect(screen.getByText('No projects found')).toBeInTheDocument();
      expect(screen.getByText('Try adjusting your filters')).toBeInTheDocument();
      const actionBtn = screen.getByRole('button', { name: 'Clear filters' });
      fireEvent.click(actionBtn);
      expect(handleAction).toHaveBeenCalledTimes(1);
    });
  });

  describe('Spinner', () => {
    it('renders accessible status role', () => {
      render(<Spinner size="lg" />);
      expect(screen.getByRole('status', { name: /loading/i })).toBeInTheDocument();
    });
  });
});

