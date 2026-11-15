import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter, Route, Routes, useLocation } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { getProjects } from '../api/projects.js';
import { getLookups } from '../api/lookups.js';
import { getSkills } from '../api/skills.js';
import ProjectCard from '../components/ProjectCard.jsx';
import ProjectsPage from './ProjectsPage.jsx';

vi.mock('../api/projects.js', () => ({
  getProjects: vi.fn(),
  getProject: vi.fn(),
}));
vi.mock('../api/lookups.js', () => ({ getLookups: vi.fn() }));
vi.mock('../api/skills.js', () => ({ getSkills: vi.fn() }));

const project = {
  id: 'project-1',
  title: 'Campus garden app',
  summary: 'A shared tool for planning a campus garden.',
  category: { id: 1, name: 'Community' },
  difficulty: 'ADVANCED',
  status: 'OPEN',
  maxTeamSize: 4,
  seatsTaken: 2,
  seatsLeft: 2,
  isFull: false,
  skills: [{ id: 7, name: 'React', minLevel: 'INTERMEDIATE' }],
  owner: { id: 'owner-1', fullName: 'Avery Lee' },
  createdAt: '2026-11-14T10:00:00.000Z',
};

function renderProjects(initialEntry = '/projects') {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  function CurrentUrl() {
    const location = useLocation();
    return <output data-testid="current-url">{location.search}</output>;
  }
  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter initialEntries={[initialEntry]}>
        <CurrentUrl />
        <Routes><Route path="/projects" element={<ProjectsPage />} /></Routes>
      </MemoryRouter>
    </QueryClientProvider>,
  );
}

describe('project discovery', () => {
  beforeEach(() => {
    getProjects.mockResolvedValue({ items: [], meta: { page: 1, limit: 12, total: 0, totalPages: 0 } });
    getLookups.mockResolvedValue({ projectCategories: [{ id: 1, name: 'Community' }] });
    getSkills.mockResolvedValue([{ id: 7, name: 'React' }]);
  });

  it('shows the card seats left and badges', () => {
    render(
      <MemoryRouter>
        <ProjectCard project={project} />
      </MemoryRouter>,
    );

    expect(screen.getByText('2 seats left')).toBeInTheDocument();
    expect(screen.getByText('OPEN')).toBeInTheDocument();
    expect(screen.getByText('ADVANCED')).toBeInTheDocument();
    expect(screen.getByText('INTERMEDIATE')).toBeInTheDocument();
  });

  it('shows an empty state with a clear filters button', async () => {
    renderProjects('/projects?query=missing');

    expect(await screen.findByText('No projects match your filters')).toBeInTheDocument();
    fireEvent.click(screen.getAllByRole('button', { name: 'Clear filters' }).at(-1));
    await waitFor(() => expect(screen.getByTestId('current-url')).toHaveTextContent(''));
  });

  it('shows an API error and retries the request', async () => {
    getProjects.mockRejectedValueOnce(new Error('Projects could not load'));
    renderProjects();

    expect(await screen.findByRole('alert')).toHaveTextContent('Projects could not load');
    fireEvent.click(screen.getByRole('button', { name: 'Retry' }));
    expect(await screen.findByText('No projects match your filters')).toBeInTheDocument();
    expect(getProjects).toHaveBeenCalledTimes(2);
  });

  it('keeps changed filters in the query string', async () => {
    renderProjects();
    const search = screen.getByRole('searchbox', { name: 'Search projects' });
    fireEvent.change(search, { target: { value: 'react' } });

    await waitFor(() => expect(screen.getByTestId('current-url')).toHaveTextContent('?query=react'));
  });
});
