import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import ExchangeCard from './ExchangeCard.jsx';

describe('ExchangeCard', () => {
  it('shows only actions allowed for the current user', () => {
    render(
      <MemoryRouter>
        <ExchangeCard
          currentUserId="recipient-id"
          onStatusChange={vi.fn()}
          exchange={{
            id: 'exchange-id',
            sender: { id: 'sender-id', fullName: 'Alex Sender' },
            recipient: { id: 'recipient-id', fullName: 'Riley Recipient' },
            offeredSkill: { id: 1, name: 'React' },
            requestedSkill: { id: 2, name: 'Design' },
            message: 'I can help you learn React.',
            status: 'PENDING',
            createdAt: '2026-11-17T08:00:00.000Z',
            allowedTransitions: ['ACCEPTED', 'REJECTED'],
          }}
        />
      </MemoryRouter>,
    );

    expect(screen.getByRole('button', { name: 'Accept' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Reject' })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Cancel' })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Mark completed' })).not.toBeInTheDocument();
  });
});
