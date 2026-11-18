import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { getProjectMatches } from '../api/matches.js';
import { getProject } from '../api/projects.js';
import ProjectMatchesPage from './ProjectMatchesPage.jsx';

vi.mock('../api/matches.js', () => ({ getProjectMatches: vi.fn() }));
vi.mock('../api/projects.js', () => ({ getProject: vi.fn() }));

function renderMatches() {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  render(
    <QueryClientProvider client={client}>
      <MemoryRouter initialEntries={['/projects/project-1/matches']}>
        <Routes><Route path="/projects/:id/matches" element={<ProjectMatchesPage />} /></Routes>
      </MemoryRouter>
    </QueryClientProvider>,
  );
}

describe('ProjectMatchesPage', () => {
  beforeEach(() => {
    vi.resetAllMocks();
    getProject.mockResolvedValue({ title: 'Campus garden app', myRole: 'OWNER' });
  });

  it('shows the candidate, score, breakdown bars and reasons', async () => {
    getProjectMatches.mockResolvedValue([{
      user: {
        id: 'student-1',
        fullName: 'Jordan Kim',
        college: { id: 3, name: 'North College' },
        topSkills: [{ skill: { id: 7, name: 'React' }, level: 'ADVANCED' }],
      },
      score: 53,
      breakdown: { coverage: 50, proficiency: 50, gapFill: 100, learning: 33.3 },
      reasons: ['Knows React', 'Wants to learn CSS'],
    }]);
    renderMatches();

    expect(await screen.findByRole('link', { name: 'Jordan Kim' })).toHaveAttribute('href', '/users/student-1');
    expect(screen.getByText('North College')).toBeInTheDocument();
    expect(screen.getByText('Advanced')).toBeInTheDocument();
    expect(screen.getByText('53')).toBeInTheDocument();
    expect(screen.getAllByRole('meter')).toHaveLength(5);
    expect(screen.getByRole('meter', { name: /Required skills/ })).toHaveAttribute('value', '50');
    expect(screen.getByRole('meter', { name: /Skill level/ })).toHaveAttribute('value', '50');
    expect(screen.getByRole('meter', { name: /Fills a gap/ })).toHaveAttribute('value', '100');
    expect(screen.getByRole('meter', { name: /Wants to learn/ })).toHaveAttribute('value', '33.3');
    expect(screen.getAllByRole('listitem').map((reason) => reason.textContent)).toEqual(['Knows React', 'Wants to learn CSS']);
    expect(getProjectMatches).toHaveBeenCalledWith('project-1');
  });

  it('explains what to check when there are no matches', async () => {
    getProjectMatches.mockResolvedValue([]);
    renderMatches();

    expect(await screen.findByText('No matching students yet')).toBeInTheDocument();
    expect(screen.getByText('Check the required skills of your project')).toBeInTheDocument();
  });

  it('blocks non-owners before requesting matches', async () => {
    getProject.mockResolvedValue({ myRole: 'MEMBER' });
    renderMatches();

    expect(await screen.findByText('You are not allowed to view these matches')).toBeInTheDocument();
    expect(getProjectMatches).not.toHaveBeenCalled();
  });
});
