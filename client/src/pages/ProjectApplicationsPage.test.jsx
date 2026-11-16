import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { getProject } from '../api/projects.js';
import { getProjectApplications } from '../api/applications.js';
import { ToastProvider } from '../components/Toast.jsx';
import ProjectApplicationsPage from './ProjectApplicationsPage.jsx';

vi.mock('../api/projects.js', () => ({ getProject: vi.fn() }));
vi.mock('../api/applications.js', () => ({
  applyToProject: vi.fn(),
  getMyApplications: vi.fn(),
  getProjectApplications: vi.fn(),
  updateApplicationStatus: vi.fn(),
}));

const project = { id: 'project-1', title: 'Campus garden app', myRole: 'OWNER', seatsLeft: 2, seatsTaken: 1, maxTeamSize: 3 };
const pending = {
  id: 'application-1',
  projectId: 'project-1',
  project: { id: 'project-1', title: project.title },
  applicant: {
    id: 'student-1',
    fullName: 'Jordan Kim',
    college: { id: 3, name: 'North College' },
    topSkills: [{ skill: { id: 2, name: 'React' }, level: 'ADVANCED' }],
  },
  message: 'I would like to help build the app.',
  status: 'PENDING',
  createdAt: '2026-11-15T10:00:00.000Z',
  allowedTransitions: ['ACCEPTED', 'REJECTED'],
};

function renderApplications() {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={client}>
      <ToastProvider>
        <MemoryRouter initialEntries={['/projects/project-1/applications']}>
          <Routes><Route path="/projects/:id/applications" element={<ProjectApplicationsPage />} /></Routes>
        </MemoryRouter>
      </ToastProvider>
    </QueryClientProvider>,
  );
}

describe('ProjectApplicationsPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    getProject.mockResolvedValue(project);
    getProjectApplications.mockResolvedValue({ items: [pending], meta: { page: 1, limit: 12, total: 1, totalPages: 1 } });
  });

  it('shows applicant details and decision actions only for pending applications', async () => {
    renderApplications();

    expect(await screen.findByText('Jordan Kim')).toBeInTheDocument();
    expect(screen.getByText('North College')).toBeInTheDocument();
    expect(screen.getByText('I would like to help build the app.')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Accept' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Reject' })).toBeInTheDocument();
  });

  it('hides decision actions when transitions do not allow them', async () => {
    getProjectApplications.mockResolvedValue({
      items: [{ ...pending, status: 'ACCEPTED', allowedTransitions: [] }],
      meta: { page: 1, limit: 12, total: 1, totalPages: 1 },
    });
    renderApplications();

    expect(await screen.findByText('Accepted')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Accept' })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Reject' })).not.toBeInTheDocument();
  });

  it('blocks a non-owner from opening the application queue', async () => {
    getProject.mockResolvedValue({ ...project, myRole: 'NONE' });
    renderApplications();

    expect(await screen.findByText('You are not allowed to view these applications')).toBeInTheDocument();
    expect(getProjectApplications).not.toHaveBeenCalled();
  });
});
