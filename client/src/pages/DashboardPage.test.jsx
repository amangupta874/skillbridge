import { beforeEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen, within } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter } from 'react-router-dom';
import { getMyApplications } from '../api/applications.js';
import { getExchanges } from '../api/exchanges.js';
import { getNotifications } from '../api/notifications.js';
import { getProjects } from '../api/projects.js';
import { getUserById } from '../api/users.js';
import DashboardPage from './DashboardPage.jsx';

vi.mock('../api/applications.js');
vi.mock('../api/exchanges.js');
vi.mock('../api/notifications.js');
vi.mock('../api/projects.js');
vi.mock('../api/users.js');
vi.mock('../context/AuthContext.jsx', () => ({
  useAuth: () => ({ user: { id: 'student', fullName: 'Alice Student' } }),
}));

const emptyList = { items: [] };
const profile = { skills: [{ skill: { id: 1 } }, { skill: { id: 2 } }] };

function renderDashboard() {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  render(
    <QueryClientProvider client={client}>
      <MemoryRouter><DashboardPage /></MemoryRouter>
    </QueryClientProvider>,
  );
}

function section(name) {
  return within(screen.getByRole('region', { name }));
}

describe('Dashboard', () => {
  beforeEach(() => {
    vi.resetAllMocks();
    getUserById.mockResolvedValue(profile);
    getProjects.mockResolvedValue(emptyList);
    getMyApplications.mockResolvedValue(emptyList);
    getExchanges.mockResolvedValue(emptyList);
    getNotifications.mockResolvedValue(emptyList);
  });

  it('greets the student and keeps recent notifications', async () => {
    renderDashboard();

    expect(screen.getByRole('heading', { name: 'Welcome back, Alice Student!' })).toBeInTheDocument();
    expect(await section('Recent notifications').findByText('You have no notifications yet')).toBeInTheDocument();
  });

  it.each([
    ['Recommended projects', 'No open projects match your skills yet', '/projects', 'Browse projects'],
    ['My applications', 'You have no pending applications', '/applications', 'View all'],
    ['Incoming exchange requests', 'You have no pending incoming exchange requests', '/exchanges', 'View all'],
    ['My projects', 'You have not created any projects yet', '/my-projects', 'View my projects'],
  ])('shows the empty state for %s', async (title, message, href, link) => {
    renderDashboard();

    expect(await section(title).findByText(message)).toBeInTheDocument();
    expect(section(title).getByRole('link', { name: link })).toHaveAttribute('href', href);
  });

  it.each([
    ['Recommended projects', getProjects, 'No open projects match your skills yet'],
    ['My applications', getMyApplications, 'You have no pending applications'],
    ['Incoming exchange requests', getExchanges, 'You have no pending incoming exchange requests'],
    ['My projects', getProjects, 'You have not created any projects yet'],
  ])('can retry a failed request for %s', async (title, request, emptyTitle) => {
    if (request === getProjects) {
      getProjects.mockImplementation((filters) => {
        if ((title === 'My projects') === Boolean(filters.mine)) {
          return Promise.reject(new Error('Could not load this card'));
        }
        return Promise.resolve(emptyList);
      });
    } else {
      request.mockRejectedValueOnce(new Error('Could not load this card'));
    }

    renderDashboard();

    expect(await section(title).findByRole('alert')).toHaveTextContent('Could not load this card');
    expect(await section('Recent notifications').findByText('You have no notifications yet')).toBeInTheDocument();
    request.mockResolvedValue(emptyList);
    fireEvent.click(section(title).getByRole('button', { name: 'Retry' }));
    expect(await section(title).findByText(emptyTitle)).toBeInTheDocument();
  });

  it('can retry the profile request before loading recommendations', async () => {
    getUserById.mockRejectedValueOnce(new Error('Could not load your profile'));
    renderDashboard();

    const recommendations = section('Recommended projects');
    expect(await recommendations.findByRole('alert')).toHaveTextContent('Could not load your profile');
    expect(getProjects).not.toHaveBeenCalledWith({ skillIds: '1,2', hasOpenSeats: true, limit: 3 });
    fireEvent.click(recommendations.getByRole('button', { name: 'Retry' }));
    expect(await recommendations.findByText('No open projects match your skills yet')).toBeInTheDocument();
  });

  it('links to Edit profile and skips recommendations when the student has no skills', async () => {
    getUserById.mockResolvedValue({ skills: [] });
    renderDashboard();

    const recommendations = section('Recommended projects');
    expect(await recommendations.findByText('Add skills to your profile to see projects that fit you')).toBeInTheDocument();
    expect(recommendations.getByRole('link', { name: 'Edit profile' })).toHaveAttribute('href', '/profile/edit');
    expect(getProjects.mock.calls).toEqual([[{ mine: 'owned', limit: 3 }]]);
  });

  it('loads all four cards with their own filters', async () => {
    renderDashboard();

    await section('Recommended projects').findByText('No open projects match your skills yet');
    expect(getUserById).toHaveBeenCalledWith('student');
    expect(getProjects).toHaveBeenCalledWith({ skillIds: '1,2', hasOpenSeats: true, limit: 3 });
    expect(getProjects).toHaveBeenCalledWith({ mine: 'owned', limit: 3 });
    expect(getMyApplications).toHaveBeenCalledWith({ status: 'PENDING', limit: 3 });
    expect(getExchanges).toHaveBeenCalledWith({ box: 'incoming', status: 'PENDING', limit: 3 });
  });
});
