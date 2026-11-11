import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import SkillPicker from './SkillPicker.jsx';
import * as SkillsApi from '../api/skills.js';

vi.mock('../api/skills.js', () => ({
  getSkills: vi.fn(),
}));

const mockSkills = [
  { id: 1, name: 'React', category: { id: 1, name: 'Frontend' } },
  { id: 2, name: 'Node.js', category: { id: 2, name: 'Backend' } },
  { id: 3, name: 'Docker', category: { id: 3, name: 'DevOps' } },
];

describe('SkillPicker Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.spyOn(SkillsApi, 'getSkills').mockResolvedValue(mockSkills);
  });

  it('renders input and shows suggestions on typing', async () => {
    render(<SkillPicker value={[]} onChange={vi.fn()} />);

    const input = screen.getByPlaceholderText(/type to search skills/i);
    fireEvent.change(input, { target: { value: 'Re' } });

    await waitFor(() => {
      expect(SkillsApi.getSkills).toHaveBeenCalledWith({ query: 'Re', limit: 10 });
      expect(screen.getByText('React')).toBeInTheDocument();
      expect(screen.getByText('Node.js')).toBeInTheDocument();
    });
  });

  it('adds skill with level when withLevel is true', async () => {
    const handleChange = vi.fn();
    render(<SkillPicker value={[]} onChange={handleChange} withLevel={true} />);

    const input = screen.getByPlaceholderText(/type to search skills/i);
    fireEvent.change(input, { target: { value: 'React' } });

    await waitFor(() => {
      expect(screen.getByText('React')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText('React'));

    expect(handleChange).toHaveBeenCalledWith([
      {
        skill: { id: 1, name: 'React', category: { id: 1, name: 'Frontend' } },
        level: 'INTERMEDIATE',
      },
    ]);
  });

  it('adds skill without level when withLevel is false', async () => {
    const handleChange = vi.fn();
    render(<SkillPicker value={[]} onChange={handleChange} withLevel={false} />);

    const input = screen.getByPlaceholderText(/type to search skills/i);
    fireEvent.change(input, { target: { value: 'Docker' } });

    await waitFor(() => {
      expect(screen.getByText('Docker')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText('Docker'));

    expect(handleChange).toHaveBeenCalledWith([
      { id: 3, name: 'Docker', category: { id: 3, name: 'DevOps' } },
    ]);
  });

  it('disables skills that are in excludedSkillIds', async () => {
    render(
      <SkillPicker
        value={[]}
        onChange={vi.fn()}
        excludedSkillIds={[1]} // React is excluded
      />,
    );

    const input = screen.getByPlaceholderText(/type to search skills/i);
    fireEvent.change(input, { target: { value: 'React' } });

    await waitFor(() => {
      expect(screen.getByText('Unavailable')).toBeInTheDocument();
    });

    const reactBtn = screen.getByText('React').closest('button');
    expect(reactBtn).toBeDisabled();
  });

  it('allows removing an existing skill', () => {
    const handleChange = vi.fn();
    const existing = [
      { id: 1, name: 'React' },
      { id: 2, name: 'Node.js' },
    ];

    render(<SkillPicker value={existing} onChange={handleChange} withLevel={false} />);

    const removeBtn = screen.getByLabelText('Remove React');
    fireEvent.click(removeBtn);

    expect(handleChange).toHaveBeenCalledWith([{ id: 2, name: 'Node.js' }]);
  });
});

