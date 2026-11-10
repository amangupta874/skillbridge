import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import Badge from './Badge.jsx';

describe('Badge Component', () => {
  it('renders children correctly', () => {
    render(<Badge>Active</Badge>);
    expect(screen.getByText('Active')).toBeInTheDocument();
  });

  it('applies variant-specific styling for status', () => {
    const { container: pendingContainer } = render(<Badge variant="PENDING">Pending</Badge>);
    expect(pendingContainer.firstChild).toHaveClass('text-amber-700');

    const { container: acceptedContainer } = render(<Badge variant="ACCEPTED">Accepted</Badge>);
    expect(acceptedContainer.firstChild).toHaveClass('text-emerald-700');

    const { container: rejectedContainer } = render(<Badge variant="REJECTED">Rejected</Badge>);
    expect(rejectedContainer.firstChild).toHaveClass('text-red-700');
  });

  it('applies skill level styling', () => {
    const { container: beginnerContainer } = render(<Badge variant="BEGINNER">Beginner</Badge>);
    expect(beginnerContainer.firstChild).toHaveClass('bg-slate-100');

    const { container: expertContainer } = render(<Badge variant="EXPERT">Expert</Badge>);
    expect(expertContainer.firstChild).toHaveClass('text-emerald-800');
  });

  it('handles size prop', () => {
    const { container: smContainer } = render(<Badge size="sm">Small</Badge>);
    expect(smContainer.firstChild).toHaveClass('text-xs');

    const { container: lgContainer } = render(<Badge size="lg">Large</Badge>);
    expect(lgContainer.firstChild).toHaveClass('text-sm');
  });
});

