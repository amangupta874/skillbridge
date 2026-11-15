import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { getProject, updateProject } from '../api/projects.js';
import { ToastProvider } from '../components/Toast.jsx';
import ProjectDetailPage from './ProjectDetailPage.jsx';

vi.mock('../api/projects.js', () => ({
  createProject: vi.fn(),
  getProject: vi.fn(),
  getProjects: vi.fn(),
  updateProject: vi.fn(),
}));

const baseProject = {
  id: 'project-1',
  title: 'Campus garden app',
  description: 'A shared app for planning the campus garden.',
  category: { id: 1, name: 'Community' },
  difficulty: 'BEGINNER',
  status: 'OPEN',
  maxTeamSize: 4,
  seatsTaken: 1,
  seatsLeft: 3,
  skills: [{ id: 7, name: 'React', minLevel: 'BEGINNER' }],
  owner: { id: 'owner-1', fullName: 'Avery Lee' },
  members: [],
  myRole: 'OWNER',
};

function renderDetail() {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={queryClient}>
      <ToastProvider>
        <MemoryRouter initialEntries={['/projects/project-1']}>
          <Routes><Route path="/projects/:id" element={<ProjectDetailPage />} /></Routes>
        </MemoryRouter>
      </ToastProvider>
    </QueryClientProvider>,
  );
}

describe('project status controls', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    getProject.mockResolvedValue(baseProject);
    updateProject.mockResolvedValue({ ...baseProject, status: 'IN_PROGRESS' });
  });

  it.each([
    ['DRAFT', ['Open', 'Archived']],
    ['OPEN', ['In progress', 'Archived']],
    ['IN_PROGRESS', ['Completed', 'Archived']],
    ['COMPLETED', ['Archived']],
    ['ARCHIVED', []],
  ])('shows only allowed buttons for %s', async (status, allowedLabels) => {
    getProject.mockResolvedValue({ ...baseProject, status });
    renderDetail();

    await screen.findByRole('heading', { name: baseProject.title });
    for (const label of allowedLabels) expect(screen.getByRole('button', { name: label })).toBeInTheDocument();
    expect(screen.getAllByRole('button').filter((button) => ['Open', 'In progress', 'Completed', 'Archived'].includes(button.textContent))).toHaveLength(allowedLabels.length);
  });

  it('asks for confirmation before patching a status', async () => {
    renderDetail();
    fireEvent.click(await screen.findByRole('button', { name: 'In progress' }));

    expect(screen.getByRole('alertdialog')).toBeInTheDocument();
    expect(updateProject).not.toHaveBeenCalled();
    fireEvent.click(screen.getByRole('button', { name: 'Set to In progress' }));

    await waitFor(() => expect(updateProject).toHaveBeenCalledWith('project-1', { status: 'IN_PROGRESS' }));
  });
});
