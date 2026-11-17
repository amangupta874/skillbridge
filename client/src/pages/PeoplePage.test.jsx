import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import PeoplePage from './PeoplePage.jsx';
import * as UsersApi from '../api/users.js';
import * as SkillsApi from '../api/skills.js';

vi.mock('../api/users.js', () => ({ getUsers: vi.fn() }));
vi.mock('../api/skills.js', () => ({ getSkills: vi.fn() }));

describe('PeoplePage', () => {
  it('shows the empty state when no people match', async () => {
    vi.mocked(UsersApi.getUsers).mockResolvedValue({ items: [], meta: { page: 1, limit: 12, total: 0, totalPages: 0 } });
    vi.mocked(SkillsApi.getSkills).mockResolvedValue([]);
    const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });

    render(<QueryClientProvider client={queryClient}><PeoplePage /></QueryClientProvider>);

    expect(await screen.findByText('No people found')).toBeInTheDocument();
    expect(screen.getByText('Try another name or skill.')).toBeInTheDocument();
  });
});
