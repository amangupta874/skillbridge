import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { createProject, getProject } from '../api/projects.js';
import { getLookups } from '../api/lookups.js';
import { getSkills } from '../api/skills.js';
import ProjectFormPage from './ProjectFormPage.jsx';

vi.mock('../api/projects.js', () => ({
  createProject: vi.fn(),
  getProject: vi.fn(),
  getProjects: vi.fn(),
  updateProject: vi.fn(),
}));
vi.mock('../api/lookups.js', () => ({ getLookups: vi.fn() }));
vi.mock('../api/skills.js', () => ({ getSkills: vi.fn() }));

function renderForm(path = '/projects/new') {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter initialEntries={[path]}>
        <Routes>
          <Route path="/projects/new" element={<ProjectFormPage />} />
          <Route path="/projects/:id/edit" element={<ProjectFormPage edit />} />
          <Route path="/projects/:id" element={<p>Project saved</p>} />
        </Routes>
      </MemoryRouter>
    </QueryClientProvider>,
  );
}

describe('ProjectFormPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    getLookups.mockResolvedValue({ projectCategories: [{ id: 1, name: 'Community' }] });
    getSkills.mockResolvedValue([{ id: 7, name: 'React', category: { id: 1, name: 'Web' } }]);
    createProject.mockResolvedValue({ id: 'new-project' });
  });

  it('shows validation errors for the required project fields', async () => {
    renderForm();
    fireEvent.click(await screen.findByRole('button', { name: 'Publish' }));

    expect(await screen.findByText('Use at least 5 characters')).toBeInTheDocument();
    expect(screen.getByText('Use at least 20 characters')).toBeInTheDocument();
    expect(screen.getByText('Add at least one required skill')).toBeInTheDocument();
    expect(createProject).not.toHaveBeenCalled();
  });

  it('sends the chosen deadline as a full ISO timestamp', async () => {
    renderForm();
    await screen.findByRole('option', { name: 'Community' });
    fireEvent.change(await screen.findByLabelText(/Project title/), { target: { value: 'Campus garden app' } });
    fireEvent.change(screen.getByLabelText(/Description/), { target: { value: 'A shared app for planning the campus garden.' } });
    const category = screen.getByLabelText(/Category/);
    fireEvent.change(category, { target: { value: '1' } });
    expect(category).toHaveValue('1');
    fireEvent.change(screen.getByLabelText(/Deadline/), { target: { value: '2099-01-01' } });
    fireEvent.change(screen.getByPlaceholderText(/Type to search skills/), { target: { value: 'React' } });
    fireEvent.click(await screen.findByRole('button', { name: /React/ }));
    fireEvent.click(screen.getByRole('button', { name: 'Publish' }));

    await waitFor(() => expect(createProject).toHaveBeenCalledWith(expect.objectContaining({
      deadline: '2099-01-01T00:00:00.000Z',
      status: 'OPEN',
      skills: [{ skillId: 7, minLevel: 'INTERMEDIATE' }],
    })));
    expect(await screen.findByText('Project saved')).toBeInTheDocument();
  });

  it('blocks edit mode for a project that belongs to someone else', async () => {
    getProject.mockResolvedValue({ id: 'project-1', status: 'OPEN', myRole: 'NONE' });
    renderForm('/projects/project-1/edit');

    expect(await screen.findByRole('heading', { name: 'You are not allowed to edit this project' })).toBeInTheDocument();
  });
});
