import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import PublicProfilePage from './PublicProfilePage.jsx';
import * as UsersApi from '../api/users.js';
import * as AuthContextModule from '../context/AuthContext.jsx';
import { ApiError } from '../api/client.js';

vi.mock('../api/users.js', () => ({
  getUserById: vi.fn(),
  getUsers: vi.fn(),
}));

vi.mock('../context/AuthContext.jsx', () => ({
  useAuth: vi.fn(),
}));

const mockUser = {
  id: 1,
  fullName: 'Alice Chen',
  bio: 'Passionate student developer and open source enthusiast.',
  weeklyHours: 15,
  college: { id: 1, name: 'SVYASA University' },
  links: [
    { type: 'github', url: 'https://github.com/alice-chen' },
    { type: 'portfolio', url: 'https://alicechen.dev' },
  ],
  skills: [
    { skill: { id: 1, name: 'React', category: { id: 1, name: 'Frontend' } }, level: 'ADVANCED' },
    { skill: { id: 2, name: 'Node.js', category: { id: 2, name: 'Backend' } }, level: 'INTERMEDIATE' },
  ],
  learningGoals: [
    { id: 5, name: 'Docker' },
    { id: 6, name: 'GraphQL' },
  ],
  interests: [
    { id: 1, name: 'Open Source' },
    { id: 2, name: 'Web Development' },
  ],
  createdAt: '2026-10-15T10:00:00.000Z',
};

function renderWithProviders(ui, { route = '/users/1' } = {}) {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
      },
    },
  });

  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter initialEntries={[route]}>
        <Routes>
          <Route path="/users/:id" element={ui} />
          <Route path="/people" element={<div>People Directory</div>} />
          <Route path="/profile/edit" element={<div>Edit Profile Page</div>} />
        </Routes>
      </MemoryRouter>
    </QueryClientProvider>,
  );
}

describe('PublicProfilePage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders student profile information correctly', async () => {
    vi.spyOn(AuthContextModule, 'useAuth').mockReturnValue({
      user: { id: 2, fullName: 'Bob Smith' },
    });
    vi.spyOn(UsersApi, 'getUserById').mockResolvedValue(mockUser);

    renderWithProviders(<PublicProfilePage />, { route: '/users/1' });

    // Shows loading initially
    expect(screen.getByTestId('profile-loading')).toBeInTheDocument();

    // Renders loaded details
    await waitFor(() => {
      expect(screen.getByTestId('profile-name')).toHaveTextContent('Alice Chen');
    });

    expect(screen.getByText('SVYASA University')).toBeInTheDocument();
    expect(screen.getByText(/15 hrs\/week available/)).toBeInTheDocument();
    expect(screen.getByText('Passionate student developer and open source enthusiast.')).toBeInTheDocument();

    // Skills
    expect(screen.getByText('React')).toBeInTheDocument();
    expect(screen.getByText('ADVANCED')).toBeInTheDocument();
    expect(screen.getByText('Node.js')).toBeInTheDocument();

    // Goals and interests
    expect(screen.getByText('Docker')).toBeInTheDocument();
    expect(screen.getByText('GraphQL')).toBeInTheDocument();
    expect(screen.getByText('Open Source')).toBeInTheDocument();
    expect(screen.getByText('Web Development')).toBeInTheDocument();

    // Links
    expect(screen.getByText('https://github.com/alice-chen')).toBeInTheDocument();
  });

  it('shows "Request skill exchange" button when viewing another student profile', async () => {
    vi.spyOn(AuthContextModule, 'useAuth').mockReturnValue({
      user: { id: 2, fullName: 'Bob Smith' }, // different user
    });
    vi.spyOn(UsersApi, 'getUserById').mockResolvedValue(mockUser);

    renderWithProviders(<PublicProfilePage />, { route: '/users/1' });

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /request skill exchange/i })).toBeInTheDocument();
    });

    expect(screen.queryByRole('button', { name: /edit profile/i })).not.toBeInTheDocument();
  });

  it('shows "Edit Profile" and hides exchange button when viewing own profile', async () => {
    vi.spyOn(AuthContextModule, 'useAuth').mockReturnValue({
      user: { id: 1, fullName: 'Alice Chen' }, // same user
    });
    vi.spyOn(UsersApi, 'getUserById').mockResolvedValue(mockUser);

    renderWithProviders(<PublicProfilePage />, { route: '/users/1' });

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /edit profile/i })).toBeInTheDocument();
    });

    expect(screen.queryByRole('button', { name: /request skill exchange/i })).not.toBeInTheDocument();
  });

  it('renders error banner when API call fails', async () => {
    vi.spyOn(AuthContextModule, 'useAuth').mockReturnValue({
      user: { id: 2, fullName: 'Bob Smith' },
    });
    vi.spyOn(UsersApi, 'getUserById').mockRejectedValue(
      new ApiError({
        status: 500,
        code: 'INTERNAL_ERROR',
        message: 'Failed to fetch student profile',
      }),
    );

    renderWithProviders(<PublicProfilePage />, { route: '/users/1' });

    await waitFor(() => {
      expect(screen.getByRole('alert')).toHaveTextContent('Failed to fetch student profile');
    });

    expect(screen.getByRole('button', { name: /retry/i })).toBeInTheDocument();
  });

  it('renders empty state when user profile is null or not found', async () => {
    vi.spyOn(AuthContextModule, 'useAuth').mockReturnValue({
      user: { id: 2, fullName: 'Bob Smith' },
    });
    vi.spyOn(UsersApi, 'getUserById').mockResolvedValue(null);

    renderWithProviders(<PublicProfilePage />, { route: '/users/999' });

    await waitFor(() => {
      expect(screen.getByText('Student not found')).toBeInTheDocument();
    });
  });
});

