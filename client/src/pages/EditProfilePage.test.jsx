import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import EditProfilePage from './EditProfilePage.jsx';
import { ToastProvider } from '../components/Toast.jsx';
import * as UsersApi from '../api/users.js';
import * as LookupsApi from '../api/lookups.js';
import * as SkillsApi from '../api/skills.js';
import * as AuthContextModule from '../context/AuthContext.jsx';
import { ApiError } from '../api/client.js';

vi.mock('../api/users.js', () => ({
  getUserById: vi.fn(),
  updateProfile: vi.fn(),
  updateSkills: vi.fn(),
  updateLearningGoals: vi.fn(),
}));

vi.mock('../api/lookups.js', () => ({
  getLookups: vi.fn(),
}));

vi.mock('../api/skills.js', () => ({
  getSkills: vi.fn(),
}));

vi.mock('../context/AuthContext.jsx', () => ({
  useAuth: vi.fn(),
}));

const mockUser = {
  id: 1,
  fullName: 'Alice Chen',
  bio: 'Initial bio text.',
  weeklyHours: 12,
  college: { id: 1, name: 'SVYASA University' },
  links: [{ type: 'github', url: 'https://github.com/alice' }],
  skills: [{ skill: { id: 1, name: 'React' }, level: 'ADVANCED' }],
  learningGoals: [{ id: 5, name: 'Docker' }],
  interests: [{ id: 1, name: 'Open Source' }],
};

const mockLookups = {
  colleges: [
    { id: 1, name: 'SVYASA University' },
    { id: 2, name: 'MIT World Peace University' },
  ],
  interests: [
    { id: 1, name: 'Open Source' },
    { id: 2, name: 'Web Development' },
  ],
};

function renderWithProviders() {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
      },
    },
  });

  return render(
    <QueryClientProvider client={queryClient}>
      <ToastProvider>
        <MemoryRouter initialEntries={['/profile/edit']}>
          <Routes>
            <Route path="/profile/edit" element={<EditProfilePage />} />
            <Route path="/users/:id" element={<div>Public Profile Destination</div>} />
          </Routes>
        </MemoryRouter>
      </ToastProvider>
    </QueryClientProvider>,
  );
}

