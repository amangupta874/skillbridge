import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { beforeEach, expect, it, vi } from 'vitest';
import { getNotifications, markAllNotificationsRead, markNotificationRead } from '../api/notifications.js';
import NotificationsPage from './NotificationsPage.jsx';

vi.mock('../api/notifications.js', () => ({
  getNotifications: vi.fn(),
  markAllNotificationsRead: vi.fn(),
  markNotificationRead: vi.fn(),
}));

const notification = {
  id: 'notification-1',
  type: 'APPLICATION_RECEIVED',
  createdAt: '2026-11-18T08:00:00Z',
  isRead: false,
  message: 'Jordan Kim applied to Campus garden app',
  link: '/projects/project-1/applications',
};
const meta = { page: 1, limit: 12, total: 1, totalPages: 1 };

function renderNotifications() {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  render(
    <QueryClientProvider client={client}>
      <MemoryRouter initialEntries={['/notifications']}>
        <Routes>
          <Route path="/notifications" element={<NotificationsPage />} />
          <Route path={notification.link} element={<h1>Project applications</h1>} />
        </Routes>
      </MemoryRouter>
    </QueryClientProvider>,
  );
  return client;
}

beforeEach(() => {
  vi.resetAllMocks();
  getNotifications.mockResolvedValue({ items: [notification], meta });
});

it('marks an unread notification and opens the server link', async () => {
  markNotificationRead.mockResolvedValue({ ...notification, isRead: true });
  const client = renderNotifications();
  const invalidateQueries = vi.spyOn(client, 'invalidateQueries');

  fireEvent.click(await screen.findByRole('link', { name: /Jordan Kim applied/ }));

  expect(await screen.findByRole('heading', { name: 'Project applications' })).toBeInTheDocument();
  expect(markNotificationRead).toHaveBeenCalledWith(notification.id);
  expect(invalidateQueries).toHaveBeenCalledWith({ queryKey: ['notifications'] });
});

it('marks all notifications as read and refreshes the list', async () => {
  markAllNotificationsRead.mockResolvedValue({ updated: 1 });
  getNotifications.mockResolvedValueOnce({ items: [notification], meta });
  getNotifications.mockResolvedValue({ items: [{ ...notification, isRead: true }], meta });
  renderNotifications();

  expect(await screen.findByText('Unread')).toBeInTheDocument();
  fireEvent.click(screen.getByRole('button', { name: 'Mark all as read' }));

  await waitFor(() => expect(screen.queryByText('Unread')).not.toBeInTheDocument());
  expect(markAllNotificationsRead).toHaveBeenCalledTimes(1);
  expect(getNotifications).toHaveBeenCalledTimes(2);
});

it('paginates and returns to page one when filtering unread notifications', async () => {
  getNotifications.mockImplementation(async ({ page, unread }) => ({
    items: unread ? [] : [notification],
    meta: { ...meta, page, totalPages: unread ? 1 : 2 },
  }));
  renderNotifications();

  fireEvent.click(await screen.findByRole('button', { name: 'Next' }));
  expect(await screen.findByText('Page 2 of 2')).toBeInTheDocument();
  fireEvent.click(screen.getByRole('checkbox', { name: 'Unread only' }));

  expect(await screen.findByText('You have no unread notifications')).toBeInTheDocument();
  expect(getNotifications).toHaveBeenLastCalledWith({ page: 1, limit: 12, unread: true });
});
