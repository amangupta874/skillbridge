import { describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter } from 'react-router-dom';
import { ToastProvider } from './Toast.jsx';
import RequestExchangeDialog from './RequestExchangeDialog.jsx';
import * as ExchangesApi from '../api/exchanges.js';
import * as UsersApi from '../api/users.js';
import { ApiError } from '../api/client.js';

vi.mock('../api/exchanges.js', () => ({ createExchange: vi.fn() }));
vi.mock('../api/users.js', () => ({ getUserById: vi.fn() }));

describe('RequestExchangeDialog', () => {
  it('sends the selected skills and message, then shows a server error', async () => {
    vi.mocked(UsersApi.getUserById).mockResolvedValue({
      skills: [
        { skill: { id: 1, name: 'React' }, level: 'BEGINNER' },
        { skill: { id: 2, name: 'Node.js' }, level: 'ADVANCED' },
      ],
    });
    vi.mocked(ExchangesApi.createExchange).mockRejectedValue(new ApiError({ status: 409, code: 'CONFLICT', message: 'An active exchange already exists.' }));
    const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    const recipient = {
      id: 'other-user',
      fullName: 'Taylor Student',
      skills: [
        { skill: { id: 3, name: 'Design' }, level: 'INTERMEDIATE' },
        { skill: { id: 4, name: 'Writing' }, level: 'BEGINNER' },
      ],
    };

    render(
      <QueryClientProvider client={queryClient}>
        <ToastProvider>
          <MemoryRouter><RequestExchangeDialog open onClose={vi.fn()} currentUserId="my-user" recipient={recipient} /></MemoryRouter>
        </ToastProvider>
      </QueryClientProvider>,
    );

    fireEvent.change(await screen.findByLabelText(/Skill I offer/), { target: { value: '2' } });
    fireEvent.change(screen.getByLabelText(/Skill I want to learn/), { target: { value: '4' } });
    fireEvent.change(screen.getByLabelText(/Message/), { target: { value: 'I would like to learn from your experience.' } });
    fireEvent.click(screen.getByRole('button', { name: 'Send request' }));

    await waitFor(() => expect(ExchangesApi.createExchange.mock.calls[0]?.[0]).toEqual({
      recipientId: 'other-user',
      offeredSkillId: 2,
      requestedSkillId: 4,
      message: 'I would like to learn from your experience.',
    }));
    expect(await screen.findByRole('alert')).toHaveTextContent('An active exchange already exists.');
  });
});