describe('EditProfilePage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.spyOn(AuthContextModule, 'useAuth').mockReturnValue({
      user: { id: 1, fullName: 'Alice Chen' },
    });
    vi.spyOn(UsersApi, 'getUserById').mockResolvedValue(mockUser);
    vi.spyOn(UsersApi, 'updateProfile').mockResolvedValue(mockUser);
    vi.spyOn(UsersApi, 'updateSkills').mockResolvedValue(mockUser);
    vi.spyOn(UsersApi, 'updateLearningGoals').mockResolvedValue(mockUser);
    vi.spyOn(LookupsApi, 'getLookups').mockResolvedValue(mockLookups);
    vi.spyOn(SkillsApi, 'getSkills').mockResolvedValue([]);
  });

  it('renders all 5 profile sections with preloaded user data', async () => {
    renderWithProviders();

    await waitFor(() => {
      expect(screen.getByText('1. Basic Information')).toBeInTheDocument();
      expect(screen.getByText('2. Links')).toBeInTheDocument();
      expect(screen.getByText('3. Interests')).toBeInTheDocument();
      expect(screen.getByText('4. Known Skills & Proficiency')).toBeInTheDocument();
      expect(screen.getByText('5. Learning Goals')).toBeInTheDocument();
    });

    expect(screen.getByDisplayValue('Alice Chen')).toBeInTheDocument();
    expect(screen.getByDisplayValue('Initial bio text.')).toBeInTheDocument();
    expect(screen.getByDisplayValue('12')).toBeInTheDocument();
  });

  it('updates basic information independently', async () => {
    renderWithProviders();

    await waitFor(() => {
      expect(screen.getByDisplayValue('Alice Chen')).toBeInTheDocument();
    });

    const nameInput = screen.getByLabelText(/full name/i);
    fireEvent.change(nameInput, { target: { value: 'Alice M. Chen' } });

    const saveBasicBtn = screen.getByRole('button', { name: /save basic info/i });
    fireEvent.click(saveBasicBtn);

    await waitFor(() => {
      expect(UsersApi.updateProfile).toHaveBeenCalledWith({
        fullName: 'Alice M. Chen',
        bio: 'Initial bio text.',
        weeklyHours: 12,
        collegeId: 1,
      });
      expect(screen.getByText(/basic information saved successfully/i)).toBeInTheDocument();
    });
  });

  it('toggles and saves interests independently', async () => {
    renderWithProviders();

    await waitFor(() => {
      expect(screen.getByText('Web Development')).toBeInTheDocument();
    });

    // Click on unselected interest 'Web Development'
    fireEvent.click(screen.getByText('Web Development'));

    const saveInterestsBtn = screen.getByRole('button', { name: /save interests/i });
    fireEvent.click(saveInterestsBtn);

    await waitFor(() => {
      expect(UsersApi.updateProfile).toHaveBeenCalledWith({
        interestIds: [1, 2],
      });
      expect(screen.getByText(/interests saved successfully/i)).toBeInTheDocument();
    });
  });

  it('adds and saves external links', async () => {
    renderWithProviders();

    await waitFor(() => {
      expect(screen.getByDisplayValue('https://github.com/alice')).toBeInTheDocument();
    });

    const addLinkBtn = screen.getByRole('button', { name: /\+ add link/i });
    fireEvent.click(addLinkBtn);

    const inputs = screen.getAllByPlaceholderText('https://...');
    expect(inputs.length).toBe(2);

    fireEvent.change(inputs[1], { target: { value: 'https://linkedin.com/in/alice' } });

    const saveLinksBtn = screen.getByRole('button', { name: /save links/i });
    fireEvent.click(saveLinksBtn);

    await waitFor(() => {
      expect(UsersApi.updateProfile).toHaveBeenCalledWith({
        links: [
          { type: 'github', url: 'https://github.com/alice' },
          { type: 'github', url: 'https://linkedin.com/in/alice' },
        ],
      });
      expect(screen.getByText(/profile links saved successfully/i)).toBeInTheDocument();
    });
  });

  it('shows a profile save error without a success message', async () => {
    vi.spyOn(UsersApi, 'updateProfile').mockRejectedValue(
      new ApiError({ status: 500, code: 'INTERNAL_ERROR', message: 'Profile could not be saved' }),
    );
    renderWithProviders();

    await waitFor(() => expect(screen.getByDisplayValue('Alice Chen')).toBeInTheDocument());
    fireEvent.click(screen.getByRole('button', { name: /save basic info/i }));

    expect(await screen.findByRole('alert')).toHaveTextContent('Profile could not be saved');
    expect(screen.queryByText(/basic information saved successfully/i)).not.toBeInTheDocument();
  });

  it('shows a lookup error instead of fallback options', async () => {
    vi.spyOn(LookupsApi, 'getLookups').mockRejectedValue(
      new ApiError({ status: 503, code: 'UNAVAILABLE', message: 'Lookup service is unavailable' }),
    );
    renderWithProviders();

    expect(await screen.findByRole('alert')).toHaveTextContent('Lookup service is unavailable');
    expect(screen.queryByRole('option', { name: 'MIT World Peace University' })).not.toBeInTheDocument();
  });

  it('shows a skill search error instead of fallback skills', async () => {
    vi.spyOn(SkillsApi, 'getSkills').mockRejectedValue(
      new ApiError({ status: 503, code: 'UNAVAILABLE', message: 'Skill search is unavailable' }),
    );
    renderWithProviders();

    await waitFor(() => expect(screen.getByDisplayValue('Alice Chen')).toBeInTheDocument());
    const [skillInput] = screen.getAllByPlaceholderText(/type to search skills/i);
    fireEvent.change(skillInput, { target: { value: 'rust' } });

    expect(await screen.findByRole('alert')).toHaveTextContent('Skill search is unavailable');
    expect(screen.queryByRole('button', { name: /rust/i })).not.toBeInTheDocument();
  });
});
