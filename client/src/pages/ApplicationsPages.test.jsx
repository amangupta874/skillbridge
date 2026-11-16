import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { applyToProject, getMyApplications } from '../api/applications.js';
import { getProject } from '../api/projects.js';
import { ApiError } from '../api/client.js';
import { ToastProvider } from '../components/Toast.jsx';
import ProjectDetailPage from './ProjectDetailPage.jsx';
import ApplicationsPage from './ApplicationsPage.jsx';

vi.mock('../api/projects.js', () => ({ getProject: vi.fn(), updateProject: vi.fn() }));
vi.mock('../api/applications.js', () => ({
  applyToProject: vi.fn(),
  getMyApplications: vi.fn(),
  getProjectApplications: vi.fn(),
  updateApplicationStatus: vi.fn(),
}));

const project = {
  id: 'project-1', title: 'Campus garden app', description: 'A project for students working on a campus garden.',
  category: { id: 1, name: 'Community' }, difficulty: 'BEGINNER', status: 'OPEN', maxTeamSize: 3,
  seatsTaken: 1, seatsLeft: 2, isFull: false, skills: [], owner: { id: 'owner-1', fullName: 'Casey Owner' },
  members: [], myRole: 'NONE', myApplication: null,
};
const emptyPage = { items: [], meta: { page: 1, limit: 12, total: 0, totalPages: 1 } };

function renderWithRoute(path, component) {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={client}>
      <ToastProvider>
        <MemoryRouter initialEntries={[path]}>
          <Routes>
            <Route path="/projects/:id" element={component} />
            <Route path="/applications" element={component} />
          </Routes>
        </MemoryRouter>
      </ToastProvider>
    </QueryClientProvider>,
  );
}

describe('project application actions', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    getProject.mockResolvedValue(project);
    applyToProject.mockResolvedValue({ id: 'application-1', status: 'PENDING' });
  });

  it('shows Apply only when the caller may apply', async () => {
    renderWithRoute('/projects/project-1', <ProjectDetailPage />);
    expect(await screen.findByRole('button', { name: 'Apply' })).toBeInTheDocument();
  });

  it.each([
    [{ ...project, myRole: 'OWNER' }, 'View applications'],
    [{ ...project, myApplication: { id: 'a1', status: 'PENDING' } }, 'Withdraw application'],
    [{ ...project, myApplication: { id: 'a1', status: 'WITHDRAWN' } }, 'Apply'],
    [{ ...project, myApplication: { id: 'a1', status: 'ACCEPTED' } }, 'Accepted'],
    [{ ...project, myApplication: { id: 'a1', status: 'REJECTED' } }, 'Rejected'],
    [{ ...project, isFull: true, seatsLeft: 0 }, 'This project is full.'],
    [{ ...project, status: 'IN_PROGRESS' }, 'This project is not accepting applications.'],
  ])('shows the right action for the current project and application state', async (projectState, expectedText) => {
    getProject.mockResolvedValue(projectState);
    renderWithRoute('/projects/project-1', <ProjectDetailPage />);
    expect(await screen.findByText(expectedText)).toBeInTheDocument();
  });

  it('sends an application message and displays a server field error', async () => {
    applyToProject.mockRejectedValueOnce(new ApiError({
      status: 400,
      code: 'VALIDATION_ERROR',
      message: 'Please correct the submitted fields.',
      details: { 'body.message': ['The message must be 10 to 500 characters'] },
    }));
    renderWithRoute('/projects/project-1', <ProjectDetailPage />);
    fireEvent.click(await screen.findByRole('button', { name: 'Apply' }));
    fireEvent.change(await screen.findByLabelText(/Message to the project owner/), { target: { value: 'I can help build the garden app.' } });
    fireEvent.click(screen.getByRole('button', { name: 'Send application' }));

    await waitFor(() => expect(applyToProject).toHaveBeenCalledWith('project-1', 'I can help build the garden app.'));
    expect(await screen.findByText('The message must be 10 to 500 characters')).toBeInTheDocument();
  });
});

describe('ApplicationsPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    getMyApplications.mockResolvedValue(emptyPage);
  });

  it('shows the empty state with a link to browse projects', async () => {
    renderWithRoute('/applications', <ApplicationsPage />);

    expect(await screen.findByText('You have not applied to any project yet')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Browse projects' })).toBeInTheDocument();
  });
});
