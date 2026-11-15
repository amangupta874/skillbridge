import { useQuery } from '@tanstack/react-query';
import { getLookups } from '../api/lookups.js';
import { getSkills } from '../api/skills.js';
import ErrorBanner from './ErrorBanner.jsx';

const selectClass = 'w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-800 focus-visible:outline-2 focus-visible:outline-indigo-600';

export default function ProjectFilters({ filters, onChange, onClear }) {
  const { data: lookups, error: lookupsError, refetch: retryLookups } = useQuery({
    queryKey: ['lookups'],
    queryFn: getLookups,
  });
  const { data: skills, error: skillsError, refetch: retrySkills } = useQuery({
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
        <label className="text-sm font-medium text-slate-700">
          Search projects
          <input
            aria-label="Search projects"
            type="search"
            value={filters.query || ''}
            onChange={(event) => setFilter('query', event.target.value)}
            placeholder="Title or description"
            className={`${selectClass} mt-1`}
          />
        </label>
        <label className="text-sm font-medium text-slate-700">
          Required skills
          <select aria-label="Required skills" multiple value={selectedSkillIds} onChange={handleSkillsChange} className={`${selectClass} mt-1 min-h-20`}>
            {(skills || []).map((skill) => <option key={skill.id} value={skill.id}>{skill.name}</option>)}
          </select>
          <span className="mt-1 block text-xs font-normal text-slate-500">Choose one or more skills.</span>
        </label>
        <label className="text-sm font-medium text-slate-700">
          Category
          <select aria-label="Category" value={filters.categoryId || ''} onChange={(event) => setFilter('categoryId', event.target.value)} className={`${selectClass} mt-1`}>
            <option value="">All categories</option>
            {(lookups?.projectCategories || []).map((category) => <option key={category.id} value={category.id}>{category.name}</option>)}
          </select>
        </label>
        <label className="text-sm font-medium text-slate-700">
          Difficulty
          <select aria-label="Difficulty" value={filters.difficulty || ''} onChange={(event) => setFilter('difficulty', event.target.value)} className={`${selectClass} mt-1`}>
            <option value="">Any difficulty</option>
            {['BEGINNER', 'INTERMEDIATE', 'ADVANCED'].map((level) => <option key={level} value={level}>{level}</option>)}
          </select>
        </label>
        <label className="text-sm font-medium text-slate-700">
          Sort by
          <select aria-label="Sort by" value={filters.sort || 'newest'} onChange={(event) => setFilter('sort', event.target.value)} className={`${selectClass} mt-1`}>
            <option value="newest">Newest</option>
            <option value="oldest">Oldest</option>
            <option value="seats">Fewest seats left</option>
          </select>
        </label>
        <label className="flex items-center gap-2 self-end pb-2 text-sm font-medium text-slate-700">
          <input
            aria-label="Only projects with open seats"
            type="checkbox"
            checked={filters.hasOpenSeats === 'true'}
            onChange={(event) => setFilter('hasOpenSeats', event.target.checked ? 'true' : '')}
            className="h-4 w-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-600"
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
