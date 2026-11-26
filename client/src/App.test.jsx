import { describe, it, expect, vi, beforeEach } from 'vitest';
import { fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import App, { createQueryClient } from './App.jsx';
import * as authApi from './api/auth.js';
import { getNotifications } from './api/notifications.js';

vi.mock('./api/auth.js', () => ({
  getCurrentUser: vi.fn(),
  login: vi.fn(),
  register: vi.fn(),
  logout: vi.fn(),
}));

vi.mock('./api/notifications.js', () => ({
  getUnreadCount: vi.fn().mockResolvedValue({ count: 0 }),
  getNotifications: vi.fn(),
  markNotificationRead: vi.fn(),
}));

vi.mock('./api/applications.js', () => ({ getMyApplications: vi.fn().mockResolvedValue({ items: [] }) }));
vi.mock('./api/exchanges.js', () => ({ getExchanges: vi.fn().mockResolvedValue({ items: [] }) }));
vi.mock('./api/projects.js', () => ({ getProjects: vi.fn().mockResolvedValue({ items: [] }) }));
vi.mock('./api/users.js', () => ({ getUserById: vi.fn().mockResolvedValue({ skills: [] }) }));

describe('App Root and Navigation', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    window.history.pushState({}, '', '/');
  });

  it('redirects anonymous user to /login and displays branding', async () => {
    vi.spyOn(authApi, 'getCurrentUser').mockResolvedValue(null);

    render(<App client={createQueryClient()} />);

    // Shows loading spinner first
    expect(screen.getByRole('status', { name: /loading/i })).toBeInTheDocument();

    // After resolving, redirects to /login and shows auth layout
    await waitFor(() => {
      expect(screen.getByRole('heading', { name: /sign in to your account/i })).toBeInTheDocument();
    });

    expect(screen.getByRole('link', { name: 'SkillBridge' })).toBeInTheDocument();
  });

  it('renders navbar and dashboard when user is logged in', async () => {
    vi.spyOn(authApi, 'getCurrentUser').mockResolvedValue({
      id: 1,
      fullName: 'Alice Student',
      email: 'alice@example.com',
    });

    getNotifications.mockResolvedValue({
      items: [{
        id: 'notification-1',
        message: 'Jordan applied to Campus garden app',
        createdAt: '2026-11-18T08:00:00Z',
        isRead: false,
        link: '/projects/project-1/applications',
      }],
      meta: { page: 1, limit: 5, total: 1, totalPages: 1 },
    });
    render(<App client={createQueryClient()} />);

    await waitFor(() => {
      expect(screen.getByRole('link', { name: 'SkillBridge' })).toBeInTheDocument();
      expect(screen.getByRole('link', { name: 'Dashboard' })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /log out/i })).toBeInTheDocument();
    });
    expect(await screen.findByRole('link', { name: /Jordan applied/ })).toHaveAttribute('href', '/projects/project-1/applications');
    expect(getNotifications).toHaveBeenCalledWith({ page: 1, limit: 5 });
  });

  it('expands and collapses mobile navigation', async () => {
    authApi.getCurrentUser.mockResolvedValue({ id: 'student', fullName: 'Alice Student' });
    render(<App client={createQueryClient()} />);

    const menu = await screen.findByRole('button', { name: 'Toggle navigation menu' });
    expect(menu).toHaveAttribute('aria-expanded', 'false');
    expect(screen.queryByRole('navigation', { name: 'Mobile navigation' })).not.toBeInTheDocument();

    fireEvent.click(menu);
    expect(menu).toHaveAttribute('aria-expanded', 'true');
    const navigation = screen.getByRole('navigation', { name: 'Mobile navigation' });
    expect(navigation).toHaveAttribute('id', menu.getAttribute('aria-controls'));
    expect(within(navigation).getByRole('link', { name: 'Dashboard' })).toBeInTheDocument();

    fireEvent.click(menu);
    expect(menu).toHaveAttribute('aria-expanded', 'false');
  });

  it.each([
    ['/login', 'Sign in to your account', 'Sign in'],
    ['/register', 'Create an account', 'Register'],
    ['/unknown', '404 · Page not found', 'Page not found'],
  ])('sets the document title for %s', async (path, heading, title) => {
    authApi.getCurrentUser.mockResolvedValue(null);
    window.history.replaceState({}, '', path);
    render(<App client={createQueryClient()} />);

    expect(await screen.findByRole('heading', { name: heading, level: 1 })).toBeInTheDocument();
    expect(document.title).toBe(`${title} | SkillBridge`);
  });
});
