import { useId } from 'react';
import { useQuery } from '@tanstack/react-query';
import { getLookups } from '../api/lookups.js';
import { getSkills } from '../api/skills.js';
import ErrorBanner from './ErrorBanner.jsx';

const selectClass = 'w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-800 focus-visible:outline-2 focus-visible:outline-indigo-600';

export default function ProjectFilters({ filters, onChange, onClear }) {
  const id = useId();
  const { data: lookups, isLoading: lookupsLoading, error: lookupsError, refetch: retryLookups } = useQuery({
    queryKey: ['lookups'],
    queryFn: getLookups,
  });
  const { data: skills, isLoading: skillsLoading, error: skillsError, refetch: retrySkills } = useQuery({
    queryKey: ['skills', ''],
    queryFn: () => getSkills({ limit: 100 }),
  });
  const selectedSkillIds = (filters.skillIds || '').split(',').filter(Boolean);

  function setFilter(name, value) {
    onChange({ ...filters, [name]: value, page: 1 });
  }

  function handleSkillsChange(event) {
    const skillIds = Array.from(event.target.selectedOptions, (option) => option.value);
    onChange({ ...filters, skillIds: skillIds.join(','), page: 1 });
  }

  return (
    <section aria-label="Project filters" className="space-y-3 rounded-xl border border-slate-200 bg-white p-4 shadow-xs">
      {lookupsError && <ErrorBanner error={lookupsError} onRetry={() => retryLookups()} />}
      {skillsError && <ErrorBanner error={skillsError} onRetry={() => retrySkills()} />}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
        <label htmlFor={`${id}-search`} className="text-sm font-medium text-slate-700">
          Search projects
          <input
            id={`${id}-search`}
            type="search"
            value={filters.query || ''}
            onChange={(event) => setFilter('query', event.target.value)}
            placeholder="Title or description"
            className={`${selectClass} mt-1`}
          />
        </label>
        <label htmlFor={`${id}-skills`} className="text-sm font-medium text-slate-700">
          Required skills
          <select id={`${id}-skills`} aria-describedby={`${id}-skills-hint`} multiple disabled={!skills?.length} value={selectedSkillIds} onChange={handleSkillsChange} className={`${selectClass} mt-1 min-h-20`}>
            {(skills || []).map((skill) => <option key={skill.id} value={skill.id}>{skill.name}</option>)}
          </select>
          <span id={`${id}-skills-hint`} className="mt-1 block text-xs font-normal text-slate-700">{skillsLoading ? 'Loading skills…' : skills?.length ? 'Choose one or more skills.' : 'No skills available.'}</span>
        </label>
        <label htmlFor={`${id}-category`} className="text-sm font-medium text-slate-700">
          Category
          <select id={`${id}-category`} disabled={!lookups?.projectCategories?.length} value={filters.categoryId || ''} onChange={(event) => setFilter('categoryId', event.target.value)} className={`${selectClass} mt-1`}>
            <option value="">{lookupsLoading ? 'Loading categories…' : lookups?.projectCategories?.length ? 'All categories' : 'No categories available'}</option>
            {(lookups?.projectCategories || []).map((category) => <option key={category.id} value={category.id}>{category.name}</option>)}
          </select>
        </label>
        <label htmlFor={`${id}-difficulty`} className="text-sm font-medium text-slate-700">
          Difficulty
          <select id={`${id}-difficulty`} value={filters.difficulty || ''} onChange={(event) => setFilter('difficulty', event.target.value)} className={`${selectClass} mt-1`}>
            <option value="">Any difficulty</option>
            {['BEGINNER', 'INTERMEDIATE', 'ADVANCED'].map((level) => <option key={level} value={level}>{level}</option>)}
          </select>
        </label>
        <label htmlFor={`${id}-sort`} className="text-sm font-medium text-slate-700">
          Sort by
          <select id={`${id}-sort`} value={filters.sort || 'newest'} onChange={(event) => setFilter('sort', event.target.value)} className={`${selectClass} mt-1`}>
            <option value="newest">Newest</option>
            <option value="oldest">Oldest</option>
            <option value="seats">Fewest seats left</option>
          </select>
        </label>
        <label htmlFor={`${id}-open`} className="flex items-center gap-2 self-end pb-2 text-sm font-medium text-slate-700">
          <input
            id={`${id}-open`}
            type="checkbox"
            checked={filters.hasOpenSeats === 'true'}
            onChange={(event) => setFilter('hasOpenSeats', event.target.checked ? 'true' : '')}
            className="h-4 w-4 rounded border-slate-300 text-indigo-700 focus:ring-indigo-600"
          />
          Only projects with open seats
        </label>
      </div>
      <div className="flex justify-end">
        <button type="button" onClick={onClear} className="rounded-sm text-sm font-medium text-indigo-700 underline hover:text-indigo-900 focus-visible:outline-2 focus-visible:outline-indigo-600">
          Clear filters
        </button>
      </div>
    </section>
  );
}
