import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { expect, it, vi } from 'vitest';
import { getUnreadCount } from '../api/notifications.js';
import NotificationBell from './NotificationBell.jsx';

vi.mock('../api/notifications.js', () => ({ getUnreadCount: vi.fn() }));

function renderBell(count) {
  getUnreadCount.mockResolvedValue({ count });
  const client = new QueryClient();
  render(
    <QueryClientProvider client={client}>
      <MemoryRouter><NotificationBell /></MemoryRouter>
    </QueryClientProvider>,
  );
  return client;
}

it('caps the badge at 9+ and links to notifications', async () => {
  renderBell(14);

  expect(await screen.findByText('9+')).toBeInTheDocument();
  expect(screen.getByRole('link', { name: 'Notifications, 14 unread' })).toHaveAttribute('href', '/notifications');
});

it('hides the badge when nothing is unread', async () => {
  const client = renderBell(0);

  await vi.waitFor(() => expect(client.getQueryData(['notifications', 'unread'])).toEqual({ count: 0 }));
  expect(screen.getByRole('link', { name: 'Notifications' })).toHaveTextContent(/^$/);
});
