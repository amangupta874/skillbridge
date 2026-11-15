import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { fireEvent, render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { getProjects } from '../api/projects.js';
import MyProjectsPage from './MyProjectsPage.jsx';

vi.mock('../api/projects.js', () => ({
  createProject: vi.fn(),
  getProject: vi.fn(),
  getProjects: vi.fn(),
  updateProject: vi.fn(),
}));

describe('MyProjectsPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    getProjects.mockResolvedValue({ items: [], meta: { page: 1, limit: 12, total: 0, totalPages: 1 } });
  });

  it('shows the empty message for each tab', async () => {
    const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    render(
      <QueryClientProvider client={queryClient}>
        <MemoryRouter><MyProjectsPage /></MemoryRouter>
      </QueryClientProvider>,
    );

    expect(await screen.findByText('You have not created any projects yet')).toBeInTheDocument();
    expect(screen.getAllByRole('button', { name: 'Create project' }).at(-1)).toBeInTheDocument();
    fireEvent.click(screen.getByRole('tab', { name: 'Joined' }));
    expect(await screen.findByText('You have not joined any projects yet')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Browse projects' })).toHaveAttribute('href', '/projects');
  });
});
