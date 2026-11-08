import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import App, { createQueryClient } from './App.jsx';
import * as authApi from './api/auth.js';

vi.mock('./api/auth.js', () => ({
  getCurrentUser: vi.fn(),
  login: vi.fn(),
  register: vi.fn(),
  logout: vi.fn(),
}));

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

    render(<App client={createQueryClient()} />);

    await waitFor(() => {
      expect(screen.getByRole('link', { name: 'SkillBridge' })).toBeInTheDocument();
      expect(screen.getByRole('link', { name: 'Dashboard' })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /log out/i })).toBeInTheDocument();
    });
  });
});
